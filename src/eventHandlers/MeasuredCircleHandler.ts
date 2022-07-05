/** @format */

import { Vector3, Matrix4 } from "three";
import Point from "@/plottables/Point";
import Circle from "@/plottables/Circle";
import { CommandGroup } from "@/commands/CommandGroup";
import { AddPointCommand } from "@/commands/AddPointCommand";
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
import {
  SEOneOrTwoDimensional,
  SEIntersectionReturnType,
  SEMeasurable
} from "@/types";
import Label from "@/plottables/Label";
import { SELabel } from "@/models/SELabel";
import EventBus from "./EventBus";
import { SESegment } from "@/models/SESegment";
import { SEAngleMarker } from "@/models/SEAngleMarker";
import { SEPolygon } from "@/models/SEPolygon";
import { SEExpression } from "@/models/SEExpression";
import { SEMeasuredCircle } from "@/models/SEMeasuredCircle";
import { SESegmentLength } from "@/models/SESegmentLength";
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";
import { AddLengthMeasurementCommand } from "@/commands/AddLengthMeasurementCommand";
import { StyleNoduleCommand } from "@/commands/StyleNoduleCommand";
import { StyleEditPanels } from "@/types/Styles";
import { SEPointDistance } from "@/models/SEPointDistance";
import { AddPointDistanceMeasurementCommand } from "@/commands/AddPointDistanceMeasurementCommand";
import NonFreeCircle from "@/plottables/NonFreeCircle";
import NonFreePoint from "@/plottables/NonFreePoint";
import { AddMeasuredCircleCommand } from "@/commands/AddMeasuredCircleCommand";
import { AddIntersectionPointOtherParent } from "@/commands/AddIntersectionPointOtherParent";
import { SENodule } from "@/models/SENodule";
import { getAncestors } from "@/utils/helpingfunctions";

export default class MeasuredCircleHandler extends Highlighter {
  /**
   * Center vector of the created circle
   */
  private centerVector = new Vector3();
  /**  The model object point that is the center of the circle (if any) */
  private centerSEPoint: SEPoint | null = null;
  /** The possible parent of the centerSEPoint*/
  private centerSEPointOneDimensionalParent: SEOneOrTwoDimensional | null =
    null;
  /**
   * If the user starts to make a circle and mouse press at a location on the sphere (or not on the sphere), then moves
   * off the canvas, then back inside the sphere and mouse releases, we should get nothing. This
   * variable is to help with that.
   */
  private centerLocationSelected = false;

  /** The possible parent of the measurement that determines the radius of the circle*/
  private measurementSEParent: SEMeasurable | null = null;

  /**  The temporary plottable TwoJS circle displayed as the user moves the mouse or drags after selecting one point */
  private temporaryCircle: Circle;
  /** The radius of the temporary circle (along the surface of the sphere) */
  private arcRadius = 0;
  /**
   * A temporary plottable (TwoJS) point created while the user is making the circle
   */
  protected temporaryCenterMarker: Point;
  /** Has the temporary circle/tempStartMarker/tempEndMarker been added to the scene?*/
  private temporaryCircleAdded = false;
  private temporaryCenterMarkerAdded = false;

  /**
   * As the user moves the pointer around snap the center temporary marker to these objects temporarily
   */
  protected snapTemporaryPointMarkerToOneDimensional: SEOneOrTwoDimensional | null =
    null;
  protected snapTemporaryPointMarkerToPoint: SEPoint | null = null;

  /* temporary vector and matrix to help with computations */
  private tmpVector = new Vector3();
  private tmpVector1 = new Vector3();
  private tmpMatrix = new Matrix4();

  constructor(layers: Two.Group[]) {
    super(layers);
    this.temporaryCircle = new Circle();
    // Set the style using the temporary defaults
    MeasuredCircleHandler.store.addTemporaryNodule(this.temporaryCircle);
    // Create and style the temporary points marking the start/end of an object being created
    this.temporaryCenterMarker = new Point();
    MeasuredCircleHandler.store.addTemporaryNodule(this.temporaryCenterMarker);
  }

