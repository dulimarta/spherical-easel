/** @format */

import { Vector3 } from "three";
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
import Highlighter from "./Highlighter";
import { ConvertInterPtToUserCreatedCommand } from "@/commands/ConvertInterPtToUserCreatedCommand";
import { SEPointOnOneDimensional } from "@/models/SEPointOnOneDimensional";
import { AddIntersectionPointCommand } from "@/commands/AddIntersectionPointCommand";
import { AddPointOnOneDimensionalCommand } from "@/commands/AddPointOnOneDimensionalCommand";
import { SEOneDimensional, SEIntersectionReturnType } from "@/types";

export default class CircleHandler extends Highlighter {
  /**
   * Center vector of the created circle
   */
  private centerVector: Vector3;
  /** Is the user dragging?*/
  private isDragging: boolean;
  /**  The temporary plottable TwoJS circle displayed as the user drags */
  private temporaryCircle: Circle;
  /**  The model object point that is the center of the circle (if any) */
  private centerSEPoint: SEPoint | null = null;
  /** The model object point that is a point on the circle (if any) */
  private circleSEPoint: SEPoint | null = null;
  /** The possible partent of the centerSEPoint*/
  private centerSEPointOneDimensionalParent: SEOneDimensional | null = null;

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
    this.isDragging = false;
    this.isTemporaryCircleAdded = false;
    this.temporaryCircle = new Circle();
    // Set the style using the temporary defaults
    this.temporaryCircle.stylize(DisplayStyle.TEMPORARY);
  }

  mousePressed(event: MouseEvent): void {
    // Do the mouse moved event of the Highlighter so that a new hitSEPoints array will be generated
    // otherwise if the user has finished making an new point, then *without* triggering a mouse move
    // event, mouse press will *not* select the newly created point. This is not what we want so we call super.mouseMove
    super.mouseMoved(event);
    // First decide if the location of the event is on the sphere
    if (this.isOnSphere) {
      this.isDragging = true;
      // The user is making a circle
      this.makingACircle = true;
      // Check to see if the current location is near any points
      if (this.hitSEPoints.length > 0) {
        // Pick the top most selected point
        const selected = this.hitSEPoints[0];
        // Record the center vector of the circle so it can be past to the non-temporary circle
        this.centerVector.copy(selected.locationVector);
        // Record the model object as the center of the circle
        this.centerSEPoint = selected;
        // Move the startMarker to the current selected point
        this.startMarker.positionVector = selected.locationVector;
        // Set the center of the circle in the plottable object - also calls temporaryCircle.readjust()
        this.temporaryCircle.centerVector = selected.locationVector;
      } else if (this.hitSESegments.length > 0) {
        // The center of the circle will be a point on a segment
        //  Eventually, we will create a new SEPointOneDimensional and Point
        this.centerSEPointOneDimensionalParent = this.hitSESegments[0];
        this.centerVector.copy(
          this.centerSEPointOneDimensionalParent.closestVector(
            this.currentSphereVector
          )
        );
        this.temporaryCircle.centerVector = this.centerVector;
        this.startMarker.positionVector = this.centerVector;
        this.centerSEPoint = null;
      } else if (this.hitSELines.length > 0) {
        // The center of the circle will be a point on a line
        //  Eventually, we will create a new SEPointOneDimensional and Point
        this.centerSEPointOneDimensionalParent = this.hitSELines[0];
        this.centerVector.copy(
          this.centerSEPointOneDimensionalParent.closestVector(
            this.currentSphereVector
          )
        );
        this.temporaryCircle.centerVector = this.centerVector;
        this.startMarker.positionVector = this.centerVector;
        this.centerSEPoint = null;
      } else if (this.hitSECircles.length > 0) {
        // The center of the circle will be a point on a circle
        //  Eventually, we will create a new SEPointOneDimensional and Point
        this.centerSEPointOneDimensionalParent = this.hitSECircles[0];
        this.centerVector.copy(
          this.centerSEPointOneDimensionalParent.closestVector(
            this.currentSphereVector
          )
        );
        this.temporaryCircle.centerVector = this.centerVector;
        this.startMarker.positionVector = this.centerVector;
        this.centerSEPoint = null;
      } else {
        // The mouse press is not near an existing point or one dimensional object.
        //  Eventually, we will create a new SEPoint and Point
        // Set the center of the circle in the plottable object - also calls temporaryCircle.readjust()
        this.temporaryCircle.centerVector = this.currentSphereVector;
        // Move the startMarker to the current mouse location
        this.startMarker.positionVector = this.currentSphereVector;
        // Record the center vector of the circle so it can be past to the non-temporary circle
        this.centerVector.copy(this.currentSphereVector);
        // Set the center of the circle to null so it can be created later
        this.centerSEPoint = null;
      }
      this.endMarker.positionVector = this.currentSphereVector;
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Highlight all nearby objects
    super.mouseMoved(event);
    // Make sure that the event is on the sphere
    if (this.isOnSphere) {
      // Make sure the user is still dragging
      if (this.isDragging) {
        // If the temporary circle (and end/startMarker) has *not* been added to the scene do so now (only once)
        if (!this.isTemporaryCircleAdded) {
          this.isTemporaryCircleAdded = true;
          this.temporaryCircle.addToLayers(this.layers);
          // Only add the start marker if the start point is going to be new or is non-user created intersection point
          if (
            this.centerSEPoint == null ||
            (this.centerSEPoint instanceof SEIntersectionPoint &&
              !this.centerSEPoint.isUserCreated)
          ) {
            this.startMarker.addToLayers(this.layers);
          }
          this.endMarker.addToLayers(this.layers);
        }
        //compute the radius of the temporary circle
        this.arcRadius = this.temporaryCircle.centerVector.angleTo(
          this.currentSphereVector
        );
        // Set the radius of the temporary circle, the center was set in Mouse Press
        this.temporaryCircle.circleRadius = this.arcRadius;
        //update the display
        this.temporaryCircle.updateDisplay();

        // Move the endMarker to the current mouse location
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

  mouseReleased(event: MouseEvent): void {
    this.isDragging = false;
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
      this.circleSEPoint = null;
      this.centerSEPointOneDimensionalParent = null;
      this.makingACircle = false;
    }
  }

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    this.isDragging = false;
    if (this.isTemporaryCircleAdded) {
      this.isTemporaryCircleAdded = false;
      this.temporaryCircle.removeFromLayers();
      this.startMarker.removeFromLayers();
      this.endMarker.removeFromLayers();
    }

    // Clear old points and values to get ready for creating the next segment.
    this.circleSEPoint = null;
    this.centerSEPoint = null;
    this.centerSEPointOneDimensionalParent = null;
    this.makingACircle = false;
  }
  /**
   * Add a new circle the user has moved far enough
   */
  makeCircle(): void {
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
      let vtx: SEPoint | SEPointOnOneDimensional | null = null;
      if (this.centerSEPointOneDimensionalParent) {
        // Starting mouse press landed near a oneDimensional
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneDimensional(
          newCenterPoint,
          this.centerSEPointOneDimensionalParent
        );
        circleGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx,
            this.centerSEPointOneDimensionalParent
          )
        );
      } else {
        // Starting mouse press landed on an open space
        // Create the model object for the new point and link them
        vtx = new SEPoint(newCenterPoint);
        circleGroup.addCommand(new AddPointCommand(vtx));
      }
      vtx.locationVector = this.centerVector;
      this.centerSEPoint = vtx;
    } else if (
      this.centerSEPoint instanceof SEIntersectionPoint &&
      !this.centerSEPoint.isUserCreated
    ) {
      // Mark the intersection point as created, the display style is changed and the glowing style is set up
      circleGroup.addCommand(
        new ConvertInterPtToUserCreatedCommand(this.centerSEPoint)
      );
    }

    // Check to see if the release location is near any points
    if (this.hitSEPoints.length > 0) {
      this.circleSEPoint = this.hitSEPoints[0];
      //compute the radius of the temporary circle using the hit point
      this.arcRadius = this.temporaryCircle.centerVector.angleTo(
        this.circleSEPoint.locationVector
      );
      // Set the radius of the temporary circle, the center was set in Mouse Press
      this.temporaryCircle.circleRadius = this.arcRadius;
      //update the display
      this.temporaryCircle.updateDisplay();
      if (
        this.circleSEPoint instanceof SEIntersectionPoint &&
        !this.circleSEPoint.isUserCreated
      ) {
        // Mark the intersection point as created, the display style is changed and the glowing style is set up
        circleGroup.addCommand(
          new ConvertInterPtToUserCreatedCommand(this.circleSEPoint)
        );
      }
    } else {
      // We have to create a new Point for the end
      const newCirclePoint = new Point();
      // Set the display to the default values
      newCirclePoint.stylize(DisplayStyle.DEFAULT);
      // Set up the glowing display
      newCirclePoint.stylize(DisplayStyle.GLOWING);
      let vtx: SEPoint | SEPointOnOneDimensional | null = null;
      if (this.hitSESegments.length > 0) {
        // The end of the line will be a point on a segment
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneDimensional(
          newCirclePoint,
          this.hitSESegments[0]
        );
        // Set the Location
        vtx.locationVector = this.hitSESegments[0].closestVector(
          this.currentSphereVector
        );
        circleGroup.addCommand(
          new AddPointOnOneDimensionalCommand(vtx, this.hitSESegments[0])
        );
      } else if (this.hitSELines.length > 0) {
        // The end of the line will be a point on a line
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneDimensional(newCirclePoint, this.hitSELines[0]);
        // Set the Location
        vtx.locationVector = this.hitSELines[0].closestVector(
          this.currentSphereVector
        );
        circleGroup.addCommand(
          new AddPointOnOneDimensionalCommand(vtx, this.hitSELines[0])
        );
      } else if (this.hitSECircles.length > 0) {
        // The end of the line will be a point on a circle
        vtx = new SEPointOnOneDimensional(newCirclePoint, this.hitSECircles[0]);
        // Set the Location
        vtx.locationVector = this.hitSECircles[0].closestVector(
          this.currentSphereVector
        );
        circleGroup.addCommand(
          new AddPointOnOneDimensionalCommand(vtx, this.hitSECircles[0])
        );
      } else {
        // The ending mouse release landed on an open space
        vtx = new SEPoint(newCirclePoint);
        // Set the Location
        vtx.locationVector = this.currentSphereVector;
        circleGroup.addCommand(new AddPointCommand(vtx));
      }
      this.circleSEPoint = vtx;
    }

    // Clone the current circle after the circlePoint is set
    const newCircle = this.temporaryCircle.clone();
    // Set the display to the default values
    newCircle.stylize(DisplayStyle.DEFAULT);
    // Set up the glowing display
    newCircle.stylize(DisplayStyle.GLOWING);

    // Add the last command to the group and then execute it (i.e. add the potentially two points and the circle to the store.)
    const newSECircle = new SECircle(
      newCircle,
      this.centerSEPoint,
      this.circleSEPoint
    );

    circleGroup.addCommand(
      new AddCircleCommand(newSECircle, this.centerSEPoint, this.circleSEPoint)
    );
    // Generate new intersection points. These points must be computed and created
    // in the store. Add the new created points to the circle command so they can be undone.
    this.store.getters
      .createAllIntersectionsWithCircle(newSECircle)
      .forEach((item: SEIntersectionReturnType) => {
        circleGroup.addCommand(
          new AddIntersectionPointCommand(
            item.SEIntersectionPoint,
            item.parent1,
            item.parent2
          )
        );
        item.SEIntersectionPoint.showing = false; // don not display the automatically created intersection points
      });

    circleGroup.execute();
  }

  makePoint(): void {
    // The user is attempting to make a circle smaller than the minimum radius so
    // create  a point at the location of the start vector
    // The user is attempting to make a segment smaller than the minimum arc length so
    // create  a point at the location of the start vector
    if (this.centerSEPoint === null) {
      // we have to create a new SEPointOnOneDimensional or SEPoint and Point
      const newPoint = new Point();
      // Set the display to the default values
      newPoint.stylize(DisplayStyle.DEFAULT);
      // Set up the glowing display
      newPoint.stylize(DisplayStyle.GLOWING);
      let vtx: SEPoint | SEPointOnOneDimensional | null = null;
      if (this.centerSEPointOneDimensionalParent) {
        // Starting mouse press landed near a oneDimensional
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneDimensional(
          newPoint,
          this.centerSEPointOneDimensionalParent
        );
        new AddPointOnOneDimensionalCommand(
          vtx,
          this.centerSEPointOneDimensionalParent
        ).execute();
      } else {
        // Starting mouse press landed on an open space
        // we have to create a new point and it to the group/store
        // Create and execute the command to create a new point for undo/redo
        vtx = new SEPoint(newPoint);
        new AddPointCommand(vtx).execute();
      }
      vtx.locationVector = this.centerVector;
    } else if (
      this.centerSEPoint instanceof SEIntersectionPoint &&
      !this.centerSEPoint.isUserCreated
    ) {
      // Mark the intersection point as created, the display style is changed and the glowing style is set up
      new ConvertInterPtToUserCreatedCommand(this.centerSEPoint).execute();
    }
  }
}
