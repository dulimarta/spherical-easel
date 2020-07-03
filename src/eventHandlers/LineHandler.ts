/** @format */

import { Vector3, Matrix4 } from "three";
import MouseHandler from "./MouseHandler";
import Point from "@/plottables/Point";
import Line from "@/plottables/Line";

import { CommandGroup } from "@/commands/CommandGroup";
import { AddPointCommand } from "@/commands/AddPointCommand";
import { AddLineCommand } from "@/commands/AddLineCommand";
import Two from "two.js";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { SEIntersection } from "@/models/SEIntersection";
import { DisplayStyle } from "@/plottables/Nodule";
import { ShowPointCommand } from "@/commands/ShowPointCommand";
import globalSettings from "@/global-settings";
// const frontPointRadius = SETTINGS.point.temp.radius.front;

export default class LineHandler extends MouseHandler {
  protected startPosition = new Vector3(); // The starting point of the line
  protected currentMidPosition = new Vector3();
  protected nextMidPosition = new Vector3();
  protected tmpVector = new Vector3();

  protected isMouseDown: boolean;
  protected isCircleAdded: boolean;
  private startPoint: SEPoint | null = null;
  private endPoint: SEPoint | null = null;
  private tempLine: Line;
  constructor(layers: Two.Group[]) {
    super(layers);
    this.tempLine = new Line();
    this.tempLine.stylize(DisplayStyle.TEMPORARY);

    this.isMouseDown = false;
    this.isCircleAdded = false;
  }

  mouseMoved(event: MouseEvent): void {
    super.mouseMoved(event);
    if (this.isOnSphere) {
      if (this.isMouseDown) {
        if (!this.isCircleAdded) {
          // Do we need to show the preview circle?
          this.isCircleAdded = true;
          this.canvas.add(this.tempLine);
          // this.line.startPoint = this.startPosition;

          // this.circleOrientation.addTo(this.canvas); // for debugging only
        }
        // The following line automatically calls Line setter function

        this.tmpVector
          .crossVectors(this.startPosition, this.currentSpherePoint)
          .normalize();
        this.tempLine.normalVector = this.tmpVector;
      }
    } else if (this.isCircleAdded) {
      this.tempLine.remove();
      this.startMarker.remove();

      this.isCircleAdded = false;
    }
  }

  //eslint-disable-next-line
  mousePressed(event: MouseEvent): void {
    this.isMouseDown = true;
    this.startPoint = null;
    this.endPoint = null;
    if (this.isOnSphere) {
      // Record the first point of the geodesic circle
      if (this.hitPoints.length > 0) {
        // FIXME: use keyboard input to select an item
        const selected = this.hitPoints[0];
        console.debug("Pressed on an existing point");
        /* the point coordinate is local on the sphere */
        this.startPosition.copy(selected.positionOnSphere);
        this.startPoint = selected;
      } else {
        /* this.currentPoint is already converted to local sphere coordinate frame */
        this.canvas.add(this.startMarker);
        this.startMarker.translation.copy(this.currentScreenPoint);
        this.startPosition.copy(this.currentSpherePoint);
        this.startPoint = null;
      }
      this.tempLine.startPoint = this.currentSpherePoint;
      // The following line automatically calls Line setter function
    }
  }

  private makeCircle(): void {
    this.tmpVector
      .crossVectors(this.startPosition, this.currentSpherePoint)
      .normalize();
    // this.line.endPoint = this.currentSpherePoint;
    // this.endV3Point.copy(this.currentPoint);
    const newLine = this.tempLine.clone(); // true:recursive clone
    // Stylize the new Line
    newLine.stylize(DisplayStyle.DEFAULT);
    // Stylize the glowing Line
    newLine.stylize(DisplayStyle.GLOWING);

    const lineGroup = new CommandGroup();
    if (this.startPoint === null) {
      // Starting point landed on an open space
      // we have to create a new point
      const newStartPoint = new Point();
      // Set the display to the default values
      newStartPoint.stylize(DisplayStyle.DEFAULT);
      // Set the glowing display
      newStartPoint.stylize(DisplayStyle.GLOWING);
      const vtx = new SEPoint(newStartPoint);
      vtx.positionOnSphere = this.startPosition;
      this.startPoint = vtx;
      lineGroup.addCommand(new AddPointCommand(vtx));
    } else if (this.startPoint instanceof SEIntersection) {
      lineGroup.addCommand(new ShowPointCommand(this.startPoint));
    }
    if (this.hitPoints.length > 0) {
      this.endPoint = this.hitPoints[0];
      if (this.endPoint instanceof SEIntersection) {
        lineGroup.addCommand(new ShowPointCommand(this.endPoint));
      }
    } else {
      // endV3Point landed on an open space
      // we have to create a new point
      const newEndPoint = new Point();
      // Set the display to the default values
      newEndPoint.stylize(DisplayStyle.DEFAULT);
      // Set the glowing display
      newEndPoint.stylize(DisplayStyle.GLOWING);
      const vtx = new SEPoint(newEndPoint);
      vtx.positionOnSphere = this.currentSpherePoint;
      this.endPoint = vtx;
      lineGroup.addCommand(new AddPointCommand(vtx));
    }
    const newSELine = new SELine(newLine, this.startPoint, this.endPoint);
    lineGroup.addCommand(new AddLineCommand(newSELine));

    // Determine all new intersection points
    this.store.getters
      .determineIntersectionsWithLine(newSELine)
      .forEach((p: SEIntersection) => {
        p.setShowing(false);
        lineGroup.addCommand(new AddPointCommand(p));
      });
    lineGroup.execute();
  }

  private makePoint(): void {
    // The user is attempting to make a line shorter than the minimum arc length
    // so create  a point at the location of the start vector
    if (this.startPoint === null) {
      // Starting point landed on an open space
      // we have to create a new point and it to the group/store
      const vtx = new SEPoint(new Point());
      vtx.positionOnSphere = this.startPosition;
      const addPoint = new AddPointCommand(vtx);
      addPoint.execute();
    }
  }

  //eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {
    this.isMouseDown = false;
    if (this.isOnSphere) {
      // Record the second point of the geodesic circle
      this.tempLine.remove();
      this.startMarker.remove();

      this.isCircleAdded = false;
      if (
        this.startPosition.angleTo(this.currentSpherePoint) >
        globalSettings.line.minimumLength
      ) {
        this.makeCircle();
      } else this.makePoint();
    }
  }

  // eslint-disable-next-line
  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    // this.isMouseDown = false;
    // if (this.isCircleAdded) {
    //   this.line.remove();
    //   this.startMarker.remove();
    //   this.circleOrientation.remove(); // for debugging
    //   this.isCircleAdded = false;
    // }
  }
}
