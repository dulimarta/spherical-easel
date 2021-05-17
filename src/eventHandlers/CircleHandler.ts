/** @format */

import { Vector3, Matrix4 } from "three";
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
import { UpdateMode } from "@/types";
import Label from "@/plottables/Label";
import { SELabel } from "@/models/SELabel";
import { SENodule } from "@/models/SENodule";

const tmpVector = new Vector3();

export default class CircleHandler extends Highlighter {
  /**
   * Center vector of the created circle
   */
  private centerVector: Vector3;
  /**  The temporary plottable TwoJS circle displayed as the user moves the mouse or drags */
  private temporaryCircle: Circle;
  /**  The model object point that is the center of the circle (if any) */
  private centerSEPoint: SEPoint | null = null;
  /** The model object point that is a point on the circle (if any) */
  private circleSEPoint: SEPoint | null = null;
  /** The possible parent of the centerSEPoint*/
  private centerSEPointOneDimensionalParent: SEOneDimensional | null = null;

  /** The radius of the temporary circle (along the surface of the sphere) */
  private arcRadius = 0;
  /**
   * A temporary plottable (TwoJS) point created while the user is making the circles or segments
   */
  protected startMarker: Point;
  /**
   * A temporary plottable (TwoJS) point created while the user is making the circles or segments
   */
  protected endMarker: Point;

