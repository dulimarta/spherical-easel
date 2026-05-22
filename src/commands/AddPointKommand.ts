import { Command } from "@/commands-spherical/Command";
import { CKPoint } from "@/models/CKPoint";
import { Vector3 } from "three";

export class AddPointKommand extends Command {
  private position: Vector3;
  constructor(position: Vector3) {
    super();
    this.position = position;
  }

  restoreState(preventGraphicalUpdate?: boolean): void {}
  saveState(): void {}

  do(preventGraphicalUpdate?: boolean): void {
    const point = new CKPoint(this.position);
    console.log("Created point:", point);
  }

  toOpcode(): null | string | Array<string> {
    throw new Error("Method not implemented.");
  }
}
