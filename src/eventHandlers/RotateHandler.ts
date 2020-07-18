import MouseHandler from "./MouseHandler";
import Two from "two.js";
import { Matrix4, Vector3 } from "three";
import EventBus from "./EventBus";
import { RotateSphereCommand } from "@/commands/RotateSphereCommand";
import SETTINGS from "@/global-settings";
import { SENodule } from "@/models/SENodule";

const desiredZAxis = new Vector3();
const deltaT = 1000 / SETTINGS.rotate.momentum.framesPerSecond; // The momentum rotation is refreshed every deltaT milliseconds
const endTime = Math.max(
  0,
  Math.min(SETTINGS.rotate.momentum.decayTime * 1000, 300000)
); // The momentum rotation will end after this many milliseconds. 300000 milliseconds is 5 minutes

export default class RotateHandler extends MouseHandler {
  /**
   * Records the location of the first mouse press, so that when undoing
   * we can just record the rotation from the first mouse press to the mouse release
   * rather than all the in between small rotations.
   */
  private startPosition = new Vector3();

  //private prevScreenPoint: Two.Vector = new Two.Vector(0, 0);
  /**
   * A matrix that is used to indicate the *change* in position of the objects on the sphere. The
   * total change in position is not stored. This matrix is applied (via a position visitor) to
   * all objects on the sphere.
   */
  private changeInPositionRotationMatrix: Matrix4 = new Matrix4();
  /**
   * If the user is dragging flag this variable is true.
   */
  private isDragging = false;
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
  private postMomentumCurrentSpherePoint: Vector3 = new Vector3();

  constructor(layers: Two.Group[]) {
    super(layers);
  }

  mousePressed(event: MouseEvent): void {
    // Mouse pressing in the sphere while it is rotating in momentum mode does nothing to the sphere
    if (!this.momentumMode) {
      this.isDragging = true;
      this.startPosition.copy(this.currentSphereVector);
      //this.prevScreenPoint.copy(this.currentScreenPoint);
      this.previousTime = event.timeStamp;
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Mousing moving in the sphere while it is rotating in momentum mode does nothing to the sphere
    if (!this.momentumMode) {
      // Determine the current location on the sphere (on on screen) and highlight objects
      super.mouseMoved(event);
      // Compute the angular change in position
      const rotationAngle = this.previousSphereVector.angleTo(
        this.currentSphereVector
      );
      // If the rotation is big enough preform the rotation
      if (
        this.isDragging &&
        this.isOnSphere &&
        rotationAngle > SETTINGS.rotate.minAngle
      ) {
        // The axis of rotation
        desiredZAxis
          .crossVectors(this.previousSphereVector, this.currentSphereVector)
          .normalize();
        // Form the matrix that performs the rotation
        this.changeInPositionRotationMatrix.makeRotationAxis(
          desiredZAxis,
          rotationAngle
        );
        // Update the previous locations/times /derivative
        this.derivative = rotationAngle / (event.timeStamp - this.previousTime);
        this.momentumAngle = rotationAngle; // The initial momentum rotation angle is the last rotation angle
        this.previousTime = event.timeStamp;

        // this.prevScreenPoint.copy(this.currentScreenPoint);

        // Apply the rotation to the sphere and update the display
        //#region sphereRotate
        EventBus.fire("sphere-rotate", {
          transform: this.changeInPositionRotationMatrix
        });
        //#endregion sphereRotate
      }
    }
  }

  mouseReleased(event: MouseEvent): void {
    this.isDragging = false;
    // Mouse releasing in the sphere during momentum rotation turns off the rotation
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
        this.postMomentumCurrentSpherePoint = this.currentSphereVector;
        this.momentumMode = true;
        this.momentum(0);
      } else {
        // Create the rotation matrix that takes mouse press location to the mouse release location
        const rotationAngle = this.startPosition.angleTo(
          this.currentSphereVector
        );
        desiredZAxis
          .crossVectors(this.startPosition, this.currentSphereVector)
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
    } else {
      this.momentumMode = false;
    }
  }

  // eslint-disable-next-line
  mouseLeave(event: MouseEvent): void {
    this.momentumMode = false;
    this.isDragging = false;
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
      this.changeInPositionRotationMatrix.makeRotationAxis(
        desiredZAxis,
        this.momentumAngle
      );
      this.postMomentumCurrentSpherePoint.applyMatrix4(
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

      // Store the initial to final position rotation so it can be undone
      const rotationAngle = this.startPosition.angleTo(
        this.postMomentumCurrentSpherePoint
      );
      desiredZAxis
        .crossVectors(this.startPosition, this.postMomentumCurrentSpherePoint)
        .normalize();
      this.changeInPositionRotationMatrix.makeRotationAxis(
        desiredZAxis,
        rotationAngle
      );

      // Store the rotation command that takes the mouse press location to the mouse release location
      new RotateSphereCommand(this.changeInPositionRotationMatrix).push();
    }
  }

  activate(): void {
    this.store.getters.selectedObjects().forEach((obj: SENodule) => {
      obj.selected = false;
    });
  }
}
