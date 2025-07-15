import { HyperbolicToolStrategy } from "@/eventHandlers/ToolStrategy";
import {
  Scene,
  Vector2,
  Vector3,
  Mesh,
  SphereGeometry,
  MeshStandardMaterial,
  ArrowHelper
} from "three";
import { Mouse3D } from "./mouseTypes";
export class PoseTracker implements HyperbolicToolStrategy {
  protected scene: Scene;
  protected first: Mouse3D = {
    normalized2D: new Vector2(),
    position: new Vector3(),
    normal: new Vector3()
  };
  protected second: Mouse3D = {
    normalized2D: new Vector2(),
    position: new Vector3(),
    normal: new Vector3()
  };
  protected isDragging = false;
  private aPoint = new Mesh(
    new SphereGeometry(0.05),
    new MeshStandardMaterial({ color: "white" })
  );
  private normalArrow = new ArrowHelper(); // ArrowHelper to show the normal vector of mouse intersection point

  // protected mouseCoordNormalized = new Vector2();
  // private rayCaster = new Raycaster();
  // private mousePoint = new Mesh(
  //   new SphereGeometry(0.05),
  //   new MeshStandardMaterial({ color: "white" })
  // );
  constructor(scene: Scene) {
    this.scene = scene;
    // this.canvas = canvas;
    this.normalArrow.setColor(0xffffff);
    this.normalArrow.setLength(1, 0.2, 0.2);
    this.aPoint.add(this.normalArrow);
  }
  mouseMoved(
    event: MouseEvent,
    scrPos: Vector2,
    position: Vector3 | null,
    direction: Vector3 | null
  ): void {
    // console.debug(
    //   "PoseTracker::mouseMoved",
    //   position ? position.toFixed(2) : "N/A",
    //   "dragging",
    //   this.isDragging
    // );
    if (position) {
      this.aPoint.position.copy(position);
      this.scene.add(this.aPoint);
      this.normalArrow.setDirection(direction!);
      this.second.position.copy(position);
    } else {
      this.scene.remove(this.aPoint);
      this.second.position.set(Number.NaN, Number.NaN, Number.NaN);
    }
    this.second.normalized2D.copy(scrPos);
    if (direction) this.second.normal.copy(direction);
    else this.second.normal.set(Number.NaN, Number.NaN, Number.NaN);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mousePressed(
    event: MouseEvent,
    pos2D: Vector2,
    pos3D: Vector3 | null,
    n: Vector3 | null
  ): void {
    this.first.normalized2D.copy(pos2D);
    if (pos3D) this.first.position.copy(pos3D);
    else this.first.position.set(Number.NaN, Number.NaN, Number.NaN);
    if (n) this.first.normal.copy(n);
    else this.first.normal.set(Number.NaN, Number.NaN, Number.NaN);
    this.isDragging = true;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mouseReleased(event: MouseEvent, p: Vector3, d: Vector3): void {
    console.debug("PoseTracker::mouseReleased");
    this.isDragging = false;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mouseLeave(event: MouseEvent): void {
    throw new Error("Method not implemented.");
  }
  activate(): void {
    throw new Error("Method not implemented.");
  }
  deactivate(): void {
    throw new Error("Method not implemented.");
  }
}
