/** @format */

import { Vector3, Matrix4 } from "three";
import SelectionHandler from "./SelectionHandler";
import Point from "@/plottables/Point";
import Circle from "@/plottables/Circle";
import { CommandGroup } from "@/commands/CommandGroup";
import { AddPointCommand } from "@/commands/AddPointCommand";
import { AddCircleCommand } from "@/commands/AddCircleCommand";
import Two from "two.js";
import { SEPoint } from "@/models/SEPoint";
import { SECircle } from "@/models/SECircle";

export default class CircleHandler extends SelectionHandler {
  private startV3Point: Vector3;
  private isMouseDown: boolean;
  private isCircleAdded: boolean;
  private circle: Circle;
  private startPoint: SEPoint | null = null;
  private endPoint: SEPoint | null = null;
  constructor(scene: Two.Group, transformMatrix: Matrix4) {
    super(scene, transformMatrix);
    this.startV3Point = new Vector3();
    this.isMouseDown = false;
    this.isCircleAdded = false;
    this.circle = new Circle();
  }
  activate = () => {
    /* Nothing */
  };
  deactivate() {
    /* None yet */
  }

  mouseMoved(event: MouseEvent) {
    super.mouseMoved(event);
    if (this.isOnSphere) {
      if (this.isMouseDown) {
        if (!this.isCircleAdded) {
          this.isCircleAdded = true;
          this.canvas.add(this.circle);
          this.canvas.add(this.startMarker);
        }
        this.circle.circlePoint = this.currentSpherePoint;
      }
    } else if (this.isCircleAdded) {
      // this.circle.remove(); // remove from its parent
      this.startMarker.remove();
      this.isCircleAdded = false;
    }
  }

  // eslint-disable-next-line
  mousePressed(event: MouseEvent) {
    this.isMouseDown = true;
    if (this.isOnSphere) {
      const selected = this.hitPoint;
      if (selected instanceof SEPoint) {
        this.startV3Point.copy(selected.positionOnSphere);
        this.startPoint = this.hitPoint;
      } else {
        this.canvas.add(this.startMarker);
        this.startV3Point.copy(this.currentSpherePoint);
        this.startPoint = null;
      }
      this.startMarker.translation.copy(this.currentScreenPoint);
      this.circle.centerPoint = this.currentSpherePoint;
    }
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent) {
    this.isMouseDown = false;
    if (this.isOnSphere) {
      // Record the second point of the geodesic circle
      this.circle.remove();
      this.canvas.remove(this.startMarker);
      this.isCircleAdded = false;
      // this.endV3Point.copy(this.currentPoint);
      const newCircle = this.circle.clone();

      // TODO: Use EventBus.fire()???
      const circleGroup = new CommandGroup();
      if (this.startPoint === null) {
        // Starting point landed on an open space
        // we have to create a new point
        const vtx = new SEPoint(new Point());
        vtx.positionOnSphere = this.startV3Point;
        this.startPoint = vtx;
        circleGroup.addCommand(new AddPointCommand(vtx));
      }
      if (this.hitPoint instanceof SEPoint) {
        this.endPoint = this.hitPoint;
      } else {
        // endV3Point landed on an open space
        // we have to create a new point
        const vtx = new SEPoint(new Point());
        vtx.positionOnSphere = this.currentSpherePoint;
        this.endPoint = vtx;
        circleGroup.addCommand(new AddPointCommand(vtx));
      }

      circleGroup
        .addCommand(
          new AddCircleCommand({
            circle: new SECircle(newCircle, 1),
            centerPoint: this.startPoint,
            circlePoint: this.endPoint
          })
        )
        .execute();
      this.startPoint = null;
      this.endPoint = null;
    }
  }
  mouseLeave(event: MouseEvent): void {
    throw new Error("Method not implemented.");
  }
}
