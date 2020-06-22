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

const MIDPOINT_MOVEMENT_THRESHOLD = 2.0; /* in degrees */
// The temporary ending and midpoint vectors
const midVector = new Vector3();
const tempMidVector = new Vector3();
const tmpVector = new Vector3();
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

  constructor(scene: Two.Group, transformMatrix: Matrix4) {
    // The current scene and matrix that transforms the ideal unit sphere to the current (un-zoomed) view
    super(scene, transformMatrix);
    // Create the temporary plottable segment
    this.tempSegment = new Segment();
  }
  mousePressed(event: MouseEvent): void {
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
    this.tempSegment.startPoint = this.currentSpherePoint;
  }

  mouseMoved(event: MouseEvent): void {
    super.mouseMoved(event);
    if (this.isOnSphere) {
      if (this.dragging) {
        if (!this.isSegmentAdded) {
          this.isSegmentAdded = true;
          this.canvas.add(this.tempSegment);
          this.canvas.add(midMarker);
        }

        // Update the midpoint (per Will's PNG screenshot on Jun 16)
        tempMidVector
          .addVectors(this.startVector, this.currentSpherePoint)
          .multiplyScalar(0.5)
          .normalize();
        const moveAngle = tempMidVector.angleTo(midVector);
        if (moveAngle.toDegrees() < MIDPOINT_MOVEMENT_THRESHOLD) {
          // For small movement, update the midpoint directly
          midVector.copy(tempMidVector);
        } else {
          // For target movement, update the midpoint along the tangent curve
          tmpVector.crossVectors(midVector, tempMidVector).normalize(); // F
          tmpVector.cross(midVector).normalize(); // G
          midVector.multiplyScalar(Math.cos(moveAngle));
          midVector.addScaledVector(tmpVector, Math.sin(moveAngle)).normalize();
        }
        // Switch the midpoint to its antipodal when the Control key is pressed
        if (event.ctrlKey) midVector.multiplyScalar(-1);

        this.tempSegment.midPoint = midVector;
        this.tempSegment.endPoint = this.currentSpherePoint;
        midMarker.translation
          .set(midVector.x, midVector.y)
          .multiplyScalar(globalSettings.boundaryCircle.radius);
      }
    } else if (this.isSegmentAdded) {
      this.tempSegment.remove();
      this.startMarker.remove();
      midMarker.remove();
      this.isSegmentAdded = false;
    }
  }

  mouseLeave(event: MouseEvent): void {
    throw new Error("Method not implemented.");
  }

  mouseReleased(event: MouseEvent): void {
    this.dragging = false;
    if (this.isOnSphere) {
      this.tempSegment.remove();
      this.startMarker.remove();
      midMarker.remove();
      this.isSegmentAdded = false;
      const newSegment = this.tempSegment.clone();
      const segmentGroup = new CommandGroup();
      if (this.startPoint === null) {
        const vtx = new SEPoint(new Point());
        vtx.positionOnSphere = this.startVector;
        this.startPoint = vtx;
        segmentGroup.addCommand(new AddPointCommand(vtx));
      }
      if (this.hitPoints.length > 0) {
        this.endPoint = this.hitPoints[0];
      } else {
        const vtx = new SEPoint(new Point());
        vtx.positionOnSphere = this.currentSpherePoint;
        this.endPoint = vtx;
        segmentGroup.addCommand(new AddPointCommand(vtx));
      }
      segmentGroup
        .addCommand(
          new AddSegmentCommand({
            line: new SESegment(newSegment),
            startPoint: this.startPoint,
            endPoint: this.endPoint
          })
        )
        .execute();
    }
  }
}
