import MouseHandler from "./MouseHandler";
import { SENodule } from "@/models/SENodule";

export default class SelectionHandler extends MouseHandler {
  private currentSelection: SENodule[] = [];
  activate(): void {
    window.addEventListener("keypress", this.keyPressHandler);
  }

  deactivate(): void {
    window.removeEventListener("keypress", this.keyPressHandler);
  }

  keyPressHandler = (e: KeyboardEvent): void => {
    // None
    if (this.hitSENodules?.length <= 1) return;
    if (e.key.match(/[0-9]/)) {
      // is it a digit?
      const val = Number(e.key) - 1;
      this.hitSENodules.forEach((n, pos) => {
        if (pos === val) {
          (n as any).ref.glowingDisplay();
          // Show the name of the selected item
          this.infoText.text = n.name;
        } else (n as any).ref.normalDisplay();
        pos === val;
      });
    }
  };

  mouseMoved(event: MouseEvent): void {
    super.mouseMoved(event);
    this.hitSENodules = this.store.getters.findNearbyObjects(
      this.currentSphereVector,
      this.currentScreenVector
    );
  }

  mousePressed(event: MouseEvent): void {
    event.preventDefault();
    if (event.altKey) {
      // Add current hit to the current selection
      this.hitSENodules.forEach(h => {
        h.selected = !h.selected;
        if (h.selected) this.currentSelection.push(h);
        else {
          // Remove hit object from current selection
          const idx = this.currentSelection.findIndex(c => c.id === h.id);
          if (idx >= 0) this.currentSelection.splice(idx, 1);
        }
      });
    } else {
      // Current hits replace current selection
      this.currentSelection.forEach(s => {
        // Toggle the current selection if it is not in the hit list
        if (this.hitSENodules.findIndex(h => h.id === s.id) < 0)
          s.selected = !s.selected;
      });
      this.hitSENodules.forEach(h => {
        h.selected = !h.selected;
      });
      this.currentSelection = this.hitSENodules.filter(n => n.selected);
    }
  }

  mouseReleased(event: MouseEvent): void {
    // No code required
  }
}
