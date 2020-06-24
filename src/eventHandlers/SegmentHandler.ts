/** @format */

import Two from "two.js";
import { Matrix4, Vector3 } from "three";
import SelectionHandler from "./SelectionHandler";
import { SEPoint } from "@/models/SEPoint";
import Segment from "@/plottables/Segment";
import Point from "@/plottables/Point";
import globalSettings from "@/global-settings";
import { CommandGroup } from "@/commands/CommandGroup";
import { AddPointCommand } from "@/commands/AddPointCommand";
import { AddSegmentCommand } from "@/commands/AddSegmentCommand";
import { SESegment } from "@/models/SESegment";
import SETTINGS from "@/global-settings";

const MIDPOINT_MOVEMENT_THRESHOLD = 2.0; /* in degrees */
/** The temporary ending and midpoint vectors */
const midVector = new Vector3();
const tempMidVector = new Vector3();
const tmpVector = new Vector3();

//For debugging the tool
const midMarker = new Two.Circle(0, 0, 5);
midMarker.fill = "navy";

export default class SegmentHandler extends SelectionHandler {
  /**
   * The starting vector location of the segment
   */
  protected startVector = new Vector3();

  /**
   * This indicates if the temporary segment has been added to the scene and made permanent
   */
  protected isSegmentAdded = false;
  /**
   * The (model) start and end points of the line segment
   */
  private startPoint: SEPoint | null = null;
  private endPoint: SEPoint | null = null;
  /**
   * Indicates if the user is dragging
   */
  protected dragging = false;
  /**
   * A temporary segment to display while the user is creating a segment
   */
  protected tempSegment: Segment;
  /**
   * I don't know that this variable does.... TODO
   */
  protected arcDir = NaN;

  constructor(layers: Two.Group[], transformMatrix: Matrix4) {
    super(layers, transformMatrix);
    this.tempSegment = new Segment();
    this.tempSegment.stylize("temporary");
  }
  mousePressed(event: MouseEvent): void {
    console.log("mouse press in segment handler");
    // The user is dragging
    this.dragging = true;
    // The Selection Handler forms a list of all the nearby points
    // If there are nearby points, select the first one to be the start of the segment otherwise
    //  put a startmarker (found in SelectionHandler) in the scene
    if (this.hitPoints.length > 0) {
      const selected = this.hitPoints[0];
      this.startVector.copy(selected.positionOnSphere);
      this.startPoint = selected;
    } else {
      this.canvas.add(this.startMarker);
      this.startMarker.translation.copy(this.currentScreenPoint);
      this.startVector.copy(this.currentSpherePoint);
      this.startPoint = null;
    }
    // Initially the midpoint is the start point
    midVector.copy(this.currentSpherePoint);

    // The start point (shouldn't this be start vector?) of the temporary segment is also the the current location on the sphere
    this.tempSegment.startVector = this.currentSpherePoint;
  }

