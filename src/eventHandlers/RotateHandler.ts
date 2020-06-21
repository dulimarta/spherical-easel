import SelectionHandler from "./SelectionHandler";
import Two from "two.js";
import { Matrix4, Vector3 } from "three";
import EventBus from "./EventBus";
import { RotateSphereCommand } from "@/commands/RotateSphereCommand";
const desiredZAxis = new Vector3();

export default class RotateHandler extends SelectionHandler {
  private rotationMatrix: Matrix4 = new Matrix4();
  private startPosition = new Vector3();
  private prevSpherePoint: Vector3 = new Vector3();
  private prevScreenPoint: Two.Vector = new Two.Vector(0, 0);
  private isDragging = false;

  constructor(scene: Two.Group, transformMatrix: Matrix4) {
    super(scene, transformMatrix);
    // this.rotationMatrix = new Matrix4();
    // this.prevSpherePoint = new Vector3();
  }

  mouseMoved(event: MouseEvent): void {
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
      EventBus.fire("sphere-rotate", {
        transform: this.rotationMatrix
      });
    }
  }

  mousePressed(event: MouseEvent): void {
    // super.mousePressed(event);a
    super.mouseMoved(event);
    this.isDragging = true;
    this.startPosition.copy(this.currentSpherePoint);
    this.prevSpherePoint.copy(this.currentSpherePoint);
    this.prevScreenPoint.copy(this.currentScreenPoint);
    console.debug("Begin rotation from ", this.currentSpherePoint.toFixed(2));
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {
    // super.mouseReleased(event);
    this.isDragging = false;
    console.debug("End rotation at ", this.currentSpherePoint.toFixed(2));
    const rotationAngle = this.startPosition.angleTo(this.currentSpherePoint);
    desiredZAxis
      .crossVectors(this.startPosition, this.currentSpherePoint)
      .normalize();
    this.rotationMatrix.makeRotationAxis(desiredZAxis, rotationAngle);
    new RotateSphereCommand(this.rotationMatrix).push();
  }

  // eslint-disable-next-line
  mouseLeave(event: MouseEvent): void {
    throw new Error("Method not implemented.");
  }
}
