import { Intersection, Scene, Vector2, Vector3 } from "three";
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
    intersectionList: Intersection[]
  ): void {
    // Process the intersection list and set the flags
    super.mouseMoved(event, scrPos, intersectionList);
  }

  mousePressed(
    event: MouseEvent,
    scrPos: Vector2,
    intersectionList: Intersection[]
  ): void {}

  mouseReleased(
    event: MouseEvent,
    scrPos: Vector2,
    intersectionList: Intersection[]
  ): void {
    // throw new Error("Method not implemented.");
  }

  activate(): void {
    // throw new Error("Method not implemented.");
  }
  deactivate(): void {
    super.deactivate();
  }
}
