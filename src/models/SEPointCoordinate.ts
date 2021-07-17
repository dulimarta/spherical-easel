import { SEExpression } from "./SEExpression";
import { SEPoint } from "./SEPoint";
import { SEStore } from "@/store";
import { Matrix4, Vector3 } from "three";
import { Styles } from "@/types/Styles";
import { ExpressionState, UpdateMode, UpdateStateType } from "@/types";
import i18n from "@/i18n";

export enum CoordinateSelection {
  X_VALUE,
  Y_VALUE,
  Z_VALUE
}
const emptySet = new Set<Styles>();
export class SEPointCoordinate extends SEExpression {
  private selector = CoordinateSelection.X_VALUE;
  readonly point: SEPoint;

  /**
   * Temporary matrix and vector so that can compute the location of the point with out all the rotations
   */
  private invMatrix = new Matrix4();
  private tmpVector = new Vector3();

  constructor(point: SEPoint, selector: CoordinateSelection) {
    super(); // this.name is set to a measurement token M### in the super constructor
    this.selector = selector;
    this.point = point;
  }

  public get value(): number {
    // apply the inverse of the total rotation matrix to compute the location of the point without all the sphere rotations.
    this.invMatrix = SEStore.inverseTotalRotationMatrix;
    this.tmpVector.copy(this.point.locationVector);
    switch (this.selector) {
      case CoordinateSelection.X_VALUE:
        return this.tmpVector.applyMatrix4(this.invMatrix).x;
      case CoordinateSelection.Y_VALUE:
        return this.tmpVector.applyMatrix4(this.invMatrix).y;
      case CoordinateSelection.Z_VALUE:
        return this.tmpVector.applyMatrix4(this.invMatrix).z;

      default:
        return Number.NaN;
    }
  }
  public customStyles = (): Set<Styles> => emptySet;

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

  public update(state: UpdateStateType): void {
    // This object and any of its children has no presence on the sphere canvas, so update for move should
    if (state.mode === UpdateMode.RecordStateForMove) return;
    // This object is completely determined by its parents, so only record the object in state array
    if (state.mode == UpdateMode.RecordStateForDelete) {
      const expressionState: ExpressionState = {
        kind: "expression",
        object: this
      };
      state.stateArray.push(expressionState);
    }
    if (!this.canUpdateNow()) return;
    // When this updates send its value to the label
    this.tmpVector.copy(this.point.locationVector).applyMatrix4(this.invMatrix);
    if (this.point.label) {
      this.point.label.ref.value = [
        this.tmpVector.x,
        this.tmpVector.y,
        this.tmpVector.z
      ];
    }
    //const pos = this.name.lastIndexOf(":");
    //this.name = this.name.substring(0, pos + 2) + this.prettyValue;
    this.setOutOfDate(false);
    this.updateKids(state);
  }
}
