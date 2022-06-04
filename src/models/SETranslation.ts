import { SENodule } from "./SENodule";
import { Matrix4, Vector3 } from "three";
import { SETransformation } from "./SETransformation";
import { SESegment } from "./SESegment";
import { ObjectState } from "@/types";
import i18n from "@/i18n";

export class SETranslation extends SETransformation {
  private _lineSegment: SESegment;
  private _matrix = new Matrix4();

  constructor(lineSegment: SESegment) {
    super();
    this._lineSegment = lineSegment;
    this.ref = lineSegment.ref;
    SETransformation.TRANSLATION_COUNT++;
    this.name = `Tr${SETransformation.TRANSLATION_COUNT}`;
  }

  get seSegment(): SESegment {
    return this._lineSegment;
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

  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) return;
    this.setOutOfDate(false);

    this._exists = this._lineSegment.exists;
    if (this._exists) {
      //determine the direction to rotate?
      this._matrix.makeRotationAxis(
        this._lineSegment.normalVector,
        this._lineSegment.arcLength
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
      i18n.t(`objectTree.translationAlongLineSegment`, {
        along: this._lineSegment.label?.ref.shortUserName,
        angle: this._lineSegment.arcLength
      })
    );
  }
}
