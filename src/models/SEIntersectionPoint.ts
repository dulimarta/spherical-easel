import { SEPoint } from "./SEPoint";
import Point from "@/plottables/Point";
import { IntersectionReturnType, ObjectState } from "@/types";
import { SEOneOrTwoDimensional } from "@/types";
import { intersectTwoObjects } from "@/utils/intersections";
import i18n from "@/i18n";
import { SESegment } from "./SESegment";
import { SELine } from "./SELine";
import { SECircle } from "./SECircle";
import { SEEllipse } from "./SEEllipse";

export class SEIntersectionPoint extends SEPoint {
  /**
   * This flag is true if the user created this point
   * This flag is false if this point was automatically created
   */
  private _isUserCreated = false;

  /**
   * The One-Dimensional parents of this SEInstructionPoint
   */
  private seParent1: SEOneOrTwoDimensional;
  private seParent2: SEOneOrTwoDimensional;

  /**
   * The numbering of the intersection in the case of multiple intersection
   */
  private order: number;
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
    seParent1: SEOneOrTwoDimensional,
    seParent2: SEOneOrTwoDimensional,
    order: number,
    isUserCreated: boolean
  ) {
    super(pt);
    this.ref = pt;
    this.seParent1 = seParent1;
    this.seParent2 = seParent2;
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
    if (this.seParent1 instanceof SESegment) {
      typeParent1 = i18n.tc("objects.segments", 3);
    } else if (this.seParent1 instanceof SELine) {
      typeParent1 = i18n.tc("objects.lines", 3);
    } else if (this.seParent1 instanceof SECircle) {
      typeParent1 = i18n.tc("objects.circles", 3);
    } else if (this.seParent1 instanceof SEEllipse) {
      typeParent1 = i18n.tc("objects.ellipses", 3);
    }
    let typeParent2;
    if (this.seParent2 instanceof SESegment) {
      typeParent2 = i18n.tc("objects.segments", 3);
    } else if (this.seParent2 instanceof SELine) {
      typeParent2 = i18n.tc("objects.lines", 3);
    } else if (this.seParent2 instanceof SECircle) {
      typeParent2 = i18n.tc("objects.circles", 3);
    } else if (this.seParent2 instanceof SEEllipse) {
      typeParent2 = i18n.tc("objects.ellipses", 3);
    }
    return String(
      i18n.t(`objectTree.intersectionPoint`, {
        parent1: this.seParent1.label?.ref.shortUserName,
        typeParent1: typeParent1,
        parent2: this.seParent2.label?.ref.shortUserName,
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

  public get intersectionOrder(): number {
    return this.order;
  }

  /**
   * If the intersection point is changed to isUserCreated(true) then the point should be showing,
   * the default style should be displayed and the glowing background should be set up
   */
  set isUserCreated(flag: boolean) {
    this._isUserCreated = flag;
  }
  get isUserCreated(): boolean {
    return this._isUserCreated;
  }

  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) return;

    this.setOutOfDate(false);

    this._exists = this.seParent1.exists && this.seParent2.exists;
    if (this._exists) {
      // console.debug("Updating SEIntersectionPoint", this.name);
      // The objects are in the correct order because the SEIntersectionPoint parents are assigned that way
      const updatedIntersectionInfo: IntersectionReturnType[] = intersectTwoObjects(
        this.seParent1,
        this.seParent2
      );
      if (updatedIntersectionInfo[this.order] !== undefined) {
        this._exists = updatedIntersectionInfo[this.order].exists;
        this.locationVector = updatedIntersectionInfo[this.order].vector; // Calls the setter of SEPoint which calls the setter of Point which updates the display
      } else {
        this._exists = false;
      }
    }

    // Update visibility
    if (this._exists && this._isUserCreated && this._showing) {
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }

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
