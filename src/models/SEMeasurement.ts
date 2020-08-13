import { SEExpression } from "./SEExpression";
import { UpdateStateType, UpdateMode } from "@/types";

export abstract class SEMeasurement extends SEExpression {
  public abstract prettyValue(): string;

  public update = (state: UpdateStateType): void => {
    if (state.mode !== UpdateMode.DisplayOnly) return;
    if (!this.canUpdateNow()) return;
    const pos = this.name.lastIndexOf("):");
    this.name = this.name.substring(0, pos + 2) + this.prettyValue();
    this.setOutOfDate(false);
    this.updateKids(state);
  };
}
