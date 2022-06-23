import Two from "two.js";
import Highlighter from "./Highlighter";
import { SESegment } from "@/models/SESegment";
import { AddLengthMeasurementCommand } from "@/commands/AddLengthMeasurementCommand";
import { SESegmentLength } from "@/models/SESegmentLength";
import EventBus from "@/eventHandlers/EventBus";
import SETTINGS from "@/global-settings";
import { CommandGroup } from "@/commands/CommandGroup";
import { StyleNoduleCommand } from "@/commands/StyleNoduleCommand";
import { StyleEditPanels } from "@/types/Styles";
import { LabelDisplayMode, SEMeasurable, SEOneOrTwoDimensional } from "@/types";
import { SEExpression } from "@/models/SEExpression";
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";
import { SETransformation } from "@/models/SETransformation";
import { SEPoint } from "@/models/SEPoint";
import Point from "@/plottables/Point";
import { DisplayStyle } from "@/plottables/Nodule";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import Label from "@/plottables/Label";
import { SELabel } from "@/models/SELabel";
import { SEPointOnOneOrTwoDimensional } from "@/models/SEPointOnOneOrTwoDimensional";
import { AddPointOnOneDimensionalCommand } from "@/commands/AddPointOnOneOrTwoDimensionalCommand";
import { AddPointCommand } from "@/commands/AddPointCommand";
import { ConvertInterPtToUserCreatedCommand } from "@/commands/ConvertInterPtToUserCreatedCommand";
import { SECircle } from "@/models/SECircle";
import { SEPointDistance } from "@/models/SEPointDistance";
import { AddPointDistanceMeasurementCommand } from "@/commands/AddPointDistanceMeasurementCommand";
import { SERotation } from "@/models/SERotation";
import { AddRotationCommand } from "@/commands/AddRotationCommand";
import { Vector3 } from "three";
export default class RotationTransformationHandler extends Highlighter {
  /**
   * Center vector of the created rotation
   */
  private rotationVector = new Vector3();
  /**  The model object point that is the center of the circle (if any) */
  private rotationSEPoint: SEPoint | null = null;
  /** The possible parent of the centerSEPoint*/
  private rotationSEPointOneDimensionalParent: SEOneOrTwoDimensional | null =
    null;
  /**
   * If the user starts to make a circle and mouse press at a location on the sphere (or not on the sphere), then moves
   * off the canvas, then back inside the sphere and mouse releases, we should get nothing. This
   * variable is to help with that.
   */
  private rotationCenterLocationSelected = false;

  /** The possible parent of the measurement that determines the radius of the circle*/
  private measurementSEParent: SEMeasurable | null = null;

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

  constructor(layers: Two.Group[]) {
    super(layers);

    // Create and style the temporary points marking the start/end of an object being created
    this.temporaryRotationPointMarker = new Point();
    this.temporaryRotationPointMarker.stylize(
      DisplayStyle.ApplyTemporaryVariables
    );
    RotationTransformationHandler.store.addTemporaryNodule(
      this.temporaryRotationPointMarker
    );
  }

