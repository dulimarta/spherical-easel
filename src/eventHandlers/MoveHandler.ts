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
      } else if (this.moveTarget instanceof SELine) {
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

        tmpVector1.cross(tmpVector2);
        rotAngle *= Math.sign(tmpVector1.z);
        // console.debug(
        //   "Move line: rotate around",
        //   this.moveTarget.startPoint.toFixed(1),
        //   " angle ",
        //   rotAngle.toDegrees()
        // );
        tmpMatrix.makeRotationAxis(
          this.moveTarget.startPoint.positionOnSphere,
          rotAngle
        );
        tmpNormal.getNormalMatrix(tmpMatrix);
        tmpVector1.copy(this.moveTarget.normalDirection);
        tmpVector1.applyMatrix4(tmpMatrix);

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
        tmpVector1.applyMatrix4(tmpMatrix);
        this.moveTarget.endPoint.positionOnSphere = tmpVector1;
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
