import { HyperbolicToolStrategy } from "@/eventHandlers/ToolStrategy";
import {
  Mesh,
  MeshStandardMaterial,
  Raycaster,
  Scene,
  SphereGeometry,
  Vector2
} from "three";

export class PoseTracker implements HyperbolicToolStrategy {
  private scene: Scene;
  private canvas: HTMLCanvasElement;
  protected mouseCoordNormalized = new Vector2();
  private rayCaster = new Raycaster();
  private mousePoint = new Mesh(
    new SphereGeometry(0.05),
    new MeshStandardMaterial({ color: "white" })
  );
  constructor(scene: Scene, canvas: HTMLCanvasElement) {
    this.scene = scene;
    this.canvas = canvas;
  }
  mouseMoved(event: MouseEvent): void {
    this.mouseCoordNormalized.x =
      2 * (event.offsetX / this.canvas.clientWidth) - 1;
    this.mouseCoordNormalized.y =
      1 - 2 * (event.offsetY / this.canvas.clientHeight);
    console.debug("Inside PoseTracker::mouseMove", event);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mousePressed(event: MouseEvent): void {
    throw new Error("Method not implemented.");
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
