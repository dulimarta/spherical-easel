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
// const frontPointRadius = SETTINGS.point.temp.radius.front;

export default class LineHandler extends SelectionHandler {
  protected startPosition = new Vector3(); // The starting point of the line
  protected currentMidPosition = new Vector3();
  protected nextMidPosition = new Vector3();
  protected tmpVector = new Vector3();
  protected circleOrientation: Arrow; // for debugging only
  protected isMouseDown: boolean;
  protected isCircleAdded: boolean;
  private startPoint: SEPoint | null = null;
  private endPoint: SEPoint | null = null;
  private tempLine: Line;
  constructor(scene: Two.Group, transformMatrix: Matrix4) {
    super(scene, transformMatrix);
    this.tempLine = new Line();
    this.tempLine.stylize("temporary");

    this.circleOrientation = new Arrow(0.5, 0x006600); // debug only
    this.isMouseDown = false;
    this.isCircleAdded = false;
  }

  mouseMoved(event: MouseEvent): void {
    super.mouseMoved(event);
    if (this.isOnSphere) {
      if (this.isMouseDown) {
        if (!this.isCircleAdded) {
          // Do we need to show the preview circle?
          this.isCircleAdded = true;
          this.canvas.add(this.tempLine);
          // this.line.startPoint = this.startPosition;

          // this.circleOrientation.addTo(this.canvas); // for debugging only
        }
        // The following line automatically calls Line setter function
        this.circleOrientation.sphereLocation = this.tmpVector; // for debugging

        this.tmpVector
          .crossVectors(this.startPosition, this.currentSpherePoint)
          .normalize();
        this.tempLine.normalVector = this.tmpVector;
      }
    } else if (this.isCircleAdded) {
      this.tempLine.remove();
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
      // Record the first point of the geodesic circle
      if (this.hitPoints.length > 0) {
        // FIXME: use keyboard input to select an item
        const selected = this.hitPoints[0];
        console.debug("Pressed on an existing point");
        /* the point coordinate is local on the sphere */
        this.startPosition.copy(selected.positionOnSphere);
        this.startPoint = selected;
      } else {
        console.debug("Pressed on open area");
        /* this.currentPoint is already converted to local sphere coordinate frame */
        this.canvas.add(this.startMarker);
        this.startMarker.translation.copy(this.currentScreenPoint);
        this.startPosition.copy(this.currentSpherePoint);
        this.startPoint = null;
      }
      // The following line automatically calls Line setter function
    }
  }

  //eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {
    this.isMouseDown = false;
    if (this.isOnSphere) {
      // Record the second point of the geodesic circle
      this.tempLine.remove();
      this.startMarker.remove();
      this.circleOrientation.remove(); // for debugging
      this.isCircleAdded = false;
      this.tmpVector
        .crossVectors(this.startPosition, this.currentSpherePoint)
        .normalize();
      // this.line.endPoint = this.currentSpherePoint;
      // this.endV3Point.copy(this.currentPoint);
      const newLine = this.tempLine.clone(); // true:recursive clone
      // Stylize the new Line
      newLine.stylize("default");
      // Stylize the glowing Line
      newLine.stylize("glowing");

      const lineGroup = new CommandGroup();
      if (this.startPoint === null) {
        // Starting point landed on an open space
        // we have to create a new point
        const vtx = new SEPoint(new Point());
        vtx.positionOnSphere = this.startPosition;
        this.startPoint = vtx;
        lineGroup.addCommand(new AddPointCommand(vtx));
      }
      if (this.hitPoints.length > 0) {
        this.endPoint = this.hitPoints[0];
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
            line: new SELine(newLine),
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
