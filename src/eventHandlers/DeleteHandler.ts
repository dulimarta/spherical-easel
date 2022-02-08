import Two from "two.js";
import Highlighter from "./Highlighter";
import { SENodule } from "@/models/SENodule";
import { ObjectState } from "@/types";
import { CommandGroup } from "@/commands/CommandGroup";
import { DeleteNoduleCommand } from "@/commands/DeleteNoduleCommand";
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { SEPoint } from "@/models/SEPoint";
import { SEStore } from "@/store";
import EventBus from "@/eventHandlers/EventBus";
import { ConvertUserCreatedInterToNotUserCreatedCommand } from "@/commands/ConvertUserCreatedInterToNotUserCreatedCommand";

export default class DeleteHandler extends Highlighter {
  /**
   * Object to delete - the victim!
   */
  private victim: SENodule | null = null;

  /**
   * Objects that define the deleted objects (and all descendants) before deleting (for undoing delete)
   */

  private beforeDeleteStateMap: Map<number, ObjectState> = new Map(); //number is the SENodule.id
  private beforeDeleteSENoduleIDList: number[] = [];

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
          !(this.hitSEPoints[0] instanceof SEIntersectionPoint) ||
          (this.hitSEPoints[0] as SEIntersectionPoint).isUserCreated
        ) {
          this.victim = this.hitSEPoints[0];
        }
      } else if (this.hitSELines.length > 0) {
        this.victim = this.hitSELines[0];
      } else if (this.hitSESegments.length > 0) {
        this.victim = this.hitSESegments[0];
      } else if (this.hitSECircles.length > 0) {
        this.victim = this.hitSECircles[0];
      } else if (this.hitSEEllipses.length > 0) {
        this.victim = this.hitSEEllipses[0];
      } else if (this.hitSEParametrics.length > 0) {
        this.victim = this.hitSEParametrics[0];
      } else if (this.hitSELabels.length > 0) {
        // Do not allow deletion of labels - if a user selects a label with this tool, merely hide the label.
        new SetNoduleDisplayCommand(this.hitSELabels[0], false).execute();
      } else if (this.hitSEAngleMarkers.length > 0) {
        this.victim = this.hitSEAngleMarkers[0];
      } else if (this.hitSEPolygons.length > 0) {
        this.victim = this.hitSEPolygons[0];
      }

      if (this.victim != null) {
        // Do the deletion
        this.delete(this.victim);

        // Reset the beforeDeleteState
        this.mouseLeave(event);
      }
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Find all the nearby (hitSE... objects) and update location vectors
    super.mouseMoved(event);
    // only one object at a time can be deleted so only glow the potential victim
    // prioritize points, if there is a point nearby, assume the user wants it to be the selection to delete
    if (this.hitSEPoints.length > 0) {
      // never highlight non user created intersection points
      const filteredPoints = this.hitSEPoints.filter((p: SEPoint) => {
        if (p instanceof SEIntersectionPoint && !p.isUserCreated) {
          return false;
        } else {
          return true;
        }
      });
      if (filteredPoints.length > 0) filteredPoints[0].glowing = true;
    } else if (this.hitSESegments.length > 0) {
      this.hitSESegments[0].glowing = true;
    } else if (this.hitSELines.length > 0) {
      this.hitSELines[0].glowing = true;
    } else if (this.hitSECircles.length > 0) {
      this.hitSECircles[0].glowing = true;
    } else if (this.hitSEEllipses.length > 0) {
      this.hitSEEllipses[0].glowing = true;
    } else if (this.hitSELabels.length > 0) {
      this.hitSELabels[0].glowing = true;
    } else if (this.hitSEAngleMarkers.length > 0) {
      this.hitSEAngleMarkers[0].glowing = true;
    } else if (this.hitSEParametrics.length > 0) {
      this.hitSEParametrics[0].glowing = true;
    } else if (this.hitSEPolygons.length > 0) {
      this.hitSEPolygons[0].glowing = true;
    }
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {}

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    // Reset the victim in preparation for another deletion.
    this.victim = null;
    // Reset the beforeDeleteStateMap and SENoduleISList
    this.beforeDeleteStateMap.clear();
    this.beforeDeleteSENoduleIDList.splice(0);
  }
  activate(): void {
    // Delete all selected objects
    if (SEStore.selectedSENodules.length !== 0) {
      const deleteCommandGroup = new CommandGroup();
      //Keep track of the deleted objects ids
      // if the user selects object1 and object2 that is a dependent/descendent of object1, deleting object 1 will
      // also delete object2, so that you should not also try to delete object again.
      const deletedObjectIDs: number[] = [];
      SEStore.selectedSENodules
        .filter(
          (object: SENodule) =>
            !(object instanceof SEIntersectionPoint) ||
            (object as SEIntersectionPoint).isUserCreated
        )
        .forEach(object => {
          //if object has already been deleted don't do anything
          if (deletedObjectIDs.findIndex(id => id === object.id) !== -1) return;

          // First mark all children of the victim out of date so that the update method does a topological sort
          object.markKidsOutOfDate();
          //Record the state of the victim and all the SENodules that depend on it (i.e kids, grandKids, etc..).
          object.update(
            this.beforeDeleteStateMap,
            this.beforeDeleteSENoduleIDList
          );

          // The update method orders the objects from the victim to the leaf (i.e objects with only in arrows)
          // To delete remove from the leaves to the victim (and to undo build from the victim to leaves -- accomplished
          // by the command group reversing the order on restore()).  Therefore reverse the beforeDeleteSENoduleIDList.
          this.beforeDeleteSENoduleIDList.reverse();
          this.beforeDeleteSENoduleIDList.forEach(seNoduleID => {
            // add the deleted id to the deletedObjectIDs
            deletedObjectIDs.push(seNoduleID);

            // Get the SENodule via the beforeState
            const seNoduleBeforeState =
              this.beforeDeleteStateMap.get(seNoduleID);

            if (seNoduleBeforeState !== undefined) {
              if (
                seNoduleBeforeState.object instanceof SEIntersectionPoint &&
                (seNoduleBeforeState.object as SEIntersectionPoint)
                  .isUserCreated
              ) {
                // don't delete a user created intersection point, covert it back to not user created.
                deleteCommandGroup.addCommand(
                  new ConvertUserCreatedInterToNotUserCreatedCommand(
                    seNoduleBeforeState.object
                  )
                );
              } else {
                deleteCommandGroup.addCommand(
                  new DeleteNoduleCommand(seNoduleBeforeState.object)
                );
              }
            }
          });
          // Reset the beforeDeleteStateMap and SENoduleISList
          this.beforeDeleteStateMap.clear();
          this.beforeDeleteSENoduleIDList.splice(0);
        });
      deleteCommandGroup.execute();
      //reset the deleted object id list
      deletedObjectIDs.splice(0);
      EventBus.fire("show-alert", {
        key: `handlers.deletedNodes`,
        keyOptions: {
          number: `${SEStore.selectedSENodules.length}`
        },
        type: "success"
      });
    }

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
    victim.update(this.beforeDeleteStateMap, this.beforeDeleteSENoduleIDList);

    // this.beforeDeleteStateMap.forEach(n => console.log(n.kind, n.object.id));
    // this.beforeDeleteSENoduleIDList.forEach(n => console.log(n));

    const deleteCommandGroup = new CommandGroup();
    // The update method orders the objects from the victim to the leaf (i.e objects with only in arrows)
    // To delete remove from the leaves to the victim (and to undo build from the victim to leaves -- accomplished
    // by the command group reversing the order on restore()).  Therefore reverse the beforeDeleteSENoduleIDList.
    this.beforeDeleteSENoduleIDList.reverse();
    this.beforeDeleteSENoduleIDList.forEach(seNoduleID => {
      // Get the SENodule via the beforeState
      const seNoduleBeforeState = this.beforeDeleteStateMap.get(seNoduleID);

      if (seNoduleBeforeState !== undefined) {
        if (
          seNoduleBeforeState.object instanceof SEIntersectionPoint &&
          (seNoduleBeforeState.object as SEIntersectionPoint).isUserCreated
        ) {
          // to delete a user created intersection point, first convert it back to not user created then possibly delete it.
          deleteCommandGroup.addCommand(
            new ConvertUserCreatedInterToNotUserCreatedCommand(
              seNoduleBeforeState.object
            )
          );
          // only delete the user created point if it is child of the victim. If it is the victim do not delete it. If we didn't do this then deleting a user created intersection the only way to create it again would be to undo the delete
          if (seNoduleBeforeState.object.id !== victim.id) {
            deleteCommandGroup.addCommand(
              new DeleteNoduleCommand(seNoduleBeforeState.object)
            );
          }
        } else {
          deleteCommandGroup.addCommand(
            new DeleteNoduleCommand(seNoduleBeforeState.object)
          );
        }
      }
    });
    deleteCommandGroup.execute();
  }
}
