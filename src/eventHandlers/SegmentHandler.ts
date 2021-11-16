/** @format */

import Two from "two.js";
import { Vector3 } from "three";
import { SEPoint } from "@/models/SEPoint";
import Segment from "@/plottables/Segment";
import Point from "@/plottables/Point";
import { CommandGroup } from "@/commands/CommandGroup";
import { AddPointCommand } from "@/commands/AddPointCommand";
import { AddSegmentCommand } from "@/commands/AddSegmentCommand";
import { AddIntersectionPointCommand } from "@/commands/AddIntersectionPointCommand";
import { AddPointOnOneDimensionalCommand } from "@/commands/AddPointOnOneOrTwoDimensionalCommand";
import { SESegment } from "@/models/SESegment";
import SETTINGS from "@/global-settings";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { DisplayStyle } from "@/plottables/Nodule";
import Highlighter from "./Highlighter";
import { ConvertInterPtToUserCreatedCommand } from "@/commands/ConvertInterPtToUserCreatedCommand";
import { SEOneOrTwoDimensional, SEIntersectionReturnType } from "@/types";
import { SEPointOnOneOrTwoDimensional } from "@/models/SEPointOnOneOrTwoDimensional";
import Label from "@/plottables/Label";
import { SELabel } from "@/models/SELabel";
import { SEStore } from "@/store";
import EventBus from "./EventBus";
export default class SegmentHandler extends Highlighter {
  /**
   * The starting unit vector location of the segment
   */
  private startVector = new Vector3();

  /**
   * The starting and ending SEPoints of the line. The possible parent of the startSEPoint
   */
  private startSEPoint: SEPoint | null = null;
  private endSEPoint: SEPoint | null = null;
  private startSEPointOneDimensionalParent: SEOneOrTwoDimensional | null = null;
  /**
   * The arcLength of the segment
   */
  private arcLength = 0;

  /**
   * A temporary plottable (TwoJS) segment to display while the user is creating a segment
   */
  private temporarySegment: Segment;
  /**
   * This indicates if the temporary segment/end/start marker has been added to the scene and made permanent
   */
  private isTemporarySegmentAdded = false;
  private isTemporaryStartMarkerAdded = false;
  private isTemporaryEndMarkerAdded = false;

  /**
   * As the user moves the pointer around snap the temporary marker to these objects temporarily
   */
  protected snapStartMarkerToTemporaryOneDimensional: SEOneOrTwoDimensional | null = null;
  protected snapEndMarkerToTemporaryOneDimensional: SEOneOrTwoDimensional | null = null;
  protected snapStartMarkerToTemporaryPoint: SEPoint | null = null;
  protected snapEndMarkerToTemporaryPoint: SEPoint | null = null;
  /**
   * A temporary plottable (TwoJS) point created while the user is making segments
   */
  protected temporaryStartMarker: Point;
  /**
   * A temporary plottable (TwoJS) point created while the user is making segments
   */
  protected temporaryEndMarker: Point;
  /**
   * If the user starts to make a segment and mouse press at a location on the sphere, then moves
   * off the canvas, then back inside the sphere and mouse releases, we should get nothing. This
   * variable is to help with that. Or if the user mouse press outside the canvas and mouse releases
   * on the canvas, nothing should happen.
   */
  private startLocationSelected = false;

  /**
   * If the segment being made is long than pi
   */
  private longerThanPi = false;
  /**
   * If the startVector and the currentSpherePoint are nearly antipodal
   */
  private nearlyAntipodal = false;

  /**
   * The unit normal vector to the plane of containing the segment
   */
  private normalVector = new Vector3(0, 0, 0);
  /**;
   * A temporary vector to help with normal vector computations
   */
  private tmpVector = new Vector3();
  private tmpVector1 = new Vector3();
  private tmpVector2 = new Vector3();
  private tmpVector3 = new Vector3();
  /**
   * Make a segment handler
   * @param layers The TwoGroup array of layer so plottable objects can be put into the correct layers for correct rendering
   */
  constructor(layers: Two.Group[]) {
    super(layers);
    this.temporarySegment = new Segment();
    this.temporarySegment.stylize(DisplayStyle.ApplyTemporaryVariables);
    SEStore.addTemporaryNodule(this.temporarySegment);
    this.isTemporarySegmentAdded = false;

    // Create and style the temporary points marking the start/end of an object being created
    this.temporaryStartMarker = new Point();
    this.temporaryStartMarker.stylize(DisplayStyle.ApplyTemporaryVariables);
    SEStore.addTemporaryNodule(this.temporaryStartMarker);
    this.temporaryEndMarker = new Point();
    this.temporaryEndMarker.stylize(DisplayStyle.ApplyTemporaryVariables);
    SEStore.addTemporaryNodule(this.temporaryEndMarker);
  }

