// Use Strategy design pattern to enable switching tool behavior at runtime

// #region toolStrategy
export interface ToolStrategy {
  mouseMoved(event: MouseEvent): void;
  mousePressed(event: MouseEvent): void;
  mouseReleased(event: MouseEvent): void;
  mouseLeave(event: MouseEvent): void;
  activate(): void;
  deactivate(): void;
}
import { CKNodule } from "@/models/CKNodule";
// #endregion toolStrategy

import { Vector3 } from "three/webgpu";
export interface SphericalTool {
  mouseMoved(
    event: MouseEvent,
    position: Vector3,
    hitObjects: CKNodule[]
  ): void;
  mousePressed(
    event: MouseEvent,
    position: Vector3,
    hitObjects: CKNodule[]
  ): void;
  activate(): void;
  deactivate(): void;
}
