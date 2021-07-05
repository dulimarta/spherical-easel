import { Command } from "./Command";
import { SEExpression } from "../models/SEExpression";

import { ValueDisplayMode } from "../types";

export class SetValueDisplayModeCommand extends Command {
  private seExpression: SEExpression;
  private newValueDisplayMode: ValueDisplayMode;
  private oldValueDisplayMode: ValueDisplayMode;

  constructor(
    seExpression: SEExpression,
    oldVal: ValueDisplayMode,
    newVal: ValueDisplayMode
  ) {
    super();
    this.seExpression = seExpression;
    this.oldValueDisplayMode = oldVal;
    this.newValueDisplayMode = newVal;
  }

  do(): void {
    this.seExpression.valueDisplayMode = this.newValueDisplayMode;
  }

  saveState(): void {
    this.lastState = this.seExpression.id;
  }

  restoreState(): void {
    this.seExpression.valueDisplayMode = this.oldValueDisplayMode;
  }

  toOpcode(): null | string | Array<string> {
    return null; // Exclude this command from interpretation
  }
}