  /* temporary vector and matrix to help with computations */
  private tmpVector = new Vector3();
  private tmpMatrix = new Matrix4();

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
    this.isTemporaryCircleAdded = false;
    this.temporaryCircle = new Circle();
    // Set the style using the temporary defaults
    this.temporaryCircle.stylize(DisplayStyle.ApplyTemporaryVariables);
    this.store.commit.addTemporaryNodule(this.temporaryCircle);
    // Create and style the temporary points marking the start/end of an object being created
    this.startMarker = new Point();
    this.startMarker.stylize(DisplayStyle.ApplyTemporaryVariables);
    this.store.commit.addTemporaryNodule(this.startMarker);
    this.endMarker = new Point();
    this.endMarker.stylize(DisplayStyle.ApplyTemporaryVariables);
    this.store.commit.addTemporaryNodule(this.endMarker);
  }

  mousePressed(event: MouseEvent): void {
    // Do the mouse moved event of the Highlighter so that a new hitSEPoints array will be generated
    // otherwise if the user has finished making an new point, then *without* triggering a mouse move
    // event, mouse press will *not* select the newly created point. This is not what we want so we call super.mouseMove
    //super.mouseMoved(event);
    // First decide if the location of the event is on the sphere
    if (this.isOnSphere && !this.makingACircle) {
      //this.isDragging = true;
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
        // Glow the selected point and select it so the highlighter.ts doesn't unglow it with the mouseMoved method
        this.centerSEPoint.glowing = true;
        this.centerSEPoint.selected = true;
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
    // Find all the nearby (hitSE... objects) and update location vectors
    super.mouseMoved(event);
    // Only one point can be processed at a time, so set the first point nearby to glowing
    // The user can create points (with the antipode) on circles, segments, and lines, so
    // highlight those as well (but only one) if they are nearby also
    if (this.hitSEPoints.length > 0) {
      this.hitSEPoints[0].glowing = true;
    } else if (this.hitSESegments.length > 0) {
      this.hitSESegments[0].glowing = true;
    } else if (this.hitSELines.length > 0) {
      this.hitSELines[0].glowing = true;
    } else if (this.hitSECircles.length > 0) {
      this.hitSECircles[0].glowing = true;
    }

    // Make sure that the event is on the sphere and the user is making a circle.
    if (this.isOnSphere && this.makingACircle) {
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
      //}
    } else if (this.isTemporaryCircleAdded) {
      // Remove the temporary objects from the display.
      this.temporaryCircle.removeFromLayers();
      this.startMarker.removeFromLayers();
      this.endMarker.removeFromLayers();
      this.isTemporaryCircleAdded = false;
    }
  }

  mouseReleased(event: MouseEvent): void {
    if (this.isOnSphere) {
      // Make sure the user didn't trigger the mouse leave event and is actually making a circle
      if (this.makingACircle) {
        // If the user hasn't moved the mouse far enough or is trying to make a circle of radius Pi,
        //  don't add a circle
        const radius = this.currentSphereVector.angleTo(this.centerVector);
        if (
          radius > SETTINGS.circle.minimumRadius &&
          radius < Math.PI - SETTINGS.circle.minimumRadius
        ) {
          this.makeCircle();
          // Clear old points to get ready for creating the next circle.
          if (this.centerSEPoint) {
            this.centerSEPoint.glowing = false;
            this.centerSEPoint.selected = false;
          }
          this.centerSEPoint = null;
          this.circleSEPoint = null;
          this.centerSEPointOneDimensionalParent = null;
          this.makingACircle = false;
          // Remove the temporary objects from the scene and mark the temporary object
          //  not added to the scene
          this.temporaryCircle.removeFromLayers();
          this.startMarker.removeFromLayers();
          this.endMarker.removeFromLayers();
          this.isTemporaryCircleAdded = false;
          // call an unglow all command
          Highlighter.store.commit.unglowAllSENodules();
        }
      } else {
        // Remove the temporary objects from the scene and mark the temporary object
        //  not added to the scene
        this.temporaryCircle.removeFromLayers();
        this.startMarker.removeFromLayers();
        this.endMarker.removeFromLayers();
        this.isTemporaryCircleAdded = false;
      }
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

    // Clear old points and values to get ready for creating the next circle.
    if (this.centerSEPoint) {
      this.centerSEPoint.glowing = false;
      this.centerSEPoint.selected = false;
    }
    this.circleSEPoint = null;
    this.centerSEPoint = null;
    this.centerSEPointOneDimensionalParent = null;
    this.makingACircle = false;
  }
  /**
   * Add a new circle the user has moved the mouse far enough (but not a radius of PI)
   */
  makeCircle(): void {
    // Create a command group to add the points defining the circle and the circle to the store
    // This way a single undo click will undo all (potentially three) operations.
    const circleCommandGroup = new CommandGroup();
    if (this.centerSEPoint === null) {
      // Starting point landed on an open space
      // we have to create a new point and it to the group/store
      const newCenterPoint = new Point();
      // Set the display to the default values
      newCenterPoint.stylize(DisplayStyle.ApplyCurrentVariables);
      // Adjust the size of the point to the current zoom magnification factor
      newCenterPoint.adjustSize();

      // Create the plottable label
      const newLabel = new Label();
      let newSELabel: SELabel | null = null;

      let vtx: SEPoint | SEPointOnOneDimensional | null = null;
      if (this.centerSEPointOneDimensionalParent) {
        // Starting mouse press landed near a oneDimensional
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneDimensional(
          newCenterPoint,
          this.centerSEPointOneDimensionalParent
        );

        newSELabel = new SELabel(newLabel, vtx);

        circleCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx,
            this.centerSEPointOneDimensionalParent,
            newSELabel
          )
        );
      } else {
        // Starting mouse press landed on an open space
        // Create the model object for the new point and link them
        vtx = new SEPoint(newCenterPoint);
        newSELabel = new SELabel(newLabel, vtx);
        circleCommandGroup.addCommand(new AddPointCommand(vtx, newSELabel));
      }
      vtx.locationVector = this.centerVector;
      // Set the initial label location
      this.tmpVector
        .copy(vtx.locationVector)
        .add(
          new Vector3(
            2 * SETTINGS.point.initialLabelOffset,
            SETTINGS.point.initialLabelOffset,
            0
          )
        )
        .normalize();
      newSELabel.locationVector = this.tmpVector;
      this.centerSEPoint = vtx;
    } else if (
      this.centerSEPoint instanceof SEIntersectionPoint &&
      !this.centerSEPoint.isUserCreated
    ) {
      // Mark the intersection point as created, the display style is changed and the glowing style is set up
      circleCommandGroup.addCommand(
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
        circleCommandGroup.addCommand(
          new ConvertInterPtToUserCreatedCommand(this.circleSEPoint)
        );
      }
    } else {
      // We have to create a new Point for the end
      const newCirclePoint = new Point();
      // Set the display to the default values
      newCirclePoint.stylize(DisplayStyle.ApplyCurrentVariables);
      // Adjust the size of the point to the current zoom magnification factor
      newCirclePoint.adjustSize();
      // Create the plottable label
      const newLabel = new Label();

      let vtx: SEPoint | SEPointOnOneDimensional | null = null;
      let newSELabel: SELabel | null = null;
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
        newSELabel = new SELabel(newLabel, vtx);

        circleCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx,
            this.hitSESegments[0],
            newSELabel
          )
        );
      } else if (this.hitSELines.length > 0) {
        // The end of the line will be a point on a line
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneDimensional(newCirclePoint, this.hitSELines[0]);
        // Set the Location
        vtx.locationVector = this.hitSELines[0].closestVector(
          this.currentSphereVector
        );
        newSELabel = new SELabel(newLabel, vtx);
        circleCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx,
            this.hitSELines[0],
            newSELabel
          )
        );
      } else if (this.hitSECircles.length > 0) {
        // The end of the line will be a point on a circle
        vtx = new SEPointOnOneDimensional(newCirclePoint, this.hitSECircles[0]);
        // Set the Location
        vtx.locationVector = this.hitSECircles[0].closestVector(
          this.currentSphereVector
        );
        newSELabel = new SELabel(newLabel, vtx);
        circleCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx,
            this.hitSECircles[0],
            newSELabel
          )
        );
      } else {
        // The ending mouse release landed on an open space
        vtx = new SEPoint(newCirclePoint);
        // Set the Location
        vtx.locationVector = this.currentSphereVector;
        newSELabel = new SELabel(newLabel, vtx);
        circleCommandGroup.addCommand(new AddPointCommand(vtx, newSELabel));
      }
      this.circleSEPoint = vtx;
      // Set the initial label location
      this.tmpVector
        .copy(vtx.locationVector)
        .add(
          new Vector3(
            2 * SETTINGS.point.initialLabelOffset,
            SETTINGS.point.initialLabelOffset,
            0
          )
        )
        .normalize();
      newSELabel.locationVector = this.tmpVector;
    }
    // Update the display of the circle based on a potentially new location of the circleSEPoint
    // Move the endMarker to the current mouse location
    this.endMarker.positionVector = this.circleSEPoint.locationVector;
    //compute the radius of the temporary circle
    this.arcRadius = this.temporaryCircle.centerVector.angleTo(
      this.circleSEPoint.locationVector
    );
    // Set the radius of the temporary circle, the center was set in Mouse Press
    this.temporaryCircle.circleRadius = this.arcRadius;
    //update the display
    this.temporaryCircle.updateDisplay();

    // Clone the current circle after the circlePoint is set
    const newCircle = this.temporaryCircle.clone();
    // Set the display to the default values
    newCircle.stylize(DisplayStyle.ApplyCurrentVariables);
    // Adjust the stroke width to the current zoom magnification factor
    newCircle.adjustSize();

    // Add the last command to the group and then execute it (i.e. add the potentially two points and the circle to the store.)
    const newSECircle = new SECircle(
      newCircle,
      this.centerSEPoint,
      this.circleSEPoint
    );
    // Create the plottable and model label
    const newLabel = new Label();
    const newSELabel = new SELabel(newLabel, newSECircle);
    // Set the initial label location
    this.tmpMatrix.makeRotationAxis(
      this.centerSEPoint.locationVector,
      Math.PI / 2
    );
    this.tmpVector
      .copy(this.circleSEPoint.locationVector)
      .applyMatrix4(this.tmpMatrix)
      .add(new Vector3(0, SETTINGS.circle.initialLabelOffset, 0))
      .normalize();
    newSELabel.locationVector = this.tmpVector;

    circleCommandGroup.addCommand(
      new AddCircleCommand(
        newSECircle,
        this.centerSEPoint,
        this.circleSEPoint,
        newSELabel
      )
    );
    // Generate new intersection points. These points must be computed and created
    // in the store. Add the new created points to the circle command so they can be undone.
    this.store.getters
      .createAllIntersectionsWithCircle(newSECircle)
      .forEach((item: SEIntersectionReturnType) => {
        // Create the plottable and model label
        const newLabel = new Label();
        const newSELabel = new SELabel(newLabel, item.SEIntersectionPoint);

        // Set the initial label location
        this.tmpVector
          .copy(item.SEIntersectionPoint.locationVector)
          .add(
            new Vector3(
              2 * SETTINGS.point.initialLabelOffset,
              SETTINGS.point.initialLabelOffset,
              0
            )
          )
          .normalize();
        newSELabel.locationVector = this.tmpVector;

        circleCommandGroup.addCommand(
          new AddIntersectionPointCommand(
            item.SEIntersectionPoint,
            item.parent1,
            item.parent2,
            newSELabel
          )
        );
        item.SEIntersectionPoint.showing = false; // do not display the automatically created intersection points or label
        newSELabel.showing = false;
      });

    circleCommandGroup.execute();
  }

  /**
   * The user is attempting to make a circle smaller than the minimum radius or close to radius PI so
   * create  a point at the location of the start vector
   */
  // makePoint(): void {
  //   if (this.centerSEPoint === null) {
  //     // we have to create a new SEPointOnOneDimensional or SEPoint and Point
  //     const newPoint = new Point();
  //     // Set the display to the default values
  //     newPoint.stylize(DisplayStyle.ApplyCurrentVariables);
  //     // Adjust the size of the point to the current zoom magnification factor
  //     newPoint.adjustSize();
  //     const newLabel = new Label();

  //     let vtx: SEPoint | SEPointOnOneDimensional | null = null;
  //     let newSELabel: SELabel | null = null;
  //     if (this.centerSEPointOneDimensionalParent) {
  //       // Starting mouse press landed near a oneDimensional
  //       // Create the model object for the new point and link them
  //       vtx = new SEPointOnOneDimensional(
  //         newPoint,
  //         this.centerSEPointOneDimensionalParent
  //       );
  //       newSELabel = new SELabel(newLabel, vtx);

  //       new AddPointOnOneDimensionalCommand(
  //         vtx,
  //         this.centerSEPointOneDimensionalParent,
  //         newSELabel
  //       ).execute();
  //     } else {
  //       // Starting mouse press landed on an open space
  //       // we have to create a new point and it to the group/store
  //       // Create and execute the command to create a new point for undo/redo
  //       vtx = new SEPoint(newPoint);
  //       newSELabel = new SELabel(newLabel, vtx);
  //       new AddPointCommand(vtx, newSELabel).execute();
  //     }
  //     vtx.locationVector = this.centerVector;
  //     // Set the initial label location
  //     this.tmpVector
  //       .copy(vtx.locationVector)
  //       .add(
  //         new Vector3(
  //           2 * SETTINGS.point.initialLabelOffset,
  //           SETTINGS.point.initialLabelOffset,
  //           0
  //         )
  //       )
  //       .normalize();
  //     newSELabel.locationVector = this.tmpVector;
  //   } else if (
  //     this.centerSEPoint instanceof SEIntersectionPoint &&
  //     !this.centerSEPoint.isUserCreated
  //   ) {
  //     // Mark the intersection point as created, the display style is changed and the glowing style is set up
  //     new ConvertInterPtToUserCreatedCommand(this.centerSEPoint).execute();
  //   }
  // }

  activate(): void {
    // If there are exactly two SEPoints selected, create a circle with the first as the center
    // and the second as the circle point
    if (this.store.getters.selectedSENodules().length == 2) {
      const object1 = this.store.getters.selectedSENodules()[0];
      const object2 = this.store.getters.selectedSENodules()[1];
      if (
        object1 instanceof SEPoint &&
        object2 instanceof SEPoint &&
        !tmpVector
          .crossVectors(object1.locationVector, object2.locationVector)
          .isZero(SETTINGS.nearlyAntipodalIdeal) // if the points are antipodal do nothing
      ) {
        // Create a new plottable Circle
        const newCircle = new Circle();
        // Set the display to the default values
        newCircle.stylize(DisplayStyle.ApplyCurrentVariables);
        // Set the stroke width to the current width given the zoom level
        newCircle.adjustSize();
        const newLabel = new Label();

        // Add the last command to the group and then execute it (i.e. add the potentially two points and the circle to the store.)
        const newSECircle = new SECircle(newCircle, object1, object2);
        // Update the newSECircle so the display is correct when the command group is executed
        newSECircle.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
        const newSELabel = new SELabel(newLabel, newSECircle);
        // Set the initial label location
        this.tmpMatrix.makeRotationAxis(object1.locationVector, Math.PI / 2);
        this.tmpVector
          .copy(object2.locationVector)
          .applyMatrix4(this.tmpMatrix)
          .add(new Vector3(0, SETTINGS.circle.initialLabelOffset, 0))
          .normalize();

        const circleCommandGroup = new CommandGroup();
        circleCommandGroup.addCommand(
          new AddCircleCommand(newSECircle, object1, object2, newSELabel)
        );

        // Generate new intersection points. These points must be computed and created
        // in the store. Add the new created points to the circle command so they can be undone.
        this.store.getters
          .createAllIntersectionsWithCircle(newSECircle)
          .forEach((item: SEIntersectionReturnType) => {
            const newLabel = new Label();
            const newSELabel = new SELabel(newLabel, item.SEIntersectionPoint);

            // Set the initial label location
            this.tmpVector
              .copy(item.SEIntersectionPoint.locationVector)
              .add(
                new Vector3(
                  2 * SETTINGS.point.initialLabelOffset,
                  SETTINGS.point.initialLabelOffset,
                  0
                )
              )
              .normalize();
            newSELabel.locationVector = this.tmpVector;
            circleCommandGroup.addCommand(
              new AddIntersectionPointCommand(
                item.SEIntersectionPoint,
                item.parent1,
                item.parent2,
                newSELabel
              )
            );
            item.SEIntersectionPoint.showing = false; // do not display the automatically created intersection points
            newSELabel.showing = false;
          });

        circleCommandGroup.execute();
      }
    }
    // Unselect the selected objects and clear the selectedObject array
    super.activate();
  }
}
