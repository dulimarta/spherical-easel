import Two from "two.js";
import { Matrix4, Vector3 } from "three";
import EventBus from "./EventBus";
import { RotateSphereCommand } from "@/commands/RotateSphereCommand";
import SETTINGS from "@/global-settings";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { SESegment } from "@/models/SESegment";
import Highlighter from "./Highlighter";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import i18n from "../i18n";
import { SEAntipodalPoint } from "@/models/SEAntipodalPoint";
// import { Group } from "two.js/src/group";

const desiredZAxis = new Vector3();
const deltaT = 1000 / SETTINGS.rotate.momentum.framesPerSecond; // The momentum rotation is refreshed every deltaT milliseconds
const endTime = Math.max(
  0,
  Math.min(SETTINGS.rotate.momentum.decayTime * 1000, 300000)
); // The momentum rotation will end after this many milliseconds. 300000 milliseconds is 5 minutes

/**
 * Temporay vectors to compute the angle of rotation in certain cases
 */
const tmpVector1 = new Vector3();
const tmpVector2 = new Vector3();
const tmpVector3 = new Vector3();
// const tmpMatrix = new Matrix4();

export default class RotateHandler extends Highlighter {
  /**
   * Initial startVector1 is set to (1,0,0), startVector2 is set to (0,1,0), StartVector3 to (0,0,1)
   * Then each rotation is applied to both of these vectors, so that when undoing
   * we can form that matrix that sends (1,0,0) to start1, (0,1,0) to start2, and (0,0,1) to start3
   * rather than all the in between small rotations. This is simply because the three start vectors are
   * the columns of the necessary matrix.
   */
  private startVector1 = new Vector3();
  private startVector2 = new Vector3();
  private startVector3 = new Vector3();

  /**
   * A matrix that is used to indicate the *change* in position of the objects on the sphere. The
   * total change in position is not stored. This matrix is applied (via a position visitor) to
   * all objects on the sphere.
   */
  private changeInPositionRotationMatrix: Matrix4 = new Matrix4();

  /**
   * A flag to indicate that the user has actually done a rotation and that rotation needs to be saved when
   * the user is done actively rotating or the momentum rotation is done.
   *
   */
  private saveRotationNeeded = false;

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
   * If this is true, the selected SENodule contained a point or a line/segment and the
   * rotation should be abut that point's vector or the line/segment's normal vector (call axis of rotation)
   */
  private rotateAboutObjectMode = false;
  private axisOfRotation = new Vector3();
  private oldAxisOfRotation = new Vector3();
  private rotationObject: SEPoint | SESegment | SELine | null = null;
  private newObjectOfRotation = true;
  private altKeyDown = false;

  // private tempVector1 = new Vector3();
  // private tempVector2 = new Vector3();
  // private _disableKeyHandler = false;

  constructor(layers: Two.Group[]) {
    super(layers);
  }

  keyDown = (keyEvent: KeyboardEvent): void => {
    // if (this._disableKeyHandler) return;
    if (keyEvent.repeat) return; // Ignore repeated events on the same key
    if (keyEvent.altKey) {
      this.momentumMode = false;
      EventBus.fire("show-alert", {
        key: `handlers.rotationAboutEquator`,
        keyOptions: {},
        type: "warning"
      });
      this.altKeyDown = true;
      if (this.rotationObject !== null && this.rotationObject !== undefined) {
        //un glow and unselect the object of rotation
        this.rotationObject.glowing = false;
        this.rotationObject.selected = false;
      }
      this.rotationObject = null;
      this.rotateAboutObjectMode = false;
      this.newObjectOfRotation = true;
      this.axisOfRotation.set(0, 1, 0);
    }
  };

  keyUp = (keyEvent: KeyboardEvent): void => {
    // if (this._disableKeyHandler) return;
    if (this.altKeyDown) {
      this.momentumMode = false;
      EventBus.fire("show-alert", {
        key: `handlers.rotationNoObjectUpdate`,
        keyOptions: {},
        type: "warning"
      });
      this.altKeyDown = false;
      if (this.rotationObject !== null && this.rotationObject !== undefined) {
        //un glow and unselect the object of rotation
        this.rotationObject.glowing = false;
        this.rotationObject.selected = false;
      }
      this.rotationObject = null;
      this.rotateAboutObjectMode = false;
      this.newObjectOfRotation = true;
      this.axisOfRotation.set(0, 1, 0);
    }
  };

