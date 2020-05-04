import { Vector3, Camera, Scene } from "three";
import CursorHandler from "./CursorHandler";
// import Arrow from "@/3d-objs/Arrow";
import Vertex from "@/3d-objs/Vertex";
import SETTINGS from "@/global-settings";

export default class LineHandler extends CursorHandler {
  protected startPoint: Vector3;
  protected endPoint: Vector3;
  // private normalArrow: Arrow;
  protected isMouseDown: boolean;
  protected isCircleAdded: boolean;
  protected startDot: Vertex;
  private startVertex: Vertex | null = null;
  private endVertex: Vertex | null = null;
  constructor({
    canvas,
    camera,
    scene
  }: {
    canvas: HTMLCanvasElement;
    camera: Camera;
    scene: Scene;
  }) {
    super({ canvas, camera, scene });
    this.startPoint = new Vector3();
    this.endPoint = new Vector3();
    this.startDot = new Vertex();
    // this.normalArrow = new Arrow(1.5, 0xff6600);
    this.isMouseDown = false;
    this.isCircleAdded = false;
  }

  activate = () => {
    this.canvas.addEventListener("mousemove", this.mouseMoved);
    this.canvas.addEventListener("mousedown", this.mousePressed);
    this.canvas.addEventListener("mouseup", this.mouseReleased);
    this.rayCaster.layers.disableAll();
    this.rayCaster.layers.enable(SETTINGS.layers.sphere);
    this.rayCaster.layers.enable(SETTINGS.layers.vertex);
    this.geodesicRing.isSegment = false;
  };

  deactivate = () => {
    this.canvas.removeEventListener("mousemove", this.mouseMoved);
    this.canvas.removeEventListener("mousedown", this.mousePressed);
    this.canvas.removeEventListener("mouseup", this.mouseReleased);
  };

  mouseMoved = (event: MouseEvent) => {
    // console.debug("LineHandler::mousemoved");

    this.mapCursorToSphere(event);
    if (this.isOnSphere) {
      if (this.isMouseDown && this.theSphere) {
        // console.debug("LineHandler::mousedragged");
        if (!this.isCircleAdded) {
          this.isCircleAdded = true;
          this.scene.add(this.geodesicRing);
          this.scene.add(this.startDot);
        }
        this.geodesicRing.endPoint = this.currentPoint;
      }
    } else if (this.isCircleAdded) {
      this.scene.remove(this.geodesicRing);
      this.scene.remove(this.startDot);
      this.isCircleAdded = false;
    }
  };

  mousePressed = (/*event: MouseEvent*/) => {
    this.isMouseDown = true;
    this.startVertex = null;
    if (this.isOnSphere) {
      const selected = this.hitObject;
      // Record the first point of the geodesic circle
      if (selected instanceof Vertex) {
        // Click on existing vertex, its position is local w.r.t to the sphere
        this.startPoint.copy(selected.position);
        // Convert the coordinate with respect to the world coordinate frame
        this.theSphere?.localToWorld(this.startPoint);
        this.startVertex = this.hitObject;
      } else {
        // Click on an open area on the sphere, tthe hit position is measured
        // with respect to the world coordinate frame
        this.scene.add(this.startDot);
        this.startPoint.copy(this.currentPoint);
        this.startVertex = null;
      }
      this.geodesicRing.startPoint = this.currentPoint;
      this.startDot.position.copy(this.currentPoint);
    }
  };

  mouseReleased = (/*event: MouseEvent*/) => {
    this.isMouseDown = false;
    if (this.isOnSphere && this.theSphere) {
      // Record the second point of the geodesic circle
      this.scene.remove(this.geodesicRing);
      this.scene.remove(this.startDot);
      this.isCircleAdded = false;
      this.endPoint.copy(this.currentPoint);
      const newLine = this.geodesicRing.clone(true); // true:recursive clone
      this.theSphere.add(newLine);
      if (this.startVertex === null) {
        // Starting point landed on an open space
        // we have to create a new vertex
        const vtx = new Vertex();
        vtx.position.copy(this.startPoint);
        this.theSphere.worldToLocal(vtx.position);
        this.theSphere.add(vtx);
        this.startVertex = vtx;
        this.store.commit("addVertex", vtx);
      }
      if (this.hitObject instanceof Vertex) {
        this.endVertex = this.hitObject;
      } else {
        // Endpoint landed on an open space
        // we have to create a new vertex
        const vtx = new Vertex();
        vtx.position.copy(this.currentPoint);
        this.theSphere.worldToLocal(vtx.position);
        this.theSphere.add(vtx);
        this.endVertex = vtx;
        this.store.commit("addVertex", vtx);
      }

      this.store.commit("addLine", {
        line: newLine,
        startPoint: this.startVertex,
        endPoint: this.endVertex
      });
      this.startVertex = null;
      this.endVertex = null;
    }
  };
}
