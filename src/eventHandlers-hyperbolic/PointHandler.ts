import { Intersection, Mesh, Scene, Uniform, Vector2, Vector3 } from "three";
import { PoseTracker } from "./PoseTracker";
import * as THREE from "three/webgpu";
import { HYPERBOLIC_LAYER } from "@/global-settings-hyperbolic";
import {
  createBoundaryCone,
  createPoint,
  createPointAtInfinity,
  createPointAtInfinityTube,
  CustomNodeMaterial
} from "@/plottables-hyperbolic/MeshFactory";
const Z_AXIS = new Vector3(0, 0, 1);

export class PointHandler extends PoseTracker {
  protected tempPoint: Mesh;
  protected tempPointMaterial: CustomNodeMaterial;
  protected tempPointAtInfinity: Mesh;
  protected tempPointAtInfinityMaterial: CustomNodeMaterial;
  protected tempTube: Mesh;
  protected tempTubeMaterial: CustomNodeMaterial;
  protected tempUpperCone: Mesh;
  protected tempLowerCone: Mesh;
  private tempPointInScene = false;
  private tempPointAtInfinityInScene = false;

  constructor(scene: Scene) {
    super(scene);
    this.scene = scene;
    this.tempPoint = createPoint();
    this.tempPointMaterial = this.tempPoint.material as CustomNodeMaterial;
    this.tempPointAtInfinity = createPointAtInfinity();
    this.tempPointAtInfinityMaterial = this.tempPointAtInfinity
      .material as CustomNodeMaterial;
    this.tempTube = createPointAtInfinityTube();
    this.tempTubeMaterial = this.tempTube.material as CustomNodeMaterial;
    this.tempLowerCone = createBoundaryCone({ upper: false });
    this.tempUpperCone = createBoundaryCone({ upper: true });
  }

  mouseMoved(
    event: MouseEvent,
    scrPos: Vector2,
    intersectionList: Intersection[]
  ): void {
    // Process the intersection list and set the flags
    super.mouseMoved(event, scrPos, intersectionList);
    if (!intersectionList[0]) {
      this.scene.remove(this.tempPoint);
      this.scene.remove(this.tempPointAtInfinity);
      this.scene.remove(this.tempTube);
      this.scene.remove(this.tempUpperCone);
      this.scene.remove(this.tempLowerCone);
      return;
    }
    if (intersectionList[0].object.name.match(/(Sheet)$/)) {
      this.tempPointMaterial.position = intersectionList[0].point;
      this.scene.add(this.tempPoint);
    } else if (intersectionList[0].object.name.match(/(Infinity)$/)) {
      const location = intersectionList[0].point;
      const upper = location.z > 0 ? 1 : 0;
      const angle = Math.atan2(location.y, location.x);
      this.tempPointAtInfinityMaterial.upper = upper;
      this.tempPointAtInfinityMaterial.angle = angle;
      this.tempTubeMaterial.upper = upper;
      this.tempTubeMaterial.angle = angle;
      this.scene.add(this.tempTube);
      this.scene.add(this.tempPointAtInfinity);
      this.scene.add(upper ? this.tempUpperCone : this.tempLowerCone);
    }
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
