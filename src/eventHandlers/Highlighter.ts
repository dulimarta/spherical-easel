import MouseHandler from "./MouseHandler";
import { SEPoint } from "@/models/SEPoint";
import { LAYER } from "@/global-settings";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { SENodule } from "@/models/SENodule";
import { SELine } from "@/models/SELine";
import { SESegment } from "@/models/SESegment";
import { SECircle } from "@/models/SECircle";
import Nodule from "@/plottables/Nodule";

export default abstract class Highlighter extends MouseHandler {
  abstract mousePressed(event: MouseEvent): void;
  abstract mouseReleased(event: MouseEvent): void;

  /**
   * Provides an array of nearby objects (in hitPoints, hitLines,... ) and highlights them
   * @param event Mouse Event
   */
  mouseMoved(event: MouseEvent): void {
    super.mouseMoved(event);
    if (!this.isOnSphere) return;
    // Set the display to normal for all previously nearby objects
    this.hitSEPoints.forEach((p: SEPoint) => {
      p.glowing = false;
    });
    this.hitSELines.forEach((p: SELine) => {
      p.glowing = false;
    });
    this.hitSESegments.forEach((s: SESegment) => {
      s.glowing = false;
    });

    this.hitSECircles.forEach((c: SECircle) => {
      c.glowing = false;
    });
    // Clear the arrays of previously nearby nodules and hide any displayed info boxes
    this.hitSEPoints.clear();
    this.hitSELines.clear();
    this.hitSESegments.clear();
    this.hitSECircles.clear();
    this.infoText.hide();

    // Create an array of SENodules of all nearby objects by querying the store
    this.hitSENodules = this.store.getters
      .findNearbyObjects(this.currentSphereVector, this.currentScreenVector)
      .filter((n: SENodule) => {
        if (n instanceof SEIntersectionPoint) {
          if (!n.isUserCreated) {
            return n.exists; //You always select automatically created intersection points if it exists
          } else {
            return n.showing && n.exists; //You can't select hidden objects or items that don't exist
          }
        } else {
          return n.showing && n.exists; //You can't select hidden objects or items that don't exist
        }
      });
    // From the array of SENodules pull out the SEPoints
    this.hitSEPoints = this.hitSENodules
      .filter((obj: SENodule) => obj instanceof SEPoint)
      .map(obj => obj as SEPoint);

    // Of the nearby SEPoints make the intersection points display, and the others glow
    this.hitSEPoints.forEach((obj: SEPoint) => {
      obj.glowing = true;
    });

    // Sort the nearby SENodules list into their more specific SE classes
    this.hitSELines = this.hitSENodules
      .filter(obj => obj instanceof SELine)
      .map(obj => obj as SELine);

    this.hitSESegments = this.hitSENodules
      .filter(obj => obj instanceof SESegment)
      .map(obj => obj as SESegment);

    this.hitSECircles = this.hitSENodules
      .filter(obj => obj instanceof SECircle)
      .map(obj => obj as SECircle);

    // Prioritize the SEPoints, the above code makes the nearby SEPoints glow but if there
    // are no nearby SEPoints, make the other nearby SENodules glow and display their names
    if (this.hitSEPoints.length == 0) {
      this.hitSELines.forEach((obj: SELine) => {
        obj.glowing = true;
      });
      this.hitSESegments.forEach((obj: SESegment) => {
        obj.glowing = true;
      });
      this.hitSECircles.forEach((obj: SECircle) => {
        obj.glowing = true;
      });

      // Pull the name field from all these objects into one array of strings
      const text = [
        ...this.hitSELines,
        ...this.hitSESegments,
        ...this.hitSECircles
      ]
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
        this.hitSEPoints[0].name +
        (this.hitSEPoints[0] as SEPoint).locationVector.toFixed(2);
      this.infoText.translation.set(
        this.currentScreenVector.x,
        -this.currentScreenVector.y + 16
      );
    }
  }
}
