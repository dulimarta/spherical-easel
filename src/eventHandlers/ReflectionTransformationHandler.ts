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
import { SETransformation } from "@/models/SETransformation";
import { SETranslation } from "@/models/SETranslation";
import { AddTranslationCommand } from "@/commands/AddTranslationCommand";
import { SELine } from "@/models/SELine";
import { SEReflection } from "@/models/SEReflection";
import { AddReflectionCommand } from "@/commands/AddReflectionCommand";
export default class ReflectionTransformationHandler extends Highlighter {
  /**
   * Segment to measure
   */
  private targetLineOrSegment: SESegment | SELine | null = null;

  constructor(layers: Two.Group[]) {
    super(layers);
  }

  mousePressed(event: MouseEvent): void {
    //Select an object to reflect over
    if (
      this.isOnSphere &&
      (this.hitSELines.length > 0 || this.hitSESegments.length > 0)
    ) {
      if (this.hitSELines.length > 0) {
        this.targetLineOrSegment = this.hitSELines[0];
      } else if (this.hitSESegments.length > 0) {
        this.targetLineOrSegment = this.hitSESegments[0];
      }
      let transformationName = "";
      if (
        SEStore.seTransformations.some(trans => {
          if (
            trans instanceof SEReflection &&
            this.targetLineOrSegment !== null &&
            trans.seLineOrSegment.name === this.targetLineOrSegment.name
          ) {
            transformationName = trans.name;
            return true;
          } else {
            return false;
          }
        })
      ) {
        if (this.targetLineOrSegment instanceof SELine) {
          EventBus.fire("show-alert", {
            key: `handlers.duplicateReflectionLine`,
            keyOptions: {
              trans: `${transformationName}`
            },
            type: "error"
          });
          this.targetLineOrSegment = null;
          return;
        } else {
          EventBus.fire("show-alert", {
            key: `handlers.duplicateReflectionSegment`,
            keyOptions: {
              trans: `${transformationName}`
            },
            type: "error"
          });
          this.targetLineOrSegment = null;
          return;
        }
      }

      if (
        this.targetLineOrSegment !== null &&
        this.targetLineOrSegment.label !== undefined
      ) {
        const newReflection = new SEReflection(this.targetLineOrSegment);
        EventBus.fire("show-alert", {
          key: `handlers.newReflectionAdded`,
          keyOptions: { name: `${newReflection.name}` },
          type: "success"
        });

        new AddReflectionCommand(
          newReflection,
          this.targetLineOrSegment
        ).execute();
        // Update the display so the changes become apparent
        this.targetLineOrSegment.markKidsOutOfDate();
        this.targetLineOrSegment.update();
        this.targetLineOrSegment = null;
      }
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Find all the nearby (hitSE... objects) and update location vectors
    super.mouseMoved(event);

    const segmentList = this.hitSESegments.filter(seg => {
      if (
        SEStore.seTransformations.some(trans => {
          if (
            trans instanceof SEReflection &&
            trans.seLineOrSegment.name === seg.name
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
    const lineList = this.hitSELines.filter(seg => {
      if (
        SEStore.seTransformations.some(trans => {
          if (
            trans instanceof SEReflection &&
            trans.seLineOrSegment.name === seg.name
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
    if (lineList.length > 0) {
      // Glow the first SESegment that hasn't been measured
      lineList[0].glowing = true;
      this.targetLineOrSegment = lineList[0];
    } else if (segmentList.length > 0) {
      // Glow the first SESegment that hasn't been measured
      segmentList[0].glowing = true;
      this.targetLineOrSegment = segmentList[0];
    }
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {}

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    // Reset the targetSegment in preparation for another deletion.
    this.targetLineOrSegment = null;
  }
  activate(): void {
    if (SEStore.selectedSENodules.length == 1) {
      const object1 = SEStore.selectedSENodules[0];

      if (object1 instanceof SELine || object1 instanceof SESegment) {
        let reflectionName = "";
        if (
          SEStore.seTransformations.some(trans => {
            if (
              trans instanceof SEReflection &&
              trans.seLineOrSegment.name === object1.name
            ) {
              reflectionName = trans.name;
              return true;
            } else {
              return false;
            }
          })
        ) {
          if (object1 instanceof SELine) {
            EventBus.fire("show-alert", {
              key: `handlers.duplicateReflectionLine`,
              keyOptions: {
                trans: `${reflectionName}`
              },
              type: "error"
            });
            return;
          } else {
            EventBus.fire("show-alert", {
              key: `handlers.duplicateReflectionSegment`,
              keyOptions: {
                trans: `${reflectionName}`
              },
              type: "error"
            });
            return;
          }
        } else {
          const reflection = new SEReflection(object1);
          EventBus.fire("show-alert", {
            key: `handlers.newReflectionAdded`,
            keyOptions: { name: `${reflection.name}` },
            type: "success"
          });

          new AddReflectionCommand(reflection, object1).execute();
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
