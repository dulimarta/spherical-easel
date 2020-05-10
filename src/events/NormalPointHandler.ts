import { Vector3, Quaternion, Vector2, Camera, Scene } from "three";
import Arrow from "@/3d-objs/Arrow";
import CursorHandler from "./CursorHandler";
import Vertex from "@/3d-objs/Vertex";
import SETTINGS from "@/global-settings";
import { AddVertexCommand } from "@/commands/AddVertexCommand";
export default class NormalPointHandler extends CursorHandler {
  private normalDirection: Vector3;
  private normalArrow: Arrow;
  private normalRotation: Quaternion;
  private isNormalAdded: boolean;
  // private sphereCoordFrame: Matrix4;

  constructor(args: {
    canvas: HTMLCanvasElement;
    camera: Camera;
    scene: Scene;
  }) {
    super(args);
    this.mouse = new Vector2();
    // this.currentPoint = new Vector3(); // Cursor world coordinate position on the sphere
    this.normalArrow = new Arrow(0.3, 0.03, 0xff8000);
    this.normalDirection = new Vector3();
    this.normalRotation = new Quaternion();
    this.isNormalAdded = false;
    // this.arrow.position.set(0, 1, 0);
    // scene.add(this.arrow);
    // this.handler = this.mouseMoved.bind(this);
  }

  mouseMoved = (event: MouseEvent) => {
    this.mapCursorToSphere(event);
    if (this.isOnSphere) {
      if (!this.isNormalAdded) {
        this.theSphere?.add(this.normalArrow);
        this.isNormalAdded = true;
      }
      this.normalArrow.position.copy(this.currentPoint);
      // this.theSphere?.localToWorld(this.normalArrow.position);
      this.normalDirection.copy(this.currentPoint);
      // this.theSphere?.localToWorld(this.normalDirection);

      // The default orientation of the arrow is the Y-axis
      this.normalRotation.setFromUnitVectors(
        this.Y_AXIS,
        this.normalDirection.normalize()
      );
      this.normalArrow.rotation.set(0, 0, 0);
      this.normalArrow.applyQuaternion(this.normalRotation);
    } else {
      this.theSphere?.remove(this.normalArrow);
      this.isNormalAdded = false;
    }
  };

  mousePressed = () => {
    if (this.isOnSphere && this.theSphere) {
      // The intersection point is returned as a point in the WORLD coordinate
      // But when a new vertex is added to the sphere, we have to convert
      // for the world coordinate frame to the sphere coordinate frame

      const vtx = new Vertex();
      vtx.position.copy(this.currentPoint);
      // this.theSphere.worldToLocal(vtx.position);
      new AddVertexCommand(vtx).execute();
    }
  };

  activate = () => {
    this.canvas.addEventListener("mousemove", this.mouseMoved);
    this.canvas.addEventListener("mousedown", this.mousePressed);
    this.rayCaster.layers.disableAll();
    this.rayCaster.layers.enable(SETTINGS.layers.sphere);
  };

  deactivate = () => {
    this.canvas.removeEventListener("mousemove", this.mouseMoved);
    this.canvas.removeEventListener("mousedown", this.mousePressed);
  };
}
