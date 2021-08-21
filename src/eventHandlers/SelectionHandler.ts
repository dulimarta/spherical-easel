import { SENodule } from "@/models/SENodule";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import EventBus from "@/eventHandlers/EventBus";
import Highlighter from "./Highlighter";
import { Vector3 } from "three";
import { SEStore } from "@/store";
import { SEPoint } from "@/models/SEPoint";
import { SECircle } from "@/models/SECircle";
import { SEEllipse } from "@/models/SEEllipse";
import { SELine } from "@/models/SELine";
import { SESegment } from "@/models/SESegment";
import { SEParametric } from "@/models/SEParametric";
import { SEPolygon } from "@/models/SEPolygon";
import { SEAngleMarker } from "@/models/SEAngleMarker";
import Parametric from "@/plottables/Parametric";
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
      SEStore.sePoints
        .filter(
          (n: SEPoint) =>
            !(n instanceof SEIntersectionPoint && !n.isUserCreated) && n.showing
        ) // no unUserCreated intersection points allowed and no hidden points allowed
        .forEach((n: SEPoint) => {
          this.keyPressSelection.push(n);
          (n as any).ref.glowingDisplay();
        });
    }
    // Get all SECircles
    if (keyEvent.key.match("c")) {
      SEStore.seCircles
        .filter((n: SECircle) => n.showing) //no hidden circles allowed
        .forEach((n: SECircle) => {
          this.keyPressSelection.push(n);
          (n as any).ref.glowingDisplay();
        });
    }
    // Get all SEEllipses
    if (keyEvent.key.match("e")) {
      SEStore.seEllipses
        .filter((n: SEEllipse) => n.showing) //no hidden Ellipses allowed
        .forEach((n: SEEllipse) => {
          this.keyPressSelection.push(n);
          (n as any).ref.glowingDisplay();
        });
    }
    // Get all SELines
    if (keyEvent.key.match("l")) {
      SEStore.seLines
        .filter((n: SELine) => n.showing) //no hidden lines allowed
        .forEach((n: SELine) => {
          this.keyPressSelection.push(n);
          (n as any).ref.glowingDisplay();
        });
    }
    // Get all SESegments
    if (keyEvent.key.match("s")) {
      SEStore.seSegments
        .filter((n: SESegment) => n.showing) //no hidden segments allowed
        .forEach((n: SESegment) => {
          this.keyPressSelection.push(n);
          (n as any).ref.glowingDisplay();
        });
    }
    // Get all SEAngleMarkers
    if (keyEvent.key.match("a")) {
      SEStore.seAngleMarkers
        .filter((n: SEAngleMarker) => n.showing) //no hidden angle markers allowed
        .forEach((n: SEAngleMarker) => {
          this.keyPressSelection.push(n);
          (n as any).ref.glowingDisplay();
        });
    }
    // Get all SEParametrics
    if (keyEvent.key.match("P")) {
      SEStore.seParametrics
        .filter((n: SEParametric) => n.showing) //no hidden parametrics allowed
        .forEach((n: SEParametric) => {
          this.keyPressSelection.push(n);
          let ptr: Parametric | null = n.ref;
          while (ptr !== null) {
            ptr.glowingDisplay();
            ptr = ptr.next;
          }
        });
    }
    // Get all SEPolygons
    if (keyEvent.key.match("O")) {
      SEStore.sePolygons
        .filter((n: SEPolygon) => n.showing) //no hidden Polygons allowed
        .forEach((n: SEPolygon) => {
          this.keyPressSelection.push(n);
          (n as any).ref.glowingDisplay();
        });
    }
    // Now process the hitSENodules so the user can select by number
    // If there is nothing or only one nearby ignore this key event
    if (this.hitSENodules?.length <= 1) return;
    console.log(keyEvent.key);
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
          } else if (!n.selected) {
            (n as any).ref.normalDisplay();
          }
        });
    }
  };

  mousePressed(event: MouseEvent): void {
    if (!this.isOnSphere) return;

    //If you select an object (like a line), then add to that selection with a key press and a mouse press at
    // a empty location (like p -adding all point to the selection ), then *without* moving the mouse, a mouse press doesn't
    // clear the current selections like it should -- is this even worth worrying about?

    // event.preventDefault();
    if (this.keyPressSelection.length !== 0) {
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
      this.keyPressSelection.splice(0);
    } else {
      // Remove labels and non-selectable intersection points
      const possibleAdditions = this.hitSENodules.filter((p: SENodule) => {
        if (
          (p instanceof SEIntersectionPoint && !p.isUserCreated) ||
          p.isLabel()
        ) {
          return false;
        } else {
          return true;
        }
      });
      if (event.altKey) {
        // Add current hit object list to the current selection
        possibleAdditions[0].selected = !possibleAdditions[0].selected;
        if (possibleAdditions[0].selected) {
          this.currentSelection.push(possibleAdditions[0]);
        } else {
          // Remove hit object from current selection
          const idx = this.currentSelection.findIndex(
            c => c.id === possibleAdditions[0].id
          );
          if (idx >= 0) this.currentSelection.splice(idx, 1);
        }
      } else {
        // Replace the current selection with the hit object (if any)
        this.currentSelection.forEach(s => {
          s.selected = false;
        });
        if (possibleAdditions[0] !== undefined) {
          possibleAdditions[0].selected = true;
          this.currentSelection = [possibleAdditions[0]];
        } else {
          this.currentSelection = [];

          // Check to see if there was an object on the back of the sphere that he was trying to
          // select but doesn't know about the shift key.  Send an alert in this case
          const sphereVec = new Vector3(
            this.currentSphereVector.x,
            this.currentSphereVector.y,
            -1 * this.currentSphereVector.z
          );
          const hitSENodules = SEStore.findNearbySENodules(
            sphereVec,
            this.currentScreenVector
          ).filter((n: SENodule) => {
            if (n instanceof SEIntersectionPoint) {
              if (!n.isUserCreated) {
                return n.exists; //You always hit automatically created intersection points if it exists
              } else {
                return n.showing && n.exists; //You can't hit hidden objects or items that don't exist
              }
            } else {
              return n.showing && n.exists; //You can't hit hidden objects or items that don't exist
            }
          });
          // if the user is not pressing the shift key and there is a nearby object on the back of the sphere, send alert
          if (!event.shiftKey && hitSENodules.length > 0) {
            EventBus.fire("show-alert", {
              key: `handlers.moveHandlerObjectOnBackOfSphere`,
              keyOptions: {},
              type: "info"
            });
          }
        }
      }
    }
    SEStore.setSelectedSENodules(this.currentSelection);
    // console.log("number selected", SEStore.selectedSENodules.length);
    /** 
    console.log("----selected---- objects------");
    this.currentSelection.forEach(n =>
      console.log("hit object", n.name, n.selected)
    );
    **/
    if (SEStore.selectedSENodules.length === 0) {
      EventBus.fire("show-alert", {
        key: `handlers.selectionUpdateNothingSelected`,
        keyOptions: {},
        type: "error"
      });
    } else {
      EventBus.fire("show-alert", {
        key: `handlers.selectionUpdate`,
        keyOptions: {
          number: `${SEStore.selectedSENodules.length}`
        },
        type: "success"
      });
    }

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
    // UnGlow and clear any objects in the keyPressSelection
    if (this.keyPressSelection.length != 0) {
      this.keyPressSelection.forEach(n => (n as any).ref.normalDisplay());
      this.keyPressSelection.splice(0);
    }

    super.mouseMoved(event);

    // Glow the appropriate object, only the top one should glow because the user can only add one at a time with a mouse press
    this.hitSENodules
      .filter((p: SENodule) => {
        if (
          (p instanceof SEIntersectionPoint && !p.isUserCreated) ||
          p.isLabel()
        ) {
          return false;
        } else {
          return true;
        }
      })
      .forEach((n: SENodule, index) => {
        if (index === 0 || n.selected) {
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
    // Unselect all selected objects (this unglows them and sets the selected flag to false for them)
    // this.store.state.selectedSENodules.forEach((obj: SENodule) => {
    //   obj.selected = false;
    // });

    // Do not clear the selections array here! If the right items are selected, then other tools automatically do their thing!
    //  For example, if a point is selected with the selection tool, then when the antipode tool is
    //  activated, it automatically creates the antipode of the selected point. The last thing each
    //  tool does in its activate method is clear the selected array in the store.
    //this.store.commit.setSelectedSENodules([]);
    //this.currentSelection.clear();

    // Remove the listener
    window.removeEventListener("keypress", this.keyPressHandler);

    // If the user has been styling objects and then, without selecting new objects, activates
    //  another tool, the style state should be saved.
    EventBus.fire("save-style-state", {});
  }
}
