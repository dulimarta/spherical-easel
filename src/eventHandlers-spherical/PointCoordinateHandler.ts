import Highlighter from "./Highlighter";
import { SEPoint } from "@/models-spherical/SEPoint";
import { SENodule } from "@/models-spherical/SENodule";
import { AddPointCoordinateMeasurementCommand } from "@/commands-spherical/AddPointCoordinateMeasurementCommand";
import SETTINGS from "@/global-settings-spherical";
import EventBus from "@/eventHandlers-spherical/EventBus";
import {
  SEPointCoordinate,
  CoordinateSelection
} from "@/models-spherical/SEPointCoordinate";
import { SEIntersectionPoint } from "@/models-spherical/SEIntersectionPoint";
import { CommandGroup } from "@/commands-spherical/CommandGroup";
import { StyleNoduleCommand } from "@/commands-spherical/StyleNoduleCommand";
import { StyleCategory } from "@/types/Styles";
import { SetNoduleDisplayCommand } from "@/commands-spherical/SetNoduleDisplayCommand";
import { SEAntipodalPoint } from "@/models-spherical/SEAntipodalPoint";
//import Two from "two.js";
import { Group } from "two.js/src/group";
import { SetPointUserCreatedValueCommand } from "@/commands-spherical/SetPointUserCreatedValueCommand";
export default class PointCoordinateHandler extends Highlighter {
  /**
   * Point to inspect its coordinate
   */
  private targetPoint: SEPoint | null = null;

  // Filter the hitSEPoints appropriately for this handler
  protected filteredIntersectionPointsList: SEPoint[] = [];
  constructor(layers: Group[]) {
    super(layers);
  }

