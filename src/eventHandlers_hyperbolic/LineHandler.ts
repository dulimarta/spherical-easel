import { Vector2, Vector3, Scene } from "three";
import { PoseTracker } from "./PoseTracker";

export class LineHandler extends PoseTracker {
  constructor(s: Scene) {
    super(s);
  }
  mouseMoved(
    event: MouseEvent,
    normalizedScreenPosition: Vector2,
    position: Vector3,
    normalDirection: Vector3
  ): void {
    super.mouseMoved(
      event,
      normalizedScreenPosition,
      position,
      normalDirection
    );
    if (
      this.isDragging &&
      !isNaN(this.first.position.x) &&
      !isNaN(this.second.position.x)
    ) {
      console.debug(
        `Mouse was dragged from ${this.first.position.toFixed(
          2
        )} to ${this.second.position.toFixed(2)}`
      );
    }
  }
  mousePressed(
    event: MouseEvent,
    normalizedScreenPosition: Vector2,
    position: Vector3,
    normalDirection: Vector3
  ): void {
    super.mousePressed(
      event,
      normalizedScreenPosition,
      position,
      normalDirection
    );
  }
  mouseReleased(
    event: MouseEvent,
    position: Vector3,
    normalDirection: Vector3
  ): void {
    super.mouseReleased(event, position, normalDirection);
  }
  mouseLeave(event: MouseEvent): void {
    throw new Error("Method not implemented.");
  }
  activate(): void {
    // throw new Error("Method not implemented.");
  }
  deactivate(): void {
    // throw new Error("Method not implemented.");
  }
}
