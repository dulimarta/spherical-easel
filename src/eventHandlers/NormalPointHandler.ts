/** @format */

import Arrow from "@/3d-objs/Arrow";
import MouseHandler from "./MouseHandler";
import Two from "two.js";
import { Matrix4 } from "three";
import EventBus from "@/eventHandlers/EventBus";
export default class NormalPointHandler extends MouseHandler {
  mouseLeave(event: MouseEvent): void {
    throw new Error("Method not implemented.");
  }
  private normalArrow: Arrow;
  private isNormalAdded: boolean;

  constructor(layers: Two.Group[]) {
    super(layers);
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
      EventBus.fire("insert-point", {
        position: this.currentSpherePoint
      });
    }
  };

  mouseReleased(): void {
    /* None */
  }
}
