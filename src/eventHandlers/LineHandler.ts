/** @format */

import { Vector3 } from "three";
import Point from "@/plottables/Point";
import Line from "@/plottables/Line";

import { CommandGroup } from "@/commands/CommandGroup";
import { AddPointCommand } from "@/commands/AddPointCommand";
import { AddLineCommand } from "@/commands/AddLineCommand";
import Two from "two.js";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { DisplayStyle } from "@/plottables/Nodule";
import { ShowPointCommand } from "@/commands/ShowPointCommand";
import globalSettings from "@/global-settings";
import Highlighter from "./Highlighter";
// const frontPointRadius = SETTINGS.point.temp.radius.front;

export default class LineHandler extends Highlighter {
  /**
   * The starting vector location of the lines
   */
  protected startVector = new Vector3();
  /**
   * The midpoint is between the start and current mouse location, we keep track of this
   * because if the start and end vectors are antipodal then the line is determined by the start and
   * the midVector
   */
  protected currentMidVector = new Vector3();
  protected nextMidVector = new Vector3();

  /**
   * The user is dragging to create a line
   */
  protected isMouseDown: boolean;

  /**
   * The starting and ending SEPoints of the line
   */
  private startSEPoint: SEPoint | null = null;
  private endSEPoint: SEPoint | null = null;

  /**
   * A temporary line to display while the user is creating a new line
   */
  private tempLine: Line;
  protected isTemporaryLineAdded: boolean;

  /**
   * A temporary vector to help with normal vector computations
   */
  protected tmpVector = new Vector3();

  constructor(layers: Two.Group[]) {
    super(layers);
    // Create and style the temporary line
    this.tempLine = new Line();
    this.tempLine.stylize(DisplayStyle.TEMPORARY);
    this.isTemporaryLineAdded = false;

    this.isMouseDown = false;
  }
  //eslint-disable-next-line
  mousePressed(event: MouseEvent): void {
    // The user is starting to add a line
    this.isMouseDown = true;
    // Set the start and end plottable Points to null until they are overridden with actual Points
    this.startSEPoint = null;
    this.endSEPoint = null;

    if (this.isOnSphere) {
      // Decide if the starting location is near an already existing SEPoint
      if (this.hitPoints.length > 0) {
        // Use an existing SEPoint to start the line
        // FIXME: use keyboard input to select an item
        const selected = this.hitPoints[0];
        this.startVector.copy(selected.vectorPosition);
        this.startSEPoint = selected;
      } else {
        // The mouse press is not near an existing point.  Record the location in a temporary point (startMarker). Eventually, we will create a new SEPoint and Point
        this.startMarker.addToLayers(this.layers);
        this.startMarker.positionVector = this.currentSphereVector;
        this.startVector.copy(this.currentSphereVector);
        this.startSEPoint = null;
      }
      // Set the start plottable Point of the line. Calls a setter in plottable Line.
      this.tempLine.startPoint = this.currentSphereVector;
    }
  }
  mouseMoved(event: MouseEvent): void {
    super.mouseMoved(event);
    if (this.isOnSphere) {
      if (this.isMouseDown) {
        // Do we need to show the temporary line?
        if (!this.isTemporaryLineAdded) {
          this.isTemporaryLineAdded = true;
          this.tempLine.addToLayers(this.layers);
        }
        // The following line automatically calls Line setter function
        this.tmpVector
          .crossVectors(this.startVector, this.currentSphereVector)
          .normalize();
        this.tempLine.normalVector = this.tmpVector;
      }
    } else if (this.isTemporaryLineAdded) {
      // Remove the temporary objects
      this.tempLine.removeFromLayers();
      this.startMarker.removeFromLayers();
      this.isTemporaryLineAdded = false;
    }
  }
  mouseReleased(event: MouseEvent): void {
    this.isMouseDown = false;
    if (this.isOnSphere) {
      // Record the second point of the geodesic circle
      this.tempLine.removeFromLayers();
      this.startMarker.removeFromLayers();
      this.isTemporaryLineAdded = false;
      // If the mouse has moved enough create a line otherwise create a point
      if (
        this.startVector.angleTo(this.currentSphereVector) >
        globalSettings.line.minimumLength
      ) {
        this.makeLine();
      } else {
        this.makePoint();
      }
    }
  }

  // eslint-disable-next-line
  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
  }

  // Create a new line from the mouse event information
  private makeLine(): void {
    // Create the normal vector
    this.tmpVector
      .crossVectors(this.startVector, this.currentSphereVector)
      .normalize();

    // Create the new line
    const newLine = this.tempLine.clone();
    // Stylize the new Line
    newLine.stylize(DisplayStyle.DEFAULT);
    // Set up the glowing Line
    newLine.stylize(DisplayStyle.GLOWING);

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
      vtx.vectorPosition = this.startVector;
      this.startSEPoint = vtx;
      lineGroup.addCommand(new AddPointCommand(vtx));
    } else if (this.startSEPoint instanceof SEIntersectionPoint) {
      // Show the point that the user started with
      lineGroup.addCommand(new ShowPointCommand(this.startSEPoint));
    }
    // Check to see if the release location is near any points
    if (this.hitPoints.length > 0) {
      this.endSEPoint = this.hitPoints[0];
      if (this.endSEPoint instanceof SEIntersectionPoint) {
        lineGroup.addCommand(new ShowPointCommand(this.endSEPoint));
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
      vtx.vectorPosition = this.currentSphereVector;
      this.endSEPoint = vtx;
      lineGroup.addCommand(new AddPointCommand(vtx));
    }

    const newSELine = new SELine(newLine, this.startSEPoint, this.endSEPoint);
    lineGroup.addCommand(new AddLineCommand(newSELine));

    // Determine all new intersection points and add their creation to the command so it can be undone
    this.store.getters
      .determineIntersectionsWithLine(newSELine)
      .forEach((p: SEIntersectionPoint) => {
        p.setShowing(false);
        lineGroup.addCommand(new AddPointCommand(p));
      });
    lineGroup.execute();
  }
  /**
   * The user is attempting to make a line shorter than the minimum arc length
   * so create  a point at the location of the start vector
   */
  private makePoint(): void {
    if (this.startSEPoint === null) {
      // Starting mouse press landed on an open space
      // we have to create a new point and it to the group/store
      const vtx = new SEPoint(new Point());
      vtx.vectorPosition = this.startVector;
      const addPoint = new AddPointCommand(vtx);
      addPoint.execute();
    }
  }

  //eslint-disable-next-line
}
