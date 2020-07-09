/** @format */

import Two from "two.js";
import { Vector3 } from "three";
import MouseHandler from "./MouseHandler";
import { SEPoint } from "@/models/SEPoint";
import Segment from "@/plottables/Segment";
import Point from "@/plottables/Point";
import { CommandGroup } from "@/commands/CommandGroup";
import { AddPointCommand } from "@/commands/AddPointCommand";
import { AddSegmentCommand } from "@/commands/AddSegmentCommand";
import { AddSegmentMidPointCommand } from "@/commands/AddSegmentMidPointCommand";
import { SESegment } from "@/models/SESegment";
import SETTINGS from "@/global-settings";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { DisplayStyle } from "@/plottables/Nodule";
import { ShowPointCommand } from "@/commands/ShowPointCommand";
import { SESegmentMidPoint } from "@/models/SESegmentMidPoint";
import Highlighter from "./Highlighter";

const MIDPOINT_MOVEMENT_THRESHOLD = SETTINGS.segment.midPointMovementThreshold;

/** Temporary vectors to help with calculations */
const tmpVector1 = new Vector3();
const tmpVector2 = new Vector3();
const tmpTwoVector = new Two.Vector(0, 0);

export default class SegmentHandler extends Highlighter {
  /**
   * The starting unit vector location of the segment
   */
  private startVector = new Vector3();

  /**
   * The ending unit vector location of the segment (only used when the start and end are nearly Antipodal)
   */
  private endVector = new Vector3();
  /**
   * This indicates if the temporary segment has been added to the scene and made permanent
   */
  private isTemporarySegmentAdded = false;
  /**
   * The (model) start and end SEPoints of the line segment
   */
  private startSEPoint: SEPoint | null = null;
  private endSEPoint: SEPoint | null = null;

  /**
   * Indicates if the user is dragging
   */
  private dragging = false;
  /**
   * A temporary plottable (TwoJS) segment to display while the user is creating a segment
   */
  private tempSegment: Segment;

  /**
   * If the user starts to make a segment and mouse press at a location on the sphere, then moves
   * off the canvas, then back inside the sphere and mouse releases, we should get nothing. This
   * variable is to help with that.
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

  /** The unit midVector and temporary unit midVector */
  private midVector = new Vector3();
  private tempMidVector = new Vector3(); // This holds a candidate midpoint vector to see so that if updating the segment moves the midpoint too much

  /**
   * When the start and end vectors are nearly antipodal record an anchor midpoint, so that when the user
   * moves the mouse near the antipode of the startVector, the relative movement of the mouse is used to
   * move the midVector and then using the line connecting the startVector to the midVector and twice the
   * distance from the startVector to the midVector, the endVector is created.
   */
  private anchorMidVector = new Vector3();

  constructor(layers: Two.Group[]) {
    super(layers);
    this.tempSegment = new Segment();
    this.tempSegment.stylize(DisplayStyle.TEMPORARY);
  }

  mousePressed(event: MouseEvent): void {
    // The user is making a segment
    this.makingASegment = true;

    // The user is dragging
    this.dragging = true;
    // The Selection Handler forms a list of all the nearby points
    // If there are nearby points, select the first one to be the start of the segment otherwise
    //  put a end/start marker (a Point found in MouseHandler) in the scene
    if (this.hitPoints.length > 0) {
      const selected = this.hitPoints[0];
      this.startVector.copy(selected.vectorPosition);
      this.startSEPoint = selected;
      // Set the start of the temp segment and the startMarker at the location of the selected point
      this.startMarker.positionVector = selected.vectorPosition;
      this.tempSegment.startVector = selected.vectorPosition;
    } else {
      // The start vector of the temporary segment and the start marker are
      //  also the the current location on the sphere
      this.tempSegment.startVector = this.currentSphereVector;
      this.startMarker.positionVector = this.currentSphereVector;
      this.endMarker.positionVector = this.currentSphereVector;
      this.startVector.copy(this.currentSphereVector);
      this.startSEPoint = null;
    }
    this.startSEPoint = null;
    // Initially the midpoint is the start point
    this.midVector.copy(this.currentSphereVector);
    this.anchorMidVector.copy(this.currentSphereVector);

    // Initialize the booleans for describing the segment
    this.nearlyAntipodal = false;
    this.longerThanPi = false;

    // The previous sphere point is the current one initially
    this.startScreenVector.copy(this.currentScreenVector);
  }