  mousePressed(_event: MouseEvent): void {
    // First decide if the location of the event is on the sphere
    if (this.isOnSphere && !this.centerLocationSelected) {
      // next decide if this tool can be used
      if (
        MeasuredCircleHandler.store.seCircles.length === 0 &&
        MeasuredCircleHandler.store.seSegments.length === 0 &&
        MeasuredCircleHandler.store.expressions.length === 0
      ) {
        // warn the user
        EventBus.fire("show-alert", {
          key: "handlers.firstMustCreateMeasurable",
          type: "error"
        });
        // switch to tools tab
        EventBus.fire("left-panel-set-active-tab", { tabNumber: 0 });
        // Change the tool
        MeasuredCircleHandler.store.setActionMode({
          id: "segment",
          name: "CreateLineSegmentDisplayedName"
        });
        return;
      }
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
        this.temporaryCenterMarker.positionVector = selected.locationVector;
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
        this.temporaryCenterMarker.positionVector = this.centerVector;
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
        this.temporaryCenterMarker.positionVector = this.centerVector;
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
        this.temporaryCenterMarker.positionVector = this.centerVector;
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
        this.temporaryCenterMarker.positionVector = this.centerVector;
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
        this.temporaryCenterMarker.positionVector = this.centerVector;
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
        this.temporaryCenterMarker.positionVector = this.centerVector;
        this.centerSEPoint = null;
      } else {
        // The mouse press is not near an existing point or one dimensional object.
        //  Eventually, we will create a new SEPoint and Point
        // Set the center of the circle in the plottable object - also calls temporaryCircle.readjust()
        this.temporaryCircle.centerVector = this.currentSphereVector;
        // Move the startMarker to the current mouse location
        this.temporaryCenterMarker.positionVector = this.currentSphereVector;
        // Record the center vector of the circle so it can be past to the non-temporary circle
        this.centerVector.copy(this.currentSphereVector);
        // Set the center of the circle to null so it can be created later
        this.centerSEPoint = null;
      }

      if (MeasuredCircleHandler.store.expressions.length > 0) {
        //...open the object tree tab,
        EventBus.fire("left-panel-set-active-tab", { tabNumber: 1 });
        EventBus.fire("expand-measurement-sheet", {});
        EventBus.fire("show-alert", {
          key: `handlers.measuredCircleCenterSelected`,
          keyOptions: {},
          type: "info"
        });
      } else {
        EventBus.fire("show-alert", {
          key: "handlers.measuredCircleSelect",
          type: "info"
        });
      }
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Find all the nearby (hitSE... objects) and update location vectors
    super.mouseMoved(event);

    // Make sure that the event is on the sphere
    // The user has not selected a center point
    if (this.isOnSphere && !this.centerLocationSelected) {
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
        this.snapTemporaryPointMarkerToOneDimensional = null;
        this.snapTemporaryPointMarkerToPoint = null;
      }

      if (possiblyGlowing !== null) {
        if (possiblyGlowing instanceof SEPoint) {
          possiblyGlowing.glowing = true;
          this.snapTemporaryPointMarkerToOneDimensional = null;
          this.snapTemporaryPointMarkerToPoint = possiblyGlowing;
        }
        // possiblyGlowing is a oneDimensional Object
        else {
          possiblyGlowing.glowing = true;
          this.snapTemporaryPointMarkerToOneDimensional = possiblyGlowing;
          this.snapTemporaryPointMarkerToPoint = null;
        }
      }

      // If the temporary startMarker has *not* been added to the scene do so now
      if (!this.temporaryCenterMarkerAdded) {
        this.temporaryCenterMarkerAdded = true;
        this.temporaryCenterMarker.addToLayers(this.layers);
      }
      // Remove the temporary startMarker if there is a nearby point which can glowing
      if (this.snapTemporaryPointMarkerToPoint !== null) {
        // if the user is over a non user created intersection point (which can't be selected so will not remain
        // glowing when the user select that location and then moves the mouse away - see line 115) we don't
        // remove the temporary start marker from the scene, instead we move it to the location of the intersection point
        if (
          this.snapTemporaryPointMarkerToPoint instanceof SEIntersectionPoint &&
          !this.snapTemporaryPointMarkerToPoint.isUserCreated
        ) {
          this.temporaryCenterMarker.positionVector =
            this.snapTemporaryPointMarkerToPoint.locationVector;
        } else {
          this.temporaryCenterMarker.removeFromLayers();
          this.temporaryCenterMarkerAdded = false;
        }
      }
      // Set the location of the temporary startMarker by snapping to appropriate object (if any)
      if (this.snapTemporaryPointMarkerToOneDimensional !== null) {
        this.temporaryCenterMarker.positionVector =
          this.snapTemporaryPointMarkerToOneDimensional.closestVector(
            this.currentSphereVector
          );
      } else if (this.snapTemporaryPointMarkerToPoint == null) {
        this.temporaryCenterMarker.positionVector = this.currentSphereVector;
      }
    }
    // Make sure that the event is on the sphere
    // The user has selected a center point
    else if (this.isOnSphere && this.centerLocationSelected) {
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

      if (this.measurementSEParent !== null) {
        // If the temporary circle has *not* been added to the scene do so now (only once)
        if (!this.temporaryCircleAdded) {
          this.temporaryCircleAdded = true;
          this.temporaryCircle.addToLayers(this.layers);
        }

        //compute the radius of the temporary circle
        if (this.measurementSEParent instanceof SESegment) {
          this.arcRadius = this.measurementSEParent.arcLength;
        } else if (this.measurementSEParent instanceof SECircle) {
          this.arcRadius = this.measurementSEParent.circleRadius;
        } else if (
          this.measurementSEParent instanceof SEPolygon ||
          this.measurementSEParent instanceof SEAngleMarker ||
          this.measurementSEParent instanceof SEExpression
        ) {
          this.arcRadius = this.measurementSEParent.value;
        }

        // Set the radius of the temporary circle, the center was set in Mouse Press
        this.temporaryCircle.circleRadius = this.arcRadius;
        //update the display
        this.temporaryCircle.updateDisplay();
      } else {
        this.temporaryCircle.removeFromLayers();
        this.temporaryCircleAdded = false;
      }
    }
    // Not on the sphere -- remove the temporary circle and point
    else {
      this.temporaryCenterMarker.removeFromLayers();
      this.temporaryCenterMarkerAdded = false;
      this.temporaryCircle.removeFromLayers();
      this.temporaryCircleAdded = false;
    }
  }

  mouseReleased(_event: MouseEvent): void {
    if (this.isOnSphere) {
      // Make sure the user didn't trigger the mouse leave event and is actually making a circle
      if (this.centerLocationSelected) {
        // If the user isn't over  measureable object don't do anything
        if (this.measurementSEParent !== null) {
          if (!this.makeCircle()) {
            EventBus.fire("show-alert", {
              key: `handlers.measuredCircleCreationAttemptDuplicate`,
              keyOptions: {},
              type: "error"
            });
          }
          //reset the tool to handle the next circle
          this.prepareForNextCircle();
        }
      }
    }
  }

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
  }

  prepareForNextCircle(): void {
    // Remove the temporary objects from the scene and mark the temporary object
    //  not added to the scene clear snap objects

    this.temporaryCircle.removeFromLayers();
    this.temporaryCircleAdded = false;

    this.temporaryCenterMarker.removeFromLayers();
    this.temporaryCenterMarkerAdded = false;

    this.snapTemporaryPointMarkerToOneDimensional = null;
    this.snapTemporaryPointMarkerToPoint = null;

    // Clear old points and values to get ready for creating the next circle.
    if (this.centerSEPoint !== null) {
      this.centerSEPoint.glowing = false;
      this.centerSEPoint.selected = false;
    }
    this.centerSEPoint = null;
    this.centerSEPointOneDimensionalParent = null;
    this.centerLocationSelected = false;

    this.measurementSEParent = null;
    // call an unglow all command
    MeasuredCircleHandler.store.unglowAllSENodules();
  }

  displayTemporaryCircle(flag: boolean, radius: number): void {
    // console.log("Center Location Selected", this.centerLocationSelected);
    // console.log("inputs", flag, radius);
    // do nothing if the center location is not set
    if (this.centerLocationSelected) {
      if (flag) {
        if (!this.temporaryCircleAdded) {
          this.temporaryCircleAdded = true;
          this.temporaryCircle.addToLayers(this.layers);
        }
        // Set the radius of the temporary circle,
        this.temporaryCircle.circleRadius = radius.modPi();
        //update the display
        this.temporaryCircle.updateDisplay();
      } else {
        this.temporaryCircle.removeFromLayers();
        this.temporaryCircleAdded = false;
      }
    }
  }
  setExpression(expression: SEExpression): void {
    // do nothing if the center location is not set
    if (this.centerLocationSelected) {
      this.measurementSEParent = expression;
      if (!this.makeCircle()) {
        EventBus.fire("show-alert", {
          key: `handlers.measuredCircleCreationAttemptDuplicate`,
          keyOptions: {},
          type: "error"
        });
      }
      //reset the tool to handle the next circle
      this.prepareForNextCircle();
    }
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

    // create the SEExpression based on this.measurementSEParent
    let measurementSEExpression: SEExpression | null = null;

    if (this.measurementSEParent instanceof SESegment) {
      // determine if this SESegment has already been measured
      if (
        !MeasuredCircleHandler.store.expressions.some(exp => {
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
        circleCommandGroup.addCommand(
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
          circleCommandGroup.addCommand(
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
          circleCommandGroup.addCommand(
            new SetNoduleDisplayCommand(this.measurementSEParent.label, true)
          );
        }
      }
    } else if (this.measurementSEParent instanceof SECircle) {
      // make sure that this pair (center point to circle point) has not been measured already
      if (
        !MeasuredCircleHandler.store.expressions.some(exp => {
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
        circleCommandGroup.addCommand(
          new AddPointDistanceMeasurementCommand(measurementSEExpression, [
            this.measurementSEParent.centerSEPoint,
            this.measurementSEParent.circleSEPoint
          ])
        );
      }
    } else {
      measurementSEExpression = this.measurementSEParent as SEExpression;
    }

    // check to make sure that this measured circle doesn't already exist
    if (
      MeasuredCircleHandler.store.seCircles.some(
        circ =>
          circ instanceof SEMeasuredCircle &&
          this.tmpVector
            .subVectors(
              circ.centerSEPoint.locationVector,
              this.centerSEPoint
                ? this.centerSEPoint.locationVector
                : this.tmpVector1
            )
            .isZero() &&
          measurementSEExpression?.name ===
            circ.radiusMeasurementSEExpression.name
      )
    ) {
      return false;
    }
    if (measurementSEExpression !== null) {
      // create the circle point on the measured circle
      // this point is never visible and is not in the DAG
      // it is only updated when the the new SEMeasuredCircle is updated.
      const hiddenSEPoint = new SEPoint(new NonFreePoint());
      hiddenSEPoint.showing = false; // this never changes
      hiddenSEPoint.exists = true; // this never changes
      // compute the location of the hiddenSEPoint using measurementSEExpression.value.modPi();
      const newRadius = measurementSEExpression.value.modPi();
      // compute a normal to the centerVector, named tmpVector
      this.tmpVector.set(
        -this.centerSEPoint.locationVector.y,
        this.centerSEPoint.locationVector.x,
        0
      );
      // check to see if this vector is zero, if so choose a different way of being perpendicular to the polar point parent
      if (this.tmpVector.isZero()) {
        this.tmpVector.set(
          0,
          -this.centerSEPoint.locationVector.z,
          this.centerSEPoint.locationVector.y
        );
      }
      this.tmpVector.normalize();
      this.tmpVector1
        .copy(this.centerSEPoint.locationVector)
        .multiplyScalar(Math.cos(newRadius));
      this.tmpVector1.addScaledVector(this.tmpVector, Math.sin(newRadius));
      hiddenSEPoint.locationVector = this.tmpVector1.normalize();

      // create the new non free circle
      const newCircle = new NonFreeCircle();
      // Set the display to the default values
      newCircle.stylize(DisplayStyle.ApplyCurrentVariables);
      // Adjust the stroke width to the current zoom magnification factor
      newCircle.adjustSize();
      // set the radius, center and update the display
      newCircle.centerVector = this.centerSEPoint.locationVector;
      newCircle.circleRadius = newRadius;
      newCircle.updateDisplay();

      const newMeasuredSECircle = new SEMeasuredCircle(
        newCircle,
        this.centerSEPoint,
        hiddenSEPoint,
        measurementSEExpression
      );
      // Create the plottable and model label
      const newLabel = new Label();
      const newSELabel = new SELabel(newLabel, newMeasuredSECircle);
      // Set the initial label location
      this.tmpMatrix.makeRotationAxis(
        this.centerSEPoint.locationVector,
        Math.PI / 2
      );
      this.tmpVector
        .copy(hiddenSEPoint.locationVector)
        .applyMatrix4(this.tmpMatrix)
        .add(new Vector3(0, SETTINGS.circle.initialLabelOffset, 0))
        .normalize();
      newSELabel.locationVector = this.tmpVector;

      circleCommandGroup.addCommand(
        new AddMeasuredCircleCommand(
          newMeasuredSECircle,
          this.centerSEPoint,
          measurementSEExpression,
          newSELabel
        )
      );
      // Generate new intersection points. These points must be computed and created
      // in the store. Add the new created points to the circle command so they can be undone.
      MeasuredCircleHandler.store
        .createAllIntersectionsWithCircle(newMeasuredSECircle)
        .forEach((item: SEIntersectionReturnType) => {
          if (item.existingIntersectionPoint) {
            circleCommandGroup.addCommand(
              new AddIntersectionPointOtherParent(
                item.SEIntersectionPoint,
                newMeasuredSECircle
              )
            );
          } else {
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
                // item.parent1,
                // item.parent2,
                newSELabel
              )
            );
            item.SEIntersectionPoint.showing = false; // do not display the automatically created intersection points or label
            newSELabel.showing = false;
          }
        });
    }
    circleCommandGroup.execute();
    return true;
  }

  activate(): void {
    // Unselect the selected objects and clear the selectedObject array
    super.activate();
  }
  deactivate(): void {
    super.deactivate();
    this.prepareForNextCircle();
  }
}
