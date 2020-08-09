import Two from "two.js";
import Highlighter from "./Highlighter";
import { SELabel } from "@/models/SELabel";
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";

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
      // In the case of multiple selections prioritize points > lines > segments > circles
      if (this.hitSEPoints.length > 0) {
        if (this.hitSEPoints[0].label != null) {
          this.label = this.hitSEPoints[0].label;
        }
      } else if (this.hitSELines.length > 0) {
        if (this.hitSELines[0].label != null) {
          this.label = this.hitSELines[0].label;
        }
      } else if (this.hitSESegments.length > 0) {
        if (this.hitSESegments[0].label != null) {
          this.label = this.hitSESegments[0].label;
        }
      } else if (this.hitSECircles.length > 0) {
        if (this.hitSECircles[0].label != null) {
          this.label = this.hitSECircles[0].label;
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
    // Highlight all nearby objects and update location vectors
    super.mouseMoved(event);
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
