import { Command } from "./Command";
import { SEMeasurement } from "@/models/SEMeasurement";
import { SEExpression } from "@/models/SEExpression";

//#region addPointCommand
export class AddExpressionCommand extends Command {
  private seMeasurement: SEExpression;
  constructor(seMeasurement: SEExpression) {
    super();
    this.seMeasurement = seMeasurement;
  }

  do(): void {
    Command.store.commit.addExpression(this.seMeasurement);
  }

  saveState(): void {
    this.lastState = this.seMeasurement.id;
  }

  restoreState(): void {
    Command.store.commit.addExpression(this.lastState);
  }
}
//#endregion addPointCommand
