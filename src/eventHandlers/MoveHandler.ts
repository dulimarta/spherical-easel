/** @format */

import SelectionHandler from "./SelectionHandler";
// import SETTINGS from "@/global-settings";
import Two from "two.js";
import { Matrix4 } from "three";
import { SEPoint } from "@/models/SEPoint";
import { SENodule } from "@/models/SENodule";

export default class MoveHandler extends SelectionHandler {
  private isDragging = false;
  private moveTarget: SENodule | null = null;

  constructor(layers: Two.Group[], transformMatrix: Matrix4) {
    super(layers, transformMatrix);
  }

  mouseMoved(event: MouseEvent) {
    super.mouseMoved(event);
    if (this.isDragging) {
      if (this.moveTarget instanceof SEPoint) {
        this.moveTarget.positionOnSphere = this.currentSpherePoint;
        // this.moveTarget.position.copy(this.currentPoint);
        // Update all lines having this point as start point
        // vtx.startOf.forEach(z => {
        //   z.ref.startV3Point = this.currentPoint;
        // });
        // // Update all lines having this point as end point
        // vtx.endOf.forEach(z => {
        //   // z.ref.endV3Point = this.currentPoint;
        // });
        // // Update all circles having this point as center point
        // vtx.centerOf.forEach(z => {
        //   // z.ref.centerPoint = this.currentPoint;
        // });
        // // Update all circles having this point as circum point
        // vtx.circumOf.forEach(z => {
        //   // z.ref.circlePoint = this.currentPoint;
        // });
      }
    }
  }

  //eslint-disable-next-line
  mousePressed(event: MouseEvent) {
    this.isDragging = true;
    this.moveTarget = null;
    if (this.hitNodes.length > 0) {
      const freePoints = this.hitNodes.filter(n => n.isFree());
      if (freePoints.length > 0) this.moveTarget = freePoints[0];
    }
  }

  //eslint-disable-next-line
  mouseReleased(event: MouseEvent) {
    this.isDragging = false;
    this.moveTarget = null;
  }

  mouseLeave(event: MouseEvent): void {
    /* empty function */
  }
}
