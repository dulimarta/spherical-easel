import {
  Vector3,
  EllipseCurve,
  BufferGeometry,
  Line,
  LineBasicMaterial,
  Quaternion,
  Camera,
  Scene
} from "three";
import CursorHandler from "./CursorHandler";
import Arrow from "../3d-objs/Arrow";

// This circle is on the XY-plane
const UNIT_CIRCLE = new EllipseCurve(0, 0, 1, 1, 0, 2 * Math.PI, false, 0);
const Y_AXIS = new Vector3(0, 1, 0);
const Z_AXIS = new Vector3(0, 0, 1);

export default class LineHandler extends CursorHandler {
  private startPoint: Vector3;
  private endPoint: Vector3;
  private currentSurfacePoint: Vector3;
  private circleQuaternion: Quaternion;
  private normalArrow: Arrow;
  private isMouseDown: boolean;
  private isOnSphere: boolean;
  private isCircleAdded: boolean;
  private circle: Line;
  constructor({
    canvas,
    camera,
    scene
  }: {
    canvas: HTMLCanvasElement;
    camera: Camera;
    scene: Scene;
  }) {
    super({ canvas, camera, scene });
    this.startPoint = new Vector3();
    this.endPoint = new Vector3();
    this.currentSurfacePoint = new Vector3();
    this.circleQuaternion = new Quaternion();
    this.normalArrow = new Arrow(1.5, 0xff6600);
    this.isMouseDown = false;
    this.isOnSphere = false;
    this.isCircleAdded = false;
    this.circle = new Line(
      // Subdivide the circle into 60 points
      new BufferGeometry().setFromPoints(UNIT_CIRCLE.getPoints(60)),
      new LineBasicMaterial({ color: 0xff0000 })
    );
  }
  activate = () => {
    this.canvas.addEventListener("mousemove", this.moveHandler);
    this.canvas.addEventListener("mousedown", this.downHandler);
    this.canvas.addEventListener("mouseup", this.upHandler);
  };

  deactivate = () => {
    this.canvas.removeEventListener("mousemove", this.moveHandler);
    this.canvas.removeEventListener("mousedown", this.downHandler);
    this.canvas.removeEventListener("mouseup", this.upHandler);
  };

  moveHandler = (event: MouseEvent) => {
    // debugger; // eslint-disable-line
    this.isOnSphere = false;
    const hitPoint = this.intersectionWithSphere(event);
    if (hitPoint) {
      this.isOnSphere = true;

      this.currentSurfacePoint.set(hitPoint.x, hitPoint.y, hitPoint.z);
      this.endPoint.set(hitPoint.x, hitPoint.y, hitPoint.z);
      if (this.isMouseDown) {
        if (!this.isCircleAdded) {
          this.isCircleAdded = true;
          this.scene.add(this.circle);
        }
        // Reorient the geodesic circle using the cross product
        // of the start and end points
        const tmp = new Vector3();
        // Use the cross product to determine the desired orientation of geodesic circle
        tmp.crossVectors(this.startPoint, this.endPoint);
        // The circle is on XY-plane, its default orientation is the Z-axis
        // Determine the quaternion to rotate the circle to the desired orientation
        this.circleQuaternion.setFromUnitVectors(Z_AXIS, tmp.normalize());
        this.circle.rotation.set(0, 0, 0);
        this.circle.applyQuaternion(this.circleQuaternion);
      }
    }
    if (this.isCircleAdded && !this.isOnSphere) {
      this.scene.remove(this.circle);
      this.isCircleAdded = false;
    }
  };

  downHandler = (event: MouseEvent) => {
    // if (!this.active) return;
    this.isMouseDown = true;
    if (this.isOnSphere) {
      // Record the first point of the geodesic circle
      this.startPoint.set(
        this.currentSurfacePoint.x,
        this.currentSurfacePoint.y,
        this.currentSurfacePoint.z
      );
    }
  };

  upHandler = (event: MouseEvent) => {
    this.isMouseDown = false;
    if (this.isOnSphere) {
      // Record the second point of the geodesic circle
      this.scene.remove(this.circle);
      this.isCircleAdded = false;
      this.endPoint.set(
        this.currentSurfacePoint.x,
        this.currentSurfacePoint.y,
        this.currentSurfacePoint.z
      );
    }
  };
}
