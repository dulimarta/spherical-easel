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
    this.hitObjectCache.forEach(hit => {
      hit.setHighlight(false);
    });
    this.hitObjectCache.splice(0);
    this.hitObjectCache.push(...hitObjects);
  }

  mousePressed(
    event: MouseEvent,
    position: Vector3,
    hitObjects: Array<CKNodule>
  ): void {}
  activate(): void {
    console.log("MouseHandler::activate");
  }

  deactivate(): void {
    console.log("MouseHandler::deactivate");
  }
}