  mousePressed(_event: MouseEvent): void {
    // First decide if the location of the event is on the sphere
    // if the user has already selected a center do nothing
    if (this.isOnSphere && !this.rotationCenterLocationSelected) {
      // next decide if this tool can be used
      if (
        RotationTransformationHandler.store.seCircles.length === 0 &&
        RotationTransformationHandler.store.seSegments.length === 0 &&
        RotationTransformationHandler.store.expressions.length === 0
      ) {
        // warn the user
        EventBus.fire("show-alert", {
          key: "handlers.firstMustCreateMeasurable",
          type: "error"
        });
        // switch to tools tab
        EventBus.fire("left-panel-set-active-tab", { tabNumber: 0 });
        // Change the tool
        RotationTransformationHandler.store.setActionMode({
          id: "segment",
          name: "CreateLineSegmentDisplayedName"
        });
        return;
      }

      // The user is making a rotation
      this.rotationCenterLocationSelected = true;
      // Check to see if the current location is near any points
      if (this.hitSEPoints.length > 0) {
        // Pick the top most selected point
        const selected = this.hitSEPoints[0];
        // Record the rotation vector of the rotation so it can be past to the rotation
        this.rotationVector.copy(selected.locationVector);
        // Record the model object as the center of the circle
        this.rotationSEPoint = selected;
        // Move the startMarker to the current selected point
        this.temporaryRotationPointMarker.positionVector =
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
        this.temporaryRotationPointMarker.positionVector = this.rotationVector;
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
        this.temporaryRotationPointMarker.positionVector = this.rotationVector;
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
        this.temporaryRotationPointMarker.positionVector = this.rotationVector;
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
        this.temporaryRotationPointMarker.positionVector = this.rotationVector;
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
        this.temporaryRotationPointMarker.positionVector = this.rotationVector;
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
        this.temporaryRotationPointMarker.positionVector = this.rotationVector;
        this.rotationSEPoint = null;
      } else {
        // The mouse press is not near an existing point or one dimensional object.
        //  Eventually, we will create a new SEPoint and Point

        // Move the startMarker to the current mouse location
        this.temporaryRotationPointMarker.positionVector =
          this.currentSphereVector;
        // Record the center vector of the circle so it can be past to the non-temporary circle
        this.rotationVector.copy(this.currentSphereVector);
        // Set the center of the circle to null so it can be created later
        this.rotationSEPoint = null;
      }
      EventBus.fire("show-alert", {
        key: `handlers.rotationPointSelected`,
        keyOptions: {},
        type: "info"
      });
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Find all the nearby (hitSE... objects) and update location vectors
    super.mouseMoved(event);

    // Make sure that the event is on the sphere
    // The user has not selected a rotation point
    if (this.isOnSphere && !this.rotationCenterLocationSelected) {
      // Only object can be interacted with at a given time, so set the first point nearby to glowing
      // The user can create points on ellipses, circles, segments, and lines, so
      // highlight those as well (but only one) if they are nearby also
      // Also set the snap objects
      let possiblyGlowing: SEPoint | SEOneOrTwoDimensional | null = null;
      if (this.hitSEPoints.length > 0) {
        possiblyGlowing = this.hitSEPoints[0];
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
          this.temporaryRotationPointMarker.positionVector =
            this.snapTemporaryRotationPointMarkerToPoint.locationVector;
        } else {
          this.temporaryRotationPointMarker.removeFromLayers();
          this.temporaryRotationPointMarkerAdded = false;
        }
      }
      // Set the location of the temporary startMarker by snapping to appropriate object (if any)
      if (this.snapTemporaryRotationPointMarkerToOneDimensional !== null) {
        this.temporaryRotationPointMarker.positionVector =
          this.snapTemporaryRotationPointMarkerToOneDimensional.closestVector(
            this.currentSphereVector
          );
      } else if (this.snapTemporaryRotationPointMarkerToPoint == null) {
        this.temporaryRotationPointMarker.positionVector =
          this.currentSphereVector;
      }
    }
    // Make sure that the event is on the sphere
    // The user has selected a center point
    else if (this.isOnSphere && this.rotationCenterLocationSelected) {
      // Only object can be interacted with at a given time, so set the first point nearby to glowing
      // The user can create points on ellipses, circles, segments, and lines, so
      // highlight those as well (but only one) if they are nearby also

      const hitLabels = this.hitSELabels.filter(lab =>
        lab.parent.isMeasurable()
      );
      if (this.hitSESegments.length > 0) {
        this.hitSESegments[0].glowing = true;
        this.measurementSEParent = this.hitSESegments[0];
      } else if (this.hitSECircles.length > 0) {
        this.hitSECircles[0].glowing = true;
        this.measurementSEParent = this.hitSECircles[0];
      } else if (this.hitSEPolygons.length > 0) {
        this.hitSEPolygons[0].glowing = true;
        this.measurementSEParent = this.hitSEPolygons[0];
      } else if (this.hitSEAngleMarkers.length > 0) {
        this.hitSEAngleMarkers[0].glowing = true;
        this.measurementSEParent = this.hitSEAngleMarkers[0];
      } else if (hitLabels.length > 0) {
        this.hitSELabels[0].glowing = true;
        this.measurementSEParent = this.hitSELabels[0].parent as SEMeasurable;
      } else {
        this.measurementSEParent = null;
      }
    }
    // Not on the sphere -- remove the temporary circle
    else {
      this.temporaryRotationPointMarker.removeFromLayers();
      this.temporaryRotationPointMarkerAdded = false;
    }
  }

