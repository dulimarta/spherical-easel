import { AddPointByCoordinatesCommand } from "@/commands-spherical/AddPointByCoordinatesCommand";
import { Scene, Vector2, Vector3 } from "three";
import { PoseTracker } from "./PoseTracker";
import { createPoint } from "@/plottables-hyperbolic/MeshFactory";
import { HYPERBOLIC_LAYER } from "@/global-settings-spherical";
const Z_AXIS = new Vector3(0, 0, 1);
export class PointHandler extends PoseTracker {
  // kleinPoint = createPoint();
  // pointcarePoint = createPoint();
  kleinPointAdded = false;
  constructor(scene: Scene) {
    super(scene);
    this.scene = scene;
    // this.kleinPoint.layers.set(HYPERBOLIC_LAYER.kleinDisk);
    // this.pointcarePoint.layers.set(HYPERBOLIC_LAYER.poincareDisk);
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
        // this.kleinPoint.position.set(x / z, y / z, 1).multiplyScalar(kleinZPos);

        // The projection below assumes that the point is on the upper hyperboloid (positive Z)
        // and center of projection at (0,0,-1)
        const poincareZ = PoseTracker.hyperStore.$state.kleinDiskElevation - 1;
        const poincareScale = (poincareZ + 1) / (Math.abs(z) + 1);
        // this.pointcarePoint.position
        //   .set(x, y, 0)
        //   .multiplyScalar(poincareScale * Math.sign(z));
        if (!this.kleinPointAdded) {
          // this.scene.add(this.kleinPoint);
          // this.scene.add(this.pointcarePoint);
          this.kleinPointAdded = true;
        }
        return;
      } else {
        console.debug("Point is not on hyperboloid");
      }
    }
    // this.scene.remove(this.kleinPoint);
    // this.scene.remove(this.pointcarePoint);
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