  mousePressed(event: MouseEvent): void {
    //Select a point to examine its coordinates
    if (this.isOnSphere) {
      // only select non-user created points and not measured point coordinates
      this.updateFilteredPointsList();
      if (this.filteredIntersectionPointsList.length > 0) {
        this.targetPoint = this.filteredIntersectionPointsList[0];
      } else {
        EventBus.fire("show-alert", {
          key: `handlers.pointDistancePointMessage`,
          keyOptions: {},
          type: "warning"
        });
        return;
      }

      if (
        PointCoordinateHandler.store.seExpressions.some(exp => {
          if (
            exp instanceof SEPointCoordinate &&
            exp.parents[0].name === this.targetPoint?.name
          ) {
            return true;
          } else {
            return false;
          }
        })
      ) {
        EventBus.fire("show-alert", {
          key: `handlers.duplicatePointCoordinateMeasurement`,
          keyOptions: {
            ptName: `${this.targetPoint?.label?.ref.shortUserName}`
          },
          type: "error"
        });
        return;
      }

      if (this.targetPoint != null && this.targetPoint.label !== undefined) {
        const xMeasure = new SEPointCoordinate(
          this.targetPoint,
          CoordinateSelection.X_VALUE
        );
        const yMeasure = new SEPointCoordinate(
          this.targetPoint,
          CoordinateSelection.Y_VALUE
        );
        const zMeasure = new SEPointCoordinate(
          this.targetPoint,
          CoordinateSelection.Z_VALUE
        );
        EventBus.fire("show-alert", {
          key: `handlers.newCoordinatePointMeasurementAdded`,
          keyOptions: {},
          type: "success"
        });
        const coordinatizeCommandGroup = new CommandGroup();

        if (
          (this.targetPoint instanceof SEIntersectionPoint ||
            this.targetPoint instanceof SEAntipodalPoint) &&
          !this.targetPoint.isUserCreated
        ) {
          coordinatizeCommandGroup.addCommand(
            new SetPointUserCreatedValueCommand(
              this.targetPoint,
              !this.targetPoint.isUserCreated,
              true
            )
          );
        }
        // Check if the selected targetPoint is showing, if so
        // since the user interacted with it, make it show
        if (this.targetPoint != null && !this.targetPoint.showing) {
          coordinatizeCommandGroup.addCommand(
            new SetNoduleDisplayCommand(
              this.targetPoint,
              !this.targetPoint.showing
            )
          );
        }

        coordinatizeCommandGroup.addCommand(
          new AddPointCoordinateMeasurementCommand(
            xMeasure,
            this.targetPoint,
            CoordinateSelection.X_VALUE
          )
        );
        coordinatizeCommandGroup.addCommand(
          new AddPointCoordinateMeasurementCommand(
            yMeasure,
            this.targetPoint,
            CoordinateSelection.Y_VALUE
          )
        );
        coordinatizeCommandGroup.addCommand(
          new AddPointCoordinateMeasurementCommand(
            zMeasure,
            this.targetPoint,
            CoordinateSelection.Z_VALUE
          )
        );
        // Set the selected segment's Label to display and to show NameAndValue in an undoable way
        coordinatizeCommandGroup.addCommand(
          new StyleNoduleCommand(
            [this.targetPoint.label.ref],
            StyleCategory.Label,
            [
              {
                // panel: StyleCategory.Front,
                // labelVisibility: true,
                labelDisplayMode:
                  SETTINGS.point.readingCoordinatesChangesLabelModeTo
              }
            ],
            [
              {
                // panel: StyleCategory.Front,
                // labelVisibility: this.targetPoint.label!.showing,
                labelDisplayMode: this.targetPoint.label.ref.labelDisplayMode
              }
            ]
          )
        );
        // show the label (in case the label is not shown - measureing shows it)
        coordinatizeCommandGroup.addCommand(
          new SetNoduleDisplayCommand(this.targetPoint.label, true)
        );
        coordinatizeCommandGroup.execute();
        // Update the display so the changes become apparent
        this.targetPoint.markKidsOutOfDate();
        this.targetPoint.update();
        this.targetPoint = null;
      }
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Find all the nearby (hitSE... objects) and update location vectors
    super.mouseMoved(event);

    // Do highlight only  SEPoint that are not non-user created intersection points
    this.updateFilteredPointsList();
    if (this.filteredIntersectionPointsList.length > 0) {
      this.filteredIntersectionPointsList[0].glowing = true;
    }
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {}

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    // Reset the targetPoint in preparation for another deletion.
    this.targetPoint = null;
  }

  updateFilteredPointsList(): void {
    this.filteredIntersectionPointsList = this.hitSEPoints.filter(pt => {
      if (pt instanceof SEIntersectionPoint) {
        if (pt.isUserCreated) {
          return pt.showing;
        } else {
          if (pt.principleParent1.showing && pt.principleParent2.showing) {
            return true;
          } else {
            return false;
          }
        }
      } else if (pt instanceof SEAntipodalPoint) {
        if (pt.isUserCreated) {
          return pt.showing;
        } else {
          return true;
        }
      }
      return pt.showing;
    });
  }
  activate(): void {
    // only add the measurements if the ONLY type of selected objects are SEPoints that are user created
    const onlySEPointsSelected =
      PointCoordinateHandler.store.selectedSENodules.every(
        object =>
          object instanceof SEPoint &&
          !(object instanceof SEIntersectionPoint && !object.isUserCreated) &&
          !(object instanceof SEAntipodalPoint && !object.isUserCreated)
      );

    if (
      onlySEPointsSelected &&
      PointCoordinateHandler.store.selectedSENodules.length > 0 // if selectedSENodules is empty then onlySEPointsSelected is true
    ) {
      const coordinatizeCommandGroup = new CommandGroup();
      PointCoordinateHandler.store.selectedSENodules
        .map(x => x as SENodule)
        .filter(
          (object: SENodule) =>
            object instanceof SEPoint &&
            !(object instanceof SEIntersectionPoint && !object.isUserCreated) &&
            !(object instanceof SEAntipodalPoint && !object.isUserCreated)
        )
        .forEach((p: SENodule) => {
          const xMeasure = new SEPointCoordinate(
            p as SEPoint,
            CoordinateSelection.X_VALUE
          );
          const yMeasure = new SEPointCoordinate(
            p as SEPoint,
            CoordinateSelection.Y_VALUE
          );
          const zMeasure = new SEPointCoordinate(
            p as SEPoint,
            CoordinateSelection.Z_VALUE
          );
          coordinatizeCommandGroup.addCommand(
            new AddPointCoordinateMeasurementCommand(
              xMeasure,
              p as SEPoint,
              CoordinateSelection.Z_VALUE
            )
          );
          coordinatizeCommandGroup.addCommand(
            new AddPointCoordinateMeasurementCommand(
              yMeasure,
              p as SEPoint,
              CoordinateSelection.Y_VALUE
            )
          );
          coordinatizeCommandGroup.addCommand(
            new AddPointCoordinateMeasurementCommand(
              zMeasure,
              p as SEPoint,
              CoordinateSelection.Z_VALUE
            )
          );
        });

      coordinatizeCommandGroup.execute();
      EventBus.fire("show-alert", {
        key: `handlers.newCoordinatePointMeasurementAdded`,
        keyOptions: {},
        type: "success"
      });
    }
    // Unselect the selected objects and clear the selectedObject array
    super.activate();
  }

  deactivate(): void {
    super.deactivate();
  }
}