  mousePressed(event: MouseEvent): void {
    // Mouse pressing outside of the sphere does nothing and doesn't start a rotation
    if (!this.isOnSphere) return;

    // Mouse press is the user's way to turn off the momentum rotation while it is happening
    // turn off momentum mode
    this.momentumMode = false;

    if (!event.altKey) {
      // if the user is over a line, point, or segment and clicks on it, rotate about it. (unless it is the one from a previous click, then move into the free rotation mode)
      let rotationObjectTypeKey: string | undefined = "";
      let rotationObjectName: string | undefined = "";

      if (this.hitSEPoints.length > 0) {
        // never highlight non user created intersection points
        const filteredPoints = this.hitSEPoints.filter((p: SEPoint) => {
          if (
            (p instanceof SEIntersectionPoint && !p.isUserCreated) ||
            (p instanceof SEAntipodalPoint && !p.isUserCreated)
          ) {
            return false;
          } else {
            return true;
          }
        });
        if (filteredPoints.length > 0) {
          // if the rotation object is null or the rotation object id is not the first filtered point id then
          // create a new point of rotation
          if (
            this.rotationObject === null ||
            this.rotationObject.id !== filteredPoints[0].id
          ) {
            //un glow and un selected the previous object of rotation
            if (this.rotationObject !== null) {
              this.rotationObject.glowing = false;
              this.rotationObject.selected = false;
            }
            this.rotationObject = filteredPoints[0];
            this.oldAxisOfRotation.copy(this.axisOfRotation);
            this.axisOfRotation
              .copy(filteredPoints[0].locationVector)
              .normalize();
            this.rotateAboutObjectMode = true;
            rotationObjectTypeKey = "objects.points";
            rotationObjectName = filteredPoints[0].label?.ref.shortUserName;
            this.newObjectOfRotation = true;
            this.rotationObject.selected = true;
            this.rotationObject.glowing = true;
          } else if (this.rotationObject !== null) {
            // move back to not rotating about an object mode
            //un glow and un selected the previous object of rotation
            if (this.rotationObject !== null) {
              this.rotationObject.glowing = false;
              this.rotationObject.selected = false;
              rotationObjectTypeKey = "";
              rotationObjectName = "";
              this.newObjectOfRotation = true;
              this.rotationObject = null;
              this.rotateAboutObjectMode = false;
            }
          }
        }
      } else if (this.hitSESegments.length > 0) {
        // if the rotation object is null or the rotation object id is not the first filtered point id then
        // create a new point of rotation
        if (
          this.rotationObject === null ||
          this.rotationObject.id !== this.hitSESegments[0].id
        ) {
          //un glow and unselected the previous object of rotation
          if (this.rotationObject !== null) {
            this.rotationObject.glowing = false;
            this.rotationObject.selected = false;
          }
          this.rotationObject = this.hitSESegments[0];
          this.oldAxisOfRotation.copy(this.axisOfRotation);
          this.axisOfRotation
            .copy(this.hitSESegments[0].normalVector)
            .normalize();
          this.rotateAboutObjectMode = true;
          rotationObjectTypeKey = "objects.segments";
          rotationObjectName = this.hitSESegments[0].label?.ref.shortUserName;
          this.newObjectOfRotation = true;
          this.rotationObject.selected = true;
          this.rotationObject.glowing = true;
        } else if (this.rotationObject !== null) {
          // move back to not rotating about an object mode
          //un glow and unselected the previous object of rotation
          if (this.rotationObject !== null) {
            this.rotationObject.glowing = false;
            this.rotationObject.selected = false;
            rotationObjectTypeKey = "";
            rotationObjectName = "";
            this.newObjectOfRotation = true;
            this.rotationObject = null;
            this.rotateAboutObjectMode = false;
          }
        }
      } else if (this.hitSELines.length > 0) {
        // if the rotation object is null or the rotation object id is not the first filtered point id then
        // create a new point of rotation
        if (
          this.rotationObject === null ||
          this.rotationObject.id !== this.hitSELines[0].id
        ) {
          //un glow and unselected the previous object of rotation
          if (this.rotationObject !== null) {
            this.rotationObject.glowing = false;
            this.rotationObject.selected = false;
          }
          this.rotationObject = this.hitSELines[0];
          this.oldAxisOfRotation.copy(this.axisOfRotation);
          this.axisOfRotation.copy(this.hitSELines[0].normalVector).normalize();
          this.rotateAboutObjectMode = true;
          rotationObjectTypeKey = "objects.lines";
          rotationObjectName = this.hitSELines[0].label?.ref.shortUserName;
          this.newObjectOfRotation = true;
          this.rotationObject.selected = true;
          this.rotationObject.glowing = true;
        } else if (this.rotationObject !== null) {
          // move back to not rotating about an object mode
          //un glow and unselected the previous object of rotation
          if (this.rotationObject !== null) {
            this.rotationObject.glowing = false;
            this.rotationObject.selected = false;
            rotationObjectTypeKey = "";
            rotationObjectName = "";
            this.newObjectOfRotation = true;
            this.rotationObject = null;
            this.rotateAboutObjectMode = false;
          }
        }
      }

      // display message to user if there is a new object of rotation
      if (this.newObjectOfRotation) {
        if (this.rotationObject !== null) {
          // there is a new object to rotate about
          EventBus.fire("show-alert", {
            key: `handlers.rotationObjectUpdate`,
            keyOptions: {
              type: String(
                i18n.global.t(rotationObjectTypeKey, {
                  name: rotationObjectName
                })
              ),
              name: rotationObjectName
            },
            type: "success"
          });
          this.newObjectOfRotation = false;
        } else {
          // the object of rotation has been just removed
          EventBus.fire("show-alert", {
            key: `handlers.rotationNoObjectUpdate`,
            keyOptions: {},
            type: "warning"
          });
          this.newObjectOfRotation = false;
        }
      }
    }

    // Set this variable so that rotations and momentum will happen and *originate* with a mouse pressed event in the sphere
    this.userIsRotating = true;
    this.startVector1.set(1, 0, 0); // reset it for the next rotation
    this.startVector2.set(0, 1, 0); // reset it for the next rotation
    this.startVector3.set(0, 0, 1); // reset it for the next rotation
    this.previousTime = event.timeStamp;
  }

