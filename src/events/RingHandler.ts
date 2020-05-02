import { Vector3, Quaternion, Camera, Scene } from "three";
import CursorHandler from "./CursorHandler";
import Vertex from "@/3d-objs/Vertex";
import SETTINGS from "@/global-settings";

export default class CirleHandler extends CursorHandler {
  private startPoint: Vector3;
  private endPoint: Vector3;
  private tempVector: Vector3;
  private circleQuaternion: Quaternion;
  private isMouseDown: boolean;
  private isCircleAdded: boolean;
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
    this.tempVector = new Vector3();
    this.startDot = new Vertex();
    this.circleQuaternion = new Quaternion();
    this.isMouseDown = false;
    this.isCircleAdded = false;
  }
  activate = () => {
    this.canvas.addEventListener("mousemove", this.mouseMoved);
    this.canvas.addEventListener("mousedown", this.mousePressed);
    this.canvas.addEventListener("mouseup", this.mouseReleased);
    this.rayCaster.layers.disableAll();
    this.rayCaster.layers.enable(SETTINGS.layers.sphere);
    this.rayCaster.layers.enable(SETTINGS.layers.vertex);
  };

  deactivate = () => {
    this.canvas.removeEventListener("mousemove", this.mouseMoved);
    this.canvas.removeEventListener("mousedown", this.mousePressed);
    this.canvas.removeEventListener("mouseup", this.mouseReleased);
  };

  mouseMoved = (event: MouseEvent) => {
    this.mapCursorToSphere(event);
    // console.debug("RingHandler::mousemoved on sphere?", this.isOnSphere);
    if (this.isOnSphere) {
      if (this.isMouseDown && this.theSphere) {
        if (!this.isCircleAdded) {
          this.isCircleAdded = true;
          this.scene.add(this.geodesicRing);
          this.scene.add(this.startDot);
        }
        // The circle is on XY-plane, its default orientation is the Z-axis
        // Determine the quaternion to rotate the circle to the desired orientation
        this.tempVector.copy(this.startPoint).normalize();

        this.circleQuaternion.setFromUnitVectors(this.Z_AXIS, this.tempVector);
        this.geodesicRing.rotation.set(0, 0, 0);
        this.geodesicRing.applyQuaternion(this.circleQuaternion);
        this.geodesicRing.position.set(0, 0, 0);
        const angle = this.startPoint.angleTo(this.currentPoint);
        const ringRadius = Math.sin(angle);
        const translateDistance = Math.cos(angle);
        // scale the ring to match the radius spanned by the mouse cursor
        this.geodesicRing.scale.set(ringRadius, ringRadius, ringRadius);
        // move the ring up along the Z axis so it lays on the sphere
        this.geodesicRing.translateZ(translateDistance);
      }
    } else if (this.isCircleAdded) {
      this.scene.remove(this.geodesicRing);
      this.scene.remove(this.startDot);
      this.isCircleAdded = false;
    }
  };

  mousePressed = (/*event: MouseEvent*/) => {
    this.isMouseDown = true;
    if (this.isOnSphere) {
      const selected = this.hitObject;
      if (selected instanceof Vertex) {
        this.startPoint.copy(selected.position);
        this.theSphere?.localToWorld(this.startPoint);
      } else {
        this.scene.add(this.startDot);
        this.startPoint.copy(this.currentPoint);
      }
      this.startDot.position.copy(this.currentPoint);
      // Record the first point of the geodesic circle
      // this.startDot.position.copy(this.currentSurfacePoint);
      // this.scene.add(this.startDot);
      // this.startPoint.copy(this.currentSurfacePoint);
    }
  };

  mouseReleased = (/*event: MouseEvent*/) => {
    this.isMouseDown = false;
    if (this.isOnSphere) {
      // Record the second point of the geodesic circle
      this.scene.remove(this.geodesicRing);
      this.scene.remove(this.startDot);
      this.isCircleAdded = false;
      this.endPoint.copy(this.currentPoint);
    }
  };
}
