import {
  Mesh,
  MeshStandardMaterial,
  Scene,
  SphereGeometry,
  Vector3
} from "three/webgpu";
import { SphericalTool } from "./ToolStrategy";
import { AddPointKommand } from "@/commands/AddPointKommand";
import { CKNodule } from "@/models/CKNodule";
import { CKPoint } from "@/models/CKPoint";

class MouseHandler implements SphericalTool {
  protected scene: Scene;
  protected readonly hitObjectCache: CKNodule[] = [];
  constructor(scene: Scene) {
    this.scene = scene;
  }
  mouseMoved(
    event: MouseEvent,
    position: Vector3,
    hitObjects: Array<CKNodule>
  ): void {
    this.hitObjectCache.forEach(hit => {
      hit.setHighlight(false);
    });
    this.hitObjectCache.splice(0);
    this.hitObjectCache.push(...hitObjects);
  }

  mousePressed(
    event: MouseEvent,
    position: Vector3,
    hitObjects: Array<CKNodule>
  ): void {}
  activate(): void {
    console.log("MouseHandler::activate");
  }

  deactivate(): void {
    console.log("MouseHandler::deactivate");
  }
}

export class PointHandler extends MouseHandler {
  private tempPoint: Mesh;
  private tempPointAdded = false;

  constructor(scene: Scene) {
    super(scene);
    this.tempPoint = new Mesh(
      new SphereGeometry(0.01, 32, 32),
      new MeshStandardMaterial({ color: 0xff0000 })
    );
  }
  mouseMoved(
    event: MouseEvent,
    position: Vector3,
    hitObjects: Array<CKNodule>
  ): void {
    super.mouseMoved(event, position, hitObjects);
    // console.debug(
    //   "NewPointHandler::mouseMoved",
    //   position,
    //   `Hit count: ${hitObjects.length}`
    // );
    if (!isNaN(position.x)) {
      hitObjects.forEach(hit => {
        hit.setHighlight(true);
      });
      this.tempPoint.position.copy(position);
      if (!this.tempPointAdded) {
        this.scene.add(this.tempPoint);
        this.tempPointAdded = true;
      }
    } else {
      // not on sphere
      if (this.tempPointAdded) {
        this.scene.remove(this.tempPoint);
        this.tempPointAdded = false;
      }
    }
  }

  mousePressed(
    event: MouseEvent,
    position: Vector3,
    hitObjects: Array<CKNodule>
  ): void {
    super.mousePressed(event, position, hitObjects);
    console.debug(
      "NewPointHandler::mousePressed",
      position,
      `Hit ${hitObjects.length}`
    );
    const hitPoints = hitObjects.filter(z => z instanceof CKPoint);
    // Ensure that the mouse is on the sphere and it is not currently
    // hitting another point
    if (!isNaN(position.x) && hitPoints.length === 0) {
      const pointCommand = new AddPointKommand(position);
      pointCommand.execute();
    } else {
      console.error("Can't create a new point");
    }
  }
}