  mouseReleased(_event: MouseEvent): void {
    if (this.isOnSphere) {
      // Make sure the user didn't trigger the mouse leave event and is actually making a rotation
      if (this.rotationCenterLocationSelected) {
        // If the user isn't over measureable object don't do anything
        if (this.measurementSEParent !== null) {
          if (!this.makeRotation()) {
            EventBus.fire("show-alert", {
              key: `handlers.duplicateRotation`,
              keyOptions: {},
              type: "error"
            });
          }
          //reset the tool to handle the next circle
          this.prepareForNextRotation();
        }
      }
    }
  }

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
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
    this.rotationCenterLocationSelected = false;

    this.measurementSEParent = null;
    // call an unglow all command
    RotationTransformationHandler.store.unglowAllSENodules();
  }

  setExpression(expression: SEExpression): void {
    // do nothing if the rotation location is not set
    if (this.rotationCenterLocationSelected) {
      this.measurementSEParent = expression;
      if (!this.makeRotation()) {
        EventBus.fire("show-alert", {
          key: `handlers.duplicateRotation`,
          keyOptions: {},
          type: "error"
        });
      }
      //reset the tool to handle the next circle
      this.prepareForNextRotation();
    }
  }
  /**
   * Add a new rotation if it not a duplicate
   */
  makeRotation(): boolean {
    // Create a command group to add the points defining the circle and the circle to the store
    // This way a single undo click will undo all (potentially three) operations.
    const rotationCommandGroup = new CommandGroup();
    if (this.rotationSEPoint === null) {
      // Starting point landed on an open space
      // we have to create a new point and it to the group/store
      const newRotationPoint = new Point();
      // Set the display to the default values
      newRotationPoint.stylize(DisplayStyle.ApplyCurrentVariables);
      // Adjust the size of the point to the current zoom magnification factor
      newRotationPoint.adjustSize();

      // Create the plottable label
      const newLabel = new Label();
      let newSELabel: SELabel | null = null;

      let vtx: SEPoint | SEPointOnOneOrTwoDimensional | null = null;
      if (this.rotationSEPointOneDimensionalParent) {
        // Starting mouse press landed near a oneDimensional
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneOrTwoDimensional(
          newRotationPoint,
          this.rotationSEPointOneDimensionalParent
        );

        newSELabel = new SELabel(newLabel, vtx);

        rotationCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.rotationSEPointOneDimensionalParent,
            newSELabel
          )
        );
      } else {
        // Starting mouse press landed on an open space
        // Create the model object for the new point and link them
        vtx = new SEPoint(newRotationPoint);
        newSELabel = new SELabel(newLabel, vtx);
        rotationCommandGroup.addCommand(new AddPointCommand(vtx, newSELabel));
      }
      vtx.locationVector = this.rotationVector;
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
      this.rotationSEPoint instanceof SEIntersectionPoint &&
      !this.rotationSEPoint.isUserCreated
    ) {
      // Mark the intersection point as created, the display style is changed and the glowing style is set up
      rotationCommandGroup.addCommand(
        new ConvertInterPtToUserCreatedCommand(this.rotationSEPoint)
      );
    }

    // create the SEExpression based on this.measurementSEParent
    let measurementSEExpression: SEExpression | null = null;

    if (this.measurementSEParent instanceof SESegment) {
      // determine if this SESegment has already been measured
      if (
        !RotationTransformationHandler.store.expressions.some(exp => {
          if (
            exp instanceof SESegmentLength &&
            this.measurementSEParent !== null &&
            exp.seSegment.name === this.measurementSEParent.name
          ) {
            measurementSEExpression = exp;
            return true;
          } else {
            return false;
          }
        })
      ) {
        // the segment has not been measured so create new SEEXpression for the measurement
        measurementSEExpression = new SESegmentLength(this.measurementSEParent);
        EventBus.fire("show-alert", {
          key: `handlers.newSegmentMeasurementAdded`,
          keyOptions: { name: `${measurementSEExpression.name}` },
          type: "success"
        });
        rotationCommandGroup.addCommand(
          new AddLengthMeasurementCommand(
            measurementSEExpression,
            this.measurementSEParent
          )
        );
        if (
          this.measurementSEParent !== null &&
          this.measurementSEParent.label !== undefined
        ) {
          // Set the selected segment's Label to display and to show NameAndValue in an undoable way
          rotationCommandGroup.addCommand(
            new StyleNoduleCommand(
              [this.measurementSEParent.label.ref],
              StyleEditPanels.Label,
              [
                {
                  labelDisplayMode: SETTINGS.segment.measuringChangesLabelModeTo
                }
              ],
              [
                {
                  labelDisplayMode:
                    this.measurementSEParent.label.ref.labelDisplayMode
                }
              ]
            )
          );
          rotationCommandGroup.addCommand(
            new SetNoduleDisplayCommand(this.measurementSEParent.label, true)
          );
        }
      }
    } else if (this.measurementSEParent instanceof SECircle) {
      // make sure that this pair (center point to circle point) has not been measured already
      if (
        !RotationTransformationHandler.store.expressions.some(exp => {
          if (
            exp instanceof SEPointDistance &&
            this.measurementSEParent instanceof SECircle &&
            ((exp.parents[0].name ===
              this.measurementSEParent.circleSEPoint.name &&
              exp.parents[1].name ===
                this.measurementSEParent.centerSEPoint.name) ||
              (exp.parents[0].name ===
                this.measurementSEParent.centerSEPoint.name &&
                exp.parents[1].name ===
                  this.measurementSEParent.circleSEPoint.name))
          ) {
            // distance between points has already been measured don't add a new SEExpression
            measurementSEExpression = exp;
            return true;
          } else {
            return false;
          }
        })
      ) {
        // the distance between the points has not been added so create a new SEExpression to measure the distance

        measurementSEExpression = new SEPointDistance(
          this.measurementSEParent.centerSEPoint,
          this.measurementSEParent.circleSEPoint
        );
        EventBus.fire("show-alert", {
          key: `handlers.newMeasurementAdded`,
          keyOptions: { name: `${measurementSEExpression.name}` },
          type: "success"
        });
        rotationCommandGroup.addCommand(
          new AddPointDistanceMeasurementCommand(measurementSEExpression, [
            this.measurementSEParent.centerSEPoint,
            this.measurementSEParent.circleSEPoint
          ])
        );
      }
    } else {
      measurementSEExpression = this.measurementSEParent as SEExpression;
    }

    // check to make sure that this rotation doesn't already exist
    if (
      RotationTransformationHandler.store.seTransformations.some(
        trans =>
          trans instanceof SERotation &&
          this.tmpVector
            .subVectors(
              trans.seRotationPoint.locationVector,
              this.rotationSEPoint
                ? this.rotationSEPoint.locationVector
                : this.tmpVector1
            )
            .isZero() &&
          measurementSEExpression?.name === trans.seRotationAngleExpression.name
      )
    ) {
      return false;
    }
    if (measurementSEExpression !== null) {
      // create the rotation

      const newMeasuredSERotation = new SERotation(
        this.rotationSEPoint,
        measurementSEExpression
      );

      rotationCommandGroup.addCommand(
        new AddRotationCommand(
          newMeasuredSERotation,
          this.rotationSEPoint,
          measurementSEExpression
        )
      );
      EventBus.fire("show-alert", {
        key: `handlers.newRotationAdded`,
        keyOptions: { name: `${newMeasuredSERotation.name}` },
        type: "success"
      });
    }
    rotationCommandGroup.execute();
    return true;
  }

  activate(): void {
    // Unselect the selected objects and clear the selectedObject array
    super.activate();
  }
  deactivate(): void {
    super.deactivate();
    this.prepareForNextRotation();
  }
}
