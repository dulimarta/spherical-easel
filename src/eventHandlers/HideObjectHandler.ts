import Two from "two.js";
import Highlighter from "./Highlighter";
import { SENodule } from "@/models/SENodule";
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";

export default class HideObjectHandler extends Highlighter {
  /**
   * Object to hide - the victim!
   */
  private victim: SENodule | null = null;

  constructor(layers: Two.Group[]) {
    super(layers);
  }

  mousePressed(event: MouseEvent): void {
    //Select an object to delete
    if (this.isOnSphere) {
      // In the case of multiple selections prioritize points > lines > segments > circles
      if (this.hitSEPoints.length > 0) {
        this.victim = this.hitSEPoints[0];
      } else if (this.hitSELines.length > 0) {
        this.victim = this.hitSELines[0];
      } else if (this.hitSESegments.length > 0) {
        this.victim = this.hitSESegments[0];
      } else if (this.hitSECircles.length > 0) {
        this.victim = this.hitSECircles[0];
      }

      if (this.victim != null) {
        // Do the hiding via command so it will be undoable
        new SetNoduleDisplayCommand(this.victim, false).execute();
        this.victim = null;
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
    this.victim = null;
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