  mouseMoved(event: MouseEvent): void {
    // Highlights the objects near the mouse event
    super.mouseMoved(event);

    // If the mouse event is on the sphere and the user is dragging.
    if (this.isOnSphere) {
      if (this.dragging) {
        // This is executed once per segment to be added
        if (!this.isTemporarySegmentAdded) {
          this.isTemporarySegmentAdded = true;
          // Add the temporary objects to the correct layers
          this.endMarker.addToLayers(this.layers);
          this.startMarker.addToLayers(this.layers);
          this.tempSegment.addToLayers(this.layers);
        }
        this.setMidAndEndVectors(event.ctrlKey, this.currentSphereVector);

        // update the location of the endMarker
        this.endMarker.positionVector = this.endVector;

        // Finally set the values for the unit vectors defining the segment and update the display
        this.tempSegment.midVector = this.midVector;
        this.tempSegment.endVector = this.endVector;
        this.tempSegment.normalVector = tmpVector1
          .crossVectors(this.startVector, this.midVector)
          .normalize();
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
    this.dragging = false;
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
    }
  }

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    this.dragging = false;
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
      vtx.vectorPosition = this.startVector;
      this.startSEPoint = vtx;
      segmentGroup.addCommand(new AddPointCommand(vtx));
    } else if (this.startSEPoint instanceof SEIntersectionPoint) {
      segmentGroup.addCommand(new ShowPointCommand(this.startSEPoint));
    }
    // Look for an endpoint at the mouse release location
    if (this.hitPoints.length > 0) {
      // The end point is an existing point
      this.endSEPoint = this.hitPoints[0];
      // move the endpoint of the segment to the location of the endpoint
      // This ensures that the initial display of the segment is nice and the endpoint
      // looks like the endpoint and is not off to the side
      this.setMidAndEndVectors(event.ctrlKey, this.endSEPoint.vectorPosition);
      this.tempSegment.normalVector = tmpVector1
        .crossVectors(this.startVector, this.midVector)
        .normalize();
      this.tempSegment.updateDisplay();

      if (this.endSEPoint instanceof SEIntersectionPoint) {
        segmentGroup.addCommand(new ShowPointCommand(this.endSEPoint));
      }
    } else {
      // The endpoint is a new point and must be created and added to the command/store
      const newEndPoint = new Point();
      // Set the display to the default values
      newEndPoint.stylize(DisplayStyle.DEFAULT);
      // Set up the glowing display
      newEndPoint.stylize(DisplayStyle.GLOWING);
      const vtx = new SEPoint(newEndPoint);
      vtx.vectorPosition = this.currentSphereVector;
      this.endSEPoint = vtx;
      segmentGroup.addCommand(new AddPointCommand(vtx));
    }

    // The midpoint is a new point and must be created and added to the command/store
    const newMidPoint = new Point();
    // Set the display to the default values
    newMidPoint.stylize(DisplayStyle.DEFAULT);
    // Set the glowing display
    newMidPoint.stylize(DisplayStyle.GLOWING);
    // Set the display of the newMidPoint to false TODO: HANS - WHAT IS THE BEST WAY TO DO THIS?

