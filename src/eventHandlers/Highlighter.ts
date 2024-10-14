import MouseHandler from "./MouseHandler";
import { SEPoint } from "@/models/SEPoint";
import SETTINGS, { LAYER } from "@/global-settings";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { SENodule } from "@/models/SENodule";
import { SELine } from "@/models/SELine";
import { SELabel } from "@/models/SELabel";
import { SESegment } from "@/models/SESegment";
import { SECircle } from "@/models/SECircle";
import { SEAngleMarker } from "@/models/SEAngleMarker";
import { SEEllipse } from "@/models/SEEllipse";
import { SEParametric } from "@/models/SEParametric";
import { SEPolygon } from "@/models/SEPolygon";
import { CommandGroup } from "@/commands/CommandGroup";
import { SEAntipodalPoint } from "@/models/SEAntipodalPoint";
import { Vector3 } from "three";
import { AddAntipodalPointCommand } from "@/commands/AddAntipodalPointCommand";

// const tmpVector = new Vector3();

export default abstract class Highlighter extends MouseHandler {
  // eslint-disable-next-line no-unused-vars
  abstract mousePressed(event: MouseEvent): void;

  // eslint-disable-next-line no-unused-vars
  abstract mouseReleased(event: MouseEvent): void;

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    // call an unglow all command
    Highlighter.store.unglowAllSENodules();
    this.infoText.hide();
  }

  /**
   * Provides an array of nearby objects (in hitPoints, hitLines,... )
   * @param event Mouse Event
   */
  mouseMoved(event: MouseEvent): void {
    // Set the isOnSphere boolean and location vectors correctly
    super.mouseMoved(event);

    if (!this.isOnSphere) return;

    // Set the display to normal for all previously nearby objects
    this.hitSENodules.forEach((n: SENodule) => {
      if (!n.selected) n.glowing = false;
    });

    // Clear the arrays of previously nearby nodules and hide any displayed info boxes
    this.hitSEPoints.clear();
    this.hitSELines.clear();
    this.hitSESegments.clear();
    this.hitSECircles.clear();
    this.hitSEEllipses.clear();
    this.hitSELabels.clear();
    this.hitSEAngleMarkers.clear();
    this.hitSEParametrics.clear();
    this.hitSEPolygons.clear();
    this.infoText.hide();

    // Create an array of SENodules of all nearby objects by querying the store
    // only SENodules that exist and are showing are returned
    this.hitSENodules = Highlighter.store
      .findNearbySENodules(this.currentSphereVector, this.currentScreenVector)
      .filter((n: SENodule) => {
        if (n instanceof SEIntersectionPoint || n instanceof SEAntipodalPoint) {
          if (!n.isUserCreated) {
            return n.exists; //You always hit automatically created intersection points if it exists
          } else {
            return n.showing && n.exists; //You can't hit hidden objects or items that don't exist
          }
        } else {
          return n.showing && n.exists; //You can't hit hidden objects or items that don't exist
        }
      });

    // Make NONE of the nearby objects by glow -- it is the job of the handler (active tool) to turn on
    // the glow of objects that the tool can interact with

    // From the array of SENodules pull out the different types
    this.hitSEPoints = this.hitSENodules
      .filter((obj: SENodule) => obj instanceof SEPoint)
      .map(obj => obj as SEPoint);

    this.hitSELines = this.hitSENodules
      .filter(obj => obj instanceof SELine)
      .map(obj => obj as SELine);

    this.hitSESegments = this.hitSENodules
      .filter(obj => obj instanceof SESegment)
      .map(obj => obj as SESegment);

    this.hitSECircles = this.hitSENodules
      .filter(obj => obj instanceof SECircle)
      .map(obj => obj as SECircle);

    this.hitSEEllipses = this.hitSENodules
      .filter(obj => obj instanceof SEEllipse)
      .map(obj => obj as SEEllipse);

    this.hitSELabels = this.hitSENodules
      .filter(obj => obj instanceof SELabel)
      .map(obj => obj as SELabel);

    this.hitSEAngleMarkers = this.hitSENodules
      .filter(obj => obj instanceof SEAngleMarker)
      .map(obj => obj as SEAngleMarker);

    this.hitSEParametrics = this.hitSENodules
      .filter(obj => obj instanceof SEParametric)
      .map(obj => obj as SEParametric);

    this.hitSEPolygons = this.hitSENodules
      .filter(obj => obj instanceof SEPolygon)
      .map(obj => obj as SEPolygon);

    // Pull the name field from all these objects into one array of strings
    const text = [
      ...this.hitSEPoints,
      ...this.hitSELines,
      ...this.hitSESegments,
      ...this.hitSECircles,
      ...this.hitSEEllipses,
      ...this.hitSEAngleMarkers,
      ...this.hitSEParametrics,
      ...this.hitSEPolygons
    ]
      .map(n => n.label?.ref.shortUserName)
      .join(", ");

    if (text.length > 0) {
      this.infoText.hide(); // hide the old box
      // Show the names temporarily
      this.infoText.showWithDelay(this.layers[LAYER.foregroundLabel], 300);
      // Textbox is set to handle a ???? How does this work????
      this.infoText.text = text;
      this.infoText.translation.set(
        this.currentScreenVector.x,
        -this.currentScreenVector.y + 16
      );
    }
  }

  activate(): void {
    Highlighter.store.selectedSENodules
      .map(x => x as SENodule)
      .forEach((obj: SENodule) => {
        obj.selected = false;
      });
    // Clear the selected objects array
    Highlighter.store.updateSelectedSENodules([]);

    // call an unglow all command
    Highlighter.store.unglowAllSENodules();
    this.infoText.hide();
  }

  ///// WARNING The code in this method is duplicated in ParametricForm.vue after CreateAllIntersectionWithParametric because I (Will) couldn't figure out how to access this from there
  static addCreateAntipodeCommand(
    parentPoint: SEPoint,
    commandGroup: CommandGroup
  ): SEAntipodalPoint {
    // Create the antipode of the new parent point

    // Create the model object for the new point and link them
    const antipodalVtx = new SEAntipodalPoint(parentPoint, false);

    // Create a plottable label
    // Create an SELabel and link it to the plottable object

    antipodalVtx.locationVector = parentPoint.locationVector;
    antipodalVtx.locationVector.multiplyScalar(-1);
    // Set the initial label location
    const newSEAntipodalLabel = antipodalVtx.attachLabelWithOffset(
      new Vector3(
        2 * SETTINGS.point.initialLabelOffset,
        SETTINGS.point.initialLabelOffset,
        0
      )
    );
    commandGroup.addCommand(
      new AddAntipodalPointCommand(
        antipodalVtx,
        parentPoint,
        newSEAntipodalLabel
      )
    );
    return antipodalVtx;
  }
}
