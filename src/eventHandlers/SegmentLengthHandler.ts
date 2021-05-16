import Two from "two.js";
import Highlighter from "./Highlighter";
import { SESegment } from "@/models/SESegment";
import { SENodule } from "@/models/SENodule";
import { AddExpressionCommand } from "@/commands/AddExpressionCommand";
import { SEMeasurement } from "@/models/SEMeasurement";
import { SELength } from "@/models/SELength";
import EventBus from "@/eventHandlers/EventBus";
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";

export default class SegmentLengthHandler extends Highlighter {
  /**
   * Segment to measure
   */
  private targetSegment: SESegment | null = null;

  constructor(layers: Two.Group[]) {
    super(layers);
  }

  mousePressed(event: MouseEvent): void {
    //Select an object to measure
    if (this.isOnSphere) {
      // In the case of multiple selections prioritize points > lines > segments > circles
      if (this.hitSESegments.length > 0)
        this.targetSegment = this.hitSESegments[0];

      if (this.targetSegment != null) {
        // Do the hiding via command so it will be undoable
        const lenMeasure = new SELength(this.targetSegment);
        EventBus.fire("show-alert", {
          key: `handlers.newSegmentMeasurementAdded`,
          keyOptions: { name: `${lenMeasure.name}` },
          type: "success"
        });
        new AddExpressionCommand(lenMeasure).execute();
        // this.targetSegment = null;
      }
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Find all the nearby (hitSE... objects) and update location vectors
    super.mouseMoved(event);

    // Do not highlight non SESegment objects
    this.hitSENodules
      .filter((n: SENodule) => !(n instanceof SESegment))
      .forEach((p: SENodule) => {
        p.glowing = false;
      });
    if (this.hitSESegments.length > 0) {
      this.targetSegment = this.hitSESegments[0];
      const len = this.targetSegment.arcLength;
      this.infoText.text = `Arc length ${(len / Math.PI).toFixed(2)}\u{1D7B9}`;
    }
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {}

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    // Reset the targetSegment in preparation for another deletion.
    this.targetSegment = null;
  }
  activate(): void {
    if (this.store.getters.selectedSENodules().length == 1) {
      const object1 = this.store.getters.selectedSENodules()[0];

      if (object1 instanceof SESegment) {
        const lenMeasure = new SELength(object1);
        EventBus.fire("show-alert", {
          key: `handlers.newSegmentMeasurementAdded`,
          keyOptions: { name: `${lenMeasure.name}` },
          type: "success"
        });
        new AddExpressionCommand(lenMeasure).execute();
      }
    }
    // Unselect the selected objects and clear the selectedObject array
    super.activate();
  }
  deactivate(): void {
    super.deactivate();
  }
}
