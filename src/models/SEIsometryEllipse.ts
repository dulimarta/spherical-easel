import { ObjectState, SEIsometry } from "@/types";
import i18n from "@/i18n";
import { SEEllipse } from "./SEEllipse";
import { SETranslation } from "./SETranslation";
import { SERotation } from "./SERotation";
import { SEReflection } from "./SEReflection";
import { SEPointReflection } from "./SEPointReflection";
import { SEPoint } from "./SEPoint";
const { t } = i18n.global;

export class SEIsometryEllipse extends SEEllipse {
  /**
   * The parents of this SEIsometryEllipse
   */
  private _seParentEllipse: SEEllipse;
  private _seParentIsometry: SEIsometry;
  private transType = "";

  /**
   * Create a model SEEllipse using:
   * @param ellipse The plottable TwoJS Object associated to this object
   * @param focus1Point The model SEPoint object that is one of the foci of the ellipse
   * @param focus2Point The model SEPoint object that is one of the foci of the ellipse
   * @param ellipsePoint The model SEPoint object that is on the circle
   */
  constructor(
    // ellipse: Ellipse,
    focus1Point: SEPoint,
    focus2Point: SEPoint,
    ellipsePoint: SEPoint,
    seParentEllipse: SEEllipse,
    seParentIsometry: SEIsometry
  ) {
    super(focus1Point, focus2Point, ellipsePoint, true);
    this._seParentEllipse = seParentEllipse;
    this._seParentIsometry = seParentIsometry;
    if (this._seParentIsometry instanceof SETranslation) {
      this.transType = i18n.global.t("objects.translations", 3);
    } else if (this._seParentIsometry instanceof SERotation) {
      this.transType = i18n.global.t("objects.rotations", 3);
    } else if (this._seParentIsometry instanceof SEReflection) {
      this.transType = i18n.global.t("objects.reflections", 3);
    } else if (this._seParentIsometry instanceof SEPointReflection) {
      this.transType = i18n.global.t("objects.pointReflections", 3);
    }
  }
  get parentEllipse(): SEEllipse {
    return this._seParentEllipse;
  }

  get parentIsometry(): SEIsometry {
    return this._seParentIsometry;
  }

  public get noduleDescription(): string {
    // "The image of {object} {name} under {transType} {trans}.",
    return String(
      i18n.global.t(`objectTree.transformationObject`, {
        object: i18n.global.t(`objects.ellipses`, 3),
        name: this._seParentEllipse.label?.ref.shortUserName,
        trans: this._seParentIsometry.name,
        transType: this.transType
      })
    );
  }

  public get noduleItemText(): string {
    return (
      this.label?.ref.shortUserName ??
      "No Label Short Name In SEIsometryEllipse"
    );
  }

  public shallowUpdate(): void {
    this._exists =
      this._seParentEllipse.exists && this._seParentIsometry.exists;

    if (this._exists) {
      //update the a and b values, the focus vectors are already updated because the focusSEPoint are already updated if we have reach this point in the code
      this.a = this._seParentEllipse.a;
      this.b = this._seParentEllipse.b;
      this.ref.a = this._seParentEllipse.a;
      this.ref.b = this._seParentEllipse.b;
      this.ref.focus1Vector = this.focus1SEPoint.locationVector;
      this.ref.focus2Vector = this.focus2SEPoint.locationVector;
      // display the new ellipse with the updated values
      this.ref.updateDisplay();
    }

    if (this.showing && this._exists) {
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

    // These ellipse are completely determined by their point parents and an update on the parents
    // will cause this ellipse to be put into the correct location.So we don't store any additional information
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        // `IsometryEllipse with id ${this.id} has been visited twice proceed no further down this branch of the DAG. Hopefully this is because we are moving two or more SENodules a the same time in the MoveHandler.`
        return;
      }
      orderedSENoduleList.push(this.id);
      objectState.set(this.id, { kind: "isometryEllipse", object: this });
    }

    this.updateKids(objectState, orderedSENoduleList);
  }

  public isNonFreeEllipse(): boolean {
    return true;
  }
}
