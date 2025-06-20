// Use Strategy design pattern to enable switching tool behavior at runtime

import { Vector3 } from "three";

// #region toolStrategy
export interface ToolStrategy {
  mouseMoved(event: MouseEvent): void;
  mousePressed(event: MouseEvent, at3d?: Vector3 | null): void;
  mouseReleased(event: MouseEvent): void;
  mouseLeave(event: MouseEvent): void;
  activate(): void;
  deactivate(): void;
}
// #endregion toolStrategy
