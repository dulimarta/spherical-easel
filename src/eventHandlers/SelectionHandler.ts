import MouseHandler from "./MouseHandler";
import { SEPoint } from "@/models/SEPoint";

export default class SelectionHandler extends MouseHandler {
  activate(): void {
    window.addEventListener("keypress", this.keyPressHandler);
  }

  deactivate(): void {
    window.removeEventListener("keypress", this.keyPressHandler);
  }

  keyPressHandler = (e: KeyboardEvent): void => {
    // None
    if (this.hitNodes?.length <= 1) return;
    if (e.key.match(/[0-9]/)) {
      // console.debug("Digit pressed");
      const val = Number(e.key) - 1;
      this.hitNodes.forEach((n, pos) => {
        pos === val
          ? (n as any).ref.glowingDisplay()
          : (n as any).ref.normalDisplay();
      });
    }
  };
  mouseMoved(event: MouseEvent): void {
    super.mouseMoved(event);
  }

  mousePressed(event: MouseEvent): void {
    if (this.hitNodes.length == 1) {
      console.debug("Single selection", this.hitNodes[0].name);
    } else if (this.hitNodes.length > 1) {
      console.debug("Multiple selections");
      this.hitNodes.forEach(n => {
        console.debug(n.name);
      });
    }
  }
  mouseReleased(event: MouseEvent): void {
    // No code yet
  }
}
