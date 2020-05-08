import {
  Camera,
  Mesh,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  MeshPhongMaterial,
  Layers
} from "three";
import AppStore from "@/store";
import Vertex from "@/3d-objs/Vertex";
import SETTINGS from "@/global-settings";
import Line from "@/3d-objs/Line";
const RAYCASTER = new Raycaster();

export default abstract class CursorHandler {
  protected readonly X_AXIS = new Vector3(1, 0, 0);
  protected readonly Y_AXIS = new Vector3(0, 1, 0);
  protected readonly Z_AXIS = new Vector3(0, 0, 1);

  protected camera: Camera;
  protected canvas: HTMLCanvasElement;
  protected scene: Scene;
  protected rayCaster: Raycaster;
  protected mouse: Vector2;
  protected store = AppStore; // Vuex global state
  protected currentPoint: Vector3;
  protected hitObject: Mesh | null = null;
  protected isOnSphere: boolean;
  protected theSphere: Mesh | null = null;
  protected geodesicRing: Line;

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
    this.rayCaster = RAYCASTER;
    this.mouse = new Vector2();
    this.currentPoint = new Vector3();
    this.isOnSphere = false;
    this.geodesicRing = new Line();
  }

  toNormalizeScreenCoord = (event: MouseEvent) => {
    const target = event.target as HTMLCanvasElement;
    const x = 2 * (event.offsetX / target.clientWidth) - 1;
    const y = 1 - 2 * (event.offsetY / target.clientHeight);
    return { x, y };
  };

  vec3tostr(v: Vector3): string {
    return `(${v.x.toFixed(2)}, ${v.y.toFixed(2)},${v.z.toFixed(2)})`;
  }

  /**
   * Map mouse 2D viewport position to 3D local coordinate on the sphere
   *
   * @memberof CursorHandler
   */
  mapCursorToSphere = (event: MouseEvent) => {
    const { x, y } = this.toNormalizeScreenCoord(event);
    this.mouse.x = x;
    this.mouse.y = y;
    this.rayCaster.setFromCamera(this.mouse, this.camera);

    // The result of intersection is sorted by distance (closer objects first)
    const intersections = this.rayCaster.intersectObjects(
      this.scene.children,
      true // recursive search
    );
    if (this.hitObject instanceof Vertex) {
      // Turn off emissive color on the currently selected object
      (this.hitObject.material as MeshPhongMaterial).emissive.set(0);
      this.hitObject = null;
    }
    this.isOnSphere = false;
    this.canvas.style.cursor = "default";
    this.currentPoint.set(Number.NaN, Number.NaN, Number.NaN);
    if (intersections.length == 0) {
      return;
    }
    this.isOnSphere = true;
    // change cursor shape when it is on the sphere
    this.canvas.style.cursor = "pointer";
    const hitTarget =
      intersections[0]; /* select the intersection closes to the viewer */
    if (hitTarget.object instanceof Vertex) {
      /* the vertex coordinate is local to the sphere */
      this.currentPoint.copy(hitTarget.object.position);
      this.hitObject = hitTarget.object;
      (this.hitObject?.material as MeshPhongMaterial).emissive.set(
        SETTINGS.vertex.glowColor
      );
    } else if (hitTarget.object instanceof Mesh) {
      this.theSphere = hitTarget.object;
      this.currentPoint.copy(hitTarget.point);
      /* The coordinate of the hitpoint is in the world coordinate frame, we must convert it to local frame on the sphere */
      this.theSphere?.worldToLocal(this.currentPoint);
      this.hitObject = hitTarget.object;
    } else {
      /* What to do here? */
      this.isOnSphere = false;
    }
    // console.debug("Current position", this.vec3tostr(this.currentPoint));
  };

  isLayerEnable = (l: Layers, m: number): boolean =>
    ((l.mask >> m) & 0x1) !== 0;

  abstract activate(): void;
  abstract deactivate(): void;
}
