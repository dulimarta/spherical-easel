import { Vector3, Camera, Scene } from "three";
import CursorHandler from "./CursorHandler";
// import Arrow from "@/3d-objs/Arrow";
import Point from "@/3d-objs/Point";
import SETTINGS from "@/global-settings";
import { CommandGroup } from "@/commands/CommandGroup";
import { AddPointCommand } from "@/commands/AddPointCommand";
import { AddLineCommand } from "@/commands/AddLineCommand";
export default class LineHandler extends CursorHandler {
  protected startV3Point: Vector3;
  protected endV3Point: Vector3;
  // private normalArrow: Arrow;
  protected isMouseDown: boolean;
  protected isCircleAdded: boolean;
  protected startDot: Point;
  private startPoint: Point | null = null;
  private endPoint: Point | null = null;
  constructor({ camera, scene }: { camera: Camera; scene: Scene }) {
    super({ camera, scene });
    this.startV3Point = new Vector3();
    this.endV3Point = new Vector3();
    this.startDot = new Point();
    // this.normalArrow = new Arrow(1.5, 0xff6600);
    this.isMouseDown = false;
    this.isCircleAdded = false;
  }

  activate = () => {
    this.rayCaster.layers.disableAll();
    this.rayCaster.layers.enable(SETTINGS.layers.sphere);
    this.rayCaster.layers.enable(SETTINGS.layers.point);
    // The following line automatically calls Line setter function by default
    this.line.isSegment = false;
  };

  mouseMoved(event: MouseEvent) {
    super.mouseMoved(event);
    if (this.isOnSphere) {
      if (this.isMouseDown && this.theSphere) {
        if (!this.isCircleAdded) {
          this.isCircleAdded = true;
          this.theSphere.add(this.line);
          // this.scene.add(this.startDot);
        }
        // The following line automatically calls Line setter function
        this.line.endV3Point = this.currentV3Point;
      }
    } else if (this.isCircleAdded) {
      this.theSphere?.remove(this.line);
      this.theSphere?.remove(this.startDot);
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
        /* the point coordinate is local on the sphere */
        this.startV3Point.copy(selected.position);
        this.startPoint = this.hitObject;
      } else {
        /* this.currentV3Point is already converted to local sphere coordinate frame */
        this.theSphere?.add(this.startDot);
        this.startV3Point.copy(this.currentV3Point);
        this.startPoint = null;
      }
      // The following line automatically calls Line setter function
      this.line.startV3Point = this.currentV3Point;
      this.startDot.position.copy(this.currentV3Point);
    }
  }

  //eslint-disable-next-line
  mouseReleased(event: MouseEvent) {
    this.isMouseDown = false;
    if (this.isOnSphere && this.theSphere) {
      // Record the second point of the geodesic circle
      this.theSphere.remove(this.line);
      this.theSphere.remove(this.startDot);
      this.isCircleAdded = false;
      this.endV3Point.copy(this.currentV3Point);
      const newLine = this.line.clone(); // true:recursive clone
      const lineGroup = new CommandGroup();
      if (this.startPoint === null) {
        // Starting point landed on an open space
        // we have to create a new point
        const vtx = new Point();
        vtx.position.copy(this.startV3Point);
        this.startPoint = vtx;
        lineGroup.addCommand(new AddPointCommand(vtx));
      }
      if (this.hitObject instanceof Point) {
        this.endPoint = this.hitObject;
      } else {
        // endV3Point landed on an open space
        // we have to create a new point
        const vtx = new Point();
        vtx.position.copy(this.currentV3Point);
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
