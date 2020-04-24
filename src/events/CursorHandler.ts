import { Camera, Raycaster, Scene, Vector2 } from "three";
export default abstract class CursorHandler {
  protected camera: Camera;
  protected canvas: HTMLCanvasElement;
  protected scene: Scene;
  protected rayCaster: Raycaster;
  protected mouse: Vector2;
  constructor({
    canvas,
    camera,
    scene
  }: {
    canvas: HTMLCanvasElement;
    camera: Camera;
    scene: Scene;
  }) {
    this.canvas = canvas;
    this.camera = camera;
    this.scene = scene;
    this.rayCaster = new Raycaster();
    this.mouse = new Vector2();
  }
  toNormalizeScreenCoord = (event: MouseEvent) => {
    const target = event.target as HTMLCanvasElement;
    const x = 2 * (event.offsetX / target.width) - 1;
    const y = 1 - 2 * (event.offsetY / target.height);
    return { x, y };
  };

  abstract activate(): void;
  abstract deactivate(): void;
}
