/** @format */

import { Vector3, Matrix4 } from "three";
import AppStore from "@/store";
import Point from "@/plotables/Point";
import Line from "@/plotables/Line";
import { ToolStrategy } from "./ToolStrategy";
import Two, { BoundingClientRect, Vector } from "two.js";
import { SEPoint } from "@/models/SEPoint";

/* FIXME: The 3D position and the projected 2D positions are off by a few pixels???*/
export default abstract class CursorHandler implements ToolStrategy {
  protected readonly X_AXIS = new Vector3(1, 0, 0);
  protected readonly Y_AXIS = new Vector3(0, 1, 0);
  protected readonly Z_AXIS = new Vector3(0, 0, 1);

  protected readonly canvas: Two.Group;
  protected store = AppStore; // Vuex global state
  protected currentSpherePoint: Vector3;
  protected currentScreenPoint: Vector;
  protected hitObject: Point | Line | null = null;
  protected startMarker: SEPoint;
  protected isOnSphere: boolean;
  protected transformMatrix: Matrix4 | null;
  // protected inverseMatrix = new Matrix4();
  private boundingBox: BoundingClientRect;
  private mouseVector = new Vector3();
  constructor(scene: Two.Group, transformMatrix?: Matrix4) {
    this.canvas = scene;
    this.transformMatrix = transformMatrix || null;
    // the bounding rectangle is used for
    // conversion between screen and world coordinates
    this.boundingBox = scene.getBoundingClientRect();
    console.debug("Bounding box", this.boundingBox);
    this.currentSpherePoint = new Vector3();
    this.currentScreenPoint = new Two.Vector(0, 0);
    this.startMarker = new SEPoint(new Point(5, 0xff8800));
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

  // TODO: remove this function???
  toNormalizeScreenCoord = (event: MouseEvent) => {
    // DOM Inheritance hierarchy:
    // SVGElement is childOf Element
    // HTMLCanvasElement is childOf HTMLElement is childOf Element
    // So Element is the nearest common ancestor of both
    // const target = event.target as Element;
    this.currentScreenPoint.x = event.offsetX;
    this.currentScreenPoint.y = event.offsetY;
    // console.debug(
    //   `Screen point (${this.currentScreenPoint.x}. ${this.currentScreenPoint.y})`
    // );

    // FIXME: boundingBox is no longer accurate after Window Resize!
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
  mouseMoved(event: MouseEvent): void {
    this.mouseVector.set(event.offsetX, event.offsetY, 0);
    console.debug("Mouse event", event);
    this.currentScreenPoint.set(event.offsetX, event.offsetY);
    if (this.transformMatrix)
      this.mouseVector.applyMatrix4(this.transformMatrix);
    console.debug(
      `Mouse location (${event.offsetX},${event.offsetY})`,
      this.mouseVector.toFixed(2)
    );
    // const { x, y } = this.toNormalizeScreenCoord(event);
    // const sphereCurrentRadius = AppStore.state.sphereRadius;
    // const sx = x * sphereCurrentRadius + this.boundingBox.width / 2;
    // const sy = y * sphereCurrentRadius + this.boundingBox.height / 2;
    // console.debug(
    //   `Offset (${event.offsetX},${event.offsetY}) => (${x.toFixed(
    //     2
    //   )},${y.toFixed(2)}) => (${sx.toFixed(1)},${sy.toFixed(1)})`
    // );
    // this.mouse.x = x;
    // this.mouse.y = y;
    const len = this.mouseVector.length();
    if (len < 1) {
      // The cursor is inside the unit circle
      const zCoordinate = Math.sqrt(1 - len);
      this.currentSpherePoint.set(
        this.mouseVector.x,
        this.mouseVector.y,
        zCoordinate
      );
      this.isOnSphere = true;
      // this.currentPoint.copy(this.mouse);
      console.debug(
        `Mouse location (${event.offsetX},${event.offsetY}) ` +
          `Sphere position ${this.currentSpherePoint.toFixed(2)}`
      );
      if (this.hitObject) {
        this.hitObject.normalStyle();
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
          obj.glowStyle();
        }
      });
    } else {
      this.isOnSphere = false;
      this.currentSpherePoint.set(NaN, NaN, NaN);
    }
  }
}
