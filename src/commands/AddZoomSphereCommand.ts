import { Command } from "./Command";
import { Matrix4 } from "three";

export class AddZoomSphereCommand extends Command {
  private zoomMat: Matrix4;
  private inverseZoom: Matrix4;
  constructor(zoomMatrix: Matrix4) {
    super();
    this.zoomMat = zoomMatrix.clone();
    this.inverseZoom = new Matrix4();
    this.inverseZoom.getInverse(this.zoomMat);
  }

  do() {
    Command.store.commit("zoomSphere", this.zoomMat);
  }

  saveState() {
    // No work required here
  }

  restoreState() {
    Command.store.commit("zoomSphere", this.inverseZoom);
  }
}
