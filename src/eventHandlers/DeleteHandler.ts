import Two from "two.js";
import Highlighter from "./Highlighter";
import { SENodule } from "@/models/SENodule";
import {
  isPerpendicularLineThruPointState,
  UpdateMode,
  UpdateStateType
} from "@/types";
import { CommandGroup } from "@/commands/CommandGroup";
import { DeleteNoduleCommand } from "@/commands/DeleteNoduleCommand";
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { SECircle } from "@/models/SECircle";

export default class DeleteHandler extends Highlighter {
  /**
   * Object to delete - the victim!
   */
  private victim: SENodule | null = null;

  /**
   * Objects that define the deleted objects (and all descendants) before deleting (for undoing delete)
   */
  private beforeDeleteState: UpdateStateType = {
    mode: UpdateMode.RecordStateForDelete,
    stateArray: []
  };

  constructor(layers: Two.Group[]) {
    super(layers);
  }

  mousePressed(event: MouseEvent): void {
    //Select an object to delete
    if (this.isOnSphere) {
      // In the case of multiple selections prioritize points > lines > segments > circles > labels
      // Deleting an object deletes all objects that depend on that object including the label
      if (this.hitSEPoints.length > 0) {
        if (
          !(this.hitSEPoints[1] instanceof SEIntersectionPoint) ||
          (this.hitSEPoints[1] as SEIntersectionPoint).isUserCreated
        ) {
          this.victim = this.hitSEPoints[0];
        }
      } else if (this.hitSELines.length > 0) {
        this.victim = this.hitSELines[0];
      } else if (this.hitSESegments.length > 0) {
        this.victim = this.hitSESegments[0];
      } else if (this.hitSECircles.length > 0) {
        this.victim = this.hitSECircles[0];
      } else if (this.hitSELabels.length > 0) {
        // Do not allow deletion of labels - if a user selects a label with this tool, merely hide the label.
        new SetNoduleDisplayCommand(this.hitSELabels[0], false).execute();
      }

      if (this.victim != null) {
        // Do the deletion
        this.delete(this.victim);
        this.victim = null;
        // Reset the beforeDeleteState
        this.beforeDeleteState = {
          mode: UpdateMode.RecordStateForDelete,
          stateArray: []
        };
      }
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Highlight all nearby objects and update location vectors
    super.mouseMoved(event);
    // only one object at a time can be deleted, so unglow others if there are multiple objects glowing
    // but prioritize points, if there is a point nearby, assume the user wants it to be the selection to delete
    if (this.hitSEPoints.length === 0) {
      if (this.hitSENodules.length > 1) {
        for (let i = 1; i < this.hitSENodules.length; i++) {
          this.hitSENodules[i].glowing = false;
        }
      }
      // there is another case here if the nearby point is an intersection point that is not user created, then the first other object should be glowing
    } else {
      if (this.hitSEPoints.length > 1) {
        for (let i = 1; i < this.hitSEPoints.length; i++) {
          this.hitSEPoints[i].glowing = false;
        }
      }
      // do not allow the user to delete an intersection point that has not been user created
      if (this.hitSEPoints[0] instanceof SEIntersectionPoint) {
        if (!(this.hitSEPoints[0] as SEIntersectionPoint).isUserCreated) {
          this.hitSEPoints[0].glowing = false;
        }
      }
      this.hitSECircles.forEach((obj: SENodule) => {
        obj.glowing = false;
      });
      this.hitSESegments.forEach((obj: SENodule) => {
        obj.glowing = false;
      });
      this.hitSELines.forEach((obj: SENodule) => {
        obj.glowing = false;
      });
      this.hitSELabels.forEach((obj: SENodule) => {
        obj.glowing = false;
      });
    }
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {}

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    // Reset the victim in preparation for another deletion.
    this.victim = null;
    // Reset the beforeDeleteState
    this.beforeDeleteState = {
      mode: UpdateMode.RecordStateForDelete,
      stateArray: []
    };
  }
  activate(): void {
    // Delete all selected objects
    this.hitSENodules.forEach(object => this.delete(object));
    // Unselect the selected objects and clear the selectedObject array
    super.activate();
  }
  deactivate(): void {
    super.deactivate();
  }

  delete(victim: SENodule): void {
    // First mark all children of the victim out of date so that the update method does a topological sort
    victim.markKidsOutOfDate();
    //Record the state of the victim and all the SENodules that depend on it (i.e kids, grandKids, etc..).
    victim.update(this.beforeDeleteState);

    // console.log("order of states before reverse");
    // this.beforeDeleteState.stateArray.forEach(obj =>
    //   console.log(obj.object.name)
    // );
    // console.log("end order");

    const deleteCommandGroup = new CommandGroup();
    // The update method orders the objects from the victim to the leaf (i.e objects with only in arrows)
    // To delete remove from the leaves to the victim (and to undo build from the victim to leaves -- accomplished
    // by the command group reversing the order on restore()).  Therefore reverse the stateArray.
    this.beforeDeleteState.stateArray.reverse();
    this.beforeDeleteState.stateArray.forEach(element => {
      deleteCommandGroup.addCommand(new DeleteNoduleCommand(element.object));
    });
    deleteCommandGroup.execute();
  }
}
