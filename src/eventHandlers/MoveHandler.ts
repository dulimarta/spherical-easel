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
import { CommandGroup } from "@/commands/CommandGroup";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { SEEllipse } from "@/models/SEEllipse";

import { SEStore } from "@/store";
import { SEPolygon } from "@/models/SEPolygon";
import { ObjectNames, ObjectState } from "@/types";
import { SetNoduleExistCommand } from "@/commands/SetNoduleExistCommand";
import { SESlider } from "@/models/SESlider";
import { ChangeSliderCommand } from "@/commands/ChangeSliderCommand";
const tmpVector1 = new Vector3();
// const tmpVector2 = new Vector3();
const desiredZAxis = new Vector3();
// const tmpMatrix = new Matrix4();

export default class MoveHandler extends Highlighter {
  /**
   * If the user starts to move an object and mouse press at a location on the sphere, then moves
   * off the canvas, then back inside the sphere and mouse releases, we should not be moving anything. This
   * variable is to help with that. Or if the user mouse press outside the canvas and mouse releases
   * on the canvas, nothing should happen.
   */
  private movingSomething = false;

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
  private beforeMoveStateMap: Map<number, ObjectState> = new Map(); //number is the SENodule.id
  private beforeMoveSENoduleIDList: number[] = [];

  private afterMoveStateMap: Map<number, ObjectState> = new Map(); //number is the SENodule.id
  private afterMoveSENoduleIDList: number[] = [];
  //#endregion beforeSaveState
  /**
   * Vectors that define the rotated sphere before and after moving (for undoing the rotate sphere)
   */
  private beforeMoveVector = new Vector3();
  private afterMoveVector = new Vector3();
  /**
   * A matrix that is used to indicate the *change* in position of sphere used only in Rotation.
   * Rotations is used when no object is selected and the user mouse presses and drags on an empty location.
   */
  private changeInPositionRotationMatrix: Matrix4 = new Matrix4();

  constructor(layers: Two.Group[]) {
    super(layers);
  }

  mousePressed(event: MouseEvent): void {
    // if mouse press is not on the sphere do not do anything
    if (!this.isOnSphere) return;
    // Reset the variables for another move event
    this.moveTarget = null;
    this.rotateSphere = false;
    this.movingSomething = false;

    // Query the nearby SENodules to select the one the user wishes to move (if none the sphere rotates)
    if (
      this.hitSENodules.length > 0 &&
      !this.hitSENodules.every(node => node instanceof SEPolygon)
    ) {
      // Prioritize moving points then label then lines then segments, then circles
      const freePoints = this.hitSEPoints.filter(
        n => n.isFreeToMove() && n.showing
      );
      if (freePoints.length > 0) {
        this.moveTarget = freePoints[0];
        // First mark all children of the target out of date so that the update method does a topological sort
        this.moveTarget.markKidsOutOfDate();
        // Store the state of the freePoints, segments and lines before the move
        this.moveTarget.update(
          this.beforeMoveStateMap,
          this.beforeMoveSENoduleIDList
        );
        this.movingSomething = true;
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
        this.moveTarget.update(
          this.beforeMoveStateMap,
          this.beforeMoveSENoduleIDList
        );
        this.movingSomething = true;
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
            this.beforeMoveStateMap,
            this.beforeMoveSENoduleIDList
          );

          (this.moveTarget as SESegment).endSEPoint.update(
            this.beforeMoveStateMap,
            this.beforeMoveSENoduleIDList
          );

          this.movingSomething = true;

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
          (this.moveTarget as SELine).startSEPoint.update(
            this.beforeMoveStateMap,
            this.beforeMoveSENoduleIDList
          );
          (this.moveTarget as SELine).endSEPoint.update(
            this.beforeMoveStateMap,
            this.beforeMoveSENoduleIDList
          );
          this.movingSomething = true;
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
            this.beforeMoveStateMap,
            this.beforeMoveSENoduleIDList
          );
          (this.moveTarget as SECircle).circleSEPoint.update(
            this.beforeMoveStateMap,
            this.beforeMoveSENoduleIDList
          );
          this.movingSomething = true;
          return;
        }

