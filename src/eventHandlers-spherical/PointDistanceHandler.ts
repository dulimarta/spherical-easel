import Highlighter from "./Highlighter";
import { SEPoint } from "@/models/SEPoint";
import { AddPointDistanceMeasurementCommand } from "@/commands-spherical/AddPointDistanceMeasurementCommand";
import { SEPointDistance } from "@/models/SEPointDistance";
import EventBus from "@/eventHandlers/EventBus";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { SEAntipodalPoint } from "@/models/SEAntipodalPoint";
import SETTINGS from "@/global-settings";
//import Two from "two.js";
import { Group } from "two.js/src/group";
import { CommandGroup } from "@/commands-spherical/CommandGroup";
import { SetPointUserCreatedValueCommand } from "@/commands-spherical/SetPointUserCreatedValueCommand";
import { SetNoduleDisplayCommand } from "@/commands-spherical/SetNoduleDisplayCommand";
export default class PointDistanceHandler extends Highlighter {
  /**
   * Points to measure distance
   */
  private targetPoints: SEPoint[] = [];
  // Filter the hitSEPoints appropriately for this handler
  protected filteredIntersectionPointsList: SEPoint[] = [];

  constructor(layers: Group[]) {
    super(layers);
  }

  mousePressed(event: MouseEvent): void {
    if (this.isOnSphere) {
      this.updateFilteredPointsList();
      if (this.filteredIntersectionPointsList.length > 0) {
        const pos = this.targetPoints.findIndex(
          (p: SEPoint) => p.id === this.filteredIntersectionPointsList[0].id
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
        this.targetPoints.push(this.filteredIntersectionPointsList[0]);
        // Glow and select the point, so that Highlighter.ts doesn't unglow it
        this.filteredIntersectionPointsList[0].glowing = true;
        this.filteredIntersectionPointsList[0].selected = true;
      } else {
        EventBus.fire("show-alert", {
          key: `handlers.pointDistancePointMessage`,
          keyOptions: {},
          type: "warning"
        });
        return;
      }

      if (this.targetPoints.length === 2) {
        // make sure that this pair of points has not been measured already
        this.addPointDistance(this.targetPoints[0], this.targetPoints[1]);
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
    this.updateFilteredPointsList();
    if (this.filteredIntersectionPointsList.length > 0) {
      this.filteredIntersectionPointsList[0].glowing = true;
    }
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {}

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    this.prepareForNextPointDistance();
  }
  prepareForNextPointDistance(): void {
    // Reset the target points in preparation for another measure
    this.targetPoints.forEach(p => {
      p.selected = false;
      p.glowing = false;
    });
    this.targetPoints.splice(0);
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

  addPointDistance(sePoint1: SEPoint, sePoint2: SEPoint): void {
    // make sure that this pair of points has not been measured already
    let measurementName = "";
    if (
      PointDistanceHandler.store.seExpressions.some(exp => {
        if (
          exp instanceof SEPointDistance &&
          ((exp.parents[0].name === sePoint1.name &&
            exp.parents[1].name === sePoint2.name) ||
            (exp.parents[0].name === sePoint2.name &&
              exp.parents[1].name === sePoint1.name))
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
          pt0Name: `${sePoint1.label?.ref.shortUserName}`,
          pt1Name: `${sePoint2.label?.ref.shortUserName}`,
          measurementName: `${measurementName}`
        },
        type: "error"
      });
    } else {
      const distanceMeasure = new SEPointDistance(sePoint1, sePoint2);

      EventBus.fire("show-alert", {
        key: "handler.pointDistanceMeasurementAdded",
        keyOptions: {
          pt0Name: `${sePoint1.label?.ref.shortUserName}`,
          pt1Name: `${sePoint2.label?.ref.shortUserName}`,
          measurementName: `${measurementName}`
        },
        type: "success"
      });
      const cmdGroup = new CommandGroup();
      // Check if the selected sePoint1 is a non-user created point, if so
      // since the user interacted with it, make it user created
      if (
        (sePoint1 instanceof SEIntersectionPoint ||
          sePoint1 instanceof SEAntipodalPoint) &&
        !sePoint1.isUserCreated
      ) {
        cmdGroup.addCommand(
          new SetPointUserCreatedValueCommand(
            sePoint1,
            !sePoint1.isUserCreated,
            true
          )
        );
      }
      // Check if the selected sePoint2 is a non-user created point, if so
      // since the user interacted with it, make it user created
      if (
        (sePoint2 instanceof SEIntersectionPoint ||
          sePoint2 instanceof SEAntipodalPoint) &&
        !sePoint2.isUserCreated
      ) {
        cmdGroup.addCommand(
          new SetPointUserCreatedValueCommand(
            sePoint2,
            !sePoint2.isUserCreated,
            true
          )
        );
      }
      // Check if the selected sePoint1 is showing, if so
      // since the user interacted with it, make it show
      if (sePoint1 != null && !sePoint1.showing) {
        cmdGroup.addCommand(
          new SetNoduleDisplayCommand(sePoint1, !sePoint1.showing)
        );
      }
      // Check if the selected sePoint2 is showing, if so
      // since the user interacted with it, make it show
      if (sePoint2 != null && !sePoint2.showing) {
        cmdGroup.addCommand(
          new SetNoduleDisplayCommand(sePoint2, !sePoint2.showing)
        );
      }
      // add the measure
      cmdGroup
        .addCommand(
          new AddPointDistanceMeasurementCommand(distanceMeasure, [
            sePoint1,
            sePoint2
          ])
        )
        .execute();
    }
  }

  activate(): void {
    if (PointDistanceHandler.store.selectedSENodules.length == 2) {
      const object1 = PointDistanceHandler.store.selectedSENodules[0];
      const object2 = PointDistanceHandler.store.selectedSENodules[1];

      if (
        object1 instanceof SEPoint &&
        object2 instanceof SEPoint &&
        object1 !== object2
      ) {
        this.addPointDistance(object1, object2);
      }
    }
    // else if (PointDistanceHandler.store.sePoints.length < 2) {
    //   //pointDistanceHandlerNoPoint: "Before using this tool you must create at least two points.",
    //   EventBus.fire("show-alert", {
    //     key: `handlers.pointDistanceHandlerNoPoint`,
    //     type: "error"
    //   });
    //   PointDistanceHandler.store.setActionMode({
    //     id: "point",
    //     name: "CreatePointDisplayedName"
    //   });
    // }
    //Unselect the selected objects and clear the selectedObject array
    super.activate();
  }
  deactivate(): void {
    super.deactivate();
    this.prepareForNextPointDistance();
  }
}
