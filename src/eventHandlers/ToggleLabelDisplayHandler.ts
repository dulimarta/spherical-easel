import Two from "two.js";
import Highlighter from "./Highlighter";
import { SELabel } from "@/models/SELabel";
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";
import { SEPoint } from "@/models/SEPoint";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { CommandGroup } from "@/commands/CommandGroup";
import { SEStore } from "@/store";
import { SENodule } from "@/models/SENodule";
import { Labelable } from "@/types";

export default class ToggleLabelDisplayHandler extends Highlighter {
  /**
   * Object to hide - the victim!
   */
  private label: SELabel | null = null;

  constructor(layers: Two.Group[]) {
    super(layers);
  }

  keyPressHandler = (keyEvent: KeyboardEvent): void => {
    //if (keyEvent.repeat) return; // Ignore repeated events on the same key

    // Show all labels of all visible objects (whose labels are not already showing) lower case s
    if (keyEvent.code === "KeyS" && !keyEvent.shiftKey) {
      const labelToggleDisplayCommandGroup = new CommandGroup();
      SEStore.seNodules
        .filter(
          // no non-user created points
          (object: SENodule) =>
            !(object instanceof SEIntersectionPoint) ||
            (object as SEIntersectionPoint).isUserCreated
        )
        .filter(
          // no hidden objects
          (object: SENodule) => object.showing
        )
        .filter(
          // no objects whose labels are already showing
          (object: SENodule) => {
            if (object.isLabelable()) {
              return !((object as unknown) as Labelable).label!.showing;
            } else {
              return false;
            }
          }
        )
        .forEach(object => {
          // Do the toggling on labelable objects via command so it will be undoable
          if (object.isLabelable()) {
            labelToggleDisplayCommandGroup.addCommand(
              new SetNoduleDisplayCommand(
                ((object as unknown) as Labelable).label!,
                true
              )
            );
          }
        });
      labelToggleDisplayCommandGroup.execute();
    }

    // Hide all labels of all visible objects (whose labels are not already hiding) lower case h
    if (keyEvent.code === "KeyH" && !keyEvent.shiftKey) {
      const labelToggleDisplayCommandGroup = new CommandGroup();
      SEStore.seNodules
        .filter(
          // no non-user created points
          (object: SENodule) =>
            !(object instanceof SEIntersectionPoint) ||
            (object as SEIntersectionPoint).isUserCreated
        )
        .filter(
          // no hidden objects
          (object: SENodule) => object.showing
        )
        .filter(
          // no objects whose labels are already hidden
          (object: SENodule) => {
            if (object.isLabelable()) {
              return ((object as unknown) as Labelable).label!.showing;
            } else {
              return false;
            }
          }
        )
        .forEach(object => {
          // Do the toggling on labelable objects via command so it will be undoable
          if (object.isLabelable()) {
            labelToggleDisplayCommandGroup.addCommand(
              new SetNoduleDisplayCommand(
                ((object as unknown) as Labelable).label!,
                false
              )
            );
          }
        });
      labelToggleDisplayCommandGroup.execute();
    }
    // // Get all SECircles lower case c
    // else if (keyEvent.code === "KeyC" && !keyEvent.shiftKey) {
    //   SEStore.seCircles
    //     .filter((n: SECircle) => n.showing) //no hidden circles allowed
    //     .forEach((n: SECircle) => {
    //       this.keyPressSelection.push(n);
    //       n.ref.glowingDisplay();
    //     });
    // }
    // // Get all SEEllipses lower case e
    // else if (keyEvent.code === "KeyE" && !keyEvent.shiftKey) {
    //   SEStore.seEllipses
    //     .filter((n: SEEllipse) => n.showing) //no hidden Ellipses allowed
    //     .forEach((n: SEEllipse) => {
    //       this.keyPressSelection.push(n);
    //       n.ref.glowingDisplay();
    //     });
    // }
    // // Get all SELines lower case l
    // else if (keyEvent.code === "KeyL" && !keyEvent.shiftKey) {
    //   SEStore.seLines
    //     .filter((n: SELine) => n.showing) //no hidden lines allowed
    //     .forEach((n: SELine) => {
    //       this.keyPressSelection.push(n);
    //       n.ref.glowingDisplay();
    //     });
    // }
    // // Get all SESegments lower case s
    // else if (keyEvent.code === "KeyS" && !keyEvent.shiftKey) {
    //   SEStore.seSegments
    //     .filter((n: SESegment) => n.showing) //no hidden segments allowed
    //     .forEach((n: SESegment) => {
    //       this.keyPressSelection.push(n);
    //       n.ref.glowingDisplay();
    //     });
    // }
    // // Get all SEAngleMarkers upper case A
    // else if (keyEvent.code === "KeyA" && keyEvent.shiftKey) {
    //   SEStore.seAngleMarkers
    //     .filter((n: SEAngleMarker) => n.showing) //no hidden angle markers allowed
    //     .forEach((n: SEAngleMarker) => {
    //       this.keyPressSelection.push(n);
    //       n.ref.glowingDisplay();
    //     });
    // }
    // // Get all SEParametrics upper case P
    // else if (keyEvent.code === "KeyP" && keyEvent.shiftKey) {
    //   SEStore.seParametrics
    //     .filter((n: SEParametric) => n.showing) //no hidden parametrics allowed
    //     .forEach((n: SEParametric) => {
    //       this.keyPressSelection.push(n);
    //       let ptr: Parametric | null = n.ref;
    //       while (ptr !== null) {
    //         ptr.glowingDisplay();
    //         ptr = ptr.next;
    //       }
    //     });
    // }
    // // Get all SEPolygons upper case O
    // else if (keyEvent.code === "KeyO" && keyEvent.shiftKey) {
    //   SEStore.sePolygons
    //     .filter((n: SEPolygon) => n.showing) //no hidden Polygons allowed
    //     .forEach((n: SEPolygon) => {
    //       this.keyPressSelection.push(n);
    //       n.ref.glowingDisplay();
    //     });
    // }
    // // Get all SELabels upper case L
    // else if (keyEvent.code === "KeyL" && keyEvent.shiftKey) {
    //   SEStore.seLabels
    //     .filter((n: SELabel) => n.showing) //no hidden Labels allowed
    //     .forEach((n: SELabel) => {
    //       this.keyPressSelection.push(n);
    //       n.ref.glowingDisplay();
    //     });
    // }
    // // Get all SENodules lower case a and meta key
    // else if (navigator.userAgent.indexOf("Mac OS X") !== -1) {
    //   //Mac shortcuts for select all
    //   if (keyEvent.code === "KeyA" && !keyEvent.shiftKey && keyEvent.metaKey) {
    //     SEStore.seNodules
    //       .filter((n: SENodule) => n.showing) //no hidden objects allowed
    //       .forEach((n: SENodule) => {
    //         this.keyPressSelection.push(n);
    //         if (n.ref) n.ref.glowingDisplay();
    //       });
    //     keyEvent.preventDefault(); //prevents this key stroke combination from selecting all the text on the screen
    //   }
    // } else if (navigator.userAgent.indexOf("Mac OS X") === -1) {
    //   //PC shortcuts for select all
    //   if (keyEvent.code === "KeyA" && keyEvent.ctrlKey) {
    //     SEStore.seNodules
    //       .filter((n: SENodule) => n.showing) //no hidden objects allowed
    //       .forEach((n: SENodule) => {
    //         this.keyPressSelection.push(n);
    //         if (n.ref) n.ref.glowingDisplay();
    //       });
    //     keyEvent.preventDefault(); //prevents this key stroke combination from selecting all the text on the screen
    //   }
    // }
    // // Now process the hitSENodules so the user can select by number
    // // If there is nothing or only one nearby ignore this key event
    // if (this.hitSENodules?.length <= 1) return;
    // if (keyEvent.key.match(/[0-9]/)) {
    //   // is it a digit?
    //   const val = Number(keyEvent.key) - 1;
    //   this.hitSENodules
    //     .filter(n => !(n instanceof SEIntersectionPoint && !n.isUserCreated)) // no uncreated intersection points allowed
    //     .forEach((n, pos) => {
    //       if (pos === val) {
    //         // add the item to the list
    //         this.keyPressSelection.push(n);
    //         (n as any).ref.glowingDisplay();
    //         // Show the name of the selected item
    //         this.infoText.text = n.name;
    //       } else if (!n.selected) {
    //         (n as any).ref.normalDisplay();
    //       }
    //     });
    // }
  };

