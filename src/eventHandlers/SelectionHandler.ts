import MouseHandler from "./MouseHandler";
import { SENodule } from "@/models/SENodule";
// import { SEPoint } from "@/models/SEPoint";
// import { SELine } from "@/models/SELine";
// import { SESegment } from "@/models/SESegment";

export default class SelectionHandler extends MouseHandler {
  /**
   * An array of the selected objects.  These objects should stay highlighted/selected until either this
   * tool unselects them or the next tools activate() method clears (and possibly processes) them.
   *
   */
  private currentSelection: SENodule[] = [];

  private highlightTimer: NodeJS.Timeout | null = null;
  private highlightOn = false;
  /**
   * An array to store the object selected by the key press handler
   */
  private keyPressSelection: SENodule[] = [];
  /**
   * This handles the keyboard events and when multiple objects are under
   * the mouse, the user can specify which one to select.
   * @param keyEvent A keyboard event -- only the digits are interpreted
   */
  keyPressHandler = (keyEvent: KeyboardEvent): void => {
    // Clear the keyPressSelection
    this.keyPressSelection.clear();
    // If there is nothing or only one nearby ignore this key event
    if (this.hitSENodules?.length <= 1) return;

    if (keyEvent.key.match(/[0-9]/)) {
      // is it a digit?
      const val = Number(keyEvent.key) - 1;
      this.hitSENodules.forEach((n, pos) => {
        if (pos === val) {
          // add the item to the list
          this.keyPressSelection.push(n);
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
    if (this.keyPressSelection.length != 0) {
      // Select all the objects in the keypress selection
      this.keyPressSelection.forEach(n => (n.selected = true));
      // Add the key press selection to the selected list.
      this.currentSelection.push(...this.keyPressSelection);
      this.keyPressSelection.clear();
    } else {
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
          console.log("toggle select", h.name, h.selected);
        });

        // Filter only selected items
        this.currentSelection = this.hitSENodules.filter(n => n.selected);
      }
    }
    this.store.commit("setSelectedObjects", this.currentSelection);
    console.log("----selected---- objects------");
    this.currentSelection.forEach(n =>
      console.log("hit object", n.name, n.selected)
    );

    /* Enable/disable interval timer to flasher selected objects */
    if (this.currentSelection.length > 0 && this.highlightTimer === null) {
      // We have selections and interval timer is not running, then start timer
      this.highlightTimer = setInterval(this.blinkSelections.bind(this), 2000);
    } else if (
      this.currentSelection.length === 0 &&
      this.highlightTimer !== null
    ) {
      // interval timer is running and we have no selections, then stop timer
      clearInterval(this.highlightTimer);
      this.highlightTimer = null;
    }
  }

  private blinkSelections(): void {
    this.highlightOn = !this.highlightOn;
    this.currentSelection.forEach((n: SENodule) => {
      n.glowing = this.highlightOn;
    });
  }

  mouseMoved(event: MouseEvent): void {
    console.log("mouse move event");
    // Clear any objects in the keyPressSelection
    if (this.keyPressSelection.length != 0) {
      this.keyPressSelection.forEach(n => (n as any).ref.normalDisplay());
    }
    super.mouseMoved(event);
    this.hitSENodules = this.store.getters.findNearbyObjects(
      this.currentSphereVector,
      this.currentScreenVector
    );
    // console.log("----------------------------");
    // this.hitSENodules.forEach(n =>
    //   console.log("hit object", n.name, n.selected)
    // );
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
    //console.log("num selected objects", this.currentSelection.length);
    // No code required
  }

  activate(): void {
    window.addEventListener("keypress", this.keyPressHandler);
    // Unselect all selected objects
    this.store.getters.selectedObjects().forEach((obj: SENodule) => {
      obj.selected = false;
    });
    // Clear the selected objects array
    this.store.commit("setSelectedObjects", []);
    this.currentSelection.clear();
  }

  deactivate(): void {
    if (this.highlightTimer !== null) {
      clearInterval(this.highlightTimer);
      this.highlightTimer = null;
    }
    window.removeEventListener("keypress", this.keyPressHandler);
  }
}
