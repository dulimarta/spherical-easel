import { SEExpression } from "./SEExpression";
import { SEPoint } from "./SEPoint";
import {
  UpdateStateType,
  UpdateMode,
  ValueDisplayMode,
  ExpressionState
} from "@/types";
import { Styles } from "@/types/Styles";
import SETTINGS from "@/global-settings";
import i18n from "@/i18n";

const emptySet = new Set<Styles>();

export class SEPointDistance extends SEExpression {
  readonly firstSEPoint: SEPoint;
  readonly secondSEPoint: SEPoint;

  constructor(first: SEPoint, second: SEPoint) {
    super(); // this.name is set to a measurement token M### in the super constructor
    this.firstSEPoint = first;
    this.secondSEPoint = second;
  }

  public get noduleDescription(): string {
    return String(
      i18n.t(`objectTree.distanceBetweenPts`, {
        pt1: this.secondSEPoint.label?.ref.shortUserName,
        pt2: this.firstSEPoint.label?.ref.shortUserName,
        val: this.value
      })
    );
  }

  public get noduleItemText(): string {
    return String(
      i18n.t(`objectTree.distanceValue`, {
        token: this.name,
        val: this.prettyValue
      })
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
    // When this updates send its value to the label but this has no label to update
    //const pos = this.name.lastIndexOf(":");
    //this.name = this.name.substring(0, pos + 2) + this.prettyValue;
    this.setOutOfDate(false);
    this.updateKids(state);
  }

  public get value(): number {
    return this.firstSEPoint.locationVector.angleTo(
      this.secondSEPoint.locationVector
    );
  }

  public customStyles = (): Set<Styles> => emptySet;
}
