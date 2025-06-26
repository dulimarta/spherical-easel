import Highlighter from "./Highlighter";
import { SENodule } from "@/models/SENodule";
import {
  ObjectState,
  SEIntersectionReturnType,
  SEOneDimensional
} from "@/types";
import { CommandGroup } from "@/commands/CommandGroup";
import { DeleteNoduleCommand } from "@/commands/DeleteNoduleCommand";
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { SEPoint } from "@/models/SEPoint";
import EventBus from "@/eventHandlers/EventBus";
//import Two from "two.js";
import { Group } from "two.js/src/group";
import { ChangeIntersectionPointPrincipleParents } from "@/commands/ChangeIntersectionPointPrincipleParents";
import i18n from "@/i18n";
import { RemoveIntersectionPointOtherParentsInfo } from "@/commands/RemoveIntersectionPointOtherParentsInfo";
import { SELine } from "@/models/SELine";
import { SESegment } from "@/models/SESegment";
import { SECircle } from "@/models/SECircle";
import { SEParametric } from "@/models/SEParametric";
import { SEEllipse } from "@/models/SEEllipse";
import { SetPointUserCreatedValueCommand } from "@/commands/SetPointUserCreatedValueCommand";
import { SEAntipodalPoint } from "@/models/SEAntipodalPoint";
import { M } from "vite/dist/node/types.d-aGj9QkWt";

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
  // Filter the hitSEPoints appropriately for this handler
  protected filteredIntersectionPointsList: SEPoint[] = [];

  constructor(layers: Group[]) {
    super(layers);
  }

  mousePressed(event: MouseEvent): void {
    // console.log("DeleteHandler::mousePressed");
    //Select an object to delete
    //if (this.isOnSphere) {           //Commented Out For now
    // In the case of multiple selections prioritize texts > points > lines > segments > circles > ellipses > parametrics > labels > angle markers > polygons
    // Deleting an object deletes all objects that depend on that object including the label
    this.updateFilteredPointsList();
    if (this.hitSETexts.length > 0) {
      this.victim = this.hitSETexts[0];
      this.victimName = this.hitSETexts[0].name;
      this.victimType = i18n.global.t(`objects.texts`, 3);
    } else if (this.filteredIntersectionPointsList.length > 0) {
      this.victim = this.filteredIntersectionPointsList[0];
      this.victimName =
        this.filteredIntersectionPointsList[0].label?.ref.shortUserName;
      this.victimType = i18n.global.t(`objects.points`, 3);
    } else if (this.hitSELines.length > 0) {
      this.victim = this.hitSELines[0];
      this.victimName = this.hitSELines[0].label?.ref.shortUserName;
      this.victimType = i18n.global.t(`objects.lines`, 3);
    } else if (this.hitSESegments.length > 0) {
      this.victim = this.hitSESegments[0];
      this.victimName = this.hitSESegments[0].label?.ref.shortUserName;
      this.victimType = i18n.global.t(`objects.segments`, 3);
    } else if (this.hitSECircles.length > 0) {
      this.victim = this.hitSECircles[0];
      this.victimName = this.hitSECircles[0].label?.ref.shortUserName;
      this.victimType = i18n.global.t(`objects.circles`, 3);
    } else if (this.hitSEEllipses.length > 0) {
      this.victim = this.hitSEEllipses[0];
      this.victimName = this.hitSEEllipses[0].label?.ref.shortUserName;
      this.victimType = i18n.global.t(`objects.ellipses`, 3);
    } else if (this.hitSEParametrics.length > 0) {
      this.victim = this.hitSEParametrics[0];
      this.victimName = this.hitSEParametrics[0].label?.ref.shortUserName;
      this.victimType = i18n.global.t(`objects.parametrics`, 3);
    } else if (this.hitSELabels.length > 0) {
      // Do not allow deletion of labels - if a user selects a label with this tool, merely hide the label.
      new SetNoduleDisplayCommand(this.hitSELabels[0], false).execute();
    } else if (this.hitSEAngleMarkers.length > 0) {
      this.victim = this.hitSEAngleMarkers[0];
      this.victimName = this.hitSEAngleMarkers[0].label?.ref.shortUserName;
      this.victimType = i18n.global.t(`objects.angleMarkers`, 3);
    } else if (this.hitSEPolygons.length > 0) {
      this.victim = this.hitSEPolygons[0];
      this.victimName = this.hitSEPolygons[0].label?.ref.shortUserName;
      this.victimType = i18n.global.t(`objects.polygons`, 3);
    }
    if (this.victim != null) {
      console.debug("Candidate to delete", this.victimName);
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
              ? i18n.global.t(`objects`, 4)
              : i18n.global.t(`objects`, 3)
        },
        type: "success"
      });
      // Reset the beforeDeleteState
      this.mouseLeave(event);
    } else {
      console.debug("No candidate to delete");
    }
    //}
  }

  mouseMoved(event: MouseEvent): void {
    // console.log("DeleteHandler::mouseMoved");
    // Find all the nearby (hitSE... objects) and update location vectors
    super.mouseMoved(event);
    // only one object at a time can be deleted so only glow the potential victim
    // prioritize points, if there is a point nearby, assume the user wants it to be the selection to delete
    this.updateFilteredPointsList();
    if (this.filteredIntersectionPointsList.length > 0) {
      this.filteredIntersectionPointsList[0].glowing = true;
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
    } else if (this.hitSETexts.length > 0) {
      this.hitSETexts[0].glowing = true;
    }
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {}

  mouseLeave(event: MouseEvent): void {
    // console.log("DeleteHandler::mouseLeave");
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
        //.map(x => x as SENodule)
        .filter(
          object =>
            (!(object instanceof SEIntersectionPoint) ||
              object.isUserCreated) &&
            (!(object instanceof SEAntipodalPoint) || object.isUserCreated)
        )
        .forEach(object => {
          //if object has already been deleted don't do anything
          if (deletedObjectIDs.findIndex(id => id === object.id) !== -1) {
            return;
          }
          deletedObjectIDs.push(...this.delete(object as any));
        });
      // deletedNumberNodes: "Successfully deleted {number} {objects}.",
      EventBus.fire("show-alert", {
        key: `handlers.deletedNumberNodes`,
        keyOptions: {
          number: deletedObjectIDs.length,
          objects:
            deletedObjectIDs.length === 1
              ? i18n.global.t(`objects`, 4)
              : i18n.global.t(`objects`, 3)
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

  updateFilteredPointsList(): void {
    this.filteredIntersectionPointsList = this.hitSEPoints.filter(pt => {
      if (pt instanceof SEIntersectionPoint || pt instanceof SEAntipodalPoint) {
        if (pt.isUserCreated) {
          return pt.showing;
        } else {
          return false;
        }
      }
      return pt.showing;
    });
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

    // this.beforeDeleteStateMap.forEach(n =>
    //   console.log("kind, id, name", n.kind, n.object.id, n.object.name)
    // );
    // this.beforeDeleteSENoduleIDList.forEach((n, ind) =>
    //   console.log("id and num", n, ind)
    // );

    const deleteCommandGroup = new CommandGroup();
    // The update method orders the objects from the victim to the leaf (i.e objects with only in arrows)
    // To delete remove from the leaves to the victim (and to undo build from the victim to leaves -- accomplished
    // by the command group reversing the order on restore()).  Therefore reverse the beforeDeleteSENoduleIDList.
    this.beforeDeleteSENoduleIDList.reverse();

    // First determine which SEIntersection points, that are *on* the beforeDeleteSENoduleISList, will *not* actually be deleted because
    // they will still have two or more *viable* parents after this deletion is complete, eventually (after the this.beforeDeleteSENoduleIDList.forEach command) this array may contain non SEIntersection Points
    const notDeletedSENoduleIDs: number[] = [];
    this.beforeDeleteSENoduleIDList.forEach(seNoduleID => {
      // Get the SENodule via the beforeState
      const seNoduleBeforeState = this.beforeDeleteStateMap.get(seNoduleID);
      if (
        seNoduleBeforeState !== undefined &&
        seNoduleBeforeState.object instanceof SEIntersectionPoint
      ) {
        // console.log(
        //   `Examine intersection point ${seNoduleBeforeState.object.name} to see if it survived the deletion`
        // );
        // only delete the intersection point itself if completing this delete command will
        // leave this intersection point with a pair of (undeleted) parents  whose intersection is at this location
        // check the seNoduleBeforeState.object.otherParentInfoArray
        if (
          seNoduleBeforeState.object.otherParentsInfoArray.filter(
            info =>
              //include info where both parents are not going to be deleted
              !this.beforeDeleteStateMap.has(info.parent1.id) &&
              !this.beforeDeleteStateMap.has(info.parent2.id)
          ).length > 0
        ) {
          // console.log(` ${seNoduleBeforeState.object.name} survives!`);
          notDeletedSENoduleIDs.push(seNoduleBeforeState.object.id);
        }
      }
    });
    // now determine if any not deleted intersection point means that other objects (that are descendants of the non deleted intersection point) in the this.beforeDeleteStateMap are not going to be deleted
    // by determining if the children of the not deleted intersection points will survive, if so put them on the notDeletedSENoduleIDs list and check their children
    // console.debug(
    //   `Length of notDeletedSENoduleIDs ${notDeletedSENoduleIDs.length} before`
    // );
    let totalNotDeletedSENodules = notDeletedSENoduleIDs.length;
    let examinedIndex = 0;
    while (totalNotDeletedSENodules > examinedIndex) {
      // console.debug(`SENodule number examined: ${examined}`);
      // console.debug(`total not deleted SENodules: ${examined}`);
      // get the SENodule -- initially these are SEIntersection point that will have two surviving parents to define them
      const notDeletedSENodule = this.beforeDeleteStateMap.get(
        notDeletedSENoduleIDs[examinedIndex]
      );
      // console.debug(`Examine the kids of ${notDeletedSENodule?.object.name}`);
      if (notDeletedSENodule !== undefined) {
        examinedIndex += 1;
        // Now check the kids of the non deleted SENodule
        notDeletedSENodule.object.kids.forEach(kid => {
          // console.debug(`Examine kid ${kid.name}`);
          // The kid, as a descendant of point on the delete list, is slated to be deleted
          // if every parent of the kid is not deleted by the current action because the parent is either on the notDeleted list or
          //    it is not in the beforeDeleteStateMap (which means it was not slated to be deleted in the first place), then add the kid to the not delete list
          if (
            kid.parents.every(
              parent =>
                notDeletedSENoduleIDs.some(id => parent.id === id) ||
                !this.beforeDeleteStateMap.has(parent.id)
            )
          ) {
            // console.debug(
            //   `Added kid ${kid.name} to the notDeletedSENoduleIDs array`
            // );
            // make sure the the kid is not on the list already
            if (notDeletedSENoduleIDs.every(id => id !== kid.id)) {
              notDeletedSENoduleIDs.push(kid.id);
              totalNotDeletedSENodules += 1;
            }
          }
        });
      }
    }

    // console.debug(
    //   `Length of notDeletedSENoduleIDs ${notDeletedSENoduleIDs.length} after`
    // );
    // now remove the non-(SEintersection point) that are on the notDeletedSENoduleIDs array
    // we don't remove the SEintersection points because we have to be careful about how their parents are removed -- we must do so in such a way that principle parents are always defined and this is reflected in the DAG and the otherParents array
    notDeletedSENoduleIDs.forEach(seNoduleID => {
      const notDeletedSENodule = this.beforeDeleteStateMap.get(seNoduleID);
      if (notDeletedSENodule !== undefined) {
        // console.log(`Examine object ${notDeletedSENodule.object.name}`);
        if (!(notDeletedSENodule.object instanceof SEIntersectionPoint)) {
          // console.log(
          //   `Remove object ${notDeletedSENodule?.object.name} from the delete state map and the id list`
          // );
          this.beforeDeleteStateMap.delete(seNoduleID);
          const index = this.beforeDeleteSENoduleIDList.findIndex(
            ele => ele === seNoduleID
          );
          if (index > -1) {
            this.beforeDeleteSENoduleIDList.splice(index, 1);
          } else {
            throw new Error(
              `Delete Handler: Removed an object with id ${seNoduleID} from the beforeDeleteStateMap that doesn't exist on the beforeDeleteSENoduleIDList`
            );
          }
        }
      } else {
        throw new Error(
          `Delete Handler: An object from the notDeletedSENoduleIDS  with id ${seNoduleID} doesn't exist in the beforeDeleteStateMap`
        );
      }
    });

    this.beforeDeleteSENoduleIDList.forEach(seNoduleID => {
      // Get the SENodule via the beforeStateMap
      const seNoduleBeforeState = this.beforeDeleteStateMap.get(seNoduleID);

      if (seNoduleBeforeState !== undefined) {
        // if the SENodule is not an intersection point, delete it as normal (but if one dimensional remove it as a parent from any intersection point)
        //  if the SENodule is an intersection point delete it (if it is not on the notDeleteSENoduleIDs list),
        // or remove the deleted seNodules in the otherParenArray and change the principle parentage
        //  in the DAG
        if (seNoduleBeforeState.object instanceof SEIntersectionPoint) {
          if (
            !notDeletedSENoduleIDs.some(
              id => id === seNoduleBeforeState.object.id
            )
          ) {
            // the intersection point is going to be deleted so remove all the other parents Info (so that undo of this delete will add them back in)
            seNoduleBeforeState.object.otherParentsInfoArray.forEach(info => {
              // console.log(
              //   `Queue up 1: Delete a intersection point ${seNoduleBeforeState.object.name} other parents ${info.parent1.name} and ${info.parent2.name} `
              // );
              deleteCommandGroup.addCommand(
                new RemoveIntersectionPointOtherParentsInfo(info)
              );
            });
            // convert it back to not user created (if it was)
            if (seNoduleBeforeState.object.isUserCreated) {
              deleteCommandGroup.addCommand(
                new SetPointUserCreatedValueCommand(
                  seNoduleBeforeState.object,
                  false
                )
              );
            }
            // finally delete the intersection point,
            deleteCommandGroup.addCommand(
              new DeleteNoduleCommand(seNoduleBeforeState.object)
            );
            deletedNodeIds.push(seNoduleBeforeState.object.id);
          } else {
            // the intersection point doesn't need to be deleted, but the existence and parentage have changed
            // first remove the other parents info from the other parent info array where at least one of the parents are going to be deleted (i.e. when both parents are not on the deleteStateMap or on the notDeleteSENoduleIds list)
            const possibleNewParentInfoArray: SEIntersectionReturnType[] = [];
            seNoduleBeforeState.object.otherParentsInfoArray.forEach(info => {
              if (
                (notDeletedSENoduleIDs.some(id => id === info.parent1.id) ||
                  !this.beforeDeleteStateMap.has(info.parent1.id)) &&
                (notDeletedSENoduleIDs.some(id => id === info.parent2.id) ||
                  !this.beforeDeleteStateMap.has(info.parent2.id))
              ) {
                // console.log(
                //   `Found other parents ${info.parent1.name} and ${info.parent2.name} for ${seNoduleBeforeState.object.name}`
                // );
                possibleNewParentInfoArray.push(info); // both parents survive in this info
              } else {
                // console.log(
                //   ` Queue up 2: In DeleteHandler, remove other parent ${info.parent1.name} and ${info.parent2.name} from ${seNoduleBeforeState.object.name}`
                // );
                deleteCommandGroup.addCommand(
                  new RemoveIntersectionPointOtherParentsInfo(info)
                );
              }
            });
            //now modify/remove the principle parents using one info from possibleNewParentInfoArray and then remove the rest (if any) so that these will be restored when we undo this delete

            // possibleNewParentInfoArray is not empty because if it was empty then notDeletedSENoduleIDs would not contain this points id and would have been deleted in the previous conditional clause
            // console.log(
            //   "length of possibleNewParentInfoArray",
            //   possibleNewParentInfoArray.length
            // );
            possibleNewParentInfoArray.forEach((info, index) => {
              // use the first as new parents of the intersection point
              if (index === 0) {
                // console.log(
                //   `Queues up: Principle parents to be ${info.parent1.name} and ${info.parent2.name} to ${info.SEIntersectionPoint.name}`
                // );
                deleteCommandGroup.addCommand(
                  new ChangeIntersectionPointPrincipleParents(info)
                );
                // if the existence is now false, the shallow update of the intersection point will fix the existence and change to the
                // principle parents whose intersection makes the existence true (if possible)
              }
            });
          }
        } else {
          if (
            // I would love an operator that works with custom interface types so I could just type
            // seNoduleBeforeState.object typeof "SEOneDimensional" but I can't :-(
            seNoduleBeforeState.object instanceof SELine ||
            seNoduleBeforeState.object instanceof SESegment ||
            seNoduleBeforeState.object instanceof SECircle ||
            seNoduleBeforeState.object instanceof SEEllipse ||
            seNoduleBeforeState.object instanceof SEParametric
          ) {
            // for any intersection point that contains other parents info with any one dimensional that is going to be deleted, should be removed
            DeleteHandler.store.sePoints
              .filter(x => x instanceof SEIntersectionPoint)
              .map(x => x as SEIntersectionPoint)
              .forEach(interSEPoint => {
                // skip any intersection point that is on the not deleted list because the
                // other parents info has already been deleted
                if (notDeletedSENoduleIDs.some(id => id === interSEPoint.id)) {
                  return;
                }
                // skip any intersection point on the already deleted list, the parent info has already been removed
                if (deletedNodeIds.some(id => id === interSEPoint.id)) {
                  return;
                }
                //find the other parent info that contain a one dimensional parent that is going to be deleted
                const index = interSEPoint.otherParentsInfoArray.findIndex(
                  info =>
                    info.parent1.id === seNoduleBeforeState.object.id ||
                    info.parent2.id === seNoduleBeforeState.object.id
                );
                if (index > -1) {
                  // console.log(
                  //   `Queue up 4: Remove other parents ${interSEPoint.otherParentsInfoArray[index].parent1.name} and ${interSEPoint.otherParentsInfoArray[index].parent2.name} to intersection point ${interSEPoint.otherParentsInfoArray[index].SEIntersectionPoint.name}/${interSEPoint.name}`
                  // );
                  deleteCommandGroup.addCommand(
                    new RemoveIntersectionPointOtherParentsInfo(
                      interSEPoint.otherParentsInfoArray[index]
                    )
                  );
                }
              });
          }
          // console.debug(
          //   `delete ${seNoduleBeforeState.object.name}, ${seNoduleBeforeState.object.id}`
          // );
          // finally delete the object,
          deleteCommandGroup.addCommand(
            new DeleteNoduleCommand(seNoduleBeforeState.object)
          );
          deletedNodeIds.push(seNoduleBeforeState.object.id);
        }
      }
    });
    deleteCommandGroup.execute();
    // console.debug(`${deletedNodeIds.length} Nodules deleted`);
    // for (let i = 0; i < deletedNodeIds.length; i++) {
    //   console.debug(`delete nodules with id ${deletedNodeIds[i]}`);
    // }
    return deletedNodeIds;
  }
}
