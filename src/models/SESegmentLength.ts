import { SEExpression } from "./SEExpression";
import { SESegment } from "./SESegment";
import { UpdateStateType, UpdateMode, ValueDisplayMode } from "@/types";
import SETTINGS from "@/global-settings";

import { Styles } from "@/types/Styles";
const emptySet = new Set<Styles>();
export class SESegmentLength extends SEExpression {
  readonly seSegment: SESegment;

  constructor(parent: SESegment) {
    super();
    this.seSegment = parent;
    this._valueDisplayMode = SETTINGS.segment.initialValueDisplayMode;
  }

  public get value(): number {
    return this.seSegment.arcLength;
  }

  public get longName(): string {
    return `Length(${this.seSegment.label!.ref.shortName}):${this.prettyValue}`;
  }

  public get shortName(): string {
    return (
      this.name +
      `-Len(` +
      this.seSegment.label!.ref.shortName +
      `):${this.prettyValue}`
    );
  }

  public update(state: UpdateStateType): void {
    if (state.mode !== UpdateMode.DisplayOnly) return;
    if (!this.canUpdateNow()) return;
    // When this updates send its value to the label of the segment
    this.seSegment.label!.ref.value = [this.value];
    //const pos = this.name.lastIndexOf(":");
    //this.name = this.name.substring(0, pos + 2) + this.prettyValue;
    this.setOutOfDate(false);
    this.updateKids(state);
  }

  public customStyles = (): Set<Styles> => emptySet;
}
