import { SEExpression } from "./SEExpression";
import { SEPoint } from "./SEPoint";
import { SEStore } from "@/store";
import { Matrix4, Vector3 } from "three";
import { ObjectState } from "@/types";
import i18n from "@/i18n";

export enum CoordinateSelection {
  X_VALUE,
  Y_VALUE,
  Z_VALUE
}
const emptySet = new Set<string>();
export class SEPointCoordinate extends SEExpression {
  private selector = CoordinateSelection.X_VALUE;
  readonly point: SEPoint;

  /**
   * Temporary matrix and vector so that can compute the location of the point with out all the rotations
   */
  private invMatrix = new Matrix4();
  private valueVector = new Vector3();

  constructor(point: SEPoint, selector: CoordinateSelection) {
    super(); // this.name is set to a measurement token M### in the super constructor
    this.selector = selector;
    this.point = point;
  }

  public get value(): number {
    switch (this.selector) {
      case CoordinateSelection.X_VALUE:
        return this.valueVector.x;
      case CoordinateSelection.Y_VALUE:
        return this.valueVector.y;
      case CoordinateSelection.Z_VALUE:
        return this.valueVector.z;

      default:
        return Number.NaN;
    }
  }

  get sePoint(): SEPoint {
    return this.point;
  }
  public customStyles = (): Set<string> => emptySet;

  public get noduleDescription(): string {
    switch (this.selector) {
      case CoordinateSelection.X_VALUE:
        return String(
          i18n.t(`objectTree.coordinateOf`, {
            axisName: String(i18n.t(`objectTree.x`)),
            pt: this.point.label?.ref.shortUserName,
            val: this.value
          })
        );
      case CoordinateSelection.Y_VALUE:
        return String(
          i18n.t(`objectTree.coordinateOf`, {
            axisName: String(i18n.t(`objectTree.y`)),
            pt: this.point.label?.ref.shortUserName,
            val: this.value
          })
        );
      case CoordinateSelection.Z_VALUE:
        return String(
          i18n.t(`objectTree.coordinateOf`, {
            axisName: String(i18n.t(`objectTree.z`)),
            pt: this.point.label?.ref.shortUserName,
            val: this.value
          })
        );
      default:
        return this.name;
    }
  }

  public get noduleItemText(): string {
    switch (this.selector) {
      case CoordinateSelection.X_VALUE:
        return String(
          i18n.t(`objectTree.coordOf`, {
            token: this.name,
            axisName: String(i18n.t(`objectTree.x`)),
            pt: this.point.label?.ref.shortUserName,
            val: this.prettyValue
          })
        );
      case CoordinateSelection.Y_VALUE:
        return String(
          i18n.t(`objectTree.coordOf`, {
            token: this.name,
            axisName: String(i18n.t(`objectTree.y`)),
            pt: this.point.label?.ref.shortUserName,
            val: this.prettyValue
          })
        );
      case CoordinateSelection.Z_VALUE:
        return String(
          i18n.t(`objectTree.coordOf`, {
            token: this.name,
            axisName: String(i18n.t(`objectTree.z`)),
            pt: this.point.label?.ref.shortUserName,
            val: this.prettyValue
          })
        );
      default:
        return this.name;
    }
  }

  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    if (!this.canUpdateNow()) return;

    this.setOutOfDate(false);

    this.exists = this.point.exists;

    if (this.exists) {
      // apply the inverse of the total rotation matrix to compute the location of the point without all the sphere rotations.
      this.invMatrix = SEStore.inverseTotalRotationMatrix;
      this.valueVector
        .copy(this.point.locationVector)
        .applyMatrix4(this.invMatrix);

      // When this updates send its value to the label
      if (this.point.label) {
        this.point.label.ref.value = [
          this.valueVector.x,
          this.valueVector.y,
          this.valueVector.z
        ];
      }
    }

    // These point coordinates are completely determined by their parent and an update on the parent
    // will cause this point update correctly. So we don't store any additional information
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        console.log(
          `Point Coordinate with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      orderedSENoduleList.push(this.id);
      objectState.set(this.id, { kind: "pointCoordinate", object: this });
    }

    this.updateKids(objectState, orderedSENoduleList);
  }
}
