import {
  Camera,
  Intersection,
  Raycaster,
  Scene,
  Vector2,
  Vector3
} from "three";
import SETTINGS from "@/global-settings";
import AppStore from "@/store";

export default abstract class CursorHandler {
  protected readonly X_AXIS = new Vector3(1, 0, 0);
  protected readonly Y_AXIS = new Vector3(0, 1, 0);
  protected readonly Z_AXIS = new Vector3(0, 0, 1);

  protected camera: Camera;
  protected canvas: HTMLCanvasElement;
  protected scene: Scene;
  protected rayCaster: Raycaster;
  protected mouse: Vector2;
  protected store = AppStore;
  // private intersectionPoint: Vector3;
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
    this.rayCaster.layers.enable(SETTINGS.INTERSECTION_LAYER);
    // this.rayCaster.layers.set(1);
    this.mouse = new Vector2();
  }
  toNormalizeScreenCoord = (event: MouseEvent) => {
    const target = event.target as HTMLCanvasElement;
    const x = 2 * (event.offsetX / target.clientWidth) - 1;
    const y = 1 - 2 * (event.offsetY / target.clientHeight);
    return { x, y };
  };

  intersectionWithSphere(event: MouseEvent): Intersection | null {
    const { x, y } = this.toNormalizeScreenCoord(event);
    this.mouse.x = x;
    this.mouse.y = y;
    this.rayCaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.rayCaster.intersectObjects(this.scene.children);
    if (intersects.length === 0) return null;
    const objs = intersects.filter(r => {
      console.debug("Intersect with ", r.object.type);
      return r.object.type === "Mesh";
    });
    if (objs.length == 0) return null;
    else {
      return objs[0];
    }
  }
  abstract activate(): void;
  abstract deactivate(): void;
}
