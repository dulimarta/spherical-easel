import { SEMeasurement } from "./SEMeasurement";
import { SESegment } from "./SESegment";
// import { UpdateStateType, UpdateMode } from "@/types";

import { Styles } from "@/types/Styles";
const emptySet = new Set<Styles>();
export class SESegmentLength extends SEMeasurement {
  readonly seSegment: SESegment;

  constructor(parent: SESegment) {
    super();
    this.seSegment = parent;
    this.name = this.name + `-Length(${parent.name}):${this.prettyValue}`;

    // This length object is a child of the segment
    //parent.registerChild(this); //registering always happens in the commands
  }
  public get prettyValue(): string {
    return (this.seSegment.arcLength / Math.PI).toFixed(2) + "\u{1D7B9}";
  }

  public get value(): number {
    return this.seSegment.arcLength;
  }

  public customStyles = (): Set<Styles> => emptySet;
}
