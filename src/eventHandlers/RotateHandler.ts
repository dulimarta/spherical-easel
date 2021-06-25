import MouseHandler from "./MouseHandler";
import Two from "two.js";
import { Matrix4, Vector3 } from "three";
import EventBus from "./EventBus";
import { RotateSphereCommand } from "@/commands/RotateSphereCommand";
import SETTINGS from "@/global-settings";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { SESegment } from "@/models/SESegment";
import { SEStore } from "@/store";

const desiredZAxis = new Vector3();
const deltaT = 1000 / SETTINGS.rotate.momentum.framesPerSecond; // The momentum rotation is refreshed every deltaT milliseconds
const endTime = Math.max(
  0,
  Math.min(SETTINGS.rotate.momentum.decayTime * 1000, 300000)
); // The momentum rotation will end after this many milliseconds. 300000 milliseconds is 5 minutes
const tmpVector1 = new Vector3();
// const tmpVector2 = new Vector3();
// const tmpMatrix = new Matrix4();

export default class RotateHandler extends MouseHandler {
  /**
   * Records the location of the first mouse press, so that when undoing
   * we can just record the rotation from the first mouse press to the mouse release
   * rather than all the in between small rotations.
   */
  private startVector = new Vector3();

  /**
   * This is the last location (vector) of the mouse on the sphere. This is used when the mousePress
   * is on the sphere, but a mouseLeave or mouseRelease not on the sphere is executed.
   */
  private lastCurrentVectorOnSphere = new Vector3();

  /**
   * A matrix that is used to indicate the *change* in position of the objects on the sphere. The
   * total change in position is not stored. This matrix is applied (via a position visitor) to
   * all objects on the sphere.
   */
  private changeInPositionRotationMatrix: Matrix4 = new Matrix4();
  /**
   * If the user is actually rotating the sphere this variable is true. Used to detect a mouse press
   * outside of the sphere and a release inside the sphere so that nothing happens in this edge case.
   */
  private userIsRotating = false;
  /**
   * If the rotation is due to momentum flag this variable is true.
   */
  private momentumMode = false;
  /**
   * The time in milliseconds of the previous mouse move event
   */
  private previousTime = 0;
  /**
   * An approximation of the derivative of the angular position.
   */
  private derivative = 0;
  /**
   * The (variable) amount to rotate by per frame in momentum mode.
   */
  private momentumAngle = 0;
  /**
   * The location of the currentSpherePoint (at the start of momentum) at the end of the momentum rotations
   */
  private momentumCurrentSphereVector = new Vector3();

  /**
   * If this is true, the selected SENodule contained a point or a line/segment and the
   * rotation should be abut that point's vector or the line/segment's normal vector (call axis of rotation)
   */
  private rotateAboutPointMode = false;
  private axisOfRotation = new Vector3();
  private totalAngleOfRotation = 0; // Keep track of the total angle of rotation so that it can be undone

  constructor(layers: Two.Group[]) {
    super(layers);
  }

  mousePressed(event: MouseEvent): void {
    // Mouse pressing in the sphere while it is rotating in momentum mode does nothing to the sphere
    if (this.momentumMode) return;

    // Mouse pressing outside of the sphere does nothing and doesn't start a rotation
    if (!this.isOnSphere) return;

    // Set this variable so that rotations and momentum will happen and *originate* with a mouse pressed event in the sphere
    this.userIsRotating = true;
    this.startVector.copy(this.currentSphereVector);
    this.previousTime = event.timeStamp;
    this.totalAngleOfRotation = 0; // reset it for the next rotation
  }

  mouseMoved(event: MouseEvent): void {
    // Mousing moving in the sphere while it is rotating in momentum mode does nothing to the sphere
    if (this.momentumMode) return;

    // Determine the current location on the sphere (on on screen) and highlight objects
    super.mouseMoved(event);

    // If the mouse is not on the sphere do nothing
    if (!this.isOnSphere) return;

    // Compute the angular change in position
    let rotationAngle = this.previousSphereVector.angleTo(
      this.currentSphereVector
    );
    // If the rotation is big enough and the user is rotating preform the rotation
    if (this.userIsRotating && rotationAngle > SETTINGS.rotate.minAngle) {
      if (this.rotateAboutPointMode || event.altKey) {
        // Determine which direction to rotate.
        tmpVector1.crossVectors(
          this.currentSphereVector,
          this.previousSphereVector
        );
        rotationAngle *= Math.sign(tmpVector1.z);

        //Reverse the direction with the input is directed to the back of the sphere.
        if (event.shiftKey) rotationAngle *= -1;

        if (event.altKey) {
          // If the angle between  <0,1,0> is less than Pi/2 this is the correct sign, otherwise reverse it
          if (tmpVector1.set(0, 1, 0).dot(this.currentSphereVector) < 0) {
            rotationAngle *= -1;
          }
          desiredZAxis.set(0, 1, 0);
        } else {
          // If the angle between the axisOfRotation is less than Pi/2 this is the correct sign, otherwise reverse it
          if (this.axisOfRotation.dot(this.currentSphereVector) < 0) {
            rotationAngle *= -1;
          }
          desiredZAxis.copy(this.axisOfRotation);
        }
        // Determine the axis of rotation and update the total angle
        this.totalAngleOfRotation += rotationAngle;
      } else {
        desiredZAxis
          .crossVectors(this.previousSphereVector, this.currentSphereVector)
          .normalize();
      }
      // Form the matrix that performs the rotation
      this.changeInPositionRotationMatrix.makeRotationAxis(
        desiredZAxis,
        rotationAngle
      );
      // Update the previous locations/times /derivative
      this.derivative = rotationAngle / (event.timeStamp - this.previousTime);
      this.momentumAngle = rotationAngle; // The initial momentum rotation angle is the last rotation angle
      this.previousTime = event.timeStamp;
      this.lastCurrentVectorOnSphere.copy(this.currentSphereVector);

      // Apply the rotation to the sphere and update the display
      //#region sphereRotate
      EventBus.fire("sphere-rotate", {
        transform: this.changeInPositionRotationMatrix
      });
      //#endregion sphereRotate
    }
  }

