/** @format */

import Arrow from "@/3d-objs/Arrow";
import CursorHandler from "./CursorHandler";
import Point from "@/plotables/Point";
import { AddPointCommand } from "@/commands/AddPointCommand";
import Two from "two.js";
export default class NormalPointHandler extends CursorHandler {
  private normalArrow: Arrow;
  private isNormalAdded: boolean;

  constructor(scene: Two.Group) {
    super(scene);
    this.normalArrow = new Arrow(
      0.5 /* relative length with respect to the unit circle */,
      0xff8000
    );
    this.isNormalAdded = false;
  }

  mouseMoved(event: MouseEvent) {
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

  mousePressed = () => {
    if (this.isOnSphere) {
      // The intersection point is returned as a point in the WORLD coordinate
      // But when a new point is added to the sphere, we have to convert
      // for the world coordinate frame to the sphere coordinate frame

      const vtx = new Point();
      vtx.positionOnSphere = this.currentSpherePoint;
      new AddPointCommand(vtx).execute();
    }
  };

  mouseReleased() {
    /* None */
  }
  activate = () => {
    // this.rayCaster.layers.disableAll();
    // this.rayCaster.layers.enable(SETTINGS.layers.sphere);
  };
}
