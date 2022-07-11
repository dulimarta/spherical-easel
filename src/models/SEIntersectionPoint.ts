import { SEPoint } from "./SEPoint";
import Point from "@/plottables/Point";
import { IntersectionReturnType, ObjectState, SEOneDimensional } from "@/types";
import { intersectTwoObjects } from "@/utils/intersections";
import i18n from "@/i18n";
import { SESegment } from "./SESegment";
import { SELine } from "./SELine";
import { SECircle } from "./SECircle";
import { SEEllipse } from "./SEEllipse";
import { Vector3 } from "three";
import { useSEStore } from "@/stores/se";
import {
  getAncestors,
  getDescendants,
  rank_of_type
} from "@/utils/helpingfunctions";
import SETTINGS from "@/global-settings";

export class SEIntersectionPoint extends SEPoint {
  /**
   * This flag is true if the user created this point
   * This flag is false if this point was automatically created
   */
  private _isUserCreated = false;

  /**
   * The One-Dimensional parents of this SEInstructionPoint
   */
  private sePrincipleParent1: SEOneDimensional;
  private sePrincipleParent2: SEOneDimensional;
  private otherSEParents: SEOneDimensional[] = [];

  /**
   * The numbering of the intersection in the case of multiple intersection between seParent1 and seParent 2
   */
  private order: number;

  private tempVector = new Vector3();
  /**
   * Create an intersection point between two one-dimensional objects
   * @param pt the TwoJS point associated with this intersection
   * @param seParent1 The first parent
   * @param seParent2 The second parent
   * @param order The order of this intersection point (in case there are multiple intersections)
   * @param isUserCreated False if this point was automatically created
   *
   * We need to add the "order" parameter so multiple intersection points of
   * the same two objects have unique names. For instance a line potentially
   * intersects a circle at two locations
   */
  constructor(
    pt: Point,
    seParent1: SEOneDimensional,
    seParent2: SEOneDimensional,
    order: number,
    isUserCreated: boolean
  ) {
    super(pt);
    this.ref = pt;
    this.sePrincipleParent1 = seParent1;
    this.sePrincipleParent2 = seParent2;
    this.order = order;
    if (isUserCreated) {
      this._isUserCreated = true;
      // Display userCreated intersections
      this.showing = true;
    } else {
      this._isUserCreated = false;
      // Hide automatically created intersections
      this.showing = false;
    }
  }

  public get noduleDescription(): string {
    let typeParent1;
    if (this.sePrincipleParent1 instanceof SESegment) {
      typeParent1 = i18n.tc("objects.segments", 3);
    } else if (this.sePrincipleParent1 instanceof SELine) {
      typeParent1 = i18n.tc("objects.lines", 3);
    } else if (this.sePrincipleParent1 instanceof SECircle) {
      typeParent1 = i18n.tc("objects.circles", 3);
    } else if (this.sePrincipleParent1 instanceof SEEllipse) {
      typeParent1 = i18n.tc("objects.ellipses", 3);
    }
    let typeParent2;
    if (this.sePrincipleParent2 instanceof SESegment) {
      typeParent2 = i18n.tc("objects.segments", 3);
    } else if (this.sePrincipleParent2 instanceof SELine) {
      typeParent2 = i18n.tc("objects.lines", 3);
    } else if (this.sePrincipleParent2 instanceof SECircle) {
      typeParent2 = i18n.tc("objects.circles", 3);
    } else if (this.sePrincipleParent2 instanceof SEEllipse) {
      typeParent2 = i18n.tc("objects.ellipses", 3);
    }
    return String(
      i18n.t(`objectTree.intersectionPoint`, {
        parent1: this.sePrincipleParent1.label?.ref.shortUserName,
        typeParent1: typeParent1,
        parent2: this.sePrincipleParent2.label?.ref.shortUserName,
        typeParent2: typeParent2,
        index: this.order
      })
    );
  }

  public get noduleItemText(): string {
    return (
      this.label?.ref.shortUserName ??
      "No Label Short Name In SEIntersectionPoint"
    );
  }

