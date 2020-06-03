/** @format */

import Arrow from "@/3d-objs/Arrow";
import CursorHandler from "./CursorHandler";
import Point from "@/plotables/Point";
import { AddPointCommand } from "@/commands/AddPointCommand";
import Two from "two.js";
import { SEPoint } from "@/models/SEPoint";
import { Matrix4 } from "three";
export default class NormalPointHandler extends CursorHandler {
  private normalArrow: Arrow;
  private isNormalAdded: boolean;

  constructor(scene: Two.Group, transformMatrix: Matrix4) {
    super(scene, transformMatrix);
    this.normalArrow = new Arrow(
      0.5 /* relative length with respect to the unit circle */,
      0xff8000
    );
    this.isNormalAdded = false;
  }

  mouseMoved(event: MouseEvent): void {
    super.mouseMoved(event);
    if (this.isOnSphere) {
      if (!this.isNormalAdded) {
        this.canvas.add(this.normalArrow);
        this.isNormalAdded = true;
      }
      this.normalArrow.sphereLocation = this.currentSpherePoint;
    } else {
      this.canvas.remove(this.normalArrow);
      this.isNormalAdded = false;
    }
  }

  mousePressed = (): void => {
    if (this.isOnSphere) {
      // The intersection point is returned as a point in the WORLD coordinate
      // But when a new point is added to the sphere, we have to convert
      // for the world coordinate frame to the sphere coordinate frame

      const vtx = new SEPoint(new Point());
      vtx.positionOnSphere = this.currentSpherePoint;
      new AddPointCommand(vtx).execute();
    }
  };

  mouseReleased(): void {
    /* None */
  }
  activate = (): void => {
    // this.rayCaster.layers.disableAll();
    // this.rayCaster.layers.enable(SETTINGS.layers.sphere);
  };
}
