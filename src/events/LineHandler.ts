import { Vector3, Camera, Scene } from "three";
import CursorHandler from "./CursorHandler";
// import Arrow from "@/3d-objs/Arrow";
import Vertex from "@/3d-objs/Vertex";
import SETTINGS from "@/global-settings";
import { CommandGroup } from "@/commands/CommandGroup";
import { AddVertexCommand } from "@/commands/AddVertexCommand";
import { AddLineCommand } from "@/commands/AddLineCommand";
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
    camera,
    scene
  }: {
    camera: Camera;
    scene: Scene;
  }) {
    super({ camera, scene });
    this.startPoint = new Vector3();
    this.endPoint = new Vector3();
    this.startDot = new Vertex();
    // this.normalArrow = new Arrow(1.5, 0xff6600);
    this.isMouseDown = false;
    this.isCircleAdded = false;
  }

  activate = () => {
    this.rayCaster.layers.disableAll();
    this.rayCaster.layers.enable(SETTINGS.layers.sphere);
    this.rayCaster.layers.enable(SETTINGS.layers.vertex);
    // The following line automatically calls Line setter function by default
    this.geodesicRing.isSegment = false;
  };

  mouseMoved(event: MouseEvent) {
    super.mouseMoved(event);
    if (this.isOnSphere) {
      if (this.isMouseDown && this.theSphere) {
        if (!this.isCircleAdded) {
          this.isCircleAdded = true;
          this.theSphere.add(this.geodesicRing);
          // this.scene.add(this.startDot);
        }
        // The following line automatically calls Line setter function
        this.geodesicRing.endPoint = this.currentPoint;
      }
    } else if (this.isCircleAdded) {
      this.theSphere?.remove(this.geodesicRing);
      this.theSphere?.remove(this.startDot);
      this.isCircleAdded = false;
    }
  }

  //eslint-disable-next-line
  mousePressed(event: MouseEvent) {
    this.isMouseDown = true;
    this.startVertex = null;
    if (this.isOnSphere) {
      const selected = this.hitObject;
      // Record the first point of the geodesic circle
      if (selected instanceof Vertex) {
        /* the vertex coordinate is local on the sphere */
        this.startPoint.copy(selected.position);
        this.startVertex = this.hitObject;
      } else {
        /* this.currentPoint is already converted to local sphere coordinate frame */
        this.theSphere?.add(this.startDot);
        this.startPoint.copy(this.currentPoint);
        this.startVertex = null;
      }
      // The following line automatically calls Line setter function
      this.geodesicRing.startPoint = this.currentPoint;
      this.startDot.position.copy(this.currentPoint);
    }
  }

  //eslint-disable-next-line
  mouseReleased(event: MouseEvent) {
    this.isMouseDown = false;
    if (this.isOnSphere && this.theSphere) {
      // Record the second point of the geodesic circle
      this.theSphere.remove(this.geodesicRing);
      this.theSphere.remove(this.startDot);
      this.isCircleAdded = false;
      this.endPoint.copy(this.currentPoint);
      const newLine = this.geodesicRing.clone(); // true:recursive clone
      const lineGroup = new CommandGroup();
      if (this.startVertex === null) {
        // Starting point landed on an open space
        // we have to create a new vertex
        const vtx = new Vertex();
        vtx.position.copy(this.startPoint);
        this.startVertex = vtx;
        lineGroup.addCommand(new AddVertexCommand(vtx));
      }
      if (this.hitObject instanceof Vertex) {
        this.endVertex = this.hitObject;
      } else {
        // Endpoint landed on an open space
        // we have to create a new vertex
        const vtx = new Vertex();
        vtx.position.copy(this.currentPoint);
        this.endVertex = vtx;
        lineGroup.addCommand(new AddVertexCommand(vtx));
      }

      lineGroup
        .addCommand(
          new AddLineCommand({
            line: newLine,
            startPoint: this.startVertex,
            endPoint: this.endVertex
          })
        )
        .execute();
      this.startVertex = null;
      this.endVertex = null;
    }
  }
}
