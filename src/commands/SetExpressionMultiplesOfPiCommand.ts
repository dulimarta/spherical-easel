import { Command } from "./Command";
import { SENodule } from "@/models/SENodule";
import { Labelable } from "@/types";
import SETTINGS from "@/global-settings";
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
}
