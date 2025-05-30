import { SEPoint } from "./SEPoint";
import {
  IntersectionReturnType,
  ObjectState,
  SEIntersectionReturnType,
  SEOneDimensional
} from "@/types";
import { intersectTwoObjects } from "@/utils/intersections";
import i18n from "@/i18n";
import { Vector3 } from "three";
import {
  getAncestors,
  getDescendants,
  rank_of_type
} from "@/utils/helpingfunctions";
import SETTINGS from "@/global-settings";
import { DisplayStyle } from "@/plottables/Nodule";
import { ChangeIntersectionPointPrincipleParents } from "@/commands/ChangeIntersectionPointPrincipleParents";
import { SESegment } from "./SESegment";
import { SELine } from "./SELine";
import { SECircle } from "./SECircle";
import { SEEllipse } from "./SEEllipse";
import { SENodule } from "@/models/SENodule";
const { t } = i18n.global;
export class SEIntersectionPoint extends SEPoint {
  /**
   * This flag is true if the user created this point
   * This flag is false if this point was automatically created
   */
  private _isUserCreated = false;

  /**
   * When two lines/segments are intersected, the intersection points are antipodal. If the user creates the
   * anitpode of one of them (in previous versions of the code, this would result in two points at the same location
   * or you would be unable to create that intersection point's antipode -- both of which are not desireable outcomes).
   * The solution is to create a variable, _isAntipodeMode, which means that the existence of the antipode is
   * determined by the existence of the original point (the one the use wanted to create the antipode of) and not the
   * intersection point parents. (the location of the antipode is the same regardless of the value of _isAntipode).
   * If P and Q are two (antipodal) intersection points, then the value of _isAntipodeMode is never true for both.
   * If this._isAntipodeMode is true, then _isUserCreated must also be true.
   */
  private _isAntipodeMode = false;
  /**
   * When two lines/segments are intersected, the intersection points come in antipodal pairs.
   * _antipodalPointId is the id number of this points intersection (if any).
   * If this is -1 then this is not a part of a pair of antipodal twins.
   * if _isAntipodeMode is true, then _antipodalPointId is *not* -1
   */
  private _antipodalPointId = -1;

