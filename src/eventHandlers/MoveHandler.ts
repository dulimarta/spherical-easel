/** @format */

import SelectionHandler from "./SelectionHandler";
// import SETTINGS from "@/global-settings";
import Two from "two.js";
import { Matrix4, Vector3, Matrix3 } from "three";
import { SEPoint } from "@/models/SEPoint";
import { SENodule } from "@/models/SENodule";
import { SELine } from "@/models/SELine";
const tmpMatrix = new Matrix4();
const tmpNormal = new Matrix3();
const tmpVector = new Vector3();
export default class MoveHandler extends SelectionHandler {
  private isDragging = false;
  private moveTarget: SENodule | null = null;
  private moveFrom = new Vector3();
  private prevSpherePoint = new Vector3();
  constructor(layers: Two.Group[], transformMatrix: Matrix4) {
    super(layers, transformMatrix);
  }

  mouseMoved(event: MouseEvent) {
    super.mouseMoved(event);
    if (this.isDragging) {
      if (this.moveTarget instanceof SEPoint) {
        this.moveTarget.positionOnSphere = this.currentSpherePoint;
      } else if (this.moveTarget instanceof SELine) {
        tmpVector.crossVectors(this.prevSpherePoint, this.currentSpherePoint);
        const rotAngle =
          this.prevSpherePoint.angleTo(this.currentSpherePoint) *
          Math.sign(tmpVector.z);
        this.prevSpherePoint.copy(this.currentSpherePoint);
        tmpMatrix.makeRotationAxis(this.moveTarget.startPoint, rotAngle);
        tmpNormal.getNormalMatrix(tmpMatrix);
        tmpVector.copy(this.moveTarget.normalDirection);
        tmpVector.applyMatrix4(tmpMatrix);
        this.moveTarget.normalDirection = tmpVector;
      }
    }
  }

  //eslint-disable-next-line
  mousePressed(event: MouseEvent) {
    this.isDragging = true;
    this.moveTarget = null;
    if (this.hitNodes.length > 0) {
      this.moveFrom.copy(this.currentSpherePoint);
      this.prevSpherePoint.copy(this.currentSpherePoint);
      const freePoints = this.hitPoints.filter(n => n.isFree());
      if (freePoints.length > 0) {
        this.moveTarget = freePoints[0];
        return;
      }
      const freeLines = this.hitLines.filter(n => n.isFree());
      if (freeLines.length > 0) {
        this.moveTarget = freeLines[0];
        return;
      }
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
