import { SENodule } from "./SENodule";
import { Matrix4, Vector3 } from "three";
import { SETransformation } from "./SETransformation";
import { SESegment } from "./SESegment";
import { ObjectState } from "@/types";
import i18n from "@/i18n";
import { SELine } from "./SELine";

export class SEReflection extends SETransformation {
  private _lineOrSegment: SESegment | SELine;

  constructor(lineOrSegment: SESegment | SELine) {
    super();
    this._lineOrSegment = lineOrSegment;
    this.ref = lineOrSegment.ref;
    SETransformation.REFLECTION_COUNT++;
    this.name = `RL${SETransformation.REFLECTION_COUNT}`;
    this.markKidsOutOfDate();
    this.update(); // So that the transformation is initialized
  }

  get seLineOrSegment(): SESegment | SELine {
    return this._lineOrSegment;
  }

  get geometricChild(): SENodule {
    return this._lineOrSegment;
  }
  /**
   * f is the central transformation whose inputs are before the transformation
   * is applied and the output is the result of applying the transformation
   */
  public f(preimage: Vector3): Vector3 {
    const temp = new Vector3();
    temp.copy(preimage).reflect(this._lineOrSegment.normalVector);
    return temp;
  }

  public shallowUpdate(): void {
    this._exists = this._lineOrSegment.exists;
  }

  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) return;
    this.setOutOfDate(false);

    this.shallowUpdate();

    // This translation is completely determined by it line or segment parent and an update on the parent
    // will cause this reflection to be correct. So we don't store any additional information
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        console.log(
          `Reflection with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      orderedSENoduleList.push(this.id);
      objectState.set(this.id, { kind: "reflection", object: this });
    }

    this.updateKids(objectState, orderedSENoduleList);
  }

  public get noduleItemText(): string {
    return this.name ?? "No Reflection Name In SEReflection";
  }

  public get noduleDescription(): string {
    return String(
      i18n.t(`objectTree.reflectionOverLine`, {
        line: this._lineOrSegment.label?.ref.shortUserName
      })
    );
  }
}
