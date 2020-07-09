import MouseHandler from "./MouseHandler";
import { SEPoint } from "@/models/SEPoint";
import { LAYER } from "@/global-settings";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { SENodule } from "@/models/SENodule";
import { SELine } from "@/models/SELine";
import { SESegment } from "@/models/SESegment";
import { SECircle } from "@/models/SECircle";

export default abstract class Highlighter extends MouseHandler {
  abstract mousePressed(event: MouseEvent): void;
  abstract mouseReleased(event: MouseEvent): void;

  mouseMoved(event: MouseEvent): void {
    super.mouseMoved(event);
    if (!this.isOnSphere) return;
    // Set the display to normal for all previously nearby objects
    this.hitPoints.forEach((p: SEPoint) => {
      if (p instanceof SEIntersectionPoint) p.setShowing(false);
      else p.ref.normalDisplay();
    });
    this.hitLines.forEach((p: SELine) => {
      p.ref.normalDisplay();
    });
    this.hitSegments.forEach((s: SESegment) => {
      s.ref.normalDisplay();
    });

    this.hitCircles.forEach((c: SECircle) => {
      c.ref.normalDisplay();
    });
    // Clear the arrays of previously nearby nodules and hide any displayed info boxes
    this.hitPoints.clear();
    this.hitLines.clear();
    this.hitSegments.clear();
    this.hitCircles.clear();
    this.infoText.hide();

    // Create an array of SENodules of all nearby objects by querying the store
    this.hitNodules = this.store.getters.findNearbyObjects(
      this.currentSphereVector,
      this.currentScreenVector
    );

    // From the array of SENodules pull out the SEPoints
    this.hitPoints = this.hitNodules
      .filter((obj: SENodule) => obj instanceof SEPoint)
      .map(obj => obj as SEPoint);

    // Of the nearby SEPoints make the intersection points display, and the others glow
    this.hitPoints.forEach((obj: SEPoint) => {
      if (obj instanceof SEIntersectionPoint) {
        obj.setShowing(true);
      } else {
        obj.ref.glowingDisplay();
      }
    });

    // Sort the nearby SENodules list into their more specific SE classes
    this.hitLines = this.hitNodules
      .filter(obj => obj instanceof SELine)
      .map(obj => obj as SELine);

    this.hitSegments = this.hitNodules
      .filter(obj => obj instanceof SESegment)
      .map(obj => obj as SESegment);

    this.hitCircles = this.hitNodules
      .filter(obj => obj instanceof SECircle)
      .map(obj => obj as SECircle);

    // Prioritize the SEPoints, the above code makes the nearby SEPoints glow but if there
    // are no nearby SEPoints, make the other nearby SENodules glow and display their names
    if (this.hitPoints.length == 0) {
      this.hitLines.forEach((obj: SELine) => {
        obj.ref.glowingDisplay();
      });
      this.hitSegments.forEach((obj: SESegment) => {
        obj.ref.glowingDisplay();
      });
      this.hitCircles.forEach((c: SECircle) => {
        c.ref.glowingDisplay();
      });

      // Pull the name field from all these objects into one array of strings
      const text = [...this.hitLines, ...this.hitSegments, ...this.hitCircles]
        .map(n => n.name)
        .join(", ");

      if (text.length > 0) {
        // Show the names temporarily
        this.infoText.showWithDelay(this.layers[LAYER.foregroundText], 300);
        // Textbox is set to handle a ???? How does this work????
        this.infoText.text = text;
        this.infoText.translation.set(
          this.currentScreenVector.x,
          -this.currentScreenVector.y + 16
        );
      }
    } else {
      // There are nearby points, so display there names on the screen in textboxes
      this.infoText.showWithDelay(this.layers[LAYER.foregroundText], 300);
      this.infoText.text =
        this.hitPoints[0].name +
        (this.hitPoints[0] as SEPoint).vectorPosition.toFixed(2);
      this.infoText.translation.set(
        this.currentScreenVector.x,
        -this.currentScreenVector.y + 16
      );
    }
  }
}
