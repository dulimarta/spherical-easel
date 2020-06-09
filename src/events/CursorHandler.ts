/** @format */

import { Vector2, Vector3, Matrix4 } from "three";
import AppStore from "@/store";
import Point from "@/plotables/Point";
import Line from "@/plotables/Line";
import { ToolStrategy } from "./ToolStrategy";
import Two, { BoundingClientRect } from "two.js";
import globalSettings from "@/global-settings";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";

/* FIXME: The 3D position and the projected 2D positions are off by a few pixels???*/
export default abstract class CursorHandler implements ToolStrategy {
  protected readonly X_AXIS = new Vector3(1, 0, 0);
  protected readonly Y_AXIS = new Vector3(0, 1, 0);
  protected readonly Z_AXIS = new Vector3(0, 0, 1);

  protected readonly canvas: Two.Group;
  protected store = AppStore; // Vuex global state
  protected currentSpherePoint: Vector3;
  protected currentScreenPoint: Two.Vector;
  protected hitPoint: SEPoint | null = null;
  protected hitLine: SELine | null = null;
  protected startMarker: SEPoint;
  protected isOnSphere: boolean;
  protected transformMatrix: Matrix4;
  // protected inverseMatrix = new Matrix4();
  private boundingBox: BoundingClientRect;
  private mouseVector = new Vector3();
  private zoomCenter = new Vector3();
  private tmpMatrix = new Matrix4();

  /**
   * @param scene is the sphere canvas where all drawings will render
   * @param transformMatrix is the forward transform that maps the ideal unit
   * sphere to the boundary circle on the canvas. Essentially this matrix maps
   * the (ideal) world to the screen
   */
  constructor(scene: Two.Group, transformMatrix: Matrix4) {
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
  abstract mousePressed(event: MouseEvent): void;
  abstract mouseReleased(event: MouseEvent): void;

  // findNearByObjects(
  //   mousePos: Two.Vector,
  //   spherePoint: Vector3,
  //   root: Two.Group
  // ): Two.Object[] {
  //   // Apply canvas transformation to the mouse position
  //   mousePos.subSelf(root.translation);
  //   if ((root.scale as any) instanceof Two.Vector) {
  //     const sv = (root.scale as any) as Two.Vector;
  //     mousePos.multiplySelf(sv);
  //   } else {
  //     mousePos.multiplyScalar(root.scale);
  //   }
  //   return root.children.filter(obj => {
  //     // console.debug((obj as Two.Path).id);
  //     // Consider a "hit" when the object is within 5 pixels of the mouse
  //     return obj.translation.distanceTo(mousePos) < 5;
  //   });
  // }

  /**
   * Map mouse 2D viewport/screen position to 3D local coordinate on the sphere.
   * Multiplication with the inverse of the CSS transform matrix convert the
   * screen coordinate to the world of unit sphere
   *
   * @memberof CursorHandler
   */
  mouseMoved(event: MouseEvent): void {
    // Using currentTarget is necessary. Otherwise, all the calculations
    // will be based on SVG elements whose bounding rectangle may spill
    // outside of the responsive viewport and produces inaccurate
    // position calculations
    const target = (event.currentTarget || event.target) as HTMLElement;
    const boundingRect = target.getBoundingClientRect();
    // Don't rely on e.offsetX or e.offsetY, they may not be accurate
    const offsetX = event.clientX - boundingRect.left;
    const offsetY = event.clientY - boundingRect.top;
    const mouseX = offsetX - this.canvas.translation.x;
    const mouseY = -(offsetY - this.canvas.translation.y);

    // The last column of the affine transformation matrix
    // is the origin of the zoomed circle
    // ZoomCtr_in_world_ideal_sphere = inverseCSSMat * ZoomCtr_in_screen_space
    this.zoomCenter.set(
      this.transformMatrix.elements[12],
      -this.transformMatrix.elements[13], // must flip the Y-coord
      this.transformMatrix.elements[14]
    );
    // ZoomCtr = inv(CSS) * ZoomOrig
    this.zoomCenter.applyMatrix4(
      this.tmpMatrix.getInverse(this.transformMatrix)
    );

    // Map the mouse screen coordinate to its position within the ideal sphere
    // IdealPos = inv(CSS) * MousePos
    this.mouseVector.set(mouseX, mouseY, 0);
    this.mouseVector.applyMatrix4(
      this.tmpMatrix.getInverse(this.transformMatrix)
    );
    // Reposition the mouse position (in ideal sphere) relative
    // to the zoom center
    // IdealPos = IdealPos - ZoomCtr
    this.mouseVector.sub(this.zoomCenter);

    // Attempted algebraic simplification
    // IdealPos = IdealPos - ZoomCtr
    //          = inv(CSS) * MousePos - inv(CSS) * ZoomOrig
    //          = inv(CSS) * (MousePos - ZoomOrig)

    /*
    Using the algebraic simplification above, the following lines
    of code should work, but they DON'T???

    this.mouseVector.set(
      mouseX - this.transformMatrix.elements[12],
      mouseY + this.transformMatrix.elements[13],
      -this.transformMatrix.elements[14]
    );
    this.mouseVector.applyMatrix4(
      this.tmpMatrix.getInverse(this.transformMatrix)
    );
     */

    // console.debug(
    //   `Mouse location (${event.offsetX},${event.offsetY})` +
    //     `BndCircle pos: ${this.mouseVector.toFixed(2)} `
    // );
    this.currentScreenPoint.set(this.mouseVector.x, this.mouseVector.y);
    /* Rescale to unit circle */
    const len = this.mouseVector
      .multiplyScalar(1 / globalSettings.sphere.radius)
      .length();
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
      // console.debug(`Sphere pos: ${this.currentSpherePoint.toFixed(2)}`);
      // FIXME: what if we hit multiple lines or points
      this.hitPoint?.ref.normalStyle();
      this.hitLine?.ref.normalStyle();
      this.hitPoint = null;
      this.hitLine = null;
      AppStore.getters
        .findNearbyPoints(this.currentSpherePoint, this.currentScreenPoint)
        .forEach((obj: SEPoint) => {
          this.hitPoint = obj;
          console.debug("Intersected with point", obj.id);
          obj.ref.glowStyle();
        });
      AppStore.getters
        .findNearbyLines(this.currentSpherePoint, this.currentScreenPoint)
        .forEach((obj: SELine) => {
          this.hitLine = obj;
          console.debug("Intersected with line", obj.id);
          obj.ref.glowStyle();
        });
    } else {
      this.isOnSphere = false;
      this.currentSpherePoint.set(NaN, NaN, NaN);
    }
  }
}