  get principleParent1(): SEOneDimensional {
    return this.sePrincipleParent1;
  }
  get principleParent2(): SEOneDimensional {
    return this.sePrincipleParent2;
  }
  // order is always the order from the intersection of the two principle parents
  public get intersectionOrder(): number {
    return this.order;
  }

  /**
   * If the intersection point is changed to isUserCreated(true) then the user intentionally created this point
   * That is, the point was not automatically created. The showing or not of a user created
   * point is possible. A not user created point is not showing unless moused over.
   */
  set isUserCreated(flag: boolean) {
    this._isUserCreated = flag;
  }

  get isUserCreated(): boolean {
    return this._isUserCreated;
  }

  get otherParentArray(): SEOneDimensional[] {
    return this.otherSEParents;
  }

  public addIntersectionOtherParent(n: SEOneDimensional): void {
    // only add a new parent that is not already on the list of other parents and is not a principle parent
    if (
      !this.otherSEParents.some(parent => n.name === parent.name) &&
      n.name !== this.principleParent1.name &&
      n.name !== this.principleParent2.name
    ) {
      this.otherSEParents.push(n);
      // console.debug(
      //   `Added other parent ${n.name} to intersection point ${this.name}`
      // );
    } else {
      console.warn(
        `SEIntersection Point ${this.name}: Attempted to add nodule ${n.name} that was already on the other parent array or is a principle parent.`
      );
    }

    //adding a parent can make the intersection point exist
    //update the existence as the parents have changed
    this.setExistence();
    //console.debug(this.name + " intersection point other parents");
    //this.otherSEParents.forEach(par => console.debug(par.name + " "));
  }

  public removeIntersectionOtherParent(n: SEOneDimensional): void {
    // Remove the other parent from the other parent array
    const index = this.otherParentArray.findIndex(
      parent => parent.name === n.name
    );
    if (index > -1) {
      this.otherSEParents.splice(index, 1);
      // console.debug(
      //   `Removed other parent ${n.name} to intersection point ${this.name}`
      // );
    } else {
      console.warn(
        `SEIntersection Point ${this.name}: Attempted to remove nodule ${n.name} that was not on the other parent array.`
      );
    }
    //removing a parent can make the intersection point exist or not
    //update the existence as the parents have changed
    this.setExistence();
    //console.debug(this.name + " intersection point other parents");
    //this.otherSEParents.forEach(par => console.debug(par.name + " "));
  }

