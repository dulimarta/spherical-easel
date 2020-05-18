import {
  Camera,
  Mesh,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  MeshPhongMaterial
  // Layers
} from "three";
import AppStore from "@/store";
import Point from "@/3d-objs/Point";
import SETTINGS from "@/global-settings";
// import Line from "@/3d-objs/Line";
import { ToolStrategy } from "./ToolStrategy";
// import Circle from '@/3d-objs/Circle';
import Line from '@/3d-objs/Line';
const RAYCASTER = new Raycaster();

export default class CursorHandler implements ToolStrategy {
  protected readonly X_AXIS = new Vector3(1, 0, 0);
  protected readonly Y_AXIS = new Vector3(0, 1, 0);
  protected readonly Z_AXIS = new Vector3(0, 0, 1);

  protected readonly camera: Camera;
  private readonly scene: Scene;
  protected rayCaster: Raycaster;
  protected mouse: Vector2;
  protected store = AppStore; // Vuex global state
  protected currentV3Point: Vector3;
  protected hitObject: Mesh | null = null;
  protected isOnSphere: boolean;
  protected theSphere: Mesh | null = null;
  protected line: Line;
  protected eventTarget: Element;

  constructor({ camera, scene, target }: { camera: Camera; scene: Scene; target: Element }) {
    this.camera = camera;
    this.scene = scene;
    this.eventTarget = target;
    this.rayCaster = RAYCASTER;
    this.mouse = new Vector2();
    this.currentV3Point = new Vector3();
    this.isOnSphere = false;
    this.line = new Line();
  }

  activate(): void {
    throw new Error("Method not implemented.");
  }

  //eslint-disable-next-line
  mousePressed(event: MouseEvent): void {
    throw new Error("Method not implemented.");
  }

  //eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {
    throw new Error("Method not implemented.");
  }

  toNormalizeScreenCoord = (event: MouseEvent) => {
    // DOM Inheritance hierarchy:
    // SVGElement is childOf Element
    // HTMLCanvasElement is childOf HTMLElement is childOf Element
    // So Element is the nearest common ancestor of both
    // const target = event.target as Element;

    const x = 2 * (event.offsetX / this.eventTarget.clientWidth) - 1;
    const y = 1 - 2 * (event.offsetY / this.eventTarget.clientHeight);
    // console.debug(`Mouse at (${event.offsetX},${event.offsetY}) in (${this.eventTarget.clientWidth}x${this.eventTarget.clientHeight} NDX: (${x.toFixed(2)},${y.toFixed(2)})`);
    return { x, y };
  };

  vec3tostr(v: Vector3): string {
    return `(${v.x.toFixed(2)}, ${v.y.toFixed(2)},${v.z.toFixed(2)})`;
  }
  vec2tostr(v: Vector2): string {
    return `(${v.x.toFixed(2)}, ${v.y.toFixed(2)})`;
  }

  /**
   * Map mouse 2D viewport position to 3D local coordinate on the sphere
   *
   * @memberof CursorHandler
   */
  mouseMoved(event: MouseEvent) {
    const { x, y } = this.toNormalizeScreenCoord(event);
    this.mouse.x = x;
    this.mouse.y = y;
    this.rayCaster.setFromCamera(this.mouse, this.camera);

    // The result of intersection is sorted by distance (closer objects first)
    const intersections = this.rayCaster.intersectObjects(
      this.scene.children,
      true // recursive search
    );
    console.debug("CursorHandler::mouseMoved", this.vec2tostr(this.mouse), intersections.length)
    if (this.hitObject instanceof Point) {
      // Turn off emissive color on the currently selected object
      (this.hitObject.material as MeshPhongMaterial).emissive.set(0);
      this.hitObject = null;
    }
    this.isOnSphere = false;
    const canvas = event.target as SVGElement;

    this.currentV3Point.set(Number.NaN, Number.NaN, Number.NaN);
    // console.debug("Intersections", intersections);
    if (intersections.length == 0) {
      canvas.style.cursor = "default";
      return;
    }
    // change cursor shape when it is on the sphere
    canvas.style.cursor = "pointer";
    const hitTarget =
      intersections[0]; /* select the intersection closes to the viewer */
    // intersections.forEach((z, pos) => {
    //   console.debug(`Intersection ${pos} is ${z.object.type}`);
    // })
    if (hitTarget.object instanceof Point) {
      /* the point coordinate is local to the sphere */
      this.currentV3Point.copy(hitTarget.object.position);
      this.hitObject = hitTarget.object;
      (this.hitObject?.material as MeshPhongMaterial).emissive.set(
        SETTINGS.point.glowColor
      );
    } else if (hitTarget.object instanceof Mesh) {
      this.isOnSphere = true;
      this.theSphere = hitTarget.object;
      this.currentV3Point.copy(hitTarget.point);
      /* The coordinate of the hitpoint is in the world coordinate frame, we must convert it to local frame on the sphere */
      this.theSphere?.worldToLocal(this.currentV3Point);
      this.hitObject = hitTarget.object;
    } else {
      /* What to do here? */
      this.isOnSphere = false;
    }
  }
}
