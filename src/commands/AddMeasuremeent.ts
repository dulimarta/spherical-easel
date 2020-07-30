import { Command } from "./Command";
import { SEMeasurement } from "@/models/SEMeasurement";

//#region addPointCommand
export class AddMeasurementCommand extends Command {
  private seMeasurement: SEMeasurement;
  constructor(seMeasurement: SEMeasurement) {
    super();
    this.seMeasurement = seMeasurement;
  }

  do(): void {
    Command.store.commit.addMeasurement(this.seMeasurement);
  }

  saveState(): void {
    this.lastState = this.seMeasurement.id;
  }

  restoreState(): void {
    Command.store.commit.removeMeasurement(this.lastState);
  }
}
//#endregion addPointCommand
