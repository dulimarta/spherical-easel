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
import { SEPointOnOneOrTwoDimensional } from "@/models/SEPointOnOneOrTwoDimensional";
import { AddIntersectionPointCommand } from "@/commands/AddIntersectionPointCommand";
import { AddPointOnOneDimensionalCommand } from "@/commands/AddPointOnOneOrTwoDimensionalCommand";
import { SEOneOrTwoDimensional, SEIntersectionReturnType } from "@/types";
import Label from "@/plottables/Label";
import { SELabel } from "@/models/SELabel";
import EventBus from "./EventBus";

import { SEStore } from "@/store";
const tmpVector = new Vector3();

export default class CircleHandler extends Highlighter {
  /**
   * Center vector of the created circle
   */
  private centerVector: Vector3;
  /**  The temporary plottable TwoJS circle displayed as the user moves the mouse or drags after selecting one point */
  private temporaryCircle: Circle;
  /**  The model object point that is the center of the circle (if any) */
  private centerSEPoint: SEPoint | null = null;
  /** The model object point that is a point on the circle (if any) */
  private circleSEPoint: SEPoint | null = null;
  /** The possible parent of the centerSEPoint*/
  private centerSEPointOneDimensionalParent: SEOneOrTwoDimensional | null = null;

  /** The radius of the temporary circle (along the surface of the sphere) */
  private arcRadius = 0;
  /**
   * A temporary plottable (TwoJS) point created while the user is making the circles or segments
   */
  protected temporaryStartMarker: Point;
  /**
   * A temporary plottable (TwoJS) point created while the user is making the circles or segments
   */
  protected temporaryEndMarker: Point;

  /* temporary vector and matrix to help with computations */
  private tmpVector = new Vector3();
  private tmpMatrix = new Matrix4();

  /** Has the temporary circle/tempStartMarker/tempEndMarker been added to the scene?*/
  private temporaryCircleAdded = false;
  private temporaryStartMarkerAdded = false;
  private temporaryEndMarkerAdded = false;

  /**
   * As the user moves the pointer around snap the temporary marker to these objects temporarily
   */
  protected snapStartMarkerToTemporaryOneDimensional: SEOneOrTwoDimensional | null = null;
  protected snapEndMarkerToTemporaryOneDimensional: SEOneOrTwoDimensional | null = null;
  protected snapStartMarkerToTemporaryPoint: SEPoint | null = null;
  protected snapEndMarkerToTemporaryPoint: SEPoint | null = null;
  /**
   * If the user starts to make a circle and mouse press at a location on the sphere (or not on the sphere), then moves
   * off the canvas, then back inside the sphere and mouse releases, we should get nothing. This
   * variable is to help with that.
   */
  private centerLocationSelected = false;

  constructor(layers: Two.Group[]) {
    super(layers);
    this.centerVector = new Vector3();
    this.temporaryCircle = new Circle();
    // Set the style using the temporary defaults
    this.temporaryCircle.stylize(DisplayStyle.ApplyTemporaryVariables);
    SEStore.addTemporaryNodule(this.temporaryCircle);
    // Create and style the temporary points marking the start/end of an object being created
    this.temporaryStartMarker = new Point();
    this.temporaryStartMarker.stylize(DisplayStyle.ApplyTemporaryVariables);
    SEStore.addTemporaryNodule(this.temporaryStartMarker);
    this.temporaryEndMarker = new Point();
    this.temporaryEndMarker.stylize(DisplayStyle.ApplyTemporaryVariables);
    SEStore.addTemporaryNodule(this.temporaryEndMarker);
  }

