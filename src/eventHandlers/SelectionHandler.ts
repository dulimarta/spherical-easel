import MouseHandler from "./MouseHandler";
import { SENodule } from "@/models/SENodule";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import EventBus from "@/eventHandlers/EventBus";
import { SEPoint } from "@/models/SEPoint";
import Highlighter from "./Highlighter";

// import { SEPoint } from "@/models/SEPoint";
// import { SELine } from "@/models/SELine";
// import { SESegment } from "@/models/SESegment";

export default class SelectionHandler extends Highlighter {
  /**
   * An array of the selected objects.  These objects should stay highlighted/selected until either this
   * tool unselects them or the next tools activate() method clears (and possibly processes) them.
   *
   */
  private currentSelection: SENodule[] = [];

  // To make the objects appear normal for M ms and then glow for N ms we need two timers
  private highlightTimer: NodeJS.Timeout | null = null;
  private highlightTimer2: NodeJS.Timeout | null = null;
  private delayedStart: NodeJS.Timeout | null = null;
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
    // Get all SEPoints
    if (keyEvent.key.match("p")) {
      this.store.getters
        .allSEPoints()
        .filter(
          (n: any) =>
            !(n instanceof SEIntersectionPoint && !n.isUserCreated) && n.showing
        ) // no unUserCreated intersection points allowed and no hidden points allowed
        .forEach((n: any) => {
          this.keyPressSelection.push(n);
          (n as any).ref.glowingDisplay();
        });
    }
    // Get all SECircles
    if (keyEvent.key.match("c")) {
      this.store.getters
        .allSECircles()
        .filter((n: any) => n.showing) //no hidden circles allowed
        .forEach((n: any) => {
          this.keyPressSelection.push(n);
          (n as any).ref.glowingDisplay();
        });
    }
    // Get all SELines
    if (keyEvent.key.match("l")) {
      this.store.getters
        .allSELines()
        .filter((n: any) => n.showing) //no hidden lines allowed
        .forEach((n: any) => {
          this.keyPressSelection.push(n);
          (n as any).ref.glowingDisplay();
        });
    }
    // Get all SESegments
    if (keyEvent.key.match("s")) {
      this.store.getters
        .allSESegments()
        .filter((n: any) => n.showing) //no hidden segments allowed
        .forEach((n: any) => {
          this.keyPressSelection.push(n);
          (n as any).ref.glowingDisplay();
        });
    }
    // Get all SELabels
    if (keyEvent.key.match("L")) {
      this.store.getters
        .allSELabels()
        .filter((n: any) => n.showing) //no hidden labels allowed
        .forEach((n: any) => {
          this.keyPressSelection.push(n);
          (n as any).ref.glowingDisplay();
        });
    }
    // Now process the hitSENodules so the user can select by number
    // If there is nothing or only one nearby ignore this key event
    if (this.hitSENodules?.length <= 1) return;

