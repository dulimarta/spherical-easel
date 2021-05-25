import { SEMeasurement } from "./SEMeasurement";
import { SEPoint } from "./SEPoint";
import AppStore from "@/store";
import { Matrix4, Vector3 } from "three";
import { Styles } from "@/types/Styles";

export enum CoordinateSelection {
  X_VALUE,
  Y_VALUE,
  Z_VALUE
}

export class SEPointCoordinate extends SEMeasurement {
  private selector = CoordinateSelection.X_VALUE;
  private point: SEPoint;
  /**
   * The Global Vuex Store
   */
  private static store = AppStore;

  /**
   * Temporary matrix and vector so that can compute the location of the point with out all the rotations
   */
  private invMatrix = new Matrix4();
  private tmpVector = new Vector3();

  constructor(point: SEPoint, selector: CoordinateSelection) {
    super();
    this.selector = selector;
    this.point = point;
    //point.registerChild(this); //registering always happens in the commands

    this.name =
      this.name + `-${this.coordName}(${point.name}):${this.prettyValue}`;
  }

  private get coordName(): string {
    switch (this.selector) {
      case CoordinateSelection.X_VALUE:
        return "xCoord";
      case CoordinateSelection.Y_VALUE:
        return "yCoord";
      case CoordinateSelection.Z_VALUE:
        return "zCoord";
    }
  }
  public get value(): number {
    // apply the inverse of the total rotation matrix to compute the location of the point without all the sphere rotations.
    this.invMatrix = SEPointCoordinate.store.getters.getInverseTotalRotationMatrix();
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

  public customStyles(): Set<Styles> {
    throw new Error("Method not implemented.");
  }
}
