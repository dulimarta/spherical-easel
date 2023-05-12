import { SENodule } from "./SENodule";
import { Matrix4, Vector3 } from "three";
import { SETransformation } from "./SETransformation";
import { SESegment } from "./SESegment";
import { ObjectState } from "@/types";
import i18n from "@/i18n";
import { SEPoint } from "./SEPoint";
import { SEExpression } from "./SEExpression";
const { t } = i18n.global;

export class SERotation extends SETransformation {
  private _rotationPoint: SEPoint;
  private _rotationAngleExpression: SEExpression;
  private _matrix = new Matrix4();

  constructor(rotationPoint: SEPoint, rotationAngleExpression: SEExpression) {
    super();
    this._rotationPoint = rotationPoint;
    this._rotationAngleExpression = rotationAngleExpression;
    this.ref = rotationPoint.ref;
    SETransformation.ROTATION_COUNT++;
    this.name = `Ro${SETransformation.ROTATION_COUNT}`;
    this.markKidsOutOfDate();
    this.update(); // So that the transformation is initialized
  }

  get geometricChild(): SENodule {
    return this._rotationPoint;
  }
  get seRotationPoint(): SEPoint {
    return this._rotationPoint;
  }

  get seRotationAngleExpression(): SEExpression {
    return this._rotationAngleExpression;
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
    this._exists = this._rotationPoint.exists;
    if (this._exists) {
      //determine the direction to rotate?
      this._matrix.makeRotationAxis(
        this._rotationPoint.locationVector,
        this._rotationAngleExpression.value
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
        this._rotationPoint.locationVector,
        this._rotationAngleExpression.value
      );
    }

    // This rotation is completely determined by its point and expression parents and an update on the parents
    // will cause this rotation to be correct. So we don't store any additional information
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        console.log(
          `Rotation with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      orderedSENoduleList.push(this.id);
      objectState.set(this.id, { kind: "rotation", object: this });
    }

    this.updateKids(objectState, orderedSENoduleList);
  }

  public get noduleItemText(): string {
    return this.name ?? "No Rotation Name In SERotation";
  }

  public get noduleDescription(): string {
    return String(
      i18n.global.t(`objectTree.rotationAboutPoint`, {
        pt: this._rotationPoint.label?.ref.shortUserName,
        angle: this._rotationAngleExpression.name
      })
    );
  }
}
