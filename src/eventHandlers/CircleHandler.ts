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
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { DisplayStyle } from "@/plottables/Nodule";
import { ShowPointCommand } from "@/commands/ShowPointCommand";

export default class CircleHandler extends MouseHandler {
  /**
   * Center vector of the created circle
   */
  private centerVector: Vector3;
  /** Is the user dragging?*/
  private isMouseDown: boolean;
  /**  The temporary plottable TwoJS circle displayed as the user drags */
  private temporaryCircle: Circle;
  /**  The model object point that is the center of the circle (if any) */
  private centerSEPoint: SEPoint | null = null;
  /** The model object point that is a point on the circle (if any) */
  private endSEPoint: SEPoint | null = null;
  /** The radius of the temporary circle (along the surface of the sphere) */
  private arcRadius = 0;
  /** Has the temporary circle been added to the scene?*/
  private isTemporaryCircleAdded: boolean;
  /**
   * If the user starts to make a circle and mouse press at a location on the sphere (or not on the sphere), then moves
   * off the canvas, then back inside the sphere and mouse releases, we should get nothing. This
   * variable is to help with that.
   */
  private makingACircle = false;

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
    // The user is making a circle
    this.makingACircle = true;
    // First decide if the location of the event is on the sphere
    if (this.isOnSphere) {
      // Check to see if the current location is near any points
      if (this.hitPoints.length > 0) {
        // Pick the top most selected point
        const selected = this.hitPoints[0];
        // Record the center vector of the circle so it can be past to the non-temporary circle
        this.centerVector.copy(selected.vectorPosition);
        // Record the model object as the center of the circle
        this.centerSEPoint = selected;
      } else {
        // Record the center vector of the circle so it can be past to the non-temporary circle
        this.centerVector.copy(this.currentSphereVector);
        // Set the center of the circle to null so it can be created later
        this.centerSEPoint = null;
      }
      // Move the startmarker to the current mouse location
      this.startMarker.positionVector = this.currentSphereVector;
      // Set the center of the circle in the plottable object - also calls temporaryCircle.readjust()
      this.temporaryCircle.centerVector = this.currentSphereVector;
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
        // If the temporary circle (and end/startMarker) has *not* been added to the scene do so now (only once)
        if (!this.isTemporaryCircleAdded) {
          this.isTemporaryCircleAdded = true;
          this.temporaryCircle.addToLayers(this.layers);
          this.startMarker.addToLayers(this.layers);
          this.endMarker.addToLayers(this.layers);
        }
        //compute the radius of the temporary circle
        this.arcRadius = this.temporaryCircle.centerVector.angleTo(
          this.currentSphereVector
        );
        // Set the radius of the temporary circle - also calls temporaryCircle.readjust()
        this.temporaryCircle.radius = this.arcRadius;
        // Move the endmarker to the current mouse location
        this.endMarker.positionVector = this.currentSphereVector;
      }
    } else if (this.isTemporaryCircleAdded) {
      // Remove the temporary objects from the display
      this.temporaryCircle.removeFromLayers();
      this.startMarker.removeFromLayers();
      this.endMarker.removeFromLayers();
      this.isTemporaryCircleAdded = false;
    }
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent) {
    this.isMouseDown = false;
    if (this.isOnSphere) {
      // Remove the temporary objects from the scene and mark the temporary object
      //  not added to the scene
      this.temporaryCircle.removeFromLayers();
      this.startMarker.removeFromLayers();
      this.endMarker.removeFromLayers();
      this.isTemporaryCircleAdded = false;

      // Make sure the user didn't trigger the mouse leave event and is actually making a circle
      if (this.makingACircle) {
        // Before making a new circle make sure that the user has dragged a non-trivial distance
        // If the user hasn't dragged far enough merely insert a point at the start location
        if (
          this.currentSphereVector.angleTo(this.centerVector) >
          SETTINGS.circle.minimumRadius
        ) {
          this.makeCircle();
        } else {
          this.makePoint();
        }
      }

      // Clear old points to get ready for creating the next circle.
      this.centerSEPoint = null;
      this.endSEPoint = null;
      this.makingACircle = false;
    }
  }

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    if (this.isTemporaryCircleAdded) {
      this.isTemporaryCircleAdded = false;
      this.temporaryCircle.removeFromLayers();
      this.startMarker.removeFromLayers();
      this.endMarker.removeFromLayers();
    }
  }

  makeCircle(): void {
    // Add a new circle the user has moved far enough
    // Clone the current circle
    const newCircle = this.temporaryCircle.clone();
    // Set the display to the default values
    newCircle.stylize(DisplayStyle.DEFAULT);
    // Set up the glowing display
    newCircle.stylize(DisplayStyle.GLOWING);

    // Create a command group to add the points defining the circle and the circle to the store
    // This way a single undo click will undo all (potentially three) operations.
    const circleGroup = new CommandGroup();
    if (this.centerSEPoint === null) {
      // Starting point landed on an open space
      // we have to create a new point and it to the group/store
      const newCenterPoint = new Point();
      // Set the display to the default values
      newCenterPoint.stylize(DisplayStyle.DEFAULT);
      // Set up the glowing display
      newCenterPoint.stylize(DisplayStyle.GLOWING);
      const vtx = new SEPoint(newCenterPoint);
      vtx.vectorPosition = this.centerVector;
      this.centerSEPoint = vtx;
      circleGroup.addCommand(new AddPointCommand(vtx));
    } else if (this.centerSEPoint instanceof SEIntersectionPoint) {
      circleGroup.addCommand(new ShowPointCommand(this.centerSEPoint));
    }
    if (this.hitPoints.length > 0) {
      this.endSEPoint = this.hitPoints[0];
      if (this.endSEPoint instanceof SEIntersectionPoint) {
        circleGroup.addCommand(new ShowPointCommand(this.endSEPoint));
      }
    } else {
      // endPoint landed on an open space
      // we have to create a new point and add it to the group/store
      const newEndPoint = new Point();
      // Set the display to the default values
      newEndPoint.stylize(DisplayStyle.DEFAULT);
      // Set up the glowing display
      newEndPoint.stylize(DisplayStyle.GLOWING);
      const vtx = new SEPoint(newEndPoint);
      vtx.vectorPosition = this.currentSphereVector;
      this.endSEPoint = vtx;
      circleGroup.addCommand(new AddPointCommand(vtx));
    }

    // Add the last command to the group and then execute it (i.e. add the potentially two points and the circle to the store.)
    const newSECircle = new SECircle(
      newCircle,
      this.centerSEPoint,
      this.endSEPoint
    );

    circleGroup.addCommand(new AddCircleCommand(newSECircle));
    // Generate new intersection points. These points must be computed and created
    // in the store. Add the new created points to the circle command so they can be undone.
    this.store.getters
      .determineIntersectionsWithCircle(newSECircle)
      .forEach((p: SEIntersectionPoint) => {
        p.setShowing(false);
        circleGroup.addCommand(new AddPointCommand(p));
      });

    circleGroup.execute();
  }

  makePoint(): void {
    // The user is attempting to make a circle smaller than the minimum radius so
    // create  a point at the location of the start vector
    if (this.centerSEPoint === null) {
      // Starting point landed on an open space
      // we have to create a new point and it to the group/store
      const newPoint = new Point();
      // Set the display to the default values
      newPoint.stylize(DisplayStyle.DEFAULT);
      // Set the glowing display
      newPoint.stylize(DisplayStyle.GLOWING);

      const vtx = new SEPoint(newPoint);
      vtx.vectorPosition = this.centerVector;
      this.centerSEPoint = vtx;
      const addPoint = new AddPointCommand(vtx);
      addPoint.execute();
    }
  }
}
