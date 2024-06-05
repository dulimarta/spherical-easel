import Highlighter from "./Highlighter";
import { SENodule } from "@/models/SENodule";
import { ObjectState, SEOneDimensional } from "@/types";
import { CommandGroup } from "@/commands/CommandGroup";
import { DeleteNoduleCommand } from "@/commands/DeleteNoduleCommand";
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { SEPoint } from "@/models/SEPoint";
import EventBus from "@/eventHandlers/EventBus";
import Two from "two.js";
//import { Group } from "two.js/src/group";
import { ChangeIntersectionPointPrincipleParent } from "@/commands/ChangeIntersectionPointPrincipleParent";
import i18n from "@/i18n";
import { RemoveIntersectionPointOtherParent } from "@/commands/RemoveIntersectionPointOtherParent";
import { SELine } from "@/models/SELine";
import { SESegment } from "@/models/SESegment";
import { SECircle } from "@/models/SECircle";
import { SEParametric } from "@/models/SEParametric";
import { SEEllipse } from "@/models/SEEllipse";
import { SetPointUserCreatedValueCommand } from "@/commands/SetPointUserCreatedValueCommand";
import { SEAntipodalPoint } from "@/models/SEAntipodalPoint";

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
          (!(this.hitSEPoints[0] instanceof SEIntersectionPoint) ||
            this.hitSEPoints[0].isUserCreated) &&
          (!(this.hitSEPoints[0] instanceof SEAntipodalPoint) ||
            this.hitSEPoints[0].isUserCreated)
        ) {
          this.victim = this.hitSEPoints[0];
          this.victimName = this.hitSEPoints[0].label?.ref.shortUserName;
          this.victimType = i18n.global.t(`objects.points`, 3);
        }
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
                ? i18n.global.t(`objects.objects`, 4)
                : i18n.global.t(`objects.objects`, 3)
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
        if (
          p instanceof SEIntersectionPoint ||
          (p instanceof SEAntipodalPoint && !p.isUserCreated)
        ) {
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
        //.map(x => x as SENodule)
        .filter(
          (object) =>
            (!(object instanceof SEIntersectionPoint) ||
              object.isUserCreated) &&
            (!(object instanceof SEAntipodalPoint) || object.isUserCreated)
        )
        .forEach(object => {
          //if object has already been deleted don't do anything
          if (deletedObjectIDs.findIndex(id => id === object.id) !== -1) return;
          deletedObjectIDs.push(...this.delete(object as any));
        });
      // deletedNumberNodes: "Successfully deleted {number} {objects}.",
      EventBus.fire("show-alert", {
        key: `handlers.deletedNumberNodes`,
        keyOptions: {
          number: deletedObjectIDs.length,
          objects:
            deletedObjectIDs.length === 1
              ? i18n.global.t(`objects.objects`, 4)
              : i18n.global.t(`objects.objects`, 3)
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
        // console.debug(
        //   `Examine intersection point ${seNoduleBeforeState.object.name} to see if it survived the deletion`
        // );
        // only delete the intersection point itself if completing this delete command will
        // leave this intersection point with less than two parents (principle or other) whose intersection is at this location
        // check to see which parents are going to be deleted
        const parents = [
          seNoduleBeforeState.object.principleParent1,
          seNoduleBeforeState.object.principleParent2,
          ...seNoduleBeforeState.object.otherParentArray
        ];

        const survivingParents: SENodule[] = [];
        parents.forEach(parent => {
          // console.debug(`Parent ${parent.name}`);
          if (!this.beforeDeleteStateMap.has(parent.id)) {
            // count all the parents that are not slated to be deleted
            survivingParents.push(parent);
            // console.debug(`Survives`);
          }
          // else {
          //   console.debug(`Is deleted`);
          // }
        });
        // console.debug(
        //   `notDeletedParentsSENoduleCount ${survivingParents.length}`
        // );
        // There must be two or more not deleted (surviving) parents for the intersection point to survive (i.e. not be deleted)
        if (survivingParents.length >= 2) {
          // now make sure that there are two parents on the list that will intersect at the existing intersection point
          let exit_loops = false;
          for (let i = 0; i < survivingParents.length; i++) {
            for (let j = i + 1; j < survivingParents.length; j++) {
              // console.debug(
              //   `Intersect ${survivingParents[i].name} and ${
              //     survivingParents[j].name
              //   } and the result is ${seNoduleBeforeState.object.checkIntersectionBetweenTwoPotentialParents(
              //     survivingParents[i] as SEOneDimensional,
              //     survivingParents[j] as SEOneDimensional
              //   )}`
              // );

              if (
                seNoduleBeforeState.object.checkIntersectionBetweenTwoPotentialParents(
                  survivingParents[i] as SEOneDimensional,
                  survivingParents[j] as SEOneDimensional
                ) !== -1
              ) {
                // console.debug(
                //   `Added ${seNoduleBeforeState.object.name} to the notDeletedSENoduleIDs array.`
                // );
                notDeletedSENoduleIDs.push(seNoduleBeforeState.object.id);
                exit_loops = true;
                break;
              }
            }
            if (exit_loops) {
              break;
            }
          }
        }
      }
    });
    // now determine if any not deleted intersection point means that other objects (that are descendants of the non deleted intersection point) in the this.beforeDeleteStateMap are not going to be deleted
    // by determining if the children of the not deleted intersection points will survive, if so put them on the notDeletedSENoduleIDs list and check their children
    // console.debug(
    //   `Length of notDeletedSENoduleIDs ${notDeletedSENoduleIDs.length} before`
    // );
    let totalNotDeletedSENodules = notDeletedSENoduleIDs.length;
    let examined = 0;
    while (totalNotDeletedSENodules > examined) {
      // console.debug(`SENodule number examined: ${examined}`);
      // console.debug(`total not deleted SENodules: ${examined}`);
      // get the SENodule -- initially these are SEIntersection point that will have two surviving parents to define them
      const notDeletedSENodule = this.beforeDeleteStateMap.get(
        notDeletedSENoduleIDs[examined]
      );
      // console.debug(`Examine the kids of ${notDeletedSENodule?.object.name}`);
      if (notDeletedSENodule !== undefined) {
        examined += 1;
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
        // console.debug(`Examine object ${notDeletedSENodule.object.name}`);
        if (!(notDeletedSENodule.object instanceof SEIntersectionPoint)) {
          // console.debug(
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
            // console.debug(
            //   `Delete a intersection point ${seNoduleBeforeState.object.name} with ${seNoduleBeforeState.object.otherParentArray.length} other parents`
            // );
            // the intersection point is going to be deleted so remove all the other parents (so that undo of this delete will add them back in)
            seNoduleBeforeState.object.otherParentArray.forEach(parent => {
              deleteCommandGroup.addCommand(
                new RemoveIntersectionPointOtherParent(
                  seNoduleBeforeState.object as SEIntersectionPoint,
                  parent
                )
              );
            });
            if (seNoduleBeforeState.object.isUserCreated) {
              // convert it back to not user created (if it was)
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
            // the intersection point doesn't need to be deleted, but the existence and parentage could have changed
            // first remove the other parents from the other parent array that are going to be deleted
            seNoduleBeforeState.object.otherParentArray.forEach(parent => {
              if (
                notDeletedSENoduleIDs.some(id => id === parent.id) ||
                !this.beforeDeleteStateMap.has(parent.id)
              ) {
                return;
              } else {
                // console.debug(
                //   `DeleteHandler: Queue up remove other parent ${parent.name} from ${seNoduleBeforeState.object.name}`
                // );
                deleteCommandGroup.addCommand(
                  new RemoveIntersectionPointOtherParent(
                    seNoduleBeforeState.object as SEIntersectionPoint,
                    parent
                  )
                );
              }
            });
            //now modify/remove the principle parents
            const principleParent1ID =
              seNoduleBeforeState.object.principleParent1.id;
            if (
              !notDeletedSENoduleIDs.some(id => id === principleParent1ID) &&
              this.beforeDeleteStateMap.has(principleParent1ID)
            ) {
              // principle parent 1 is slated to be removed
              // console.debug(
              //   `DeleteHandler: Principle parent 1, queue up remove principle parent ${seNoduleBeforeState.object.principleParent1.name} from ${seNoduleBeforeState.object.name}`
              // );

              deleteCommandGroup.addCommand(
                new ChangeIntersectionPointPrincipleParent(
                  seNoduleBeforeState.object as SEIntersectionPoint,
                  seNoduleBeforeState.object.principleParent1
                )
              );
            }
            const principleParent2ID =
              seNoduleBeforeState.object.principleParent2.id;
            if (
              !notDeletedSENoduleIDs.some(id => id === principleParent2ID) &&
              this.beforeDeleteStateMap.has(principleParent2ID)
            ) {
              // principle parent 2 is slated to be removed
              // console.debug(
              //   `DeleteHandler: Principle parent 2, queue up remove principle parent ${seNoduleBeforeState.object.principleParent2.name} from ${seNoduleBeforeState.object.name}`
              // );

              deleteCommandGroup.addCommand(
                new ChangeIntersectionPointPrincipleParent(
                  seNoduleBeforeState.object as SEIntersectionPoint,
                  seNoduleBeforeState.object.principleParent2
                )
              );
            }
            // so if the point is user created and the existence is now false, need to convert the intersection point to not user created
            // Note: ChangeIntersectionPointPrincipleParent or RemoveIntersectionPointOtherParent are *not* executed so check the intersection existence manually
            // now update the existence
            const possibleParents = [
              seNoduleBeforeState.object.principleParent1,
              seNoduleBeforeState.object.principleParent2,
              ...seNoduleBeforeState.object.otherParentArray
            ];
            let sum = 0;
            possibleParents.forEach(parent => {
              // if the parent is on notDeleted list or is not slated to be deleted, then use the parent to determine the existence of this intersection point
              // console.debug(
              //   `DeleteHandler: Check existence of ${
              //     seNoduleBeforeState.object.name
              //   } so examine ${
              //     parent.name
              //   }, on the notDeleteList: ${notDeletedSENoduleIDs.some(
              //     id => id === parent.id
              //   )} not going to be deleted anyway ${!this.beforeDeleteStateMap.has(
              //     parent.id
              //   )}`
              // );
              if (
                notDeletedSENoduleIDs.some(id => id === parent.id) ||
                !this.beforeDeleteStateMap.has(parent.id)
              ) {
                // console.debug(
                //   `${parent.name} is not deleted or was not going to be deleted in the first place.`
                // );
                if (
                  parent.exists &&
                  parent.isHitAt(
                    (seNoduleBeforeState.object as SEIntersectionPoint)
                      .locationVector, // this is the updated location
                    DeleteHandler.store.zoomMagnificationFactor
                  )
                ) {
                  // console.debug(`Counts toward existence!`);
                  sum += 1;
                }
              }
            });

            // console.debug(
            //   `${seNoduleBeforeState.object.name} intersection point sum ${sum}`
            // );
            const seIntersectionPointExists = sum > 1; // you must be on at least two existing parents

            if (
              seNoduleBeforeState.object.isUserCreated &&
              !seIntersectionPointExists
            ) {
              // convert it back to not user created because it doesn't exist

              deleteCommandGroup.addCommand(
                new SetPointUserCreatedValueCommand(
                  seNoduleBeforeState.object,
                  false
                )
              );
            }
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
            DeleteHandler.store.sePoints
              .filter(x => x instanceof SEIntersectionPoint)
              .map(x => x as SEIntersectionPoint)
              .forEach(interSEPoint => {
                if (
                  interSEPoint.otherParentArray.findIndex(
                    parent => parent.id === seNoduleBeforeState.object.id
                  ) > -1
                ) {
                  deleteCommandGroup.addCommand(
                    new RemoveIntersectionPointOtherParent(
                      interSEPoint,
                      seNoduleBeforeState.object as SEOneDimensional
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
