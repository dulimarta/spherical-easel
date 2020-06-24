/** @format */

import { Vector3, Matrix4 } from "three";
import SelectionHandler from "./SelectionHandler";
import Point from "@/plottables/Point";
import Circle from "@/plottables/Circle";
import { CommandGroup } from "@/commands/CommandGroup";
import { AddPointCommand } from "@/commands/AddPointCommand";
import { AddCircleCommand } from "@/commands/AddCircleCommand";
import Two from "two.js";
import { SEPoint } from "@/models/SEPoint";
import { SECircle } from "@/models/SECircle";
import SETTINGS from "@/global-settings";

export default class CircleHandler extends SelectionHandler {
  // Center vector of the created circle
  private centerV3Vector: Vector3;
  // Is the user dragging
  private isMouseDown: boolean;
  // Has the temporary circle been added to the scene?
  private isCircleAdded: boolean;
  // The temporary circle displayed as the user drags
  private temporaryCircle: Circle;
  // The model object point that is the center of the circle (if any)
  private centerPoint: SEPoint | null = null;
  // The model object point that is a point on the circle (if any)
  private endPoint: SEPoint | null = null;
  // The radius of the temporary circle (along the surface of the sphere)
  private arcRadius = 0;

  constructor(layers: Two.Group[], transformMatrix: Matrix4) {
    super(layers, transformMatrix);
    this.centerV3Vector = new Vector3();
    this.isMouseDown = false;
    this.isCircleAdded = false;
    this.temporaryCircle = new Circle();
    // Set the style using the temporary defaults
    this.temporaryCircle.stylize("temporary");
  }
  // eslint-disable-next-line
  mousePressed(event: MouseEvent) {
    this.isMouseDown = true;
    // First decide if the location of the event is on the sphere
    if (this.isOnSphere) {
      // Check to see if the current location is near any points
      if (this.hitPoints.length > 0) {
        // Pick the top most selected point
        const selected = this.hitPoints[0];
        // Record the center vector of the circle so it can be past to the non-temporary circle
        this.centerV3Vector.copy(selected.positionOnSphere);
        // Record the model object as the center of the circle
        this.centerPoint = selected;
      } else {
        // Add a temporary marker for the location of the center
        this.canvas.add(this.startMarker);
        // Record the center vector of the circle so it can be past to the non-temporary circle
        this.centerV3Vector.copy(this.currentSpherePoint);
        // Set the center of the circle to null so it can be created later
        this.centerPoint = null;
      }
      // Move the startmarker to the correct location
      this.startMarker.translation.copy(this.currentScreenPoint);
      // Set the center of the circle in the plottable object - also calls temporaryCircle.readjust()
      this.temporaryCircle.centerVector = this.currentSpherePoint;
    }
  }

  // eslint-disable-next-line
  mouseMoved(event: MouseEvent) {
    // Highlight all nearby objects
    super.mouseMoved(event);
    // Make sure that the event is on the sphere
    if (this.isOnSphere) {
      // Make sure the user is still dragging
      if (this.isMouseDown) {
        // If the temporary circle (and startMarker) has *not* been added to the scene do so now (only once)
        if (!this.isCircleAdded) {
          this.isCircleAdded = true;
          this.canvas.add(this.temporaryCircle);
          this.canvas.add(this.startMarker);
        }
        //compute the radius of the temporary circle
        this.arcRadius = this.temporaryCircle.centerVector.angleTo(
          this.currentSpherePoint
        );
        // Set the radius of the temporary circle - also calls temporaryCircle.readjust()
        this.temporaryCircle.radius = this.arcRadius;
      }
    } else if (this.isCircleAdded) {
      // this.temporaryCircle.remove(); // remove from its parent
      this.startMarker.remove();
      this.isCircleAdded = false;
    }
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent) {
    this.isMouseDown = false;
    if (this.isOnSphere) {
      // Record the second point of the geodesic circle
      this.temporaryCircle.remove();
      this.canvas.remove(this.startMarker);
      this.isCircleAdded = false;
      // this.endV3Point.copy(this.currentPoint);
      const newCircle = this.temporaryCircle.clone();
      newCircle.stylize("default");

      // TODO: Use EventBus.fire()???
      const circleGroup = new CommandGroup();
      if (this.centerPoint === null) {
        // Starting point landed on an open space
        // we have to create a new point
        const vtx = new SEPoint(new Point());
        vtx.positionOnSphere = this.centerV3Vector;
        this.centerPoint = vtx;
        circleGroup.addCommand(new AddPointCommand(vtx));
      }
      if (this.hitPoints.length > 0) {
        this.endPoint = this.hitPoints[0];
      } else {
        // endV3Point landed on an open space
        // we have to create a new point
        const vtx = new SEPoint(new Point());
        vtx.positionOnSphere = this.currentSpherePoint;
        this.endPoint = vtx;
        circleGroup.addCommand(new AddPointCommand(vtx));
      }

      circleGroup
        .addCommand(
          new AddCircleCommand({
            circle: new SECircle(newCircle, this.centerPoint, this.endPoint),
            centerPoint: this.centerPoint,
            circlePoint: this.endPoint
          })
        )
        .execute();
      this.centerPoint = null;
      this.endPoint = null;
    }
  }

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    if (this.isCircleAdded) {
      this.isCircleAdded = false;
      this.temporaryCircle.remove();
      this.startMarker.remove();
    }
  }
}
