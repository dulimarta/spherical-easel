import { Scene, Vector3, Vector4 } from "three";
import { PoseTracker } from "./PoseTracker";
import { HEPoint } from "@/models-hyperbolic/HEPoint";
import { HEOneOrTwoDimensional } from "@/types";
import { HELine } from "@/models-hyperbolic/HELine";
import { HEIntersectionPoint } from "@/models-hyperbolic/HEIntersectionPoint";
import { HEAntipodalPoint } from "@/models-hyperbolic/HEAntipodalPoint";
import { CommandGroup } from "@/commands-spherical/CommandGroup";
import { HELabel } from "@/models-hyperbolic/HELabel";
import EventBus from "@/eventHandlers-spherical/EventBus";
import { AddPointCommand } from "@/commands-hyperbolic/AddPointCommand";
import { SetPointUserCreatedValueCommand } from "@/commands-hyperbolic/SetPointUserCreatedValueCommand";
import { AddLineCommand } from "@/commands-hyperbolic/AddLineCommand";
import { PointSelectionHandler } from "./PointSelectionHandler";
import { start } from "happy-dom/lib/PropertySymbol.js";
import { vec4ToVec3 } from "@/utils/helpingHEFunctions";

export class LineHandler extends PointSelectionHandler {
  /**
   *  Mode is a number between 0 and 7, inclusive. The binary expansion of this number is three bits, the most significant tells whether the portion of the line before the start point is drawn, the second most significant bit tells whether the portion of the line between the start and end points is drawn, and the least significant bit tells whether the portion of the line after the end point is drawn. So 7 = 111 in binary means draw all portions of the line and 6 = 110 in binary means draw only the portion of the line before the start point and between the start and end points, but not after the end point, etc.
   */
  private _mode;

  private _tempLine: HELine;
  private tmp3Vector1 = new Vector3();
  private tmp3Vector2 = new Vector3();
  private tmp3Vector3 = new Vector3();
  private tmp3Vector4 = new Vector3();
  private tmp4Vector = new Vector4();

  constructor(scene: Scene, mode: number) {
    super(scene, 2);
    this._tempLine = new HELine(
      this._tempPointArray[0].tempHEPoint,
      this._tempPointArray[1].tempHEPoint,
      mode,
      false,
      true
    );
    PoseTracker.hyperStore.addTempObject(this._tempLine);
    this._mode = mode;
  }

  mouseMoved(event: MouseEvent): void {
    super.mouseMoved(event);
    // Make sure that the event is on a surface and at least one point is selected
    if (
      this.aSurfaceIsIntersected &&
      this._indexOfPointCurrentlyBeingSelected === 1
    ) {
      const activeTempPoint =
        this._tempPointArray[this._indexOfPointCurrentlyBeingSelected]
          .tempHEPoint; // To make a line the start and end vector must have same upper and lower values
      if (
        activeTempPoint.position.z * this._selectedPoints[0].locationVector.z >
        0
      ) {
        this._tempLine.setNewStartAndEndVectors(
          this._selectedPoints[0].locationVector,
          activeTempPoint.position
        );
        this.scene.add(this._tempLine.mesh);
      } else {
        // the user is not over the same upper or lower sheet as the start and the endpoint markers should be removed.
        this.scene.remove(this._tempLine.mesh);
      }
    } else {
      this.scene.remove(this._tempLine.mesh);
    }
  }

  mouseReleased(event: MouseEvent): void {
    super.mouseReleased(event);
    if (this.aSurfaceIsIntersected && this._allPointsSelected) {
      const startVector = this._selectedPoints[0].locationVector;
      const endVector = this._selectedPoints[1].locationVector;
      const bothIdeal = startVector.w == 0 && endVector.w == 0;
      const idealAngularMinimumMet = bothIdeal
        ? Math.abs(
            Math.atan2(endVector.y, endVector.x) -
              Math.atan2(startVector.y, startVector.x)
          ) > 0.1
        : false;

      const distanceMinimumMet =
        new Vector3(endVector.x, endVector.y, endVector.z).angleTo(
          new Vector3(startVector.x, startVector.y, startVector.z)
        ) > 0.1;
      console.log(
        "make line",
        startVector.toFixed(2),
        endVector.toFixed(2),
        bothIdeal,
        distanceMinimumMet
      );
      if (
        endVector.z * startVector.z > 0 && // To make a line the start and end vector must be on the same sheet
        ((bothIdeal && idealAngularMinimumMet) || distanceMinimumMet)
      ) {
        if (!this.makeLine()) {
          EventBus.fire("show-alert", {
            key: `handlers.lineCreationAttemptDuplicate`,
            keyOptions: {},
            type: "error"
          });
        }
      } else if (endVector.z * startVector.z <= 0) {
        EventBus.fire("show-alert", {
          key: `handlers.lineCreationBetweenDifferentSheets`,
          keyOptions: {},
          type: "error"
        });
      }
      // Get ready for the next line
      this.prepareForNextLine(event);
    }
  }

  mouseLeave(event: MouseEvent): void {
    this.prepareForNextLine(event);
  }
  prepareForNextLine(event: MouseEvent): void {
    this.prepareForNextPointSelections(event);
    this.scene.remove(this._tempLine.mesh);
  }

