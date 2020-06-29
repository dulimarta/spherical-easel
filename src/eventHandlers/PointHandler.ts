import MouseHandler from "./MouseHandler";
import Two from "two.js";
import { Vector3, Matrix4 } from "three";
import SETTINGS, { LAYER } from "@/global-settings";
import { SEPoint } from "@/models/SEPoint";
import Point from "@/plottables/Point";
import { AddPointCommand } from "@/commands/AddPointCommand";
import { DisplayStyle } from "@/plottables/Nodule";

const frontPointRadius = SETTINGS.point.temp.radius.front;
const backPointRadius = SETTINGS.point.temp.radius.back;

export default class PointHandler extends MouseHandler {
  // Center vector of the created point
  private vectorLocation: Vector3;

  // The temporary circle displayed as the user drags
  private temporaryPoint: Point;
  private isTemporaryPointAdded = false;

  constructor(layers: Two.Group[], transformMatrix: Matrix4) {
    super(layers, transformMatrix);
    this.vectorLocation = new Vector3(0, 0, 1);
    this.temporaryPoint = new Point();
    this.temporaryPoint.positionVector = this.vectorLocation;
    // Set the style using the temporary defaults
    this.temporaryPoint.stylize(DisplayStyle.TEMPORARY);
  }

  mousePressed(event: MouseEvent): void {
    if (this.isOnSphere) {
      // If this is near any other points do not create a new point
      if (this.hitPoints.length > 0) {
        return;
      }
      const newPoint = new Point();
      // Set the display to the default values
      newPoint.stylize(DisplayStyle.DEFAULT);
      // Set the glowing display
      newPoint.stylize(DisplayStyle.GLOWING);
      // Create the model object for the new point and link them
      const vtx = new SEPoint(newPoint);
      vtx.positionOnSphere = this.currentSpherePoint;
      // Create and execute the command to create a new point
      new AddPointCommand(vtx).execute();
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Highlight all nearby objects and update location points
    super.mouseMoved(event);
    if (this.isOnSphere) {
      if (!this.isTemporaryPointAdded) {
        this.isTemporaryPointAdded = true;
        // Add the temporary point to the midground
        this.canvas.add(this.temporaryPoint);
      }
      // Move the temporary point to the location of the mouse event
      this.temporaryPoint.translation = this.currentScreenPoint;
      // Set the display of the temporary point so the correct front/back TwoJS object is shown
      //this.temporaryPoint.normalDisplay();
    } else if (this.isTemporaryPointAdded) {
      //if not on the sphere and the temporary segment has been added remove the temporary objects
      this.temporaryPoint.remove();
      this.isTemporaryPointAdded = false;
    }
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {
    /* None */
  }

  // eslint-disable-next-line
  mouseLeave(event: MouseEvent): void {
    throw new Error("Method not implemented.");
  }
  activate(): void {
    super.activate();
    // Add the the temporary point to the canvas
    this.canvas.add(this.temporaryPoint);
    // Set the display of the temporary point so the correct front/back TwoJS object is shown
    this.temporaryPoint.normalDisplay();
  }
  deactivate(): void {
    super.deactivate();
    this.temporaryPoint.remove();
  }
}
