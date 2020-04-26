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
import Vertex from "@/3d-objs/Vertex";

// This circle is on the XY-plane
const UNIT_CIRCLE = new EllipseCurve(0, 0, 1.0, 1.0, 0, 2 * Math.PI, false, 0);

export default class CirleHandler extends CursorHandler {
  private startPoint: Vector3;
  private endPoint: Vector3;
  private currentSurfacePoint: Vector3;
  private circleQuaternion: Quaternion;
  private isMouseDown: boolean;
  private isOnSphere: boolean;
  private isCircleAdded: boolean;
  private ring: Line;
  private startDot: Vertex;
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
    this.startDot = new Vertex();
    this.currentSurfacePoint = new Vector3();
    this.circleQuaternion = new Quaternion();
    // this.normalArrow = new Arrow(1.5, 0xff6600);
    this.isMouseDown = false;
    this.isOnSphere = false;
    this.isCircleAdded = false;
    this.ring = new Line(
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
          this.scene.add(this.ring);
          this.scene.add(this.startDot);
        }
        // Reorient the geodesic circle using the cross product
        // of the start and end points
        const tmp = new Vector3();
        // Use the cross product to determine the desired orientation of geodesic circle
        tmp.set(this.startPoint.x, this.startPoint.y, this.startPoint.z);
        // The circle is on XY-plane, its default orientation is the Z-axis
        // Determine the quaternion to rotate the circle to the desired orientation
        this.circleQuaternion.setFromUnitVectors(this.Z_AXIS, tmp.normalize());
        this.ring.rotation.set(0, 0, 0);
        this.ring.position.set(0, 0, 0);
        this.ring.applyQuaternion(this.circleQuaternion);
        const angle = this.startPoint.angleTo(this.endPoint);
        const ringRadius = Math.sin(angle);
        const translateDistance = Math.cos(angle);
        // scale the ring to match the radius spanned by the mouse cursor
        this.ring.scale.set(ringRadius, ringRadius, ringRadius);
        // move the ring up along the Z axis so it lays on the sphere
        this.ring.translateZ(translateDistance);
      }
    }
    if (this.isCircleAdded && !this.isOnSphere) {
      this.scene.remove(this.ring);
      this.scene.remove(this.startDot);
      this.isCircleAdded = false;
    }
  };

  downHandler = (event: MouseEvent) => {
    this.isMouseDown = true;
    if (this.isOnSphere) {
      // Record the first point of the geodesic circle
      this.startDot.position.set(
        this.currentSurfacePoint.x,
        this.currentSurfacePoint.y,
        this.currentSurfacePoint.z
      );
      this.scene.add(this.startDot);
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
      this.scene.remove(this.ring);
      this.scene.remove(this.startDot);
      this.isCircleAdded = false;
      this.endPoint.set(
        this.currentSurfacePoint.x,
        this.currentSurfacePoint.y,
        this.currentSurfacePoint.z
      );
    }
  };
}
