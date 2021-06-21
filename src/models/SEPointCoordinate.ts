import { SEMeasurement } from "./SEMeasurement";
import { SEPoint } from "./SEPoint";
import { SEStore } from "@/store";
import { Matrix4, Vector3 } from "three";
import { Styles } from "@/types/Styles";
import { UpdateMode, UpdateStateType } from "@/types";

export enum CoordinateSelection {
  X_VALUE,
  Y_VALUE,
  Z_VALUE
}
const emptySet = new Set<Styles>();
export class SEPointCoordinate extends SEMeasurement {
  private selector = CoordinateSelection.X_VALUE;
  private point: SEPoint;

  /**
   * Temporary matrix and vector so that can compute the location of the point with out all the rotations
   */
  private invMatrix = new Matrix4();
  private tmpVector = new Vector3();

  constructor(point: SEPoint, selector: CoordinateSelection) {
    super();
    this.selector = selector;
    this.point = point;
  }

  private get coordName(): string {
    switch (this.selector) {
      case CoordinateSelection.X_VALUE:
        return "xCoord(";
      case CoordinateSelection.Y_VALUE:
        return "yCoord(";
      case CoordinateSelection.Z_VALUE:
        return "zCoord(";
    }
  }
  private get coordinateName(): string {
    switch (this.selector) {
      case CoordinateSelection.X_VALUE:
        return "x Coordinate of ";
      case CoordinateSelection.Y_VALUE:
        return "y Coordinate of ";
      case CoordinateSelection.Z_VALUE:
        return "z Coordinate of ";
    }
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

  public get longName(): string {
    return (
      this.coordinateName +
      this.point.label!.ref.shortName +
      `: ${this.prettyValue}`
    );
  }

  public get shortName(): string {
    return (
      this.coordName +
      this.point.label!.ref.shortName +
      `): ${this.prettyValue}`
    );
  }

  public update(state: UpdateStateType): void {
    if (state.mode !== UpdateMode.DisplayOnly) return;
    if (!this.canUpdateNow()) return;
    // When this updates send its value to the label
    // There is only one label but three coordinate measures so for only one of them update the label value
    if (this.selector === CoordinateSelection.X_VALUE) {
      this.tmpVector
        .copy(this.point.locationVector)
        .applyMatrix4(this.invMatrix);
      this.point.label!.ref.value = [
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
