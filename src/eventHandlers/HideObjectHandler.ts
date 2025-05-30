//import Two from "two.js";
import { Group } from "two.js/src/group";
import Highlighter from "./Highlighter";
import { SENodule } from "@/models/SENodule";
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";
import { SEPoint } from "@/models/SEPoint";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { CommandGroup } from "@/commands/CommandGroup";
import { SELabel } from "@/models/SELabel";
import { SEAntipodalPoint } from "@/models/SEAntipodalPoint";

export default class HideObjectHandler extends Highlighter {
  /**
   * Object to hide - the victim!
   */
  private victim: SENodule | null = null;
  // a map to store (bu SENodule ID) the show or not showing status of the SENodules when the tool is activated.
  private initialShowingMap: Map<number, boolean> = new Map(); //number is the SENodule.id, boolean is the showing value of the SENodule

// Filter the hitSEPoints appropriately for this handler
  protected filteredIntersectionPointsList: SEPoint[] = [];

  constructor(layers: Group[]) {
    super(layers);
  }

  // set disableKeyHandler(b: boolean) {
  //   this._disableKeyHandler = b;
  // }

  keyPressHandler = (keyEvent: KeyboardEvent): void => {
    // if (this._disableKeyHandler) return;
    // See if the S key was pressed, if so show *all* hidden objects
    if (keyEvent.key.match("S")) {
      const setNoduleDisplayCommandGroup = new CommandGroup();
      HideObjectHandler.store.seNodules
        .map(n => n as SENodule)
        .forEach(seNodule => {
          // don't do anything to the intersection points that are not user created
          if (
            (seNodule instanceof SEIntersectionPoint &&
              !seNodule.isUserCreated) ||
            (seNodule instanceof SEAntipodalPoint && !seNodule.isUserCreated)
          ) {
            return;
          }
          // don't show labels of intersection or antipodal points that are not user created
          if (
            seNodule instanceof SELabel &&
            ((seNodule.parent instanceof SEIntersectionPoint &&
              !seNodule.parent.isUserCreated) ||
              (seNodule.parent instanceof SEAntipodalPoint &&
                !seNodule.parent.isUserCreated))
          ) {
            return;
          }
          if (seNodule.showing === false) {
            setNoduleDisplayCommandGroup.addCommand(
              new SetNoduleDisplayCommand(seNodule, true)
            );
          }
        });
      setNoduleDisplayCommandGroup.execute();
    } else if (keyEvent.key.match("s")) {
      // if the lower case s key was pushed restore/show only those objects that the user has hidden since activating the tool
      const setNoduleDisplayCommandGroup = new CommandGroup();
      HideObjectHandler.store.seNodules
        .map(n => n as SENodule)
        .forEach(seNodule => {
          // don't do anything to the intersection points that are not user created
          if (
            (seNodule instanceof SEIntersectionPoint &&
              !seNodule.isUserCreated) ||
            (seNodule instanceof SEAntipodalPoint && !seNodule.isUserCreated)
          ) {
            return;
          }
          // don't do anything to those seNodules whose showing value hasn't changed.
          if (this.initialShowingMap.get(seNodule.id) !== undefined) {
            if (this.initialShowingMap.get(seNodule.id) === seNodule.showing) {
              return;
            }
          }

          if (seNodule.showing === false) {
            setNoduleDisplayCommandGroup.addCommand(
              new SetNoduleDisplayCommand(seNodule, true)
            );
          }
        });
      setNoduleDisplayCommandGroup.execute();
    }
  };

