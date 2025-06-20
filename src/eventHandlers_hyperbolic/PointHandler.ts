import { AddPointCommandByCoordinates } from "@/commands/AddPointCommandByCoordinates";
import { ToolStrategy } from "@/eventHandlers/ToolStrategy";
import { HEPoint } from "@/models-hyperbolic/HEPoint";
import { Vector3 } from "three";

export class PointHandler implements ToolStrategy {
  mouseMoved(event: MouseEvent): void {
    throw new Error("Method not implemented.");
  }
  mousePressed(event: MouseEvent, at3d?: Vector3 | null): void {
    console.debug("Inside Point handler");
    if (at3d) {
      const cmd = new AddPointCommandByCoordinates(at3d);
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
