import Two from "two.js";
import Highlighter from "./Highlighter";
import { SESegment } from "@/models/SESegment";
import { AddLengthMeasurementCommand } from "@/commands/AddLengthMeasurementCommand";
import { SESegmentLength } from "@/models/SESegmentLength";
import EventBus from "@/eventHandlers/EventBus";
import SETTINGS from "@/global-settings";
import { CommandGroup } from "@/commands/CommandGroup";
import { StyleNoduleCommand } from "@/commands/StyleNoduleCommand";
import { LabelDisplayMode, StyleEditPanels } from "@/types/Styles";
import { UpdateMode } from "@/types";

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

      if (this.targetSegment != null) {
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
            [this.targetSegment.label!],
            StyleEditPanels.Front,
            [
              {
                panel: StyleEditPanels.Front,
                // labelVisibility: true,
                labelDisplayMode: SETTINGS.segment.measuringChangesLabelModeTo
              }
            ],
            [
              {
                panel: StyleEditPanels.Front,
                // labelVisibility: this.targetSegment.label!.showing,
                labelDisplayMode: this.targetSegment.label!.ref.labelDisplayMode
              }
            ]
          )
        );
        segmentCommandGroup.execute();
        // Update the display so the changes become apparent
        this.targetSegment.update({
          mode: UpdateMode.DisplayOnly,
          stateArray: []
        });
        this.targetSegment = null;
      }
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Find all the nearby (hitSE... objects) and update location vectors
    super.mouseMoved(event);

    if (this.hitSESegments.length > 0) {
      // Glow the first SESegment
      this.hitSESegments[0].glowing = true;
      this.targetSegment = this.hitSESegments[0];
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
    if (this.store.state.selectedSENodules.length == 1) {
      const object1 = this.store.state.selectedSENodules[0];

      if (object1 instanceof SESegment) {
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
            [object1.label!],
            StyleEditPanels.Front,
            [
              {
                panel: StyleEditPanels.Front,
                // labelVisibility: true,
                labelDisplayMode: LabelDisplayMode.NameAndValue
              }
            ],
            [
              {
                panel: StyleEditPanels.Front,
                // labelVisibility: object1.label!.showing,
                labelDisplayMode: object1.label!.ref.labelDisplayMode
              }
            ]
          )
        );
        segmentCommandGroup.execute();
        // make the change show up in the sphere
        object1.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
      }
    }
    // Unselect the selected objects and clear the selectedObject array
    super.activate();
  }
  deactivate(): void {
    super.deactivate();
  }
}
