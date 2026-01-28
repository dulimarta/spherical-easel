// Use Strategy design pattern to enable switching tool behavior at runtime

import {
  Vector2,
  Vector3,
  Intersection,
  Object3D,
  Object3DEventMap
} from "three";

export interface HyperbolicToolStrategy {
  mouseMoved(
    event: MouseEvent,
    normalizedScreenPosition: Vector2,
    intersections: Intersection<Object3D<Object3DEventMap>>[]
  ): void;
  mousePressed(
    event: MouseEvent,
    normalizedScreenPosition: Vector2,
    intersections: Intersection<Object3D<Object3DEventMap>>[]
  ): void;
  mouseReleased(
    event: MouseEvent,
    normalizedScreenPosition: Vector2,
    intersections: Intersection<Object3D<Object3DEventMap>>[]
  ): void;
  mouseLeave(event: MouseEvent): void;
  activate(): void;
  deactivate(): void;
}
