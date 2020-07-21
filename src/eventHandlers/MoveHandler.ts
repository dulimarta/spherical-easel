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
import { MoveLineCommand } from "@/commands/MoveLineCommand";
import { MoveSegmentCommand } from "@/commands/MoveSegmentCommand";
// import { MoveCircleCommand } from "@/commands/MoveCircleCommand";
import {
  SaveStateMode,
  SaveStateType,
  ObjectSaveState,
  LineSaveState,
  SegmentSaveState,
  PointSaveState
} from "@/types";
import { CommandGroup } from "@/commands/CommandGroup";

const tmpVector1 = new Vector3();
const tmpVector2 = new Vector3();
const desiredZAxis = new Vector3();
const tmpMatrix = new Matrix4();

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
   * Objects that define the moved objects before and after moving (for undoing moved points, circles, segments, lines)
   */
  //#region beforeSaveState
  private beforeMoveState: SaveStateType = {
    mode: SaveStateMode.UndoMove,
    stateArray: []
  };
  //#endregion beforeSaveState
  private afterMoveState: SaveStateType = {
    mode: SaveStateMode.UndoMove,
    stateArray: []
  };
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

  mousePressed(event: MouseEvent) {
    // if mouse press is not on the sphere do not
    if (!this.isOnSphere) return;
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
        // Store the state of the freePoints, segments and lines before the move
        this.moveTarget.update(this.beforeMoveState);
        return;
      }
      //If the user tries to move a nonFree point, nothing should happen
      if (this.hitSEPoints.length == 0) {
        const freeLines = this.hitSELines.filter(n => n.isFreeToMove());
        if (freeLines.length > 0) {
          this.moveTarget = freeLines[0];
          // Store the state of the freePoints, segments and lines before the move
          (this.moveTarget as SELine).startSEPoint.update(this.beforeMoveState);
          (this.moveTarget as SELine).endSEPoint.update(this.beforeMoveState);
          return;
        }
        const freeSegments = this.hitSESegments.filter(n => n.isFreeToMove());
        if (freeSegments.length > 0) {
          this.moveTarget = freeSegments[0];
          // Store the state of the freePoints, segments and lines before the move
          (this.moveTarget as SESegment).startSEPoint.update(
            this.beforeMoveState
          );
          (this.moveTarget as SESegment).endSEPoint.update(
            this.beforeMoveState
          );
          return;
        }

        const freeCircles = this.hitSECircles.filter(n => n.isFreeToMove());
        if (freeCircles.length > 0) {
          this.moveTarget = freeCircles[0];
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
        // Update the display based on the new location of the point
        //#region displayOnlyUpdate
        this.moveTarget.update({
          mode: SaveStateMode.DisplayOnly,
          stateArray: []
        });
        //#endregion displayOnlyUpdate
      } else if (
        this.moveTarget instanceof SELine ||
        this.moveTarget instanceof SESegment
      ) {
        // Move the selected SELine or SESegment, move updates the display
        //this.moveTarget.ref.normalDisplay();
        this.moveTarget.move(
          this.previousSphereVector,
          this.currentSphereVector,
          event.altKey,
          event.ctrlKey
        );
      } else if (this.moveTarget instanceof SECircle) {
        // Move the selected SECircle, move also updates the display
        //this.moveTarget.ref.normalDisplay();
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
  public isLineSaveState(entry: ObjectSaveState): entry is LineSaveState {
    return entry.kind === "line";
  }
  public isSegmentSaveState(entry: ObjectSaveState): entry is SegmentSaveState {
    return entry.kind === "segment";
  }
  public isPointSaveState(entry: ObjectSaveState): entry is PointSaveState {
    return entry.kind === "point";
  }
  mouseReleased(event: MouseEvent) {
    if (!this.movingSomething) return;

    if (this.moveTarget == null && this.rotateSphere) {
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
      // Gather the after state of the freePoints, segments, and lines after the move
      if (this.moveTarget instanceof SEPoint) {
        this.moveTarget.update(this.afterMoveState);
      } else if (this.moveTarget instanceof SESegment) {
        this.moveTarget.startSEPoint.update(this.afterMoveState);
        this.moveTarget.endSEPoint.update(this.afterMoveState);
      } else if (this.moveTarget instanceof SELine) {
        this.moveTarget.startSEPoint.update(this.afterMoveState);
        this.moveTarget.endSEPoint.update(this.afterMoveState);
      } else if (this.moveTarget instanceof SECircle) {
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
        // console.log(
        //   "is point",
        //   this.isPointSaveState(entry),
        //   entry,
        //   "index",
        //   index
        // );
        if (this.isPointSaveState(entry)) {
          const beforeLocationVector = new Vector3(
            entry.locationVectorX,
            entry.locationVectorY,
            entry.locationVectorZ
          );
          const afterLocationVector = new Vector3(
            (this.afterMoveState.stateArray[
              index
            ] as PointSaveState).locationVectorX,
            (this.afterMoveState.stateArray[
              index
            ] as PointSaveState).locationVectorY,
            (this.afterMoveState.stateArray[
              index
            ] as PointSaveState).locationVectorZ
          );
          // console.log(
          //   "here point command",
          //   beforeLocationVector,
          //   afterLocationVector
          // );
          if (
            !tmpVector1
              .subVectors(beforeLocationVector, afterLocationVector)
              .isZero()
          ) {
            moveCommandGroup.addCommand(
              new MovePointCommand(
                entry.object,
                beforeLocationVector,
                afterLocationVector
              )
            );
          }
        } else if (this.isLineSaveState(entry)) {
          const beforeNormalVector = new Vector3(
            entry.normalVectorX,
            entry.normalVectorY,
            entry.normalVectorZ
          );
          const afterNormalVector = new Vector3(
            (this.afterMoveState.stateArray[
              index
            ] as LineSaveState).normalVectorX,
            (this.afterMoveState.stateArray[
              index
            ] as LineSaveState).normalVectorY,
            (this.afterMoveState.stateArray[
              index
            ] as LineSaveState).normalVectorZ
          );
          // Include a command if the normal vector have changed
          if (
            !tmpVector1
              .subVectors(beforeNormalVector, afterNormalVector)
              .isZero()
          ) {
            moveCommandGroup.addCommand(
              new MoveLineCommand(
                entry.object as SELine,
                beforeNormalVector,
                afterNormalVector
              )
            );
          }
        } else if (this.isSegmentSaveState(entry)) {
          //console.log("here SESegment");
          const beforeNormalVector = new Vector3(
            entry.normalVectorX,
            entry.normalVectorY,
            entry.normalVectorZ
          );
          const afterNormalVector = new Vector3(
            (this.afterMoveState.stateArray[
              index
            ] as SegmentSaveState).normalVectorX,
            (this.afterMoveState.stateArray[
              index
            ] as SegmentSaveState).normalVectorY,
            (this.afterMoveState.stateArray[
              index
            ] as SegmentSaveState).normalVectorZ
          );
          // Include a command if the normal vectors have changed or the arcLength before/after changed from less to from bigger than Pi
          if (
            !tmpVector1
              .subVectors(beforeNormalVector, afterNormalVector)
              .isZero() ||
            (entry.arcLength < Math.PI &&
              (this.afterMoveState.stateArray[index] as SegmentSaveState)
                .arcLength > Math.PI) ||
            (entry.arcLength > Math.PI &&
              (this.afterMoveState.stateArray[index] as SegmentSaveState)
                .arcLength < Math.PI)
          ) {
            //console.log("here SESegment 2");
            moveCommandGroup.addCommand(
              new MoveSegmentCommand(
                entry.object as SESegment,
                beforeNormalVector,
                afterNormalVector,
                entry.arcLength,
                (this.afterMoveState.stateArray[
                  index
                ] as SegmentSaveState).arcLength
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
    this.beforeMoveState = { mode: SaveStateMode.UndoMove, stateArray: [] };
    this.afterMoveState = { mode: SaveStateMode.UndoMove, stateArray: [] };
  }

  mouseLeave(event: MouseEvent): void {
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

  activate(): void {
    // Unselect the selected objects and clear the selectedObject array
    super.activate();
  }
}
