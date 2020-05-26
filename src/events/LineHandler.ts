/** @format */

import { Vector3 } from "three";
import CursorHandler from "./CursorHandler";
import Arrow from "@/3d-objs/Arrow"; // for debugging
import Point from "@/3d-objs/Point";
import Line from "@/3d-objs/Line";

import SETTINGS from "@/global-settings";
import { CommandGroup } from "@/commands/CommandGroup";
import { AddPointCommand } from "@/commands/AddPointCommand";
import { AddLineCommand } from "@/commands/AddLineCommand";
import Two from "two.js";
export default class LineHandler extends CursorHandler {
  protected startV3Point: Vector3; // The starting point of the line
  protected tmpVector: Vector3;
  protected circleOrientation: Arrow; // for debugging only
  protected isMouseDown: boolean;
  protected isCircleAdded: boolean;
  protected startMarker: Point;
  private startPoint: Point | null = null;
  private endPoint: Point | null = null;
  protected line: Line;

  constructor(scene: Two.Group, isSegment?: boolean) {
    super(scene);
    this.startV3Point = new Vector3();
    this.tmpVector = new Vector3();
    this.startMarker = new Point(5, 0xff8800);
    this.line = new Line(undefined, undefined, isSegment);

    this.circleOrientation = new Arrow(0.5, 0x006600); // debug only
    this.isMouseDown = false;
    this.isCircleAdded = false;
  }

  activate = () => {
    // this.rayCaster.layers.disableAll();
    // this.rayCaster.layers.enable(SETTINGS.layers.sphere);
    // this.rayCaster.layers.enable(SETTINGS.layers.point);
    // The following line automatically calls Line setter function by default
    this.line.isSegment = false;
  };

  mouseMoved(event: MouseEvent) {
    super.mouseMoved(event);
    if (this.isOnSphere) {
      if (this.isMouseDown) {
        if (!this.isCircleAdded) {
          // Do we need to show the preview circle?
          this.isCircleAdded = true;
          this.canvas.add(this.line);
          // this.canvas.add(this.circleOrientation); // for debugging
        }
        // The following line automatically calls Line setter function
        this.tmpVector
          .crossVectors(this.startV3Point, this.currentSpherePoint)
          .normalize();
        this.circleOrientation.sphereLocation = this.tmpVector; // for debugging
        this.line.endPoint = this.currentSpherePoint;
      }
    } else if (this.isCircleAdded) {
      console.debug("LineHandler: OFF sphere");
      this.line.remove();
      this.startMarker.remove();
      this.circleOrientation.remove(); // for debugging
      this.isCircleAdded = false;
    }
  }

  //eslint-disable-next-line
  mousePressed(event: MouseEvent) {
    this.isMouseDown = true;
    this.startPoint = null;
    if (this.isOnSphere) {
      const selected = this.hitObject;

      // Record the first point of the geodesic circle
      if (selected instanceof Point) {
        console.debug("Pressed on an existing point");
        /* the point coordinate is local on the sphere */
        this.startV3Point.copy(selected.positionOnSphere);
        this.startPoint = this.hitObject as Point;
      } else {
        console.debug("Pressed on open area");
        /* this.currentPoint is already converted to local sphere coordinate frame */
        this.canvas.add(this.startMarker);
        this.startMarker.positionOnSphere = this.currentSpherePoint;
        this.startV3Point.copy(this.currentSpherePoint);
        this.startPoint = null;
      }
      // The following line automatically calls Line setter function
      this.line.startPoint = this.currentSpherePoint;
    }
  }

  //eslint-disable-next-line
  mouseReleased(event: MouseEvent) {
    this.isMouseDown = false;
    if (this.isOnSphere) {
      // Record the second point of the geodesic circle
      this.line.remove();
      this.startMarker.remove();
      // this.canvas.remove(this.circleOrientation); // for debugging
      this.isCircleAdded = false;
      // this.endV3Point.copy(this.currentPoint);
      const newLine = this.line.clone(); // true:recursive clone
      const lineGroup = new CommandGroup();
      if (this.startPoint === null) {
        // Starting point landed on an open space
        // we have to create a new point
        const vtx = new Point();
        vtx.positionOnSphere = this.startV3Point;
        this.startPoint = vtx;
        lineGroup.addCommand(new AddPointCommand(vtx));
      }
      if (this.hitObject instanceof Point) {
        this.endPoint = this.hitObject;
      } else {
        // endV3Point landed on an open space
        // we have to create a new point
        const vtx = new Point();
        vtx.positionOnSphere = this.currentSpherePoint;
        this.endPoint = vtx;
        lineGroup.addCommand(new AddPointCommand(vtx));
      }

      lineGroup
        .addCommand(
          new AddLineCommand({
            line: newLine,
            startPoint: this.startPoint,
            endPoint: this.endPoint
          })
        )
        .execute();
      this.startPoint = null;
      this.endPoint = null;
    }
  }
}
