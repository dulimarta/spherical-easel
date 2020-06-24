/** @format */

import SelectionHandler from "./SelectionHandler";
// import SETTINGS from "@/global-settings";
import Two from "two.js";
import { Matrix4, Vector3, Matrix3 } from "three";
import { SEPoint } from "@/models/SEPoint";
import { SENodule } from "@/models/SENodule";
import { SELine } from "@/models/SELine";
import { SESegment } from "@/models/SESegment";
const tmpMatrix = new Matrix4();
const tmpNormal = new Matrix3();
const tmpVector1 = new Vector3();
const tmpVector2 = new Vector3();
export default class MoveHandler extends SelectionHandler {
  private isDragging = false;
  private moveTarget: SENodule | null = null;
  private moveFrom = new Vector3();
  private prevSpherePoint = new Vector3();
  constructor(layers: Two.Group[], transformMatrix: Matrix4) {
    super(layers, transformMatrix);
  }

  mouseMoved(event: MouseEvent): void {
    super.mouseMoved(event);
    if (!this.isOnSphere) return;
    if (this.isDragging) {
      if (this.moveTarget instanceof SEPoint) {
        this.moveTarget.positionOnSphere = this.currentSpherePoint;
        this.moveTarget.update();
      } else if (
        this.moveTarget instanceof SELine ||
        this.moveTarget instanceof SESegment
      ) {
        tmpVector1
          .crossVectors(
            this.moveTarget.startPoint.positionOnSphere,
            this.prevSpherePoint
          )
          .normalize();
        tmpVector2
          .crossVectors(
            this.moveTarget.startPoint.positionOnSphere,
            this.currentSpherePoint
          )
          .normalize();
        let rotAngle = tmpVector1.angleTo(tmpVector2);
        const axisOfRotation = this.moveTarget.startPoint.positionOnSphere;
        tmpVector1.cross(tmpVector2);
        rotAngle *= Math.sign(tmpVector1.z);
        tmpNormal.getNormalMatrix(tmpMatrix);
        tmpVector1.copy(this.moveTarget.normalDirection);
        tmpVector1.applyAxisAngle(axisOfRotation, rotAngle);

        // console.debug(
        //   "Old dir",
        //   this.moveTarget.normalDirection.toFixed(2),
        //   "new dir",
        //   tmpVector.toFixed(2)
        // );
        this.moveTarget.normalDirection = tmpVector1;
        // tmpVector.copy(this.moveTarget.startPoint);
        // tmpVector.applyMatrix4(tmpMatrix);
        // this.moveTarget.startPoint = tmpVector;
        tmpVector1.copy(this.moveTarget.endPoint.positionOnSphere);
        tmpVector1.applyAxisAngle(axisOfRotation, rotAngle);
        this.moveTarget.endPoint.positionOnSphere = tmpVector1;
        if (this.moveTarget instanceof SESegment) {
          tmpVector1.copy(this.moveTarget.midVector);
          tmpVector1.applyAxisAngle(axisOfRotation, rotAngle);
          this.moveTarget.midVector.copy(tmpVector1);
        }
        this.moveTarget.update();
      }
      this.prevSpherePoint.copy(this.currentSpherePoint);
    }
  }

  //eslint-disable-next-line
  mousePressed(event: MouseEvent) {
    this.isDragging = true;
    this.moveTarget = null;
    if (this.hitNodes.length > 0) {
      this.moveFrom.copy(this.currentSpherePoint);
      this.prevSpherePoint.copy(this.currentSpherePoint);
      const freePoints = this.hitPoints.filter(n => n.isFreeToMove());
      if (freePoints.length > 0) {
        this.moveTarget = freePoints[0];
        return;
      }
      const freeLines = this.hitLines.filter(n => n.isFreeToMove());
      if (freeLines.length > 0) {
        this.moveTarget = freeLines[0];
        return;
      }
      const freeSegments = this.hitSegments.filter(n => n.isFreeToMove());
      if (freeSegments.length > 0) {
        this.moveTarget = freeSegments[0];
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
