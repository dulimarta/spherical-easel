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
import { MovePointCommand } from "@/commands/MovePointCommand";
import { CommandGroup } from "@/commands/CommandGroup";
const tmpVector1 = new Vector3();
const tmpVector2 = new Vector3();
const desiredZAxis = new Vector3();
const tmpMatrix = new Matrix4();

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
   * A flag to set that indicates the sphere should rotate. This is different than this.moveTarget == null
   * because if the user highlights over an non-movable object and then tries to move it, nothing happens (and
   * this.moveTarget = null && rotateSphere=false), but if nothing is highlighted and the user mouse presses,
   * then the whole sphere should rotate (and this.moveTarget = null && rotateSphere =true)
   */
  private rotateSphere = false;

  /**
   * Vectors that define the movable object before and after moving
   */
  private beforeMoveVector1 = new Vector3(); // The start/center SEPoint
  private beforeMoveVector2 = new Vector3(); // The end/circle SEPoint (not used for rotate or point move undo)
  private afterMoveVector1 = new Vector3(); // The start/center SEPoint
  private afterMoveVector2 = new Vector3(); // The end/circle SEPoint  (not used for rotate or point move undo)
  /**
   * A matrix that is used to indicate the *change* in position of the moving object on the sphere.
   * This matrix is applied to the free points defining the movable object, when those points are updated, the
   * object moves.
   * Rotation: Used when no object is selected and the user mouse presses and drags
   * Used in the MoveCommand to indicate the matrix that maps the two before vectors defining the
   * locations of the points defining the line/segment/circle to the two after vectors that defined
   * the points that define the line/segment/circle
   */
  private changeInPositionRotationMatrix: Matrix4 = new Matrix4();

  /**
   * If the user starts to move an object and mouse press at a location on the sphere, then moves
   * off the canvas, then back inside the sphere and mouse releases, we should not be moving anything. This
   * variable is to help with that. Or if the user mouse press outside the canvas and mouse releases
   * on the canvas, nothing should happen.
   */
  private movingSomething = false;

  constructor(layers: Two.Group[]) {
    super(layers);
  }

  mousePressed(event: MouseEvent) {
    //super.mouseMoved(event);
    // Reset the variables for another move event
    this.isDragging = true;
    this.moveTarget = null;
    this.rotateSphere = false;
    this.movingSomething = true;

    // Query the nearby SENodules to select the one the user wishes to move (if none the sphere rotates)
    if (this.hitSENodules.length > 0) {
      // Prioritize moving points then lines then segments, then circles
      const freePoints = this.hitSEPoints.filter(n => n.isFreeToMove());
      if (freePoints.length > 0) {
        this.moveTarget = freePoints[0];
        this.beforeMoveVector1.copy(freePoints[0].locationVector);

        return;
      }
      //If the user tries to move a nonFree point, nothing should happen
      if (this.hitSEPoints.length == 0) {
        const freeLines = this.hitSELines.filter(n => n.isFreeToMove());
        if (freeLines.length > 0) {
          this.moveTarget = freeLines[0];
          this.beforeMoveVector1.copy(freeLines[0].startSEPoint.locationVector);
          this.beforeMoveVector2.copy(freeLines[0].endSEPoint.locationVector);
          return;
        }
        const freeSegments = this.hitSESegments.filter(n => n.isFreeToMove());
        if (freeSegments.length > 0) {
          this.moveTarget = freeSegments[0];
          this.beforeMoveVector1.copy(
            freeSegments[0].startSEPoint.locationVector
          );
          this.beforeMoveVector2.copy(
            freeSegments[0].endSEPoint.locationVector
          );
          // console.log(
          //   "dist before",
          //   this.beforeMoveVector1.angleTo(this.beforeMoveVector2)
          // );
          return;
        }

        const freeCircles = this.hitSECircles.filter(n => n.isFreeToMove());
        if (freeCircles.length > 0) {
          this.moveTarget = freeCircles[0];
          this.beforeMoveVector1.copy(
            freeCircles[0].centerSEPoint.locationVector
          );
          this.beforeMoveVector2.copy(
            freeCircles[0].circleSEPoint.locationVector
          );
          return;
        }
      }
    } else {
      // In this case the user mouse pressed in a location with *no* nodules (nothing was highlighted when she mouse pressed)
      this.rotateSphere = true;
      this.beforeMoveVector1.copy(this.currentSphereVector);
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
        this.afterMoveVector1.copy(this.currentSphereVector);
        this.moveTarget.update();
      } else if (
        this.moveTarget instanceof SELine ||
        this.moveTarget instanceof SESegment
      ) {
        // Move the selected SELine or SESegment
        this.moveTarget.ref.normalDisplay();
        this.doMoveLine(this.moveTarget, event.altKey, event.ctrlKey);
        this.afterMoveVector1.copy(this.moveTarget.startSEPoint.locationVector);
        this.afterMoveVector2.copy(this.moveTarget.endSEPoint.locationVector);
      } else if (this.moveTarget instanceof SECircle) {
        // Move the selected SECircle
        this.moveTarget.ref.normalDisplay();
        //SECircle and SEThreePointCircle are potentially movable
        // The move method in SEThreePointCircle overrides the move method in SECircle
        this.moveTarget.move(
          this.previousSphereVector,
          this.currentSphereVector
        );
        this.afterMoveVector1.copy(
          this.moveTarget.centerSEPoint.locationVector
        );
        this.afterMoveVector2.copy(
          this.moveTarget.circleSEPoint.locationVector
        );
      } else if (this.moveTarget == null && this.rotateSphere) {
        // Rotate the sphere
        this.doRotateSphere();
        this.afterMoveVector1.copy(this.currentSphereVector);
      }
    }
  }

  mouseReleased(event: MouseEvent) {
    this.movingSomething = false;
    this.isDragging = false;

    if (this.moveTarget instanceof SEPoint) {
      // Store the move point for undo/redo command
      // Store the move command that takes the beforeMoveVector1 location to the afterMoveVector2 location,
      // but don't execute it because the rotation has already happened. This way the first to
      // last position rotation is in the command structure and can be undone or redone
      new MovePointCommand(
        this.moveTarget,
        this.beforeMoveVector1,
        this.afterMoveVector1
      ).push();
    } else if (this.moveTarget == null && this.rotateSphere) {
      // Store the rotation of the sphere for undo/redo command.
      // Create the rotation matrix that takes beforeMoveVector1 to the afterMoveVector1 location
      const rotationAngle = this.beforeMoveVector1.angleTo(
        this.afterMoveVector1
      );
      desiredZAxis.crossVectors(this.beforeMoveVector1, this.afterMoveVector1);
      if (desiredZAxis.isZero()) {
        if (rotationAngle == 0) {
          // The vectors are identical
          this.changeInPositionRotationMatrix.identity();
        } else {
          // The vectors are opposites (antipodal)
          this.changeInPositionRotationMatrix.makeRotationAxis(
            tmpVector1.set(1, 0, 0),
            rotationAngle
          );
        }
      } else {
        desiredZAxis.normalize();
        this.changeInPositionRotationMatrix.makeRotationAxis(
          desiredZAxis,
          rotationAngle
        );
      }
      // Store the rotation command that takes the beforeMoveVector1 location to the afterMoveVector2 location,
      // but don't execute it because the rotation has already happened. This way the first to
      // last position rotation is in the command structure and can be undone or redone
      new RotateSphereCommand(this.changeInPositionRotationMatrix).push();
    } else {
      // Store the move line/segment for undo/redo command
      const moveCommandGroup = new CommandGroup();
      // Make the rotation matrix that takes beforeMoveVector1/2 to afterMoveVector1/2
      // There is a rotation matrix that does this because the length of the segment or the distance between
      // startSEPoint and endSEPoint shouldn't change.
      // First apply the current changeInPositionMatrix (that takes beforeMoveVector1 to afterMoveVector1)
      // to beforeMoveVector2
      tmpVector1
        .copy(this.beforeMoveVector2)
        .applyMatrix4(this.changeInPositionRotationMatrix);

      // To compute the angle of rotation you have project tmpVector1 and afterMoveVector2 into the
      // plane perpendicular to this.afterMoveVector1 and measure the angle in that plane.
      // Accomplish this by the angle between cross(afterMoveVec1,afterMoveVec2) and cross(tmpVector1,afterMoveVec1)
      tmpVector2.crossVectors(this.afterMoveVector2, this.afterMoveVector1);
      tmpVector1.cross(this.afterMoveVector1);

      let newAngle = tmpVector1.angleTo(tmpVector2);
      // Determine which direction to rotate.
      tmpVector1.cross(tmpVector2);
      newAngle *= Math.sign(tmpVector1.z);

      // rotate by the newAngle about afterMoveVector1
      tmpMatrix.makeRotationAxis(this.afterMoveVector1, newAngle);
      // First changeInPosition maps beforeMoveVector1 to afterMoveVector1
      // then tmpMatrix fixes afterMoveVector1 and takes changeInPosition(beforeMoveVector2) to afterMoveVector2
      this.changeInPositionRotationMatrix.premultiply(tmpMatrix);

      if (this.moveTarget instanceof SESegment) {
        moveCommandGroup.addCommand(
          new MovePointCommand(
            this.moveTarget.startSEPoint,
            this.beforeMoveVector1,
            this.afterMoveVector1
          )
        );
        moveCommandGroup.addCommand(
          new MovePointCommand(
            this.moveTarget.endSEPoint,
            this.beforeMoveVector2,
            this.afterMoveVector2
          )
        );
      } else if (this.moveTarget instanceof SELine) {
        moveCommandGroup.addCommand(
          new MovePointCommand(
            this.moveTarget.startSEPoint,
            this.beforeMoveVector1,
            this.afterMoveVector1
          )
        );
        moveCommandGroup.addCommand(
          new MovePointCommand(
            this.moveTarget.endSEPoint,
            this.beforeMoveVector2,
            this.afterMoveVector2
          )
        );
      } else if (this.moveTarget instanceof SECircle) {
        moveCommandGroup.addCommand(
          new MovePointCommand(
            this.moveTarget.centerSEPoint,
            this.beforeMoveVector1,
            this.afterMoveVector1
          )
        );
        moveCommandGroup.addCommand(
          new MovePointCommand(
            this.moveTarget.circleSEPoint,
            this.beforeMoveVector2,
            this.afterMoveVector2
          )
        );
      }
      // store the command but don't execute it as the move has already been done.
      moveCommandGroup.push();
    }
    this.moveTarget = null;
    this.rotateSphere = false;
  }

  mouseLeave(event: MouseEvent): void {
    this.moveTarget = null;
    this.movingSomething = false;
  }

  /**
   * Move a line, this is not a method in the SELine or SESegment class (unlike move circle) because there
   * are no classes that extend SELine or SESegment that are movable.
   * @param targetLine The SELine/SESegment being moved
   * @param altKeyPressed Controls which point defining the line or segment the line or segment rotates about
   * @param ctrlKeyPressed If pressed overrides the altKey method and just rotates the entire line/segment based on the change in mouse position.
   */
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
      console.debug("free End kid", freeEnd.kids[0].name);
      console.debug("pivot kid", pivot.kids[0].name);
      freeEnd.update();
      pivot.update();
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
