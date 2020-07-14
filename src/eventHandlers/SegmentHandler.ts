/** @format */

import Two from "two.js";
import { Vector3 } from "three";
import MouseHandler from "./MouseHandler";
import { SENodule } from "@/models/SENodule";
import { SEPoint } from "@/models/SEPoint";
import Segment from "@/plottables/Segment";
import Point from "@/plottables/Point";
import { CommandGroup } from "@/commands/CommandGroup";
import { AddPointCommand } from "@/commands/AddPointCommand";
import { AddSegmentCommand } from "@/commands/AddSegmentCommand";
import { SESegment } from "@/models/SESegment";
import SETTINGS from "@/global-settings";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { DisplayStyle } from "@/plottables/Nodule";
import Highlighter from "./Highlighter";
import { ConvertInterPtToUserCreatedCommand } from "@/commands/ConvertInterPtToUserCreatedCommand";

const MIDPOINT_MOVEMENT_THRESHOLD = SETTINGS.segment.midPointMovementThreshold;

export default class SegmentHandler extends Highlighter {
  /**
   * The starting unit vector location of the segment
   */
  private startVector = new Vector3();

  /**
   * The (model) start and end SEPoints of the line segment
   */
  private startSEPoint: SEPoint | null = null;
  private endSEPoint: SEPoint | null = null;
  /**
   * The arcLength of the segment
   */
  private arcLength = 0;
  /**
   * Indicates if the user is dragging
   */
  private isDragging = false;
  /**
   * A temporary plottable (TwoJS) segment to display while the user is creating a segment
   */
  private tempSegment: Segment;
  /**
   * This indicates if the temporary segment has been added to the scene and made permanent
   */
  private isTemporarySegmentAdded = false;

  /**
   * If the user starts to make a segment and mouse press at a location on the sphere, then moves
   * off the canvas, then back inside the sphere and mouse releases, we should get nothing. This
   * variable is to help with that. Or if the user mouse press outside the canvas and mouse releases
   * on the canvas, nothing should happen.
   */
  private makingASegment = false;
  /**
   * The location on the ideal unit sphere of the previous location of the mouse event
   * This is used to tell if the currentScreenVector and the startScreenVector are antipodal
   */
  private startScreenVector = new Two.Vector(0, 0);
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
  /**
   * A temporary vector to help with normal vector computations
   */
  private tmpVector = new Vector3();

  /**
   * Make a segment handler
   * @param layers The TwoGroup array of layer so plottable objects can be put into the correct layers for correct rendering
   */
  constructor(layers: Two.Group[]) {
    super(layers);
    this.tempSegment = new Segment();
    this.tempSegment.stylize(DisplayStyle.TEMPORARY);
    this.isTemporarySegmentAdded = false;
    this.isDragging = false;
  }

  mousePressed(event: MouseEvent): void {
    // Only process events from the left (inner) mouse button to avoid adverse interactions with any pop-up menu
    if (event.button != 0) return;

    // Do the mouse moved event of the Highlighter so that a new hitSEPoints array will be generated
    // otherwise if the user has finished making an new point, then *without* triggering a mouse move
    // event, mouse press will *not* select the newly created point. This is not what we want so we call super.mouseMove
    super.mouseMoved(event);

    // The user is making a segment
    this.makingASegment = true;
    // The user is dragging
    this.isDragging = true;
    // The Highlighter forms a list of all the nearby points
    // If there are nearby points, select the first one to be the start of the segment otherwise
    //  put a end/start marker (a Point found in MouseHandler) in the scene
    if (this.hitSEPoints.length > 0) {
      const selected = this.hitSEPoints[0];
      this.startVector.copy(selected.locationVector);
      this.startSEPoint = this.hitSEPoints[0];

      // Set the start of the temp segment and the startMarker at the location of the selected point
      this.startMarker.positionVector = selected.locationVector;
      this.tempSegment.startVector = selected.locationVector;
    } else {
      // The start vector of the temporary segment and the start marker are
      //  also the the current location on the sphere
      this.tempSegment.startVector = this.currentSphereVector;
      this.startMarker.positionVector = this.currentSphereVector;
      this.endMarker.positionVector = this.currentSphereVector;
      this.startVector.copy(this.currentSphereVector);
      this.startSEPoint = null;
    }

    // Set the booleans for describing the segment
    this.nearlyAntipodal = false;
    this.longerThanPi = false;
    this.arcLength = 0;

    // The previous screen point is the current one initially
    this.startScreenVector.copy(this.currentScreenVector);
  }

