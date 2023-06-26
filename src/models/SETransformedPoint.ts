import {
  SEPoint,
  SETransformation,
  SETranslation,
  SERotation,
  SEReflection,
  SEPointReflection,
  SEInversion
} from "./internal";
import Point from "@/plottables/Point";
import { ObjectState } from "@/types";
import i18n from "@/i18n";
// import { SETransformation } from "./SETransformation";
// import { SETranslation } from "./SETranslation";
// import { SERotation } from "./SERotation";
// import { SEReflection } from "./SEReflection";
// import { SEPointReflection } from "./SEPointReflection";
// import { SEInversion } from "./SEInversion";
const { t } = i18n.global;
export class SETransformedPoint extends SEPoint {
  /**
   * The parents of this SETransformationPoint
   */
  private _seParentPoint: SEPoint;
  private _seParentTransformation: SETransformation;
  private transType = "";

  constructor(pt: Point, sePoint: SEPoint, seTransformation: SETransformation) {
    super(pt);
    this.ref = pt;
    this._seParentPoint = sePoint;
    this._seParentTransformation = seTransformation;
    if (this._seParentTransformation instanceof SETranslation) {
      this.transType = i18n.global.t("objects.translations", 3);
    } else if (this._seParentTransformation instanceof SERotation) {
      this.transType = i18n.global.t("objects.rotations", 3);
    } else if (this._seParentTransformation instanceof SEReflection) {
      this.transType = i18n.global.t("objects.reflections", 3);
    } else if (this._seParentTransformation instanceof SEPointReflection) {
      this.transType = i18n.global.t("objects.pointReflections", 3);
    } else if (this._seParentTransformation instanceof SEInversion) {
      this.transType = i18n.global.t("objects.inversions", 3);
    }
  }
  get parentPoint(): SEPoint {
    return this._seParentPoint;
  }
  get parentTransformation(): SETransformation {
    return this._seParentTransformation;
  }
  public get noduleDescription(): string {
    // "The image of {object} {name} under {transType} {trans}.",
    return String(
      i18n.global.t(`objectTree.transformationObject`, {
        object: i18n.global.t(`objects.points`, 3),
        name: this._seParentPoint.label?.ref.shortUserName,
        trans: this._seParentTransformation.name,
        transType: this.transType
      })
    );
  }

  public get noduleItemText(): string {
    return (
      this.label?.ref.shortUserName ??
      "No Label Short Name In SETransformedPoint"
    );
  }

  public shallowUpdate(): void {
    this._exists =
      this._seParentPoint.exists && this._seParentTransformation.exists;
    if (this._exists) {
      this.locationVector = this._seParentTransformation.f(
        this._seParentPoint.locationVector
      );
    }

    // Update visibility
    if (this._exists && this._showing) {
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
