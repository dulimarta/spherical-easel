/** @format */

import { Vector3 } from "three";
import AppStore from "@/store";
import Point from "@/plotables/Point";
import Line from "@/3d-objs/Line";
import SETTINGS from "@/global-settings";
import { ToolStrategy } from "./ToolStrategy";
import Two, { BoundingClientRect, Vector } from "two.js";

/* FIXME: The 3D position and the projected 2D positions are off by a few pixels???*/
export default abstract class CursorHandler implements ToolStrategy {
  protected readonly X_AXIS = new Vector3(1, 0, 0);
  protected readonly Y_AXIS = new Vector3(0, 1, 0);
  protected readonly Z_AXIS = new Vector3(0, 0, 1);

  // protected readonly camera: Camera;
  protected readonly canvas: Two.Group;
  // protected rayCaster: Raycaster;
  protected mouse: Two.Vector;
  protected store = AppStore; // Vuex global state
  protected currentSpherePoint: Vector3;
  protected currentScreenPoint: Vector;
  protected hitObject: Point | Line | null = null;
  protected isOnSphere: boolean;
  private boundingBox: BoundingClientRect;
  constructor(scene: Two.Group) {
    this.canvas = scene;
    // the bounding rectangle is used for
    // conversion between screen and world coordinates
    this.boundingBox = scene.getBoundingClientRect();
    console.debug("Bounding box", this.boundingBox);
    // this.rayCaster = RAYCASTER;
    this.mouse = new Two.Vector(0, 0);
    this.currentSpherePoint = new Vector3();
    this.currentScreenPoint = new Two.Vector(0, 0);
    this.isOnSphere = false;
  }

  abstract activate(): void;

  //eslint-disable-next-line
  abstract mousePressed(event: MouseEvent): void;

  //eslint-disable-next-line
  abstract mouseReleased(event: MouseEvent): void;

  findNearByObjects(
    mousePos: Vector,
    spherePoint: Vector3,
    root: Two.Group
  ): Two.Object[] {
    // Apply canvas transformation to the mouse position
    mousePos.subSelf(root.translation);
    if ((root.scale as any) instanceof Two.Vector) {
      const sv = (root.scale as any) as Two.Vector;
      mousePos.multiplySelf(sv);
    } else {
      mousePos.multiplyScalar(root.scale);
    }
    return root.children.filter((obj, pos) => {
      // console.debug((obj as Two.Path).id);
      // Consider a "hit" when the object is within 5 pixels of the mouse
      return obj.translation.distanceTo(mousePos) < 5;
    });
  }
  /**
   * Convert mouse event location to X,Y coordinate within a unit square
   * @param event the mouse event
   * @memberof CursorHandler
   */
  toNormalizeScreenCoord = (event: MouseEvent) => {
    this.currentScreenPoint.x = event.offsetX;
    this.currentScreenPoint.y = event.offsetY;
    // console.debug(
    //   `Screen point (${this.currentScreenPoint.x}. ${this.currentScreenPoint.y})`
    // );
    const x =
      (2 * (event.offsetX - this.boundingBox.left)) / this.boundingBox.width -
      1;
    const y =
      1 -
      (2 * (event.offsetY - this.boundingBox.top)) / this.boundingBox.height;
    return { x, y };
  };

  /**
   * Map mouse 2D viewport position to 3D local coordinate on the sphere
   *
   * @memberof CursorHandler
   */
  mouseMoved(event: MouseEvent) {
    const { x, y } = this.toNormalizeScreenCoord(event);

    const sx = x * SETTINGS.sphere.radius + this.boundingBox.width / 2;
    const sy = y * SETTINGS.sphere.radius + this.boundingBox.height / 2;
    // console.debug(
    //   `Offset (${event.offsetX},${event.offsetY}) => (${x.toFixed(
    //     2
    //   )},${y.toFixed(2)}) => (${sx.toFixed(1)},${sy.toFixed(1)})`
    // );
    this.mouse.x = x;
    this.mouse.y = y;
    const len = this.mouse.length();
    if (len < 1) {
      // The cursor is inside the unit circle
      const zCoordinate = Math.sqrt(1 - len);
      this.currentSpherePoint.set(x, y, zCoordinate);
      this.isOnSphere = true;
      // this.currentPoint.copy(this.mouse);
      // console.debug(
      //   `Mouse location (${event.offsetX},${event.offsetY}) ` +
      //     `Sphere position ${this.currentSpherePoint.toFixed(2)}`
      // );
      if (this.hitObject) {
        this.hitObject.noGlow();
      }
      this.hitObject = null;
      this.findNearByObjects(
        this.currentScreenPoint,
        this.currentSpherePoint,
        this.canvas
      ).forEach(obj => {
        // console.debug("Intersected", (obj as Two.Path).id);
        if (obj instanceof Point || obj instanceof Line) {
          this.hitObject = obj;
          obj.glow();
        }
      });
    } else {
      this.isOnSphere = false;
      this.currentSpherePoint.set(NaN, NaN, NaN);
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
