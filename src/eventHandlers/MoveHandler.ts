/** @format */

import SelectionHandler from "./SelectionHandler";
// import SETTINGS from "@/global-settings";
import Two from "two.js";
import { Matrix4, Vector3, Matrix3 } from "three";
import { SEPoint } from "@/models/SEPoint";
import { SENodule } from "@/models/SENodule";
import { SELine } from "@/models/SELine";
import { SESegment } from "@/models/SESegment";
import { SECircle } from "@/models/SECircle";
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

  private doMoveLine(
    targetLine: SELine | SESegment,
    altKeyPressed: boolean
  ): void {
    let pivot = targetLine.startPoint;
    let freeEnd = targetLine.endPoint;
    if (altKeyPressed) {
      pivot = targetLine.endPoint;
      freeEnd = targetLine.startPoint;
    }

    // We want to measure the rotation angle with respect to the rotationAxis
    // Essentially we rotate a plane "hinged" at the rotationAxis so
    // the angle of rotation must be measure as the amount of changes of the
    // plane normal vector

    // determine the plane normal vector at the previous position
    tmpVector1
      .crossVectors(pivot.positionOnSphere, this.prevSpherePoint)
      .normalize();
    // determine the plane normal vector at the current position
    tmpVector2
      .crossVectors(pivot.positionOnSphere, this.currentSpherePoint)
      .normalize();
    let rotAngle = tmpVector1.angleTo(tmpVector2);
    const axisOfRotation = pivot.positionOnSphere;
    tmpVector1.cross(tmpVector2);
    rotAngle *= Math.sign(tmpVector1.z);
    // Reverse the direction of the rotation on the back of the sphere
    if (this.currentSpherePoint.z < 0) {
      rotAngle *= -1;
    }
    tmpNormal.getNormalMatrix(tmpMatrix);
    tmpVector1.copy(targetLine.normalDirection);
    tmpVector1.applyAxisAngle(axisOfRotation, rotAngle);

    // console.debug(
    //   "Old dir",
    //   targetLine.normalDirection.toFixed(2),
    //   "new dir",
    //   tmpVector.toFixed(2)
    // );
    targetLine.normalDirection = tmpVector1;
    // tmpVector.copy(this.moveTarget.startPoint);
    // tmpVector.applyMatrix4(tmpMatrix);
    // this.moveTarget.startPoint = tmpVector;
    tmpVector1.copy(freeEnd.positionOnSphere);
    tmpVector1.applyAxisAngle(axisOfRotation, rotAngle);
    freeEnd.positionOnSphere = tmpVector1;
    if (targetLine instanceof SESegment) {
      tmpVector1.copy(targetLine.midVector);
      tmpVector1.applyAxisAngle(axisOfRotation, rotAngle);
      targetLine.midVector.copy(tmpVector1);
    }
    targetLine.update();
  }

  private doMoveCircle(targetCircle: SECircle) {
    tmpVector1
      .crossVectors(this.prevSpherePoint, this.currentSpherePoint)
      .normalize();
    const moveArcDistance = this.prevSpherePoint.angleTo(
      this.currentSpherePoint
    );
    console.debug(
      "Moving the entire circle",
      targetCircle.name,
      "by",
      moveArcDistance.toDegrees().toFixed(2)
    );
    console.debug(
      "Current center",
      targetCircle.centerPoint.name,
      "at",
      targetCircle.centerPoint.positionOnSphere.toFixed(2)
    );

    // Move the center point
    tmpVector2.copy(targetCircle.centerPoint.positionOnSphere);
    tmpVector2.applyAxisAngle(tmpVector1, moveArcDistance);
    console.debug("New center", tmpVector2.toFixed(2));
    targetCircle.centerPoint.positionOnSphere = tmpVector2;

    // Move the other point
    tmpVector2.copy(targetCircle.circlePoint.positionOnSphere);
    tmpVector2.applyAxisAngle(tmpVector1, moveArcDistance);
    targetCircle.circlePoint.positionOnSphere = tmpVector2;
    targetCircle.update();
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
        this.doMoveLine(this.moveTarget, event.altKey);
      } else if (this.moveTarget instanceof SECircle) {
        this.doMoveCircle(this.moveTarget);
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

      const freeCircles = this.hitCircles.filter(n => n.isFreeToMove());
      if (freeCircles.length > 0) {
        this.moveTarget = freeCircles[0];
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
