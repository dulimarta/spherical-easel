import { Command } from "./Command";
import { SENodule } from "@/models/SENodule";
import { SEExpression } from "@/models/SEExpression";

export abstract class AddExpressionCommand extends Command {
  protected seExpression: SEExpression;
  protected parents: SENodule[] = [];
  /**
   * @param seMeasurements
   * @param parents If this is included then the seExpression is made a child of all the SENodules in this array
   */
  constructor(seExpression: SEExpression, parents?: SENodule[]) {
    super();
    this.seExpression = seExpression;
    if (parents !== undefined) {
      this.parents.push(...parents);
    }
  }

  do(): void {
    this.parents.forEach(nodule => nodule.registerChild(this.seExpression));
    Command.store.addExpression(this.seExpression);
  }

  saveState(): void {
    this.lastState = this.seExpression.id;
  }

  restoreState(): void {
    Command.store.removeExpression(this.lastState);
    this.parents.forEach(nodule => nodule.unregisterChild(this.seExpression));
  }
}