  mouseMoved(event: MouseEvent): void {
    // Highlights the objects near the mouse event
    super.mouseMoved(event);

    // If the mouse event is on the sphere and the user is dragging.
    if (this.isOnSphere) {
      if (this.isDragging) {
        // This is executed once per segment to be added
        if (!this.isTemporarySegmentAdded) {
          this.isTemporarySegmentAdded = true;
          // Add the temporary objects to the correct layers
          this.endMarker.addToLayers(this.layers);
          // Only add the start marker if the start point is going to be new or is non-user created intersection point
          if (
            this.startSEPoint == null ||
            (this.startSEPoint instanceof SEIntersectionPoint &&
              !this.startSEPoint.isUserCreated)
          ) {
            this.startMarker.addToLayers(this.layers);
          }
          this.tempSegment.addToLayers(this.layers);
        }
        this.setArcLengthAndNormalVector(
          event.ctrlKey,
          this.currentSphereVector
        );

        // update the location of the endMarker
        this.endMarker.positionVector = this.currentSphereVector;

        // Finally set the values for the unit vectors defining the segment and update the display
        this.tempSegment.arcLength = this.arcLength;
        this.tempSegment.normalVector = this.normalVector;
        this.tempSegment.updateDisplay();
      }
    } else if (this.isTemporarySegmentAdded) {
      //if not on the sphere and the temporary segment has been added remove the temporary objects
      this.tempSegment.removeFromLayers();
      this.startMarker.removeFromLayers();
      this.endMarker.removeFromLayers();
      this.isTemporarySegmentAdded = false;
    }
  }

