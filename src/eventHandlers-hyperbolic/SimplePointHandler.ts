import { Scene, Vector3 } from "three";
// import { PointSelectionHandler } from "./PointSelectionHandler";
import { AddPointByCoordinatesKommand } from "@/commands/AddPointKommand";
import { CKNodule } from "@/models/CKNodule";
import { MultiPointSelectionHandler } from "./MultiPointSelectionHandler";
import { SurfaceIntersection } from "./ToolStrategy";

export class SimplePointHandler extends MultiPointSelectionHandler {
  constructor(scene: Scene) {
    super(scene, 1);
  }

  mouseReleased(
    event: MouseEvent,
    position: Vector3,
    hitObjects: Array<CKNodule | SurfaceIntersection>
  ): void {
    super.mouseReleased(event, position, hitObjects);
    if (isNaN(position.x)) return;
    console.debug("SPH::mouseReleased", position);
    // const location = this._selectedPoints[0].locationVector;
    const pointCommand = new AddPointByCoordinatesKommand(position);
    pointCommand.execute();
    this.restart();
  }
}
