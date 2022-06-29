import Two from "two.js";
import Highlighter from "./Highlighter";
import { SENodule } from "@/models/SENodule";
import { ObjectState, SEOneDimensional } from "@/types";
import { CommandGroup } from "@/commands/CommandGroup";
import { DeleteNoduleCommand } from "@/commands/DeleteNoduleCommand";
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { SEPoint } from "@/models/SEPoint";
import EventBus from "@/eventHandlers/EventBus";
import { ConvertUserCreatedInterToNotUserCreatedCommand } from "@/commands/ConvertUserCreatedInterToNotUserCreatedCommand";
import { RemoveIntersectionPointParent } from "@/commands/RemoveIntersectionPointParent";
import i18n from "@/i18n";

export default class DeleteHandler extends Highlighter {
  /**
   * Object to delete - the victim!
   */
  private victim: SENodule | null = null;
  private victimName: string | undefined = "";
  private victimType: string | undefined = "";

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
          this.victimName = this.hitSEPoints[0].label?.ref.shortUserName;
          this.victimType = i18n.tc(`objects.points`, 3);
        }
      } else if (this.hitSELines.length > 0) {
        this.victim = this.hitSELines[0];
        this.victimName = this.hitSELines[0].label?.ref.shortUserName;
        this.victimType = i18n.tc(`objects.lines`, 3);
      } else if (this.hitSESegments.length > 0) {
        this.victim = this.hitSESegments[0];
        this.victimName = this.hitSESegments[0].label?.ref.shortUserName;
        this.victimType = i18n.tc(`objects.segments`, 3);
      } else if (this.hitSECircles.length > 0) {
        this.victim = this.hitSECircles[0];
        this.victimName = this.hitSECircles[0].label?.ref.shortUserName;
        this.victimType = i18n.tc(`objects.circles`, 3);
      } else if (this.hitSEEllipses.length > 0) {
        this.victim = this.hitSEEllipses[0];
        this.victimName = this.hitSEEllipses[0].label?.ref.shortUserName;
        this.victimType = i18n.tc(`objects.ellipses`, 3);
      } else if (this.hitSEParametrics.length > 0) {
        this.victim = this.hitSEParametrics[0];
        this.victimName = this.hitSEParametrics[0].label?.ref.shortUserName;
        this.victimType = i18n.tc(`objects.parametrics`, 3);
      } else if (this.hitSELabels.length > 0) {
        // Do not allow deletion of labels - if a user selects a label with this tool, merely hide the label.
        new SetNoduleDisplayCommand(this.hitSELabels[0], false).execute();
      } else if (this.hitSEAngleMarkers.length > 0) {
        this.victim = this.hitSEAngleMarkers[0];
        this.victimName = this.hitSEAngleMarkers[0].label?.ref.shortUserName;
        this.victimType = i18n.tc(`objects.angleMarkers`, 3);
      } else if (this.hitSEPolygons.length > 0) {
        this.victim = this.hitSEPolygons[0];
        this.victimName = this.hitSEPolygons[0].label?.ref.shortUserName;
        this.victimType = i18n.tc(`objects.polygons`, 3);
      }
      if (this.victim != null) {
        // Do the deletion
        const deletedNodeIds = this.delete(this.victim);
        //deletedNodes: "Successfully deleted {type} {name} and {number} {objects} that depend on it.",
        EventBus.fire("show-alert", {
          key: `handlers.deletedNodes`,
          keyOptions: {
            type: this.victimType,
            name: this.victimName ?? "",
            number: deletedNodeIds.length - 1,
            objects:
              deletedNodeIds.length === 2
                ? i18n.tc(`objects.objects`, 4)
                : i18n.tc(`objects.objects`, 3)
          },
          type: "success"
        });
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
    } else if (this.hitSELines.length > 0) {
      this.hitSELines[0].glowing = true;
    } else if (this.hitSESegments.length > 0) {
      this.hitSESegments[0].glowing = true;
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
    if (DeleteHandler.store.selectedSENodules.length !== 0) {
      //Keep track of the deleted objects ids
      // if the user selects object1 and object2 that is a dependent/descendent of object1, deleting object 1 will
      // also delete object2, so that you should not also try to delete object again.
      const deletedObjectIDs: number[] = [];
      DeleteHandler.store.selectedSENodules
        .filter(
          (object: SENodule) =>
            !(object instanceof SEIntersectionPoint) ||
            (object as SEIntersectionPoint).isUserCreated
        )
        .forEach(object => {
          //if object has already been deleted don't do anything
          if (deletedObjectIDs.findIndex(id => id === object.id) !== -1) return;
          deletedObjectIDs.push(...this.delete(object));
        });
      // deletedNumberNodes: "Successfully deleted {number} {objects}.",
      EventBus.fire("show-alert", {
        key: `handlers.deletedNumberNodes`,
        keyOptions: {
          number: deletedObjectIDs.length,
          objects:
            deletedObjectIDs.length === 1
              ? i18n.tc(`objects.objects`, 4)
              : i18n.tc(`objects.objects`, 3)
        },
        type: "success"
      });
      //reset the deleted object id list
      deletedObjectIDs.splice(0);
    }

    // Unselect the selected objects and clear the selectedObject array
    super.activate();
  }
  deactivate(): void {
    super.deactivate();
  }

  public delete(victim: SENodule): number[] {
    const deletedNodeIds: number[] = [];
    // Reset the beforeDeleteStateMap and SENoduleISList
    this.beforeDeleteStateMap.clear();
    this.beforeDeleteSENoduleIDList.splice(0);
    // First mark all children of the victim out of date so that the update method does a topological sort
    victim.markKidsOutOfDate();
    console.debug("Delete Handler delete method");
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
        if (seNoduleBeforeState.object instanceof SEIntersectionPoint) {
          if (seNoduleBeforeState.object.isUserCreated) {
            // to delete a user created intersection point, first convert it back to not user created then possibly delete it.
            deleteCommandGroup.addCommand(
              new ConvertUserCreatedInterToNotUserCreatedCommand(
                seNoduleBeforeState.object
              )
            );
          }
          // only delete the intersection point it itself if completing this delete command will
          // leave this intersection point with less than two parents (principle or other)
          // check to see which parents are going to be deleted
          const parents = [
            seNoduleBeforeState.object.principleParent1,
            seNoduleBeforeState.object.principleParent2,
            ...seNoduleBeforeState.object.otherParentArray
          ];

          const deletedParentsSENoduleList: SEOneDimensional[] = [];
          const notDeletedParentsSENoduleList: SEOneDimensional[] = [];
          parents.forEach(parent => {
            if (this.beforeDeleteStateMap.get(parent.id) !== undefined) {
              deletedParentsSENoduleList.push(parent);
            } else {
              notDeletedParentsSENoduleList.push(parent);
            }
          });
          // remove enough going-to-be-deleted parents to leave just two principle parents
          for (let i = parents.length; i > 2; i--) {
            const deleteParent = deletedParentsSENoduleList.pop();
            if (deleteParent) {
              deleteCommandGroup.addCommand(
                new RemoveIntersectionPointParent(
                  seNoduleBeforeState.object,
                  deleteParent
                )
              );
            }
          }

          if (notDeletedParentsSENoduleList.length < 2) {
            // after the completion of this delete command, there will be less than two parents left so deleted the intersection point
            deleteCommandGroup.addCommand(
              new DeleteNoduleCommand(seNoduleBeforeState.object)
            );
            deletedNodeIds.push(seNoduleBeforeState.object.id);
          }
        } else {
          deleteCommandGroup.addCommand(
            new DeleteNoduleCommand(seNoduleBeforeState.object)
          );
          deletedNodeIds.push(seNoduleBeforeState.object.id);
        }
      }
    });
    deleteCommandGroup.execute();

    return deletedNodeIds;
  }
}
