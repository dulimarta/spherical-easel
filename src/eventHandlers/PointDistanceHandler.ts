import Two from "two.js";
import Highlighter from "./Highlighter";
import { SEPoint } from "@/models/SEPoint";
import { AddDistanceMeasurementCommand } from "@/commands/AddDistanceMeasurementCommand";
import { SESegmentDistance } from "@/models/SESegmentDistance";
import EventBus from "@/eventHandlers/EventBus";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { SEStore } from "@/store";
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
      const possibleTargetPointList = this.hitSEPoints.filter(
        p => !(p instanceof SEIntersectionPoint && !p.isUserCreated)
      );
      if (possibleTargetPointList.length > 0) {
        const pos = this.targetPoints.findIndex(
          (p: SEPoint) => p.id === possibleTargetPointList[0].id
        );
        if (pos >= 0) {
          EventBus.fire("show-alert", {
            key: `handlers.duplicatePointMessage`,
            keyOptions: {},
            type: "warning"
          });
          return;
        }
        this.targetPoints.push(possibleTargetPointList[0]);
        // Glow and select the point, so that Highlighter.ts doesn't unglow it
        possibleTargetPointList[0].glowing = true;
        possibleTargetPointList[0].selected = true;
      }

      if (this.targetPoints.length === 2) {
        const distanceMeasure = new SESegmentDistance(
          this.targetPoints[0],
          this.targetPoints[1]
        );
        EventBus.fire("show-alert", {
          key: `handlers.newMeasurementAdded`,
          keyOptions: { name: `${distanceMeasure.name}` },
          type: "success"
        });
        new AddDistanceMeasurementCommand(distanceMeasure, [
          this.targetPoints[0],
          this.targetPoints[1]
        ]).execute();
        this.targetPoints.splice(0);
        // reset for another distance measurement
        possibleTargetPointList[0].selected = false;
        possibleTargetPointList[1].selected = false;
        this.mouseLeave(event);
      } else
        EventBus.fire("show-alert", {
          key: `handlers.selectAnotherPoint`,
          keyOptions: {},
          type: "info"
        });
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Find all the nearby (hitSE... objects) and update location vectors
    super.mouseMoved(event);

    // Glow only the first SEPoint (must be user created)
    const hitPoints = this.hitSEPoints.filter(
      p => !(p instanceof SEIntersectionPoint && !p.isUserCreated)
    );
    if (hitPoints.length > 0) hitPoints[0].glowing = true;
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {}

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    // Reset the targetSegment in preparation for another deletion.
    this.targetPoints.forEach(p => (p.selected = false));
    this.targetPoints.clear();
  }

  activate(): void {
    if (SEStore.selectedSENodules.length == 2) {
      const object1 = SEStore.selectedSENodules[0];
      const object2 = SEStore.selectedSENodules[1];

      if (
        object1 instanceof SEPoint &&
        object2 instanceof SEPoint &&
        object1 !== object2
      ) {
        const distanceMeasure = new SESegmentDistance(object1, object2);

        EventBus.fire("show-alert", {
          text: `New measurement ${distanceMeasure.name} added`,
          type: "success"
        });
        new AddDistanceMeasurementCommand(distanceMeasure, [
          object1,
          object2
        ]).execute();
      }
    }
    //Unselect the selected objects and clear the selectedObject array
    super.activate();
  }
  deactivate(): void {
    super.deactivate();
  }
}
