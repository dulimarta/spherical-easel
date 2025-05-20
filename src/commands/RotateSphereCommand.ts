import { Command } from "./Command";
import { Matrix4 } from "three";
import { toSVGType } from "@/types";
import { DisplayStyle } from "@/plottables/Nodule";

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
    // console.log(this.rotationMat.toArray())
    Command.store.rotateSphere(this.rotationMat);
    Command.store.updateTwoJS() //update the display of all objects with a fill with out this when undoing a rotation of a fill object the fill doesn't display correctly when doing or undoing
  }

  saveState(): void {
    // No work required here
  }

  restoreState(): void {
    Command.store.rotateSphere(this.inverseRotation);
    Command.store.updateTwoJS() //update the display of all objects with a fill 
  }

  toOpcode(): null | string | Array<string> {
    return null; // Exclude this command from interpretation
  }
}
