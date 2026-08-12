// Use Strategy design pattern to enable switching tool behavior at runtime

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
