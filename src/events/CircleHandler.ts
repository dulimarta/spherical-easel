import { Vector3, Camera, Scene } from "three";
import CursorHandler from "./CursorHandler";
import Point from "@/3d-objs/Point";
import SETTINGS from "@/global-settings";
import Circle from "@/3d-objs/Circle";
import { CommandGroup } from "@/commands/CommandGroup";
import { AddPointCommand } from "@/commands/AddPointCommand";
import { AddCircleCommand } from "@/commands/AddCircleCommand";

export default class CircleHandler extends CursorHandler {
  private startV3Point: Vector3;
  private endV3Point: Vector3;
  private isMouseDown: boolean;
  private isCircleAdded: boolean;
  private startDot: Point;
  private circle: Circle;
  private startPoint: Point | null = null;
  private endPoint: Point | null = null;
  constructor({ camera, scene }: { camera: Camera; scene: Scene }) {
    super({ camera, scene });
    this.startV3Point = new Vector3();
    this.endV3Point = new Vector3();
    this.startDot = new Point();
    this.isMouseDown = false;
    this.isCircleAdded = false;
    this.circle = new Circle();
  }
  activate = () => {
    this.rayCaster.layers.disableAll();
    this.rayCaster.layers.enable(SETTINGS.layers.sphere);
    this.rayCaster.layers.enable(SETTINGS.layers.point);
  };

  mouseMoved(event: MouseEvent) {
    super.mouseMoved(event);
    if (this.isOnSphere) {
      if (this.isMouseDown && this.theSphere) {
        if (!this.isCircleAdded) {
          this.isCircleAdded = true;
          // this.theSphere.add(this.circle);
          this.theSphere.add(this.startDot);
        }
        this.circle.circlePoint = this.currentV3Point;
      }
    } else if (this.isCircleAdded) {
      // this.theSphere?.remove(this.circle);
      this.theSphere?.remove(this.startDot);
      this.isCircleAdded = false;
    }
  }

  // eslint-disable-next-line
  mousePressed(event: MouseEvent) {
    this.isMouseDown = true;
    if (this.isOnSphere) {
      const selected = this.hitObject;
      if (selected instanceof Point) {
        this.startV3Point.copy(selected.position);
        this.startPoint = this.hitObject;
      } else {
        this.theSphere?.add(this.startDot);
        this.startV3Point.copy(this.currentV3Point);
        this.startPoint = null;
      }
      this.startDot.position.copy(this.currentV3Point);
      this.circle.centerPoint = this.currentV3Point;
    }
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent) {
    this.isMouseDown = false;
    if (this.isOnSphere && this.theSphere) {
      // Record the second point of the geodesic circle
      // this.theSphere.remove(this.circle);
      this.theSphere.remove(this.startDot);
      this.isCircleAdded = false;
      this.endV3Point.copy(this.currentV3Point);
      const newCircle = this.circle.clone();
      const circleGroup = new CommandGroup();
      if (this.startPoint === null) {
        // Starting point landed on an open space
        // we have to create a new point
        const vtx = new Point();
        vtx.position.copy(this.startV3Point);
        this.startPoint = vtx;
        circleGroup.addCommand(new AddPointCommand(vtx));
      }
      if (this.hitObject instanceof Point) {
        this.endPoint = this.hitObject;
      } else {
        // endV3Point landed on an open space
        // we have to create a new point
        const vtx = new Point();
        vtx.position.copy(this.currentV3Point);
        this.endPoint = vtx;
        circleGroup.addCommand(new AddPointCommand(vtx));
      }

      circleGroup
        .addCommand(
          new AddCircleCommand({
            circle: newCircle,
            centerPoint: this.startPoint,
            circlePoint: this.endPoint
          })
        )
        .execute();
      this.startPoint = null;
      this.endPoint = null;
    }
  }
}
