import Two from "two.js";
import Highlighter from "./Highlighter";
import { SESegment } from "@/models/SESegment";
import { AddLengthMeasurementCommand } from "@/commands/AddLengthMeasurementCommand";
import { SESegmentLength } from "@/models/SESegmentLength";
import EventBus from "@/eventHandlers/EventBus";
import SETTINGS from "@/global-settings";
import { CommandGroup } from "@/commands/CommandGroup";
import { StyleNoduleCommand } from "@/commands/StyleNoduleCommand";
import { StyleEditPanels } from "@/types/Styles";
import { LabelDisplayMode } from "@/types";
import { SEStore } from "@/store";
import { SEExpression } from "@/models/SEExpression";
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
      if (this.hitSESegments.length > 0) {
        this.targetSegment = this.hitSESegments[0];
      }
      let measurementName = "";
      if (
        SEStore.expressions.some(exp => {
          if (
            exp instanceof SESegmentLength &&
            this.targetSegment !== null &&
            exp.seSegment.name === this.targetSegment.name
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
            segName: `${this.targetSegment?.name}`,
            measurementName: `${measurementName}`
          },
          type: "error"
        });
        return;
      }

      if (
        this.targetSegment !== null &&
        this.targetSegment.label !== undefined
      ) {
        const lenMeasure = new SESegmentLength(this.targetSegment);
        EventBus.fire("show-alert", {
          key: `handlers.newSegmentMeasurementAdded`,
          keyOptions: { name: `${lenMeasure.name}` },
          type: "success"
        });
        const segmentCommandGroup = new CommandGroup();
        segmentCommandGroup.addCommand(
          new AddLengthMeasurementCommand(lenMeasure, this.targetSegment)
        );
        // Set the selected segment's Label to display and to show NameAndValue in an undoable way
        segmentCommandGroup.addCommand(
          new StyleNoduleCommand(
            [this.targetSegment.label.ref],
            StyleEditPanels.Label,
            [
              {
                // panel: StyleEditPanels.Front,
                // labelVisibility: true,
                labelDisplayMode: SETTINGS.segment.measuringChangesLabelModeTo
              }
            ],
            [
              {
                // panel: StyleEditPanels.Front,
                // labelVisibility: this.targetSegment.label!.showing,
                labelDisplayMode: this.targetSegment.label.ref.labelDisplayMode
              }
            ]
          )
        );
        segmentCommandGroup.addCommand(
          new SetNoduleDisplayCommand(this.targetSegment.label, true)
        );
        segmentCommandGroup.execute();
        // Update the display so the changes become apparent
        this.targetSegment.markKidsOutOfDate();
        this.targetSegment.update();
        this.targetSegment = null;
      }
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Find all the nearby (hitSE... objects) and update location vectors
    super.mouseMoved(event);

    const segmentList = this.hitSESegments.filter(seg => {
      if (
        SEStore.expressions.some(exp => {
          if (
            exp instanceof SESegmentLength &&
            exp.seSegment.name === seg.name
          ) {
            return true;
          } else {
            return false;
          }
        })
      ) {
        return false;
      } else {
        return true;
      }
    });
    if (segmentList.length > 0) {
      // Glow the first SESegment that hasn't been measured
      segmentList[0].glowing = true;
      this.targetSegment = segmentList[0];
      const len = this.targetSegment.arcLength;
      this.infoText.text = `Arc length ${(len / Math.PI).toFixed(
        SETTINGS.decimalPrecision
      )}\u{1D7B9}`;
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
    if (SEStore.selectedSENodules.length == 1) {
      const object1 = SEStore.selectedSENodules[0];

      if (object1 instanceof SESegment) {
        let measurementName = "";
        if (
          SEStore.expressions.some(exp => {
            if (
              exp instanceof SESegmentLength &&
              exp.seSegment.name === object1.name
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
              segName: `${object1.name}`,
              measurementName: `${measurementName}`
            },
            type: "error"
          });
        } else {
          const lenMeasure = new SESegmentLength(object1);
          EventBus.fire("show-alert", {
            key: `handlers.newSegmentMeasurementAdded`,
            keyOptions: { name: `${lenMeasure.name}` },
            type: "success"
          });

          const segmentCommandGroup = new CommandGroup();
          segmentCommandGroup.addCommand(
            new AddLengthMeasurementCommand(lenMeasure, object1)
          );
          // Set the selected segment's Label to display and to show NameAndValue in an undoable way
          segmentCommandGroup.addCommand(
            new StyleNoduleCommand(
              [object1.label!.ref],
              StyleEditPanels.Front,
              [
                {
                  // panel: StyleEditPanels.Front,
                  // labelVisibility: true,
                  labelDisplayMode: LabelDisplayMode.NameAndValue
                }
              ],
              [
                {
                  // panel: StyleEditPanels.Front,
                  // labelVisibility: object1.label!.showing,
                  labelDisplayMode: object1.label!.ref.labelDisplayMode
                }
              ]
            )
          );
          segmentCommandGroup.execute();
          // make the change show up in the sphere
          object1.markKidsOutOfDate();
          object1.update();
        }
      }
    }
    // Unselect the selected objects and clear the selectedObject array
    super.activate();
  }
  deactivate(): void {
    super.deactivate();
  }
}
