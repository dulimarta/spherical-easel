import { SEExpression } from "./SEExpression";
import { SESegment } from "./SESegment";
import {
  UpdateStateType,
  UpdateMode,
  ValueDisplayMode,
  ExpressionState
} from "@/types";
import SETTINGS from "@/global-settings";
import i18n from "@/i18n";

const emptySet = new Set<string>();
export class SESegmentLength extends SEExpression {
  readonly seSegment: SESegment;

  constructor(parent: SESegment) {
    super(); // this.name is set to a measurement token M### in the super constructor
    this.seSegment = parent;
    this._valueDisplayMode = SETTINGS.segment.initialValueDisplayMode;
  }

  public get value(): number {
    return this.seSegment.arcLength;
  }

  public get noduleDescription(): string {
    // const val = ;
    return String(
      i18n.t(`objectTree.segmentLength`, {
        seg: this.seSegment.label?.ref.shortUserName,
        val: this.value
      })
    );
  }

  public get noduleItemText(): string {
    return (
      this.name +
      " - " +
      this.seSegment.label?.ref.shortUserName +
      `: ${this.prettyValue}`
    );
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
    // When this updates send its value to the label of the segment
    if (this.seSegment.label) {
      this.seSegment.label.ref.value = [this.value];
    }
    //const pos = this.name.lastIndexOf(":");
    //this.name = this.name.substring(0, pos + 2) + this.prettyValue;
    this.setOutOfDate(false);
    this.updateKids(state);
  }

  public customStyles = (): Set<string> => emptySet;
}
