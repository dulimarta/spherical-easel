import Highlighter from "./Highlighter";
import EventBus from "@/eventHandlers-spherical/EventBus";
import { SEPoint } from "@/models-spherical/SEPoint";
import { SEPointReflection } from "@/models-spherical/SEPointReflection";
import { AddPointReflectionCommand } from "@/commands-spherical/AddPointReflectionCommand";
import { Vector3 } from "three";
import { SEOneOrTwoDimensional } from "@/types";
import Point from "@/plottables-spherical/Point";
import { CommandGroup } from "@/commands-spherical/CommandGroup";
import { SELabel } from "@/models-spherical/SELabel";
import { SEPointOnOneOrTwoDimensional } from "@/models-spherical/SEPointOnOneOrTwoDimensional";
import { AddPointOnOneDimensionalCommand } from "@/commands-spherical/AddPointOnOneOrTwoDimensionalCommand";
import { SEIntersectionPoint } from "@/models-spherical/SEIntersectionPoint";
import { AddPointCommand } from "@/commands-spherical/AddPointCommand";
import SETTINGS from "@/global-settings-spherical";
//import Two from "two.js";
import { Group } from "two.js/src/group";
import { SEAntipodalPoint } from "@/models-spherical/SEAntipodalPoint";
import { SetPointUserCreatedValueCommand } from "@/commands-spherical/SetPointUserCreatedValueCommand";

export default class PointReflectionTransformationHandler extends Highlighter {
  /**
   * Center vector of the created rotation
   */
  private rotationVector = new Vector3();
  /**  The model object point that is the center of the rotation (if any) */
  private rotationSEPoint: SEPoint | null = null;
  /** The possible parent of the centerSEPoint*/
  private rotationSEPointOneDimensionalParent: SEOneOrTwoDimensional | null =
    null;

  /**
   * A temporary plottable (TwoJS) point created while the user is making the rotation
   */
  protected temporaryRotationPointMarker: Point;
  /** Has the tempStartMarker been added to the scene?*/
  private temporaryRotationPointMarkerAdded = false;

  /**
   * As the user moves the pointer around snap the center temporary marker to these objects temporarily
   */
  protected snapTemporaryRotationPointMarkerToOneDimensional: SEOneOrTwoDimensional | null =
    null;
  protected snapTemporaryRotationPointMarkerToPoint: SEPoint | null = null;

  /* temporary vector and matrix to help with computations */
  private tmpVector = new Vector3();
  private tmpVector1 = new Vector3();

  // Filter the hitSEPoints appropriately for this handler
  protected filteredIntersectionPointsList: SEPoint[] = [];

  constructor(layers: Group[]) {
    super(layers);

    // Create and style the temporary points marking the start/end of an object being created
    this.temporaryRotationPointMarker = new Point();
    PointReflectionTransformationHandler.store.addTemporaryNodule(
      this.temporaryRotationPointMarker
    );
  }