        const freeEllipses = this.hitSEEllipses.filter(
          n => n.isFreeToMove() && n.showing
        );
        if (freeEllipses.length > 0) {
          this.moveTarget = freeEllipses[0];
          // First mark all children of the target's point parents out of date so that the update method does a topological sort
          (this.moveTarget as SEEllipse).focus1SEPoint.markKidsOutOfDate();
          (this.moveTarget as SEEllipse).focus2SEPoint.markKidsOutOfDate();
          (this.moveTarget as SEEllipse).ellipseSEPoint.markKidsOutOfDate();
          // Store the state of the freePoints, segments and lines before the move
          (this.moveTarget as SEEllipse).focus1SEPoint.update(
            this.beforeMoveStateMap,
            this.beforeMoveSENoduleIDList
          );
          (this.moveTarget as SEEllipse).focus2SEPoint.update(
            this.beforeMoveStateMap,
            this.beforeMoveSENoduleIDList
          );
          (this.moveTarget as SEEllipse).ellipseSEPoint.update(
            this.beforeMoveStateMap,
            this.beforeMoveSENoduleIDList
          );
          this.movingSomething = true;
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
      const hitSENodules = SEStore.findNearbySENodules(
        sphereVec,
        this.currentScreenVector
      ).filter((n: SENodule) => {
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
      this.beforeMoveVector.copy(this.currentSphereVector);
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
    if (!this.movingSomething && !this.rotateSphere) {
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
        } else if (
          this.hitSEEllipses.filter(n => n.isFreeToMove()).length > 0
        ) {
          this.hitSEEllipses[0].glowing = true;
        }
      }
    }
    if (this.rotateSphere || this.movingSomething) {
      if (this.moveTarget instanceof SEPoint) {
        // Move the selected SEPoint
        this.moveTarget.locationVector = this.currentSphereVector;
        // Update the display of the objects depending on this SEPoint based on the new location of the point
        //#region displayOnlyUpdate
        this.moveTarget.markKidsOutOfDate();
        this.moveTarget.update();
        //#endregion displayOnlyUpdate
      } else if (this.moveTarget instanceof SELabel) {
        // Move the selected SELabel
        this.moveTarget.locationVector = this.currentSphereVector;
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
      } else if (this.moveTarget instanceof SEEllipse) {
        // Turn off the glow of the moving object - it should not glow while moving
        this.moveTarget.ref.normalDisplay();
        // Move the selected SEEllipse, move also updates the display
        this.moveTarget.move(
          this.previousSphereVector,
          this.currentSphereVector
        );
      } else if (this.moveTarget == null && this.rotateSphere) {
        // Rotate the sphere, updates the display after moving all the points.
        this.doRotateSphere();
        this.afterMoveVector.copy(this.currentSphereVector);
      }
    }
  }