  /**
   * Removes a principle parent of an intersection point if possible
   * @param n the principle parent
   * @returns null if the principle parent can't be removed and returns the new principle parent if successful
   */
  public removePrincipleParent(n: SEOneDimensional): SEOneDimensional | null {
    // The parent being removed should be one of the two principle parents (seParent1|2), we must make sure there is
    // an element in the  otherSEParent to be (possibly) put in its place and we must update the order as necessary.
    // if not return false and this means that this intersection point should be deleted or some error had occurred
    if (
      (this.sePrincipleParent1.name === n.name ||
        this.sePrincipleParent2.name === n.name) &&
      this.otherSEParents.length > 0
    ) {
      // In order to maintain the DAG, we must make sure that the descendants of this intersection point
      // and the ancestors of the both the (one old and one new) principle parents are distinct
      // and that the intersection between the two new principle parents includes this intersection point
      const descendants = getDescendants([this]);
      const principleParentNotBeingRemoved =
        this.sePrincipleParent1.name === n.name // principle parent 1 is being replaced
          ? this.sePrincipleParent2
          : this.sePrincipleParent1;
      const ancestors1 = getAncestors([principleParentNotBeingRemoved]);
      let newParentIndex = 0;
      let allAncestors = [
        ...getAncestors([this.otherParentArray[newParentIndex]]),
        ...ancestors1
      ];
      let commonSENodules = descendants.filter(seNodule => {
        if (allAncestors.some(ancestor => ancestor.id === seNodule.id)) {
          return true;
        } else {
          return false;
        }
      });
      // check to make sure that the two new *potential* principle parents intersection includes this intersection point (and return the order of the intersection)
      // order is always the order from the intersection of the two principle parents
      let potentialNewOrder = this.checkIntersectionBetweenTwoPotentialParents(
        principleParentNotBeingRemoved,
        this.otherParentArray[newParentIndex]
      );
      // console.debug(
      //   `${principleParentNotBeingRemoved.name} and ${this.otherParentArray[newParentIndex].name} number of common nodules ${commonSENodules.length}, do the potential new principle intersect correctly? ${potentialNewOrder} should not be -1`
      // );
      while (commonSENodules.length > 0 || potentialNewOrder === -1) {
        //we want there to be no common seNodules
        newParentIndex += 1;
        if (newParentIndex > this.otherParentArray.length) {
          allAncestors = [
            ...getAncestors([this.otherParentArray[newParentIndex]]),
            ...ancestors1
          ];
          commonSENodules = descendants.filter(seNodule => {
            if (allAncestors.some(ancestor => ancestor.id === seNodule.id)) {
              return true;
            } else {
              return false;
            }
          });
          // check to make sure that the two new *potential* principle parents intersection includes this intersection point (and return the order of the intersection)
          potentialNewOrder = this.checkIntersectionBetweenTwoPotentialParents(
            principleParentNotBeingRemoved,
            this.otherParentArray[newParentIndex]
          );
        } else {
          // there are no other parents where the descendants of the this intersection point
          // and all ancestors for the removed principle parent and one of the other parents, that
          // have no common SENodule.
          return null;
        }
      }
      // if we reach here in the code there is a pair of SEOneDimensional parents that work
      const newPrincipleParent = this.otherParentArray[newParentIndex];
      this.order = potentialNewOrder;
      // newPrincipleParent can be assigned to either principle spot, because the order variable of the intersection is
      // updated based on the location, but the type Lines, Segments, Circles, Ellipses, Parametric must be maintained
      // the principle parent 2 type is at the same spot or later than the principle parent 2 type on this list
      if (this.sePrincipleParent1.name === n.name) {
        this.sePrincipleParent1 = newPrincipleParent;
      } else {
        this.sePrincipleParent2 = newPrincipleParent;
      }
      // remove the new principle parent from the other parent array at newParentIndex
      this.otherParentArray.splice(newParentIndex, 1);

      const rank1 = rank_of_type(this.principleParent1);
      const rank2 = rank_of_type(this.principleParent2);
      if (
        (rank1 === rank2 &&
          this.sePrincipleParent1.name > this.sePrincipleParent2.name) ||
        rank2 < rank1
      ) {
        // switch the order of the principle parents
        const temp = this.sePrincipleParent1;
        this.sePrincipleParent1 = this.sePrincipleParent2;
        this.sePrincipleParent2 = temp;
        // console.debug(
        //   `Intersection point principle parent switched: PP1 ${this.sePrincipleParent1.name}, PP2 ${this.sePrincipleParent2.name}`
        // );
      }

      //update the existence as the parents have changed
      this.setExistence();
      // console.debug(
      //   `Removed principle parent ${n.name} from intersection point ${this.name}`
      // );
      // console.debug(
      //   `Current principle parents of ${this.name} are ${this.sePrincipleParent1.name} and ${this.sePrincipleParent2.name}`
      // );

      return newPrincipleParent;
    } else {
      // The parent to remove is not one of the two principle parents with a backup to place into the principle parent slot
      return null; // this should not happen
    }
  }
  /**
   *
   * @param potentialParent1
   * @param potentialParent2
   * @returns -1 if the intersection between potentialParent1 and potentialParent2 does *not* include the current SEIntersectionPoint
   * otherwise return the order/index of the current SEIntersectionPoint for the two new potential principle parents.
   */
  public checkIntersectionBetweenTwoPotentialParents(
    potentialParent1: SEOneDimensional,
    potentialParent2: SEOneDimensional
  ): number {
    // check to make sure that the two new *potential* principle parents intersection includes this intersection point
    //(and return the order of the intersection)
    // order is always the order from the intersection of the two principle parents
    const rank1 = rank_of_type(potentialParent1);
    const rank2 = rank_of_type(potentialParent2);

    const updatedIntersectionInfo: IntersectionReturnType[] = [];
    if (
      (rank1 === rank2 && potentialParent1.name < potentialParent2.name) ||
      rank1 < rank2
    ) {
      // use the correct order of intersection
      updatedIntersectionInfo.push(
        ...intersectTwoObjects(
          potentialParent1,
          potentialParent2,
          useSEStore().inverseTotalRotationMatrix
        )
      );
    } else {
      updatedIntersectionInfo.push(
        ...intersectTwoObjects(
          potentialParent2,
          potentialParent1,
          useSEStore().inverseTotalRotationMatrix
        )
      );
    }
    let returnIndex = -1;
    updatedIntersectionInfo.forEach((element, index) => {
      // console.debug(
      //   `Index ${index}, intersection points ${element.vector.toFixed(
      //     9
      //   )} and goal ${this.locationVector.toFixed(
      //     9
      //   )} They are the same? ${this.tempVector
      //     .subVectors(element.vector, this.locationVector)
      //     .isZero(0.00000001)} x diff: ${
      //     Math.abs(element.vector.x - this.locationVector.x) < 0.00000001
      //   }, y diff: ${
      //     Math.abs(element.vector.y - this.locationVector.y) < 0.00000001
      //   }, z diff: ${
      //     Math.abs(element.vector.z - this.locationVector.z) < 0.00000001
      //   }`
      // );
      if (
        this.tempVector
          .subVectors(element.vector, this.locationVector)
          .isZero(SETTINGS.intersectionTolerance) // If this is SETTING.tolerance then when loading an intersection point sometimes it says the intersection is not on the list
      ) {
        returnIndex = index;
      }
    });
    return returnIndex;
  }

