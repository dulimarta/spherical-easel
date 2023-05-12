import { SENodule } from "./SENodule";
import { Matrix4, Vector3 } from "three";
import { SETransformation } from "./SETransformation";
import { SESegment } from "./SESegment";
import { ObjectState } from "@/types";
import i18n from "@/i18n";
import { SEExpression } from "./SEExpression";
import { SELine } from "./SELine";

export class SETranslation extends SETransformation {
  private _lineOrSegment: SESegment | SELine;
  private _translationDistanceExpression: SEExpression;

  private _matrix = new Matrix4();

  constructor(
    lineOrSegment: SESegment | SELine,
    translationDistanceExpression: SEExpression
  ) {
    super();
    this._lineOrSegment = lineOrSegment;
    this._translationDistanceExpression = translationDistanceExpression;
    this.ref = lineOrSegment.ref;
    SETransformation.TRANSLATION_COUNT++;
    this.name = `Tr${SETransformation.TRANSLATION_COUNT}`;
    this.update(); // So that the transformation is initialized
  }

  get geometricChild(): SENodule {
    return this._lineOrSegment;
  }
  get seLineOrSegment(): SESegment | SELine {
    return this._lineOrSegment;
  }
  get translationDistanceExpression(): SEExpression {
    return this._translationDistanceExpression;
  }
  /**
   * f is the central transformation whose inputs are before the transformation
   * is applied and the output is the result of applying the transformation
   */
  public f(preimage: Vector3): Vector3 {
    const temp = new Vector3();
    temp.copy(preimage).applyMatrix4(this._matrix);
    return temp;
  }

  public shallowUpdate(): void {
    this._exists =
      this._lineOrSegment.exists && this._translationDistanceExpression.exists;
    if (this._exists) {
      //determine the direction to rotate?
      this._matrix.makeRotationAxis(
        this._lineOrSegment.normalVector,
        this._translationDistanceExpression.value
      );
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
    if (this._exists) {
      //determine the direction to rotate?
      this._matrix.makeRotationAxis(
        this._lineOrSegment.normalVector,
        this._translationDistanceExpression.value
      );
    }

    // This translation is completely determined by it line segment parent and an update on the parent
    // will cause this translation to be correct. So we don't store any additional information
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        console.log(
          `Translation with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      orderedSENoduleList.push(this.id);
      objectState.set(this.id, { kind: "translation", object: this });
    }

    this.updateKids(objectState, orderedSENoduleList);
  }

  public get noduleItemText(): string {
    return this.name ?? "No Translation Name In SETranslation";
  }

  public get noduleDescription(): string {
    return String(
      i18n.global.t(`objectTree.translationAlongLineSegment`, {
        along: this._lineOrSegment.label?.ref.shortUserName,
        angle: this._translationDistanceExpression.name
      })
    );
  }
}
