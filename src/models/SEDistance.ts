import { SEMeasurement } from "./SEMeasurement";
import { SEPoint } from "./SEPoint";
import { UpdateStateType, UpdateMode } from "@/types";

export class SEDistance extends SEMeasurement {
  readonly firstSEPoint: SEPoint;
  readonly secondSEPoint: SEPoint;

  constructor(first: SEPoint, second: SEPoint) {
    super();
    this.firstSEPoint = first;
    this.secondSEPoint = second;
    this.name =
      this.name + `-Dist(${first.name},${second.name}):${this.length()}`;

    // This length object is a child of the segment
    first.registerChild(this);
    second.registerChild(this);
  }
  private length(): string {
    return (this.value / Math.PI).toFixed(2) + "\u{1D7B9}";
  }

  public get value(): number {
    return this.firstSEPoint.locationVector.distanceTo(
      this.secondSEPoint.locationVector
    );
  }

  public update = (state: UpdateStateType): void => {
    if (state.mode !== UpdateMode.DisplayOnly) return;
    if (!this.canUpdateNow()) return;
    const pos = this.name.lastIndexOf("):");
    this.name = this.name.substring(0, pos + 2) + this.length();
    this.setOutOfDate(false);
    this.updateKids(state);
  };
}