  mouseReleased(event: MouseEvent): void {
    if (!this.movingSomething && !this.rotateSphere) return;

    if (this.moveTarget == null && this.rotateSphere) {
      // Store the rotation of the sphere for undo/redo command.
      // Create the rotation matrix that takes beforeMoveVector1 to the afterMoveVector1 location
      const rotationAngle = this.beforeMoveVector.angleTo(this.afterMoveVector);
      desiredZAxis.crossVectors(this.beforeMoveVector, this.afterMoveVector);
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
        this.moveTarget.update(
          this.afterMoveStateMap,
          this.afterMoveSENoduleIDList
        );
      } else if (this.moveTarget instanceof SELabel) {
        // First mark all children of the target's point parents out of date so that the update method does a topological sort
        this.moveTarget.markKidsOutOfDate();
        this.moveTarget.update(
          this.afterMoveStateMap,
          this.afterMoveSENoduleIDList
        );
      } else if (this.moveTarget instanceof SESegment) {
        // First mark all children of the target's point parents out of date so that the update method does a topological sort
        this.moveTarget.startSEPoint.markKidsOutOfDate();
        this.moveTarget.endSEPoint.markKidsOutOfDate();
        this.moveTarget.startSEPoint.update(
          this.afterMoveStateMap,
          this.afterMoveSENoduleIDList
        );
        this.moveTarget.endSEPoint.update(
          this.afterMoveStateMap,
          this.afterMoveSENoduleIDList
        );
      } else if (this.moveTarget instanceof SELine) {
        // First mark all children of the target's point parents out of date so that the update method does a topological sort
        this.moveTarget.startSEPoint.markKidsOutOfDate();
        this.moveTarget.endSEPoint.markKidsOutOfDate();
        this.moveTarget.startSEPoint.update(
          this.afterMoveStateMap,
          this.afterMoveSENoduleIDList
        );
        this.moveTarget.endSEPoint.update(
          this.afterMoveStateMap,
          this.afterMoveSENoduleIDList
        );
      } else if (this.moveTarget instanceof SECircle) {
        // First mark all children of the target's point parents out of date so that the update method does a topological sort
        this.moveTarget.centerSEPoint.markKidsOutOfDate();
        this.moveTarget.circleSEPoint.markKidsOutOfDate();
        this.moveTarget.centerSEPoint.update(
          this.afterMoveStateMap,
          this.afterMoveSENoduleIDList
        );
        this.moveTarget.circleSEPoint.update(
          this.afterMoveStateMap,
          this.afterMoveSENoduleIDList
        );
      } else if (this.moveTarget instanceof SEEllipse) {
        // First mark all children of the target's point parents out of date so that the update method does a topological sort
        this.moveTarget.focus1SEPoint.markKidsOutOfDate();
        this.moveTarget.focus2SEPoint.markKidsOutOfDate();
        this.moveTarget.ellipseSEPoint.markKidsOutOfDate();
        this.moveTarget.focus1SEPoint.update(
          this.afterMoveStateMap,
          this.afterMoveSENoduleIDList
        );
        this.moveTarget.focus2SEPoint.update(
          this.afterMoveStateMap,
          this.afterMoveSENoduleIDList
        );
        this.moveTarget.ellipseSEPoint.update(
          this.afterMoveStateMap,
          this.afterMoveSENoduleIDList
        );
      }
      // Store the move point/line/segment for undo/redo command
      const moveCommandGroup = new CommandGroup();

      // Note that beforeMoveStateMap (and the afterMoveStateMap) were called in the
      // in such a way each one should only visit each SENodule (at most) once. The order in which these were
      // visited is recorded in the beforeSENoduleIDList (afterSENoduleIDLIst).  It is possible that
      // there are more items in the afterSENoduleIDList because of the perpendicular/tangent SEPencil can create
      // perpendicular or tangent lines (but lines or any SENodules are never deleted so it is always the case that
      //  beforeSENoduleIDList,length <= afterSENoduleIDList.length). This is why we will trace our way through the
      // afterSENoduleIDList because if we come across an object (like a perpendicular or tangent line) that is
      // in the afterMap but not the beforeMap, then the way to undo it is to make it not exist.

      // Loop through the afterSENoduleIDList backwards! The order is really important!  The order that afterSENoduleIDList
      // was formed is for a do() commands, that is if we were building the move from a series of commands.
      // However, the moving is already done, so we are really building a set of commands (to push not execute!) to undo the move
      // operation which are executed in reverse order. So reverse the order here in the afterSENoduleIDList.

      this.afterMoveSENoduleIDList.reverse();
      this.afterMoveSENoduleIDList.forEach(seNoduleID => {
        // Get the after state of the SENodule
        const seNoduleAfterState = this.afterMoveStateMap.get(seNoduleID);

        if (seNoduleAfterState === undefined) {
          throw new Error(
            `MoveHandler: afterMoveStateMap doesn't contain the SENodule id ${seNoduleID}. This should never happen.`
          );
        }

        // Get the before state of the SENodule
        const seNoduleBeforeState = this.beforeMoveStateMap.get(seNoduleID);

        if (seNoduleBeforeState === undefined) {
          // The after object was created during the move.
          // so we push a command on to the stack to undo this objects existence
          // so do to this command means the the object exists and is showing
          // to undo this command meqns the the object doesn't exist and is not showing
          moveCommandGroup.addCommand(
            new SetNoduleExistCommand(seNoduleAfterState.object, true, true)
          );
          console.log("new object was created from before to after");
        } else {
          switch (seNoduleAfterState.kind) {
            // For these three types of free objects the location vector was recorded
            case "label":
            case "pointOnOneOrTwoDimensional":
            case "point":
              // if the point moved then update its location with a command
              if (
                seNoduleAfterState.object &&
                seNoduleAfterState.locationVector &&
                seNoduleBeforeState.locationVector &&
                !tmpVector1
                  .subVectors(
                    seNoduleAfterState.locationVector,
                    seNoduleBeforeState.locationVector
                  )
                  .isZero(SETTINGS.nearlyAntipodalIdeal)
              ) {
                if (seNoduleAfterState.kind !== "label") {
                  moveCommandGroup.addCommand(
                    new MovePointCommand(
                      seNoduleAfterState.object as SEPoint,
                      seNoduleBeforeState.locationVector,
                      seNoduleAfterState.locationVector
                    )
                  );
                } else {
                  moveCommandGroup.addCommand(
                    new MoveLabelCommand(
                      seNoduleAfterState.object as SELabel,
                      seNoduleBeforeState.locationVector,
                      seNoduleAfterState.locationVector
                    )
                  );
                }
              }
              break;
            case "line":
              // if the line normal changed then moved the line with a command
              if (
                seNoduleAfterState.object &&
                seNoduleAfterState.normalVector &&
                seNoduleBeforeState.normalVector &&
                !tmpVector1
                  .subVectors(
                    seNoduleAfterState.normalVector,
                    seNoduleBeforeState.normalVector
                  )
                  .isZero(SETTINGS.nearlyAntipodalIdeal)
              ) {
                console.log("issued line move command");
                moveCommandGroup.addCommand(
                  new MoveLineCommand(
                    seNoduleAfterState.object as SELine,
                    seNoduleBeforeState.normalVector,
                    seNoduleAfterState.normalVector
                  )
                );
              }
              break;
            case "segment":
              // move the segment with a command if the arc length has changed from less than pi to bigger than pi (or vice verse)
              // or the normal has changed
              if (
                seNoduleAfterState.object &&
                seNoduleAfterState.normalVector &&
                seNoduleBeforeState.normalVector &&
                seNoduleAfterState.arcLength &&
                seNoduleBeforeState.arcLength &&
                (!tmpVector1
                  .subVectors(
                    seNoduleBeforeState.normalVector,
                    seNoduleAfterState.normalVector
                  )
                  .isZero(SETTINGS.nearlyAntipodalIdeal) ||
                  (seNoduleBeforeState.arcLength < Math.PI &&
                    seNoduleAfterState.arcLength > Math.PI) ||
                  (seNoduleBeforeState.arcLength > Math.PI &&
                    seNoduleAfterState.arcLength < Math.PI))
              ) {
                moveCommandGroup.addCommand(
                  new MoveSegmentCommand(
                    seNoduleAfterState.object as SESegment,
                    seNoduleBeforeState.normalVector,
                    seNoduleAfterState.normalVector,
                    seNoduleBeforeState.arcLength,
                    seNoduleAfterState.arcLength
                  )
                );
              }
              break;
            case "slider":
              if (
                seNoduleAfterState.object &&
                seNoduleAfterState.sliderValue &&
                seNoduleBeforeState.sliderValue &&
                seNoduleAfterState.sliderValue !==
                  seNoduleBeforeState.sliderValue
              ) {
                moveCommandGroup.addCommand(
                  new ChangeSliderCommand(
                    seNoduleAfterState.object as SESlider,
                    seNoduleAfterState.sliderValue,
                    seNoduleBeforeState.sliderValue
                  )
                );
              }
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
    this.beforeMoveStateMap.clear();
    this.beforeMoveSENoduleIDList.splice(0);
    this.afterMoveStateMap.clear();
    this.afterMoveSENoduleIDList.splice(0);
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