  mousePressed(_event: MouseEvent): void {
    // First decide if the location of the event is on the sphere
    if (this.isOnSphere) {
      this.updateFilteredPointsList();
      // Check to see if the current location is near any points
      if (this.filteredIntersectionPointsList.length > 0) {
        // Pick the top most selected point
        const selected = this.filteredIntersectionPointsList[0];
        let transformationName = "";
        if (
          PointReflectionTransformationHandler.store.seTransformations.some(
            trans => {
              if (
                trans instanceof SEPointReflection &&
                selected !== null &&
                trans.sePointOfReflection.name === selected.name
              ) {
                transformationName = trans.name;
                return true;
              } else {
                return false;
              }
            }
          )
        ) {
          EventBus.fire("show-alert", {
            key: `handlers.duplicatePointReflection`,
            keyOptions: {
              trans: `${transformationName}`
            },
            type: "error"
          });
          return;
        }
        // Record the rotation vector of the rotation so it can be past to the rotation
        this.rotationVector.copy(selected.locationVector);
        // Record the model object as the center of the circle
        this.rotationSEPoint = selected;
        // Move the startMarker to the current selected point
        this.temporaryRotationPointMarker.positionVectorAndDisplay =
          selected.locationVector;
        // Glow the selected point and select it so the highlighter.ts doesn't unglow it with the mouseMoved method
        this.rotationSEPoint.glowing = true;
        this.rotationSEPoint.selected = true;
      } else if (this.hitSESegments.length > 0) {
        // The center of the rotation will be a point on a segment
        //  Eventually, we will create a new SEPointOneDimensional and Point
        this.rotationSEPointOneDimensionalParent = this.hitSESegments[0];
        this.rotationVector.copy(
          this.rotationSEPointOneDimensionalParent.closestVector(
            this.currentSphereVector
          )
        );
        this.temporaryRotationPointMarker.positionVectorAndDisplay =
          this.rotationVector;
        this.rotationSEPoint = null;
      } else if (this.hitSELines.length > 0) {
        // The center of the rotation will be a point on a line
        //  Eventually, we will create a new SEPointOneDimensional and Point
        this.rotationSEPointOneDimensionalParent = this.hitSELines[0];
        this.rotationVector.copy(
          this.rotationSEPointOneDimensionalParent.closestVector(
            this.currentSphereVector
          )
        );
        this.temporaryRotationPointMarker.positionVectorAndDisplay =
          this.rotationVector;
        this.rotationSEPoint = null;
      } else if (this.hitSECircles.length > 0) {
        // The center of the rotation will be a point on a circle
        //  Eventually, we will create a new SEPointOneDimensional and Point
        this.rotationSEPointOneDimensionalParent = this.hitSECircles[0];
        this.rotationVector.copy(
          this.rotationSEPointOneDimensionalParent.closestVector(
            this.currentSphereVector
          )
        );
        this.temporaryRotationPointMarker.positionVectorAndDisplay =
          this.rotationVector;
        this.rotationSEPoint = null;
      } else if (this.hitSEEllipses.length > 0) {
        // The center of the rotation will be a point on a ellipse
        //  Eventually, we will create a new SEPointOneDimensional and Point
        this.rotationSEPointOneDimensionalParent = this.hitSEEllipses[0];
        this.rotationVector.copy(
          this.rotationSEPointOneDimensionalParent.closestVector(
            this.currentSphereVector
          )
        );
        this.temporaryRotationPointMarker.positionVectorAndDisplay =
          this.rotationVector;
        this.rotationSEPoint = null;
      } else if (this.hitSEParametrics.length > 0) {
        // The center of the rotation will be a point on a parametric
        //  Eventually, we will create a new SEPointOneDimensional and Point
        this.rotationSEPointOneDimensionalParent = this.hitSEParametrics[0];
        this.rotationVector.copy(
          this.rotationSEPointOneDimensionalParent.closestVector(
            this.currentSphereVector
          )
        );
        this.temporaryRotationPointMarker.positionVectorAndDisplay =
          this.rotationVector;
        this.rotationSEPoint = null;
      } else if (this.hitSEPolygons.length > 0) {
        // The center of the rotation will be a point on a polygon
        //  Eventually, we will create a new SEPointOneDimensional and Point
        this.rotationSEPointOneDimensionalParent = this.hitSEPolygons[0];
        this.rotationVector.copy(
          this.rotationSEPointOneDimensionalParent.closestVector(
            this.currentSphereVector
          )
        );
        this.temporaryRotationPointMarker.positionVectorAndDisplay =
          this.rotationVector;
        this.rotationSEPoint = null;
      } else {
        // The mouse press is not near an existing point or one dimensional object.
        //  Eventually, we will create a new SEPoint and Point

        // Move the startMarker to the current mouse location
        this.temporaryRotationPointMarker.positionVectorAndDisplay =
          this.currentSphereVector;
        // Record the center vector of the circle so it can be past to the non-temporary circle
        this.rotationVector.copy(this.currentSphereVector);
        // Set the center of the circle to null so it can be created later
        this.rotationSEPoint = null;
      }

      if (!this.makeRotation()) {
        EventBus.fire("show-alert", {
          key: `handlers.duplicatePointRotation`,
          keyOptions: { trans: "" },
          type: "error"
        });
      }
      //reset the tool to handle the next circle
      this.prepareForNextRotation();
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Find all the nearby (hitSE... objects) and update location vectors
    super.mouseMoved(event);

    // Make sure that the event is on the sphere
    // The user has not selected a rotation point
    if (this.isOnSphere) {
      this.updateFilteredPointsList();
      // Only object can be interacted with at a given time, so set the first point nearby to glowing
      // The user can create points on ellipses, circles, segments, and lines, so
      // highlight those as well (but only one) if they are nearby also
      // Also set the snap objects
      const pointList = this.filteredIntersectionPointsList.filter(pt => {
        if (
          PointReflectionTransformationHandler.store.seTransformations.some(
            trans => {
              if (
                trans instanceof SEPointReflection &&
                trans.sePointOfReflection.name === pt.name
              ) {
                return true;
              } else {
                return false;
              }
            }
          )
        ) {
          return false;
        } else {
          return true;
        }
      });

      let possiblyGlowing: SEPoint | SEOneOrTwoDimensional | null = null;
      if (pointList.length > 0) {
        possiblyGlowing = pointList[0];
      } else if (this.hitSESegments.length > 0) {
        possiblyGlowing = this.hitSESegments[0];
      } else if (this.hitSELines.length > 0) {
        possiblyGlowing = this.hitSELines[0];
      } else if (this.hitSECircles.length > 0) {
        possiblyGlowing = this.hitSECircles[0];
      } else if (this.hitSEEllipses.length > 0) {
        possiblyGlowing = this.hitSEEllipses[0];
      } else if (this.hitSEParametrics.length > 0) {
        possiblyGlowing = this.hitSEParametrics[0];
      } else if (this.hitSEPolygons.length > 0) {
        possiblyGlowing = this.hitSEPolygons[0];
      } else {
        this.snapTemporaryRotationPointMarkerToOneDimensional = null;
        this.snapTemporaryRotationPointMarkerToPoint = null;
      }

      if (possiblyGlowing !== null) {
        if (possiblyGlowing instanceof SEPoint) {
          possiblyGlowing.glowing = true;
          this.snapTemporaryRotationPointMarkerToOneDimensional = null;
          this.snapTemporaryRotationPointMarkerToPoint = possiblyGlowing;
        }
        // possiblyGlowing is a oneDimensional Object
        else {
          possiblyGlowing.glowing = true;
          this.snapTemporaryRotationPointMarkerToOneDimensional =
            possiblyGlowing;
          this.snapTemporaryRotationPointMarkerToPoint = null;
        }
      }

      // If the temporary startMarker has *not* been added to the scene do so now
      if (!this.temporaryRotationPointMarkerAdded) {
        this.temporaryRotationPointMarkerAdded = true;
        this.temporaryRotationPointMarker.addToLayers(this.layers);
      }
      // Remove the temporary startMarker if there is a nearby point which can glowing
      if (this.snapTemporaryRotationPointMarkerToPoint !== null) {
        // if the user is over a non user created intersection point (which can't be selected so will not remain
        // glowing when the user select that location and then moves the mouse away - see line 115) we don't
        // remove the temporary start marker from the scene, instead we move it to the location of the intersection point
        if (
          this.snapTemporaryRotationPointMarkerToPoint instanceof
            SEIntersectionPoint &&
          !this.snapTemporaryRotationPointMarkerToPoint.isUserCreated
        ) {
          this.temporaryRotationPointMarker.positionVectorAndDisplay =
            this.snapTemporaryRotationPointMarkerToPoint.locationVector;
        } else {
          this.temporaryRotationPointMarker.removeFromLayers();
          this.temporaryRotationPointMarkerAdded = false;
        }
      }
      // Set the location of the temporary startMarker by snapping to appropriate object (if any)
      if (this.snapTemporaryRotationPointMarkerToOneDimensional !== null) {
        this.temporaryRotationPointMarker.positionVectorAndDisplay =
          this.snapTemporaryRotationPointMarkerToOneDimensional.closestVector(
            this.currentSphereVector
          );
      } else if (this.snapTemporaryRotationPointMarkerToPoint == null) {
        this.temporaryRotationPointMarker.positionVectorAndDisplay =
          this.currentSphereVector;
      }
    }
    // Not on the sphere -- remove the temporary point
    else {
      this.temporaryRotationPointMarker.removeFromLayers();
      this.temporaryRotationPointMarkerAdded = false;
    }
  }

  // eslint-disable-next-line
  mouseReleased(_event: MouseEvent): void {}

  mouseLeave(event: MouseEvent): void {
    this.prepareForNextRotation();
    super.mouseLeave(event);
  }

  updateFilteredPointsList(): void {
    this.filteredIntersectionPointsList = this.hitSEPoints.filter(
      pt => pt.showing // you can only reflect over existing and showing points
    );
  }

  prepareForNextRotation(): void {
    // Remove the temporary objects from the scene and mark the temporary object
    //  not added to the scene clear snap objects

    this.temporaryRotationPointMarker.removeFromLayers();
    this.temporaryRotationPointMarkerAdded = false;

    this.snapTemporaryRotationPointMarkerToOneDimensional = null;
    this.snapTemporaryRotationPointMarkerToPoint = null;

    // Clear old points and values to get ready for creating the next circle.
    if (this.rotationSEPoint !== null) {
      this.rotationSEPoint.glowing = false;
      this.rotationSEPoint.selected = false;
    }
    this.rotationSEPoint = null;
    this.rotationSEPointOneDimensionalParent = null;

    // call an unglow all command
    PointReflectionTransformationHandler.store.unglowAllSENodules();
  }

  /**
   * Add a new rotation if it not a duplicate
   */
  makeRotation(): boolean {
    // Create a command group to add the points defining the circle and the circle to the store
    // This way a single undo click will undo all (potentially three) operations.
    const pointRotationCommandGroup = new CommandGroup();
    if (this.rotationSEPoint === null) {
      // Starting point landed on an open space
      // we have to create a new point and it to the group/store

      let newSELabel: SELabel | null = null;

      let vtx: SEPoint | SEPointOnOneOrTwoDimensional | null = null;
      if (this.rotationSEPointOneDimensionalParent) {
        // Starting mouse press landed near a oneDimensional
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneOrTwoDimensional(
          this.rotationSEPointOneDimensionalParent
        );

        newSELabel = new SELabel("point", vtx);

        pointRotationCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.rotationSEPointOneDimensionalParent,
            newSELabel
          )
        );
      } else {
        // Starting mouse press landed on an open space
        // Create the model object for the new point and link them
        vtx = new SEPoint();
        newSELabel = new SELabel("point", vtx);
        pointRotationCommandGroup.addCommand(
          new AddPointCommand(vtx, newSELabel)
        );
      }
      vtx.locationVector = this.rotationVector;

      /////////////
      // Create the antipode of the new point, vtx
      PointReflectionTransformationHandler.addCreateAntipodeCommand(
        vtx,
        pointRotationCommandGroup
      );
      ///////////

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
      this.rotationSEPoint = vtx;
    } else if (
      (this.rotationSEPoint instanceof SEIntersectionPoint &&
        !this.rotationSEPoint.isUserCreated) ||
      (this.rotationSEPoint instanceof SEAntipodalPoint &&
        !this.rotationSEPoint.isUserCreated)
    ) {
      // Mark the intersection point as created, the display style is changed and the glowing style is set up
      pointRotationCommandGroup.addCommand(
        new SetPointUserCreatedValueCommand(this.rotationSEPoint, true)
      );
    }