  mousePressed(_event: MouseEvent): void {
    // Do the mouse moved event of the Highlighter so that a new hitSEPoints array will be generated
    // otherwise if the user has finished making an new point, then *without* triggering a mouse move
    // event, mouse press will *not* select the newly created point. This is not what we want so we call super.mouseMove
    //super.mouseMoved(event);
    // First decide if the location of the event is on the sphere
    if (this.isOnSphere && !this.centerLocationSelected) {
      // The user is making a circle
      this.centerLocationSelected = true;
      // Check to see if the current location is near any points
      if (this.hitSEPoints.length > 0) {
        // Pick the top most selected point
        const selected = this.hitSEPoints[0];
        // Record the center vector of the circle so it can be past to the non-temporary circle
        this.centerVector.copy(selected.locationVector);
        // Record the model object as the center of the circle
        this.centerSEPoint = selected;
        // Move the startMarker to the current selected point
        this.temporaryStartMarker.positionVector = selected.locationVector;
        // Set the center of the circle in the plottable object
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
        this.temporaryStartMarker.positionVector = this.centerVector;
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
        this.temporaryStartMarker.positionVector = this.centerVector;
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
        this.temporaryStartMarker.positionVector = this.centerVector;
        this.centerSEPoint = null;
      } else if (this.hitSEEllipses.length > 0) {
        // The center of the circle will be a point on a circle
        //  Eventually, we will create a new SEPointOneDimensional and Point
        this.centerSEPointOneDimensionalParent = this.hitSEEllipses[0];
        this.centerVector.copy(
          this.centerSEPointOneDimensionalParent.closestVector(
            this.currentSphereVector
          )
        );
        this.temporaryCircle.centerVector = this.centerVector;
        this.temporaryStartMarker.positionVector = this.centerVector;
        this.centerSEPoint = null;
      } else if (this.hitSEParametrics.length > 0) {
        // The center of the circle will be a point on a circle
        //  Eventually, we will create a new SEPointOneDimensional and Point
        this.centerSEPointOneDimensionalParent = this.hitSEParametrics[0];
        this.centerVector.copy(
          this.centerSEPointOneDimensionalParent.closestVector(
            this.currentSphereVector
          )
        );
        this.temporaryCircle.centerVector = this.centerVector;
        this.temporaryStartMarker.positionVector = this.centerVector;
        this.centerSEPoint = null;
      } else if (this.hitSEPolygons.length > 0) {
        // The center of the circle will be a point on a circle
        //  Eventually, we will create a new SEPointOneDimensional and Point
        this.centerSEPointOneDimensionalParent = this.hitSEPolygons[0];
        this.centerVector.copy(
          this.centerSEPointOneDimensionalParent.closestVector(
            this.currentSphereVector
          )
        );
        this.temporaryCircle.centerVector = this.centerVector;
        this.temporaryStartMarker.positionVector = this.centerVector;
        this.centerSEPoint = null;
      } else {
        // The mouse press is not near an existing point or one dimensional object.
        //  Eventually, we will create a new SEPoint and Point
        // Set the center of the circle in the plottable object - also calls temporaryCircle.readjust()
        this.temporaryCircle.centerVector = this.currentSphereVector;
        // Move the startMarker to the current mouse location
        this.temporaryStartMarker.positionVector = this.currentSphereVector;
        // Record the center vector of the circle so it can be past to the non-temporary circle
        this.centerVector.copy(this.currentSphereVector);
        // Set the center of the circle to null so it can be created later
        this.centerSEPoint = null;
      }
      this.temporaryEndMarker.positionVector = this.currentSphereVector;
      EventBus.fire("show-alert", {
        key: `handlers.circleCenterSelected`,
        keyOptions: {},
        type: "info"
      });
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Find all the nearby (hitSE... objects) and update location vectors
    super.mouseMoved(event);
    // Only one object can be interacted with at a given time, so set the first point nearby to glowing
    // The user can create points on ellipses, circles, segments, and lines, so
    // highlight those as well (but only one) if they are nearby also
    // Also set the snap objects
    if (this.hitSEPoints.length > 0) {
      this.hitSEPoints[0].glowing = true;
      if (!this.centerLocationSelected) {
        this.snapStartMarkerToTemporaryOneDimensional = null;
        this.snapEndMarkerToTemporaryOneDimensional = null;
        this.snapStartMarkerToTemporaryPoint = this.hitSEPoints[0];
        this.snapEndMarkerToTemporaryPoint = null;
      } else {
        this.snapStartMarkerToTemporaryOneDimensional = null;
        this.snapEndMarkerToTemporaryOneDimensional = null;
        this.snapStartMarkerToTemporaryPoint = null;
        this.snapEndMarkerToTemporaryPoint = this.hitSEPoints[0];
      }
    } else if (this.hitSESegments.length > 0) {
      this.hitSESegments[0].glowing = true;
      if (!this.centerLocationSelected) {
        this.snapStartMarkerToTemporaryOneDimensional = this.hitSESegments[0];
        this.snapEndMarkerToTemporaryOneDimensional = null;
        this.snapStartMarkerToTemporaryPoint = null;
        this.snapEndMarkerToTemporaryPoint = null;
      } else {
        this.snapStartMarkerToTemporaryOneDimensional = null;
        this.snapEndMarkerToTemporaryOneDimensional = this.hitSESegments[0];
        this.snapStartMarkerToTemporaryPoint = null;
        this.snapEndMarkerToTemporaryPoint = null;
      }
    } else if (this.hitSELines.length > 0) {
      this.hitSELines[0].glowing = true;
      if (!this.centerLocationSelected) {
        this.snapStartMarkerToTemporaryOneDimensional = this.hitSELines[0];
        this.snapEndMarkerToTemporaryOneDimensional = null;
        this.snapStartMarkerToTemporaryPoint = null;
        this.snapEndMarkerToTemporaryPoint = null;
      } else {
        this.snapStartMarkerToTemporaryOneDimensional = null;
        this.snapEndMarkerToTemporaryOneDimensional = this.hitSELines[0];
        this.snapStartMarkerToTemporaryPoint = null;
        this.snapEndMarkerToTemporaryPoint = null;
      }
    } else if (this.hitSECircles.length > 0) {
      this.hitSECircles[0].glowing = true;
      if (!this.centerLocationSelected) {
        this.snapStartMarkerToTemporaryOneDimensional = this.hitSECircles[0];
        this.snapEndMarkerToTemporaryOneDimensional = null;
        this.snapStartMarkerToTemporaryPoint = null;
        this.snapEndMarkerToTemporaryPoint = null;
      } else {
        this.snapStartMarkerToTemporaryOneDimensional = null;
        this.snapEndMarkerToTemporaryOneDimensional = this.hitSECircles[0];
        this.snapStartMarkerToTemporaryPoint = null;
        this.snapEndMarkerToTemporaryPoint = null;
      }
    } else if (this.hitSEEllipses.length > 0) {
      this.hitSEEllipses[0].glowing = true;
      if (!this.centerLocationSelected) {
        this.snapStartMarkerToTemporaryOneDimensional = this.hitSEEllipses[0];
        this.snapEndMarkerToTemporaryOneDimensional = null;
        this.snapStartMarkerToTemporaryPoint = null;
        this.snapEndMarkerToTemporaryPoint = null;
      } else {
        this.snapStartMarkerToTemporaryOneDimensional = null;
        this.snapEndMarkerToTemporaryOneDimensional = this.hitSEEllipses[0];
        this.snapStartMarkerToTemporaryPoint = null;
        this.snapEndMarkerToTemporaryPoint = null;
      }
    } else if (this.hitSEParametrics.length > 0) {
      this.hitSEParametrics[0].glowing = true;
      if (!this.centerLocationSelected) {
        this.snapStartMarkerToTemporaryOneDimensional = this.hitSEParametrics[0];
        this.snapEndMarkerToTemporaryOneDimensional = null;
        this.snapStartMarkerToTemporaryPoint = null;
        this.snapEndMarkerToTemporaryPoint = null;
      } else {
        this.snapStartMarkerToTemporaryOneDimensional = null;
        this.snapEndMarkerToTemporaryOneDimensional = this.hitSEParametrics[0];
        this.snapStartMarkerToTemporaryPoint = null;
        this.snapEndMarkerToTemporaryPoint = null;
      }
    } else if (this.hitSEPolygons.length > 0) {
      this.hitSEPolygons[0].glowing = true;
      if (!this.centerLocationSelected) {
        this.snapStartMarkerToTemporaryOneDimensional = this.hitSEPolygons[0];
        this.snapEndMarkerToTemporaryOneDimensional = null;
        this.snapStartMarkerToTemporaryPoint = null;
        this.snapEndMarkerToTemporaryPoint = null;
      } else {
        this.snapStartMarkerToTemporaryOneDimensional = null;
        this.snapEndMarkerToTemporaryOneDimensional = this.hitSEPolygons[0];
        this.snapStartMarkerToTemporaryPoint = null;
        this.snapEndMarkerToTemporaryPoint = null;
      }
    } else {
      this.snapStartMarkerToTemporaryOneDimensional = null;
      this.snapEndMarkerToTemporaryOneDimensional = null;
      this.snapStartMarkerToTemporaryPoint = null;
      this.snapEndMarkerToTemporaryPoint = null;
    }

    // Make sure that the event is on the sphere
    if (this.isOnSphere) {
      // The user has selected a center point
      if (!this.centerLocationSelected) {
        // If the temporary startMarker has *not* been added to the scene do so now
        if (!this.temporaryStartMarkerAdded) {
          this.temporaryStartMarkerAdded = true;
          this.temporaryStartMarker.addToLayers(this.layers);
        }
        // Remove the temporary startMarker if there is a nearby point which can glowing
        if (this.snapStartMarkerToTemporaryPoint !== null) {
          // if the user is over a non user created intersection point (which can't be selected so will not remain
          // glowing when the user select that location and then moves the mouse away - see line 115) we don't
          // remove the temporary start marker from the scene, instead we move it to the location of the intersection point
          if (
            this.snapStartMarkerToTemporaryPoint instanceof
              SEIntersectionPoint &&
            !this.snapStartMarkerToTemporaryPoint.isUserCreated
          ) {
            this.temporaryStartMarker.positionVector = this.snapStartMarkerToTemporaryPoint.locationVector;
          } else {
            this.temporaryStartMarker.removeFromLayers();
            this.temporaryStartMarkerAdded = false;
          }
        }
        // Set the location of the temporary startMarker by snapping to appropriate object (if any)
        if (this.snapStartMarkerToTemporaryOneDimensional !== null) {
          this.temporaryStartMarker.positionVector = this.snapStartMarkerToTemporaryOneDimensional.closestVector(
            this.currentSphereVector
          );
        } else if (this.snapStartMarkerToTemporaryPoint == null) {
          this.temporaryStartMarker.positionVector = this.currentSphereVector;
        }
      } else {
        // If the temporary endMarker has *not* been added to the scene do so now
        if (!this.temporaryEndMarkerAdded) {
          this.temporaryEndMarkerAdded = true;
          this.temporaryEndMarker.addToLayers(this.layers);
        }
        // Remove the temporary endMarker if there is a nearby point (which is glowing)
        if (this.snapEndMarkerToTemporaryPoint !== null) {
          this.temporaryEndMarker.removeFromLayers();
          this.temporaryEndMarkerAdded = false;
        }
        // Set the location of the temporary endMarker by snapping to appropriate object (if any)
        if (this.snapEndMarkerToTemporaryOneDimensional !== null) {
          this.temporaryEndMarker.positionVector = this.snapEndMarkerToTemporaryOneDimensional.closestVector(
            this.currentSphereVector
          );
        } else {
          this.temporaryEndMarker.positionVector = this.currentSphereVector;
        }

        // If the temporary circle has *not* been added to the scene do so now (only once)
        if (!this.temporaryCircleAdded) {
          this.temporaryCircleAdded = true;
          this.temporaryCircle.addToLayers(this.layers);
        }

        //compute the radius of the temporary circle
        if (this.snapEndMarkerToTemporaryPoint === null) {
          this.arcRadius = this.temporaryCircle.centerVector.angleTo(
            this.temporaryEndMarker.positionVector
          );
        } else {
          this.arcRadius = this.temporaryCircle.centerVector.angleTo(
            this.snapEndMarkerToTemporaryPoint.locationVector
          );
        }

        // Set the radius of the temporary circle, the center was set in Mouse Press
        this.temporaryCircle.circleRadius = this.arcRadius;
        //update the display
        this.temporaryCircle.updateDisplay();
      }
    }
    // else {
    //   // Remove the temporary objects from the display but don't reset for a new circle
    //   // add the appropriate objects back if the user returns to the sphere with out
    //   // triggering the mouse leave event.
    //   if (this.temporaryEndMarkerAdded) {
    //     this.temporaryEndMarker.removeFromLayers();
    //     this.temporaryEndMarkerAdded = false;
    //   }

    //   if (this.temporaryStartMarkerAdded) {
    //     this.temporaryStartMarker.removeFromLayers();
    //     this.temporaryStartMarkerAdded = false;
    //   }

    //   if (this.temporaryCircleAdded) {
    //     this.temporaryCircle.removeFromLayers();
    //     this.temporaryCircleAdded = false;
    //   }

    //   this.snapStartMarkerToTemporaryOneDimensional = null;
    //   this.snapEndMarkerToTemporaryOneDimensional = null;
    //   this.snapStartMarkerToTemporaryPoint = null;
    //   this.snapEndMarkerToTemporaryPoint = null;
    // }
  }

  mouseReleased(_event: MouseEvent): void {
    if (this.isOnSphere) {
      // Make sure the user didn't trigger the mouse leave event and is actually making a circle
      if (this.centerLocationSelected) {
        // If the user hasn't moved the mouse far enough or is trying to make a circle of radius Pi,
        //  don't add a circle
        // don't use the this.arcRadius variable (which calculate the radius based on the temporary objects) because this
        //  can be larger than the value (radius) below and will create circles of radius zero
        const radius = this.currentSphereVector.angleTo(this.centerVector);
        if (
          radius > SETTINGS.circle.minimumRadius &&
          radius < Math.PI - SETTINGS.circle.minimumRadius
        ) {
          if (!this.makeCircle()) {
            EventBus.fire("show-alert", {
              key: `handlers.circleCreationAttemptDuplicate`,
              keyOptions: {},
              type: "error"
            });
          }
          this.mouseLeave(_event);
        }
      }
    }
  }

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);

