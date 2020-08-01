import { Command } from "./Command";
import { SECalculation } from "@/models/SECalculation";

export class AddCalculationCommand extends Command {
  private seCalculation: SECalculation;
  constructor(seCalc: SECalculation) {
    super();
    this.seCalculation = seCalc;
  }

  do(): void {
    Command.store.commit.addCalculation(this.seCalculation);
  }

  saveState(): void {
    this.lastState = this.seCalculation.id;
  }

  restoreState(): void {
    Command.store.commit.removeCalculation(this.lastState);
  }
}