    // check to make sure that this rotation doesn't already exist
    if (
      PointReflectionTransformationHandler.store.seTransformations.some(
        trans =>
          trans instanceof SEPointReflection &&
          this.tmpVector
            .subVectors(
              trans.sePointOfReflection.locationVector,
              this.rotationSEPoint
                ? this.rotationSEPoint.locationVector
                : this.tmpVector1
            )
            .isZero()
      )
    ) {
      return false;
    }

    // create the rotation
    if (this.rotationSEPoint !== null) {
      const newPointReflection = new SEPointReflection(this.rotationSEPoint);

      pointRotationCommandGroup.addCommand(
        new AddPointReflectionCommand(newPointReflection, this.rotationSEPoint)
      );

      pointRotationCommandGroup.execute();
      EventBus.fire("show-alert", {
        key: `handlers.newPointReflectionAdded`,
        keyOptions: { name: `${newPointReflection.name}` },
        type: "success"
      });
      // Update the display so the changes become apparent
      // this.targetPointOfReflection.markKidsOutOfDate();
      // this.targetPointOfReflection.update();
      // this.targetPointOfReflection = null;
    }

    return true;
  }

  activate(): void {
    if (
      PointReflectionTransformationHandler.store.selectedSENodules.length == 1
    ) {
      const object1 =
        PointReflectionTransformationHandler.store.selectedSENodules[0];

      if (object1 instanceof SEPoint) {
        let pointReflectionName = "";
        if (
          PointReflectionTransformationHandler.store.seTransformations.some(
            trans => {
              if (
                trans instanceof SEPointReflection &&
                trans.sePointOfReflection.name === object1.name
              ) {
                pointReflectionName = trans.name;
                return true;
              } else {
                return false;
              }
            }
          )
        ) {
          EventBus.fire("show-alert", {
            key: `handlers.duplicatePointReflection`,
            keyOptions: {
              trans: `${pointReflectionName}`
            },
            type: "error"
          });
        } else {
          const pointReflection = new SEPointReflection(object1);
          EventBus.fire("show-alert", {
            key: `handlers.newPointReflectionAdded`,
            keyOptions: { name: `${pointReflection.name}` },
            type: "success"
          });

          new AddPointReflectionCommand(pointReflection, object1).execute();
          // make the change show up in the sphere
          object1.markKidsOutOfDate();
          object1.update();
        }
      }
    }
    // Unselect the selected objects and clear the selectedObject array
    super.activate();
  }
  deactivate(): void {
    this.prepareForNextRotation();
    super.deactivate();
  }
}