    if (keyEvent.key.match(/[0-9]/)) {
      // is it a digit?
      const val = Number(keyEvent.key) - 1;
      this.hitSENodules
        .filter(n => !(n instanceof SEIntersectionPoint && !n.isUserCreated)) // no uncreated intersection points allowed
        .forEach((n, pos) => {
          if (pos === val) {
            // add the item to the list
            this.keyPressSelection.push(n);
            (n as any).ref.glowingDisplay();
            // Show the name of the selected item
            this.infoText.text = n.name;
          } else {
            (n as any).ref.normalDisplay();
          }
        });
    }
  };

  mousePressed(event: MouseEvent): void {
    if (!this.isOnSphere) return;

    // event.preventDefault();
    if (this.keyPressSelection.length != 0) {
      //console.log("before filter length", this.keyPressSelection.length);
      // remove any items from the keyPressSelection if they are already selected
      const newKeyPressSelections = this.keyPressSelection.filter(
        (n: SENodule) => {
          // console.log(
          //   "test id",
          //   n.id,
          //   this.currentSelection.findIndex(h => h.id === n.id) < 0
          // );
          return this.currentSelection.findIndex(h => h.id === n.id) < 0;
        }
      );
      //console.log("after filter length", newKeyPressSelections.length);
      // Select all the objects in the keypress selection
      newKeyPressSelections.forEach(n => {
        n.selected = true;
      });

      // Add the key press selection to the selected list.
      this.currentSelection.push(...newKeyPressSelections);
      this.keyPressSelection.clear();
    } else {
      if (event.altKey) {
        // Add current hit object list to the current selection
        this.hitSENodules[0].selected = !this.hitSENodules[0].selected;
        if (this.hitSENodules[0].selected) {
          this.currentSelection.push(this.hitSENodules[0]);
        } else {
          // Remove hit object from current selection
          const idx = this.currentSelection.findIndex(
            c => c.id === this.hitSENodules[0].id
          );
          if (idx >= 0) this.currentSelection.splice(idx, 1);
        }
      } else {
        // Replace the current selection with the hit object (if any)
        this.currentSelection.forEach(s => {
          s.selected = false;
        });
        if (this.hitSENodules[0] !== undefined) {
          this.hitSENodules[0].selected = true;
          this.currentSelection = [this.hitSENodules[0]];
        } else {
          this.currentSelection = [];
        }
      }
    }
    this.store.commit.setSelectedSENodules(this.currentSelection);
    // console.log(
    //   "number selected",
    //   this.store.getters.selectedSENodules().length
    // );
    /** 
    console.log("----selected---- objects------");
    this.currentSelection.forEach(n =>
      console.log("hit object", n.name, n.selected)
    );
    **/
    if (this.store.getters.selectedSENodules().length === 0) {
      EventBus.fire("show-alert", {
        key: `handlers.selectionUpdateNothingSelected`,
        keyOptions: {},
        type: "error"
      });
    } else {
      EventBus.fire("show-alert", {
        key: `handlers.selectionUpdate`,
        keyOptions: {
          number: `${this.store.getters.selectedSENodules().length}`
        },
        type: "success"
      });
    }
    this.highlightBlinker();
  }

  //This method is called by the BasicFrontBackStyle component because, when changing the selection in that
  // component, in order to make the selections blink we have to use the SelectionHandler
  private setBlinkingNode(list: any) {
    // clear the old selection
    this.currentSelection = [];
    //turn off the old highlight timers
    this.highlightBlinker();
    // set the new current selection
    (list.objects as SENodule[]).forEach(node =>
      this.currentSelection.push(node)
    );
    // run the new highlight timers
    this.highlightBlinker();
  }

  /* Enable/disable interval timer to flash selected objects */
  private highlightBlinker(): void {
    if (this.currentSelection.length > 0 && this.highlightTimer === null) {
      // We have selections and interval timer is not running, then start timer and offset timer
      this.highlightTimer = setInterval(this.blinkSelections.bind(this), 1500);
      this.delayedStart = setTimeout(() => {
        this.highlightTimer2 = setInterval(
          this.blinkSelections.bind(this),
          1500
        );
      }, 300);
    } else if (
      this.currentSelection.length === 0 &&
      this.highlightTimer !== null
    ) {
      // interval timer is running and we have no selections, then stop timer
      clearInterval(this.highlightTimer);
      if (this.highlightTimer2) clearInterval(this.highlightTimer2);
      if (this.delayedStart) clearInterval(this.delayedStart);
      this.delayedStart = null;
      this.highlightTimer = null;
      this.highlightTimer2 = null;
    }
  }

  private blinkSelections(): void {
    this.highlightOn = !this.highlightOn;
    this.currentSelection.forEach((n: SENodule) => {
      n.glowing = this.highlightOn;
    });
  }

  mouseMoved(event: MouseEvent): void {
    // console.log("mouse move event");
    // UnGlow and clear any objects in the keyPressSelection
    if (this.keyPressSelection.length != 0) {
      this.keyPressSelection.forEach(n => (n as any).ref.normalDisplay());
      this.keyPressSelection.clear();
    }
    super.mouseMoved(event);
    // this.hitSENodules = this.store.getters.findNearbySENodules(
    //   this.currentSphereVector,
    //   this.currentScreenVector
    // );
    // console.log("----------------------------");
    // this.hitSENodules.forEach(n =>
    //   console.log("hit object", n.name, n.selected)
    // );
    // Create an array of SENodules of all nearby objects by querying the store
    // this.hitSENodules = this.store.getters
    //   .findNearbySENodules(this.currentSphereVector, this.currentScreenVector)
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

    // Glow the appropriate object, only the top one should glow because the user can only add one at a time with a mouse press
    this.hitSENodules
      .filter((p: SENodule) => {
        if (p instanceof SEIntersectionPoint && !p.isUserCreated) {
          return false;
        } else {
          return true;
        }
      })
      .forEach((n: SENodule, index) => {
        if (index === 0) {
          n.glowing = true;
        } else {
          n.glowing = false;
        }
      });
  }

  mouseReleased(event: MouseEvent): void {
    //console.log("num selected objects", this.currentSelection.length);
    // No code required
  }

  activate(): void {
    window.addEventListener("keypress", this.keyPressHandler);
    this.currentSelection.clear();
    EventBus.listen("blinking-nodes", this.setBlinkingNode.bind(this));
  }

  deactivate(): void {
    // Clear the timers
    if (this.highlightTimer !== null) {
      clearInterval(this.highlightTimer);
      this.highlightTimer = null;
      if (this.highlightTimer2) clearInterval(this.highlightTimer2);
      this.highlightTimer2 = null;
      if (this.delayedStart) clearInterval(this.delayedStart);
      this.delayedStart = null;
    }
    // Unselect all selected objects
    this.store.getters.selectedSENodules().forEach((obj: SENodule) => {
      obj.selected = false;
    });

    // Do not clear the selections array here! If the right items are selected, then other tools automatically do their thing!
    //  For example, if a point is selected with the selection tool, then when the antipode tool is
    //  activated, it automatically creates the antipode of the selected point. The last thing each
    //  tool does in its activate method is clear the selected array in the store.
    //this.store.commit.setSelectedSENodules([]);
    //this.currentSelection.clear();

    // Remove the listeners
    window.removeEventListener("keypress", this.keyPressHandler);
    EventBus.unlisten("blinking-nodes");
    // If the user has been styling objects and then, without selecting new objects, activates
    //  another tool, the style state should be saved.
    EventBus.fire("save-style-state", {});
  }
}
