import { Command } from "./Command";
import { Matrix4 } from "three";
import { toSVGType } from "@/types";

export class RotateSphereCommand extends Command {
  private rotationMat: Matrix4;
  private inverseRotation: Matrix4;
  constructor(rotationMatrix: Matrix4) {
    super();
    this.rotationMat = rotationMatrix.clone();
    this.inverseRotation = new Matrix4();
    this.inverseRotation.copy(this.rotationMat).invert();
  }

  do(): void {
    console.log(this.rotationMat.toArray())
    Command.store.rotateSphere(this.rotationMat);
  }

  saveState(): void {
    // No work required here
  }

  restoreState(): void {
    Command.store.rotateSphere(this.inverseRotation);
  }

  toOpcode(): null | string | Array<string> {
    return null; // Exclude this command from interpretation
  }
}
