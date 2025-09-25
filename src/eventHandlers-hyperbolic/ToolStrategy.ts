// Use Strategy design pattern to enable switching tool behavior at runtime

import { Vector2, Vector3 } from "three";

export interface HyperbolicToolStrategy {
  mouseMoved(
    event: MouseEvent,
    normalizedScreenPosition: Vector2,
    position: Vector3 | null,
    normalDirection: Vector3 | null
  ): void;
  mousePressed(
    event: MouseEvent,
    normalizedScreenPosition: Vector2,
    position: Vector3 | null,
    normalDirection: Vector3 | null
  ): void;
  mouseReleased(
    event: MouseEvent,
    position: Vector3 | null,
    normalDirection: Vector3 | null
  ): void;
  // mouseLeave(event: MouseEvent): void;
  activate(): void;
  deactivate(): void;
}
