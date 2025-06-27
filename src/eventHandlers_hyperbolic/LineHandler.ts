import { HyperbolicToolStrategy } from "@/eventHandlers/ToolStrategy";
import { Vector3 } from "three";

export class LineHandler implements HyperbolicToolStrategy {
  firstPosition: Vector3 = new Vector3();
  secondPosition: Vector3 = new Vector3();
  constructor() {}
  mouseMoved(
    event: MouseEvent,
    position: Vector3,
    normalDirection: Vector3
  ): void {}
  mousePressed(
    event: MouseEvent,
    position: Vector3,
    normalDirection: Vector3
  ): void {}
  mouseReleased(
    event: MouseEvent,
    position: Vector3,
    normalDirection: Vector3
  ): void {}
  mouseLeave(event: MouseEvent): void {
    throw new Error("Method not implemented.");
  }
  activate(): void {
    throw new Error("Method not implemented.");
  }
  deactivate(): void {
    throw new Error("Method not implemented.");
  }
}
