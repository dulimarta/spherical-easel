// Use Strategy design pattern to enable switching tool behavior at runtime

import { SURFACE_TYPES } from "@/global-settings-hyperbolic";
import { Vector3 } from "three/webgpu";
import { CKNodule } from "@/models/CKNodule";
export interface HyperbolicToolStrategy {
  mouseMoved(
    event: MouseEvent
    //normalizedScreenPosition: Vector2,
    // intersections: Intersection[]
  ): void;
  mousePressed(
    event: MouseEvent
    //normalizedScreenPosition: Vector2,
    // intersections: Intersection[]
  ): void;
  mouseReleased(
    event: MouseEvent
    //normalizedScreenPosition: Vector2,
    // intersections: Intersection[]
  ): void;
  mouseLeave(event: MouseEvent): void;
  activate(): void;
  deactivate(): void;
}

export interface HyperbolicTool {
  mouseMoved(
    event: MouseEvent,
    position: Vector3,
    hitObjects: Array<CKNodule | string>
  ): void;
  mouseReleased(
    event: MouseEvent,
    position: Vector3,
    hitObjects: Array<CKNodule | string>
  ): void;
  mousePressed(
    event: MouseEvent,
    position: Vector3,
    hitObjects: Array<CKNodule | string>
  ): void;
  activate(): void;
  deactivate(): void;
}
