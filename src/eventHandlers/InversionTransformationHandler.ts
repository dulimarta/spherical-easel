import Two from "two.js";
import Highlighter from "./Highlighter";
import EventBus from "@/eventHandlers/EventBus";
import { CommandGroup } from "@/commands/CommandGroup";
import { SECircle } from "@/models/SECircle";
import { SEInversion } from "@/models/SEInversion";
import { AddInversionCommand } from "@/commands/AddInversionCommand";
import { Group } from "two.js/src/group";
export default class InversionTransformationHandler extends Highlighter {
  /**
   * Circle of inversion
   */
  private targetCircleOfInversion: SECircle | null = null;

  constructor(layers: Two.Group[]) {
    super(layers);
  }

  mousePressed(event: MouseEvent): void {
    //Select an object to measure
    if (this.isOnSphere && this.hitSECircles.length > 0) {
      this.targetCircleOfInversion = this.hitSECircles[0];
      let transformationName = "";
      if (
        InversionTransformationHandler.store.seTransformations.some(trans => {
          if (
            trans instanceof SEInversion &&
            this.targetCircleOfInversion !== null &&
            trans.seCircleOfInversion.name === this.targetCircleOfInversion.name
          ) {
            transformationName = trans.name;
            return true;
          } else {
            return false;
          }
        })
      ) {
        EventBus.fire("show-alert", {
          key: `handlers.duplicateInversion`,
          keyOptions: {
            trans: `${transformationName}`
          },
          type: "error"
        });
        return;
      }

      if (
        this.targetCircleOfInversion !== null &&
        this.targetCircleOfInversion.label !== undefined
      ) {
        const newInversion = new SEInversion(this.targetCircleOfInversion);
        EventBus.fire("show-alert", {
          key: `handlers.newInversionAdded`,
          keyOptions: { name: `${newInversion.name}` },
          type: "success"
        });
        const inversionCommandGroup = new CommandGroup();
        inversionCommandGroup.addCommand(
          new AddInversionCommand(newInversion, this.targetCircleOfInversion)
        );

        inversionCommandGroup.execute();
        // Update the display so the changes become apparent
        this.targetCircleOfInversion.markKidsOutOfDate();
        this.targetCircleOfInversion.update();
        this.targetCircleOfInversion = null;
      }
    }
    if (this.isOnSphere && this.hitSELines.length > 0) {
      //:
      // "Inversion over the line {name} is the same transformation as reflection. Use the reflection tool instead.",
      EventBus.fire("show-alert", {
        key: `handlers. greatCircleInversion`,
        keyOptions: {
          name: `${this.hitSELines[0].label?.ref.shortUserName}`
        },
        type: "error"
      });
      return;
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Find all the nearby (hitSE... objects) and update location vectors
    super.mouseMoved(event);

    const circleList = this.hitSECircles.filter(circ => {
      if (
        InversionTransformationHandler.store.seTransformations.some(trans => {
          if (
            trans instanceof SEInversion &&
            trans.seCircleOfInversion.name === circ.name
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
    if (circleList.length > 0) {
      // Glow the first SESegment that hasn't been measured
      circleList[0].glowing = true;
      this.targetCircleOfInversion = circleList[0];
    }
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {}

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    // Reset the targetSegment in preparation for another deletion.
    this.targetCircleOfInversion = null;
  }
  activate(): void {
    if (InversionTransformationHandler.store.selectedSENodules.length == 1) {
      const object1 = InversionTransformationHandler.store.selectedSENodules[0];

      if (object1 instanceof SECircle) {
        let inversionName = "";
        if (
          InversionTransformationHandler.store.seTransformations.some(trans => {
            if (
              trans instanceof SEInversion &&
              trans.seCircleOfInversion.name === object1.name
            ) {
              inversionName = trans.name;
              return true;
            } else {
              return false;
            }
          })
        ) {
          EventBus.fire("show-alert", {
            key: `handlers.duplicateInversion`,
            keyOptions: {
              trans: `${inversionName}`
            },
            type: "error"
          });
        } else {
          const inversion = new SEInversion(object1);
          EventBus.fire("show-alert", {
            key: `handlers.newInversionAdded`,
            keyOptions: { name: `${inversion.name}` },
            type: "success"
          });

          new AddInversionCommand(inversion, object1).execute();
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
