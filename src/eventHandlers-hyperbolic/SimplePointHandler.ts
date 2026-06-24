import { Scene, Vector3 } from "three";
import { PointSelectionHandler } from "./PointSelectionHandler";
import { AddPointKommand } from "@/commands/AddPointKommand";
import { PoseTracker } from "./PoseTracker";
import { CKNodule } from "@/models/CKNodule";

export class SimplePointHandler extends PoseTracker {
  constructor(scene: Scene) {
    super(scene);
    this.scene = scene;
  }

  mouseReleased(
    event: MouseEvent,
    position: Vector3,
    hitObjects: Array<CKNodule | string>
  ): void {
    super.mouseReleased(event, position, hitObjects);
    console.debug("SPH::mouseReleased", position);
    if (this.aSurfaceIsIntersected) {
      // const location = this._selectedPoints[0].locationVector;
      const pointCommand = new AddPointKommand(position);
      pointCommand.execute();
      // this.prepareForNextPointSelections(event);
    }
  }
}
