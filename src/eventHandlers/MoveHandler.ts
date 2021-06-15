/** @format */

import Two from "two.js";
import { Matrix4, Vector3 } from "three";
import { SEPoint } from "@/models/SEPoint";
import { SENodule } from "@/models/SENodule";
import { SELine } from "@/models/SELine";
import { SESegment } from "@/models/SESegment";
import { SECircle } from "@/models/SECircle";
import { SELabel } from "@/models/SELabel";
import SETTINGS from "@/global-settings";
import EventBus from "./EventBus";
import { RotateSphereCommand } from "@/commands/RotateSphereCommand";
import Highlighter from "./Highlighter";
import { MovePointCommand } from "@/commands/MovePointCommand";
import { MoveLineCommand } from "@/commands/MoveLineCommand";
import { MoveSegmentCommand } from "@/commands/MoveSegmentCommand";
import { MoveLabelCommand } from "@/commands/MoveLabelCommand";
import {
  isLineState,
  isSegmentState,
  isPointState,
  isLabelState
} from "@/types";
import {
  UpdateMode,
  UpdateStateType,
  LineState,
  LabelState,
  SegmentState,
  PointState
} from "@/types";
import { CommandGroup } from "@/commands/CommandGroup";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";

const tmpVector1 = new Vector3();
// const tmpVector2 = new Vector3();
const desiredZAxis = new Vector3();
// const tmpMatrix = new Matrix4();

