/** @format */

import { Vector3, Matrix4 } from "three";
import CursorHandler from "./CursorHandler";
import Point from "@/plotables/Point";
// import SETTINGS from "@/global-settings";
import Circle from "@/3d-objs/Circle";
import { CommandGroup } from "@/commands/CommandGroup";
import { AddPointCommand } from "@/commands/AddPointCommand";
import { AddCircleCommand } from "@/commands/AddCircleCommand";
import Two from "two.js";
import { SEPoint } from "@/models/SEPoint";

export default class CircleHandler extends CursorHandler {
  private startV3Point: Vector3;
  private isMouseDown: boolean;
  private isCircleAdded: boolean;
  private circle: Circle;
  private startPoint: Point | null = null;
  private endPoint: Point | null = null;
  constructor(scene: Two.Group, transformMatrix: Matrix4) {
    super(scene, transformMatrix);
    this.startV3Point = new Vector3();
    this.isMouseDown = false;
    this.isCircleAdded = false;
    this.circle = new Circle();
  }
  activate = () => {
    // this.rayCaster.layers.disableAll();
    // this.rayCaster.layers.enable(SETTINGS.layers.sphere);
    // this.rayCaster.layers.enable(SETTINGS.layers.point);
  };

  mouseMoved(event: MouseEvent) {
    super.mouseMoved(event);
    if (this.isOnSphere) {
      if (this.isMouseDown) {
        if (!this.isCircleAdded) {
          this.isCircleAdded = true;
          this.canvas.add(this.circle);
          this.canvas.add(this.startMarker.ref);
        }
        this.circle.circlePoint = this.currentSpherePoint;
      }
    } else if (this.isCircleAdded) {
      this.circle.remove(); // remove from its parent
      this.startMarker.ref.remove();
      this.isCircleAdded = false;
    }
  }

  // eslint-disable-next-line
  mousePressed(event: MouseEvent) {
    this.isMouseDown = true;
    if (this.isOnSphere) {
      const selected = this.hitObject;
      if (selected instanceof Point) {
        this.startV3Point.copy(selected.owner.positionOnSphere);
        this.startPoint = this.hitObject as Point;
      } else {
        this.canvas.add(this.startMarker.ref);
        this.startV3Point.copy(this.currentSpherePoint);
        this.startPoint = null;
      }
      this.startMarker.positionOnSphere = this.currentSpherePoint;
      this.circle.centerPoint = this.currentSpherePoint;
    }
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent) {
    this.isMouseDown = false;
    if (this.isOnSphere) {
      // Record the second point of the geodesic circle
      this.circle.remove();
      this.canvas.remove(this.startMarker.ref);
      this.isCircleAdded = false;
      // this.endV3Point.copy(this.currentPoint);
      const newCircle = this.circle.clone();
      const circleGroup = new CommandGroup();
      if (this.startPoint === null) {
        // Starting point landed on an open space
        // we have to create a new point
        const vtx = new SEPoint(new Point());
        vtx.positionOnSphere = this.startV3Point;
        this.startPoint = vtx.ref;
        circleGroup.addCommand(new AddPointCommand(vtx));
      }
      if (this.hitObject instanceof Point) {
        this.endPoint = this.hitObject;
      } else {
        // endV3Point landed on an open space
        // we have to create a new point
        const vtx = new SEPoint(new Point());
        vtx.positionOnSphere = this.currentSpherePoint;
        this.endPoint = vtx.ref;
        circleGroup.addCommand(new AddPointCommand(vtx));
      }

      circleGroup
        .addCommand(
          new AddCircleCommand({
            circle: newCircle,
            centerPoint: this.startPoint,
            circlePoint: this.endPoint
          })
        )
        .execute();
      this.startPoint = null;
      this.endPoint = null;
    }
  }
}
