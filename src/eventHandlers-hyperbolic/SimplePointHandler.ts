import { Scene, Vector3 } from "three";
import { PointSelectionHandler } from "./PointSelectionHandler";
import { AddPointKommand } from "@/commands/AddPointKommand";

export class SimplePointHandler extends PointSelectionHandler {
  constructor(scene: Scene) {
    super(scene, 1);
    this.scene = scene;
  }

  mouseReleased(event: MouseEvent): void {
    super.mouseReleased(event);
    if (this.aSurfaceIsIntersected && this._allPointsSelected) {
      const location = this._selectedPoints[0].locationVector;
      const pointCommand = new AddPointKommand(
        new Vector3(location.x, location.y, location.z)
      );
      pointCommand.execute();
      this.prepareForNextPointSelections(event);
    }
  }
}
