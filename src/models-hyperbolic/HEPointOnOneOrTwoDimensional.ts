import { HEOneOrTwoDimensional, ObjectState } from "@/types";
import i18n from "@/i18n";
import { HEPoint } from "./HEPoint";
import { Mesh, Vector3, Vector4 } from "three";
import { CustomPointMaterial } from "@/plottables-hyperbolic/MaterialFactory";
const { t } = i18n.global;
export class HEPointOnOneOrTwoDimensional extends HEPoint {
  /**
   * The One- or Two- Dimensional parents of this HEPoint
   */
  private _parent: HEOneOrTwoDimensional;

  private tmpVector4 = new Vector3();

  constructor(
    oneDimensionalParent: HEOneOrTwoDimensional,
    initialLocation: Vector4
  ) {
    super(initialLocation, false); // Always free point
    this._parent = oneDimensionalParent;
  }

  /**
   * Set or get the location vector of the SEPointOnOneDim on the unit ideal sphere
   * If you over ride a setting your must also override the getter! (And Vice Versa)
   */
  set locationVector(pos: Vector4) {
    // If the parent is not out of date, use the closest vector, if not set the location directly
    // and the program will update the parent later so that the set location is on the parent (even though it is at the time of execution)
    if (!this._parent.isOutOfDate()) {
      const closestPoint = this._parent.closestVector(pos);
      if (closestPoint) {
        this._position.copy(closestPoint);
      } else {
        this._position.copy(pos);
      }
    } else {
      this._position.copy(pos);
    }
    // // Set the position of the associated displayed plottable Point
    // this.ref.positionVector = this._locationVector;
  }

  // public get noduleDescription(): string {
  //   let typeParent;
  //   if (this.oneDimensionalParent instanceof SESegment) {
  //     typeParent = i18n.global.t("objects.segments", 3);
  //   } else if (this.oneDimensionalParent instanceof SELine) {
  //     typeParent = i18n.global.t("objects.lines", 3);
  //   } else if (this.oneDimensionalParent instanceof SECircle) {
  //     typeParent = i18n.global.t("objects.circles", 3);
  //   } else if (this.oneDimensionalParent instanceof SEEllipse) {
  //     typeParent = i18n.global.t("objects.ellipses", 3);
  //   }

  //   return String(
  //     i18n.global.t(`objectTree.pointOnOneDimensional`, {
  //       parent: this.oneDimensionalParent.label?.ref.shortUserName,
  //       typeParent: typeParent
  //     })
  //   );
  // }

  // public get noduleItemText(): string {
  //   return (
  //     this.label?.ref.shortUserName ??
  //     "No Label Short Name In SEPointOnOneDimensional"
  //   );
  // }

  /**
   * When undoing or redoing a move, we do *not* want to use the "set locationVector" method because
   * that will set the position on a potentially out of date object. We will trust that we do not need to
   * use the closest point method and that the object that this point depends on will be move under this point (if necessary)
   *
   * Without this method being called from rotationVisitor and pointMoverVisitor, if you create a line segment, a point on that line segment.
   * Then if you move one endpoint of the line segment (causing the point on it to move maybe by shrinking the original line segment) and then you undo the movement of the
   * endpoint of the line segment, the point on the segment doesn’t return to its proper (original) location.
   * @param pos The new position of the point
   */
  // public pointDirectLocationSetter(pos: Vector3): void {
  //   // Record the location on the unit ideal sphere of this SEPoint
  //   this._locationVector.copy(pos).normalize();
  //   // Set the position of the associated displayed plottable Point
  //   this.ref.positionVector = this._locationVector;
  // }

  get parent(): HEOneOrTwoDimensional {
    return this._parent;
  }

  public shallowUpdate(): void {
    this._exists = this._parent.exists;

    if (this._exists) {
      // Update the current location with the closest point on the parent to the old location
      const closestPoint = this._parent.closestVector(this._position);
      if (closestPoint) {
        this._position.copy(closestPoint);
      } else {
        throw new Error(
          `HEPointOnOneOrTwoDimensional: closest vector of ${this._parent.name} failed`
        );
      }
    }
    super.shallowUpdate();
  }

  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    // If the parent is not up to date, don't do anything
    if (!this.canUpdateNow()) return;

    this.setOutOfDate(false);

    this.shallowUpdate();

    // These are free points on their parent and so we store additional information
    // if (objectState && orderedSENoduleList) {
    //   if (objectState.has(this.id)) {
    //     console.debug(
    //       `Point On One or Two Dimensional with id ${this.id} has been visited twice proceed no further down this branch of the DAG.` +
    //         `Hopefully this is because we are moving two or more SENodules at the same time in the MoveHandler.`
    //     );
    //     return;
    //   }
    //   orderedSENoduleList.push(this.id);
    //   const location = new Vector3();
    //   location.copy(this._locationVector);
    //   objectState.set(this.id, {
    //     kind: "pointOnOneOrTwoDimensional",
    //     object: this,
    //     locationVector: location
    //   });
    // }

    this.updateKids(); //objectState, orderedSENoduleList);
  }

  public isPointOnOneDimensional(): boolean {
    return true;
  }
}
