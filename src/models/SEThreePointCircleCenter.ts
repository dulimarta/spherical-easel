import { SEPoint } from "./internal";
import { ObjectState } from "@/types";
import i18n from "@/i18n";
import { Vector3 } from "three";
import SETTINGS from "@/global-settings";
const { t } = i18n.global;
import { getThreeCircleCenter } from "@/utils/helpingfunctions";

export class SEThreePointCircleCenter extends SEPoint {
  /**
   * The point parents of this SEThreePointCircleCenter
   */
  private _sePointParent1: SEPoint;
  private _sePointParent2: SEPoint;
  private _sePointParent3: SEPoint;

  private tempVector1 = new Vector3();
  private tempVector2 = new Vector3();
  private tempVector3 = new Vector3();
  /**
   * Create an intersection point between two one-dimensional objects
   * @param threePointCircleCenter the TwoJS point associated with this intersection
   * @param sePointParent1 The parent
   * @param sePointParent2 The parent
   * @param sePointParent3 The parent
   */
  constructor(
    sePointParent1: SEPoint,
    sePointParent2: SEPoint,
    sePointParent3: SEPoint
  ) {
    super(true); // Non free point and the plottable is created

    this._sePointParent1 = sePointParent1;
    this._sePointParent2 = sePointParent2;
    this._sePointParent3 = sePointParent3;

  }

  public get noduleDescription(): string {
    return String(
      i18n.global.t(`objectTree.centerOfThreePointCircle`, {
        pt1: this._sePointParent1.label?.ref.shortUserName,
        pt2: this._sePointParent2.label?.ref.shortUserName,
        pt3: this._sePointParent3.label?.ref.shortUserName
      })
    );
  }

  public get noduleItemText(): string {
    return (
      this.label?.ref.shortUserName ??
      "No Label Short Name In SEThreePointCircleCenter"
    );
  }

  get seParentPoint1(): SEPoint {
    return this._sePointParent1;
  }
  get seParentPoint2(): SEPoint {
    return this._sePointParent2;
  }
  get seParentPoint3(): SEPoint {
    return this._sePointParent3;
  }
  //#region shallowupdateview

  public shallowUpdate(): void {
    // The parent points must exist
    this._exists =
      //#endregion shallowupdateview
      this._sePointParent1.exists &&
      this._sePointParent2.exists &&
      this._sePointParent2.exists;
    // make sure that all points are not the same
    this._exists =
      this._exists &&
      !(
        this.tempVector1
          .subVectors(
            this._sePointParent1.locationVector,
            this._sePointParent2.locationVector
          )
          .isZero() &&
        this.tempVector2
          .subVectors(
            this._sePointParent2.locationVector,
            this._sePointParent3.locationVector
          )
          .isZero()
      );
    // make sure that two are not the same and the third antipodal to the other common point
    this._exists =
      this._exists &&
      //points 1 and 2 are the same and point 3 is antipodal
      !(
        this.tempVector1
          .subVectors(
            this._sePointParent1.locationVector,
            this._sePointParent2.locationVector
          )
          .isZero(SETTINGS.tolerance) &&
        this.tempVector2
          .subVectors(
            this.tempVector3
              .copy(this._sePointParent2.locationVector)
              .multiplyScalar(-1),
            this._sePointParent3.locationVector
          )
          .isZero(SETTINGS.nearlyAntipodalIdeal)
      );
    this._exists =
      this._exists &&
      //points 1 and 3 are the same and point 2 is antipodal
      !(
        this.tempVector1
          .subVectors(
            this._sePointParent1.locationVector,
            this._sePointParent3.locationVector
          )
          .isZero(SETTINGS.tolerance) &&
        this.tempVector2
          .subVectors(
            this.tempVector3
              .copy(this._sePointParent3.locationVector)
              .multiplyScalar(-1),
            this._sePointParent2.locationVector
          )
          .isZero(SETTINGS.nearlyAntipodalIdeal)
      );
    this._exists =
      this._exists &&
      //points 3 and 2 are the same and point 1 is antipodal
      !(
        this.tempVector1
          .subVectors(
            this._sePointParent3.locationVector,
            this._sePointParent2.locationVector
          )
          .isZero(SETTINGS.tolerance) &&
        this.tempVector2
          .subVectors(
            this.tempVector3
              .copy(this._sePointParent2.locationVector)
              .multiplyScalar(-1),
            this._sePointParent1.locationVector
          )
          .isZero(SETTINGS.nearlyAntipodalIdeal)
      );
    if (this._exists) {
      // set the location of the plottable object
      this._locationVector = getThreeCircleCenter(
        this._sePointParent1.locationVector,
        this._sePointParent2.locationVector,
        this._sePointParent3.locationVector
      ).normalize()
      // update the display
      this.ref.positionVector = this._locationVector;
      this.ref.updateDisplay();
   }

    // Update visibility
    if (this.showing && this._exists) {
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }
  }

  //#region updateview
  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) return;

    this.setOutOfDate(false);
    this.shallowUpdate();
    //#endregion updateview

    // #region endupdate
    // The center of the three point circles is completely determined by their point parents and an update on the parents
    // will cause this center to be put into the correct location. So we don't store any additional information
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        console.log(
          `Three Point Circle center with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      orderedSENoduleList.push(this.id);
      objectState.set(this.id, {
        kind: "threePointCircleCenter",
        object: this
      });
    }

    this.updateKids(objectState, orderedSENoduleList);

    // #endregion endupdate
  }
  public isNonFreePoint(): boolean {
    return true;
  }
  public isFreePoint(): boolean {
    return false;
  }
}
