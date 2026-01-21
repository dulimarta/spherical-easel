import { AddPointByCoordinatesCommand } from "@/commands-spherical/AddPointByCoordinatesCommand";
import { Scene, Vector2, Vector3 } from "three";
import { PoseTracker } from "./PoseTracker";
import { HYPERBOLIC_LAYER } from "@/global-settings-hyperbolic";
const Z_AXIS = new Vector3(0, 0, 1);
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
    if (position) {
      const { x, y, z } = position;
      //console.debug(`${position.toFixed(2)} ==> ${x * x + y * y} < ${z * z} ?`);
      if (x * x + y * y <= z * z) {
        console.debug("Point is on hyperboloid");
      } else {
        console.debug("Point is not on hyperboloid");
      }
    }
    // }
  }

  mousePressed(
    event: MouseEvent,
    scrPos: Vector2,
    position: Vector3 | null,
    normalDirection: Vector3 | null
  ): void {
    super.mousePressed(event, scrPos, position, normalDirection);
    if (position && normalDirection) {
      const cmd = new AddPointByCoordinatesCommand(position, normalDirection);
      cmd.execute();
    }
  }

  mouseReleased(event: MouseEvent, p: Vector3, d: Vector3): void {
    super.mouseReleased(event, p, d);
    // throw new Error("Method not implemented.");
  }

  activate(): void {
    // throw new Error("Method not implemented.");
  }
  deactivate(): void {
    // throw new Error("Method not implemented.");
  }
}
