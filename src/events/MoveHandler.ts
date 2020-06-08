/** @format */

import CursorHandler from "./CursorHandler";
// import SETTINGS from "@/global-settings";
import Two from "two.js";
import { Matrix4 } from "three";
import { SEPoint } from "@/models/SEPoint";

export default class MoveHandler extends CursorHandler {
  private isDragging = false;
  private moveTarget: SEPoint | null = null;
  constructor(scene: Two.Group, transformMatrix: Matrix4) {
    super(scene, transformMatrix);
  }

  mouseMoved(event: MouseEvent) {
    super.mouseMoved(event);
    if (this.isDragging && this.moveTarget instanceof SEPoint) {
      // this.moveTarget.position.copy(this.currentPoint);
      const vtx = this.store.state.points.find(
        v => v.ref.id === this.moveTarget?.id
      );
      if (vtx) {
        // Update all lines having this point as start point
        vtx.startOf.forEach(z => {
          // z.ref.startV3Point = this.currentPoint;
        });
        // Update all lines having this point as end point
        vtx.endOf.forEach(z => {
          // z.ref.endV3Point = this.currentPoint;
        });
        // Update all circles having this point as center point
        vtx.centerOf.forEach(z => {
          // z.ref.centerPoint = this.currentPoint;
        });
        // Update all circles having this point as circum point
        vtx.circumOf.forEach(z => {
          // z.ref.circlePoint = this.currentPoint;
        });
      }
    }
  }

  //eslint-disable-next-line
  mousePressed(event: MouseEvent) {
    this.isDragging = true;
    if (this.hitPoint instanceof SEPoint) this.moveTarget = this.hitPoint;
  }

  //eslint-disable-next-line
  mouseReleased(event: MouseEvent) {
    this.isDragging = false;
    this.moveTarget = null;
  }

  activate() {
    // this.rayCaster.layers.disableAll();
    // this.rayCaster.layers.enable(SETTINGS.layers.sphere);
    // this.rayCaster.layers.enable(SETTINGS.layers.point);
  }
}