  mousePressed(event: MouseEvent): void {
    //Select an object to delete
    if (this.isOnSphere) {
      if (
        this.hitSEPoints.length > 0 &&
        !(
          this.hitSEPoints[0] instanceof SEIntersectionPoint &&
          !(this.hitSEPoints[0] as SEIntersectionPoint).isUserCreated
        )
      ) {
        if (this.hitSEPoints[0].label != null) {
          this.label = this.hitSEPoints[0].label;
        }
      } else if (this.hitSESegments.length > 0) {
        if (this.hitSESegments[0].label != null) {
          this.label = this.hitSESegments[0].label;
        }
      } else if (this.hitSELines.length > 0) {
        if (this.hitSELines[0].label != null) {
          this.label = this.hitSELines[0].label;
        }
      } else if (this.hitSECircles.length > 0) {
        if (this.hitSECircles[0].label != null) {
          this.label = this.hitSECircles[0].label;
        }
      } else if (this.hitSEEllipses.length > 0) {
        if (this.hitSEEllipses[0].label != null) {
          this.label = this.hitSEEllipses[0].label;
        }
      } else if (this.hitSEParametrics.length > 0) {
        if (this.hitSEParametrics[0].label != null) {
          this.label = this.hitSEParametrics[0].label;
        }
      } else if (this.hitSEAngleMarkers.length > 0) {
        if (this.hitSEAngleMarkers[0].label != null) {
          this.label = this.hitSEAngleMarkers[0].label;
        }
      } else if (this.hitSEPolygons.length > 0) {
        if (this.hitSEPolygons[0].label != null) {
          this.label = this.hitSEPolygons[0].label;
        }
      } else if (this.hitSELabels.length > 0) {
        this.label = this.hitSELabels[0];
      }

      if (this.label != null) {
        // Do the hiding via command so it will be undoable
        new SetNoduleDisplayCommand(this.label, !this.label.showing).execute();
        this.label = null;
      }
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Find all the nearby (hitSE... objects) and update location vectors
    super.mouseMoved(event);
    // Only one point can be processed at a time, so set the first point nearby to glowing
    // The user can create points (with the antipode) on ellipses, circles, segments, and lines, so
    // highlight those as well (but only one) if they are nearby also
    if (
      this.hitSEPoints.length > 0 &&
      !(
        this.hitSEPoints[0] instanceof SEIntersectionPoint &&
        !(this.hitSEPoints[0] as SEIntersectionPoint).isUserCreated
      )
    ) {
      // never highlight non user created intersection points
      this.hitSEPoints[0].glowing = true;
    } else if (this.hitSESegments.length > 0) {
      this.hitSESegments[0].glowing = true;
    } else if (this.hitSELines.length > 0) {
      this.hitSELines[0].glowing = true;
    } else if (this.hitSECircles.length > 0) {
      this.hitSECircles[0].glowing = true;
    } else if (this.hitSEParametrics.length > 0) {
      this.hitSEParametrics[0].glowing = true;
    } else if (this.hitSEAngleMarkers.length > 0) {
      this.hitSEAngleMarkers[0].glowing = true;
    } else if (this.hitSEPolygons.length > 0) {
      this.hitSEPolygons[0].glowing = true;
    } else if (this.hitSELabels.length > 0) {
      this.hitSELabels[0].glowing = true;
    }
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {}

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    // Reset the victim in preparation for another deletion.
    this.label = null;
  }
  activate(): void {
    window.addEventListener("keydown", this.keyPressHandler);
    // Toggle the display of all selected objects
    if (SEStore.selectedSENodules.length !== 0) {
      const labelToggleDisplayCommandGroup = new CommandGroup();
      SEStore.selectedSENodules
        .filter(
          (object: SENodule) =>
            !(object instanceof SEIntersectionPoint) ||
            (object as SEIntersectionPoint).isUserCreated
        )
        .forEach(object => {
          // Do the toggling on labelable objects via command so it will be undoable
          if (object.isLabelable()) {
            labelToggleDisplayCommandGroup.addCommand(
              new SetNoduleDisplayCommand(
                ((object as unknown) as Labelable).label!,
                !((object as unknown) as Labelable).label!.showing
              )
            );
          }
        });
      labelToggleDisplayCommandGroup.execute();
    }
    // Unselect the selected objects and clear the selectedObject array
    super.activate();
  }
  deactivate(): void {
    // Remove the listener
    window.removeEventListener("keydown", this.keyPressHandler);
    super.deactivate();
  }
}
