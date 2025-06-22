import { AddPointCommandByCoordinates } from "@/commands/AddPointCommandByCoordinates";
import { ToolStrategy } from "@/eventHandlers/ToolStrategy";
import { HEPoint } from "@/models-hyperbolic/HEPoint";
import { Vector3 } from "three";

export class PointHandler implements ToolStrategy {
  mouseMoved(event: MouseEvent): void {
    throw new Error("Method not implemented.");
  }
  mousePressed(
    event: MouseEvent,
    position: Vector3 | null = null,
    normalDirection: Vector3 | null = null
  ): void {
    console.debug("Inside Point handler");
    if (position) {
      const cmd = new AddPointCommandByCoordinates(position);
      cmd.execute();
    }
  }
  mouseReleased(event: MouseEvent): void {
    throw new Error("Method not implemented.");
  }
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