    // Remove the temporary objects from the scene and mark the temporary object
    //  not added to the scene clear snap objects
    if (this.temporaryCircleAdded) {
      this.temporaryCircle.removeFromLayers();
      this.temporaryCircleAdded = false;
    }
    if (this.temporaryEndMarkerAdded) {
      this.temporaryEndMarker.removeFromLayers();
      this.temporaryEndMarkerAdded = false;
    }
    if (this.temporaryStartMarkerAdded) {
      this.temporaryStartMarker.removeFromLayers();
      this.temporaryStartMarkerAdded = false;
    }

    this.snapStartMarkerToTemporaryOneDimensional = null;
    this.snapEndMarkerToTemporaryOneDimensional = null;
    this.snapStartMarkerToTemporaryPoint = null;
    this.snapEndMarkerToTemporaryPoint = null;

    // Clear old points and values to get ready for creating the next circle.
    if (this.centerSEPoint !== null) {
      this.centerSEPoint.glowing = false;
      this.centerSEPoint.selected = false;
    }
    this.circleSEPoint = null;
    this.centerSEPoint = null;
    this.centerSEPointOneDimensionalParent = null;
    this.centerLocationSelected = false;
    // call an unglow all command
    SEStore.unglowAllSENodules();
  }
  /**
   * Add a new circle the user has moved the mouse far enough (but not a radius of PI)
   */
  makeCircle(): boolean {
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

      let vtx: SEPoint | SEPointOnOneOrTwoDimensional | null = null;
      if (this.centerSEPointOneDimensionalParent) {
        // Starting mouse press landed near a oneDimensional
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneOrTwoDimensional(
          newCenterPoint,
          this.centerSEPointOneDimensionalParent
        );

        newSELabel = new SELabel(newLabel, vtx);

        circleCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
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

      let vtx: SEPoint | SEPointOnOneOrTwoDimensional | null = null;
      let newSELabel: SELabel | null = null;
      if (this.hitSESegments.length > 0) {
        // The end of the line will be a point on a segment
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneOrTwoDimensional(
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
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSESegments[0],
            newSELabel
          )
        );
      } else if (this.hitSELines.length > 0) {
        // The end of the line will be a point on a line
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneOrTwoDimensional(
          newCirclePoint,
          this.hitSELines[0]
        );
        // Set the Location
        vtx.locationVector = this.hitSELines[0].closestVector(
          this.currentSphereVector
        );
        newSELabel = new SELabel(newLabel, vtx);
        circleCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSELines[0],
            newSELabel
          )
        );
      } else if (this.hitSECircles.length > 0) {
        // The end of the line will be a point on a circle
        vtx = new SEPointOnOneOrTwoDimensional(
          newCirclePoint,
          this.hitSECircles[0]
        );
        // Set the Location
        vtx.locationVector = this.hitSECircles[0].closestVector(
          this.currentSphereVector
        );
        newSELabel = new SELabel(newLabel, vtx);
        circleCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSECircles[0],
            newSELabel
          )
        );
      } else if (this.hitSEEllipses.length > 0) {
        // The end of the line will be a point on a ellipse
        vtx = new SEPointOnOneOrTwoDimensional(
          newCirclePoint,
          this.hitSEEllipses[0]
        );
        // Set the Location
        vtx.locationVector = this.hitSEEllipses[0].closestVector(
          this.currentSphereVector
        );
        newSELabel = new SELabel(newLabel, vtx);
        circleCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSEEllipses[0],
            newSELabel
          )
        );
      } else if (this.hitSEParametrics.length > 0) {
        // The end of the line will be a point on a parametric
        vtx = new SEPointOnOneOrTwoDimensional(
          newCirclePoint,
          this.hitSEParametrics[0]
        );
        // Set the Location
        vtx.locationVector = this.hitSEParametrics[0].closestVector(
          this.currentSphereVector
        );
        newSELabel = new SELabel(newLabel, vtx);
        circleCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSEParametrics[0],
            newSELabel
          )
        );
      } else if (this.hitSEPolygons.length > 0) {
        // The end of the line will be a point on a polygon
        vtx = new SEPointOnOneOrTwoDimensional(
          newCirclePoint,
          this.hitSEPolygons[0]
        );
        // Set the Location
        vtx.locationVector = this.hitSEPolygons[0].closestVector(
          this.currentSphereVector
        );
        newSELabel = new SELabel(newLabel, vtx);
        circleCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSEPolygons[0],
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
    this.temporaryEndMarker.positionVector = this.circleSEPoint.locationVector;
    //compute the radius of the temporary circle
    this.arcRadius = this.temporaryCircle.centerVector.angleTo(
      this.circleSEPoint.locationVector
    );
    // Set the radius of the temporary circle, the center was set in Mouse Press
    this.temporaryCircle.circleRadius = this.arcRadius;
    //update the display
    this.temporaryCircle.updateDisplay();

    // check to make sure that this circle doesn't already exist
    if (
      SEStore.seCircles.some(
        circ =>
          this.tmpVector
            .subVectors(
              circ.centerSEPoint.locationVector,
              this.centerSEPoint
                ? this.centerSEPoint.locationVector
                : this.tmpVector
            )
            .isZero() &&
          Math.abs(this.arcRadius - circ.circleRadius) < SETTINGS.tolerance
      )
    ) {
      return false;
    }
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
    SEStore.createAllIntersectionsWithCircle(newSECircle).forEach(
      (item: SEIntersectionReturnType) => {
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
      }
    );

    circleCommandGroup.execute();
    return true;
  }

  activate(): void {
    // If there are exactly two SEPoints selected, create a circle with the first as the center
    // and the second as the circle point
    if (SEStore.selectedSENodules.length == 2) {
      const object1 = SEStore.selectedSENodules[0];
      const object2 = SEStore.selectedSENodules[1];
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
        newSECircle.markKidsOutOfDate();
        newSECircle.update();
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
        SEStore.createAllIntersectionsWithCircle(newSECircle).forEach(
          (item: SEIntersectionReturnType) => {
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
          }
        );

        circleCommandGroup.execute();
      }
    }
    // Unselect the selected objects and clear the selectedObject array
    super.activate();
  }
  deactivate(): void {
    super.deactivate();
  }
}
