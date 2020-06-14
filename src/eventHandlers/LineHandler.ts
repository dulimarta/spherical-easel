/** @format */

import { Vector3, Matrix4 } from "three";
import SelectionHandler from "./SelectionHandler";
import Arrow from "@/3d-objs/Arrow"; // for debugging
import Point from "@/plottables/Point";
import Line from "@/plottables/Line";

// import SETTINGS from "@/global-settings";
import { CommandGroup } from "@/commands/CommandGroup";
import { AddPointCommand } from "@/commands/AddPointCommand";
import { AddLineCommand } from "@/commands/AddLineCommand";
import Two from "two.js";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import EventBus from "./EventBus";
// const frontPointRadius = SETTINGS.point.temp.radius.front;

export default class LineHandler extends SelectionHandler {
  protected startV3Point: Vector3; // The starting point of the line
  protected tmpVector: Vector3;
  protected circleOrientation: Arrow; // for debugging only
  protected isMouseDown: boolean;
  protected isCircleAdded: boolean;
  private startPoint: SEPoint | null = null;
  private endPoint: SEPoint | null = null;
  protected line: Line;

  constructor(scene: Two.Group, transformMatrix: Matrix4, isSegment?: boolean) {
    super(scene, transformMatrix);
    this.startV3Point = new Vector3();
    this.tmpVector = new Vector3();
    this.line = new Line(undefined, undefined, isSegment);

    this.circleOrientation = new Arrow(0.5, 0x006600); // debug only
    this.isMouseDown = false;
    this.isCircleAdded = false;
  }

  activate = (): void => {
    // The following line automatically calls Line setter function by default
    this.line.isSegment = false;
  };

  deactivate(): void {
    /* empty function */
  }

  mouseMoved(event: MouseEvent): void {
    super.mouseMoved(event);
    if (this.isOnSphere) {
      if (this.isMouseDown) {
        if (!this.isCircleAdded) {
          // Do we need to show the preview circle?
          this.isCircleAdded = true;
          this.canvas.add(this.line);
          // this.circleOrientation.addTo(this.canvas); // for debugging only
        }
        // The following line automatically calls Line setter function
        this.tmpVector
          .crossVectors(this.startV3Point, this.currentSpherePoint)
          .normalize();
        console.debug(`LH: circle orientation: ${this.tmpVector.toFixed(2)}`);
        this.circleOrientation.sphereLocation = this.tmpVector; // for debugging
        this.line.endPoint = this.currentSpherePoint;
      }
    } else if (this.isCircleAdded) {
      this.line.remove();
      this.startMarker.remove();
      this.circleOrientation.remove(); // for debugging
      this.isCircleAdded = false;
    }
  }

  //eslint-disable-next-line
  mousePressed(event: MouseEvent): void {
    this.isMouseDown = true;
    this.startPoint = null;
    if (this.isOnSphere) {
      const selected = this.hitPoint;

      // Record the first point of the geodesic circle
      if (selected instanceof SEPoint) {
        console.debug("Pressed on an existing point");
        /* the point coordinate is local on the sphere */
        this.startV3Point.copy(selected.positionOnSphere);
        this.startPoint = selected;
      } else {
        console.debug("Pressed on open area");
        /* this.currentPoint is already converted to local sphere coordinate frame */
        this.canvas.add(this.startMarker);
        this.startMarker.translation.copy(this.currentScreenPoint);
        this.startV3Point.copy(this.currentSpherePoint);
        this.startPoint = null;
      }
      // The following line automatically calls Line setter function
      this.line.startPoint = this.currentSpherePoint;
    }
  }

  //eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {
    this.isMouseDown = false;
    if (this.isOnSphere) {
      // Record the second point of the geodesic circle
      this.line.remove();
      this.startMarker.remove();
      this.circleOrientation.remove(); // for debugging
      this.isCircleAdded = false;
      this.tmpVector
        .crossVectors(this.startV3Point, this.currentSpherePoint)
        .normalize();
      this.line.endPoint = this.currentSpherePoint;
      // this.endV3Point.copy(this.currentPoint);
      const newLine = this.line.clone(); // true:recursive clone
      const lineGroup = new CommandGroup();
      EventBus.fire("insert-line", {
        normalDirection: this.tmpVector,
        start: this.startPoint || this.startV3Point,
        end: this.hitPoint || this.currentScreenPoint
      });
      if (this.startPoint === null) {
        // Starting point landed on an open space
        // we have to create a new point
        const vtx = new SEPoint(new Point());
        vtx.positionOnSphere = this.startV3Point;
        this.startPoint = vtx;
        lineGroup.addCommand(new AddPointCommand(vtx));
      }
      if (this.hitPoint instanceof SEPoint) {
        this.endPoint = this.hitPoint;
      } else {
        // endV3Point landed on an open space
        // we have to create a new point
        const vtx = new SEPoint(new Point());
        vtx.positionOnSphere = this.currentSpherePoint;
        this.endPoint = vtx;
        lineGroup.addCommand(new AddPointCommand(vtx));
      }

      lineGroup
        .addCommand(
          new AddLineCommand({
            line: new SELine(
              newLine,
              newLine.normalDirection,
              this.startPoint,
              this.endPoint
            ),
            startPoint: this.startPoint,
            endPoint: this.endPoint
          })
        )
        .execute();
      this.startPoint = null;
      this.endPoint = null;
    }
  }

  // eslint-disable-next-line
  mouseLeave(event: MouseEvent): void {
    /* empty function */
  }
}
