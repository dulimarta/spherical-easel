import { SEPoint } from "./SEPoint";
import Point from "@/plottables/Point";
import { IntersectionReturnType, ObjectState, SEOneDimensional } from "@/types";
import { SEOneOrTwoDimensional } from "@/types";
import { intersectTwoObjects } from "@/utils/intersections";
import i18n from "@/i18n";
import { SESegment } from "./SESegment";
import { SELine } from "./SELine";
import { SECircle } from "./SECircle";
import { SEEllipse } from "./SEEllipse";
import { Matrix4, Vector3 } from "three";
import { useSEStore } from "@/stores/se";
import { SENodule } from "./SENodule";
import { SEParametric } from "./SEParametric";

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

  private inverseTotalRotationMatrix: Matrix4;

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
    this.inverseTotalRotationMatrix = useSEStore().inverseTotalRotationMatrix;
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

  public addIntersectionParent(n: SEOneDimensional): void {
    // only add a new parent that is not already on the list of other parents
    if (!this.otherSEParents.some(parent => n.name === parent.name)) {
      this.otherSEParents.push(n);
    }
    //adding a parent can make the intersection point exist
    console.debug(this.name + " intersection point other parents");
    this.otherSEParents.forEach(par => console.debug(par.name + " "));
  }

  public removeIntersectionParent(n: SEOneDimensional): boolean {
    console.debug(
      `Remove parent ${n.name} from intersection point ${this.name}`
    );
    // if the parent to be removed is on the otherSEParents array just remove it
    const index = this.otherSEParents.findIndex(
      parent => parent.name === n.name
    );
    if (index > -1) {
      this.otherSEParents.splice(index, 1);
      return true;
    } else {
      // if the parent being removed is one of the two principle parents (seParent1|2), we must make sure there is
      // an element in the  otherSEParent to be put in its place and we must update the order as necessary.
      // if not return false and this means that this intersection point should be deleted or some error had occurred
      if (
        (this.sePrincipleParent1.name === n.name ||
          this.sePrincipleParent2.name === n.name) &&
        this.otherSEParents.length > 0
      ) {
        const newPrincipleParent = this.otherSEParents.splice(0, 1);
        // newPrincipleParent can be assigned to either principle spot, because the order variable of the intersection is
        // updated based on the location, but the type Lines, Segments, Circles, Ellipses, Parametric must be maintained
        // the principle parent 2 type is at the same spot or later than the principle parent 2 type on this list
        if (this.sePrincipleParent1.name === n.name) {
          this.sePrincipleParent1 = newPrincipleParent[0];
        } else {
          this.sePrincipleParent2 = newPrincipleParent[0];
        }
        if (
          (this.sePrincipleParent1 instanceof SESegment &&
            this.sePrincipleParent2 instanceof SELine) ||
          (this.sePrincipleParent1 instanceof SECircle &&
            this.sePrincipleParent2 instanceof SESegment) ||
          (this.sePrincipleParent1 instanceof SECircle &&
            this.sePrincipleParent2 instanceof SELine) ||
          (this.sePrincipleParent1 instanceof SEEllipse &&
            this.sePrincipleParent2 instanceof SECircle) ||
          (this.sePrincipleParent1 instanceof SEEllipse &&
            this.sePrincipleParent2 instanceof SESegment) ||
          (this.sePrincipleParent1 instanceof SEEllipse &&
            this.sePrincipleParent2 instanceof SELine) ||
          (this.sePrincipleParent1 instanceof SEParametric &&
            this.sePrincipleParent2 instanceof SEEllipse) ||
          (this.sePrincipleParent1 instanceof SEParametric &&
            this.sePrincipleParent2 instanceof SECircle) ||
          (this.sePrincipleParent1 instanceof SEParametric &&
            this.sePrincipleParent2 instanceof SESegment) ||
          (this.sePrincipleParent1 instanceof SEParametric &&
            this.sePrincipleParent2 instanceof SELine)
        ) {
          // switch the order of the principle parents
          const temp = this.sePrincipleParent1;
          this.sePrincipleParent1 = this.sePrincipleParent2;
          this.sePrincipleParent2 = temp;
          console.debug(
            `Intersection point principle parent switched: PP1 ${this.sePrincipleParent1.name}, PP2 ${this.sePrincipleParent2.name}`
          );
        }
        // update the order of the intersection
        // order is always the order from the intersection of the two principle parents
        const updatedIntersectionInfo: IntersectionReturnType[] =
          intersectTwoObjects(
            this.sePrincipleParent1,
            this.sePrincipleParent2,
            this.inverseTotalRotationMatrix
          );
        let updateOrderSuccessful = false;
        updatedIntersectionInfo.forEach((element, index) => {
          if (
            this.tempVector
              .subVectors(element.vector, this.locationVector)
              .isZero()
          ) {
            updateOrderSuccessful = true;
            this.order = index;
          }
        });
        if (!updateOrderSuccessful) {
          throw new Error(
            "Update Intersection Point:  Order update error. Current location not found in intersection between the two new parents."
          );
        }
        // update the addIntersectionPointCommand? No because this command (now) doesn't record the names of the principle parents so if the principle parents change the addIntersectionPointCommand is also automatically updated

        return true;
      } else {
        // The parent to remove is not on the otherSEParent array or The parent to remove is not one of the two principle parents with a backup to place into the principle parent slot
        return false; // this should not happen
      }
    }
  }

  public shallowUpdate(): void {
    // The objects are in the correct order because the SEIntersectionPoint parents are assigned that way
    const updatedIntersectionInfo: IntersectionReturnType[] =
      intersectTwoObjects(
        this.sePrincipleParent1,
        this.sePrincipleParent2,
        this.inverseTotalRotationMatrix
      );
    // order is always the order from the intersection of the two principle parents
    if (updatedIntersectionInfo[this.order] !== undefined) {
      this.locationVector = updatedIntersectionInfo[this.order].vector; // Calls the setter of SEPoint which calls the setter of Point which updates the display
      //check to see if the new location is on two existing parents (principle or other)
      const possiblyOnList = [
        this.sePrincipleParent1,
        this.sePrincipleParent2,
        ...this.otherSEParents
      ];
      let sum = 0;
      possiblyOnList.forEach(parent => {
        if (
          parent.exists &&
          parent.isHitAt(
            this.locationVector, // this is the updated location
            useSEStore().zoomMagnificationFactor
          )
        ) {
          sum += 1;
        }
      });
      // console.debug("intersection point sum", sum);
      this._exists = sum > 1; // you must be on at least two existing parents
    } else {
      this._exists = false;
    }
    console.debug(
      `Intersction Point ${this.name}, user created ${this._isUserCreated}, showing ${this._showing},exists ${this.exists}`
    );
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
