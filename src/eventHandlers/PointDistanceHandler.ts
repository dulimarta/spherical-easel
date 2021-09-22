import Two from "two.js";
import Highlighter from "./Highlighter";
import { SEPoint } from "@/models/SEPoint";
import { AddPointDistanceMeasurementCommand } from "@/commands/AddPointDistanceMeasurementCommand";
import { SEPointDistance } from "@/models/SEPointDistance";
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
    if (this.isOnSphere) {
      let possibleTargetPointList: SEPoint[] = [];
      possibleTargetPointList = this.hitSEPoints.filter(
        p => !(p instanceof SEIntersectionPoint && !p.isUserCreated)
      );
      if (possibleTargetPointList.length > 0) {
        const pos = this.targetPoints.findIndex(
          (p: SEPoint) => p.id === possibleTargetPointList[0].id
        );
        if (pos >= 0) {
          // console.log("here");
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
        // make sure that this pair of points has not been measured already
        let measurementName = "";
        if (
          SEStore.expressions.some(exp => {
            if (
              exp instanceof SEPointDistance &&
              ((exp.parents[0].name === this.targetPoints[0].name &&
                exp.parents[1].name === this.targetPoints[1].name) ||
                (exp.parents[0].name === this.targetPoints[1].name &&
                  exp.parents[1].name === this.targetPoints[0].name))
            ) {
              measurementName = exp.name;
              return true;
            } else {
              return false;
            }
          })
        ) {
          EventBus.fire("show-alert", {
            key: `handlers.duplicatePointDistanceMeasurement`,
            keyOptions: {
              pt0Name: `${this.targetPoints[0].name}`,
              pt1Name: `${this.targetPoints[1].name}`,
              measurementName: `${measurementName}`
            },
            type: "error"
          });
          // reset for another distance measurement
          this.mouseLeave(event);
          return;
        }

        const distanceMeasure = new SEPointDistance(
          this.targetPoints[0],
          this.targetPoints[1]
        );
        EventBus.fire("show-alert", {
          key: `handlers.newMeasurementAdded`,
          keyOptions: { name: `${distanceMeasure.name}` },
          type: "success"
        });
        new AddPointDistanceMeasurementCommand(distanceMeasure, [
          this.targetPoints[0],
          this.targetPoints[1]
        ]).execute();
        // reset for another distance measurement
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
    // Reset the target points in preparation for another measure
    this.targetPoints.forEach(p => {
      p.selected = false;
      p.glowing = false;
    });
    this.targetPoints.splice(0);
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
        // make sure that this pair of points has not been measured already
        let measurementName = "";
        if (
          SEStore.expressions.some(exp => {
            if (
              exp instanceof SEPointDistance &&
              ((exp.parents[0].name === object1.name &&
                exp.parents[1].name === object2.name) ||
                (exp.parents[0].name === object2.name &&
                  exp.parents[1].name === object1.name))
            ) {
              measurementName = exp.name;
              return true;
            } else {
              return false;
            }
          })
        ) {
          EventBus.fire("show-alert", {
            key: `handlers.duplicatePointDistanceMeasurement`,
            keyOptions: {
              pt0Name: `${object1.name}`,
              pt1Name: `${object2.name}`,
              measurementName: `${measurementName}`
            },
            type: "error"
          });
        } else {
          const distanceMeasure = new SEPointDistance(object1, object2);

          EventBus.fire("show-alert", {
            text: `New measurement ${distanceMeasure.name} added`,
            type: "success"
          });
          new AddPointDistanceMeasurementCommand(distanceMeasure, [
            object1,
            object2
          ]).execute();
        }
      }
    }
    //Unselect the selected objects and clear the selectedObject array
    super.activate();
  }
  deactivate(): void {
    super.deactivate();
  }
}
