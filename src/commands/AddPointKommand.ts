import { Command } from "./Command";
import { CKPoint } from "@/models/CKPoint";
import { Vector3 } from "three";

export class AddPointKommand extends Command {
  private ptObject: CKPoint;
  constructor(position: Vector3) {
    super();
    this.ptObject = new CKPoint(position);
    console.log("Created point:", this.ptObject);
  }

  restoreState(preventGraphicalUpdate?: boolean): void {
    console.debug("Restoring state of AddPointKommand:", this.ptObject.name);
    this.store.removePoint(this.ptObject.id);
  }

  saveState(): void {}

  do(preventGraphicalUpdate?: boolean): void {
    this.store.addPoint(this.ptObject);
  }

  toOpcode(): null | string | Array<string> {
    throw new Error("Method not implemented.");
  }
}
