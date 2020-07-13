/** @format */

import { Vector3 } from "three";
import Point from "@/plottables/Point";
import Line from "@/plottables/Line";
import { SENodule } from "@/models/SENodule";
import { CommandGroup } from "@/commands/CommandGroup";
import { AddPointCommand } from "@/commands/AddPointCommand";
import { AddLineCommand } from "@/commands/AddLineCommand";
import Two from "two.js";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { DisplayStyle } from "@/plottables/Nodule";
import SETTINGS from "@/global-settings";
import Highlighter from "./Highlighter";
import { ConvertInterPtToUserCreatedCommand } from "@/commands/ConvertInterPtToUserCreatedCommand";

export default class LineHandler extends Highlighter {
  /**
   * The starting vector location of the line
   */
  private startVector = new Vector3();
  /**
   * The plottable object needs only the normal vector to render the line. This is the normalVector of the temporary line
   */
  private normalVector = new Vector3(0, 0, 0);

  /**
   * The user is dragging to create a line
   */
  private dragging: boolean;

  /**
   * The starting and ending SEPoints of the line
   */
  private startSEPoint: SEPoint | null = null;
  private endSEPoint: SEPoint | null = null;

  /**
   * A temporary line to display while the user is creating a new line
   */
  private tempLine: Line;
  private isTemporaryLineAdded: boolean;

  /**
   * If the user starts to make a line and mouse press at a location on the sphere, then moves
   * off the canvas, then back inside the sphere and mouse releases, we should get nothing. This
   * variable is to help with that. Or if the user mouse press outside the canvas and mouse releases
   * on the canvas, nothing should happen.
   */
  private makingALine = false;

  /**
   * A temporary vector to help with normal vector computations
   */
  private tmpVector = new Vector3();