  mouseReleased(event: MouseEvent): void {
    // If the user is not rotating, then either a rotation hasn't started or a rotation was recorded
    if (!this.userIsRotating) return;

    if (!this.isOnSphere) {
      // In this case, the mouseRelease was not on the sphere but the current rotation hasn't been ended, so end
      // it now and get ready for the next user action.
      this.issueRotateSphereCommand(
        this.startVector,
        this.lastCurrentVectorOnSphere
      );
      this.userIsRotating = false;
      this.momentumMode = false;
      this.totalAngleOfRotation = 0;
      return;
    }
    // If the execution thread reaches here, the mouse release was on the sphere and the user is rotating
    // Mouse releasing in the sphere during momentum rotation turns off the rotation
    // as momentum() is an asynchronous method, mouseRelease can be processed during the momentum rotations.
    if (!this.momentumMode) {
      if (
        SETTINGS.rotate.momentum.enabled &&
        endTime > 0 &&
        this.derivative != 0 &&
        event.timeStamp - this.previousTime <
          SETTINGS.rotate.momentum.pauseTimeToTemporarilyDisableMomentum * 1000
      ) {
        // If the momentum mode was turned on, the derivative is not zero (i.e. it rotated at least once),
        // the endTime is bigger than zero, and the user has not paused the dragging
        // then continue rotating according to the decay time
        // The ending of the momentum function will store a first to last rotation command for undoing purposes
        // START THE MOMENTUM ROTATIONS
        this.momentumCurrentSphereVector = this.currentSphereVector;
        this.momentumMode = true;
        this.momentum(0);
      } else {
        //if (this.derivative != 0) {
        //As the derivative is not zero, the user actually did a rotation that needs to be undoable, and did not mouse press and release in the same location.

        // Store the initial to final position rotation so it can be undone
        this.issueRotateSphereCommand(
          this.startVector,
          this.currentSphereVector
        );
      }
    } else {
      // This is the users way to turn off the momentum rotation.
      this.momentumMode = false;
    }
    // Get ready for the next rotation event or action
    this.userIsRotating = false;
    // this.totalAngleOfRotation = 0;
  }

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    // Make sure that the last move gets recorded in the command structure so it can be undone/redone
    if (this.userIsRotating) {
      // In this case, the rotation was started but hasn't been recorded
      this.issueRotateSphereCommand(
        this.startVector,
        this.lastCurrentVectorOnSphere
      );
    }
    this.momentumMode = false;
    this.userIsRotating = false;
    this.totalAngleOfRotation = 0;
  }

  // Delay the execution of a set of commands (but allow other threads to continue)
  // TODO: Promise<void> or Promise<number>?
  sleep(ms: number): Promise<number> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Continues to rotate the sphere after the user has stopped actively rotating
   * @param callNumber The number of times this method has been called, used to stop recursion
   */
  async momentum(callNumber: number): Promise<void> {
    // Check to see if momentum mode is still enable and the time elapsed since the first momentum call is less than the endTime
    if (this.momentumMode && callNumber * deltaT < endTime) {
      // momentumAngle is the area under the curve y(t) = -this.derivative/endTime*t + this.derivative
      //  from t=callNum*deltaT to t=(callNum+1)*deltaT. y(t) is the angular velocity of the sphere
      //  over time. It is linear from the initial point (0,this.derivative) to (endTime,0).
      //  On input t in milliseconds the output is radians/millisecond so by the Total Change Theorem
      //  of calculus (https://activecalculus.org/single/sec-4-4-FTC.html) this area is the  total change
      //  angle over that time period.
      this.momentumAngle =
        deltaT *
        ((-this.derivative / endTime) * (2 * callNumber + 1) + this.derivative);
      if (this.rotateAboutPointMode) {
        this.totalAngleOfRotation += this.momentumAngle;
      }
      this.changeInPositionRotationMatrix.makeRotationAxis(
        desiredZAxis,
        this.momentumAngle
      );
      this.momentumCurrentSphereVector.applyMatrix4(
        this.changeInPositionRotationMatrix
      );
      EventBus.fire("sphere-rotate", {
        transform: this.changeInPositionRotationMatrix
      });
      await this.sleep(deltaT);
      this.momentum(callNumber + 1);
    } else {
      // Turn off momentum mode
      this.momentumMode = false;
      this.derivative = 0;
      this.userIsRotating = false;

      // Store the initial to final position rotation so it can be undone
      this.issueRotateSphereCommand(
        this.startVector,
        this.momentumCurrentSphereVector
      );
    }
  }

  activate(): void {
    // If there is exactly one SEPoint/SELine/SESegment object enter the rotateAboutPointMode
    if (SEStore.selectedSENodules.length == 1) {
      const object = SEStore.selectedSENodules[0];
      if (object instanceof SEPoint) {
        this.axisOfRotation.copy(object.locationVector);
        this.rotateAboutPointMode = true;
      } else if (object instanceof SELine) {
        this.axisOfRotation.copy(object.normalVector);
        this.rotateAboutPointMode = true;
      } else if (object instanceof SESegment) {
        this.axisOfRotation.copy(object.normalVector);
        this.rotateAboutPointMode = true;
      }
    }
    // Unselect the selected objects and clear the selectedObject array
    // super.activate();
  }

  deactivate(): void {
    this.rotateAboutPointMode = false;
  }
  /**
   * Sends a RotateSphereCommand to the Command stack that takes the beforeRotationVector to the after one
   * @param beforeRotationVector
   * @param afterRotationVector
   */
  issueRotateSphereCommand(
    beforeRotationVector: Vector3,
    afterRotationVector: Vector3
  ): void {
    let rotationAngle = 0;
    if (!this.rotateAboutPointMode) {
      // The rotation angle
      rotationAngle = beforeRotationVector.angleTo(afterRotationVector);
      // The rotation axis
      desiredZAxis
        .crossVectors(beforeRotationVector, afterRotationVector)
        .normalize();
    } else {
      rotationAngle = this.totalAngleOfRotation;
      desiredZAxis.copy(this.axisOfRotation);
    }
    // The rotation matrix
    this.changeInPositionRotationMatrix.makeRotationAxis(
      desiredZAxis,
      rotationAngle
    );
    // Here is where, if I cleverly choose two vectors to record, I might be able to avoid the issue of...
    // If you create a line segment and mouse press on the midpoint and rotate it to a different location
    // then undo, then rotate again by mouse pressing on the midpoint and dragging to a new location, then
    // undo, repeat this several times and the undoing position of the line segment appears to rotate about the
    // midpoint of the segment (i.e. while the undo returns the mouse press location, there is a rotation about
    //  that mouse press location that is not controlled -- this was an initial attempt to control it)
    //
    // Make the rotation matrix that takes beforeRotationVector1 to afterRotationVector1 and then the direction from
    // beforeRotationVector1 to beforeRotationVector 2 to the
    // There is a rotation matrix that does this because the length of the segment or the distance between
    // startSEPoint and endSEPoint shouldn't change.
    // First apply the current changeInPositionMatrix (that takes beforeRotationVector1 to afterRotationVector1)
    // to beforeMoveVector2
    // tmpVector1
    //   .copy(beforeRotationVector2)
    //   .applyMatrix4(this.changeInPositionRotationMatrix);

    // // To compute the angle of rotation you have project tmpVector1 and afterMoveVector2 into the
    // // plane perpendicular to this.afterRotationVector1 and measure the angle in that plane.
    // // Accomplish this by the angle between cross(afterMoveVec1,afterMoveVec2) and cross(tmpVector1,afterMoveVec1)
    // tmpVector2.crossVectors(afterRotationVector2, afterRotationVector1);
    // tmpVector1.cross(afterRotationVector1);

    // let newAngle = tmpVector1.angleTo(tmpVector2);
    // // Determine which direction to rotate.
    // tmpVector1.cross(tmpVector2);
    // newAngle *= Math.sign(tmpVector1.z);

    // // rotate by the newAngle about afterRotationVector1
    // tmpMatrix.makeRotationAxis(afterRotationVector1, newAngle);
    // // First changeInPosition maps beforeRotationVector1 to afterRotationVector1
    // // then tmpMatrix fixes afterRotationVector1 and takes changeInPosition(beforeMoveVector2) to afterMoveVector2
    // this.changeInPositionRotationMatrix.premultiply(tmpMatrix);

    // Store the rotation command that takes the mouse press location to the mouse release location,
    // but don't execute it because the rotation has already happened. This way the start to end position
    //  rotation is in the command structure and can be undone or redone
    new RotateSphereCommand(this.changeInPositionRotationMatrix).push();
  }
}
