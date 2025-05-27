import { SENodule } from "./SENodule";
import { Matrix4, Vector3 } from "three";
// import { SESegment } from "./SESegment";
import { ObjectState } from "@/types";
import i18n from "@/i18n";
import { SEPoint } from "./SEPoint";
import { SETransformation } from "./SETransformation";
const { t } = i18n.global;

export class SEPointReflection extends SETransformation {
  private _pointOfReflection: SEPoint;
  private _matrix = new Matrix4();

  constructor(pointOfReflection: SEPoint) {
    super();
    this._pointOfReflection = pointOfReflection;
    this.ref = pointOfReflection.ref;
    SETransformation.POINT_REFLECTION_COUNT;
    this.name = `Rp${SETransformation.POINT_REFLECTION_COUNT}`;
    this.markKidsOutOfDate();
    this.update(); // So that the transformation is initialized
  }

  get sePointOfReflection(): SEPoint {
    return this._pointOfReflection;
  }

  get geometricChild(): SENodule {
    return this._pointOfReflection;
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
    this._exists = this._pointOfReflection.exists;
    if (this._exists) {
      //determine the direction to rotate?
      this._matrix.makeRotationAxis(
        this._pointOfReflection.locationVector,
        Math.PI
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

    // This point reflection is completely determined by it point parent and an update on the parent
    // will cause this point reflection to be correct. So we don't store any additional information
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        console.log(
          `Reflection over point with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      orderedSENoduleList.push(this.id);
      objectState.set(this.id, { kind: "pointReflection", object: this });
    }

    this.updateKids(objectState, orderedSENoduleList);
  }

  public get noduleItemText(): string {
    return this.name ?? "No Point Reflection Name In SEPointReflection";
  }

  public get noduleDescription(): string {
    return String(
      i18n.global.t(`objectTree.reflectOverPoint`, {
        pt: this._pointOfReflection.label?.ref.shortUserName
      })
    );
  }
}