  mousePressed(_event: MouseEvent): void {
    //Select an object to delete
    // if (this.isOnSphere) { // text objects are not necessarily on the sphere
    // In the case of multiple selections prioritize text >points > lines > segments > circles>ellipses > labels
    this.updateFilteredPointsList();
    if (this.hitSETexts.length > 0) {
      this.victim = this.hitSETexts[0];
    } else if (this.filteredIntersectionPointsList.length > 0) {
      this.victim = this.filteredIntersectionPointsList[0];
    } else if (this.hitSELines.length > 0) {
      this.victim = this.hitSELines[0];
    } else if (this.hitSESegments.length > 0) {
      this.victim = this.hitSESegments[0];
    } else if (this.hitSECircles.length > 0) {
      this.victim = this.hitSECircles[0];
    } else if (this.hitSEEllipses.length > 0) {
      this.victim = this.hitSEEllipses[0];
    } else if (this.hitSEParametrics.length > 0) {
      this.victim = this.hitSEParametrics[0];
    } else if (this.hitSELabels.length > 0) {
      this.victim = this.hitSELabels[0];
    } else if (this.hitSEAngleMarkers.length > 0) {
      this.victim = this.hitSEAngleMarkers[0];
    } else if (this.hitSEPolygons.length > 0) {
      this.victim = this.hitSEPolygons[0];
    }

    if (this.victim != null) {
      // Do the hiding via command so it will be undoable
      new SetNoduleDisplayCommand(this.victim, false).execute();
      this.victim = null;
    }
    // }
  }

  mouseMoved(event: MouseEvent): void {
    // Highlight only one object, the one that will be hidden if the user mouse presses
    super.mouseMoved(event);
    this.updateFilteredPointsList();
    if (this.hitSETexts.length > 0) {
      this.hitSETexts[0].glowing = true;
    } else if (this.filteredIntersectionPointsList.length > 0) {
      this.filteredIntersectionPointsList[0].glowing = true;
    } else if (this.hitSESegments.length > 0) {
      this.hitSESegments[0].glowing = true;
    } else if (this.hitSELines.length > 0) {
      this.hitSELines[0].glowing = true;
    } else if (this.hitSECircles.length > 0) {
      this.hitSECircles[0].glowing = true;
    } else if (this.hitSEEllipses.length > 0) {
      this.hitSEEllipses[0].glowing = true;
    } else if (this.hitSEParametrics.length > 0) {
      this.hitSEParametrics[0].glowing = true;
    } else if (this.hitSELabels.length > 0) {
      this.hitSELabels[0].glowing = true;
    } else if (this.hitSEAngleMarkers.length > 0) {
      this.hitSEAngleMarkers[0].glowing = true;
    } else if (this.hitSEPolygons.length > 0) {
      this.hitSEPolygons[0].glowing = true;
    }
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {}

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    // Reset the victim in preparation for another deletion.
    this.victim = null;
  }

  updateFilteredPointsList(): void {
    this.filteredIntersectionPointsList = this.hitSEPoints.filter(pt => {
      if (pt instanceof SEIntersectionPoint || pt instanceof SEAntipodalPoint) {
        if (pt.isUserCreated) {
          return pt.showing;
        } else {
          return false;
        }
      }
      return pt.showing;
    });
  }

  activate(): void {
    window.addEventListener("keypress", this.keyPressHandler);
    // Record the showing status of all the SENodules
    HideObjectHandler.store.seNodules.forEach(seNodule => {
      this.initialShowingMap.set(seNodule.id, seNodule.showing);
    });

    // Hide all selected objects
    const hideCommandGroup = new CommandGroup();
    HideObjectHandler.store.selectedSENodules
      .map(x => x as SENodule)
      .filter(
        // remove the intersection points that are not user created
        (object: SENodule) =>
          (!(object instanceof SEIntersectionPoint) || object.isUserCreated) &&
          (!(object instanceof SEAntipodalPoint) || object.isUserCreated)
      )
      .forEach((object: SENodule) =>
        hideCommandGroup.addCommand(new SetNoduleDisplayCommand(object, false))
      );

    hideCommandGroup.execute();
    // Unselect the selected objects and clear the selectedObject array
    super.activate();
  }
  deactivate(): void {
    super.deactivate();
    // Remove the listener
    window.removeEventListener("keypress", this.keyPressHandler);
    // clear the initial showing map
    this.initialShowingMap.clear();
  }
}
