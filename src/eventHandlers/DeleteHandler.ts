import Two from "two.js";
import Highlighter from "./Highlighter";
import { SENodule } from "@/models/SENodule";
import { IntersectionReturnType, ObjectState } from "@/types";
import { CommandGroup } from "@/commands/CommandGroup";
import { DeleteNoduleCommand } from "@/commands/DeleteNoduleCommand";
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { SEPoint } from "@/models/SEPoint";
import EventBus from "@/eventHandlers/EventBus";
import { ConvertUserCreatedInterToNotUserCreatedCommand } from "@/commands/ConvertUserCreatedInterToNotUserCreatedCommand";
import { RemoveIntersectionPointParent } from "@/commands/RemoveIntersectionPointParent";
import i18n from "@/i18n";
import { intersectTwoObjects } from "@/utils/intersections";

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
    //console.log("Mouse pressed in DeleteHandler");
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
    // console.debug("Delete Handler delete method");
    //Record the state of the victim and all the SENodules that depend on it (i.e kids, grandKids, etc..).
    victim.update(this.beforeDeleteStateMap, this.beforeDeleteSENoduleIDList);

    // this.beforeDeleteStateMap.forEach(n => console.log(n.kind, n.object.id));
    // this.beforeDeleteSENoduleIDList.forEach(n => console.log(n));

    const deleteCommandGroup = new CommandGroup();
    // The update method orders the objects from the victim to the leaf (i.e objects with only in arrows)
    // To delete remove from the leaves to the victim (and to undo build from the victim to leaves -- accomplished
    // by the command group reversing the order on restore()).  Therefore reverse the beforeDeleteSENoduleIDList.
    this.beforeDeleteSENoduleIDList.reverse();

    // First determine which SEIntersection points, that are *on* the beforeDeleteSENoduleISList, will *not* actually be deleted because
    // they will still have two or more parents after this deletion is complete, eventually this array may contain non SEIntersection Points
    const notDeletedSENoduleIDs: number[] = [];
    this.beforeDeleteSENoduleIDList.forEach(seNoduleID => {
      // Get the SENodule via the beforeState
      const seNoduleBeforeState = this.beforeDeleteStateMap.get(seNoduleID);

      if (seNoduleBeforeState !== undefined) {
        if (seNoduleBeforeState.object instanceof SEIntersectionPoint) {
          // only delete the intersection point it itself if completing this delete command will
          // leave this intersection point with less than two parents (principle or other)
          // check to see which parents are going to be deleted
          const parents = [
            seNoduleBeforeState.object.principleParent1,
            seNoduleBeforeState.object.principleParent2,
            ...seNoduleBeforeState.object.otherParentArray
          ];

          let notDeletedParentsSENodulesCount = 0;
          parents.forEach(parent => {
            if (!this.beforeDeleteStateMap.has(parent.id)) {
              // count all the parents that are not slated to be deleted
              notDeletedParentsSENodulesCount += 1;
            }
          });
          // console.debug(
          //   `notDeletedParentsSENoduleCount ${notDeletedParentsSENodulesCount}`
          // );
          // There must be two or more not deleted parents for the intersection point to survive (i.e. not be deleted)
          if (notDeletedParentsSENodulesCount >= 2) {
            // console.debug(
            //   `Added ${seNoduleBeforeState.object.name} to the notDeletedSENoduleIDs array.`
            // );
            notDeletedSENoduleIDs.push(seNoduleBeforeState.object.id);
          }
        }
      }
    });
    // now determine if any not deleted intersection point means that other objects (that are descendants of the non deleted intersection point) in the this.beforeDeleteStateMap are not going to be deleted
    // by determining if the children of the not deleted intersection points will survive, if so put them on the notDeletedSENoduleIDs list and check their children
    console.debug(
      `Length of notDeletedSENoduleIDs ${notDeletedSENoduleIDs.length} before`
    );
    let totalNotDeletedSENodules = notDeletedSENoduleIDs.length;
    let examined = 0;
    // notDeletedSENoduleIDs.forEach(seNoduleID => {
    while (totalNotDeletedSENodules > examined) {
      console.debug(`SENodule number examined: ${examined}`);
      console.debug(`total not deleted SENodules: ${examined}`);
      // get the SENodule -- initially these are SEIntersection point that will have two surviving parents to define them
      const notDeletedSENodule = this.beforeDeleteStateMap.get(
        notDeletedSENoduleIDs[examined]
      );
      console.debug(`Examine the kids of ${notDeletedSENodule?.object.name}`);
      if (notDeletedSENodule !== undefined) {
        examined += 1;
        // Now check the kids of the non deleted SENodule
        notDeletedSENodule.object.kids.forEach(kid => {
          console.debug(`Examine kid ${kid.name}`);
          // The kid, as a descendant of point on the delete list, is slated to be deleted
          // if every parent of the kid is not deleted by the current action because the parent is either on the notDeleted list or
          //    it is not in the beforeDeleteStateMap (which means it was not slated to be deleted in the first place), then add the kid to the not delete list
          if (
            kid.parents.every(
              parent =>
                notDeletedSENoduleIDs.some(id => parent.id === id) ||
                this.beforeDeleteStateMap.get(parent.id) === undefined
            )
          ) {
            console.debug(
              `Added kid ${kid.name} to the notDeletedSENoduleIDs array`
            );
            notDeletedSENoduleIDs.push(kid.id);
            totalNotDeletedSENodules += 1;
          }
        });
      }
    }
    //});
    console.debug(
      `Lenght of notDeletedSENoduleIDs ${notDeletedSENoduleIDs.length} after`
    );
    // now remove the non-(SEintersection point) that are on the notDeletedSENoduleIDs array
    // we don't remove the SEintersection points because we have to be careful about how their parents are removed -- we must do so in such a way that principle parents are always defined and this is reflected in the DAG and the otherParents array
    notDeletedSENoduleIDs.forEach(seNoduleID => {
      const notDeletedSENodule = this.beforeDeleteStateMap.get(seNoduleID);
      if (notDeletedSENodule) {
        console.debug(`Examine object ${notDeletedSENodule.object.name}`);
        if (!(notDeletedSENodule.object instanceof SEIntersectionPoint)) {
          console.debug(`Remove object ${notDeletedSENodule?.object.name}`);
          this.beforeDeleteStateMap.delete(seNoduleID);
          const index = this.beforeDeleteSENoduleIDList.findIndex(
            ele => ele === seNoduleID
          );
          if (index > -1) {
            this.beforeDeleteSENoduleIDList.splice(index, 1);
          } else {
            throw new Error(
              "Delete Handler: Removed an object from the beforeDeleteStateMap that doesn't exist on the beforeDeleteSENoduleIDList"
            );
          }
        } else if (notDeletedSENodule === null) {
          throw new Error(
            "Delete Handler: An object from the notDeletedSENoduleIDS doesn't exist in the beforeDeleteStateMap"
          );
        }
      }
    });

    this.beforeDeleteSENoduleIDList.forEach(seNoduleID => {
      // Get the SENodule via the beforeState
      const seNoduleBeforeState = this.beforeDeleteStateMap.get(seNoduleID);

      if (seNoduleBeforeState !== undefined) {
        if (seNoduleBeforeState.object instanceof SEIntersectionPoint) {
          // only delete the intersection point it itself if completing this delete command will
          // leave this intersection point with less than two parents (principle or other)
          // check to see which parents are going to be deleted
          const parents = [
            seNoduleBeforeState.object.principleParent1,
            seNoduleBeforeState.object.principleParent2,
            ...seNoduleBeforeState.object.otherParentArray
          ];

          let notDeletedParentsSENoduleCount = 0;
          parents.forEach(parent => {
            if (!this.beforeDeleteStateMap.has(parent.id)) {
              notDeletedParentsSENoduleCount += 1;
            }
          });
          // remove enough going-to-be-deleted parents to leave just two principle parents
          for (let i = parents.length; i > 2; i--) {
            const deleteParent = parents.pop();
            if (deleteParent) {
              deleteCommandGroup.addCommand(
                new RemoveIntersectionPointParent( // this merely safely unregistered the deleteParent from the list of parents of the intersection point, it doesn't delete them, the deletion will come later
                  seNoduleBeforeState.object,
                  deleteParent
                )
              );
            }
          }
          if (notDeletedParentsSENoduleCount >= 2) {
            // the intersection point doesn't need to be deleted, but the existence could have changed as the parents have changed
            // so if the point is user created and the existence is now false, need to convert the intersection point to not user created
            // Note: RemoveIntersectionPointParent is *not* executed so check the intersection existence manually

            let sum = 0;
            parents.forEach(parent => {
              if (
                parent.exists &&
                parent.isHitAt(
                  (seNoduleBeforeState.object as SEIntersectionPoint)
                    .locationVector, // this is the updated location
                  DeleteHandler.store.zoomMagnificationFactor
                )
              ) {
                sum += 1;
              }
            });
            // console.debug("intersection point sum", sum);
            const seIntersectionPointExists = sum > 1; // you must be on at least two existing parents

            if (
              seNoduleBeforeState.object.isUserCreated &&
              !seIntersectionPointExists
            ) {
              // convert it back to not user created because it doesn't exist
              deleteCommandGroup.addCommand(
                new ConvertUserCreatedInterToNotUserCreatedCommand(
                  seNoduleBeforeState.object
                )
              );
            }
          } else {
            // after the completion of this delete command, there will be less than two parents left so delete the intersection point

            if (seNoduleBeforeState.object.isUserCreated) {
              // to delete a user created intersection point, first convert it back to not user created then delete it.
              deleteCommandGroup.addCommand(
                new ConvertUserCreatedInterToNotUserCreatedCommand(
                  seNoduleBeforeState.object
                )
              );
            }
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
