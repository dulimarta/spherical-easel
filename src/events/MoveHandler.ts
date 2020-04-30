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
      this.theSphere?.worldToLocal(this.currentPoint);
      this.moveTarget.position.copy(this.currentPoint);
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
