import type { Scene, Vector3 } from "three/webgpu";
import { SphericalTool } from "./ToolStrategy";
import { CKNodule } from "@/models/CKNodule";

export class MouseHandler implements SphericalTool {
  protected readonly hitObjectCache: CKNodule[] = [];
  constructor(protected scene: Scene) {
    this.scene = scene;
  }
  mouseMoved(
    event: MouseEvent,
    position: Vector3,
    hitObjects: Array<CKNodule>
  ): void {
    // console.debug(
    //   "MouseHandler::mouseMoved hit objects count",
    //   hitObjects.length
    // );
    this.hitObjectCache.forEach(hit => {
      hit.setHighlight(false);
    });
    this.hitObjectCache.splice(0);
    this.hitObjectCache.push(...hitObjects);
    hitObjects.forEach(hit => {
      hit.setHighlight(true);
    });
  }

  mousePressed(
    event: MouseEvent,
    position: Vector3,
    hitObjects: Array<CKNodule>
  ): void {
    // Nothing to do for mouse pressed in the base handler
  }
  activate(): void {
    // console.log("MouseHandler::activate");
  }

  deactivate(): void {
    // console.log("MouseHandler::deactivate");
  }
}
