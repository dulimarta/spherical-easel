import { SEMeasurement } from "./SEMeasurement";
import { SEPoint } from "./SEPoint";

import { UpdateStateType, UpdateMode } from "@/types";

export enum CoordinateSelection {
  X_VALUE,
  Y_VALUE,
  Z_VALUE
}

export class SECoordinate extends SEMeasurement {
  private selector = CoordinateSelection.X_VALUE;

  constructor(point: SEPoint, selector: CoordinateSelection) {
    super();
    this.selector = selector;
    point.registerChild(this);

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
    const parentPoint = this.parents[0] as SEPoint;
    switch (this.selector) {
      case CoordinateSelection.X_VALUE:
        return parentPoint.locationVector.x;
      case CoordinateSelection.Y_VALUE:
        return parentPoint.locationVector.y;
      case CoordinateSelection.Z_VALUE:
        return parentPoint.locationVector.z;

      default:
        return Number.NaN;
    }
  }
}
