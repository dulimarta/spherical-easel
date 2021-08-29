import { SEPoint } from "./SEPoint";
import Point from "@/plottables/Point";
import { ObjectState } from "@/types";
import i18n from "@/i18n";

export class SEAntipodalPoint extends SEPoint {
  /**
   * The point parent of this SEAntipodalPoint
   */
  private _antipodalPointParent: SEPoint;

  /**
   * Create an intersection point between two one-dimensional objects
   * @param point the TwoJS point associated with this intersection
   * @param antipodalPointParent The parent
   */
  constructor(point: Point, antipodalPointParent: SEPoint) {
    super(point);
    this._antipodalPointParent = antipodalPointParent;
  }

  public get noduleDescription(): string {
    return String(
      i18n.t(`objectTree.antipodeOf`, {
        pt: this._antipodalPointParent.label?.ref.shortUserName
      })
    );
  }

  public get noduleItemText(): string {
    return (
      this.label?.ref.shortUserName ?? "No Label Short Name In SEAntipodePoint"
    );
  }

  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) return;

    this.setOutOfDate(false);

    this._exists = this._antipodalPointParent.exists;

    if (this._exists) {
      // Update the current location with the opposite of the antipodal parent vector location
      this._locationVector
        .copy(this._antipodalPointParent.locationVector)
        .multiplyScalar(-1);
      this.ref.positionVector = this._locationVector;
    }

    // Update visibility
    if (this._showing && this._exists) {
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }

    // These antipodal point are completely determined by their line/segment/point parents and an update on the parents
    // will cause this antipodal point to be put into the correct location. So we don't store any additional information
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        console.log(
          `Antipodal point with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      orderedSENoduleList.push(this.id);
      objectState.set(this.id, { kind: "antipodalPoint", object: this });
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
