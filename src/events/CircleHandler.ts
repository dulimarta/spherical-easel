import { Vector3, Camera, Scene } from "three";
import CursorHandler from "./CursorHandler";
import Vertex from "@/3d-objs/Point";
import SETTINGS from "@/global-settings";
import Circle from "@/3d-objs/Circle";
import { CommandGroup } from "@/commands/CommandGroup";
import { AddPointCommand } from "@/commands/AddPointCommand";
import { AddRingCommand } from "@/commands/AddCircleCommand";

export default class CirleHandler extends CursorHandler {
  private startPoint: Vector3;
  private endPoint: Vector3;
  private isMouseDown: boolean;
  private isCircleAdded: boolean;
  private startDot: Vertex;
  private circle: Circle;
  private startVertex: Vertex | null = null;
  private endVertex: Vertex | null = null;
  constructor({ camera, scene }: { camera: Camera; scene: Scene }) {
    super({ camera, scene });
    this.startPoint = new Vector3();
    this.endPoint = new Vector3();
    this.startDot = new Vertex();
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
          this.theSphere.add(this.circle);
          this.theSphere.add(this.startDot);
        }
        this.circle.circlePoint = this.currentPoint;
      }
    } else if (this.isCircleAdded) {
      this.theSphere?.remove(this.circle);
      this.theSphere?.remove(this.startDot);
      this.isCircleAdded = false;
    }
  }

  // eslint-disable-next-line
  mousePressed(event: MouseEvent) {
    this.isMouseDown = true;
    if (this.isOnSphere) {
      const selected = this.hitObject;
      if (selected instanceof Vertex) {
        this.startPoint.copy(selected.position);
        this.startVertex = this.hitObject;
      } else {
        this.theSphere?.add(this.startDot);
        this.startPoint.copy(this.currentPoint);
        this.startVertex = null;
      }
      this.startDot.position.copy(this.currentPoint);
      this.circle.centerPoint = this.currentPoint;
    }
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent) {
    this.isMouseDown = false;
    if (this.isOnSphere && this.theSphere) {
      // Record the second point of the geodesic circle
      this.theSphere.remove(this.circle);
      this.theSphere.remove(this.startDot);
      this.isCircleAdded = false;
      this.endPoint.copy(this.currentPoint);
      const newRing = this.circle.clone();
      const ringGroup = new CommandGroup();
      if (this.startVertex === null) {
        // Starting point landed on an open space
        // we have to create a new point
        const vtx = new Vertex();
        vtx.position.copy(this.startPoint);
        this.startVertex = vtx;
        ringGroup.addCommand(new AddPointCommand(vtx));
      }
      if (this.hitObject instanceof Vertex) {
        this.endVertex = this.hitObject;
      } else {
        // Endpoint landed on an open space
        // we have to create a new point
        const vtx = new Vertex();
        vtx.position.copy(this.currentPoint);
        this.endVertex = vtx;
        ringGroup.addCommand(new AddPointCommand(vtx));
      }

      ringGroup
        .addCommand(
          new AddRingCommand({
            circle: newRing,
            centerPoint: this.startVertex,
            circlePoint: this.endVertex
          })
        )
        .execute();
      this.startVertex = null;
      this.endVertex = null;
    }
  }
}
