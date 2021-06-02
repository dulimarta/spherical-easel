import { Command } from "./Command";
import { SENodule } from "@/models/SENodule";
import { SEMeasurement } from "@/models/SEMeasurement";

export abstract class AddMeasurementCommand extends Command {
  protected seMeasurement: SEMeasurement;
  protected parents: SENodule[] = [];
  /**
   * @param seMeasurements
   * @param parents If this is included then the seMeasurement is made a child of all the SENodules in this array
   */
  constructor(seMeasurement: SEMeasurement, parents?: SENodule[]) {
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
}
