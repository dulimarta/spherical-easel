import { Command } from "./Command";
import { Matrix4 } from "three";
import { toSVGReturnType } from "@/types";

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
    Command.store.rotateSphere(this.rotationMat);
  }

  saveState(): void {
    // No work required here
  }

  restoreState(): void {
    Command.store.rotateSphere(this.inverseRotation);
  }

  toSVG(deletedNoduleIds: Array<number>): null | toSVGReturnType[]{
    // First check to make sure that the object is not deleted, is showing, and exists (otherwise return null)
    //

    return null
  }

  toOpcode(): null | string | Array<string> {
    return null; // Exclude this command from interpretation
  }
}
