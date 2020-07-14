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
   * A flag to set that indicates the sphere should rotate
   */
  private rotateSphere = false;
  /**
   * A matrix that is used to indicate the *change* in position of the objects on the sphere. The
   * total change in position is not stored. This matrix is applied (via a position visitor) to
   * all objects on the sphere. Used when no object is selected and the user mouse presses and drags
   */
  private changeInPositionRotationMatrix: Matrix4 = new Matrix4();

  /**
   * If the user starts to move an object and mouse press at a location on the sphere, then moves
   * off the canvas, then back inside the sphere and mouse releases, we not be moving anything. This
   * variable is to help with that. Or if the user mouse press outside the canvas and mouse releases
   * on the canvas, nothing should happen.
   */
  private movingSomething = false;

  constructor(layers: Two.Group[]) {
    super(layers);
  }

  //eslint-disable-next-line
  mousePressed(event: MouseEvent) {
    // Only process events from the left (inner) mouse button to avoid adverse interactions with any pop-up menu
    if (event.button != 0) return;

    // Reset the variables for another move event
    this.isDragging = true;
    this.moveTarget = null;
    this.rotateSphere = false;
    this.moveFrom.copy(this.currentSphereVector);

    // Query the nearby SENodules to select the one the user wishes to move (if none the sphere rotates)
    if (this.hitSENodules.length > 0) {
      // Prioritize moving points then lines then segments, then circles
      const freePoints = this.hitSEPoints.filter(n => n.isFreeToMove());
      if (freePoints.length > 0) {
        this.moveTarget = freePoints[0];
        this.movingSomething = true;
        return;
      }
      //If the user tries to move a nonFree point, nothing should happen
      if (this.hitSEPoints.length == 0) {
        const freeLines = this.hitSELines.filter(n => n.isFreeToMove());
        if (freeLines.length > 0) {
          this.moveTarget = freeLines[0];
          this.movingSomething = true;
          return;
        }
        const freeSegments = this.hitSESegments.filter(n => n.isFreeToMove());
        if (freeSegments.length > 0) {
          this.moveTarget = freeSegments[0];
          this.movingSomething = true;
          return;
        }

        const freeCircles = this.hitSECircles.filter(n => n.isFreeToMove());
        if (freeCircles.length > 0) {
          this.moveTarget = freeCircles[0];
          this.movingSomething = true;
          return;
        }
      }
    } else {
      // In this case the user mouse pressed in a location with *no* nodules (nothing was highlighted when she mouse pressed)
      this.rotateSphere = true;
      this.movingSomething = true;
    }
  }

  mouseMoved(event: MouseEvent): void {
    super.mouseMoved(event);
    if (!this.isOnSphere) {
      return;
    }
    event.preventDefault();

    if (this.isDragging && this.movingSomething) {
      if (this.moveTarget instanceof SEPoint) {
        // Move the selected SEPoint
        this.moveTarget.locationVector = this.currentSphereVector;
        this.moveTarget.update();
      } else if (
        this.moveTarget instanceof SELine ||
        this.moveTarget instanceof SESegment
      ) {
        // Move the selected SELine or SESegment
        this.moveTarget.ref.normalDisplay();
        this.doMoveLine(this.moveTarget, event.altKey, event.ctrlKey);
      } else if (this.moveTarget instanceof SECircle) {
        // Move the selected SECircle
        this.moveTarget.ref.normalDisplay();
        console.debug("move circle");
        this.doMoveCircle(this.moveTarget);
      } else if (this.moveTarget == null && this.rotateSphere) {
        // Rotate the sphere
        this.doRotateSphere();
      }
    }
  }
  //eslint-disable-next-line
  mouseReleased(event: MouseEvent) {
    // Only process events from the left (inner) mouse button to avoid adverse interactions with any pop-up menu
    if (event.button != 0) return;
    this.movingSomething = false;

    this.isDragging = false;
    if (this.rotateSphere) {
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
    this.rotateSphere = false;
  }

  mouseLeave(event: MouseEvent): void {
    this.moveTarget = null;
    this.movingSomething = false;
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
          .copy(targetLine.startSEPoint.locationVector)
          .applyAxisAngle(desiredZAxis, rotationAngle);
        targetLine.startSEPoint.locationVector = tmpVector1;
        tmpVector2
          .copy(targetLine.endSEPoint.locationVector)
          .applyAxisAngle(desiredZAxis, rotationAngle);
        targetLine.endSEPoint.locationVector = tmpVector2;
        // Update both points, because we might need to update their kids!
        targetLine.endSEPoint.update();
        targetLine.startSEPoint.update();
      }
    } else {
      console.log("pivot");
      let pivot = targetLine.startSEPoint;
      let freeEnd = targetLine.endSEPoint;
      if (altKeyPressed) {
        pivot = targetLine.endSEPoint;
        freeEnd = targetLine.startSEPoint;
      }

      // We want to measure the rotation angle with respect to the rotationAxis
      // Essentially we rotate a plane "hinged" at the rotationAxis so
      // the angle of rotation must be measure as the amount of changes of the
      // plane normal vector

      // Determine the normal vector to the plane containing the pivot and the previous position
      tmpVector1
        .crossVectors(pivot.locationVector, this.previousSphereVector)
        .normalize();
      // Determine the normal vector to the plane containing the pivot and the current position
      tmpVector2
        .crossVectors(pivot.locationVector, this.currentSphereVector)
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
      const axisOfRotation = pivot.locationVector;
      tmpVector1.copy(freeEnd.locationVector);
      tmpVector1.applyAxisAngle(axisOfRotation, rotationAngle);
      freeEnd.locationVector = tmpVector1;
      freeEnd.update();
    }
  }

  /**
   * Move the the circle by moving the free points it depends on
   * Simply forming a rotation matrix mapping the previous to current sphere and applying
   * that rotation to the center and circle points of defining the circle.
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
        .copy(targetCircle.centerSEPoint.locationVector)
        .applyMatrix4(this.changeInPositionRotationMatrix);
      targetCircle.centerSEPoint.locationVector = tmpVector1;
      tmpVector2
        .copy(targetCircle.circleSEPoint.locationVector)
        .applyMatrix4(this.changeInPositionRotationMatrix);
      targetCircle.circleSEPoint.locationVector = tmpVector2;
      // Update both points, because we might need to update their kids!
      targetCircle.circleSEPoint.update();
      targetCircle.centerSEPoint.update();
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
}
