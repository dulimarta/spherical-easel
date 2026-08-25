import { CKNodule } from "@/models/CKNodule";
import {
  ArrowHelper,
  Mesh,
  MeshStandardMaterial,
  Scene,
  SphereGeometry,
  Vector3
} from "three/webgpu";
import { PoseTracker } from "./PoseTracker";
import { SurfaceIntersection } from "./ToolStrategy";

export class MultiPointSelectionHandler extends PoseTracker {
  previewPoint = new Mesh(
    new SphereGeometry(0.03, 16, 16),
    new MeshStandardMaterial({ color: 0xaaaaaa })
  );
  previewDirection = new ArrowHelper();
  protected onSurfaceName: string | null = null;

  constructor(
    scene: Scene,
    private maxPoints: number
  ) {
    super(scene);
    this.previewPoint.visible = false;
    this.previewDirection.visible = false;
    this.previewDirection.setColor(0xff0066);
    this.previewDirection.setLength(3.0);
  }

  override activate(): void {
    super.activate();
    this.scene.add(this.previewPoint);
    this.scene.add(this.previewDirection);
  }

  override deactivate(): void {
    super.deactivate();
    this.previewPoint.removeFromParent();
    this.previewDirection.removeFromParent();
    this.onSurfaceName = null;
  }

  override mouseMoved(
    event: MouseEvent,
    position: Vector3,
    hitObjects: Array<CKNodule | SurfaceIntersection>
  ): void {
    super.mouseMoved(event, position, hitObjects);
    console.debug(`On surface ${this.onSurfaceName}`);
    if (isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
      this.previewPoint.visible = false;
      this.previewDirection.visible = false;
      this.onSurfaceName = null;
      return;
    }
    if (this.previewDirection.visible)
      this.previewDirection.setDirection(position.clone().normalize());
    if (hitObjects.length === 0) {
      this.onSurfaceName = null;
      return;
    }
    const firstHit = hitObjects[0];
    if (firstHit instanceof CKNodule) {
      // Currently no action
      this.previewPoint.visible = false;
    } else {
      this.previewPoint.position.copy(position);
      this.previewPoint.visible = true;
      const firstSurface = firstHit as SurfaceIntersection;
      if (this.onSurfaceName !== firstSurface.surface) {
        console.debug(`Change surface to ${firstSurface.surface}`);
        this.previewPoint.material.dispose();
        if (firstSurface.surface.match(/Sheet/)) {
          this.previewDirection.visible = false;
          this.previewPoint.material = new MeshStandardMaterial({
            color: 0x00ffff
          });
        } else if (firstSurface.surface.match(/Ultra/)) {
          this.previewDirection.visible = false;
          this.previewPoint.material = new MeshStandardMaterial({
            color: 0x000000
          });
        } else if (firstSurface.surface.match(/Ideal/)) {
          this.previewDirection.setDirection(position.clone().normalize());
          this.previewDirection.visible = true;
          this.previewPoint.material = new MeshStandardMaterial({
            color: 0xffffff
          });
        }
        this.onSurfaceName = firstSurface.surface;
      } else {
        // No action ???
      }
    }

    // this.previewPoint.visible = true;
    // console.debug(
    //   "MultiPointSelectionHandler::mouseMoved",
    //   position.toFixed(2),
    //   hitObjects
    // );
  }
}
