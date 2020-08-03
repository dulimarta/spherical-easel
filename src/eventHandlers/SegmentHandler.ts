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
import { AddPointOnOneDimensionalCommand } from "@/commands/AddPointOnOneDimensionalCommand";
import { SESegment } from "@/models/SESegment";
import SETTINGS from "@/global-settings";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { DisplayStyle } from "@/plottables/Nodule";
import Highlighter from "./Highlighter";
import { ConvertInterPtToUserCreatedCommand } from "@/commands/ConvertInterPtToUserCreatedCommand";
import { SEOneDimensional, SEIntersectionReturnType } from "@/types";
import { SEPointOnOneDimensional } from "@/models/SEPointOnOneDimensional";
import { UpdateMode } from "@/types";

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
  private startSEPointOneDimensionalParent: SEOneDimensional | null = null;
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
   * A temporary plottable (TwoJS) point created while the user is making the circles or segments
   */
  protected startMarker: Point;
  /**
   * A temporary plottable (TwoJS) point created while the user is making the circles or segments
   */
  protected endMarker: Point;
  /**
   * If the user starts to make a segment and mouse press at a location on the sphere, then moves
   * off the canvas, then back inside the sphere and mouse releases, we should get nothing. This
   * variable is to help with that. Or if the user mouse press outside the canvas and mouse releases
   * on the canvas, nothing should happen.
   */
  private makingASegment = false;

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
    this.tempSegment.stylize(DisplayStyle.APPLYTEMPORARYVARIABLES);
    this.store.commit("addTemporaryNodule", this.tempSegment);
    this.isTemporarySegmentAdded = false;
    this.isDragging = false;
    // Create and style the temporary points marking the start/end of an object being created
    this.startMarker = new Point();
    this.startMarker.stylize(DisplayStyle.APPLYTEMPORARYVARIABLES);
    this.store.commit("addTemporaryNodule", this.startMarker);
    this.endMarker = new Point();
    this.endMarker.stylize(DisplayStyle.APPLYTEMPORARYVARIABLES);
    this.store.commit("addTemporaryNodule", this.endMarker);
  }

  mousePressed(event: MouseEvent): void {
    // Do the mouse moved event of the Highlighter so that a new hitSEPoints array will be generated
    // otherwise if the user has finished making an new point, then *without* triggering a mouse move
    // event, mouse press will *not* select the newly created point. This is not what we want so we call super.mouseMove
    super.mouseMoved(event);

    if (this.isOnSphere) {
      // The user is making a segment
      this.makingASegment = true;

      // The user is dragging to add a line
      this.isDragging = true;

      // Decide if the starting location is near an already existing SEPoint or near a oneDimensional SENodule
      if (this.hitSEPoints.length > 0) {
        // Use an existing SEPoint to start the line
        const selected = this.hitSEPoints[0];
        this.startVector.copy(selected.locationVector);
        this.startSEPoint = this.hitSEPoints[0];
        // Set the start of the temp segment and the startMarker at the location of the selected point
        this.startMarker.positionVector = selected.locationVector;
        this.tempSegment.startVector = selected.locationVector;
      } else if (this.hitSESegments.length > 0) {
        // The start of the line will be a point on a segment
        //  Eventually, we will create a new SEPointOneDimensional and Point
        this.startSEPointOneDimensionalParent = this.hitSESegments[0];
        this.startVector.copy(
          this.startSEPointOneDimensionalParent.closestVector(
            this.currentSphereVector
          )
        );
        this.tempSegment.startVector = this.startVector;
        this.startMarker.positionVector = this.startVector;
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
        this.tempSegment.startVector = this.startVector;
        this.startMarker.positionVector = this.startVector;
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
        this.tempSegment.startVector = this.startVector;
        this.startMarker.positionVector = this.startVector;
        this.startSEPoint = null;
      } else {
        // The mouse press is not near an existing point or one dimensional object.
        //  Record the location in a temporary point (startMarker found in MouseHandler).
        //  Eventually, we will create a new SEPoint and Point

        // The start vector of the temporary segment and the start marker are
        //  also the the current location on the sphere
        this.tempSegment.startVector = this.currentSphereVector;
        this.startMarker.positionVector = this.currentSphereVector;
        this.startVector.copy(this.currentSphereVector);
        this.startSEPoint = null;
      }
      this.endMarker.positionVector = this.currentSphereVector;

      // Set the booleans for describing the segment
      this.nearlyAntipodal = false;
      this.longerThanPi = false;
      this.arcLength = 0;
    }
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
    this.isDragging = false;
    if (this.isOnSphere) {
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
      // Remove the temporary objects
      this.tempSegment.removeFromLayers();
      this.startMarker.removeFromLayers();
      this.endMarker.removeFromLayers();
      // Clear old points and values to get ready for creating the next segment.
      this.startSEPoint = null;
      this.endSEPoint = null;
      this.nearlyAntipodal = false;
      this.longerThanPi = false;
      this.makingASegment = false;
      this.arcLength = 0;
      this.startSEPointOneDimensionalParent = null;
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
    this.startSEPointOneDimensionalParent = null;
    this.nearlyAntipodal = false;
    this.longerThanPi = false;
    this.makingASegment = false;
    this.arcLength = 0;
  }

  private makeSegment(event: MouseEvent): void {
    // Create a new command group to store potentially three commands. Those to add the endpoints (which might be new) and the segment itself.
    const segmentGroup = new CommandGroup();
    if (this.startSEPoint === null) {
      // We have to create a new SEPointOnOneDimensional or SEPoint and Point
      const newStartPoint = new Point();
      // Set the display to the default values
      newStartPoint.stylize(DisplayStyle.APPLYCURRENTVARIABLES);
      newStartPoint.adjustSize();

      let vtx: SEPoint | SEPointOnOneDimensional | null = null;
      if (this.startSEPointOneDimensionalParent) {
        // Starting mouse press landed near a oneDimensional
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneDimensional(
          newStartPoint,
          this.startSEPointOneDimensionalParent
        );
        segmentGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx,
            this.startSEPointOneDimensionalParent
          )
        );
      } else {
        // Starting mouse press landed on an open space
        // Create the model object for the new point and link them
        vtx = new SEPoint(newStartPoint);
        segmentGroup.addCommand(new AddPointCommand(vtx));
      }
      vtx.locationVector = this.startVector;
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
      this.tempSegment.arcLength = this.arcLength;
      this.tempSegment.normalVector = this.normalVector;
      this.tempSegment.updateDisplay();

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
      newEndPoint.stylize(DisplayStyle.APPLYCURRENTVARIABLES);
      newEndPoint.adjustSize();

      let vtx: SEPoint | SEPointOnOneDimensional | null = null;
      if (this.hitSESegments.length > 0) {
        // The end of the line will be a point on a segment
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneDimensional(newEndPoint, this.hitSESegments[0]);
        // Set the Location
        vtx.locationVector = this.hitSESegments[0].closestVector(
          this.currentSphereVector
        );
        segmentGroup.addCommand(
          new AddPointOnOneDimensionalCommand(vtx, this.hitSESegments[0])
        );
      } else if (this.hitSELines.length > 0) {
        // The end of the line will be a point on a line
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneDimensional(newEndPoint, this.hitSELines[0]);
        // Set the Location
        vtx.locationVector = this.hitSELines[0].closestVector(
          this.currentSphereVector
        );
        segmentGroup.addCommand(
          new AddPointOnOneDimensionalCommand(vtx, this.hitSELines[0])
        );
      } else if (this.hitSECircles.length > 0) {
        // The end of the line will be a point on a circle
        vtx = new SEPointOnOneDimensional(newEndPoint, this.hitSECircles[0]);
        // Set the Location
        vtx.locationVector = this.hitSECircles[0].closestVector(
          this.currentSphereVector
        );
        segmentGroup.addCommand(
          new AddPointOnOneDimensionalCommand(vtx, this.hitSECircles[0])
        );
      } else {
        // The ending mouse release landed on an open space
        vtx = new SEPoint(newEndPoint);
        // Set the Location
        vtx.locationVector = this.currentSphereVector;
        segmentGroup.addCommand(new AddPointCommand(vtx));
      }
      this.endSEPoint = vtx;
    }

    // update the display based on the potentially new endSEPoint location
    this.setArcLengthAndNormalVector(
      event.ctrlKey,
      this.endSEPoint.locationVector
    );

    // update the location of the endMarker
    this.endMarker.positionVector = this.endSEPoint.locationVector;

    // Finally set the values for the unit vectors defining the segment and update the display
    this.tempSegment.arcLength = this.arcLength;
    this.tempSegment.normalVector = this.normalVector;
    this.tempSegment.updateDisplay();
    // Clone the temporary segment and mark it added to the scene,
    this.isTemporarySegmentAdded = false;
    const newSegment = this.tempSegment.clone();
    // Stylize the new segment
    newSegment.stylize(DisplayStyle.APPLYCURRENTVARIABLES);
    newSegment.adjustSize();

    const newSESegment = new SESegment(
      newSegment,
      this.startSEPoint,
      this.normalVector,
      this.arcLength,
      this.endSEPoint
    );
    segmentGroup.addCommand(
      new AddSegmentCommand(newSESegment, this.startSEPoint, this.endSEPoint)
    );
    this.store.getters
      .createAllIntersectionsWithSegment(newSESegment)
      .forEach((item: SEIntersectionReturnType) => {
        segmentGroup.addCommand(
          new AddIntersectionPointCommand(
            item.SEIntersectionPoint,
            item.parent1,
            item.parent2
          )
        );
        item.SEIntersectionPoint.showing = false; // do not display the automatically created intersection points
      });
    segmentGroup.execute();
  }

  private makePoint(): void {
    // The user is attempting to make a segment smaller than the minimum arc length so
    // create  a point at the location of the start vector
    if (this.startSEPoint === null) {
      // we have to create a new SEPointOnOneDimensional or SEPoint and Point
      const newPoint = new Point();
      // Set the display to the default values
      newPoint.stylize(DisplayStyle.APPLYCURRENTVARIABLES);
      newPoint.adjustSize();
      let vtx: SEPoint | SEPointOnOneDimensional | null = null;
      if (this.startSEPointOneDimensionalParent) {
        // Starting mouse press landed near a oneDimensional
        // Create the model object for the new point and link them
        vtx = new SEPointOnOneDimensional(
          newPoint,
          this.startSEPointOneDimensionalParent
        );
        // Create and execute the command to create a new point for undo/redo
        new AddPointOnOneDimensionalCommand(
          vtx,
          this.startSEPointOneDimensionalParent
        ).execute();
      } else {
        // Starting mouse press landed on an open space
        // we have to create a new point and it to the group/store
        vtx = new SEPoint(newPoint);
        // Create and execute the command to create a new point for undo/redo
        new AddPointCommand(vtx).execute();
      }
      vtx.locationVector = this.startVector;
    } else if (
      this.startSEPoint instanceof SEIntersectionPoint &&
      !this.startSEPoint.isUserCreated
    ) {
      // Mark the intersection point as created, the display style is changed and the glowing style is set up
      new ConvertInterPtToUserCreatedCommand(this.startSEPoint).execute();
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
    this.tmpVector.crossVectors(this.startVector, endVector);
    // Check to see if the temporary normal is zero (i.e the start and end vectors are parallel -- ether
    // nearly antipodal or in the same direction)
    if (this.tmpVector.isZero()) {
      this.tmpVector.crossVectors(this.startVector, endVector).normalize();
      if (this.normalVector.length() == 0) {
        // The normal vector is still at its initial value so can't be used to compute the next normal, so set the
        // the normal vector to an arbitrarily chosen vector perpendicular to the start vector
        this.tmpVector.set(1, 0, 0);
        this.tmpVector.crossVectors(this.startVector, this.tmpVector);
        if (this.tmpVector.isZero()) {
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

  activate(): void {
    // If there are exactly two SEPoints selected,
    // create a segment with the two points as the endpoints of length less than Pi
    if (this.store.getters.selectedSENodules().length == 2) {
      const object1 = this.store.getters.selectedSENodules()[0];
      const object2 = this.store.getters.selectedSENodules()[1];

      if (object1 instanceof SEPoint && object2 instanceof SEPoint) {
        // Create a new plottable Line
        const newSegment = new Segment();
        // Set the display to the default values
        newSegment.stylize(DisplayStyle.APPLYCURRENTVARIABLES);
        newSegment.adjustSize();

        this.tmpVector.crossVectors(
          object1.locationVector,
          object2.locationVector
        );
        // Check to see if the points are antipodal
        if (this.tmpVector.isZero()) {
          // They are antipodal, create an arbitrary normal vector
          this.tmpVector.set(1, 0, 0);
          this.tmpVector.crossVectors(object1.locationVector, this.tmpVector);
          if (this.tmpVector.isZero()) {
            this.tmpVector.set(0, 1, 0);
            // The cross of object1.locationVector, and (1,0,0) and (0,1,0) can't *both* be zero
            this.tmpVector.crossVectors(object1.locationVector, this.tmpVector);
          }
        }

        // Add the last command to the group and then execute it (i.e. add the potentially two points and the circle to the store.)
        const newSESegment = new SESegment(
          newSegment,
          object1,
          this.tmpVector.normalize(),
          object1.locationVector.angleTo(object2.locationVector),
          object2
        );
        // Update the newSECircle so the display is correct when the command group is executed
        newSESegment.update({
          mode: UpdateMode.DisplayOnly,
          stateArray: []
        });

        const segmentCommandGroup = new CommandGroup();
        segmentCommandGroup.addCommand(
          new AddSegmentCommand(newSESegment, object1, object2)
        );

        // Generate new intersection points. These points must be computed and created
        // in the store. Add the new created points to the circle command so they can be undone.
        this.store.getters
          .createAllIntersectionsWithSegment(newSESegment)
          .forEach((item: SEIntersectionReturnType) => {
            segmentCommandGroup.addCommand(
              new AddIntersectionPointCommand(
                item.SEIntersectionPoint,
                item.parent1,
                item.parent2
              )
            );
            item.SEIntersectionPoint.showing = false; // don not display the automatically created intersection points
          });

        segmentCommandGroup.execute();
      }
    }
    // Unselect the selected objects and clear the selectedObject array
    // super.activate();
  }
}
