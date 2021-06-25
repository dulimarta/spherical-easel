import { Command } from "./Command";
import { SEExpression } from "@/models/SEExpression";

export class SetExpressionMultiplesOfPiCommand extends Command {
  private seExpression: SEExpression;
  private displayInMultiplesOfPi: boolean;

  constructor(seExpression: SEExpression, val: boolean) {
    super();
    this.seExpression = seExpression;
    this.displayInMultiplesOfPi = val;
  }

  do(): void {
    this.seExpression.displayInMultiplesOfPi = this.displayInMultiplesOfPi;
  }

  saveState(): void {
    this.lastState = this.seExpression.id;
  }

  restoreState(): void {
    this.seExpression.displayInMultiplesOfPi = !this.displayInMultiplesOfPi;
  }

  toOpcode(): null | string | Array<string> {
    return null; // Exclude this command from interpretation
  }
}
