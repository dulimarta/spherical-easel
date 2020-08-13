import Two from "two.js";
import Highlighter from "./Highlighter";
import { SEPoint } from "@/models/SEPoint";
import { SENodule } from "@/models/SENodule";
import { AddMeasurementCommand } from "@/commands/AddMeasuremeent";
import { SEDistance } from "@/models/SEDistance";
import EventBus from "@/eventHandlers/EventBus";
// import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";

export default class PointDistantHandler extends Highlighter {
  /**
   * Points to measure distance
   */
  private targetPoints: SEPoint[] = [];

  constructor(layers: Two.Group[]) {
    super(layers);
  }

  mousePressed(event: MouseEvent): void {
    //Select an object to delete
    if (this.isOnSphere) {
      // In the case of multiple selections prioritize points > lines > segments > circles
      if (this.hitSEPoints.length > 0) {
        const pos = this.targetPoints.findIndex(
          (p: SEPoint) => p.id === this.hitSEPoints[0].id
        );
        if (pos >= 0) {
          EventBus.fire("show-alert", {
            text: `Duplicate point. Select anothere`,
            type: "warning"
          });
          return;
        }
        this.targetPoints.push(this.hitSEPoints[0]);
      }

      if (this.targetPoints.length === 2) {
        // Do the hiding via command so it will be undoable
        const distanceMeasure = new SEDistance(
          this.targetPoints[0],
          this.targetPoints[1]
        );
        EventBus.fire("show-alert", {
          text: `New measurement ${distanceMeasure.name} added`,
          type: "success"
        });
        new AddMeasurementCommand(distanceMeasure).execute();
        this.targetPoints.splice(0);
        // this.targetSegment = null;
      } else
        EventBus.fire("show-alert", {
          text: `Select the next point`,
          type: "info"
        });
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Highlight all nearby objects and update location vectors
    super.mouseMoved(event);

    // Do not highlight non SEPoint objects
    this.hitSENodules
      .filter((n: SENodule) => !(n instanceof SEPoint))
      .forEach((p: SENodule) => {
        p.glowing = false;
      });
    // if (this.hitSESegments.length > 0) {
    //   this.targetSegment = this.hitSESegments[0];
    //   const len = this.targetSegment.arcLength;
    //   this.infoText.text = `Arc length ${(len / Math.PI).toFixed(2)}\u{1D7B9}`;
    // }
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {}

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    // Reset the targetSegment in preparation for another deletion.
    this.targetPoints.clear();
  }

  // activate(): void {
  // this.hitSEPoints.forEach(object => {
  // new SetNoduleDisplayCommand(object, false).execute()
  // });
  // Unselect the selected objects and clear the selectedObject array
  // super.activate();
  // }
  // deactivate(): void {
  // super.deactivate();
  // }
}
