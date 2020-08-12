import { SEMeasurement } from "./SEMeasurement";
import { SESegment } from "./SESegment";
import { UpdateStateType, UpdateMode } from "@/types";

export class SELength extends SEMeasurement {
  readonly seSegment: SESegment;

  constructor(parent: SESegment) {
    super();
    this.seSegment = parent;
    this.name = this.name + `-Length(${parent.name}):${this.length()}`;

    // This length object is a child of the segment
    parent.registerChild(this);
  }
  private length(): string {
    return (this.seSegment.arcLength / Math.PI).toFixed(2) + "\u{1D7B9}";
  }

  public get value(): number {
    return this.seSegment.arcLength;
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
