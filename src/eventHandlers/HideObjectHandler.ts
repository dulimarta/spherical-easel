import Two from "two.js";
import Highlighter from "./Highlighter";
import { SENodule } from "@/models/SENodule";
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";
import { SEPoint } from "@/models/SEPoint";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { CommandGroup } from "@/commands/CommandGroup";
import { SEStore } from "@/store";

export default class HideObjectHandler extends Highlighter {
  /**
   * Object to hide - the victim!
   */
  private victim: SENodule | null = null;

  constructor(layers: Two.Group[]) {
    super(layers);
  }

  mousePressed(_event: MouseEvent): void {
    //Select an object to delete
    if (this.isOnSphere) {
      // In the case of multiple selections prioritize points > lines > segments > circles>ellipses > labels
      if (this.hitSEPoints.length > 0) {
        // you can't hide non-user created intersection points
        if (
          !(this.hitSEPoints[0] instanceof SEIntersectionPoint) ||
          (this.hitSEPoints[0] as SEIntersectionPoint).isUserCreated
        ) {
          this.victim = this.hitSEPoints[0];
        }
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
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Highlight only one object, the one that will be hidden if the user mouse presses
    super.mouseMoved(event);
    if (this.hitSEPoints.length > 0) {
      // never highlight non user created intersection points
      const filteredPoints = this.hitSEPoints.filter((p: SEPoint) => {
        if (
          p instanceof SEIntersectionPoint &&
          !(p as SEIntersectionPoint).isUserCreated
        ) {
          return false;
        } else {
          return true;
        }
      });
      if (filteredPoints.length > 0) filteredPoints[0].glowing = true;
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
  activate(): void {
    // Hide all selected objects
    const hideCommandGroup = new CommandGroup();
    SEStore.selectedSENodules
      .filter(
        (object: SENodule) =>
          !(object instanceof SEIntersectionPoint) ||
          (object as SEIntersectionPoint).isUserCreated
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
  }
}
