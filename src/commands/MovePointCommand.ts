import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { Matrix4 } from "three";

export class MovePointCommand extends Command {
  private point: SEPoint;
  private rotationMat: Matrix4;
  private inverseRotation: Matrix4;
  constructor(pt: SEPoint, rotationMatrix: Matrix4) {
    super();
    this.point = pt;
    this.rotationMat = rotationMatrix.clone();
    this.inverseRotation = new Matrix4();
    this.inverseRotation.getInverse(this.rotationMat);
  }

  do(): void {
    Command.store.commit("movePoint", {
      pointId: this.point.id,
      rotationMat: this.rotationMat
    });
  }

  saveState(): void {
    this.lastState = this.point.id;
  }

  restoreState(): void {
    Command.store.commit("movePoint", {
      pointId: this.lastState,
      rotationMat: this.inverseRotation
    });
  }
}
