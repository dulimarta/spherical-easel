import { Command } from "@/commands/Command";
import { HEPoint } from "@/models-hyperbolic/HEPoint";
import { Vector3 } from "three";

export class AddPointCommandByCoordinates extends Command {
  hePoint: HEPoint;
  constructor(coord: Vector3) {
    super();
    this.hePoint = new HEPoint(coord);
  }
  restoreState(): void {
    Command.hstore.removePoint(this.hePoint);
  }
  saveState(): void {}
  do(): void {
    Command.hstore.addPoint(this.hePoint);
  }
  toOpcode(): null | string | Array<string> {
    throw new Error("Method not implemented.");
  }
}
