import { Vector3, EllipseCurve, Camera, Scene } from "three";
import LineHandler from "./LineHandler";
// import Arrow from "@/3d-objs/Arrow";
import Vertex from "@/3d-objs/Vertex";
import SETTINGS from "@/global-settings";

// This circle is on the XY-plane
const UNIT_CIRCLE = new EllipseCurve(0, 0, 1.0, 1.0, 0, Math.PI / 2, false, 0);

export default class SegmentHandler extends LineHandler {
  private tmpVector: Vector3;
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
    // this.startDot = new Vertex();
    // this.currentSurfacePoint = new Vector3();
    // this.circleQuaternion = new Quaternion();
    // this.normalArrow = new Arrow(1.5, 0.2, 0xffcc00);
    this.tmpVector = new Vector3();
    const redDot = new Vertex(0.05, 0xff0000);
    redDot.position.set(1.0, 0, 0);
    // const greenDot = new Vertex(0.05, 0x00ff44);
    // greenDot.position.set(0, 1.0, 0);
    this.geodesic.add(redDot);
    // this.geodesic.add(greenDot);
  }

  activate = () => {
    this.canvas.addEventListener("mousemove", this.mouseMoved);
    this.canvas.addEventListener("mousedown", this.mousePressed);
    this.canvas.addEventListener("mouseup", this.mouseReleased);
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
    if (this.isOnSphere) {
      if (this.isMouseDown && this.theSphere) {
        if (!this.isCircleAdded) {
          this.isCircleAdded = true;
          this.scene.add(this.geodesic);
        }
      }

      // Determine the angle between the starting point and the current point
      const segmentAngle = this.startPoint.angleTo(this.currentPoint);

      // Adjust the arc angle of the unit circle
      UNIT_CIRCLE.aEndAngle = Math.abs(segmentAngle);

      // To prevent potential memory leak: remove the current geometry object ()
      this.geodesic.geometry.dispose();
      this.geodesic.geometry.setFromPoints(UNIT_CIRCLE.getPoints(60));

      // Reuse the function in the parent class
      this.tiltGeodesicPlane();
    } else if (this.isCircleAdded) {
      this.scene.remove(this.geodesic);
      this.scene.remove(this.startDot);
      this.isCircleAdded = false;
    }
  };
}
