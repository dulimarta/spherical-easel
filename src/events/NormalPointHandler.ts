import { Vector3, Quaternion, Vector2, Matrix4, Camera, Scene } from "three";
import Arrow from "@/3d-objs/Arrow";
import CursorHandler from "./CursorHandler";
import Vertex from "@/3d-objs/Vertex";
import SETTINGS from "@/global-settings";
export default class NormalPointHandler extends CursorHandler {
  private normalDirection: Vector3;
  private normalArrow: Arrow;
  private normalRotation: Quaternion;
  private isNormalAdded: boolean;
  private sphereCoordFrame: Matrix4;

  constructor(args: {
    canvas: HTMLCanvasElement;
    camera: Camera;
    scene: Scene;
  }) {
    super(args);
    this.mouse = new Vector2();
    // this.currentPoint = new Vector3(); // Cursor world coordinate position on the sphere
    this.normalArrow = new Arrow(0.6, 0.06, 0xff8000);
    this.normalDirection = new Vector3();
    this.normalRotation = new Quaternion();
    this.sphereCoordFrame = new Matrix4();
    this.isNormalAdded = false;
    // this.arrow.position.set(0, 1, 0);
    // scene.add(this.arrow);
    // this.handler = this.mouseMoved.bind(this);
  }

  mouseMoved = (event: MouseEvent) => {
    this.mapCursorToSphere(event);
    console.debug("OnSphere?", this.isOnSphere);
    if (this.isOnSphere) {
      if (!this.isNormalAdded) {
        this.scene.add(this.normalArrow);
        this.isNormalAdded = true;
      }
      this.normalArrow.position.copy(this.currentPoint);
      this.normalDirection.copy(this.currentPoint);

      // The default orientation of the arrow is the Y-axis
      this.normalRotation.setFromUnitVectors(
        this.Y_AXIS,
        this.normalDirection.normalize()
      );
      this.normalArrow.rotation.set(0, 0, 0);
      this.normalArrow.applyQuaternion(this.normalRotation);
    } else {
      this.scene.remove(this.normalArrow);
      this.isNormalAdded = false;
    }
  };

  clickIt = () => {
    if (this.isOnSphere && this.theSphere) {
      // The intersection point is returned as a point in the WORLD coordinate
      // To add the point to the sphere we have to transform it using the
      // INVERSE of the sphere coordinate frame matrix
      this.sphereCoordFrame.getInverse(this.theSphere.matrixWorld);
      console.debug("Sphere CF (inverse)", this.sphereCoordFrame.elements);
      this.currentPoint.applyMatrix4(this.sphereCoordFrame);

      const vtx = new Vertex(0.03);
      vtx.position.copy(this.currentPoint);
      console.debug(`Inserted ${vtx.name} at `, vtx.position);
      this.theSphere.add(vtx);
      // this.store.commit("addVertex", vtx);
    }
  };

  activate = () => {
    this.canvas.addEventListener("mousemove", this.mouseMoved);
    this.canvas.addEventListener("mousedown", this.clickIt);
    this.rayCaster.layers.disableAll();
    this.rayCaster.layers.enable(SETTINGS.layers.sphere);
  };

  deactivate = () => {
    this.canvas.removeEventListener("mousemove", this.mouseMoved);
    this.canvas.removeEventListener("mousedown", this.clickIt);
  };
}
