import {
  Mesh,
  MeshStandardMaterial,
  Scene,
  SphereGeometry,
  Vector3
} from "three/webgpu";
import { SphericalTool } from "./ToolStrategy";

class MouseHandler implements SphericalTool {
  protected scene: Scene;
  constructor(scene: Scene) {
    this.scene = scene;
  }
  mouseMoved(event: MouseEvent, position: Vector3): void {}

  activate(): void {
    console.log("MouseHandler::activate");
  }

  deactivate(): void {
    console.log("MouseHandler::deactivate");
  }
}

export class PointHandler extends MouseHandler {
  private tempPoint: Mesh;
  private tempPointAdded = false;

  constructor(scene: Scene) {
    super(scene);
    this.tempPoint = new Mesh(
      new SphereGeometry(0.01, 32, 32),
      new MeshStandardMaterial({ color: 0xff0000 })
    );
  }
  mouseMoved(event: MouseEvent, position: Vector3): void {
    if (position !== null) {
      this.tempPoint.position.copy(position);
      if (!this.tempPointAdded) {
        this.scene.add(this.tempPoint);
        this.tempPointAdded = true;
      }
    } else {
      if (this.tempPointAdded) {
        this.scene.remove(this.tempPoint);
        this.tempPointAdded = false;
      }
    }
  }

  activate(): void {
    console.log("PointHandler::activate");
  }

  deactivate(): void {
    console.log("PointHandler::deactivate");
  }
}
