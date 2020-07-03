/** @format */

import { Vector3, Matrix4 } from "three";
import MouseHandler from "./MouseHandler";
import Point from "@/plottables/Point";
import Circle from "@/plottables/Circle";
import { CommandGroup } from "@/commands/CommandGroup";
import { AddPointCommand } from "@/commands/AddPointCommand";
import { AddCircleCommand } from "@/commands/AddCircleCommand";
import Two from "two.js";
import { SEPoint } from "@/models/SEPoint";
import { SECircle } from "@/models/SECircle";
import SETTINGS from "@/global-settings";
import { SEIntersection } from "@/models/SEIntersection";
import { DisplayStyle } from "@/plottables/Nodule";
import { ShowPointCommand } from "@/commands/ShowPointCommand";

export default class CircleHandler extends MouseHandler {
  // Center vector of the created circle
  private centerVector: Vector3;
  // Is the user dragging?
  private isMouseDown: boolean;
  // The temporary circle displayed as the user drags
  private temporaryCircle: Circle;
  // The model object point that is the center of the circle (if any)
  private centerPoint: SEPoint | null = null;
  // The model object point that is a point on the circle (if any)
  private endPoint: SEPoint | null = null;
  // The radius of the temporary circle (along the surface of the sphere)
  private arcRadius = 0;
  // Has the temporary circle been added to the scene?
  private isTemporaryCircleAdded: boolean;

  constructor(layers: Two.Group[]) {
    super(layers);
    this.centerVector = new Vector3();
    this.isMouseDown = false;
    this.isTemporaryCircleAdded = false;
    this.temporaryCircle = new Circle();
    // Set the style using the temporary defaults
    this.temporaryCircle.stylize(DisplayStyle.TEMPORARY);
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
        this.centerVector.copy(selected.positionOnSphere);
        // Record the model object as the center of the circle
        this.centerPoint = selected;
      } else {
        // Add a temporary marker for the location of the center
        this.canvas.add(this.startMarker);
        // Record the center vector of the circle so it can be past to the non-temporary circle
        this.centerVector.copy(this.currentSpherePoint);
        // Set the center of the circle to null so it can be created later
        this.centerPoint = null;
      }
      // Move the startmarker to the current mouse location
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
        if (!this.isTemporaryCircleAdded) {
          this.isTemporaryCircleAdded = true;
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
    } else if (this.isTemporaryCircleAdded) {
      this.temporaryCircle.remove(); // remove from its parent
      this.startMarker.remove();
      this.isTemporaryCircleAdded = false;
    }
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent) {
    this.isMouseDown = false;
    if (this.isOnSphere) {
      // Remove the temporary objects from the scene and mark the temporary object added to the scene
      this.temporaryCircle.remove();
      this.canvas.remove(this.startMarker);
      this.isTemporaryCircleAdded = false;
      // Before making a new circle make sure that the user has dragged a non-trivial distance
      // If the user hasn't dragged far enough merely insert a point at the start location
      if (
        this.currentSpherePoint.angleTo(this.centerVector) >
        SETTINGS.circle.minimumRadius
      ) {
        // Add a new circle the user has moved far enough
        // Clone the current circle
        const newCircle = this.temporaryCircle.clone();
        // Set the display to the default values
        newCircle.stylize(DisplayStyle.DEFAULT);
        // Set the glowing display
        newCircle.stylize(DisplayStyle.GLOWING);

        // TODO: Use EventBus.fire()???

        // Create a command group to add the points defining the circle and the circle to the store
        // This way a single undo click will undo all (potentially three) operations.
        const circleGroup = new CommandGroup();
        if (this.centerPoint === null) {
          // Starting point landed on an open space
          // we have to create a new point and it to the group/store
          const newCenterPoint = new Point();
          // Set the display to the default values
          newCenterPoint.stylize(DisplayStyle.DEFAULT);
          // Set the glowing display
          newCenterPoint.stylize(DisplayStyle.GLOWING);
          const vtx = new SEPoint(newCenterPoint);
          vtx.positionOnSphere = this.centerVector;
          this.centerPoint = vtx;
          circleGroup.addCommand(new AddPointCommand(vtx));
        } else if (this.centerPoint instanceof SEIntersection) {
          circleGroup.addCommand(new ShowPointCommand(this.centerPoint));
        }
        if (this.hitPoints.length > 0) {
          this.endPoint = this.hitPoints[0];
          if (this.endPoint instanceof SEIntersection) {
            circleGroup.addCommand(new ShowPointCommand(this.endPoint));
          }
        } else {
          // endPoint landed on an open space
          // we have to create a new point and add it to the group/store
          const newEndPoint = new Point();
          // Set the display to the default values
          newEndPoint.stylize(DisplayStyle.DEFAULT);
          // Set the glowing display
          newEndPoint.stylize(DisplayStyle.GLOWING);
          const vtx = new SEPoint(newEndPoint);
          vtx.positionOnSphere = this.currentSpherePoint;
          this.endPoint = vtx;
          circleGroup.addCommand(new AddPointCommand(vtx));
        }

        // Add the last command to the group and then execute it (i.e. add the potentially two points and the circle to the store.)
        const newSECircle = new SECircle(
          newCircle,
          this.centerPoint,
          this.endPoint
        );
        // Generate new intersection points
        circleGroup.addCommand(new AddCircleCommand(newSECircle));
        // these points must be
        this.store.getters
          .determineIntersectionsWithCircle(newSECircle)
          .forEach((p: SEIntersection) => {
            p.setShowing(false);
            circleGroup.addCommand(new AddPointCommand(p));
          });

        circleGroup.execute();
      } else {
        // The user is attempting to make a circle smaller than the minimum radius so
        // create  a point at the location of the start vector
        if (this.centerPoint === null) {
          // Starting point landed on an open space
          // we have to create a new point and it to the group/store
          const vtx = new SEPoint(new Point());
          vtx.positionOnSphere = this.centerVector;
          this.centerPoint = vtx;
          const addPoint = new AddPointCommand(vtx);
          addPoint.execute();
        }
      }
      // Clear old points to get ready for creating the next circle.
      this.centerPoint = null;
      this.endPoint = null;
    }
  }

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    if (this.isTemporaryCircleAdded) {
      this.isTemporaryCircleAdded = false;
      this.temporaryCircle.remove();
      this.startMarker.remove();
    }
  }
}
