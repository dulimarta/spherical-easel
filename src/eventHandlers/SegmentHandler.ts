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
import Highlighter from "./Highlighter";
import { SEOneOrTwoDimensional, SEIntersectionReturnType } from "@/types";
import { SEPointOnOneOrTwoDimensional } from "@/models/SEPointOnOneOrTwoDimensional";
import { SELabel } from "@/models/SELabel";
import EventBus from "./EventBus";
import Two from "two.js";
import { Group } from "two.js/src/group";
import { AddIntersectionPointOtherParentsInfo } from "@/commands/AddIntersectionPointOtherParentsInfo";
import { SEAntipodalPoint } from "@/models/SEAntipodalPoint";
import { SetPointUserCreatedValueCommand } from "@/commands/SetPointUserCreatedValueCommand";
import Settings from "@/views/Settings.vue";

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
  protected snapStartMarkerToTemporaryOneDimensional: SEOneOrTwoDimensional | null =
    null;
  protected snapEndMarkerToTemporaryOneDimensional: SEOneOrTwoDimensional | null =
    null;
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

  // Filter the hitSEPoints appropriately for this handler
  protected filteredIntersectionPointsList: SEPoint[] = [];
  /**
   * A temporary vector to help with normal vector computations
   */
  private tmpVector = new Vector3();
  private tmpVector1 = new Vector3();
  private tmpVector2 = new Vector3();
  private tmpVector3 = new Vector3();

  /**
   * If turnOffLongerThanPi is true, then next call to setArcLengthAndNormalVector, this.longerThanPi is set to false and turnOffLongerThanPi is set to false
   * turnOffLongerThanPi is set to true the first time the ctrl key is pushed and the mouse is moved.
   */
  private turnOffLongerThanPi = false;

  /**
   * Make a segment handler
   * @param layers The TwoGroup array of layer so plottable objects can be put into the correct layers for correct rendering
   */
  constructor(layers: Group[]) {
    super(layers);
    this.temporarySegment = new Segment();
    SegmentHandler.store.addTemporaryNodule(this.temporarySegment);
    this.isTemporarySegmentAdded = false;

    // Create and style the temporary points marking the start/end of an object being created
    this.temporaryStartMarker = new Point();
    SegmentHandler.store.addTemporaryNodule(this.temporaryStartMarker);

    this.temporaryEndMarker = new Point();
    SegmentHandler.store.addTemporaryNodule(this.temporaryEndMarker);
  }

  mousePressed(event: MouseEvent): void {
    // console.debug(`SegmentHandler::mousePressed() (${event.clientX},${event.clientY})`)
    // Do the mouse moved event of the Highlighter so that a new hitSEPoints array will be generated
    // otherwise if the user has finished making an new point, then *without* triggering a mouse move
    // event, mouse press will *not* select the newly created point. This is not what we want so we call super.mouseMove
    super.mouseMoved(event);

    if (this.isOnSphere && !this.startLocationSelected) {
      // The user is making a segment
      this.startLocationSelected = true;
      this.updateFilteredPointsList();

      // Decide if the starting location is near an already existing SEPoint or near a oneDimensional SENodule
      if (this.filteredIntersectionPointsList.length > 0) {
        // Use an existing SEPoint to start the line
        const selected = this.filteredIntersectionPointsList[0];
        this.startVector.copy(selected.locationVector);
        this.startSEPoint = this.filteredIntersectionPointsList[0];
        // Set the start of the temp segment and the startMarker at the location of the selected point
        this.temporaryStartMarker.positionVectorAndDisplay =
          selected.locationVector;
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
        this.temporaryStartMarker.positionVectorAndDisplay = this.startVector;
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
        this.temporaryStartMarker.positionVectorAndDisplay = this.startVector;
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
        this.temporaryStartMarker.positionVectorAndDisplay = this.startVector;
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
        this.temporaryStartMarker.positionVectorAndDisplay = this.startVector;
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
        this.temporaryStartMarker.positionVectorAndDisplay = this.startVector;
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
        this.temporaryStartMarker.positionVectorAndDisplay = this.startVector;
        this.startSEPoint = null;
      } else {
        // The mouse press is not near an existing point or one dimensional object.
        //  Record the location in a temporary point (startMarker found in MouseHandler).
        //  Eventually, we will create a new SEPoint and Point

        // The start vector of the temporary segment and the start marker are
        //  also the the current location on the sphere
        this.temporarySegment.startVector = this.currentSphereVector;
        this.temporaryStartMarker.positionVectorAndDisplay =
          this.currentSphereVector;
        this.startVector.copy(this.currentSphereVector);
        this.startSEPoint = null;
      }
      this.temporaryEndMarker.positionVectorAndDisplay =
        this.currentSphereVector;

      // Set the booleans for describing the segment
      this.nearlyAntipodal = false;
      this.longerThanPi = false;
      this.arcLength = 0;
    }
  }

  mouseMoved(event: MouseEvent): void {
    // console.debug(`SegmentHandler::mouseMoved() (${event.clientX},${event.clientY})`)
    // Highlights the objects near the mouse event
    super.mouseMoved(event);
    // Only object can be interacted with at a given time, so set the first point nearby to glowing
    // The user can create points  on ellipse, circles, segments, and lines, so
    // highlight those as well (but only one) if they are nearby also
    // Also set the snap objects
    this.updateFilteredPointsList();

    if (this.filteredIntersectionPointsList.length > 0) {
      this.filteredIntersectionPointsList[0].glowing = true;
      if (!this.startLocationSelected) {
        this.snapStartMarkerToTemporaryOneDimensional = null;
        this.snapEndMarkerToTemporaryOneDimensional = null;
        this.snapStartMarkerToTemporaryPoint =
          this.filteredIntersectionPointsList[0];
        this.snapEndMarkerToTemporaryPoint = null;
      } else {
        this.snapStartMarkerToTemporaryOneDimensional = null;
        this.snapEndMarkerToTemporaryOneDimensional = null;
        this.snapStartMarkerToTemporaryPoint = null;
        this.snapEndMarkerToTemporaryPoint =
          this.filteredIntersectionPointsList[0];
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
        this.snapStartMarkerToTemporaryOneDimensional =
          this.hitSEParametrics[0];
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
            this.temporaryStartMarker.positionVectorAndDisplay =
              this.snapStartMarkerToTemporaryPoint.locationVector;
          } else {
            this.temporaryStartMarker.removeFromLayers();
            this.isTemporaryStartMarkerAdded = false;
          }
        }
        // Set the location of the temporary startMarker by snapping to appropriate object (if any)
        if (this.snapStartMarkerToTemporaryOneDimensional !== null) {
          this.temporaryStartMarker.positionVectorAndDisplay =
            this.snapStartMarkerToTemporaryOneDimensional.closestVector(
              this.currentSphereVector
            );
        } else if (this.snapStartMarkerToTemporaryPoint == null) {
          this.temporaryStartMarker.positionVectorAndDisplay =
            this.currentSphereVector;
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
          this.temporaryEndMarker.positionVectorAndDisplay =
            this.snapEndMarkerToTemporaryOneDimensional.closestVector(
              this.currentSphereVector
            );
        } else {
          this.temporaryEndMarker.positionVectorAndDisplay =
            this.currentSphereVector;
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
        this.temporarySegment.setVisible(true); //turns off the display of unused two.js portions of the temporary segment (in the non-temporary segments, setVisible is repeatedly called)
      }
    } else if (this.isTemporaryStartMarkerAdded) {
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

  mouseReleased(event: MouseEvent): void {
    // console.debug(`SegmentHandler::mouseReleased() (${event.clientX},${event.clientY})`)
    if (this.isOnSphere) {
      // Make sure the user didn't trigger the mouse leave event and is actually making a segment
      if (this.startLocationSelected) {
        // Before making a new segment make sure that the user has dragged a non-trivial distance
        if (
          this.startVector.angleTo(this.currentSphereVector) >
          SETTINGS.segment.minimumArcLength
        ) {
          if (!this.makeSegment(event.ctrlKey)) {
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
    this.prepareForNextSegment();
  }

  updateFilteredPointsList(): void {
    this.filteredIntersectionPointsList = this.hitSEPoints.filter(pt => {
      if (pt instanceof SEIntersectionPoint) {
        if (pt.principleParent1.showing && pt.principleParent2.showing) {
          return true;
        } else {
          return pt.showing;
        }
      }
      return true;
    });
  }

  prepareForNextSegment(): void {
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
    SegmentHandler.store.unglowAllSENodules();
  }
  private makeSegment(eventCtrlKey: boolean, fromActivate = false): boolean {
    // Create a new command group to store potentially three commands. Those to add the endpoints (which might be new) and the segment itself.
    const segmentGroup = new CommandGroup();
    const newlyCreatedSEPoints: SEPoint[] = [];
    if (this.startSEPoint === null) {
      // We have to create a new SEPointOnOneOrTwoDimensional or SEPoint and Point

      let vtx: SEPoint | SEPointOnOneOrTwoDimensional | null = null;
      let newSELabel: SELabel | null = null;
      if (this.startSEPointOneDimensionalParent) {
        // Starting mouse press landed near a oneDimensional
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneOrTwoDimensional(
          this.startSEPointOneDimensionalParent
        );
        newSELabel = new SELabel("point", vtx);

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
        vtx = new SEPoint();
        newSELabel = new SELabel("point", vtx);
        segmentGroup.addCommand(new AddPointCommand(vtx, newSELabel));
      }

      vtx.locationVector = this.startVector;
      /////////////
      // Create the antipode of the new point, vtx
      const antipode = SegmentHandler.addCreateAntipodeCommand(
        vtx,
        segmentGroup
      );
      newlyCreatedSEPoints.push(vtx, antipode);
      ///////////

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
      (this.startSEPoint instanceof SEIntersectionPoint &&
        !this.startSEPoint.isUserCreated) ||
      (this.startSEPoint instanceof SEAntipodalPoint &&
        !this.startSEPoint.isUserCreated)
    ) {
      // Mark the intersection point as created, the display style is changed and the glowing style is set up
      segmentGroup.addCommand(
        new SetPointUserCreatedValueCommand(this.startSEPoint, true)
      );
    }
    // Look for an endpoint at the mouse release location
    if (this.filteredIntersectionPointsList.length > 0 && !fromActivate) {
      // The end point is an existing point
      this.endSEPoint = this.filteredIntersectionPointsList[0];

      // move the endpoint of the segment to the location of the endpoint
      // This ensures that the initial display of the segment is nice and the endpoint
      // looks like the endpoint and is not off to the side
      this.setArcLengthAndNormalVector(
        eventCtrlKey,
        this.endSEPoint.locationVector
      );
      // Start vector is already set in mouse press
      this.temporarySegment.arcLength = this.arcLength;
      this.temporarySegment.normalVector = this.normalVector;
      this.temporarySegment.updateDisplay();
      this.temporarySegment.setVisible(true); //turns off the display of unused two.js portions of the temporary segment (in the non-temporary segments, setVisible is repeatedly called)

      if (
        (this.endSEPoint instanceof SEIntersectionPoint &&
          !this.endSEPoint.isUserCreated) ||
        (this.endSEPoint instanceof SEAntipodalPoint &&
          !this.endSEPoint.isUserCreated)
      ) {
        // Mark the intersection point as created, the display style is changed and the glowing style is set up
        segmentGroup.addCommand(
          new SetPointUserCreatedValueCommand(this.endSEPoint, true)
        );
      }
    } else if (!fromActivate) {
      // We have to create a new Point for the end

      let vtx: SEPoint | SEPointOnOneOrTwoDimensional | null = null;
      let newSELabel: SELabel | null = null;
      if (this.hitSESegments.length > 0) {
        // The end of the line will be a point on a segment
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneOrTwoDimensional(this.hitSESegments[0]);
        // Set the Location
        vtx.locationVector = this.hitSESegments[0].closestVector(
          this.currentSphereVector
        );
        newSELabel = new SELabel("point", vtx);
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
        vtx = new SEPointOnOneOrTwoDimensional(this.hitSELines[0]);
        // Set the Location
        vtx.locationVector = this.hitSELines[0].closestVector(
          this.currentSphereVector
        );
        newSELabel = new SELabel("point", vtx);

        segmentGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSELines[0],
            newSELabel
          )
        );
      } else if (this.hitSECircles.length > 0) {
        // The end of the line will be a point on a circle
        vtx = new SEPointOnOneOrTwoDimensional(this.hitSECircles[0]);
        // Set the Location
        vtx.locationVector = this.hitSECircles[0].closestVector(
          this.currentSphereVector
        );
        newSELabel = new SELabel("point", vtx);

        segmentGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSECircles[0],
            newSELabel
          )
        );
      } else if (this.hitSEEllipses.length > 0) {
        // The end of the line will be a point on a Ellipse
        vtx = new SEPointOnOneOrTwoDimensional(this.hitSEEllipses[0]);
        // Set the Location
        vtx.locationVector = this.hitSEEllipses[0].closestVector(
          this.currentSphereVector
        );
        newSELabel = new SELabel("point", vtx);

        segmentGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSEEllipses[0],
            newSELabel
          )
        );
      } else if (this.hitSEParametrics.length > 0) {
        // The end of the line will be a point on a Ellipse
        vtx = new SEPointOnOneOrTwoDimensional(this.hitSEParametrics[0]);
        // Set the Location
        vtx.locationVector = this.hitSEParametrics[0].closestVector(
          this.currentSphereVector
        );
        newSELabel = new SELabel("point", vtx);

        segmentGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSEParametrics[0],
            newSELabel
          )
        );
      } else if (this.hitSEPolygons.length > 0) {
        // The end of the line will be a point on a Ellipse
        vtx = new SEPointOnOneOrTwoDimensional(this.hitSEPolygons[0]);
        // Set the Location
        vtx.locationVector = this.hitSEPolygons[0].closestVector(
          this.currentSphereVector
        );
        newSELabel = new SELabel("point", vtx);

        segmentGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.hitSEPolygons[0],
            newSELabel
          )
        );
      } else {
        // The ending mouse release landed on an open space
        vtx = new SEPoint();
        // Set the Location
        vtx.locationVector = this.currentSphereVector;
        newSELabel = new SELabel("point", vtx);

        segmentGroup.addCommand(new AddPointCommand(vtx, newSELabel));
      }
      this.endSEPoint = vtx;
      /////////////
      // Create the antipode of the new point, vtx
      const antipode = SegmentHandler.addCreateAntipodeCommand(
        vtx,
        segmentGroup
      );
      newlyCreatedSEPoints.push(vtx, antipode);
      ///////////
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

    if (this.endSEPoint) {
      // update the display based on the potentially new endSEPoint location
      this.setArcLengthAndNormalVector(
        eventCtrlKey,
        this.endSEPoint.locationVector
      );
      if (this.normalVector === undefined) {
        console.error(
          "The normal vector in segment handler was not set properly. 1"
        );
        return false;
      } //There are some situations in which the mouse actions (hard to duplicate) lead to an undefined normal vector and I'm hoping this will prevent the program from entering an error state.

      // update the location of the endMarker
      this.temporaryEndMarker.positionVectorAndDisplay =
        this.endSEPoint.locationVector;

      // Finally set the values for the unit vectors defining the segment and update the display
      this.temporarySegment.arcLength = this.arcLength;
      this.temporarySegment.normalVector = this.normalVector;
      this.temporarySegment.updateDisplay();
      this.temporarySegment.setVisible(true); //turns off the display of unused two.js portions of the temporary segment (in the non-temporary segments, setVisible is repeatedly called)

      // make sure that this segment hasn't been added before
      if (
        SegmentHandler.store.seSegments.some(
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
                    : this.tmpVector1
                )
                .isZero() &&
                this.tmpVector1
                  .subVectors(
                    seg.startSEPoint.locationVector,
                    this.endSEPoint
                      ? this.endSEPoint.locationVector
                      : this.tmpVector
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
      // Make a new segment from the temporary one and mark it removed from the scene,
      this.isTemporarySegmentAdded = false;

      const newSESegment = new SESegment(
        this.startSEPoint,
        this.normalVector,
        this.arcLength,
        this.endSEPoint
      );
      newSESegment.shallowUpdate();
      // Create Plottable Label
      const newSELabel = newSESegment.attachLabelWithOffset(
        new Vector3(0, SETTINGS.segment.initialLabelOffset, 0)
      );

      segmentGroup.addCommand(
        new AddSegmentCommand(
          newSESegment,
          this.startSEPoint,
          this.endSEPoint,
          newSELabel
        )
      );
      const intersectionPointsToUpdate: SEIntersectionPoint[] = [];

      SegmentHandler.store
        .createAllIntersectionsWith(newSESegment, newlyCreatedSEPoints)
        .forEach((item: SEIntersectionReturnType) => {
          if (item.existingIntersectionPoint) {
            intersectionPointsToUpdate.push(item.SEIntersectionPoint);
            segmentGroup.addCondition(() =>
              item.SEIntersectionPoint.canAddIntersectionOtherParentInfo(item)
            );
            segmentGroup.addCommand(
              new AddIntersectionPointOtherParentsInfo(item)
            );
            segmentGroup.addEndCondition();
          } else {
            // Create the plottable label
            const newSELabel = item.SEIntersectionPoint.attachLabelWithOffset(
              new Vector3(
                2 * SETTINGS.segment.initialLabelOffset,
                SETTINGS.segment.initialLabelOffset,
                0
              )
            );

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
            if (item.createAntipodalPoint) {
              SegmentHandler.addCreateAntipodeCommand(
                item.SEIntersectionPoint,
                segmentGroup
              );
            }
          }
        });
      segmentGroup.execute();
      // The newly added segment passes through all the
      // intersection points on the intersectionPointsToUpdate list
      // This segment might be a new parent to some of them
      // shallowUpdate will check this and change parents as needed
      intersectionPointsToUpdate.forEach(pt => pt.shallowUpdate());
      intersectionPointsToUpdate.splice(0);
    }
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

    // The user can override this algorithm and make the segment longer than PI
    if (ctrlPressed) {
      this.longerThanPi = true;
      this.turnOffLongerThanPi = true;
    } else {
      // this way when the user releases the length is less than pi.
      // Check to see if the longThanPi variable needs updating.
      if (this.arcLength > 2) {
        // The startVector and endVector might be antipodal proceed with caution,
        if (
          this.tmpVector
            .crossVectors(this.startVector, endVector)
            .isZero(
              SETTINGS.nearlyAntipodalIdeal * SETTINGS.boundaryCircle.radius
            )
          // multiply by the boundary circle radius because start/end vector are
          // *screen* vectors and the tolerance to be zero must be larger for them
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
      if (this.turnOffLongerThanPi) {
        this.longerThanPi = false;
        this.turnOffLongerThanPi = false;
      }
    }

    // Update the arcLength based on longThanPi
    if (this.longerThanPi) {
      this.arcLength = 2 * Math.PI - this.arcLength;
    }
  }

  activate(): void {
    // If there are exactly two SEPoints selected,
    // create a segment with the two points as the endpoints of length less than Pi
    if (SegmentHandler.store.selectedSENodules.length == 2) {
      const object1 = SegmentHandler.store.selectedSENodules[0];
      const object2 = SegmentHandler.store.selectedSENodules[1];

      if (object1 instanceof SEPoint && object2 instanceof SEPoint) {
        this.tmpVector.crossVectors(
          object1.locationVector,
          object2.locationVector
        );

        this.startSEPoint = object1;
        this.startVector.copy(this.startSEPoint.locationVector);
        this.endSEPoint = object2;
        // set the normal vector
        this.setArcLengthAndNormalVector(false, this.endSEPoint.locationVector);

        if (!this.makeSegment(false, true)) {
          EventBus.fire("show-alert", {
            key: `handlers.segmentCreationAttemptDuplicate`,
            keyOptions: {},
            type: "error"
          });
        }
        this.prepareForNextSegment();
      }
    }
    // Unselect the selected objects and clear the selectedObject array
    super.activate();
  }
  deactivate(): void {
    super.deactivate();
  }
}
