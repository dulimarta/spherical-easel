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
  // private marker = new Point(5, 0xff0000);
  // private majorAxisDir = new Vector3();
  // The starting point of the segment
  protected startVector = new Vector3();
  protected isSegmentAdded = false;
  private startPoint: SEPoint | null = null;
  private endPoint: SEPoint | null = null;
  //A variable to see if the user is dragging.
  protected dragging = false;
  protected tempSegment: Segment;
  protected arcDir = NaN;

  constructor(layers: Two.Group[], transformMatrix: Matrix4) {
    super(layers, transformMatrix);
    this.tempSegment = new Segment();
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
    super.mouseLeave(event);
    this.dragging = false;
    if (this.isSegmentAdded) {
      this.tempSegment.remove();
      this.startMarker.remove();
      midMarker.remove();
      this.isSegmentAdded = false;
    }
  }

  mousePressed(event: MouseEvent): void {
    this.dragging = true;
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
    midVector.copy(this.currentSpherePoint);
    this.tempSegment.startPoint = this.currentSpherePoint;
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
            line: new SESegment(newSegment, this.startPoint, this.endPoint),
            startPoint: this.startPoint,
            endPoint: this.endPoint
          })
        )
        .execute();
    }
  }
}
