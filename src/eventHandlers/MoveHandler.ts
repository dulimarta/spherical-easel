/** @format */

import Two from "two.js";
import { Matrix4, Vector3 } from "three";
import { SEPoint } from "@/models/SEPoint";
import { SENodule } from "@/models/SENodule";
import { SELine } from "@/models/SELine";
import { SESegment } from "@/models/SESegment";
import { SECircle } from "@/models/SECircle";
import SETTINGS from "@/global-settings";
import EventBus from "./EventBus";
import { RotateSphereCommand } from "@/commands/RotateSphereCommand";
import Highlighter from "./Highlighter";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
const tmpVector1 = new Vector3();
const tmpVector2 = new Vector3();
/** Use in the rotation of sphere move event */
const desiredZAxis = new Vector3();

export default class MoveHandler extends Highlighter {
  /**
   * Set when the user is trying to move an element
   */
  private isDragging = false;

  /**
   * The target SENodule
   */
  private moveTarget: SENodule | null = null;

  /**
   * The Ideal Unit Sphere Vector of the mouse press event
   */
  private moveFrom = new Vector3();

  /**
   * For debugging the circle move code
   */
  private isSegmentAdded = false;

  /**
   * A matrix that is used to indicate the *change* in position of the objects on the sphere. The
   * total change in position is not stored. This matrix is applied (via a position visitor) to
   * all objects on the sphere. Used when no object is selected and the user mouse presses and drags
   */
  private changeInPositionRotationMatrix: Matrix4 = new Matrix4();

  constructor(layers: Two.Group[]) {
    super(layers);
  }

