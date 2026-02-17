import { Intersection, Mesh, Scene, Uniform, Vector2, Vector3 } from "three";
import { PoseTracker } from "./PoseTracker";
import * as THREE from "three/webgpu";
import { HYPERBOLIC_LAYER } from "@/global-settings-hyperbolic";
import { createPoint } from "@/plottables-hyperbolic/MeshFactory";
const Z_AXIS = new Vector3(0, 0, 1);

export class PointHandler extends PoseTracker {
  protected tempPoint: Mesh;
  protected tempPosition: THREE.TSL.ShaderNodeObject<
    THREE.UniformNode<Vector3>
  >;
  protected tempRadius: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>;
  private tempPointInScene = false;

  constructor(scene: Scene) {
    super(scene);
    this.scene = scene;
    const pointObject = createPoint();
    this.tempPoint = pointObject.mesh;
    this.tempPosition = pointObject.position;
    this.tempRadius = pointObject.radius;
  }

  mouseMoved(
    event: MouseEvent,
    scrPos: Vector2,
    intersectionList: Intersection[]
  ): void {
    // Process the intersection list and set the flags
    console.log("here");
    super.mouseMoved(event, scrPos, intersectionList);
    if (intersectionList[0]) {
      this.scene.add(this.tempPoint);
      this.tempPosition.value = intersectionList[0].point;
    } else {
      this.scene.remove(this.tempPoint);
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
