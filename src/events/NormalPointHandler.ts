import { Vector3, Quaternion, Vector2 } from "three";
import Arrow from "../3d-objs/Arrow";
import CursorHandler from "./CursorHandler";
import Vertex from "../3d-objs/Vertex";
const Y_AXIS = new Vector3(0, 1, 0);

export default class NormalPointHandler extends CursorHandler {
  private currentPoint: Vector3;
  private normalDirection: Vector3;
  private normalArrow: Arrow;
  private normalRotation: Quaternion;
  private isOnSphere: boolean;

  constructor(args: any) {
    super(args);
    this.mouse = new Vector2();
    this.currentPoint = new Vector3();
    this.normalArrow = new Arrow(0.75, 0xff8000);
    this.normalDirection = new Vector3();
    this.normalRotation = new Quaternion();
    this.isOnSphere = false;
    // this.arrow.position.set(0, 1, 0);
    // scene.add(this.arrow);
    // this.handler = this.moveIt.bind(this);
  }

  moveIt = (event: MouseEvent) => {
    const { x, y } = this.toNormalizeScreenCoord(event);
    this.mouse.x = x;
    this.mouse.y = y;
    this.rayCaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.rayCaster.intersectObjects(this.scene.children);
    this.isOnSphere = false;
    if (intersects.length > 0) {
      console.debug(`moveIt detects ${intersects.length} object`);
      intersects
        .filter(r => {
          console.debug("Intersect with ", r.object.type);
          return r.object.type === "Mesh";
        })
        .forEach(m => {
          console.debug("Detect a mesh", m.object);
          this.isOnSphere = true;
          this.currentPoint.set(m.point.x, m.point.y, m.point.z);
          this.scene.add(this.normalArrow);
          this.normalArrow.position.set(m.point.x, m.point.y, m.point.z);
          this.normalDirection.set(m.point.x, m.point.y, m.point.z);
          this.normalRotation.setFromUnitVectors(
            Y_AXIS,
            this.normalDirection.normalize()
          );
          this.normalArrow.rotation.set(0, 0, 0);
          this.normalArrow.applyQuaternion(this.normalRotation);
        });
    }
    if (!this.isOnSphere) this.scene.remove(this.normalArrow);
  };

  clickIt = () => {
    if (this.isOnSphere) {
      const vtx = new Vertex();
      vtx.position.set(
        this.currentPoint.x,
        this.currentPoint.y,
        this.currentPoint.z
      );
      this.scene.add(vtx);
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
