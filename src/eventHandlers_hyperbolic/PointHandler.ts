import { AddPointCommandByCoordinates } from "@/commands/AddPointCommandByCoordinates";
import {
  ArrowHelper,
  Mesh,
  MeshStandardMaterial,
  Scene,
  SphereGeometry,
  Vector2,
  Vector3
} from "three";
import { PoseTracker } from "./PoseTracker";

export class PointHandler extends PoseTracker {
  aPoint = new Mesh(
    new SphereGeometry(0.05),
    new MeshStandardMaterial({ color: "white" })
  );
  normalArrow = new ArrowHelper(); // ArrowHelper to show the normal vector of mouse intersection point

  constructor(scene: Scene) {
    super(scene);
    this.scene = scene;
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
    super.mouseMoved(event, scrPos, position, direction);
    if (position) {
      this.aPoint.position.copy(position);
      this.scene.add(this.aPoint);
      this.normalArrow.setDirection(direction!);
      // this.normalArrow.position.copy(position);
    } else {
      this.scene.remove(this.aPoint);
    }
  }
  mousePressed(
    event: MouseEvent,
    scrPos: Vector2,
    position: Vector3 | null
    // normalDirection?: Vector3 | null = null
  ): void {
    console.debug("Inside Point handler");
    if (position) {
      const cmd = new AddPointCommandByCoordinates(position);
      cmd.execute();
    }
  }
  mouseReleased(event: MouseEvent): void {
    throw new Error("Method not implemented.");
  }
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
