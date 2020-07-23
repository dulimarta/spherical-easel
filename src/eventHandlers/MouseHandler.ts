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
import { DisplayStyle } from "@/plottables/Nodule";

export default abstract class MouseHandler implements ToolStrategy {
  protected readonly X_AXIS = new Vector3(1, 0, 0);
  protected readonly Y_AXIS = new Vector3(0, 1, 0);
  protected readonly Z_AXIS = new Vector3(0, 0, 1);

  /**
   * This is canvas is the midGround layer in the twoInstance (the main Two object).
   * Used to determine the Default Screen Coordinates of the mouse event
   */
  protected readonly canvas: Two.Group;
  /**
   * Vuex global state
   */
  protected store = AppStore; //
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
  protected hitSENodules: SENodule[] = [];
  protected hitSEPoints: SEPoint[] = [];
  protected hitSELines: SELine[] = [];
  protected hitSESegments: SESegment[] = [];
  protected hitSECircles: SECircle[] = [];
  /**
   * A temporary plottable (TwoJS) point created while the user is making the circles or segments
   */
  protected startMarker: Point;
  /**
   * A temporary plottable (TwoJS) point created while the user is making the circles or segments
   */
  protected endMarker: Point;

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

  /**
   * Abstract class, whose MouseMoved event sets the current/previous sphere/screen points
   * @param layers The TwoGroup array of layer so plottable objects can be put into the correct layers for correct rendering
   */
  constructor(layers: Two.Group[]) {
    this.layers = layers;
    this.canvas = layers[LAYER.midground];
    this.currentSphereVector = new Vector3();
    this.currentScreenVector = new Two.Vector(0, 0);
    this.previousSphereVector = new Vector3();
    this.previousScreenVector = new Two.Vector(0, 0);
    this.isOnSphere = false;
    // Create and style the temporary points marking the start/end of an object being created
    this.startMarker = new Point();
    this.startMarker.stylize(DisplayStyle.TEMPORARY);
    this.endMarker = new Point();
    this.endMarker.stylize(DisplayStyle.TEMPORARY);
  }

  abstract mousePressed(event: MouseEvent): void;
  abstract mouseReleased(event: MouseEvent): void;

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
    } else {
      // The mouse event was not on the orthographic project of the default sphere
      this.isOnSphere = false;
    }
  }

  mouseLeave(event: MouseEvent): void {
    this.isOnSphere = false;
  }

  activate(): void {
    // No code required yet
  }

  deactivate(): void {
    // No code yet
  }
}