  mouseMoved(event: MouseEvent): void {
    // Highlights the objects near the mouse event
    super.mouseMoved(event);

    // If the mouse event is on the sphere and the user is dragging.
    if (this.isOnSphere) {
      if (this.dragging) {
        // This is executed once per segment to be added
        if (!this.isSegmentAdded) {
          this.isSegmentAdded = true;
          // Add the temporary segment to the midground
          this.canvas.add(this.tempSegment);
          // Debugging only -- add the mid marker
          this.canvas.add(midMarker);
        }

        // The idea is that a midpoint and two endpoints determine a unique segment
        // When the endpoints are nearly antipodal, small changes in one point, lead to large
        // changes in the segment (and the location of the midpoint), so in the nearly antipodal
        // case force the midpoint only to move by a bounded amount (MIDPOINT_MOVEMENT_THRESHOLD)
        //
        // Update the midpoint (per Will's PNG screenshot on Jun 16) temporarily as
        // tempVector = normalize( (start vector plus current vector)/2 )
        tempMidVector
          .addVectors(this.startVector, this.currentSpherePoint)
          .multiplyScalar(0.5)
          .normalize();
        // moveAngle is angular change in the midpoint (from oldMidpoint to tempMidpoint)
        const moveAngle = tempMidVector.angleTo(midVector);
        if (moveAngle.toDegrees() < MIDPOINT_MOVEMENT_THRESHOLD) {
          // For small movement, update the midpoint directly
          midVector.copy(tempMidVector);
        } else {
          // For target movement, update the midpoint along the tangent curve
          // N = normalize(oldMidVecxtor X tempMidVector)
          tmpVector.crossVectors(midVector, tempMidVector).normalize();
          // tempVector =  normalize(N x oldMid) (notice that tempVector, N, oldMid are a unit orthonormal frame)
          tmpVector.cross(midVector).normalize();
          // Now rotate in the oldMid, tempVector plane by the moveAngle (strangely this
          // works better than angle = MIDPOINT_MOVEMENT_THRESHOLD )
          // That is newMid = cos(angle)oldMid + sin(angle) tempVector
          midVector.multiplyScalar(Math.cos(moveAngle));
          midVector.addScaledVector(tmpVector, Math.sin(moveAngle)).normalize();
        }
        // Switch the midpoint to its antipodal when the Control key is pressed
        if (event.ctrlKey) midVector.multiplyScalar(-1);
        // Update the midpoint and endpoint of the temporary segment
        this.tempSegment.midVector = midVector;
        this.tempSegment.endPoint = this.currentSpherePoint;
        // Debugging midpoint only
        midMarker.translation
          .set(midVector.x, midVector.y)
          .multiplyScalar(globalSettings.boundaryCircle.radius);
      }
    } else if (this.isSegmentAdded) {
      //if not on the sphere and the temporary segment has been added remove the temporary objects
      this.tempSegment.remove();
      this.startMarker.remove();
      midMarker.remove();
      this.isSegmentAdded = false;
    }
  }

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    this.dragging = false;
    if (this.isSegmentAdded) {
      this.tempSegment.remove();
      this.startMarker.remove();
      midMarker.remove();
      this.isSegmentAdded = false;
    }
  }

  mouseReleased(event: MouseEvent): void {
    this.dragging = false;
    if (this.isOnSphere) {
      //If the release event was on the sphere remove the temporary objects
      this.tempSegment.remove();
      this.startMarker.remove();
      midMarker.remove();
      // Before making a new segment make sure that the user has dragged a non-trivial distance
      // If the user hasn't dragged far enough merely insert a point at the start location

      if (this.tempSegment.arcLength > SETTINGS.segment.minimumArcLength) {
        // Clone the temporary segment and mark it added to the scene
        this.isSegmentAdded = false;
        const newSegment = this.tempSegment.clone();
        // Stylize the new segment
        newSegment.stylize("default");
        // Stylize the glowing segment
        newSegment.stylize("glowing");

        // Create a new command group to store potentially three commands. Those to add the endpoints (which might be  new) and the segment itself.
        const segmentGroup = new CommandGroup();
        if (this.startPoint === null) {
          // The start point is a new point and must be created and added to the command/store
          const vtx = new SEPoint(new Point());
          vtx.positionOnSphere = this.startVector;
          this.startPoint = vtx;
          segmentGroup.addCommand(new AddPointCommand(vtx));
        }
        if (this.hitPoints.length > 0) {
          // The end point is an existing point
          this.endPoint = this.hitPoints[0];
        } else {
          // The endpoint is a new point and must be created and added to the command/store
          const vtx = new SEPoint(new Point());
          vtx.positionOnSphere = this.currentSpherePoint;
          this.endPoint = vtx;
          segmentGroup.addCommand(new AddPointCommand(vtx));
        }
        segmentGroup
          .addCommand(
            new AddSegmentCommand({
              line: new SESegment(newSegment, this.startPoint, this.endPoint),
              startPoint: this.startPoint,
              endPoint: this.endPoint
            })
          )
          .execute();
      } else {
        // The user is attempting to make a segment smaller than the minimum arc length so
        // create  a point at the location of the start vector
        if (this.startPoint === null) {
          // Starting point landed on an open space
          // we have to create a new point and it to the group/store
          const vtx = new SEPoint(new Point());
          vtx.positionOnSphere = this.startVector;
          this.startPoint = vtx;
          const addPoint = new AddPointCommand(vtx);
          addPoint.execute();
        }
      }
      // Clear old points to get ready for creating the next segment.
      this.startPoint = null;
      this.endPoint = null;
    }
  }
}
