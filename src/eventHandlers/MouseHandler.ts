/** @format */

import { Vector3, Matrix4 } from "three";
import AppStore from "@/store";
import { ToolStrategy } from "./ToolStrategy";
import Two from "two.js";
import Point from "@/plottables/Point";
import SETTINGS, { LAYER } from "@/global-settings";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { SECircle } from "@/models/SECircle";
import { SESegment } from "@/models/SESegment";
import { TextBox } from "@/plottables/TextBox";
import { SENodule } from "@/models/SENodule";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { DisplayStyle } from "@/plottables/Nodule";

export default abstract class MouseHandler implements ToolStrategy {
  protected readonly X_AXIS = new Vector3(1, 0, 0);
  protected readonly Y_AXIS = new Vector3(0, 1, 0);
  protected readonly Z_AXIS = new Vector3(0, 0, 1);

  protected readonly canvas: Two.Group;
  protected store = AppStore; // Vuex global state
  /**
   * The vector location of the current and previous mouse event on the ideal unit sphere
   */
  protected currentSphereVector: Vector3;
  protected previousSphereVector: Vector3;
  /**
   * The vector location of the current and previous mouse event in the Default Sphere Plane
   */
  protected currentScreenVector: Two.Vector;
  protected previousScreenVector: Two.Vector;
  /**
   * True if the mouse event is on the default sphere
   */
  protected isOnSphere: boolean;
  /**
   * Arrays of nodules near the mouse event location
   */
  protected hitNodules: SENodule[] = [];
  protected hitPoints: SEPoint[] = [];
  protected hitLines: SELine[] = [];
  protected hitSegments: SESegment[] = [];
  protected hitCircles: SECircle[] = [];
  /**
   * A temporary point created while the user is making the circle
   */
  protected startMarker: Point;

  /**
   * Holds the layers for each type of object, background, glowing background, etc..
   * This allow the created objects to be put in the correct layers
   */
  protected layers: Two.Group[];

  /**
   * Temporary objects that help process the mouse event location
   */
  private mouseVector = new Vector3();
  private tmpMatrix = new Matrix4();

  /**
   * An object to hold information about the nearby objects when then pause over a highlighted object
   */
  protected infoText = new TextBox("Hello");

  constructor(layers: Two.Group[]) {
    this.layers = layers;
    this.canvas = layers[LAYER.midground];
    this.currentSphereVector = new Vector3();
    this.currentScreenVector = new Two.Vector(0, 0);
    this.previousSphereVector = new Vector3();
    this.previousScreenVector = new Two.Vector(0, 0);
    this.isOnSphere = false;
    // Create and style the temporary point marking the start of an object being created
    this.startMarker = new Point();
    this.startMarker.stylize(DisplayStyle.TEMPORARY);
  }

  abstract mousePressed(event: MouseEvent): void;
  abstract mouseReleased(event: MouseEvent): void;

  activate(): void {
    // No code yet
  }
  deactivate(): void {
    // No code yet
  }

  /**
   * Map mouse 2D viewport/screen position to 3D coordinate on the default sphere.
   * @memberof MouseHandler
   */
  mouseMoved(event: MouseEvent): void {
    // Using currentTarget is necessary. Otherwise, all the calculations
    // will be based on SVG elements whose bounding rectangle may spill
    // outside of the responsive viewport and produces inaccurate
    // position calculations
    const target = (event.currentTarget || event.target) as HTMLElement;
    const boundingRect = target.getBoundingClientRect();
    // Don't rely on e.offsetX or e.offsetY, they may not be accurate
    const offsetX = event.clientX - boundingRect.left;
    const offsetY = event.clientY - boundingRect.top;
    const mouseX = offsetX - this.canvas.translation.x;
    const mouseY = -(offsetY - this.canvas.translation.y);

    // Get the current zoom factor and vector
    const mag = this.store.state.zoomMagnificationFactor;
    const zoomTransVec = this.store.state.zoomTranslation;

    // Transform the (mouseX, mouseY) pixel location to default screen
    // coordinates (i.e. to pre affine/css transformation)
    this.mouseVector.set(
      (mouseX - zoomTransVec[0]) / mag,
      (mouseY + zoomTransVec[1]) / mag,
      0
    );

    // Record the location in the screen plane (current and previous)
    this.previousScreenVector.copy(this.currentScreenVector);
    this.currentScreenVector.set(this.mouseVector.x, this.mouseVector.y);

    // mouseVector is the location in the default screen plane and its length
    // is the distance from the center. If this less than the default sphere radius, then
    // compute the associated coordinates, otherwise set isOnSphere to false.
    const len = this.mouseVector.length();
    const R = SETTINGS.boundaryCircle.radius;
    if (len < R) {
      // The mouse event is in the orthographic projection of the default sphere
      // determine the corresponding location on the default sphere. If the shift key is
      // pressed it is on the back side of the sphere.
      const mx = this.mouseVector.x;
      const my = this.mouseVector.y;

      const zCoordinate =
        Math.sqrt(R * R - (mx * mx + my * my)) * (event.shiftKey ? -1 : +1);
      this.previousSphereVector.copy(this.currentSphereVector);
      this.currentSphereVector.set(mx, my, zCoordinate).normalize();
      this.isOnSphere = true;

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
    } else {
      // The mouse event was not on the orthographic project of the default sphere
      this.isOnSphere = false;
      this.currentSphereVector.set(NaN, NaN, NaN);
    }
  }

  mouseLeave(event: MouseEvent): void {
    this.isOnSphere = false;
  }
}
