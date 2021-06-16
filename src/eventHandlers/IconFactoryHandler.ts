import { ToolStrategy } from "./ToolStrategy";
import EventBus from "./EventBus";

export default class IconFactoryHandler implements ToolStrategy {
  constructor() {
    // No code
  }

  mousePressed(event: MouseEvent): void {
    // No code
  }

  mouseMoved(event: MouseEvent): void {
    // No code
  }

  mouseReleased(event: MouseEvent): void {
    // No code
  }

  mouseLeave(event: MouseEvent): void {
    // No code
  }

  activate(): void {
    // No code
  }

  deactivate(): void {
    // No code
  }
  createIconPaths(): void {
    EventBus.fire("export-current-svg", {});
  }
}