    const newSEMidPoint = new SESegmentMidPoint(
      newMidPoint,
      this.startSEPoint,
      this.endSEPoint
    );
    newSEMidPoint.vectorPosition = this.midVector;
    segmentGroup.addCommand(new AddSegmentMidPointCommand(newSEMidPoint));
    (newSEMidPoint.ref as any).visible = false;

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
      newSEMidPoint,
      this.endSEPoint
    );
    segmentGroup.addCommand(new AddSegmentCommand(newSESegment));
    this.store.getters
      .determineIntersectionsWithSegment(newSESegment)
      .forEach((p: SEIntersectionPoint) => {
        p.setShowing(false);
        segmentGroup.addCommand(new AddPointCommand(p));
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
      vtx.vectorPosition = this.startVector;
      this.startSEPoint = vtx;
      const addPoint = new AddPointCommand(vtx);
      addPoint.execute();
    }
  }
  /**
   * Set the midpoint vector and the the endpoint vector given a fixed starting vector for a segment
   * @param event
   * @param candidateEndPoint A proposed unit vector location for the end point of the displayed segment
   */
  private setMidAndEndVectors(
    ctrlPressed: boolean,
    candidateEndPoint: Vector3
  ) {
    if (this.startVector.angleTo(candidateEndPoint) > 2) {
      // The startVector and the currentSpherePoint might be antipodal proceed with caution, possibly update longerThanPi
      // The antipodal of the candidateEndPoint
      tmpTwoVector
        .set(candidateEndPoint.x, candidateEndPoint.y)
        .multiplyScalar(-1 * SETTINGS.boundaryCircle.radius);
      if (
        this.startScreenVector.distanceTo(tmpTwoVector) <
        SETTINGS.point.hitPixelDistance
      ) {
        this.nearlyAntipodal = true;
        // record an anchor for controlling the endVector, see the description for anchorMidVector
        this.anchorMidVector.copy(this.midVector);
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
    // The value of longerThanPi is correctly set so use that to create a candidate midVector
    this.tempMidVector
      .addVectors(this.startVector, candidateEndPoint)
      .multiplyScalar(0.5)
      .normalize()
      .multiplyScalar(this.longerThanPi ? -1 : 1);

    // moveAngle is angular change in the midpoint (from midVector to tempMidVector)
    let moveAngle = this.tempMidVector.angleTo(this.midVector);
    if (moveAngle < MIDPOINT_MOVEMENT_THRESHOLD) {
      // For small movement, update the midpoint directly
      this.midVector.copy(this.tempMidVector);
      this.endVector.copy(candidateEndPoint);
    } else {
      // For larger movement rotate in the plane containing tmpMidVector and the (old) midVector
      // Make an orthonormal basis for the plane (old) midVector and tmpMidVector, tmpVector1
      // will be orthogonal to midVector in the direction of tempMidVector
      tmpVector1.crossVectors(this.midVector, this.tempMidVector).normalize();
      tmpVector1.cross(this.midVector).normalize();
      // Now rotate in the (old) midVector by at most the MIDPOINT_MOVEMENT_THRESHOLD
      // That is newMid = cos(moveAngle)oldMid + sin(moveAngle) tmpVector1
      moveAngle = Math.min(
        moveAngle,
        Math.PI - moveAngle //,
        //MIDPOINT_MOVEMENT_THRESHOLD // With this the movement is sometimes slow and you can get an endpoint disconnected from the rest of the segment
      );
      this.midVector.multiplyScalar(Math.cos(moveAngle));
      this.midVector
        .addScaledVector(tmpVector1, Math.sin(moveAngle))
        .normalize();
      // Now that the midVector is set, determine the end vector
      // The arcLength along the tempSegment is twice the distance from startVector to midVector
      const arcLength = 2 * this.startVector.angleTo(this.midVector);

      // For an orthonormal basis for the plane containing startVector and midVector
      // tmpVector1 is perpendicular to startVector in the direction of midVector
      tmpVector1.crossVectors(this.startVector, this.midVector).normalize();
      tmpVector1.cross(this.startVector).normalize();

      // Now compute the vector that is arcLength ways from startVector towards midVector
      // That is endVector = cos(arcLength)startVector + sin(arcLength)tmpVector1
      tmpVector2.copy(this.startVector);
      tmpVector2.multiplyScalar(Math.cos(arcLength));
      tmpVector2.addScaledVector(tmpVector1, Math.sin(arcLength)).normalize();
      this.endVector.copy(tmpVector2);
    }
  }
}
