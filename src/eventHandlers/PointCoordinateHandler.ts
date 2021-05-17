import Two from "two.js";
import Highlighter from "./Highlighter";
import { SEPoint } from "@/models/SEPoint";
import { SENodule } from "@/models/SENodule";
import { AddExpressionCommand } from "@/commands/AddExpressionCommand";

import EventBus from "@/eventHandlers/EventBus";
import {
  SEPointCoordinate,
  CoordinateSelection
} from "@/models/SEPointCoordinate";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { CommandGroup } from "@/commands/CommandGroup";

export default class PointCoordinateHandler extends Highlighter {
  /**
   * Point to inspect its coordinate
   */
  private targetPoint: SEPoint | null = null;

  constructor(layers: Two.Group[]) {
    super(layers);
  }

  mousePressed(event: MouseEvent): void {
    //Select a point to examine its coordinates
    if (this.isOnSphere) {
      // only select non-user created points
      if (
        this.hitSEPoints.filter(
          p => !(p instanceof SEIntersectionPoint && !p.isUserCreated)
        ).length > 0
      ) {
        this.targetPoint = this.hitSEPoints.filter(
          p => !(p instanceof SEIntersectionPoint && !p.isUserCreated)
        )[0];
      }

      if (this.targetPoint != null) {
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
        coordinatizeCommandGroup.addCommand(
          new AddExpressionCommand(xMeasure, [this.targetPoint])
        );
        coordinatizeCommandGroup.addCommand(
          new AddExpressionCommand(yMeasure, [this.targetPoint])
        );
        coordinatizeCommandGroup.addCommand(
          new AddExpressionCommand(zMeasure, [this.targetPoint])
        );
        coordinatizeCommandGroup.execute();
        this.targetPoint = null;
      }
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Find all the nearby (hitSE... objects) and update location vectors
    super.mouseMoved(event);

    // Do highlight only  SEPoint that are not non-user created intersection points
    this.hitSEPoints.filter(
      p => !(p instanceof SEIntersectionPoint && !p.isUserCreated)
    )[0].glowing = true;
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {}

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    // Reset the targetPoint in preparation for another deletion.
    this.targetPoint = null;
  }
  activate(): void {
    // only add the measurements if the ONLY type of selected objects are SEPoints that are user created
    const onlySEPointsSelected = this.store.getters
      .selectedSENodules()
      .every(
        object =>
          object instanceof SEPoint &&
          !(
            object instanceof SEIntersectionPoint &&
            !(object as SEIntersectionPoint).isUserCreated
          )
      );

    if (
      onlySEPointsSelected &&
      this.store.getters.selectedSENodules().length > 0 // if selectedSENodules is empty then onlySEPointsSelected is true
    ) {
      const coordinatizeCommandGroup = new CommandGroup();
      this.store.getters
        .selectedSENodules()
        .filter(
          (object: SENodule) =>
            object instanceof SEPoint &&
            !(
              object instanceof SEIntersectionPoint &&
              !(object as SEIntersectionPoint).isUserCreated
            )
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
            new AddExpressionCommand(xMeasure, [p])
          );
          coordinatizeCommandGroup.addCommand(
            new AddExpressionCommand(yMeasure, [p])
          );
          coordinatizeCommandGroup.addCommand(
            new AddExpressionCommand(zMeasure, [p])
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