  mousePressed(event: MouseEvent): void {
    // Do the mouse moved event of the Highlighter so that a new hitSEPoints array will be generated
    // otherwise if the user has finished making an new point, then *without* triggering a mouse move
    // event, mouse press will *not* select the newly created point. This is not what we want so we call super.mouseMove
    super.mouseMoved(event);

    if (this.isOnSphere && !this.startLocationSelected) {
      // The user is making a segment
      this.startLocationSelected = true;

      // Decide if the starting location is near an already existing SEPoint or near a oneDimensional SENodule
      if (this.hitSEPoints.length > 0) {
        // Use an existing SEPoint to start the line
        const selected = this.hitSEPoints[0];
        this.startVector.copy(selected.locationVector);
        this.startSEPoint = this.hitSEPoints[0];
        // Set the start of the temp segment and the startMarker at the location of the selected point
        this.temporaryStartMarker.positionVector = selected.locationVector;
        this.temporarySegment.startVector = selected.locationVector;
        // Glow the selected point and select it so the highlighter.ts doesn't unglow it with the mouseMoved method
        this.startSEPoint.glowing = true;
        this.startSEPoint.selected = true;
      } else if (this.hitSESegments.length > 0) {
        // The start of the line will be a point on a segment
        //  Eventually, we will create a new SEPointOneDimensional and Point
        this.startSEPointOneDimensionalParent = this.hitSESegments[0];
        this.startVector.copy(
          this.startSEPointOneDimensionalParent.closestVector(
            this.currentSphereVector
          )
        );
        this.temporarySegment.startVector = this.startVector;
        this.temporaryStartMarker.positionVector = this.startVector;
        this.startSEPoint = null;
      } else if (this.hitSELines.length > 0) {
        // The start of the line will be a point on a line
        //  Eventually, we will create a new SEPointOneDimensional and Point
        this.startSEPointOneDimensionalParent = this.hitSELines[0];
        this.startVector.copy(
          this.startSEPointOneDimensionalParent.closestVector(
            this.currentSphereVector
          )
        );
        this.temporarySegment.startVector = this.startVector;
        this.temporaryStartMarker.positionVector = this.startVector;
        this.startSEPoint = null;
      } else if (this.hitSECircles.length > 0) {
        // The start of the line will be a point on a circle
        //  Eventually, we will create a new SEPointOneDimensional and Point
        this.startSEPointOneDimensionalParent = this.hitSECircles[0];
        this.startVector.copy(
          this.startSEPointOneDimensionalParent.closestVector(
            this.currentSphereVector
          )
        );
        this.temporarySegment.startVector = this.startVector;
        this.temporaryStartMarker.positionVector = this.startVector;
        this.startSEPoint = null;
      } else if (this.hitSEEllipses.length > 0) {
        // The start of the line will be a point on a Ellipse
        //  Eventually, we will create a new SEPointOneDimensional and Point
        this.startSEPointOneDimensionalParent = this.hitSEEllipses[0];
        this.startVector.copy(
          this.startSEPointOneDimensionalParent.closestVector(
            this.currentSphereVector
          )
        );
        this.temporarySegment.startVector = this.startVector;
        this.temporaryStartMarker.positionVector = this.startVector;
        this.startSEPoint = null;
      } else if (this.hitSEParametrics.length > 0) {
        // The start of the line will be a point on a Ellipse
        //  Eventually, we will create a new SEPointOneDimensional and Point
        this.startSEPointOneDimensionalParent = this.hitSEParametrics[0];
        this.startVector.copy(
          this.startSEPointOneDimensionalParent.closestVector(
            this.currentSphereVector
          )
        );
        this.temporarySegment.startVector = this.startVector;
        this.temporaryStartMarker.positionVector = this.startVector;
        this.startSEPoint = null;
      } else if (this.hitSEPolygons.length > 0) {
        // The start of the line will be a point on a Ellipse
        //  Eventually, we will create a new SEPointOneDimensional and Point
        this.startSEPointOneDimensionalParent = this.hitSEPolygons[0];
        this.startVector.copy(
          this.startSEPointOneDimensionalParent.closestVector(
            this.currentSphereVector
          )
        );
        this.temporarySegment.startVector = this.startVector;
        this.temporaryStartMarker.positionVector = this.startVector;
        this.startSEPoint = null;
      } else {
        // The mouse press is not near an existing point or one dimensional object.
        //  Record the location in a temporary point (startMarker found in MouseHandler).
        //  Eventually, we will create a new SEPoint and Point

        // The start vector of the temporary segment and the start marker are
        //  also the the current location on the sphere
        this.temporarySegment.startVector = this.currentSphereVector;
        this.temporaryStartMarker.positionVector = this.currentSphereVector;
        this.startVector.copy(this.currentSphereVector);
        this.startSEPoint = null;
      }
      this.temporaryEndMarker.positionVector = this.currentSphereVector;

      // Set the booleans for describing the segment
      this.nearlyAntipodal = false;
      this.longerThanPi = false;
      this.arcLength = 0;
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Highlights the objects near the mouse event
    super.mouseMoved(event);
    // Only object can be interacted with at a given time, so set the first point nearby to glowing
    // The user can create points  on ellipse, circles, segments, and lines, so
    // highlight those as well (but only one) if they are nearby also
    // Also set the snap objects
    if (this.hitSEPoints.length > 0) {
      this.hitSEPoints[0].glowing = true;
      if (!this.startLocationSelected) {
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
      if (!this.startLocationSelected) {
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
      if (!this.startLocationSelected) {
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
      if (!this.startLocationSelected) {
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
      if (!this.startLocationSelected) {
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
      if (!this.startLocationSelected) {
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
      if (!this.startLocationSelected) {
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
      // if startLocationSelected is true, the user has selected a start location
      if (!this.startLocationSelected) {
        // If the temporary startMarker has *not* been added to the scene do so now
        if (!this.isTemporaryStartMarkerAdded) {
          this.isTemporaryStartMarkerAdded = true;
          this.temporaryStartMarker.addToLayers(this.layers);
        }
        // Remove the temporary startMarker if there is a nearby point which can be glowing
        if (this.snapStartMarkerToTemporaryPoint !== null) {
          // if the user is over a non user created intersection point (which can't be selected so will not remain
          // glowing when the user select that location and then moves the mouse away - see line 119) we don't
          // remove the temporary start marker from the scene, instead we move it to the location of the intersection point
          if (
            this.snapStartMarkerToTemporaryPoint instanceof
              SEIntersectionPoint &&
            !this.snapStartMarkerToTemporaryPoint.isUserCreated
          ) {
            this.temporaryStartMarker.positionVector = this.snapStartMarkerToTemporaryPoint.locationVector;
          } else {
            this.temporaryStartMarker.removeFromLayers();
            this.isTemporaryStartMarkerAdded = false;
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
        // If the temporary end/StartMarker has *not* been added to the scene do so now
        if (!this.isTemporaryStartMarkerAdded && this.startSEPoint === null) {
          this.isTemporaryStartMarkerAdded = true;
          this.temporaryStartMarker.addToLayers(this.layers);
        }
        if (!this.isTemporaryEndMarkerAdded) {
          this.isTemporaryEndMarkerAdded = true;
          this.temporaryEndMarker.addToLayers(this.layers);
        }
        // Remove the temporary endMarker if there is a nearby point (which is glowing)
        if (this.snapEndMarkerToTemporaryPoint !== null) {
          this.temporaryEndMarker.removeFromLayers();
          this.isTemporaryEndMarkerAdded = false;
        }
        // Set the location of the temporary endMarker by snapping to appropriate object (if any)
        if (this.snapEndMarkerToTemporaryOneDimensional !== null) {
          this.temporaryEndMarker.positionVector = this.snapEndMarkerToTemporaryOneDimensional.closestVector(
            this.currentSphereVector
          );
        } else {
          this.temporaryEndMarker.positionVector = this.currentSphereVector;
        }

        // If the temporary segment has *not* been added to the scene do so now (only once)
        if (!this.isTemporarySegmentAdded) {
          this.isTemporarySegmentAdded = true;
          this.temporarySegment.addToLayers(this.layers);
        }

        //now set the normal and arcLength variables with the appropriate vector
        if (this.snapEndMarkerToTemporaryPoint === null) {
          this.setArcLengthAndNormalVector(
            event.ctrlKey,
            this.temporaryEndMarker.positionVector
          );
        } else {
          this.setArcLengthAndNormalVector(
            event.ctrlKey,
            this.snapEndMarkerToTemporaryPoint.locationVector
          );
        }

        // Finally set the values for the unit vectors defining the segment and update the display
        this.temporarySegment.arcLength = this.arcLength;
        this.temporarySegment.normalVector = this.normalVector;
        this.temporarySegment.updateDisplay();
      }
    }
    // else if (this.isTemporaryStartMarkerAdded) {
    //   // Remove the temporary objects from the display.
    //   this.temporarySegment.removeFromLayers();
    //   this.temporaryStartMarker.removeFromLayers();
    //   this.temporaryEndMarker.removeFromLayers();
    //   this.isTemporaryStartMarkerAdded = false;
    //   this.isTemporaryEndMarkerAdded = false;
    //   this.isTemporarySegmentAdded = false;

    //   this.snapStartMarkerToTemporaryOneDimensional = null;
    //   this.snapEndMarkerToTemporaryOneDimensional = null;
    //   this.snapStartMarkerToTemporaryPoint = null;
    //   this.snapEndMarkerToTemporaryPoint = null;
    // }
  }

  mouseReleased(event: MouseEvent): void {
    if (this.isOnSphere) {
      // Make sure the user didn't trigger the mouse leave event and is actually making a segment
      if (this.startLocationSelected) {
        // Before making a new segment make sure that the user has dragged a non-trivial distance
        if (
          this.startVector.angleTo(this.currentSphereVector) >
          SETTINGS.segment.minimumArcLength
        ) {
          if (!this.makeSegment(event)) {
            EventBus.fire("show-alert", {
              key: `handlers.segmentCreationAttemptDuplicate`,
              keyOptions: {},
              type: "error"
            });
          }

          this.mouseLeave(event);
        }
      } else {
        // Remove the temporary objects from the display.
        this.temporarySegment.removeFromLayers();
        this.temporaryStartMarker.removeFromLayers();
        this.temporaryEndMarker.removeFromLayers();
        this.isTemporaryStartMarkerAdded = false;
        this.isTemporaryEndMarkerAdded = false;
        this.isTemporarySegmentAdded = false;

        this.snapStartMarkerToTemporaryOneDimensional = null;
        this.snapEndMarkerToTemporaryOneDimensional = null;
        this.snapStartMarkerToTemporaryPoint = null;
        this.snapEndMarkerToTemporaryPoint = null;
      }
    }
  }

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);

    this.temporarySegment.removeFromLayers();
    this.temporaryStartMarker.removeFromLayers();
    this.temporaryEndMarker.removeFromLayers();
    this.isTemporarySegmentAdded = false;
    this.isTemporaryStartMarkerAdded = false;
    this.isTemporaryEndMarkerAdded = false;

    this.snapStartMarkerToTemporaryOneDimensional = null;
    this.snapEndMarkerToTemporaryOneDimensional = null;
    this.snapStartMarkerToTemporaryPoint = null;
    this.snapEndMarkerToTemporaryPoint = null;

    // Clear old points and values to get ready for creating the next segment.
    if (this.startSEPoint) {
      this.startSEPoint.glowing = false;
      this.startSEPoint.selected = false;
    }
    this.startSEPoint = null;
    this.endSEPoint = null;
    this.startSEPointOneDimensionalParent = null;
    this.nearlyAntipodal = false;
    this.longerThanPi = false;
    this.startLocationSelected = false;
    this.arcLength = 0;

    // call an unglow all command
    SEStore.unglowAllSENodules();
  }

  private makeSegment(event: MouseEvent): boolean {
    // Create a new command group to store potentially three commands. Those to add the endpoints (which might be new) and the segment itself.
    const segmentGroup = new CommandGroup();
    if (this.startSEPoint === null) {
      // We have to create a new SEPointOnOneOrTwoDimensional or SEPoint and Point
      const newStartPoint = new Point();
      // Set the display to the default values
      newStartPoint.stylize(DisplayStyle.ApplyCurrentVariables);
      newStartPoint.adjustSize();
      // Create Plottable Label
      const newLabel = new Label();

      let vtx: SEPoint | SEPointOnOneOrTwoDimensional | null = null;
      let newSELabel: SELabel | null = null;
      if (this.startSEPointOneDimensionalParent) {
        // Starting mouse press landed near a oneDimensional
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneOrTwoDimensional(
          newStartPoint,
          this.startSEPointOneDimensionalParent
        );
        newSELabel = new SELabel(newLabel, vtx);

        segmentGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.startSEPointOneDimensionalParent,
            newSELabel
          )
        );
      } else {
        // Starting mouse press landed on an open space
        // Create the model object for the new point and link them
        vtx = new SEPoint(newStartPoint);
        newSELabel = new SELabel(newLabel, vtx);
        segmentGroup.addCommand(new AddPointCommand(vtx, newSELabel));
      }
      vtx.locationVector = this.startVector;
      // Set the initial label location
      this.tmpVector
        .copy(vtx.locationVector)
        .add(
          new Vector3(
            2 * SETTINGS.segment.initialLabelOffset,
            SETTINGS.segment.initialLabelOffset,
            0
          )
        )
        .normalize();
      newSELabel.locationVector = this.tmpVector;

      this.startSEPoint = vtx;
    } else if (
      this.startSEPoint instanceof SEIntersectionPoint &&
      !this.startSEPoint.isUserCreated
    ) {
      // Mark the intersection point as created, the display style is changed and the glowing style is set up
      segmentGroup.addCommand(
        new ConvertInterPtToUserCreatedCommand(this.startSEPoint)
      );
    }
    // Look for an endpoint at the mouse release location
    if (this.hitSEPoints.length > 0) {
      // The end point is an existing point
      this.endSEPoint = this.hitSEPoints[0];

      // move the endpoint of the segment to the location of the endpoint
      // This ensures that the initial display of the segment is nice and the endpoint
      // looks like the endpoint and is not off to the side
      this.setArcLengthAndNormalVector(
        event.ctrlKey,
        this.endSEPoint.locationVector
      );
      // Start vector is already set in mouse press
      this.temporarySegment.arcLength = this.arcLength;
      this.temporarySegment.normalVector = this.normalVector;
      this.temporarySegment.updateDisplay();

      if (
        this.endSEPoint instanceof SEIntersectionPoint &&
        !this.endSEPoint.isUserCreated
      ) {
        // Mark the intersection point as created, the display style is changed and the glowing style is set up
        segmentGroup.addCommand(
          new ConvertInterPtToUserCreatedCommand(this.endSEPoint)
        );
      }
    } else {
      // We have to create a new Point for the end
      const newEndPoint = new Point();
      // Set the display to the default values
      newEndPoint.stylize(DisplayStyle.ApplyCurrentVariables);
      newEndPoint.adjustSize();
      // Create Plottable Label
      const newLabel = new Label();

      let vtx: SEPoint | SEPointOnOneOrTwoDimensional | null = null;
      let newSELabel: SELabel | null = null;
      if (this.hitSESegments.length > 0) {
        // The end of the line will be a point on a segment
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneOrTwoDimensional(
          newEndPoint,
          this.hitSESegments[0]
        );
        // Set the Location
        vtx.locationVector = this.hitSESegments[0].closestVector(
          this.currentSphereVector
        );
        newSELabel = new SELabel(newLabel, vtx);
        segmentGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSESegments[0],
            newSELabel
          )
        );
      } else if (this.hitSELines.length > 0) {
        // The end of the line will be a point on a line
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneOrTwoDimensional(newEndPoint, this.hitSELines[0]);
        // Set the Location
        vtx.locationVector = this.hitSELines[0].closestVector(
          this.currentSphereVector
        );
        newSELabel = new SELabel(newLabel, vtx);

        segmentGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSELines[0],
            newSELabel
          )
        );
      } else if (this.hitSECircles.length > 0) {
        // The end of the line will be a point on a circle
        vtx = new SEPointOnOneOrTwoDimensional(
          newEndPoint,
          this.hitSECircles[0]
        );
        // Set the Location
        vtx.locationVector = this.hitSECircles[0].closestVector(
          this.currentSphereVector
        );
        newSELabel = new SELabel(newLabel, vtx);

        segmentGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSECircles[0],
            newSELabel
          )
        );
      } else if (this.hitSEEllipses.length > 0) {
        // The end of the line will be a point on a Ellipse
        vtx = new SEPointOnOneOrTwoDimensional(
          newEndPoint,
          this.hitSEEllipses[0]
        );
        // Set the Location
        vtx.locationVector = this.hitSEEllipses[0].closestVector(
          this.currentSphereVector
        );
        newSELabel = new SELabel(newLabel, vtx);

        segmentGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSEEllipses[0],
            newSELabel
          )
        );
      } else if (this.hitSEParametrics.length > 0) {
        // The end of the line will be a point on a Ellipse
        vtx = new SEPointOnOneOrTwoDimensional(
          newEndPoint,
          this.hitSEParametrics[0]
        );
        // Set the Location
        vtx.locationVector = this.hitSEParametrics[0].closestVector(
          this.currentSphereVector
        );
        newSELabel = new SELabel(newLabel, vtx);

        segmentGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSEParametrics[0],
            newSELabel
          )
        );
      } else if (this.hitSEPolygons.length > 0) {
        // The end of the line will be a point on a Ellipse
        vtx = new SEPointOnOneOrTwoDimensional(
          newEndPoint,
          this.hitSEPolygons[0]
        );
        // Set the Location
        vtx.locationVector = this.hitSEPolygons[0].closestVector(
          this.currentSphereVector
        );
        newSELabel = new SELabel(newLabel, vtx);

        segmentGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSEPolygons[0],
            newSELabel
          )
        );
      } else {
        // The ending mouse release landed on an open space
        vtx = new SEPoint(newEndPoint);
        // Set the Location
        vtx.locationVector = this.currentSphereVector;
        newSELabel = new SELabel(newLabel, vtx);

        segmentGroup.addCommand(new AddPointCommand(vtx, newSELabel));
      }
      this.endSEPoint = vtx;
      // Set the initial label location
      this.tmpVector
        .copy(vtx.locationVector)
        .add(
          new Vector3(
            2 * SETTINGS.segment.initialLabelOffset,
            SETTINGS.segment.initialLabelOffset,
            0
          )
        )
        .normalize();
      newSELabel.locationVector = this.tmpVector;
    }

    // update the display based on the potentially new endSEPoint location
    this.setArcLengthAndNormalVector(
      event.ctrlKey,
      this.endSEPoint.locationVector
    );

    // update the location of the endMarker
    this.temporaryEndMarker.positionVector = this.endSEPoint.locationVector;

    // Finally set the values for the unit vectors defining the segment and update the display
    this.temporarySegment.arcLength = this.arcLength;
    this.temporarySegment.normalVector = this.normalVector;
    this.temporarySegment.updateDisplay();

    // make sure that this segment hasn't been added before
    if (
      SEStore.seSegments.some(
        seg =>
          ((this.tmpVector
            .subVectors(
              seg.startSEPoint.locationVector,
              this.startSEPoint
                ? this.startSEPoint.locationVector
                : this.tmpVector
            )
            .isZero() &&
            this.tmpVector1
              .subVectors(
                seg.endSEPoint.locationVector,
                this.endSEPoint
                  ? this.endSEPoint.locationVector
                  : this.tmpVector1
              )
              .isZero()) ||
            (this.tmpVector
              .subVectors(
                seg.endSEPoint.locationVector,
                this.startSEPoint
                  ? this.startSEPoint.locationVector
                  : this.tmpVector
              )
              .isZero() &&
              this.tmpVector1
                .subVectors(
                  seg.startSEPoint.locationVector,
                  this.endSEPoint
                    ? this.endSEPoint.locationVector
                    : this.tmpVector1
                )
                .isZero())) &&
          seg.longerThanPi === this.longerThanPi &&
          (this.tmpVector2
            .copy(this.normalVector)
            .sub(seg.normalVector)
            .isZero() ||
            this.tmpVector3
              .copy(this.normalVector)
              .multiplyScalar(-1)
              .sub(seg.normalVector)
              .isZero())
      )
    ) {
      return false;
    }
    // Clone the temporary segment and mark it removed from the scene,
    const newSegment = this.temporarySegment.clone();
    this.isTemporarySegmentAdded = false;
    // Stylize the new segment
    newSegment.stylize(DisplayStyle.ApplyCurrentVariables);
    newSegment.adjustSize();
    // Create Plottable Label
    const newLabel = new Label();

    const newSESegment = new SESegment(
      newSegment,
      this.startSEPoint,
      this.normalVector,
      this.arcLength,
      this.endSEPoint
    );
    const newSELabel = new SELabel(newLabel, newSESegment);
    this.tmpVector
      .addVectors(
        this.startSEPoint.locationVector,
        this.endSEPoint.locationVector
      )
      .normalize()
      .add(new Vector3(0, SETTINGS.segment.initialLabelOffset, 0))
      .normalize();
    if (this.arcLength > Math.PI) {
      this.tmpVector.multiplyScalar(-1);
    }
    newSELabel.locationVector = this.tmpVector;

    segmentGroup.addCommand(
      new AddSegmentCommand(
        newSESegment,
        this.startSEPoint,
        this.endSEPoint,
        newSELabel
      )
    );
    SEStore.createAllIntersectionsWithSegment(newSESegment).forEach(
      (item: SEIntersectionReturnType) => {
        // Create the plottable label
        const newLabel = new Label();
        const newSELabel = new SELabel(newLabel, item.SEIntersectionPoint);
        // Set the initial label location
        this.tmpVector
          .copy(item.SEIntersectionPoint.locationVector)
          .add(
            new Vector3(
              2 * SETTINGS.segment.initialLabelOffset,
              SETTINGS.segment.initialLabelOffset,
              0
            )
          )
          .normalize();
        newSELabel.locationVector = this.tmpVector;

        segmentGroup.addCommand(
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
    segmentGroup.execute();
    return true;
  }

  /**
   * Set the normal vector and arcLength given a fixed starting vector for a segment
   * @param ctrlPressed If the mouse event includes the ctrl key being pressed which forces the segment to be longThanPi
   * @param endVector The unit vector location for the end point of the displayed segment
   */
  private setArcLengthAndNormalVector(
    ctrlPressed: boolean,
    endVector: Vector3
  ) {
    // Compute the normal vector from the this.startVector, the (old) normal vector and this.endVector
    // Compute a temporary normal from the two points' vectors
    this.tmpVector.crossVectors(this.startVector, endVector);
    // Check to see if the temporary normal is zero (i.e the start and end vectors are parallel -- ether
    // nearly antipodal or in the same direction)
    if (this.tmpVector.isZero(SETTINGS.nearlyAntipodalIdeal)) {
      if (this.normalVector.length() == 0) {
        // The normal vector is still at its initial value so can't be used to compute the next normal, so set the
        // the normal vector to an arbitrarily chosen vector perpendicular to the start vector
        this.tmpVector.set(1, 0, 0);
        this.tmpVector.crossVectors(this.startVector, this.tmpVector);
        if (this.tmpVector.isZero(SETTINGS.nearlyAntipodalIdeal)) {
          this.tmpVector.set(0, 1, 0);
          // The cross or startVector and (1,0,0) and (0,1,0) can't *both* be zero
          this.tmpVector.crossVectors(this.startVector, this.tmpVector);
        }
      } else {
        // The start and end vectors align, compute  the next normal vector from the old normal and the start vector
        this.tmpVector.crossVectors(this.startVector, this.normalVector);
        this.tmpVector.crossVectors(this.tmpVector, this.startVector);
      }
    }
    this.normalVector.copy(this.tmpVector).normalize();

    // Set the arc length of the segment temporarily to the angle between start and end vectors (always less than Pi)
    this.arcLength = this.startVector.angleTo(endVector);

    // Check to see if the longThanPi variable needs updating.
    if (this.startVector.angleTo(endVector) > 2) {
      // The startVector and endVector might be antipodal proceed with caution,
      // // Set tmpVector to the antipode of the start Vector
      // this.tmpVector.copy(this.startVector).multiplyScalar(-1);
      // if (
      //   this.tmpVector.angleTo(endVector) * SETTINGS.boundaryCircle.radius <
      //   SETTINGS.nearlyAntipodalPixel
      // ) {
      if (
        this.tmpVector
          .crossVectors(this.startVector, endVector)
          .isZero(SETTINGS.nearlyAntipodalIdeal)
      ) {
        // The points are antipodal on the screen
        this.nearlyAntipodal = true;
      } else {
        if (this.nearlyAntipodal) {
          this.longerThanPi = !this.longerThanPi;
        }
        this.nearlyAntipodal = false;
      }
    }
    // The user can override this algorithm and make the segment longer than PI
    if (ctrlPressed) {
      this.longerThanPi = true;
    }
    // Update the arcLength based on longThanPi
    if (this.longerThanPi) {
      this.arcLength = 2 * Math.PI - this.arcLength;
    }
  }

  activate(): void {
    // If there are exactly two SEPoints selected,
    // create a segment with the two points as the endpoints of length less than Pi
    if (SEStore.selectedSENodules.length == 2) {
      const object1 = SEStore.selectedSENodules[0];
      const object2 = SEStore.selectedSENodules[1];

      if (object1 instanceof SEPoint && object2 instanceof SEPoint) {
        // Create a new plottable Line
        const newSegment = new Segment();
        // Set the display to the default values
        newSegment.stylize(DisplayStyle.ApplyCurrentVariables);
        newSegment.adjustSize();

        this.tmpVector.crossVectors(
          object1.locationVector,
          object2.locationVector
        );
        // Check to see if the points are antipodal
        if (this.tmpVector.isZero(SETTINGS.nearlyAntipodalIdeal)) {
          // They are antipodal, create an arbitrary normal vector
          this.tmpVector.set(1, 0, 0);
          this.tmpVector.crossVectors(object1.locationVector, this.tmpVector);
          if (this.tmpVector.isZero(SETTINGS.nearlyAntipodalIdeal)) {
            this.tmpVector.set(0, 1, 0);
            // The cross of object1.locationVector, and (1,0,0) and (0,1,0) can't *both* be zero
            this.tmpVector.crossVectors(object1.locationVector, this.tmpVector);
          }
        }

        // Add the last command to the group and then execute it (i.e. add the potentially two points and the segment to the store.)
        const newSESegment = new SESegment(
          newSegment,
          object1,
          this.tmpVector.normalize(),
          object1.locationVector.angleTo(object2.locationVector),
          object2
        );
        // Update the newSESegment so the display is correct when the command group is executed
        newSESegment.markKidsOutOfDate();
        newSESegment.update();
        // Create the plottable label
        const newLabel = new Label();
        const newSELabel = new SELabel(newLabel, newSESegment);
        this.tmpVector
          .addVectors(object1.locationVector, object2.locationVector)
          .normalize()
          .add(new Vector3(0, SETTINGS.segment.initialLabelOffset, 0))
          .normalize();
        newSELabel.locationVector = this.tmpVector;

        const segmentCommandGroup = new CommandGroup();
        segmentCommandGroup.addCommand(
          new AddSegmentCommand(newSESegment, object1, object2, newSELabel)
        );

        // Generate new intersection points. These points must be computed and created
        // in the store. Add the new created points to the circle command so they can be undone.
        SEStore.createAllIntersectionsWithSegment(newSESegment).forEach(
          (item: SEIntersectionReturnType) => {
            // Create the plottable label
            const newLabel = new Label();
            const newSELabel = new SELabel(newLabel, item.SEIntersectionPoint);
            // Set the initial label location
            this.tmpVector
              .copy(item.SEIntersectionPoint.locationVector)
              .add(
                new Vector3(
                  2 * SETTINGS.segment.initialLabelOffset,
                  SETTINGS.segment.initialLabelOffset,
                  0
                )
              )
              .normalize();
            newSELabel.locationVector = this.tmpVector;

            segmentCommandGroup.addCommand(
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

        segmentCommandGroup.execute();
      }
    }
    // Unselect the selected objects and clear the selectedObject array
    // super.activate();
  }
  deactivate(): void {
    super.deactivate();
  }
}
