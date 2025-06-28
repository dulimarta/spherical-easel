import { HyperbolicToolStrategy } from "@/eventHandlers/ToolStrategy";
import {
  Mesh,
  MeshStandardMaterial,
  Raycaster,
  Scene,
  SphereGeometry,
  Vector2,
  Vector3
} from "three";

export class PoseTracker implements HyperbolicToolStrategy {
  protected scene: Scene;
  // protected mouseCoordNormalized = new Vector2();
  // private rayCaster = new Raycaster();
  // private mousePoint = new Mesh(
  //   new SphereGeometry(0.05),
  //   new MeshStandardMaterial({ color: "white" })
  // );
  constructor(scene: Scene) {
    this.scene = scene;
    // this.canvas = canvas;
  }
  mouseMoved(
    event: MouseEvent,
    scrPos: Vector2,
    position: Vector3 | null,
    _direction: Vector3 | null
  ): void {
    console.debug(
      "PoseTracker::mouseMoved",
      position ? position.toFixed(2) : "N/A"
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mousePressed(event: MouseEvent, v2: Vector2, v3: Vector3, n: Vector3): void {
    // throw new Error("Method not implemented.");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mouseReleased(event: MouseEvent): void {
    throw new Error("Method not implemented.");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mouseLeave(event: MouseEvent): void {
    throw new Error("Method not implemented.");
  }
  activate(): void {
    throw new Error("Method not implemented.");
  }
  deactivate(): void {
    throw new Error("Method not implemented.");
  }
}
