import { SEPoint } from "./SEPoint";
import Point from "@/plottables/Point";
import { ObjectState } from "@/types";
import i18n from "@/i18n";
import { SETransformation } from "./SETransformation";

export class SETransformedPoint extends SEPoint {
  /**
   * The point parent of this SETransformedPoint
   */
  private _transformedPointParent: SEPoint;

  /**
   * The transformation parent of this SETransformedPoint
   */
  private _transformationParent: SETransformation;

  /**
   * Create an intersection point between two one-dimensional objects
   * @param point the TwoJS point associated with this intersection
   * @param transformedPointParent The parent point
   * @param transformationParent The parent transformation
   */
  constructor(
    point: Point,
    transformedPointParent: SEPoint,
    transformationParent: SETransformation
  ) {
    super(point);
    this._transformedPointParent = transformedPointParent;
    this._transformationParent = transformationParent;
  }

  public get noduleDescription(): string {
    return String(
      i18n.t(`objectTree.transformedPoint`, {
        pt: this._transformedPointParent.label?.ref.shortUserName,
        trans: this._transformationParent.name
      })
    );
  }

  public get noduleItemText(): string {
    return (
      this.label?.ref.shortUserName ??
      "No Label Short Name In SETransformationPoint"
    );
  }

  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) return;

    this.setOutOfDate(false);

    this._exists =
      this._transformedPointParent.exists && this._transformationParent.exists;

    if (this._exists) {
      // Update the current location with the opposite of the antipodal parent vector location
      this._locationVector.copy(this._transformedPointParent.locationVector);
      this._locationVector = this._transformationParent.f(this._locationVector);
      this.ref.positionVector = this._locationVector;
    }

    // Update visibility
    if (this._showing && this._exists) {
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }

    // These transformation points are completely determined by their point parent and the transformation and an update on the parents
    // will cause this transformed point to be put into the correct location. So we don't store any additional information
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        console.log(
          `Transformed point with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      orderedSENoduleList.push(this.id);
      objectState.set(this.id, { kind: "transformedPoint", object: this });
    }

    this.updateKids(objectState, orderedSENoduleList);
  }
  public isNonFreePoint(): boolean {
    return true;
  }
  public isFreePoint(): boolean {
    return false;
  }
}
