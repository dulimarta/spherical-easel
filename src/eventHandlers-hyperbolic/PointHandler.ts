import { AddPointByCoordinatesCommand } from "@/commands-spherical/AddPointByCoordinatesCommand";
import {
  Intersection,
  Object3D,
  Object3DEventMap,
  Scene,
  Vector2,
  Vector3
} from "three";
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
    intersectionList: Intersection<Object3D<Object3DEventMap>>[]
  ): void {
    // Process the intersection list and set the flags
    super.mousePressed(event, scrPos, intersectionList);
  }

  mousePressed(
    event: MouseEvent,
    scrPos: Vector2,
    intersectionList: Intersection<Object3D<Object3DEventMap>>[]
  ): void {}

  mouseReleased(
    event: MouseEvent,
    scrPos: Vector2,
    intersectionList: Intersection<Object3D<Object3DEventMap>>[]
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