  public replacePrincipleParent(
    existingPrincipleParent: SEOneDimensional,
    newPrincipleParent: SEOneDimensional
  ): void {
    if (existingPrincipleParent.id === this.principleParent1.id) {
      //replace the first principle parent
      this.sePrincipleParent1 = newPrincipleParent;
      // add the old principle parent to the other parent array
      this.otherParentArray.push(existingPrincipleParent);
    } else if (existingPrincipleParent.id === this.principleParent2.id) {
      //replace the second principle parent
      this.sePrincipleParent2 = newPrincipleParent;
      // add the old principle parent to the other parent array
      this.otherParentArray.push(existingPrincipleParent);
    } else {
      throw new Error(
        `SEIntersectionPoint: Using replacePrincipleParent and the existingPrincipleParent is not one of the existing principle parents.`
      );
    }
    // update the order of the intersection
    // order is always the order from the intersection of the two principle parents
    const updatedIntersectionInfo: IntersectionReturnType[] =
      intersectTwoObjects(
        this.sePrincipleParent1,
        this.sePrincipleParent2,
        useSEStore().inverseTotalRotationMatrix
      );
    let updateOrderSuccessful = false;
    updatedIntersectionInfo.forEach((element, index) => {
      if (
        this.tempVector
          .subVectors(element.vector, this.locationVector)
          .isZero(SETTINGS.intersectionTolerance)
      ) {
        updateOrderSuccessful = true;
        this.order = index;
      }
    });
    //update the existence as the parents have changed
    this.setExistence();
    // console.debug(
    //   `Added principle parent ${newPrincipleParent.name} to intersection point ${this.name}`
    // );
    if (!updateOrderSuccessful) {
      throw new Error(
        "Update Intersection Point:  Order update error. Current location not found in intersection between the two new principle parents."
      );
    }
  }
  //check to see if the new location is on two existing parents (principle or other)
  private setExistence(): void {
    const parentList = [
      this.sePrincipleParent1,
      this.sePrincipleParent2,
      ...this.otherSEParents
    ];
    // check all pairs of parents for existence
    // for (let i = 0; i < parentList.length; i++) {
    //   for (let j = i + 1; j < parentList.length; j++) {
    //     let object1 = parentList[i];
    //     let object2 = parentList[j];
    //     const rank1 = rank_of_type(object1);
    //     const rank2 = rank_of_type(object2);
    //     if ((rank1 === rank2 && object2.name > object1.name) || rank2 < rank1) {
    //       const temp = object1;
    //       object1 = object2;
    //       object2 = temp;
    //     }
    //     const updatedIntersectionInfo: IntersectionReturnType[] =
    //       intersectTwoObjects(
    //         object1,
    //         object2,
    //         useSEStore().inverseTotalRotationMatrix
    //       );
    //     if (updatedIntersectionInfo[this.order] !== undefined) {
    //       console.debug(
    //         `Check existence ${
    //           updatedIntersectionInfo[this.order].exists
    //         }, z component of intersection ${
    //           updatedIntersectionInfo[this.order].vector.z
    //         }`
    //       );
    //       this._exists = updatedIntersectionInfo[this.order].exists;
    //       if (this._exists) {
    //         //As soon as this exists, exit all the loops checking the existence
    //         return;
    //       }
    //     }
    //   }
    // }

    let sum = 0;
    parentList.forEach(parent => {
      if (
        parent.exists &&
        parent.isHitAt(
          this.locationVector, // this is the current location
          useSEStore().zoomMagnificationFactor,
          100000
        )
      ) {
        sum += 1;
      }
    });
    //console.debug("intersection point sum", sum);
    this._exists = sum > 1; // you must be on at least two existing parents
  }