  // Create a new line from the mouse event information
  private makeLine(fromActivate = false): boolean {
    const lineCommandGroup = new CommandGroup();
    const newlyCreatedHEPoints: HEPoint[] = [];

    this.createNewPointsAsNeeded(lineCommandGroup, newlyCreatedHEPoints);

    const startHEPoint = this._selectedPoints[0].HEPoint;
    const endHEPoint = this._selectedPoints[1].HEPoint;
    if (endHEPoint && startHEPoint) {
      // Set the points for the line so that the display matches the line to be created
      this._tempLine.setNewStartAndEndVectors(
        startHEPoint.position,
        endHEPoint.position
      );
      this._tempLine.unitNormalVector
        .crossVectors(
          new Vector3(
            startHEPoint.position.x,
            startHEPoint.position.y,
            startHEPoint.position.z
          ),
          new Vector3(
            endHEPoint.position.x,
            endHEPoint.position.y,
            endHEPoint.position.z
          )
        )
        .normalize();

      // check to make sure that this line doesn't already exist
      if (!PoseTracker.hyperStore.lineIsNew(this._tempLine)) {
        return false;
      }

      const newLine = new HELine(startHEPoint, endHEPoint, this._mode);

      // compute the label location
      this.tmp4Vector
        .addVectors(startHEPoint.position, endHEPoint.position)
        .multiplyScalar(0.5);
      const zCoord = Math.sqrt(
        this.tmp4Vector.x * this.tmp4Vector.x +
          this.tmp4Vector.y * this.tmp4Vector.y +
          1
      );
      this.tmp4Vector.z = zCoord * (startHEPoint.upper ? 1 : -1);
      this.tmp4Vector.w = 1; // labels for lines are always not ideal

      // Create the label
      const newLineLabel = new HELabel(
        "line",
        newLine,
        this.tmp4Vector,
        newLine.name
      );
      newLine.setLabel(newLineLabel);

      lineCommandGroup.addCommand(
        new AddLineCommand(newLine, startHEPoint, endHEPoint, newLineLabel)
      );

      // Determine all new intersection points and add their creation to the command so it can be undone

      const intersectionPointsToUpdate: HEIntersectionPoint[] = [];

      // LineHandler.hyperStore
      //   .createAllIntersectionsWith(newHELine, newlyCreatedHEPoints)
      //   .forEach((item: HEIntersectionReturnType) => {
      //     if (item.existingIntersectionPoint) {
      //       intersectionPointsToUpdate.push(item.SEIntersectionPoint);
      //       lineCommandGroup.addCondition(() =>
      //         item.SEIntersectionPoint.canAddIntersectionOtherParentInfo(item)
      //       );
      //       lineCommandGroup.addCommand(
      //         new AddIntersectionPointOtherParentsInfo(item)
      //       );
      //       lineCommandGroup.addEndCondition();
      //     } else {
      //       // Create the plottable label
      //       const newSELabel = item.SEIntersectionPoint.attachLabelWithOffset(
      //         new Vector3(
      //           2 * SETTINGS.point.initialLabelOffset,
      //           SETTINGS.point.initialLabelOffset,
      //           0
      //         )
      //       );

      //       lineCommandGroup.addCommand(
      //         new AddIntersectionPointCommand(
      //           item.SEIntersectionPoint,
      //           item.parent1,
      //           item.parent2,
      //           newSELabel
      //         )
      //       );
      //       item.SEIntersectionPoint.showing = false; // do not display the automatically created intersection points
      //       newSELabel.showing = false;

      //       if (item.createAntipodalPoint) {
      //         LineHandler.addCreateAntipodeCommand(
      //           item.SEIntersectionPoint,
      //           lineCommandGroup
      //         );
      //       }
      //     }
      //   });
      lineCommandGroup.execute();

      // The newly added line passes through all the
      // intersection points on the intersectionPointsToUpdate list
      // This line might be a new parent to some of them
      // shallowUpdate will check this and change parents as needed
      // intersectionPointsToUpdate.forEach(pt => pt.shallowUpdate());
      // intersectionPointsToUpdate.splice(0);
    }
    return true;
  }

  activate(): void {
    // // If there are exactly two (non-antipodal and not to near each other) SEPoints selected,
    // // create a line with the two points
    // if (LineHandler.store.selectedSENodules.length == 2) {
    //   const object1 = LineHandler.store.selectedSENodules[0];
    //   const object2 = LineHandler.store.selectedSENodules[1];
    //   if (object1 instanceof SEPoint && object2 instanceof SEPoint) {
    //     this.tmpVector.crossVectors(
    //       object1.locationVector,
    //       object2.locationVector
    //     );
    //     // Check to see if the points are antipodal
    //     if (this.tmpVector.isZero(SETTINGS.nearlyAntipodalIdeal)) {
    //       // They are antipodal, create an arbitrary normal vector
    //       this.tmpVector.set(1, 0, 0);
    //       this.normalVector.crossVectors(
    //         object1.locationVector,
    //         this.tmpVector
    //       );
    //       if (this.tmpVector.isZero(SETTINGS.nearlyAntipodalIdeal)) {
    //         this.tmpVector.set(0, 1, 0);
    //         // The cross of object1.locationVector, and (1,0,0) and (0,1,0) can't *both* be zero
    //         this.normalVector.crossVectors(
    //           object1.locationVector,
    //           this.tmpVector
    //         );
    //       }
    //       this.normalVector.normalize();
    //     }
    //     this._startHEPoint = object1;
    //     this._endHEPoint = object2;
    //     if (!this.makeLine(true)) {
    //       EventBus.fire("show-alert", {
    //         key: `handlers.lineCreationAttemptDuplicate`,
    //         keyOptions: {},
    //         type: "error"
    //       });
    //     }
    //     this.prepareForNextLine();
    //   }
    //   // Unselect the selected objects and clear the selectedObject array
    //   super.activate();
    // }
  }
  deactivate(): void {
    super.deactivate();
  }
}
