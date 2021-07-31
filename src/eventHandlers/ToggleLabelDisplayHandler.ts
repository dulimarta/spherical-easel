import Two from "two.js";
import Highlighter from "./Highlighter";
import { SELabel } from "@/models/SELabel";
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";
import { SEPoint } from "@/models/SEPoint";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";

export default class ToggleLabelDisplayHandler extends Highlighter {
  /**
   * Object to hide - the victim!
   */
  private label: SELabel | null = null;

  constructor(layers: Two.Group[]) {
    super(layers);
  }

  mousePressed(event: MouseEvent): void {
    //Select an object to delete
    if (this.isOnSphere) {
      if (this.hitSEPoints.length > 0) {
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
    if (this.hitSEPoints.length > 0) {
      // never highlight non user created intersection points
      const filteredIntersections = this.hitSEPoints.filter(
        (p: SEPoint) => p instanceof SEIntersectionPoint && !p.isUserCreated
      );
      if (filteredIntersections.length > 0)
        filteredIntersections[0].glowing = true;
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
    // Hide all selected objects
    this.hitSENodules.forEach(object =>
      new SetNoduleDisplayCommand(object, false).execute()
    );
    // Unselect the selected objects and clear the selectedObject array
    super.activate();
  }
  deactivate(): void {
    super.deactivate();
  }
}