// public isPointOnOneDimensional(): this is SEPointOnOneDimensional {
//   return true;
// }
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
   * Objects that define the moved objects (and all descendants) states before and after moving (for undoing moving)
   * Issuing a update(this.beforeMoveState) creates an array of SENodules that is a Topological Sort and
   * records the state of certain key variables (*not* pointers to the variables) before the move so that they can be
   * compared to them after the move. If they are different we issue a MoveXXXCommand (but not executed only
   * pushed onto the undo/redo stack) to change the value.
   */
  //#region beforeSaveState
  private beforeMoveState: UpdateStateType = {
    mode: UpdateMode.RecordStateForDelete,
    stateArray: []
  };

  private afterMoveState: UpdateStateType = {
    mode: UpdateMode.RecordStateForDelete,
    stateArray: []
  };
  //#endregion beforeSaveState
  /**
   * Vectors that define the rotated sphere before and after moving (for undoing the rotate sphere)
   */
  private beforeMoveVector1 = new Vector3();
  private afterMoveVector1 = new Vector3();
  /**
   * A matrix that is used to indicate the *change* in position of sphere used only in Rotation.
   * Rotations is used when no object is selected and the user mouse presses and drags on an empty location.
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

  mousePressed(event: MouseEvent): void {
    // if mouse press is not on the sphere do not do anything
    if (!this.isOnSphere) return;
    // Reset the variables for another move event
    this.isDragging = true;
    this.moveTarget = null;
    this.rotateSphere = false;
    this.movingSomething = true;

    // Query the nearby SENodules to select the one the user wishes to move (if none the sphere rotates)
    if (this.hitSENodules.length > 0) {
      // Prioritize moving points then label then lines then segments, then circles
      const freePoints = this.hitSEPoints.filter(
        n => n.isFreeToMove() && n.showing
      );
      if (freePoints.length > 0) {
        this.moveTarget = freePoints[0];
        // First mark all children of the target out of date so that the update method does a topological sort
        this.moveTarget.markKidsOutOfDate();
        // Store the state of the freePoints, segments and lines before the move
        this.moveTarget.update(this.beforeMoveState);
        return;
      }
      const labels = this.hitSELabels.filter(
        n => n.isFreeToMove() && n.showing
      );
      if (labels.length > 0) {
        this.moveTarget = labels[0];
        // First mark all children of the target out of date so that the update method does a topological sort
        this.moveTarget.markKidsOutOfDate();
        // Store the state of the freePoints, segments and lines before the move
        this.moveTarget.update(this.beforeMoveState);
        return;
      }
      //If the user tries to move a nonFree point or object, nothing should happen -- this communicates
      //to the user they are trying to move something that can't be moved
      if (this.hitSEPoints.length == 0) {
        const freeSegments = this.hitSESegments.filter(
          n => n.isFreeToMove() && n.showing
        );
        if (freeSegments.length > 0) {
          this.moveTarget = freeSegments[0];
          // First mark all children of the target's point parents out of date so that the update method does a topological sort
          (this.moveTarget as SESegment).startSEPoint.markKidsOutOfDate();
          (this.moveTarget as SESegment).endSEPoint.markKidsOutOfDate();
          // Store the state of the freePoints, segments and lines before the move
          (this.moveTarget as SESegment).startSEPoint.update(
            this.beforeMoveState
          );
          (this.moveTarget as SESegment).endSEPoint.update(
            this.beforeMoveState
          );
          return;
        }

        const freeLines = this.hitSELines.filter(
          n => n.isFreeToMove() && n.showing
        );
        if (freeLines.length > 0) {
          this.moveTarget = freeLines[0];
          // First mark all children of the target's point parents out of date so that the update method does a topological sort
          (this.moveTarget as SELine).startSEPoint.markKidsOutOfDate();
          (this.moveTarget as SELine).endSEPoint.markKidsOutOfDate();
          // Store the state of the freePoints, segments and lines before the move
          (this.moveTarget as SELine).startSEPoint.update(this.beforeMoveState);
          (this.moveTarget as SELine).endSEPoint.update(this.beforeMoveState);
          return;
        }

        const freeCircles = this.hitSECircles.filter(
          n => n.isFreeToMove() && n.showing
        );
        if (freeCircles.length > 0) {
          this.moveTarget = freeCircles[0];
          // First mark all children of the target's point parents out of date so that the update method does a topological sort
          (this.moveTarget as SECircle).centerSEPoint.markKidsOutOfDate();
          (this.moveTarget as SECircle).circleSEPoint.markKidsOutOfDate();
          // Store the state of the freePoints, segments and lines before the move
          (this.moveTarget as SECircle).centerSEPoint.update(
            this.beforeMoveState
          );
          (this.moveTarget as SECircle).circleSEPoint.update(
            this.beforeMoveState
          );
          return;
        }
      }
    } else {
      // In this case the user mouse pressed in a location with *no* nodules (nothing was highlighted when she mouse pressed)

      // Check to see if there was an object on the back of the sphere that he was trying to
      // select but doesn't know about the shift key.  Send an alert in this case
      const sphereVec = new Vector3(
        this.currentSphereVector.x,
        this.currentSphereVector.y,
        -1 * this.currentSphereVector.z
      );
      const hitSENodules = this.store.getters
        .findNearbySENodules(sphereVec, this.currentScreenVector)
        .filter((n: SENodule) => {
          if (n instanceof SEIntersectionPoint) {
            if (!n.isUserCreated) {
              return n.exists; //You always hit automatically created intersection points if it exists
            } else {
              return n.showing && n.exists; //You can't hit hidden objects or items that don't exist
            }
          } else {
            return n.showing && n.exists; //You can't hit hidden objects or items that don't exist
          }
        });
      // if the user is not pressing the shift key and there is a nearby object on the back of the sphere, send alert
      if (!event.shiftKey && hitSENodules.length > 0) {
        EventBus.fire("show-alert", {
          key: `handlers.moveHandlerObjectOnBackOfSphere`,
          keyOptions: {},
          type: "info"
        });
      }

      this.rotateSphere = true;
      this.beforeMoveVector1.copy(this.currentSphereVector);
      EventBus.fire("show-alert", {
        key: `handlers.moveHandlerNothingSelected`,
        keyOptions: {},
        type: "warning"
      });
    }
  }

  mouseMoved(event: MouseEvent): void {
    super.mouseMoved(event);
    if (!this.isOnSphere) {
      return;
    }
    event.preventDefault();
    // highlight the objects that can be moved
    // and only the highlight the object that will be moved when the user clicks and drags
    if (!this.isDragging) {
      if (this.hitSEPoints.filter(n => n.isFreeToMove()).length > 0) {
        this.hitSEPoints[0].glowing = true;
      } else if (this.hitSELabels.filter(n => n.isFreeToMove()).length > 0) {
        this.hitSELabels[0].glowing = true;
      } else if (this.hitSEPoints.length == 0) {
        if (this.hitSESegments.filter(n => n.isFreeToMove()).length > 0) {
          this.hitSESegments[0].glowing = true;
        } else if (this.hitSELines.filter(n => n.isFreeToMove()).length > 0) {
          this.hitSELines[0].glowing = true;
        } else if (this.hitSECircles.filter(n => n.isFreeToMove()).length > 0) {
          this.hitSECircles[0].glowing = true;
        }
      }
    }
    if (this.isDragging && this.movingSomething) {
      if (this.moveTarget instanceof SEPoint) {
        // Move the selected SEPoint
        this.moveTarget.locationVector = this.currentSphereVector;
        // Update the display of the objects depending on this SEPoint based on the new location of the point
        //#region displayOnlyUpdate
        this.moveTarget.update({
          mode: UpdateMode.DisplayOnly,
          stateArray: []
        });
        //#endregion displayOnlyUpdate
      } else if (this.moveTarget instanceof SELabel) {
        // Move the selected SELabel
        this.moveTarget.locationVector = this.currentSphereVector;
        // Update the display based on the new location of the label (No need to update display because SELabels have no children.)
        // this.moveTarget.update({
        //   mode: UpdateMode.DisplayOnly,
        //   stateArray: []
        // });
      } else if (
        this.moveTarget instanceof SELine ||
        this.moveTarget instanceof SESegment
      ) {
        // Turn off the glow of the moving object - it should not glow while moving
        this.moveTarget.ref.normalDisplay();
        // Move the selected SELine or SESegment, move updates the display
        this.moveTarget.move(
          this.previousSphereVector,
          this.currentSphereVector,
          event.altKey,
          event.ctrlKey
        );
      } else if (this.moveTarget instanceof SECircle) {
        // Turn off the glow of the moving object - it should not glow while moving
        this.moveTarget.ref.normalDisplay();
        // Move the selected SECircle, move also updates the display
        this.moveTarget.move(
          this.previousSphereVector,
          this.currentSphereVector
        );
      } else if (this.moveTarget == null && this.rotateSphere) {
        // Rotate the sphere, updates the display after moving all the points.
        this.doRotateSphere();
        this.afterMoveVector1.copy(this.currentSphereVector);
      }
    }
  }

  mouseReleased(event: MouseEvent): void {
    if (!this.movingSomething) return;

    if (this.moveTarget == null && this.rotateSphere) {
      // Store the rotation of the sphere for undo/redo command.
      // Create the rotation matrix that takes beforeMoveVector1 to the afterMoveVector1 location
      const rotationAngle = this.beforeMoveVector1.angleTo(
        this.afterMoveVector1
      );
      desiredZAxis.crossVectors(this.beforeMoveVector1, this.afterMoveVector1);
      if (desiredZAxis.isZero(SETTINGS.nearlyAntipodalIdeal)) {
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
      // Gather the after state of the freePoints, segments, and lines after the move
      if (this.moveTarget instanceof SEPoint) {
        // First mark all children of the target's point parents out of date so that the update method does a topological sort
        this.moveTarget.markKidsOutOfDate();
        this.moveTarget.update(this.afterMoveState);
      } else if (this.moveTarget instanceof SELabel) {
        // First mark all children of the target's point parents out of date so that the update method does a topological sort
        this.moveTarget.markKidsOutOfDate();
        this.moveTarget.update(this.afterMoveState);
      } else if (this.moveTarget instanceof SESegment) {
        // First mark all children of the target's point parents out of date so that the update method does a topological sort
        this.moveTarget.startSEPoint.markKidsOutOfDate();
        this.moveTarget.endSEPoint.markKidsOutOfDate();
        this.moveTarget.startSEPoint.update(this.afterMoveState);
        this.moveTarget.endSEPoint.update(this.afterMoveState);
      } else if (this.moveTarget instanceof SELine) {
        // First mark all children of the target's point parents out of date so that the update method does a topological sort
        this.moveTarget.startSEPoint.markKidsOutOfDate();
        this.moveTarget.endSEPoint.markKidsOutOfDate();
        this.moveTarget.startSEPoint.update(this.afterMoveState);
        this.moveTarget.endSEPoint.update(this.afterMoveState);
      } else if (this.moveTarget instanceof SECircle) {
        // First mark all children of the target's point parents out of date so that the update method does a topological sort
        this.moveTarget.centerSEPoint.markKidsOutOfDate();
        this.moveTarget.circleSEPoint.markKidsOutOfDate();
        this.moveTarget.centerSEPoint.update(this.afterMoveState);
        this.moveTarget.circleSEPoint.update(this.afterMoveState);
      }
      // Store the move point/line/segment for undo/redo command
      const moveCommandGroup = new CommandGroup();

      // Note that the beforeMoveState and the afterMoveState were called in the
      // same order each time so the corresponding stateArrays should index the visited objects
      // in the same order (i.e. index of beforeMoveState.stateArray or afterMoveState.stateArray
      // should refer to the same object

      // Loop through the stateArray backwards! The order is really important!  The order that stateArray
      // was formed is for a do() commands, that is if we were building the move from a series of commands.
      // However, the moving is already done, so we are really building a set of commands (to push not execute!) to undo the move
      // operation which are executed in reverse order. So reverse the order here in the stateArray.
      this.beforeMoveState.stateArray.reverse();
      this.afterMoveState.stateArray.reverse();
      this.beforeMoveState.stateArray.forEach((entry, index) => {
        if (isPointState(entry)) {
          const beforeLocationVector = new Vector3(
            entry.locationVectorX,
            entry.locationVectorY,
            entry.locationVectorZ
          );

          const afterLocationVector = new Vector3(
            (this.afterMoveState.stateArray[
              index
            ] as PointState).locationVectorX,
            (this.afterMoveState.stateArray[
              index
            ] as PointState).locationVectorY,
            (this.afterMoveState.stateArray[
              index
            ] as PointState).locationVectorZ
          );
          if (
            !tmpVector1
              .subVectors(beforeLocationVector, afterLocationVector)
              .isZero(SETTINGS.nearlyAntipodalIdeal)
          ) {
            moveCommandGroup.addCommand(
              new MovePointCommand(
                entry.object,
                beforeLocationVector,
                afterLocationVector
              )
            );
          }
        } else if (isLabelState(entry)) {
          const beforeLocationVector = new Vector3(
            entry.locationVectorX,
            entry.locationVectorY,
            entry.locationVectorZ
          );

          const afterLocationVector = new Vector3(
            (this.afterMoveState.stateArray[
              index
            ] as LabelState).locationVectorX,
            (this.afterMoveState.stateArray[
              index
            ] as LabelState).locationVectorY,
            (this.afterMoveState.stateArray[
              index
            ] as LabelState).locationVectorZ
          );
          if (
            !tmpVector1
              .subVectors(beforeLocationVector, afterLocationVector)
              .isZero(SETTINGS.nearlyAntipodalIdeal)
          ) {
            moveCommandGroup.addCommand(
              new MoveLabelCommand(
                entry.object,
                beforeLocationVector,
                afterLocationVector
              )
            );
          }
        } else if (isLineState(entry)) {
          const beforeNormalVector = new Vector3(
            entry.normalVectorX,
            entry.normalVectorY,
            entry.normalVectorZ
          );
          const afterNormalVector = new Vector3(
            (this.afterMoveState.stateArray[index] as LineState).normalVectorX,
            (this.afterMoveState.stateArray[index] as LineState).normalVectorY,
            (this.afterMoveState.stateArray[index] as LineState).normalVectorZ
          );
          // Include a command if the normal vector have changed
          if (
            !tmpVector1
              .subVectors(beforeNormalVector, afterNormalVector)
              .isZero(SETTINGS.nearlyAntipodalIdeal)
          ) {
            moveCommandGroup.addCommand(
              new MoveLineCommand(
                entry.object as SELine,
                beforeNormalVector,
                afterNormalVector
              )
            );
          }
        } else if (isSegmentState(entry)) {
          const beforeNormalVector = new Vector3(
            entry.normalVectorX,
            entry.normalVectorY,
            entry.normalVectorZ
          );
          const afterNormalVector = new Vector3(
            (this.afterMoveState.stateArray[
              index
            ] as SegmentState).normalVectorX,
            (this.afterMoveState.stateArray[
              index
            ] as SegmentState).normalVectorY,
            (this.afterMoveState.stateArray[
              index
            ] as SegmentState).normalVectorZ
          );
          // Include a command if the normal vectors have changed or the arcLength before/after changed from less to from bigger than Pi
          if (
            !tmpVector1
              .subVectors(beforeNormalVector, afterNormalVector)
              .isZero(SETTINGS.nearlyAntipodalIdeal) ||
            (entry.arcLength < Math.PI &&
              (this.afterMoveState.stateArray[index] as SegmentState)
                .arcLength > Math.PI) ||
            (entry.arcLength > Math.PI &&
              (this.afterMoveState.stateArray[index] as SegmentState)
                .arcLength < Math.PI)
          ) {
            moveCommandGroup.addCommand(
              new MoveSegmentCommand(
                entry.object as SESegment,
                beforeNormalVector,
                afterNormalVector,
                entry.arcLength,
                (this.afterMoveState.stateArray[
                  index
                ] as SegmentState).arcLength
              )
            );
          }
        }
      });

      // Store the command but don't execute it as the move has already been done.
      moveCommandGroup.push();
    }
    // Set up for the next move event
    this.moveTarget = null;
    this.rotateSphere = false;
    this.movingSomething = false;
    this.isDragging = false;
    this.beforeMoveState = {
      mode: UpdateMode.RecordStateForDelete,
      stateArray: []
    };
    this.afterMoveState = {
      mode: UpdateMode.RecordStateForDelete,
      stateArray: []
    };
  }

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    // Make sure that the last move gets recorded in the command structure so it can be undone/redone
    this.mouseReleased(event);
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
