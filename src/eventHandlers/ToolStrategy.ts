// Use Strategy design pattern to enable switching tool behavior at runtime

import { Vector3 } from "three";

// #region toolStrategy
export interface ToolStrategy {
  mouseMoved(event: MouseEvent): void;
  mousePressed(event: MouseEvent): void;
  mouseReleased(event: MouseEvent): void;
  mouseLeave(event: MouseEvent): void;
  activate(): void;
  deactivate(): void;
}
// #endregion toolStrategy

export interface HyperbolicToolStrategy {
  mouseMoved(
    event: MouseEvent,
    position: Vector3 | null,
    normalDirection: Vector3
  ): void;
  mousePressed(
    event: MouseEvent,
    position: Vector3,
    normalDirection: Vector3
  ): void;
  mouseReleased(
    event: MouseEvent,
    position: Vector3,
    normalDirection: Vector3
  ): void;
  mouseLeave(event: MouseEvent): void;
  activate(): void;
  deactivate(): void;
}
