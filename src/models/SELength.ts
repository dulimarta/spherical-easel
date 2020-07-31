import { SEMeasurement } from "./SEMeasurement";
import { SESegment } from "./SESegment";

export class SELength extends SEMeasurement {
  readonly seSegment: SESegment;

  constructor(parent: SESegment) {
    super();
    this.name = this.name + `-Length(${parent.name})`;
    this.seSegment = parent;

    // This length object is a child of the segment
    parent.registerChild(this);
  }

  public get value(): number {
    return this.seSegment.arcLength;
  }
}
