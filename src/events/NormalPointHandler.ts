import { Vector3, Quaternion, Vector2, Matrix4 } from "three";
import Arrow from "@/3d-objs/Arrow";
import CursorHandler from "./CursorHandler";
import Vertex from "@/3d-objs/Vertex";

export default class NormalPointHandler extends CursorHandler {
  private currentPoint: Vector3;
  private normalDirection: Vector3;
  private normalArrow: Arrow;
  private normalRotation: Quaternion;
  private isOnSphere: boolean;
  private isNormalAdded: boolean;
  private sphereCoordFrame: Matrix4;

  constructor(args: any) {
    super(args);
    this.mouse = new Vector2();
    this.currentPoint = new Vector3();
    this.normalArrow = new Arrow(0.6, 0.06, 0xff8000);
    this.normalDirection = new Vector3();
    this.normalRotation = new Quaternion();
    this.sphereCoordFrame = new Matrix4();
    this.isOnSphere = false;
    this.isNormalAdded = false;
    // this.arrow.position.set(0, 1, 0);
    // scene.add(this.arrow);
    // this.handler = this.moveIt.bind(this);
  }

  moveIt = (event: MouseEvent) => {
    const result = this.intersectionWithSphere(event);
    this.isOnSphere = false;
    if (result) {
      const hitPoint = result.point;
      this.isOnSphere = true;
      this.currentPoint.set(hitPoint.x, hitPoint.y, hitPoint.z);

      // The intersection point is returned as a point in the WORLD coordinate
      // To add the point to the sphere we have to transform it using the
      // INVERSE of the sphere coordinate frame matrix
      this.sphereCoordFrame.getInverse(result.object.matrixWorld);
      this.currentPoint.applyMatrix4(this.sphereCoordFrame);

      if (!this.isNormalAdded) {
        this.scene.add(this.normalArrow);
        this.isNormalAdded = true;
      }
      this.normalArrow.position.set(hitPoint.x, hitPoint.y, hitPoint.z);
      this.normalDirection.set(hitPoint.x, hitPoint.y, hitPoint.z);
      // The default orientation of the arrow is the Y-axis
      this.normalRotation.setFromUnitVectors(
        this.Y_AXIS,
        this.normalDirection.normalize()
      );
      this.normalArrow.rotation.set(0, 0, 0);
      this.normalArrow.applyQuaternion(this.normalRotation);
    }
    if (!this.isOnSphere) {
      this.scene.remove(this.normalArrow);
      this.isNormalAdded = false;
    }
  };

  clickIt = () => {
    if (this.isOnSphere) {
      const vtx = new Vertex();
      vtx.position.set(
        this.currentPoint.x,
        this.currentPoint.y,
        this.currentPoint.z
      );
      this.store.commit("addVertex", vtx);
      // this.scene.add(vtx);
    }
  };

  activate = () => {
    this.canvas.addEventListener("mousemove", this.moveIt);
    this.canvas.addEventListener("mousedown", this.clickIt);
  };

  deactivate = () => {
    this.canvas.removeEventListener("mousemove", this.moveIt);
    this.canvas.removeEventListener("mousedown", this.clickIt);
  };
}
