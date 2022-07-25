import Two from "two.js";
import Highlighter from "./Highlighter";
import { SELabel } from "@/models/SELabel";
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { CommandGroup } from "@/commands/CommandGroup";
import { SENodule } from "@/models/SENodule";
import { Labelable } from "@/types";
import { Group } from "two.js/src/group";

export default class ToggleLabelDisplayHandler extends Highlighter {
  /**
   * Object to hide - the victim!
   */
  private label: SELabel | null = null;

  // private _disableKeyHandler = false;

  // set disableKeyHandler(b: boolean) {
  //   this._disableKeyHandler = b;
  // }

  constructor(layers: Two.Group[]) {
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
              return !(object as unknown as Labelable).label!.showing;
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
                (object as unknown as Labelable).label!,
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
      ToggleLabelDisplayHandler.store.seNodules
        .map(n => n as SENodule)
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
              return (object as unknown as Labelable).label!.showing;
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
                (object as unknown as Labelable).label!,
                false
              )
            );
          }
        });
      labelToggleDisplayCommandGroup.execute();
    }
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
    if (ToggleLabelDisplayHandler.store.selectedSENodules.length !== 0) {
      const labelToggleDisplayCommandGroup = new CommandGroup();
      ToggleLabelDisplayHandler.store.selectedSENodules
        .map(x => x as SENodule)
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
                (object as unknown as Labelable).label!,
                !(object as unknown as Labelable).label!.showing
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
