import Highlighter from "./Highlighter";
import { SELabel } from "@/models-spherical/SELabel";
import { SetNoduleDisplayCommand } from "@/commands-spherical/SetNoduleDisplayCommand";
import { SEIntersectionPoint } from "@/models-spherical/SEIntersectionPoint";
import { CommandGroup } from "@/commands-spherical/CommandGroup";
import { SENodule } from "@/models-spherical/SENodule";
import { Labelable } from "@/types";
import { SEAntipodalPoint } from "@/models-spherical/SEAntipodalPoint";
//import Two from "two.js";
import { Group } from "two.js/src/group";
import { Command } from "@/commands-spherical/Command";
import { randInt } from "three/src/math/MathUtils";
import EventBus from "./EventBus";
import { SEPoint } from "@/models-spherical/SEPoint";
import { SetPointUserCreatedValueCommand } from "@/commands-spherical/SetPointUserCreatedValueCommand";

export default class ToggleLabelDisplayHandler extends Highlighter {
  /**
   * Object to hide - the victim!
   */
  private label: SELabel | null = null;

  private seNodule: SENodule | null = null;
  // Filter the hitSEPoints appropriately for this handler
  protected filteredIntersectionPointsList: SEPoint[] = [];

  constructor(layers: Group[]) {
    super(layers);
  }

  keyPressHandler = (keyEvent: KeyboardEvent): void => {
    // if (this._disableKeyHandler) return;
    //if (keyEvent.repeat) return; // Ignore repeated events on the same key

    // Show all labels of all visible objects (whose labels are not already showing) lower case s
    if (keyEvent.code === "KeyS" && !keyEvent.shiftKey) {
      const labelToggleDisplayCommandGroup = new CommandGroup();
      ToggleLabelDisplayHandler.store.seNodules
        .map(n => n as SENodule)
        .filter(
          // no non-user created points
          (object: SENodule) =>
            (!(object instanceof SEIntersectionPoint) ||
              object.isUserCreated) &&
            (!(object instanceof SEAntipodalPoint) || object.isUserCreated)
        )
        .filter(
          // no hidden objects
          (object: SENodule) => object.showing
        )
        .filter(
          // no objects whose labels are already showing
          (object: SENodule) => {
            const objLabel = object.getLabel();
            if (objLabel) {
              return !objLabel.showing;
            } else {
              return false;
            }
          }
        )
        .forEach(object => {
          // Do the toggling on labelable objects via command so it will be undoable
          const objLabel = object.getLabel();
          if (objLabel) {
            labelToggleDisplayCommandGroup.addCommand(
              new SetNoduleDisplayCommand(objLabel, true)
            );
          }
        });
      labelToggleDisplayCommandGroup.execute();
    }

    // Hide all labels of all visible objects (whose labels are not already hiding) lower case h
    if (keyEvent.code === "KeyH" && !keyEvent.shiftKey) {
      const labelToggleDisplayCommandGroup = new CommandGroup();
      ToggleLabelDisplayHandler.store.seNodules
        .map(n => n as SENodule)
        .filter(
          // no non-user created points
          (object: SENodule) =>
            !(
              object instanceof SEIntersectionPoint ||
              object instanceof SEAntipodalPoint
            ) || object.isUserCreated
        )
        .filter(
          // no hidden objects
          (object: SENodule) => object.showing
        )
        .filter(
          // no objects whose labels are already hidden
          (object: SENodule) => {
            const objLabel = object.getLabel();
            if (objLabel) {
              return objLabel.showing;
            } else {
              return false;
            }
          }
        )
        .forEach(object => {
          // Do the toggling on labelable objects via command so it will be undoable
          const objLabel = object.getLabel();
          if (objLabel) {
            labelToggleDisplayCommandGroup.addCommand(
              new SetNoduleDisplayCommand(objLabel!, false)
            );
          }
        });
      labelToggleDisplayCommandGroup.execute();
    }
  };

  mousePressed(event: MouseEvent): void {
    //Select an object to delete
    if (this.isOnSphere) {
      this.updateFilteredPointsList();
      if (this.filteredIntersectionPointsList.length > 0) {
        if (this.filteredIntersectionPointsList[0].label != null) {
          this.seNodule = this.filteredIntersectionPointsList[0];
          this.label = this.filteredIntersectionPointsList[0].label;
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
        const cmdGroup = new CommandGroup();
        // Check if the selected seNodule is a non-user created point, if so
        // since the user interacted with it, make it user created
        if (
          (this.seNodule instanceof SEIntersectionPoint ||
            this.seNodule instanceof SEAntipodalPoint) &&
          !this.seNodule.isUserCreated
        ) {
          cmdGroup.addCommand(
            new SetPointUserCreatedValueCommand(
              this.seNodule,
              !this.seNodule.isUserCreated,
              true
            )
          );
        }
        // Check if the selected seNodule is showing, if so
        // since the user interacted with it, make it show
        if (this.seNodule != null && !this.seNodule.showing) {
          cmdGroup.addCommand(
            new SetNoduleDisplayCommand(this.seNodule, !this.seNodule.showing)
          );
        }
        // Check toggle the showing of the label
        cmdGroup
          .addCommand(
            new SetNoduleDisplayCommand(this.label, !this.label.showing)
          )
          .execute();
        this.label = null;
        this.seNodule = null;
      }
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Find all the nearby (hitSE... objects) and update location vectors
    super.mouseMoved(event);
    // Only one point can be processed at a time, so set the first point nearby to glowing
    // The user can create points (with the antipode) on ellipses, circles, segments, and lines, so
    // highlight those as well (but only one) if they are nearby also
    this.updateFilteredPointsList();
    if (this.filteredIntersectionPointsList.length > 0) {
      // never highlight non user created intersection points
      this.filteredIntersectionPointsList[0].glowing = true;
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

  updateFilteredPointsList(): void {
    this.filteredIntersectionPointsList = this.hitSEPoints.filter(pt => {
      if (pt instanceof SEIntersectionPoint) {
        if (pt.isUserCreated) {
          return pt.showing;
        } else {
          if (pt.principleParent1.showing && pt.principleParent2.showing) {
            return true;
          } else {
            return false;
          }
        }
      } else if (pt instanceof SEAntipodalPoint) {
        if (pt.isUserCreated) {
          return pt.showing;
        } else {
          return true;
        }
      }
      return pt.showing;
    });
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
    if (ToggleLabelDisplayHandler.store.selectedSENodules.length !== 0) {
      const labelToggleDisplayCommandGroup = new CommandGroup();
      ToggleLabelDisplayHandler.store.selectedSENodules
        .map(x => x as SENodule)
        .filter(
          (object: SENodule) =>
            (!(object instanceof SEIntersectionPoint) ||
              object.isUserCreated) &&
            (!(object instanceof SEAntipodalPoint) || object.isUserCreated)
        )
        .forEach(object => {
          // Do the toggling on labelable objects via command so it will be undoable
          const objLabel = object.getLabel();
          if (objLabel) {
            labelToggleDisplayCommandGroup.addCommand(
              new SetNoduleDisplayCommand(objLabel, objLabel.showing)
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
