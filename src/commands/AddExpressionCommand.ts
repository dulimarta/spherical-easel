import { Command } from "./Command";
import { SEExpression } from "@/models/SEExpression";
import { SENodule } from "@/models/SENodule";

export class AddExpressionCommand extends Command {
  private seMeasurement: SEExpression;
  private parents: SENodule[] = [];
  /**
   * @param seMeasurementzs
   * @param parents If this is included then the seMeasurement is made a child of all the SENodules in this array
   */
  constructor(seMeasurement: SEExpression, parents?: SENodule[]) {
    super();
    this.seMeasurement = seMeasurement;
    if (parents !== undefined) {
      this.parents.push(...parents);
    }
  }

  do(): void {
    this.parents.forEach(nodule => nodule.registerChild(this.seMeasurement));
    Command.store.commit.addExpression(this.seMeasurement);
  }

  saveState(): void {
    this.lastState = this.seMeasurement.id;
  }

  restoreState(): void {
    Command.store.commit.removeExpression(this.lastState);
    this.parents.forEach(nodule => nodule.unregisterChild(this.seMeasurement));
  }

  toJSON(_arg: any): string {
    return `AddExpressions ${this.seMeasurement.name}`;
  }
}
