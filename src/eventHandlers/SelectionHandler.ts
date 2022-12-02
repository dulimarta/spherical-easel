import { SENodule } from "@/models/SENodule";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import EventBus from "@/eventHandlers/EventBus";
import Highlighter from "./Highlighter";
import { Vector3 } from "three";
import Two from "two.js";
import { SEPoint } from "@/models/SEPoint";
import { SECircle } from "@/models/SECircle";
import { SEEllipse } from "@/models/SEEllipse";
import { SELine } from "@/models/SELine";
import { SESegment } from "@/models/SESegment";
import { SEParametric } from "@/models/SEParametric";
import { SEPolygon } from "@/models/SEPolygon";
import { SEAngleMarker } from "@/models/SEAngleMarker";
import Parametric from "@/plottables/Parametric";
import SETTINGS, { LAYER } from "@/global-settings";
import { SelectionRectangle } from "@/plottables/SelectionRectangle";
import { SEAntipodalPoint } from "@/models/SEAntipodalPoint";
// import { Group } from "two.js/src/group";
// import { Vector } from "two.js/src/vector";
const MESHSIZE = 10;
const sphereVector = new Vector3();
const screenVector = new Two.Vector(0, 0);

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

  // A flag and location to indicate that the user is dragging to make a selection rectangle
  private mouseDownLocation: number[] = [];
  private dragging = false;

  private selectionRectangle: SelectionRectangle;
  private selectionRectangleAdded = false;
  private selectionRectangleSelection: SENodule[] = []; // The selections added in the selection rectangle

  /**
   * An array to store the object selected by the key press handler
   */
  private keyPressSelection: SENodule[] = [];
  // private _disableKeyHandler = false;

  constructor(layers: Two.Group[]) {
    super(layers);
    this.selectionRectangle = new SelectionRectangle(
      layers[LAYER.foregroundText]
    );
    // this.selectionRectangle.hide();
  }
  /**
   * This handles the keyboard events and when multiple objects are under
   * the mouse, the user can specify which one to select.
   * @param keyEvent A keyboard event -- only the digits are interpreted
   */
  keyPressHandler = (keyEvent: KeyboardEvent): void => {
    // if (this._disableKeyHandler) return;
    //if (keyEvent.repeat) return; // Ignore repeated events on the same key
    // Clear the keyPressSelection
    this.keyPressSelection.clear();
    // Get all SEPoints lower case p
    if (keyEvent.code === "KeyP" && !keyEvent.shiftKey) {
      SelectionHandler.store.sePoints
        .map(n => n as SEPoint)
        .filter(
          (n: SEPoint) =>
            !(
              (n instanceof SEIntersectionPoint ||
                n instanceof SEAntipodalPoint) &&
              !n.isUserCreated
            ) && n.showing
        ) // no unUserCreated intersection points allowed and no hidden points allowed
        .forEach((n: SEPoint) => {
          this.keyPressSelection.push(n);
          n.ref.glowingDisplay();
        });
    }
    // Get all SECircles lower case c
    else if (keyEvent.code === "KeyC" && !keyEvent.shiftKey) {
      SelectionHandler.store.seCircles
        .map(x => x as SECircle)
        .filter((n: SECircle) => n.showing) //no hidden circles allowed
        .forEach((n: SECircle) => {
          this.keyPressSelection.push(n);
          n.ref.glowingDisplay();
        });
    }
    // Get all SEEllipses lower case e
    else if (keyEvent.code === "KeyE" && !keyEvent.shiftKey) {
      SelectionHandler.store.seEllipses
        .map(x => x as SEEllipse)
        .filter((n: SEEllipse) => n.showing) //no hidden Ellipses allowed
        .forEach((n: SEEllipse) => {
          this.keyPressSelection.push(n);
          n.ref.glowingDisplay();
        });
    }
    // Get all SELines lower case l
    else if (keyEvent.code === "KeyL" && !keyEvent.shiftKey) {
      SelectionHandler.store.seLines
        .map(x => x as SELine)
        .filter((n: SELine) => n.showing) //no hidden lines allowed
        .forEach((n: SELine) => {
          this.keyPressSelection.push(n);
          n.ref.glowingDisplay();
        });
    }
    // Get all SESegments lower case s
    else if (keyEvent.code === "KeyS" && !keyEvent.shiftKey) {
      SelectionHandler.store.seSegments
        .map(s => s as SESegment)
        .filter((n: SESegment) => n.showing) //no hidden segments allowed
        .forEach((n: SESegment) => {
          this.keyPressSelection.push(n);
          n.ref.glowingDisplay();
        });
    }
    // Get all SEAngleMarkers upper case A
    else if (keyEvent.code === "KeyA" && keyEvent.shiftKey) {
      SelectionHandler.store.seAngleMarkers
        .map(s => s as SEAngleMarker)
        .filter((n: SEAngleMarker) => n.showing) //no hidden angle markers allowed
        .forEach((n: SEAngleMarker) => {
          this.keyPressSelection.push(n);
          n.ref.glowingDisplay();
        });
    }
    // Get all SEParametrics upper case P
    else if (keyEvent.code === "KeyP" && keyEvent.shiftKey) {
      SelectionHandler.store.seParametrics
        .map(s => s as SEParametric)
        .filter((n: SEParametric) => n.showing) //no hidden parametrics allowed
        .forEach((n: SEParametric) => {
          this.keyPressSelection.push(n);
          n.ref?.glowingDisplay();
          // let ptr: Parametric | null = n.ref;
          // while (ptr !== null) {
          //   ptr.glowingDisplay();
          //   ptr = ptr.next;
          // }
        });
    }
    // Get all SEPolygons upper case O
    else if (keyEvent.code === "KeyO" && keyEvent.shiftKey) {
      SelectionHandler.store.sePolygons
        .map(s => s as SEPolygon)
        .filter((n: SEPolygon) => n.showing) //no hidden Polygons allowed
        .forEach((n: SEPolygon) => {
          this.keyPressSelection.push(n);
          n.ref.glowingDisplay();
        });
    }
    // Get all SELabels upper case L NO THERE IS NO NEED TO SELECT LABELS
    // else if (keyEvent.code === "KeyL" && keyEvent.shiftKey) {
    //   SelectionHandler.store.seLabels
    //     .filter((n: SELabel) => n.showing) //no hidden Labels allowed
    //     .forEach((n: SELabel) => {
    //       this.keyPressSelection.push(n);
    //       n.ref.glowingDisplay();
    //     });
    // }
    // Get all SENodules lower case a and meta key
    else if (navigator.userAgent.indexOf("Mac OS X") !== -1) {
      //Mac shortcuts for select all
      if (keyEvent.code === "KeyA" && !keyEvent.shiftKey && keyEvent.metaKey) {
        SelectionHandler.store.seNodules
          .map(n => n as SENodule)
          .filter((n: SENodule) => n.showing && !n.isLabel()) //no hidden objects allowed //no labels allowed
          .forEach((n: SENodule) => {
            this.keyPressSelection.push(n);
            if (n.ref) n.ref.glowingDisplay();
          });
        keyEvent.preventDefault(); //prevents this key stroke combination from selecting all the text on the screen
      }
    } else if (navigator.userAgent.indexOf("Mac OS X") === -1) {
      //PC shortcuts for select all
      if (keyEvent.code === "KeyA" && keyEvent.ctrlKey) {
        SelectionHandler.store.seNodules
          .map(n => n as SENodule)
          .filter((n: SENodule) => n.showing && !n.isLabel()) //no hidden objects allowed //no labels allowed
          .forEach((n: SENodule) => {
            this.keyPressSelection.push(n);
            if (n.ref) n.ref.glowingDisplay();
          });
        keyEvent.preventDefault(); //prevents this key stroke combination from selecting all the text on the screen
      }
    }

    // Now process the hitSENodules so the user can select by number
    // If there is nothing or only one nearby ignore this key event
    if (this.hitSENodules?.length <= 1) return;
    if (keyEvent.key.match(/[0-9]/)) {
      // is it a digit?
      const val = Number(keyEvent.key) - 1;
      this.hitSENodules
        .filter(
          n =>
            !(n instanceof SEIntersectionPoint && !n.isUserCreated) &&
            !(n instanceof SEAntipodalPoint && !n.isUserCreated)
        ) // no uncreated intersection points allowed
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

    if (SelectionHandler.store.actionMode === "select") {
      SelectionHandler.store.setSelectedSENodules(this.currentSelection);

      if (SelectionHandler.store.selectedSENodules.length === 0) {
        EventBus.fire("show-alert", {
          key: `handlers.selectionUpdateNothingSelected`,
          keyOptions: {},
          type: "error"
        });
      } else {
        EventBus.fire("show-alert", {
          key: `handlers.selectionUpdate`,
          keyOptions: {
            number: `${SelectionHandler.store.selectedSENodules.length}`
          },
          type: "success"
        });
      }

      if (this.currentSelection.length > 0 && this.highlightTimer === null) {
        // We have selections and interval timer is not running, then start timer and offset timer
        this.highlightTimer = setInterval(
          this.blinkSelections.bind(this),
          1500
        );
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
      this.mouseDownLocation.splice(0);
      this.dragging = false;
      // remove the selection rectangle from the layers
      if (this.selectionRectangleAdded) {
        this.selectionRectangle.hide();
      }
      this.selectionRectangleAdded = false;
      this.selectionRectangleSelection.splice(0);
    }
    // The user moused down so record the location
    this.mouseDownLocation = [
      this.currentScreenVector.x,
      this.currentScreenVector.y
    ];
    // clear the selected rectangle selection
    this.selectionRectangleSelection.splice(0);

    // If the user clicks on a label warn them about labels not being selectable.
    if (this.hitSELabels[0]) {
      EventBus.fire("show-alert", {
        key: `style.cannotSelectLabels`,
        keyOptions: {},
        type: "warning"
      });
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

    if (this.mouseDownLocation.length !== 0) {
      this.dragging = true;
      // Add the rectangle if it hasn't been added already
      if (!this.selectionRectangleAdded) {
        this.selectionRectangle.show();
        this.selectionRectangleAdded = true;
      }
      // update the location of the rectangle
      this.selectionRectangle.move(
        this.mouseDownLocation,
        [this.currentScreenVector.x, this.currentScreenVector.y],
        event.shiftKey
      );
      // highlight and move the the selected objects intersecting the rectangle that are not already in the current selection into the current selection
      this.highlight(
        this.mouseDownLocation,
        [this.currentScreenVector.x, this.currentScreenVector.y],
        event.shiftKey
      );
    } else {
      // Glow the appropriate object, only the top one should glow because the user can only add one at a time with a mouse press
      // Glow one object, first a point, then lines, then segments, then circles, then ellipses, then parametrics
      if (this.hitSEPoints.length > 0) {
        if (
          (!(this.hitSEPoints[0] instanceof SEAntipodalPoint) ||
            this.hitSEPoints[0].isUserCreated) &&
          (!(this.hitSEPoints[0] instanceof SEIntersectionPoint) ||
            this.hitSEPoints[0].isUserCreated)
        ) {
          this.hitSEPoints[0].glowing = true;
        }
      } else if (this.hitSELines.length > 0) {
        this.hitSELines[0].glowing = true;
      } else if (this.hitSESegments.length > 0) {
        this.hitSESegments[0].glowing = true;
      } else if (this.hitSECircles.length > 0) {
        this.hitSECircles[0].glowing = true;
      } else if (this.hitSEEllipses.length > 0) {
        this.hitSEEllipses[0].glowing = true;
      } else if (this.hitSEParametrics.length > 0) {
        this.hitSEParametrics[0].glowing = true;
      } else if (this.hitSEAngleMarkers.length > 0) {
        this.hitSEAngleMarkers[0].glowing = true;
      } else if (this.hitSEPolygons.length > 0) {
        this.hitSEPolygons[0].glowing = true;
      }
      // this.hitSENodules
      //   .filter((p: SENodule) => {
      //     if (
      //       (p instanceof SEAntipodalPoint && !p.isUserCreated) ||
      //       (p instanceof SEIntersectionPoint && !p.isUserCreated) ||
      //       p.isLabel() // You are not allow to select labels, labels are attributes of an object, so like color they are not selectable.
      //     ) {
      //       return false;
      //     } else {
      //       return true;
      //     }
      //   })
      //   .forEach((n: SENodule, index) => {
      //     if (index === 0 || n.selected) {
      //       n.glowing = true;
      //     } else {
      //       n.glowing = false;
      //     }
      //   });
    }
  }

  mouseReleased(event: MouseEvent): void {
    //If you select an object (like a line), then add to that selection with a key press and a mouse press at
    // a empty location (like p -adding all point to the selection ), then *without* moving the mouse, a mouse press doesn't
    // clear the current selections like it should -- is this even worth worrying about?
    if (!this.dragging) {
      // if not dragging to create a selection rectangle, then add the key press select, or clicked object, or clear the selections
      if (this.keyPressSelection.length !== 0) {
        // remove any items from the keyPressSelection if they are already selected
        const newKeyPressSelections = this.keyPressSelection.filter(
          (n: SENodule) => {
            return this.currentSelection.findIndex(h => h.id === n.id) < 0;
          }
        );

        // Select all the objects in the keypress selection
        newKeyPressSelections.forEach(n => {
          n.selected = true;
        });

        // Add the key press selection to the selected list.
        this.currentSelection.push(...newKeyPressSelections);
        this.keyPressSelection.splice(0);
      } else {
        // Remove non-selectable intersection and antipodal points
        // const possibleAdditions = this.hitSENodules.filter((p: SENodule) => {
        //   if (
        //     (p instanceof SEAntipodalPoint && !p.isUserCreated) ||
        //     (p instanceof SEIntersectionPoint && !p.isUserCreated) ||
        //     p.isLabel() // no labels can be selected
        //   ) {
        //     return false;
        //   } else {
        //     return true;
        //   }
        // });
        const possibleAdditions: SENodule[] = [];
        if (this.hitSEPoints.length > 0) {
          if (
            (!(this.hitSEPoints[0] instanceof SEAntipodalPoint) ||
              this.hitSEPoints[0].isUserCreated) &&
            (!(this.hitSEPoints[0] instanceof SEIntersectionPoint) ||
              this.hitSEPoints[0].isUserCreated)
          ) {
            possibleAdditions.push(this.hitSEPoints[0]);
          }
        } else if (this.hitSELines.length > 0) {
          possibleAdditions.push(this.hitSELines[0]);
        } else if (this.hitSESegments.length > 0) {
          possibleAdditions.push(this.hitSESegments[0]);
        } else if (this.hitSECircles.length > 0) {
          possibleAdditions.push(this.hitSECircles[0]);
        } else if (this.hitSEEllipses.length > 0) {
          possibleAdditions.push(this.hitSEEllipses[0]);
        } else if (this.hitSEParametrics.length > 0) {
          possibleAdditions.push(this.hitSEParametrics[0]);
        } else if (this.hitSEAngleMarkers.length > 0) {
          possibleAdditions.push(this.hitSEAngleMarkers[0]);
        } else if (this.hitSEPolygons.length > 0) {
          possibleAdditions.push(this.hitSEPolygons[0]);
        }

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
            this.currentSelection.splice(0);

            // Check to see if there was an object on the back of the sphere that the user was trying to
            // select but doesn't know about the shift key.  Send an alert in this case
            const sphereVec = new Vector3(
              this.currentSphereVector.x,
              this.currentSphereVector.y,
              -1 * this.currentSphereVector.z
            );
            const hitSENodules = SelectionHandler.store
              .findNearbySENodules(sphereVec, this.currentScreenVector)
              .filter((n: SENodule) => !n.isLabel()) // remove all labels from the selection
              .filter((n: SENodule) => {
                if (
                  n instanceof SEIntersectionPoint ||
                  n instanceof SEAntipodalPoint
                ) {
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
    }

    SelectionHandler.store.setSelectedSENodules(this.currentSelection);

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
    // clear the mouse down location to get ready for another rectangle or selection
    this.mouseDownLocation.splice(0);
    this.dragging = false;
    // remove the selection rectangle from the layers
    if (this.selectionRectangleAdded) {
      this.selectionRectangle.hide();
    }
    this.selectionRectangleAdded = false;
    this.selectionRectangleSelection.splice(0);
  }


  activate(): void {
    window.addEventListener("keydown", this.keyPressHandler);
    this.currentSelection.splice(0);
    this.selectionRectangleSelection.splice(0);
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
    window.removeEventListener("keydown", this.keyPressHandler);

    // If the user has been styling objects and then, without selecting new objects, activates
    //  another tool, the style state should be saved.
    EventBus.fire("save-style-state", {});

    this.selectionRectangle.hide();
    this.selectionRectangleSelection.splice(0);
  }
  private highlight(
    cornerOne: number[],
    cornerTwo: number[],
    back: boolean
  ): void {
    // first remove all the previous rectangular selections from the current selection, unselect them, then clear rectangular selections
    this.selectionRectangleSelection.forEach(nodule => {
      const index = this.currentSelection.findIndex(
        nod => nod.id === nodule.id
      );
      if (index !== -1) {
        this.currentSelection.splice(index, 1);
      }
      nodule.selected = false;
    });
    this.selectionRectangleSelection.splice(0);

    // starting with cornerOne which is in the sphere form a grid of points ending at cornerTwo, which might be outside of the sphere
    // decide to increase or decrease in the x/y directions depending on the relative locations of the corner
    const xDirection = cornerOne[0] < cornerTwo[0] ? 1 : -1;
    const yDirection = cornerOne[1] < cornerTwo[1] ? 1 : -1;

    let iX = 0;
    let iY = 0;
    let deltaX = 0;
    let deltaY = 0;
    let xLocation = 0;
    let yLocation = 0;
    const R = SETTINGS.boundaryCircle.radius;
    let zCoordinate = 0;
    let nearBySENodules: SENodule[] = [];
    do {
      do {
        xLocation = cornerOne[0] + deltaX;
        yLocation = cornerOne[1] + deltaY;

        if (xLocation * xLocation + yLocation * yLocation < R * R) {
          // the xLocation,yLocation is on the sphere
          screenVector.set(xLocation, yLocation);
          zCoordinate =
            Math.sqrt(R * R - (xLocation * xLocation + yLocation * yLocation)) *
            (back ? -1 : +1);
          sphereVector.set(xLocation, yLocation, zCoordinate).normalize();
          // find all the nearby objects
          nearBySENodules = SelectionHandler.store
            .findNearbySENodules(sphereVector, screenVector)
            .filter((n: SENodule) => !n.isLabel()) // remove any labels
            .filter((n: SENodule) => {
              if (
                n instanceof SEIntersectionPoint ||
                n instanceof SEAntipodalPoint
              ) {
                if (!n.isUserCreated) {
                  return false; // you can't select non-user created points
                } else {
                  return n.showing && n.exists; //You can't hit hidden objects or items that don't exist
                }
              } else {
                return n.showing && n.exists; //You can't hit hidden objects or items that don't exist
              }
            })
            .filter((n: SENodule) => {
              // remove any that are already in the current selection or the selection rectangle
              if (
                this.currentSelection.findIndex(
                  current => current.id === n.id
                ) !== -1 ||
                this.selectionRectangleSelection.findIndex(
                  current => current.id === n.id
                ) !== -1
              ) {
                return false;
              } else {
                return true;
              }
            });
          // highlight eligible nearby objects and add them to the selection rectangle
          if (nearBySENodules.length !== 0) {
            nearBySENodules.forEach(n => {
              if (n.ref) n.ref.glowingDisplay();
              n.selected = true;
            });
            this.selectionRectangleSelection.push(...nearBySENodules);
          }
        }
        iX += 1;
        deltaX =
          (xDirection * iX * MESHSIZE) /
          SelectionHandler.store.zoomMagnificationFactor;
      } while (Math.abs(cornerOne[0] - cornerTwo[0]) > Math.abs(deltaX));
      iX = 0;
      iY += 1;
      deltaY =
        (yDirection * iY * MESHSIZE) /
        SelectionHandler.store.zoomMagnificationFactor;
    } while (Math.abs(cornerOne[1] - cornerTwo[1]) > Math.abs(deltaY));
    // add the collection of selected objects to the current selection
    this.currentSelection.push(...this.selectionRectangleSelection);
  }
}
