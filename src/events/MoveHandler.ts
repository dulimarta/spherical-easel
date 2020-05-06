import CursorHandler from "./CursorHandler";
import { Camera, Scene } from "three";
import SETTINGS from "@/global-settings";
import Vertex from "@/3d-objs/Vertex";

export default class MoveHandler extends CursorHandler {
  private isDragging = false;
  private moveTarget: Vertex | null = null;
  constructor(args: {
    camera: Camera;
    scene: Scene;
    canvas: HTMLCanvasElement;
  }) {
    super(args);
  }

  mouseMoved = (event: MouseEvent) => {
    this.mapCursorToSphere(event);
    if (this.isDragging && this.moveTarget instanceof Vertex) {
      this.moveTarget.position.copy(this.currentPoint);
      const vtx = this.store.state.vertices.find(
        v => v.ref.id === this.moveTarget?.id
      );
      if (vtx) {
        // Update all lines having this vertex as start point
        vtx.startOf.forEach(z => {
          z.ref.startPoint = this.currentPoint;
        });
        // Update all lines having this vertex as end point
        vtx.endOf.forEach(z => {
          z.ref.endPoint = this.currentPoint;
        });
        // Update all circles having this vertex as center point
        vtx.centerOf.forEach(z => {
          z.ref.centerPoint = this.currentPoint;
        });
        // Update all circles having this vertex as circum point
        vtx.circumOf.forEach(z => {
          z.ref.circlePoint = this.currentPoint;
        });
      }
    }
  };

  mousePressed = () => {
    this.isDragging = true;
    if (this.hitObject instanceof Vertex) this.moveTarget = this.hitObject;
  };

  mouseReleased = () => {
    this.isDragging = false;
    this.moveTarget = null;
  };

  activate() {
    this.canvas.addEventListener("mousemove", this.mouseMoved);
    this.canvas.addEventListener("mousedown", this.mousePressed);
    this.canvas.addEventListener("mouseup", this.mouseReleased);
    // this.canvas.addEventListener("mousedown", this.mousePressed);
    // this.canvas.addEventListener("mouseup", this.mouseReleased);
    this.rayCaster.layers.disableAll();
    this.rayCaster.layers.enable(SETTINGS.layers.sphere);
    this.rayCaster.layers.enable(SETTINGS.layers.vertex);
  }

  deactivate() {
    this.canvas.removeEventListener("mousemove", this.mouseMoved);
    this.canvas.removeEventListener("mousedown", this.mousePressed);
    this.canvas.removeEventListener("mouseup", this.mouseReleased);
  }
}
