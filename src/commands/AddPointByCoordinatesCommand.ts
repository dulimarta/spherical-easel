import { Command } from "@/commands/Command";
import { HELabel } from "@/models-hyperbolic/HELabel";
import { HEPoint } from "@/models-hyperbolic/HEPoint";
import { Vector3 } from "three";

export class AddPointByCoordinatesCommand extends Command {
  hePoint: HEPoint;
  constructor(coord: Vector3, surfaceNormal: Vector3) {
    super();
    this.hePoint = new HEPoint(coord, surfaceNormal);
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