  public shallowUpdate(): void {
    // The objects are in the correct order because the SEIntersectionPoint parents are assigned that way
    const updatedIntersectionInfo: IntersectionReturnType[] =
      intersectTwoObjects(
        this.sePrincipleParent1,
        this.sePrincipleParent2,
        useSEStore().inverseTotalRotationMatrix
      );
    // order is always the order from the intersection of the two principle parents
    if (updatedIntersectionInfo[this.order] !== undefined) {
      if (
        this.locationVector.angleTo(
          updatedIntersectionInfo[this.order].vector
        ) <
        Math.PI / 2 + SETTINGS.tolerance
      ) {
        // if the new angle is less than Pi/2 from the old, accept the new angle
        this.locationVector = updatedIntersectionInfo[this.order].vector; // Calls the setter of SEPoint which calls the setter of Point which updates the display
      } else {
        // if the new angle is more than Pi/2 from the old, search the intersection info for a closer one
        let minIndex = -1;
        let minAngle = Math.PI;
        updatedIntersectionInfo.forEach((item, index) => {
          const angle = item.vector.angleTo(this.locationVector);
          if (angle < minAngle) {
            minIndex = index;
            minAngle = angle;
          }
        });
        this.order = minIndex;
        this.locationVector = updatedIntersectionInfo[this.order].vector;
      }
      //check to see if the new location is on two existing parents (principle or other)
      this.setExistence();
    } else {
      this._exists = false;
    }
    // console.debug(
    //   `Intersction Point ${this.name}, user created ${this._isUserCreated}, showing ${this._showing},exists ${this.exists}`
    // );
    // Update visibility
    if (this._exists && this._isUserCreated && this._showing) {
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }
  }
  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) return;

    //Add a warning if some other parent is out of date
    // if (this.otherParentArray.some(item => item.isOutOfDate())) {
    //   console.warn(
    //     `SEIntersectionPoint: The intersection point ${this.name} has an other parent that is out of date and the existence might not update correctly.`
    //   );
    // }

    this.setOutOfDate(false);
    this.shallowUpdate();

    // Intersection Points are completely determined by their parents and an update on the parents
    // will cause this point to be put into the correct location.So we don't store any additional information
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        console.log(
          `Intersection point with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      orderedSENoduleList.push(this.id);
      objectState.set(this.id, { kind: "intersectionPoint", object: this });
    }

    this.updateKids(objectState, orderedSENoduleList);
  }

  // For !isUserCreated points glowing is the same as showing or not showing the point,
  set glowing(b: boolean) {
    if (!this._isUserCreated) {
      this.ref.setVisible(b);
    } else {
      super.glowing = b;
    }
  }

  public isNonFreePoint(): boolean {
    return true;
  }
  public isFreePoint(): boolean {
    return false;
  }
}
