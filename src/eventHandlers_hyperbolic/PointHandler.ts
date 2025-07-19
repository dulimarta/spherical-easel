import { AddPointCommandByCoordinates } from "@/commands/AddPointCommandByCoordinates";
import { Scene, Vector2, Vector3 } from "three";
import { PoseTracker } from "./PoseTracker";

export class PointHandler extends PoseTracker {
  constructor(scene: Scene) {
    super(scene);
    this.scene = scene;
  }
  mouseMoved(
    event: MouseEvent,
    scrPos: Vector2,
    position: Vector3 | null,
    direction: Vector3 | null
  ): void {
    super.mouseMoved(event, scrPos, position, direction);
  }
  mousePressed(
    event: MouseEvent,
    scrPos: Vector2,
    position: Vector3 | null,
    normalDirection: Vector3 | null
  ): void {
    super.mousePressed(event, scrPos, position, normalDirection);
    if (position) {
      const cmd = new AddPointCommandByCoordinates(position);
      cmd.execute();
    }
  }
  mouseReleased(event: MouseEvent, p: Vector3, d: Vector3): void {
    super.mouseReleased(event, p, d);
    // throw new Error("Method not implemented.");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