  //eslint-disable-next-line
  mousePressed(event: MouseEvent) {
    // Reset the variables for another move event
    this.isDragging = true;
    this.moveTarget = null;
    this.moveFrom.copy(this.currentSphereVector);

    // Query the nearby SENodules to select the one the user wishes to move (if none the sphere rotates)
    if (this.hitNodules.length > 0) {
      // Prioritize moving points then lines then segments, then circles
      const freePoints = this.hitPoints.filter(n => n.isFreeToMove());
      if (freePoints.length > 0) {
        this.moveTarget = freePoints[0];
        console.log("name", (this.moveTarget as SEPoint).name);
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

  mouseMoved(event: MouseEvent): void {
    super.mouseMoved(event);
    if (!this.isOnSphere) return;
    if (this.isDragging) {
      if (this.moveTarget instanceof SEPoint) {
        // Move the selected SEPoint
        this.moveTarget.vectorPosition = this.currentSphereVector;
        this.moveTarget.update();
      } else if (
        this.moveTarget instanceof SELine ||
        this.moveTarget instanceof SESegment
      ) {
        // Move the selected SELine or SESegment
        this.doMoveLine(this.moveTarget, event.altKey, event.ctrlKey);
      } else if (this.moveTarget instanceof SECircle) {
        // Move the selected SECircle
        this.doMoveCircle(this.moveTarget);
      } else if (this.moveTarget == null) {
        // Rotate the sphere
        this.doRotateSphere();
      }
    }
  }
  //eslint-disable-next-line
  mouseReleased(event: MouseEvent) {
    this.isDragging = false;
    if (this.moveTarget == null) {
      // End the rotation of the sphere nicely so that it is undoable.
      // Create the rotation matrix that takes mouse press location to the mouse release location
      const rotationAngle = this.moveFrom.angleTo(this.currentSphereVector);
      desiredZAxis
        .crossVectors(this.moveFrom, this.currentSphereVector)
        .normalize();
      this.changeInPositionRotationMatrix.makeRotationAxis(
        desiredZAxis,
        rotationAngle
      );

      // Store the rotation command that takes the mouse press location to the mouse release location, but don't execute it
      // because the rotation has already happened. This way the first to last position rotation is in the command
      // structure and can be undone or redone
      new RotateSphereCommand(this.changeInPositionRotationMatrix).push();
    }
    this.moveTarget = null;
  }

  mouseLeave(event: MouseEvent): void {
    /* empty function */
  }

  private doMoveLine(
    targetLine: SELine | SESegment,
    altKeyPressed: boolean,
    ctrlKeyPressed: boolean
  ): void {
    let rotationAngle;
    // If the ctrlKey Is press translate the segment in the direction of previousSphereVector
    //  to currentSphereVector (i.e. just rotate the segment)
    if (ctrlKeyPressed) {
      rotationAngle = this.previousSphereVector.angleTo(
        this.currentSphereVector
      );
      // If the rotation is big enough preform the rotation
      if (rotationAngle > SETTINGS.rotate.minAngle) {
        // The axis of rotation
        desiredZAxis
          .crossVectors(this.previousSphereVector, this.currentSphereVector)
          .normalize();
        // Form the matrix that performs the rotation
        // this.changeInPositionRotationMatrix.makeRotationAxis(
        //   desiredZAxis,
        //   rotationAngle
        // );
        tmpVector1
          .copy(targetLine.startPoint.vectorPosition)
          .applyAxisAngle(desiredZAxis, rotationAngle);
        targetLine.startPoint.vectorPosition = tmpVector1;
        tmpVector2
          .copy(targetLine.endPoint.vectorPosition)
          .applyAxisAngle(desiredZAxis, rotationAngle);
        targetLine.endPoint.vectorPosition = tmpVector2;
        // Update both points, because we might need to update their kids!
        targetLine.endPoint.update();
        targetLine.startPoint.update();
      }
    } else {
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

      // Determine the normal vector to the plane containing the pivot and the previous position
      tmpVector1
        .crossVectors(pivot.vectorPosition, this.previousSphereVector)
        .normalize();
      // Determine the normal vector to the plane containing the pivot and the current position
      tmpVector2
        .crossVectors(pivot.vectorPosition, this.currentSphereVector)
        .normalize();
      // The angle between tmpVector1 and tmpVector2 is the distance to move on the Ideal Unit Sphere
      rotationAngle = tmpVector1.angleTo(tmpVector2);

      // Determine which direction to rotate.
      tmpVector1.cross(tmpVector2);
      rotationAngle *= Math.sign(tmpVector1.z);

      // Reverse the direction of the rotation if the current points is on the back of the sphere
      if (this.currentSphereVector.z < 0) {
        rotationAngle *= -1;
      }

      // Rotate the freeEnd by the rotation angle around the axisOfRotation
      const axisOfRotation = pivot.vectorPosition;
      tmpVector1.copy(freeEnd.vectorPosition);
      tmpVector1.applyAxisAngle(axisOfRotation, rotationAngle);
      freeEnd.vectorPosition = tmpVector1;
      freeEnd.update();
    }

    this.recalculateIntersections(targetLine);
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
    let rotationAngle = this.previousSphereVector.angleTo(
      this.currentSphereVector
    );
    // reverse the rotation angle if on the back of the sphere
    if (this.currentSphereVector.z < 0) {
      rotationAngle *= -1;
    }
    // If the rotation is big enough preform the rotation
    if (rotationAngle > SETTINGS.rotate.minAngle) {
      // The axis of rotation
      desiredZAxis
        .crossVectors(this.previousSphereVector, this.currentSphereVector)
        .normalize();
      // Form the matrix that performs the rotation
      this.changeInPositionRotationMatrix.makeRotationAxis(
        desiredZAxis,
        rotationAngle
      );
      tmpVector1
        .copy(targetCircle.centerPoint.vectorPosition)
        .applyMatrix4(this.changeInPositionRotationMatrix);
      targetCircle.centerPoint.vectorPosition = tmpVector1;
      tmpVector2
        .copy(targetCircle.circlePoint.vectorPosition)
        .applyMatrix4(this.changeInPositionRotationMatrix);
      targetCircle.circlePoint.vectorPosition = tmpVector2;
      // Update both points, because we might need to update their kids!
      targetCircle.circlePoint.update();
      targetCircle.centerPoint.update();
    }
  }

  private doRotateSphere(): void {
    // Compute the angular change in position
    const rotationAngle = this.previousSphereVector.angleTo(
      this.currentSphereVector
    );
    // If the rotation is big enough preform the rotation
    if (rotationAngle > SETTINGS.rotate.minAngle) {
      // The axis of rotation
      desiredZAxis
        .crossVectors(this.previousSphereVector, this.currentSphereVector)
        .normalize();
      // Form the matrix that performs the rotation
      this.changeInPositionRotationMatrix.makeRotationAxis(
        desiredZAxis,
        rotationAngle
      );

      // Apply the rotation to the sphere and update the display
      EventBus.fire("sphere-rotate", {
        transform: this.changeInPositionRotationMatrix
      });
    }
  }

  private recalculateIntersections(target: SELine | SESegment): void {
    const out =
      target instanceof SELine
        ? this.store.getters.determineIntersectionsWithLine(target)
        : this.store.getters.determineIntersectionsWithSegment(target);

    // Build a HashMap for quick match via the parents name
    const intersectionMap: any = {};
    out
      // FIXME: Is it possible for an intersection point to have more than 2 parent nodes?
      .filter((x: SEIntersectionPoint) => x.parents.length == 2)
      .forEach((x: SEIntersectionPoint) => {
        let parent1 = x.parents[0].name;
        let parent2 = x.parents[1].name;
        if (parent1 > parent2) {
          // Swap names so they are in alphabetical order
          const tmp = parent1;
          parent1 = parent2;
          parent2 = tmp;
        }
        intersectionMap[`${parent1}/${parent2}`] = x;
      });
    target.children
      .filter(n => n instanceof SEIntersectionPoint)
      .map(n => n as SEIntersectionPoint)
      .filter((x: SEIntersectionPoint) => x.parents.length == 2)
      .forEach((x: SEIntersectionPoint) => {
        let p1 = x.parents[0].name;
        let p2 = x.parents[1].name;
        if (p1 > p2) {
          // Swap names so they are in alphabetical order
          const tmp = p1;
          p1 = p2;
          p2 = tmp;
        }

        // Locate the source SEIntersectionPoint for this object
        const source: SEIntersectionPoint = intersectionMap[`${p1}/${p2}`];
        x.vectorPosition.copy(source.vectorPosition);
        x.update();
      });
  }
}
