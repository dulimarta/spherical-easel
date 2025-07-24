import { Command } from "@/commands/Command";
import { HELabel } from "@/models-hyperbolic/HELabel";
import { HEPoint } from "@/models-hyperbolic/HEPoint";
import { Vector3 } from "three";

export class AddPointCommandByCoordinates extends Command {
  hePoint: HEPoint;
  // heLabel: HELabel;
  constructor(coord: Vector3, normalDir: Vector3) {
    super();
    this.hePoint = new HEPoint(coord, normalDir);
    // this.heLabel = new HELabel(this.hePoint.name, coord, normalDir);
  }
  restoreState(): void {
    Command.hstore.removePoint(this.hePoint);
  }
  saveState(): void {}

  do(): void {
    Command.hstore.addPoint(this.hePoint);
    // this.hePoint.registerChild(this.heLabel);
  }

  toOpcode(): null | string | Array<string> {
    throw new Error("Method not implemented.");
  }
}
