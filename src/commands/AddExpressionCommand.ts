import { Command } from "./Command";
import { SEMeasurement } from "@/models/SEMeasurement";
import { SEExpression } from "@/models/SEExpression";
import { SENodule } from "@/models/SENodule";

//#region addPointCommand
export class AddExpressionCommand extends Command {
  private seMeasurement: SEExpression;
  private expressionParents: SENodule[] = [];
  constructor(seMeasurement: SEExpression, parents: SENodule[]) {
    super();
    this.seMeasurement = seMeasurement;
    parents.forEach(p => this.expressionParents.push(p));
  }

  do(): void {
    this.expressionParents.forEach(p => p.registerChild(this.seMeasurement));
    Command.store.commit.addExpression(this.seMeasurement);
  }

  saveState(): void {
    this.lastState = this.seMeasurement.id;
  }

  restoreState(): void {
    Command.store.commit.removeExpression(this.lastState);
    this.expressionParents.forEach(p => p.unregisterChild(this.seMeasurement));
  }
}
//#endregion addPointCommand
