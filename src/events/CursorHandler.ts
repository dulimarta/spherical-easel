import {
  Mesh,
  Raycaster,
  Vector3,
} from "three";
import AppStore from "@/store";
// import Point from "@/3d-objs/Point";
// import SETTINGS from "@/global-settings";
import Line from "@/3d-objs/Line";
import { ToolStrategy } from "./ToolStrategy";
import Two, { BoundingClientRect, Vector } from 'two.js';
const RAYCASTER = new Raycaster();

export default class CursorHandler implements ToolStrategy {
  protected readonly X_AXIS = new Vector3(1, 0, 0);
  protected readonly Y_AXIS = new Vector3(0, 1, 0);
  protected readonly Z_AXIS = new Vector3(0, 0, 1);

  // protected readonly camera: Camera;
  protected readonly canvas: Two;
  protected rayCaster: Raycaster;
  protected mouse: Two.Vector;
  protected store = AppStore; // Vuex global state
  protected currentPoint: Vector; // TODO: remove this variable?
  protected currentSpherePoint: Vector3;
  protected currentScreenPoint: Vector;
  protected hitObject: Mesh | null = null;
  protected isOnSphere: boolean;
  protected theSphere: Mesh | null = null;
  protected line: Line;
  private boundingBox: BoundingClientRect;
  constructor(scene: Two) {
    // this.camera = camera;
    this.canvas = scene;
    // the bounding rectangle is used for
    // conversion between screen and world coordinates
    this.boundingBox = scene.scene.getBoundingClientRect();
    this.rayCaster = RAYCASTER;
    this.mouse = new Two.Vector(0, 0);
    this.currentPoint = new Two.Vector(0, 0);
    this.currentSpherePoint = new Vector3();
    this.currentScreenPoint = new Two.Vector(0, 0);
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

  /**
   * Convert mouse event location to X,Y coordinate within a unit square
   * @param event the mouse event
   * @memberof CursorHandler
   */
  toNormalizeScreenCoord = (event: MouseEvent) => {
    // const target = event.target as HTMLElement;
    this.currentScreenPoint.x = event.offsetX;
    this.currentScreenPoint.y = event.offsetY;
    const x = 2 * ((event.offsetX - this.boundingBox.left) / this.boundingBox.width) - 1;
    const y = 1 - 2 * ((event.offsetY - this.boundingBox.top) / this.boundingBox.height);
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
  mouseMoved(event: MouseEvent) {

    const { x, y } = this.toNormalizeScreenCoord(event);

    this.mouse.x = x;
    this.mouse.y = y;
    const len = this.mouse.length();
    if (len < 1) {
      const zCoord = Math.sqrt(1 - len);
      this.currentSpherePoint.set(x, y, zCoord);

      this.isOnSphere = true;
      this.currentPoint.copy(this.mouse);
      console.debug("Mouse location", event.offsetX, event.offsetY, this.currentPoint);
    } else {
      this.isOnSphere = false;
      this.currentSpherePoint.set(NaN, NaN, NaN);
      console.debug("OFF sphere");
    }
    // this.rayCaster.setFromCamera(this.mouse, this.camera);

    // The result of intersection is sorted by distance (closer objects first)
    // const intersections = this.rayCaster.intersectObjects(
    //   this.scene.children,
    //   true // recursive search
    // );
    // if (this.hitObject instanceof Point) {
    //   // Turn off emissive color on the currently selected object
    //   (this.hitObject.material as MeshPhongMaterial).emissive.set(0);
    //   this.hitObject = null;
    // }
    // this.isOnSphere = false;
    // const canvas = event.target as HTMLCanvasElement;

    // canvas.style.cursor = "default";
    // this.currentPoint.set(Number.NaN, Number.NaN);
    // if (intersections.length == 0) {
    //   return;
    // }
    // console.log("Intersection count: ", intersections.length);
    // this.isOnSphere = true;
    // change cursor shape when it is on the sphere
    // canvas.style.cursor = "pointer";
    // const hitTarget =
    //   intersections[0]; /* select the intersection closes to the viewer */
    // if (hitTarget.object instanceof Point) {
    //   /* the point coordinate is local to the sphere */
    //   this.currentPoint.copy(hitTarget.object.position);
    //   this.hitObject = hitTarget.object;
    //   (this.hitObject?.material as MeshPhongMaterial).emissive.set(
    //     SETTINGS.point.glowColor
    //   );
    // } else if (hitTarget.object instanceof Mesh) {
    //   this.theSphere = hitTarget.object;
    //   this.currentPoint.copy(hitTarget.point);
    //   /* The coordinate of the hitpoint is in the world coordinate frame, we must convert it to local frame on the sphere */
    //   this.theSphere?.worldToLocal(this.currentPoint);
    //   this.hitObject = hitTarget.object;
    // } else {
    //   /* What to do here? */
    //   this.isOnSphere = false;
    // }
  }
}