  mouseReleased(event: MouseEvent): void {
    // Only process events from the left (inner) mouse button to avoid adverse interactions with any pop-up menu
    if (event.button != 0) return;

    this.isDragging = false;
    if (this.isOnSphere) {
      //If the release event was on the sphere remove the temporary objects
      this.tempSegment.removeFromLayers();
      this.startMarker.removeFromLayers();
      this.endMarker.removeFromLayers();
      // Make sure the user didn't trigger the mouse leave event and is actually making a segment
      if (this.makingASegment) {
        // Before making a new segment make sure that the user has dragged a non-trivial distance
        // If the user hasn't dragged far enough merely insert a point at the start location
        if (
          this.startVector.angleTo(this.currentSphereVector) >
          SETTINGS.segment.minimumArcLength
        ) {
          this.makeSegment(event);
        } else {
          this.makePoint();
        }
      }
      // Clear old points and values to get ready for creating the next segment.
      this.startSEPoint = null;
      this.endSEPoint = null;
      this.nearlyAntipodal = false;
      this.longerThanPi = false;
      this.makingASegment = false;
      this.arcLength = 0;
    }
  }

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    this.isDragging = false;
    if (this.isTemporarySegmentAdded) {
      this.tempSegment.removeFromLayers();
      this.startMarker.removeFromLayers();
      this.endMarker.removeFromLayers();
      this.isTemporarySegmentAdded = false;
    }
    // Clear old points and values to get ready for creating the next segment.
    this.startSEPoint = null;
    this.endSEPoint = null;
    this.nearlyAntipodal = false;
    this.longerThanPi = false;
    this.makingASegment = false;
    this.arcLength = 0;
  }

  private makeSegment(event: MouseEvent): void {
    // Create a new command group to store potentially three commands. Those to add the endpoints (which might be  new) and the segment itself.
    const segmentGroup = new CommandGroup();
    if (this.startSEPoint === null) {
      // The start point is a new point and must be created and added to the command/store
      const newStartPoint = new Point();
      // Set the display to the default values
      newStartPoint.stylize(DisplayStyle.DEFAULT);
      // Set the glowing display
      newStartPoint.stylize(DisplayStyle.GLOWING);
      const vtx = new SEPoint(newStartPoint);
      vtx.locationVector = this.startVector;
      this.startSEPoint = vtx;
      segmentGroup.addCommand(new AddPointCommand(vtx));
    } else if (this.startSEPoint instanceof SEIntersectionPoint) {
      // Mark the intersection point as created, the display style is changed and the glowing style is set up
      segmentGroup.addCommand(
        new ConvertInterPtToUserCreatedCommand(this.startSEPoint)
      );
    }
    // Look for an endpoint at the mouse release location
    if (this.hitSEPoints.length > 0) {
      // The end point is an existing point
      this.endSEPoint = this.hitSEPoints[0];
      console.log("end name", this.endSEPoint.name);
      // move the endpoint of the segment to the location of the endpoint
      // This ensures that the initial display of the segment is nice and the endpoint
      // looks like the endpoint and is not off to the side
      this.setArcLengthAndNormalVector(
        event.ctrlKey,
        this.endSEPoint.locationVector
      );
      // Start vector is already set in mouse press
      this.tempSegment.arcLength = this.arcLength;
      this.tempSegment.normalVector = this.normalVector;
      this.tempSegment.updateDisplay();

      if (this.endSEPoint instanceof SEIntersectionPoint) {
        // Mark the intersection point as created, the display style is changed and the glowing style is set up
        segmentGroup.addCommand(
          new ConvertInterPtToUserCreatedCommand(this.endSEPoint)
        );
      }
    } else {
      // The endpoint is a new point and must be created and added to the command/store
      const newEndPoint = new Point();
      // Set the display to the default values
      newEndPoint.stylize(DisplayStyle.DEFAULT);
      // Set up the glowing display
      newEndPoint.stylize(DisplayStyle.GLOWING);
      const vtx = new SEPoint(newEndPoint);
      vtx.locationVector = this.currentSphereVector;
      this.endSEPoint = vtx;
      segmentGroup.addCommand(new AddPointCommand(vtx));
    }

    // Clone the temporary segment and mark it added to the scene
    this.isTemporarySegmentAdded = false;
    const newSegment = this.tempSegment.clone();
    // Stylize the new segment
    newSegment.stylize(DisplayStyle.DEFAULT);
    // Set Up the glowing segment
    newSegment.stylize(DisplayStyle.GLOWING);

    const newSESegment = new SESegment(
      newSegment,
      this.startSEPoint,
      this.normalVector,
      this.arcLength,
      this.endSEPoint
    );
    segmentGroup.addCommand(new AddSegmentCommand(newSESegment));
    this.store.getters
      .createAllIntersectionsWithSegment(newSESegment)
      .forEach((p: SEIntersectionPoint) => {
        segmentGroup.addCommand(new AddPointCommand(p));
        p.showing = false; // don not display the automatically created intersection points
      });
    segmentGroup.execute();
  }

  private makePoint(): void {
    // The user is attempting to make a segment smaller than the minimum arc length so
    // create  a point at the location of the start vector
    if (this.startSEPoint === null) {
      // Starting point landed on an open space
      // we have to create a new point and it to the group/store
      const newPoint = new Point();
      // Set the display to the default values
      newPoint.stylize(DisplayStyle.DEFAULT);
      // Set the glowing display
      newPoint.stylize(DisplayStyle.GLOWING);
      const vtx = new SEPoint(newPoint);
      vtx.locationVector = this.startVector;
      this.startSEPoint = vtx;
      const addPoint = new AddPointCommand(vtx);
      addPoint.execute();
    }
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
    this.tmpVector.crossVectors(this.startVector, endVector).normalize();
    // Check to see if the temporary normal is zero (i.e the start and end vectors are parallel -- ether
    // nearly antipodal or in the same direction)
    if (SENodule.isZero(this.tmpVector)) {
      if (this.normalVector.length() == 0) {
        // The normal vector is still at its initial value so can't be used to compute the next normal, so set the
        // the normal vector to an arbitrarily chosen vector perpendicular to the start vector
        this.tmpVector.set(1, 0, 0);
        this.tmpVector.crossVectors(this.startVector, this.tmpVector);
        if (SENodule.isZero(this.tmpVector)) {
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
      // Set tmpVector to the antipode of the start Vector
      this.tmpVector.copy(this.startVector).multiplyScalar(-1);
      if (
        this.tmpVector.angleTo(endVector) * SETTINGS.boundaryCircle.radius <
        SETTINGS.nearlyAntipodalPixel
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
}
