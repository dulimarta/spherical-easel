import { SENodule } from "./SENodule";
import { Matrix4, Vector3 } from "three";
import { ObjectState } from "@/types";
import i18n from "@/i18n";
import { SECircle } from "./SECircle";
import SETTINGS from "@/global-settings";
import { SETransformation } from "./SETransformation";
const { t } = i18n.global;
export class SEInversion extends SETransformation {
  private _circleOfInversion: SECircle;
  private perpVector = new Vector3();
  private toVector = new Vector3();

  constructor(circleOfInversion: SECircle) {
    super();
    this._circleOfInversion = circleOfInversion;
    this.ref = circleOfInversion.ref;
    SETransformation.INVERSION_COUNT++;
    this.name = `In${SETransformation.INVERSION_COUNT}`;
    this.markKidsOutOfDate();
    this.update(); // So that the transformation is initialized
  }

  get seCircleOfInversion(): SECircle {
    return this._circleOfInversion;
  }

  get geometricChild(): SENodule {
    return this._circleOfInversion;
  }
  /**
   * f is the central transformation whose inputs are before the transformation
   * is applied and the output is the result of applying the transformation
   */
  public f(preimage: Vector3): Vector3 {
    const temp = new Vector3();
    const angle = preimage.angleTo(
      this._circleOfInversion.centerSEPoint.locationVector
    );

    //Check if the preimage is the center of the circle
    if (angle < SETTINGS.tolerance) {
      temp.copy(preimage).multiplyScalar(-1);
    }
    // Check if the preimage is the antipode of the center of the circle
    else if (angle > Math.PI - SETTINGS.tolerance) {
      temp.copy(preimage);
    } else {
      const newAngle =
        2 *
        Math.atan(
          (Math.tan((1 / 2) * this._circleOfInversion.circleRadius) *
            Math.tan((1 / 2) * this._circleOfInversion.circleRadius)) /
            Math.tan((1 / 2) * angle)
        );
      this.perpVector
        .crossVectors(
          preimage,
          this._circleOfInversion.centerSEPoint.locationVector
        )
        .normalize();
      this.toVector
        .crossVectors(
          this._circleOfInversion.centerSEPoint.locationVector,
          this.perpVector
        )
        .normalize();
      // return vector is cos(newAngle)*circle center + sin(newAngle)*toVector
      temp
        .copy(this._circleOfInversion.centerSEPoint.locationVector)
        .multiplyScalar(Math.cos(newAngle));
      temp.addScaledVector(this.toVector, Math.sin(newAngle));
    }

    return temp;
  }
  public shallowUpdate(): void {
    this._exists = this._circleOfInversion.exists;
  }

  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) return;
    this.setOutOfDate(false);

    this.shallowUpdate();

    // This inversion is completely determined by it circle parent and an update on the parent
    // will cause this inversion to be correct. So we don't store any additional information
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        console.log(
          `Inversion with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      orderedSENoduleList.push(this.id);
      objectState.set(this.id, { kind: "inversion", object: this });
    }

    this.updateKids(objectState, orderedSENoduleList);
  }

  public get noduleItemText(): string {
    return this.name ?? "No Inversion Name In SEInversion";
  }

  public get noduleDescription(): string {
    return String(
      i18n.global.t(`objectTree.invertOverCircle`, {
        circle: this._circleOfInversion.label?.ref.shortUserName
      })
    );
  }
}
