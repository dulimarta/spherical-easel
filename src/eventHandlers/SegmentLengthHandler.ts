//import Two from "two.js";
import { Group } from "two.js/src/group";
import Highlighter from "./Highlighter";
import { SESegment } from "@/models/SESegment";
import { AddLengthMeasurementCommand } from "@/commands/AddLengthMeasurementCommand";
import { SESegmentLength } from "@/models/SESegmentLength";
import EventBus from "@/eventHandlers/EventBus";
import SETTINGS from "@/global-settings";
import { CommandGroup } from "@/commands/CommandGroup";
import { StyleNoduleCommand } from "@/commands/StyleNoduleCommand";
import { StyleCategory } from "@/types/Styles";
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";
import { LabelDisplayMode, ValueDisplayMode } from "@/types";
import { SetValueDisplayModeCommand } from "@/commands/SetValueDisplayModeCommand";
import { PreferenceRef } from "../utils/preferenceRef";

export default class SegmentLengthHandler extends Highlighter {
  constructor(layers: Group[]) {
    super(layers);
  }

  mousePressed(event: MouseEvent): void {
    //Select an object to measure
    if (this.isOnSphere) {
      if (this.hitSESegments.length > 0) {
        this.addSegmentLengthMeasure(this.hitSESegments[0]);
      }
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Find all the nearby (hitSE... objects) and update location vectors
    super.mouseMoved(event);

    const segmentList = this.hitSESegments.filter(seg => {
      if (
        SegmentLengthHandler.store.seExpressions.some(
          exp =>
            exp instanceof SESegmentLength && exp.seSegment.name === seg.name
        )
      ) {
        return false;
      } else {
        return true;
      }
    });
    if (segmentList.length > 0) {
      // Glow the first SESegment that hasn't been measured
      segmentList[0].glowing = true;
      const len = segmentList[0].arcLength;
      this.infoText.text = `Arc length ${(len / Math.PI).toFixed(
        PreferenceRef.instance.hierarchyDecimalPrecision ?? SETTINGS.decimalPrecision
      )}\u{1D7B9}`;
    }
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {}

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
  }

  addSegmentLengthMeasure(targetSegment: SESegment): void {
    let measurementName = "";
    if (
      SegmentLengthHandler.store.seExpressions.some(exp => {
        if (
          exp instanceof SESegmentLength &&
          exp.seSegment.name === targetSegment.name
        ) {
          measurementName = exp.name;
          return true;
        } else {
          return false;
        }
      })
    ) {
      EventBus.fire("show-alert", {
        key: `handlers.duplicateSegmentMeasurement`,
        keyOptions: {
          segName: `${targetSegment.label?.ref.shortUserName}`,
          measurementName: `${measurementName}`
        },
        type: "error"
      });
    } else {
      const lenMeasure = new SESegmentLength(targetSegment);
      EventBus.fire("show-alert", {
        key: `newSegmentMeasurementAdded`,
        keyOptions: { name: `${lenMeasure.name}` },
        type: "success"
      });
      //lenMeasure.shallowUpdate();

      const segmentCommandGroup = new CommandGroup();
      segmentCommandGroup.addCommand(
        new AddLengthMeasurementCommand(lenMeasure, targetSegment)
      );
      // Set the selected segment's Label to display and to show NameAndValue in an undoable way
      if (targetSegment.label) {
        if (!targetSegment.label.showing) {
          segmentCommandGroup.addCommand(
            new SetNoduleDisplayCommand(targetSegment.label, true)
          );
        }
        segmentCommandGroup.addCommand(
          new StyleNoduleCommand(
            [targetSegment.label.ref],
            StyleCategory.Label,
            [
              {
                labelDisplayMode: SETTINGS.segment.measuringChangesLabelModeTo
              }
            ],
            [
              {
                labelDisplayMode: targetSegment.label.ref.labelDisplayMode
              }
            ]
          )
        );
        if (Highlighter.store.isEarthMode) {
          const newValueDisplayMode =
            SETTINGS.earthMode.defaultEarthModeUnits === "km"
              ? ValueDisplayMode.EarthModeKilos
              : ValueDisplayMode.EarthModeMiles;
          if (newValueDisplayMode !== lenMeasure.valueDisplayMode) {
            segmentCommandGroup.addCommand(
              new SetValueDisplayModeCommand(
                lenMeasure,
                lenMeasure.valueDisplayMode,
                newValueDisplayMode
              )
            );
          }
        }
      }
      segmentCommandGroup.execute();
      // make the change show up in the sphere
      targetSegment.markKidsOutOfDate();
      targetSegment.update();
    }
  }
  activate(): void {
    if (SegmentLengthHandler.store.selectedSENodules.length == 1) {
      const object1 = SegmentLengthHandler.store.selectedSENodules[0];
      if (object1 instanceof SESegment) {
        this.addSegmentLengthMeasure(object1);
      }
    }
    // Unselect the selected objects and clear the selectedObject array
    super.activate();
  }
  deactivate(): void {
    super.deactivate();
  }
}
