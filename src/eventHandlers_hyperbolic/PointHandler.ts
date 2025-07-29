import { AddPointByCoordinatesCommand } from "@/commands/AddPointByCoordinatesCommand";
import { Scene, Vector2, Vector3 } from "three";
import { PoseTracker } from "./PoseTracker";
import { createPoint } from "@/mesh/MeshFactory";
import { HYPERBOLIC_LAYER } from "@/global-settings";
const Z_AXIS = new Vector3(0, 0, 1);
export class PointHandler extends PoseTracker {
  kleinPoint = createPoint();
  kleinPointAdded = false;
  constructor(scene: Scene) {
    super(scene);
    this.scene = scene;
    this.kleinPoint.layers.set(HYPERBOLIC_LAYER.kleinDisk);
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
      console.debug(`${position.toFixed(2)} ==> ${x * x + y * y} < ${z * z} ?`);
      // const zAngle = Z_AXIS.angleTo(position);
      if (x * x + y * y <= z * z) {
        const kleinZPos = PointHandler.hyperStore.$state.kleinDiskElevation;
        this.kleinPoint.position.set(x / z, y / z, 1).multiplyScalar(kleinZPos);

        if (!this.kleinPointAdded) {
          this.scene.add(this.kleinPoint);
          this.kleinPointAdded = true;
        }
        return;
      }
    }
    this.scene.remove(this.kleinPoint);
    this.kleinPointAdded = false;
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