  /**
   * The One-Dimensional parents of this SEInstructionPoint
   */
  private sePrincipleParent1: SEOneDimensional;
  private sePrincipleParent2: SEOneDimensional;
  // Any info on this array has been checked so that both listed parents are not descendants of this intersection point
  private _otherParentsInfoArray: SEIntersectionReturnType[] = [];

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
    // pt: Point,
    seParent1: SEOneDimensional,
    seParent2: SEOneDimensional,
    order: number,
    isUserCreated: boolean
  ) {
    super(true); /* Non-Free Point */
    // this.ref = pt;
    this.ref.stylize(DisplayStyle.ApplyTemporaryVariables);
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

  public set antipodalPointId(seIntersectionPointID: number) {
    if (seIntersectionPointID === -1) {
      // turn off the antipode mode
      this._antipodalPointId = -1;
      this._isAntipodeMode = false;
    } else {
      const antipode = SENodule.store.findSENoduleById(seIntersectionPointID);
      if (
        antipode instanceof SEIntersectionPoint &&
        !antipode._isAntipodeMode
      ) {
        this._antipodalPointId = seIntersectionPointID;
        this._isAntipodeMode = true;
      } else {
        throw new Error(
          `Attempting to set a seIntersectionPoint antipodal with a nonSEIntersection Point (${
            antipode instanceof SEIntersectionPoint
          }) or the seIntersectionPoint is already in antipode mode`
        );
      }
    }
  }
  public get antipodalPointId(): number {
    return this._antipodalPointId;
  }
  public get isAntipodal(): boolean {
    return this._isAntipodeMode;
  }

  public get noduleDescription(): string {
    let typeParent1;
    if (this.sePrincipleParent1 instanceof SESegment) {
      typeParent1 = i18n.global.t("objects.segments", 3);
    } else if (this.sePrincipleParent1 instanceof SELine) {
      typeParent1 = i18n.global.t("objects.lines", 3);
    } else if (this.sePrincipleParent1 instanceof SECircle) {
      typeParent1 = i18n.global.t("objects.circles", 3);
    } else if (this.sePrincipleParent1 instanceof SEEllipse) {
      typeParent1 = i18n.global.t("objects.ellipses", 3);
    }
    let typeParent2;
    if (this.sePrincipleParent2 instanceof SESegment) {
      typeParent2 = i18n.global.t("objects.segments", 3);
    } else if (this.sePrincipleParent2 instanceof SELine) {
      typeParent2 = i18n.global.t("objects.lines", 3);
    } else if (this.sePrincipleParent2 instanceof SECircle) {
      typeParent2 = i18n.global.t("objects.circles", 3);
    } else if (this.sePrincipleParent2 instanceof SEEllipse) {
      typeParent2 = i18n.global.t("objects.ellipses", 3);
    }
    return String(
      i18n.global.t(`objectTree.intersectionPoint`, {
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

  get otherParentsInfoArray(): SEIntersectionReturnType[] {
    return this._otherParentsInfoArray;
  }

  // Used is lots of the handler commands when a new object is created
  public addIntersectionOtherParentInfo(n: SEIntersectionReturnType): boolean {
    // only add parent info when both parents are not a descendants of this intersection point!
    // console.log(
    //   `Intersection point ${this.label?.ref.shortUserName}/${this.name}/${this.noduleDescription} attempt add other parents ${n.parent1.label?.ref.shortUserName}/${n.parent1.name}/${n.parent1.noduleDescription} and ${n.parent2.label?.ref.shortUserName}/${n.parent2.name}/${n.parent2.noduleDescription}`
    // );
    let returnValue: boolean;
    // Check that we can add n as an other parent of this
    // One condition is that the DAG must be maintained - so both proposed new parents cannot be descendants of the intersection.
    const descendants = getDescendants([this]).map(nod => nod.name);
    console.log("Descendants of ", descendants);
    if (
      !descendants.includes(n.parent1.name) &&
      !descendants.includes(n.parent2.name)
    ) {
      // Next central question: If one of the current principle parents was deleted could this new pair step in and be parents of the intersection point?
      // This means that the ancestors of both proposed parents must not include the parent that is being deleted.
      //
      this._otherParentsInfoArray.push(n);
      returnValue = true;
      // Once another set of parents are added, update the exists variable with an update
      this.shallowUpdate();
    } else {
      returnValue = false;
    }
    return returnValue;
  }

  // Used to undo the handler commands that used addIntersectionOtherParent
  public removeIntersectionOtherParentInfo(n: SEIntersectionReturnType): void {
    // Remove the other parent from the other parent array
    const index = this._otherParentsInfoArray.findIndex(
      info =>
        info.parent1.name == n.parent1.name &&
        info.parent2.name == n.parent2.name &&
        info.order == n.order
    );
    if (index > -1) {
      this._otherParentsInfoArray.splice(index, 1);
      // console.debug(
      //   `Removed other parent ${n.name} to intersection point ${this.name}`
      // );
    } else {
      console.warn(
        `SEIntersection Point ${this.name}: Attempted to remove info ${n} that was not on the other parent info array.`
      );
    }
  }

  public changePrincipleParents(newInfo: SEIntersectionReturnType): void {
    this.sePrincipleParent1 = newInfo.parent1;
    this.sePrincipleParent2 = newInfo.parent2;
    this.order = newInfo.order;
    // console.log(
    //   `Principle parents are now ${this.principleParent1.name} and ${this.principleParent2.name}`
    // );
  }

  public shallowUpdate(): void {
    if (this._isAntipodeMode) {
      const antipode = SENodule.store.findSENoduleById(this._antipodalPointId);
      if (antipode instanceof SEPoint) {
        antipode.shallowUpdate(); // this won't create a circular reference because for a pair of antipodal intersection points only one can be in antipode mode
        this._exists = antipode.exists;
        if (this._exists) {
          this.tempVector.copy(antipode.locationVector).multiplyScalar(-1);
          this.locationVector = this.tempVector;
        }
      }
    } else {
      // The objects are in the correct order because the SEIntersectionPoint parents are assigned that way
      // console.log(
      //   `shallow update intersection between ${this.principleParent1.name} and ${this.principleParent2.name}`
      // );
      const updatedIntersectionInfo: IntersectionReturnType[] =
        intersectTwoObjects(
          this.sePrincipleParent1,
          this.sePrincipleParent2,
          SENodule.store.inverseTotalRotationMatrix
        );
      // order *should* *be* the order from the intersection of the two principle parents. If the two parents do not intersect then
      // updatedIntersectionInfo[this.order].vector is the zero vector
      // and updatedIntersectionInfo[this.order].exists is false

      this._exists = false; // this will be set to true if possible
      if (updatedIntersectionInfo[this.order].exists) {
        // this is the best outcome
        this._exists =
          this.principleParent1.exists && this.principleParent2.exists;
        this.locationVector = updatedIntersectionInfo[this.order].vector;
      } else if (this._otherParentsInfoArray.length > 0) {
        // if this point is not an intersection between the two principle parents, check to see if the existence is true for other parent info.  If so, update the principle parents.
        for (const info of this._otherParentsInfoArray) {
          info.parent1.shallowUpdate();
          info.parent2.shallowUpdate();
          if (info.parent1.exists && info.parent1.exists) {
            const intersectionInfo = intersectTwoObjects(
              info.parent1,
              info.parent2,
              SENodule.store.inverseTotalRotationMatrix
            )[info.order];
            if (intersectionInfo.exists) {
              // This means that info should be the new parents
              this.changePrincipleParents(info);
              // update the DAG
              this.principleParent1.unregisterChild(this);
              this.principleParent2.unregisterChild(this);
              info.parent1.registerChild(this);
              info.parent2.registerChild(this);
              this._exists = true;
              this.locationVector = intersectionInfo.vector;
              break; // exit the search after the first successful one
            }
          }
        }
      }
      // Update visibility
      if (this._exists && this._isUserCreated && this.showing) {
        this.ref.setVisible(true);
      } else {
        this.ref.setVisible(false);
      }
    }
  }

  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) return;

    this.setOutOfDate(false);
    this.shallowUpdate();
    // Intersection Points are completely determined by their parents and an update on the parents
    // will cause this point to be put into the correct location.So we don't store any additional information
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        // `Intersection point with id ${this.id} has been visited twice proceed no further down this branch of the DAG. Hopefully this is because we are moving two or more SENodules at the same time in the MoveHandler.`
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
    console.log("non free point query")
    return false;
  }
}
