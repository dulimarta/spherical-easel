import CursorHandler from "./CursorHandler";
import Two from "two.js";
import { Matrix4, Vector3 } from "three";

const desiredZAxis = new Vector3();

export default class RotateHandler extends CursorHandler {
  private rotationMatrix: Matrix4 = new Matrix4();
  private prevSpherePoint: Vector3 = new Vector3();
  private prevScreenPoint: Two.Vector = new Two.Vector(0, 0);
  private isDragging = false;
  constructor(scene: Two.Group) {
    super(scene);
    // this.rotationMatrix = new Matrix4();
    // this.prevSpherePoint = new Vector3();
  }

  activate(): void {
    /* none */
  }

  mouseMoved(event: MouseEvent) {
    super.mouseMoved(event);
    const rotationAngle = this.prevSpherePoint.angleTo(this.currentSpherePoint);
    if (
      this.isDragging &&
      this.isOnSphere &&
      rotationAngle > Math.PI / 90 /* 2 degrees */
    ) {
      desiredZAxis
        .crossVectors(this.prevSpherePoint, this.currentSpherePoint)
        .normalize();
      this.rotationMatrix.makeRotationAxis(desiredZAxis, rotationAngle);
      this.prevSpherePoint.copy(this.currentSpherePoint);
      this.prevScreenPoint.copy(this.currentScreenPoint);
      window.dispatchEvent(
        new CustomEvent("sphere-rotate", {
          detail: { transform: this.rotationMatrix }
        })
      );
    }
  }

  mousePressed(event: MouseEvent) {
    // super.mousePressed(event);a
    super.mouseMoved(event);
    this.isDragging = true;
    this.prevSpherePoint.copy(this.currentSpherePoint);
    this.prevScreenPoint.copy(this.currentScreenPoint);
    console.debug("Begin rotation from ", this.currentSpherePoint.toFixed(2));
  }

  mouseReleased(event: MouseEvent) {
    // super.mouseReleased(event);
    this.isDragging = false;
    console.debug("End rotation at ", this.currentSpherePoint.toFixed(2));
  }
}
