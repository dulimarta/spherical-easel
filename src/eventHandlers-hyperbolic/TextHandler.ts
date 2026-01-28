import {
  Vector2,
  Vector3,
  Scene,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  DoubleSide,
  Matrix4,
  Intersection,
  Object3D,
  Object3DEventMap
} from "three";
import { PoseTracker } from "./PoseTracker";
import { createPoint } from "@/plottables-hyperbolic/MeshFactory";
import { AddHyperbolicLineCommand } from "@/commands-spherical/AddHyperbolicLineCommand";
import { HELine } from "@/models-hyperbolic/HELine";
import { get } from "@vueuse/core";

const Z_AXIS = new Vector3(0, 0, 1);
const ORIGIN = new Vector3(0, 0, 0);
export class TextHandler extends PoseTracker {
  protected _infiniteMode = false;
  constructor(scene: Scene) {
    super(scene);
    this.scene = scene;
  }
  set infiniteLineMode(value: boolean) {
    this._infiniteMode = value;
  }
  get infiniteLineMode(): boolean {
    return this._infiniteMode;
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
