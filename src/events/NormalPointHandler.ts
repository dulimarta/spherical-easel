import { Vector3, Quaternion, Vector2, Camera, Scene } from "three";
import Arrow from "@/3d-objs/Arrow";
import CursorHandler from "./CursorHandler";
import Point from "@/3d-objs/Point";
import SETTINGS from "@/global-settings";
import { AddPointCommand } from "@/commands/AddPointCommand";
export default class NormalPointHandler extends CursorHandler {
  private normalDirection: Vector3;
  private normalArrow: Arrow;
  private normalRotation: Quaternion;
  private isNormalAdded: boolean;
  // private sphereCoordFrame: Matrix4;

  constructor(args: { camera: Camera; scene: Scene; target: Element }) {
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

  mouseMoved(event: MouseEvent) {
    super.mouseMoved(event);
    if (this.isOnSphere && this.theSphere) {
      if (!this.isNormalAdded) {
        this.theSphere.add(this.normalArrow);
        console.debug("Arrow added");
        this.isNormalAdded = true;
      }
      this.normalArrow.position.copy(this.currentV3Point);
      this.normalDirection.copy(this.currentV3Point);

      // The default orientation of the arrow is the Y-axis
      this.normalRotation.setFromUnitVectors(
        this.Y_AXIS,
        this.normalDirection.normalize()
      );
      this.normalArrow.rotation.set(0, 0, 0);
      this.normalArrow.applyQuaternion(this.normalRotation);
    } else {
      this.theSphere?.remove(this.normalArrow);
      console.debug("Arrow removed");
      this.isNormalAdded = false;
    }
  }

  mousePressed = () => {
    if (this.isOnSphere && this.theSphere) {
      // The intersection point is returned as a point in the WORLD coordinate
      // But when a new point is added to the sphere, we have to convert
      // for the world coordinate frame to the sphere coordinate frame

      const vtx = new Point();
      vtx.position.copy(this.currentV3Point);
      new AddPointCommand(vtx).execute();
    }
  };

  activate = () => {
    // debugger; // eslint-disable-line
    this.rayCaster.layers.disableAll();
    this.rayCaster.layers.enable(SETTINGS.layers.sphere);
  };
}
