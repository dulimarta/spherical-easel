import MouseHandler from "./MouseHandler";
import { SENodule } from "@/models/SENodule";

export default class SelectionHandler extends MouseHandler {
  /**
   * An array of the selected objects.  These objects should stay highlighted/selected until either this
   * tool unselects them or the next tools activate() method clears (and possibly processes) them.
   *
   */
  private currentSelection: SENodule[] = [];

  /**
   * This handles the keyboard events and when multiple objects are under
   * the mouse, the user can specify which one to select.
   * @param e A keyboard event -- only the digits are interpreted
   */
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

  mousePressed(event: MouseEvent): void {
    event.preventDefault();
    if (event.altKey) {
      // Add current hit list to the current selection
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
      // Replace the current selection with the hit list
      this.currentSelection.forEach(s => {
        // Toggle the current selection if it is not in the hit list
        if (this.hitSENodules.findIndex(h => h.id === s.id) < 0)
          s.selected = !s.selected;
      });
      this.hitSENodules.forEach(h => {
        h.selected = !h.selected;
      });

      // Filter only selected items
      this.currentSelection = this.hitSENodules.filter(n => n.selected);
    }
    this.store.commit("setSelectedObjects", this.currentSelection);
  }

  mouseMoved(event: MouseEvent): void {
    super.mouseMoved(event);
    this.hitSENodules = this.store.getters.findNearbyObjects(
      this.currentSphereVector,
      this.currentScreenVector
    );
    console.log("----------------------------");
    this.hitSENodules.forEach(n => console.log("hit object", n.name));
    // // Create an array of SENodules of all nearby objects by querying the store
    // this.hitSENodules = this.store.getters
    //   .findNearbyObjects(this.currentSphereVector, this.currentScreenVector)
    //   .filter((n: SENodule) => {
    //     if (n instanceof SEIntersectionPoint) {
    //       if (!n.isUserCreated) {
    //         return n.exists; //You always select automatically created intersection points if it exists
    //       } else {
    //         return n.showing && n.exists; //You can't select hidden objects or items that don't exist
    //       }
    //     } else {
    //       return n.showing && n.exists; //You can't select hidden objects or items that don't exist
    //     }
    //   });
  }

  mouseReleased(event: MouseEvent): void {
    // No code required
  }

  activate(): void {
    window.addEventListener("keypress", this.keyPressHandler);
    this.store.getters.selectedObjects().forEach((obj: SENodule) => {
      obj.selected = false;
    });
  }

  deactivate(): void {
    window.removeEventListener("keypress", this.keyPressHandler);
  }
}