  mouseMoved(event: MouseEvent): void {
    // Determine the current location on the sphere (on on screen) and highlight objects
    this.trackMouseLocation(event);

    if (
      this.rotationObject !== null &&
      !this.userIsRotating &&
      !this.momentumMode
    ) {
      //glow the object of rotation
      this.rotationObject.glowing = true;
    }
    // If the mouse is not on the sphere release the object of rotation and don't do anything more
    if (!this.isOnSphere) {
      if (this.rotationObject !== null) {
        //un glow and unselect the object of rotation
        this.rotationObject.glowing = false;
        this.rotationObject.selected = false;
        EventBus.fire("show-alert", {
          key: `handlers.rotationNoObjectUpdate`,
          keyOptions: {},
          type: "warning"
        });
        this.newObjectOfRotation = true;
        this.rotationObject = null;
        this.rotateAboutObjectMode = false;
      }
      return;
    }
    // Mousing moving in the sphere while it is rotating in momentum mode does nothing to the sphere
    if (this.momentumMode) return;

    // if the user is not rotating highlight lines, segments and points that the user can rotate about
    if (!this.userIsRotating) {
      super.mouseMoved(event);
      if (this.hitSEPoints.length > 0) {
        // never highlight non user created intersection points
        const filteredPoints = this.hitSEPoints.filter((p: SEPoint) => {
          if (
            (p instanceof SEIntersectionPoint && !p.isUserCreated) ||
            (p instanceof SEAntipodalPoint && !p.isUserCreated)
          ) {
            return false;
          } else {
            return true;
          }
        });
        if (filteredPoints.length > 0) filteredPoints[0].glowing = true;
      } else if (this.hitSESegments.length > 0) {
        this.hitSESegments[0].glowing = true;
      } else if (this.hitSELines.length > 0) {
        this.hitSELines[0].glowing = true;
      }
      return;
    }

    // Compute the angular change in position depending on the mode
    //  1) free rotation, 2) rotate about point, 3) rotate about line/segment 4) alt key pressed

    let rotationAngle: number;

    if (this.rotationObject === null && !event.altKey) {
      // mode 1 free rotation, measure the distance the mouse has moved or the change in angle from center of the sphere
      // rotationAngle =
      //   this.previousScreenVector.distanceTo(this.currentScreenVector) / 500;
      rotationAngle = this.previousSphereVector.angleTo(
        this.currentSphereVector
      );
    } else {
      if (this.rotationObject instanceof SEPoint && !event.altKey) {
        tmpVector1.copy(this.rotationObject.locationVector);
      } else if (
        (this.rotationObject instanceof SELine ||
          this.rotationObject instanceof SESegment) &&
        !event.altKey
      ) {
        tmpVector1.copy(this.rotationObject.normalVector);
      } else {
        // the alt key was pushed
        tmpVector1.set(0, 1, 0);
      }
      // if current or previousSphere vector is too close to the axis of rotation or axis antipode, set the angle of rotation to zero
      if (
        tmpVector2
          .crossVectors(tmpVector1, this.previousSphereVector)
          .isZero(SETTINGS.nearlyAntipodalIdeal) ||
        tmpVector3
          .crossVectors(tmpVector1, this.currentSphereVector)
          .isZero(SETTINGS.nearlyAntipodalIdeal)
      ) {
        rotationAngle = 0;
      } else {
        //project the previous/current sphere vector to the plane perpendicular to the axis of rotation (i.e. tmpVector1)
        tmpVector2.copy(this.previousSphereVector);
        tmpVector2
          .addScaledVector(
            tmpVector1,
            -1 * tmpVector1.dot(this.previousSphereVector)
          )
          .normalize();

        tmpVector3.copy(this.currentSphereVector);
        tmpVector3
          .addScaledVector(
            tmpVector1,
            -1 * tmpVector1.dot(this.currentSphereVector)
          )
          .normalize();

        rotationAngle = tmpVector2.angleTo(tmpVector3);
      }
    }

    // If the rotation is big enough and the user is rotating then perform the rotation
    if (this.userIsRotating && rotationAngle > SETTINGS.rotate.minAngle) {
      if (this.rotateAboutObjectMode || event.altKey) {
        //Determine which direction to rotate.
        tmpVector1.crossVectors(
          this.currentSphereVector,
          this.previousSphereVector
        );
        rotationAngle *= -1 * Math.sign(tmpVector1.dot(this.axisOfRotation));

        desiredZAxis.copy(this.axisOfRotation).normalize();
      } else {
        tmpVector1.crossVectors(
          this.previousSphereVector,
          this.currentSphereVector
        );
        if (tmpVector1.isZero()) {
          console.error("The old axis of rotation was used.");
          desiredZAxis.copy(this.oldAxisOfRotation).normalize();
        } else {
          this.oldAxisOfRotation.copy(tmpVector1);
          desiredZAxis.copy(tmpVector1).normalize();
        }
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

      this.startVector1
        .applyMatrix4(this.changeInPositionRotationMatrix)
        .normalize();
      this.startVector2
        .applyMatrix4(this.changeInPositionRotationMatrix)
        .normalize();
      this.startVector3
        .applyMatrix4(this.changeInPositionRotationMatrix)
        .normalize();
      // Apply the rotation to the sphere and update the display
      //#region sphereRotate
      // EventBus.fire("sphere-rotate", {
      //   transform: this.changeInPositionRotationMatrix
      // });
      RotateHandler.store.rotateSphere(this.changeInPositionRotationMatrix);
      this.saveRotationNeeded = true;
      //#endregion sphereRotate
    }
  }

  mouseReleased(event: MouseEvent): void {
    // If the user is not rotating, then either a rotation hasn't started or a rotation was recorded
    if (!this.userIsRotating) return;

    if (!this.isOnSphere) {
      // In this case, the mouseRelease was not on the sphere but the current rotation hasn't been ended, so end
      // it now and get ready for the next user action.
      if (this.saveRotationNeeded) {
        this.issueRotateSphereCommand(
          this.startVector1,
          this.startVector2,
          this.startVector3
        );
        this.saveRotationNeeded = false;
      }
      this.userIsRotating = false;
      this.momentumMode = false;
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
        this.momentumMode = true;
        this.userIsRotating = true;
        if (this.rotationObject !== null) {
          this.rotationObject.glowing = false;
        }
        this.momentum(0);
      } else {
        if (this.saveRotationNeeded) {
          // Store the rotation so it can be undone
          this.issueRotateSphereCommand(
            this.startVector1,
            this.startVector2,
            this.startVector3
          );
          this.saveRotationNeeded = false;
        }
      }
    }

    // Get ready for the next rotation event or action
    this.userIsRotating = false;
  }

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    // Make sure that the last move gets recorded in the command structure so it can be undone/redone
    if (this.userIsRotating) {
      if (this.saveRotationNeeded) {
        // In this case, the rotation was started but hasn't been recorded
        this.issueRotateSphereCommand(
          this.startVector1,
          this.startVector2,
          this.startVector3
        );
        this.saveRotationNeeded = false;
      }
    }
    this.momentumMode = false;
    this.userIsRotating = false;
    if (this.rotationObject !== null) {
      //unglow  and unselect the object of rotation
      this.rotationObject.glowing = false;
      this.rotationObject.selected = false;
    }
    this.rotationObject = null;
    this.rotateAboutObjectMode = false;
    this.newObjectOfRotation = true;
    RotateHandler.store.unglowAllSENodules();
  }

  // Delay the execution of a set of commands (but allow other threads to continue)
  // TODO: Promise<void> or Promise<number>?
  sleep(ms: number): Promise<number> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Continues to rotate the sphere after the user has stopped actively rotating
   * Pass mode and axis to this method because of this asynchronous momentum method.  While the momentum command
   * is executing, the axis and mode might have changed, so pass them as arguments to this command
   * and issue command methods
   * @param callNumber The number of times this method has been called, used to stop recursion
   */
  async momentum(callNumber: number): Promise<void> {
    // Check to see if momentum mode is still enable and the time elapsed since the first momentum call is less than the endTime
    if (this.momentumMode && callNumber * deltaT < endTime) {
      // LINEAR angular velocity
      // momentumAngle is the area under the curve y(t) = -this.derivative/endTime*t + this.derivative
      //  from t=callNum*deltaT to t=(callNum+1)*deltaT. y(t) is the angular velocity of the sphere
      //  over time. It is linear from the initial point (0,this.derivative) to (endTime,0).
      //  On input t in milliseconds the output is radians/millisecond so by the Total Change Theorem
      //  of calculus (https://activecalculus.org/single/sec-4-4-FTC.html) this area is the  total change
      //  angle over that time period.
      // this.momentumAngle =
      //   deltaT *
      //   ((-this.derivative / endTime) * (deltaT / 2.0 + 1) + this.derivative);

      // QUADRATIC angular velocity
      // momentumAngle is the area under the curve y(t) = this.derivative/endTime^2*(t-endTime)^2
      //  from t=callNum*deltaT to t=(callNum+1)*deltaT. y(t) is the angular velocity of the sphere
      //  over time. It is quadratic from the initial point (0,this.derivative) to (endTime,0) <-- vertex.
      //  On input t in milliseconds the output is radians/millisecond so by the Total Change Theorem
      //  of calculus (https://activecalculus.org/single/sec-4-4-FTC.html) this area is the  total change
      //  angle over that time period.
      this.momentumAngle =
        (this.derivative / (endTime * endTime)) *
        ((1 / 3.0) *
          ((callNumber + 1) * deltaT - endTime) *
          ((callNumber + 1) * deltaT - endTime) *
          ((callNumber + 1) * deltaT - endTime) -
          (1 / 3.0) *
            (callNumber * deltaT - endTime) *
            (callNumber * deltaT - endTime) *
            (callNumber * deltaT - endTime));

      this.changeInPositionRotationMatrix.makeRotationAxis(
        desiredZAxis,
        this.momentumAngle
      );
      this.startVector1
        .applyMatrix4(this.changeInPositionRotationMatrix)
        .normalize();
      this.startVector2
        .applyMatrix4(this.changeInPositionRotationMatrix)
        .normalize();
      this.startVector3
        .applyMatrix4(this.changeInPositionRotationMatrix)
        .normalize();
      EventBus.fire("sphere-rotate", {
        transform: this.changeInPositionRotationMatrix
      });
      this.saveRotationNeeded = true;

      await this.sleep(deltaT);
      this.momentum(callNumber + 1);
    } else {
      // Turn off momentum mode
      this.momentumMode = false;
      this.derivative = 0;
      this.userIsRotating = false;

      // turn back on the glow of the rotation object
      if (this.rotationObject !== null) {
        this.rotationObject.glowing = true;
      }
      // Store the initial to final position rotation so it can be undone
      if (this.saveRotationNeeded) {
        this.issueRotateSphereCommand(
          this.startVector1,
          this.startVector2,
          this.startVector3
        );
        this.saveRotationNeeded = false;
      }
    }
  }

  activate(): void {
    window.addEventListener("keydown", this.keyDown);
    window.addEventListener("keyup", this.keyUp);
    // If there is exactly one SEPoint/SELine/SESegment object enter the rotateAboutObjectMode
    let rotationObjectTypeKey: string | undefined = "";
    let rotationObjectName: string | undefined = "";

    if (RotateHandler.store.selectedSENodules.length == 1) {
      const object = RotateHandler.store.selectedSENodules[0];
      if (object instanceof SEPoint) {
        this.rotationObject = object;
        this.oldAxisOfRotation.copy(this.axisOfRotation);
        this.axisOfRotation.copy(object.locationVector).normalize();
        this.rotateAboutObjectMode = true;
        rotationObjectTypeKey = "objects.points";
        rotationObjectName = object.label?.ref.shortUserName;
      } else if (object instanceof SELine) {
        this.rotationObject = object;
        this.oldAxisOfRotation.copy(this.axisOfRotation);
        this.axisOfRotation.copy(object.normalVector).normalize();
        this.rotateAboutObjectMode = true;
        rotationObjectTypeKey = "objects.lines";
        rotationObjectName = object.label?.ref.shortUserName;
      } else if (object instanceof SESegment) {
        this.rotationObject = object;
        this.oldAxisOfRotation.copy(this.axisOfRotation);
        this.axisOfRotation.copy(object.normalVector).normalize();
        this.rotateAboutObjectMode = true;
        rotationObjectTypeKey = "objects.segments";
        rotationObjectName = object.label?.ref.shortUserName;
      }
      if (this.rotationObject !== null) {
        EventBus.fire("show-alert", {
          key: `handlers.rotationObjectUpdate`,
          keyOptions: {
            type: String(
              i18n.global.t(rotationObjectTypeKey, {
                name: rotationObjectName
              })
            ),
            name: rotationObjectName
          },
          type: "success"
        });
      }
    }
    // Unselect the selected objects and clear the selectedObject array
    super.activate();

    if (this.rotationObject !== null) {
      //glow and select the object of rotation
      this.rotationObject.selected = true;
      this.rotationObject.glowing = true;
    }
  }

  deactivate(): void {
    window.removeEventListener("keydown", this.keyDown);
    window.removeEventListener("keyup", this.keyUp);
    if (this.rotationObject !== null) {
      //un glow and unselect the object of rotation
      this.rotationObject.selected = false;
      this.rotationObject.glowing = false;
    }
    this.rotationObject = null;
    this.rotateAboutObjectMode = false;
  }
  /**
   * Sends a RotateSphereCommand to the Command stack
   * @param afterAllRotationsStartVector1
   * @param afterAllRotationsStartVector2
   * @param afterAllRotationsStartVector3
   */
  issueRotateSphereCommand(
    afterAllRotationsStartVector1: Vector3,
    afterAllRotationsStartVector2: Vector3,
    afterAllRotationsStartVector3: Vector3
  ): void {
    // console.log(
    //   "Issued rotate sphere command",
    //   afterAllRotationsStartVector1.length(),
    //   afterAllRotationsStartVector2.length(),
    //   afterAllRotationsStartVector3.length(),
    //   afterAllRotationsStartVector1.dot(afterAllRotationsStartVector2),
    //   afterAllRotationsStartVector2.dot(afterAllRotationsStartVector3),
    //   afterAllRotationsStartVector1.dot(afterAllRotationsStartVector3)
    // );
    // afterAllRotationsStartVector1 is the image of (1,0,0) after all rotations are applied
    // afterAllRotationsStartVector2 is the image of (0,1,0) after all rotations are applied
    // afterAllRotationsStartVector2 is the image of (0,0,1) after all rotations are applied
    // we need to form the matrix that simultaneously maps
    //  (1,0,0) to afterAllRotationsStartVector1
    //  (0,1,0) to afterAllRotationsStartVector2
    //  (0,0,1) to afterAllRotationsStartVector3
    // The columns of the matrix are simply the three vectors!

    // The rotation matrix
    this.changeInPositionRotationMatrix.makeBasis(
      afterAllRotationsStartVector1,
      afterAllRotationsStartVector2,
      afterAllRotationsStartVector3
    );

    // Store the rotation command that takes does the rotation,
    // but don't execute it because the rotation has already happened. This way the
    // rotation is in the command structure and can be undone or redone
    new RotateSphereCommand(this.changeInPositionRotationMatrix).push();
  }
}
