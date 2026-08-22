import { CKNodule } from "@/models/CKNodule";
import {
  Mesh,
  MeshStandardMaterial,
  Scene,
  SphereGeometry,
  Vector3
} from "three/webgpu";
import { PoseTracker } from "./PoseTracker";

export class MultiPointSelectionHandler extends PoseTracker {
  previewPoint = new Mesh(
    new SphereGeometry(0.02, 16, 16),
    new MeshStandardMaterial({ color: 0xaaaaaa })
  );
  constructor(scene: Scene, maxPoints: number) {
    super(scene);
    this.previewPoint.visible = false;
  }

  override activate(): void {
    super.activate();
    this.scene.add(this.previewPoint);
  }

  override deactivate(): void {
    super.deactivate();
    this.scene.remove(this.previewPoint);
  }

  override mouseMoved(
    event: MouseEvent,
    position: Vector3,
    hitObjects: Array<CKNodule | string>
  ): void {
    super.mouseMoved(event, position, hitObjects);
    if (isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
      this.previewPoint.visible = false;
      return;
    }
    this.previewPoint.position.copy(position);
    this.previewPoint.visible = true;
    // console.debug(
    //   "MultiPointSelectionHandler::mouseMoved",
    //   position.toFixed(2),
    //   hitObjects
    // );
  }
}
