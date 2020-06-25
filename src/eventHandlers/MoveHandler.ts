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
const arcNormal1 = new Vector3();
const arcNormal2 = new Vector3();
const currCircleCenter = new Vector3();
const prevCircleOuter = new Vector3();

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

  /**
   * Move the the center point of the circle while keeping its outer
   * point as close as possible to the old outer point position.
   *
   * The algorithm below implements the move in two steps
   * (1) Translate both the center (C) and outer (U) points by the same
   * amount as dictated by the mouse move distance.
   * Let C1 and U1 be the new location of the center and outer points.
   * (2) Rotate the circle around its own center (C1) such that C1, U1, and
   * are on the same line (arc)
   * @param targetCircle
   */
  private doMoveCircle(targetCircle: SECircle) {
    // tmpVector1> the normal of the plane containing the arc between
    // the previous sphere position and the current sphere position
    currCircleCenter.copy(targetCircle.centerPoint.positionOnSphere);
    tmpVector1
      .crossVectors(this.prevSpherePoint, this.currentSpherePoint)
      .normalize();
    const moveArcDistance = this.prevSpherePoint.angleTo(
      this.currentSpherePoint
    );
    // (1) Translate both the center and outer points by the same amount
    tmpVector2.copy(targetCircle.centerPoint.positionOnSphere);
    tmpVector2.applyAxisAngle(tmpVector1, moveArcDistance);
    targetCircle.centerPoint.positionOnSphere = tmpVector2;
    tmpVector2.copy(targetCircle.circlePoint.positionOnSphere);
    tmpVector2.applyAxisAngle(tmpVector1, moveArcDistance);
    targetCircle.circlePoint.positionOnSphere = tmpVector2;

    // (2) Rotate the circle so the new center, the new outer, and the
    // old outer points are collinear
    arcNormal1
      .crossVectors(
        targetCircle.centerPoint.positionOnSphere,
        targetCircle.circlePoint.positionOnSphere
      )
      .normalize();
    // Compute the plane normal vector of the arc between
    // the new center and the old outer
    arcNormal2
      .crossVectors(targetCircle.centerPoint.positionOnSphere, prevCircleOuter)
      .normalize();
    tmpVector1.crossVectors(arcNormal1, arcNormal2).normalize();
    const circleRotation =
      arcNormal1.angleTo(arcNormal2) * Math.sign(tmpVector1.z);
    tmpVector1.copy(targetCircle.circlePoint.positionOnSphere);
    tmpVector1.applyAxisAngle(
      targetCircle.centerPoint.positionOnSphere,
      circleRotation
    );
    targetCircle.circlePoint.positionOnSphere = tmpVector1;
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

      const freeCirles = this.hitCircles.filter(n => n.isFreeToMove());
      if (freeCirles.length > 0) {
        this.moveTarget = freeCirles[0];
        prevCircleOuter.copy(freeCirles[0].circlePoint.positionOnSphere);
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
