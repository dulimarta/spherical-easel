import Two from "two.js";
import Highlighter from "./Highlighter";
import { SEPoint } from "@/models/SEPoint";
import { SENodule } from "@/models/SENodule";
import { AddExpressionCommand } from "@/commands/AddExpressionCommand";

import EventBus from "@/eventHandlers/EventBus";
import { SECoordinate, CoordinateSelection } from "@/models/SECoordinate";

export default class PointCoordinateHandler extends Highlighter {
  /**
   * Point to inspect its coordinate
   */
  private targetPoint: SEPoint | null = null;

  constructor(layers: Two.Group[]) {
    super(layers);
  }

  mousePressed(event: MouseEvent): void {
    //Select an object to delete
    if (this.isOnSphere) {
      // In the case of multiple selections prioritize points > lines > segments > circles
      if (this.hitSEPoints.length > 0) this.targetPoint = this.hitSEPoints[0];

      if (this.targetPoint != null) {
        const xMeasure = new SECoordinate(
          this.targetPoint,
          CoordinateSelection.X_VALUE
        );
        const yMeasure = new SECoordinate(
          this.targetPoint,
          CoordinateSelection.Y_VALUE
        );
        const zMeasure = new SECoordinate(
          this.targetPoint,
          CoordinateSelection.Z_VALUE
        );
        EventBus.fire("show-alert", {
          key: `handlers.newCoordinatePointMeasurementAdded`,
          keyOptions: {},
          type: "success"
        });
        new AddExpressionCommand(xMeasure).execute();
        new AddExpressionCommand(yMeasure).execute();
        new AddExpressionCommand(zMeasure).execute();
      }
    }
  }

  mouseMoved(event: MouseEvent): void {
    console.debug("PointCoordinateeHandler -- mouseMoved");
    // Highlight all nearby objects and update location vectors
    super.mouseMoved(event);

    // Do not highlight non SEPoint objects
    this.hitSENodules
      .filter((n: SENodule) => !(n instanceof SEPoint))
      .forEach((p: SENodule) => {
        p.glowing = false;
      });
    if (this.hitSEPoints.length > 0) {
      this.targetPoint = this.hitSEPoints[0];
      // const len = this.targetPoint.arcLength;
      // this.infoText.text = `Arc length ${(len / Math.PI).toFixed(2)}\u{1D7B9}`;
    }
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {}

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    // Reset the targetPoint in preparation for another deletion.
    this.targetPoint = null;
  }
}
