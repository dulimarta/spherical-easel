import MouseHandler from "./MouseHandler";
import { Group } from "two.js/src/group";
import Point from "@/plottables-spherical/Point";
import { AddPointByCoordinatesKommand } from "@/commands/AddPointKommand";
export class PointHandler extends MouseHandler {
  protected startMarker: Point;
  private isTemporaryPointAdded = false;
  constructor(layers: Group[]) {
    super(layers);
    this.startMarker = new Point();
  }
  mouseMoved(event: MouseEvent): void {
    super.mouseMoved(event);
    if (this.isOnSphere) {
      if (!this.isTemporaryPointAdded) {
        this.startMarker.addToLayers(this.layers);
        this.isTemporaryPointAdded = true;
      }
      this.startMarker.positionVectorAndDisplay = this.currentSphereVector;
    } else {
      if (this.isTemporaryPointAdded) {
        this.startMarker.removeFromLayers();
        this.isTemporaryPointAdded = false;
      }
    }
  }

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    if (this.isTemporaryPointAdded) {
      this.startMarker.removeFromLayers();
      this.isTemporaryPointAdded = false;
    }
  }
  mousePressed(event: MouseEvent): void {
    if (this.isOnSphere) {
      const pointCommand = new AddPointByCoordinatesKommand(
        this.currentSphereVector
      );
      pointCommand.execute();
    }
  }
  mouseReleased(event: MouseEvent): void {}
}