  /**
   * Make a line handler
   * @param layers The TwoGroup array of layer so plottable objects can be put into the correct layers for correct rendering
   */
  constructor(layers: Two.Group[]) {
    super(layers);
    // Create and style the temporary line
    this.tempLine = new Line();
    this.tempLine.stylize(DisplayStyle.TEMPORARY);
    this.isTemporaryLineAdded = false;

    this.dragging = false;
  }
  //eslint-disable-next-line
  mousePressed(event: MouseEvent): void {
    // Do the mouse moved event of the Highlighter so that a new hitSEPoints array will be generated
    // otherwise if the user has finished making an new point, then *without* triggering a mouse move
    // event, mouse press will *not* select the newly created point. This is not what we want so we call super.mouseMove
    super.mouseMoved(event);

    // The user is making a line
    this.makingALine = true;

    // The user is dragging to add a line
    this.dragging = true;
    // Set the start and end plottable Points to null until they are overridden with actual Points
    this.startSEPoint = null;
    this.endSEPoint = null;

    if (this.isOnSphere) {
      // Decide if the starting location is near an already existing SEPoint
      if (this.hitSEPoints.length > 0) {
        // Use an existing SEPoint to start the line
        const selected = this.hitSEPoints[0];
        this.startVector.copy(selected.locationVector);
        this.startSEPoint = this.hitSEPoints[0];
      } else {
        // The mouse press is not near an existing point.  Record the location in a temporary point (startMarker found in MouseHandler). Eventually, we will create a new SEPoint and Point
        this.startMarker.addToLayers(this.layers);
        this.startMarker.positionVector = this.currentSphereVector;
        this.endMarker.addToLayers(this.layers);
        this.endMarker.positionVector = this.currentSphereVector;
        this.startVector.copy(this.currentSphereVector);
        this.startSEPoint = null;
      }
    }
  }
  mouseMoved(event: MouseEvent): void {
    super.mouseMoved(event);
    if (this.isOnSphere) {
      if (this.dragging) {
        // Do we need to show the temporary line?
        if (!this.isTemporaryLineAdded) {
          this.isTemporaryLineAdded = true;
          this.tempLine.addToLayers(this.layers);
          this.startMarker.addToLayers(this.layers);
          this.endMarker.addToLayers(this.layers);
        }
        // Compute the normal vector from the this.startVector, the (old) normal vector and this.endVector
        // Compute a temporary normal from the two points' vectors
        this.tmpVector
          .crossVectors(this.startVector, this.currentSphereVector)
          .normalize();
        // Check to see if the temporary normal is zero (i.e the start and end vectors are parallel -- ether
        // nearly antipodal or in the same direction)
        if (SENodule.isZero(this.tmpVector)) {
          if (this.normalVector.length() == 0) {
            // The normal vector is still at its initial value so can't be used to compute the next normal, so set the
            // the normal vector to an arbitrarily choosen vector perpendicular to the start vector
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

        // Set the normal vector to the line in the plottable object, this setter calls updateDisplay()
        this.tempLine.normalVector = this.normalVector;
        this.endMarker.positionVector = this.currentSphereVector;
      }
    } else if (this.isTemporaryLineAdded) {
      // Remove the temporary objects
      this.tempLine.removeFromLayers();
      this.startMarker.removeFromLayers();
      this.endMarker.removeFromLayers();
      this.isTemporaryLineAdded = false;
    }
  }
  mouseReleased(event: MouseEvent): void {
    this.dragging = false;
    if (this.isOnSphere) {
      // Make sure the user didn't trigger the mouse leave event and is actually making a segment
      if (this.makingALine) {
        // If the mouse has moved enough create a line otherwise create a point
        if (
          this.startVector.angleTo(this.currentSphereVector) >
          SETTINGS.line.minimumLength
        ) {
          this.makeLine();
        } else {
          this.makePoint();
        }
        // remove the temporary line and markers and get ready for the next line
        this.tempLine.removeFromLayers();
        this.startMarker.removeFromLayers();
        this.endMarker.removeFromLayers();
        this.isTemporaryLineAdded = false;
        this.makingALine = false;
      }
    }
  }

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    this.dragging = false;
    if (this.isTemporaryLineAdded) {
      this.tempLine.removeFromLayers();
      this.startMarker.removeFromLayers();
      this.endMarker.removeFromLayers();
      this.isTemporaryLineAdded = false;
    }
    // Clear old points and values to get ready for creating the next segment.
    this.startSEPoint = null;
    this.endSEPoint = null;
    this.normalVector.set(0, 0, 0);
    this.makingALine = false;
  }

  // Create a new line from the mouse event information
  private makeLine(): void {
    //Create a command group so this can be undone
    const lineGroup = new CommandGroup();
    if (this.startSEPoint === null) {
      // Starting mouse press landed on an open space
      // we have to create a new point
      const newStartPoint = new Point();
      // Set the display to the default values
      newStartPoint.stylize(DisplayStyle.DEFAULT);
      // Set up the glowing display
      newStartPoint.stylize(DisplayStyle.GLOWING);
      const vtx = new SEPoint(newStartPoint);
      vtx.locationVector = this.startVector;
      this.startSEPoint = vtx;
      lineGroup.addCommand(new AddPointCommand(vtx));
    } else if (this.startSEPoint instanceof SEIntersectionPoint) {
      // Mark the intersection point as created, the display style is changed and the glowing style is set up
      lineGroup.addCommand(
        new ConvertInterPtToUserCreatedCommand(this.startSEPoint)
      );
    }
    // Check to see if the release location is near any points
    if (this.hitSEPoints.length > 0) {
      this.endSEPoint = this.hitSEPoints[0];
      if (
        this.endSEPoint instanceof SEIntersectionPoint &&
        !this.endSEPoint.isUserCreated
      ) {
        // Mark the intersection point as created, the display style is changed and the glowing style is set up
        lineGroup.addCommand(
          new ConvertInterPtToUserCreatedCommand(this.endSEPoint)
        );
      }
    } else {
      // The ending mouse release landed on an open space
      // we have to create a new point
      const newEndPoint = new Point();
      // Set the display to the default values
      newEndPoint.stylize(DisplayStyle.DEFAULT);
      // Set up the glowing display
      newEndPoint.stylize(DisplayStyle.GLOWING);
      const vtx = new SEPoint(newEndPoint);
      vtx.locationVector = this.currentSphereVector;
      this.endSEPoint = vtx;
      lineGroup.addCommand(new AddPointCommand(vtx));
    }

    // Compute a temporary normal from the two points' vectors
    this.tmpVector
      .crossVectors(
        this.startSEPoint.locationVector,
        this.endSEPoint.locationVector
      )
      .normalize();
    // Check to see if the temporary normal is zero (i.e the start and end vectors are parallel -- ether
    // nearly antipodal or in the same direction)
    if (SENodule.isZero(this.tmpVector)) {
      // The start and end vectors align, compute the next normal vector from the old normal and the start vector
      this.tmpVector.crossVectors(
        this.startSEPoint.locationVector,
        this.normalVector
      );
      this.tmpVector.crossVectors(
        this.tmpVector,
        this.startSEPoint.locationVector
      );
    }
    this.normalVector.copy(this.tmpVector).normalize();

    // Set the normal vector to the line in the plottable object, this setter calls updateDisplay()
    this.tempLine.normalVector = this.normalVector;

    // Create the new line after the normalVector is set
    const newLine = this.tempLine.clone();
    // Stylize the new Line
    newLine.stylize(DisplayStyle.DEFAULT);
    // Set up the glowing Line
    newLine.stylize(DisplayStyle.GLOWING);

    const newSELine = new SELine(
      newLine,
      this.startSEPoint,
      this.normalVector,
      this.endSEPoint
    );
    lineGroup.addCommand(new AddLineCommand(newSELine));

    // Determine all new intersection points and add their creation to the command so it can be undone
    this.store.getters
      .createAllIntersectionsWithLine(newSELine)
      .forEach((p: SEIntersectionPoint) => {
        lineGroup.addCommand(new AddPointCommand(p));
        p.showing = false; // don not display the automatically created intersection points
      });
    lineGroup.execute();
  }
  /**   * The user is attempting to make a line shorter than the minimum arc length
   * so create  a point at the location of the start vector
   */
  private makePoint(): void {
    if (this.startSEPoint === null) {
      // Starting mouse press landed on an open space
      // we have to create a new point and it to the group/store
      const vtx = new SEPoint(new Point());
      vtx.locationVector = this.startVector;
      const addPoint = new AddPointCommand(vtx);
      addPoint.execute();
    }
  }
}
