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
import Arrow from "@/3d-objs/Arrow";
import Vertex from "@/3d-objs/Vertex";

// This circle is on the XY-plane
const UNIT_CIRCLE = new EllipseCurve(0, 0, 1.0, 1.0, 0, Math.PI / 2, false, 0);
const X_AXIS = new Vector3(1, 0, 0); // Orientation of the circle "at rest"
const Z_AXIS = new Vector3(0, 0, 1); // Orientation of the circle "at rest"

export default class Segment extends CursorHandler {
  private startPoint: Vector3;
  private endPoint: Vector3;
  private currentSurfacePoint: Vector3;
  private circleQuaternion: Quaternion;
  private normalArrow: Arrow;
  private isMouseDown: boolean;
  private isOnSphere: boolean;
  private isCircleAdded: boolean;
  private geodesic: Line;
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
    this.normalArrow = new Arrow(1.5, 0xff6600);
    this.isMouseDown = false;
    this.isOnSphere = false;
    this.isCircleAdded = false;
    this.geodesic = new Line(
      // Subdivide the circle into 60 points
      new BufferGeometry().setFromPoints(UNIT_CIRCLE.getPoints(60)),
      new LineBasicMaterial({ color: 0xff0000 })
    );
    // this.geodesic.rotateX(-Math.PI / 2); // bring the
    // this.geodesic.rotateZ(-Math.PI / 2);
    const redDot = new Vertex(0.05, 0xff0000);
    redDot.position.set(1.0, 0, 0);
    const greenDot = new Vertex(0.05, 0x00ff44);
    greenDot.position.set(0, 1.0, 0);
    // this.geodesic.add(redDot);
    // this.geodesic.add(greenDot);
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
          this.scene.add(this.geodesic);
          this.scene.add(this.startDot);
        }
        // Reorient the geodesic circle using the cross product
        // of the start and end points
        const tmp1 = new Vector3();
        const tmp2 = new Vector3();
        // Use the cross product to determine the desired orientation of geodesic circle
        // UNIT_CIRCLE.aStartAngle = 0;
        // UNIT_CIRCLE.aEndAngle = segmentAngle;
        tmp1.crossVectors(this.startPoint, this.endPoint);

        // Assume that UP direction in the world coordinate frame
        // is the Y-axis.
        const segmentAngle =
          this.startPoint.angleTo(this.endPoint) * Math.sign(tmp1.y);
        // UNIT_CIRCLE.aRotation = -Math.PI / 2;
        this.geodesic.rotation.set(0, 0, 0);
        // The circle is on XY-plane, we will use point (R, 0, 0)
        // as our reference to rotate the circle to track the mouse point
        // tmp2.set(this.startPoint.x, this.startPoint.y, this.startPoint.z);
        // tmp2.set(this.startPoint.x, this.startPoint.y, this.startPoint.z);
        this.circleQuaternion.setFromUnitVectors(Z_AXIS, tmp1.normalize());
        tmp2.set(1, 0, 0);
        tmp2.applyQuaternion(this.circleQuaternion);
        const rotAngle = tmp2.angleTo(this.startPoint);
        this.geodesic.applyQuaternion(this.circleQuaternion);
        this.geodesic.rotateZ(-Math.sign(tmp1.y) * rotAngle);
        UNIT_CIRCLE.aEndAngle = Math.abs(segmentAngle);
        this.geodesic.geometry.setFromPoints(UNIT_CIRCLE.getPoints(60));
        console.debug(
          "Segment angle",
          (segmentAngle * Math.sign(tmp1.y)).toFixed(2),
          "Circle orientation is",
          Math.sign(tmp1.y),
          "Rotate by",
          rotAngle.toFixed(2)
        );
        // tmp1.set(hitPoint.x, hitPoint.y, hitPoint.z);
        // const rotAngle = tmp1.normalize().angleTo(Z_AXIS);
        // console.debug("Rotation angle is", rotAngle);
        // this.circleQuaternion.setFromUnitVectors(Z_AXIS, tmp1.normalize());
        // this.geodesic.applyQuaternion(this.circleQuaternion);
        // UNIT_CIRCLE.aEndAngle = segmentAngle;
      }
    }
    if (this.isCircleAdded && !this.isOnSphere) {
      this.scene.remove(this.geodesic);
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
      this.scene.remove(this.geodesic);
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
