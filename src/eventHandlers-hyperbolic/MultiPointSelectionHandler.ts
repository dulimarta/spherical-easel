import { CKNodule } from "@/models/CKNodule";
import {
  ArrowHelper,
  Material,
  Mesh,
  MeshStandardMaterial,
  Scene,
  SphereGeometry,
  Vector3
} from "three/webgpu";
import { PoseTracker } from "./PoseTracker";
import { SurfaceIntersection } from "./ToolStrategy";
import { onKeyDown } from "@vueuse/core";
import { CKPoint } from "@/models/CKPoint";

type SelectedPointInformation = {
  onObject: CKNodule | null;
  position: Vector3;
  surface: string;
};
export class MultiPointSelectionHandler extends PoseTracker {
  protected previewPoints: Array<Mesh> = [];
  private previewDirection = new ArrowHelper();
  private currentPreviewIndex = 0;
  protected currentSelectedPoints: Array<SelectedPointInformation> = [];
  protected onSurfaceName: string | null = null;
  private keyboardEventHandler!: () => void;

  constructor(
    scene: Scene,
    private maxPoints: number
  ) {
    super(scene);
    for (let k = 0; k < this.maxPoints; k++) {
      const previewPoint = new Mesh(
        new SphereGeometry(0.03, 16, 16),
        new MeshStandardMaterial({ color: 0xaaaaaa })
      );
      previewPoint.visible = false;
      this.previewPoints.push(previewPoint);
    }
    this.previewDirection.visible = false;
    this.previewDirection.setColor(0xff0066);
    this.previewDirection.setLength(3.0);
  }

  override activate(): void {
    super.activate();
    this.previewPoints.forEach(p => this.scene.add(p));
    this.scene.add(this.previewDirection);
    this.currentPreviewIndex = 0;
    this.keyboardEventHandler = onKeyDown("Escape", () => {
      // console.debug("MultiPointSelectionHandler::Escape key pressed");
      // Undo all the selections made so far when the Escape key is pressed.
      this.restart();
    });
  }

  override deactivate(): void {
    super.deactivate();
    this.previewPoints.forEach(p => p.removeFromParent());
    this.previewDirection.removeFromParent();
    this.onSurfaceName = null;
    this.keyboardEventHandler(); // disconnect the handler
  }

  override mousePressed(
    event: MouseEvent,
    position: Vector3,
    hitObjects: Array<CKNodule | SurfaceIntersection>
  ): void {
    super.mousePressed(event, position, hitObjects);
    if (isNaN(position.x)) return;
    console.debug("HyperMPH::mousePressed", this.currentSelectedPoints.length);
    if (this.currentPreviewIndex < this.maxPoints) {
      this.currentPreviewIndex++;
      if (hitObjects.length === 0) {
        // Mouse pressed on an open surface
        this.currentSelectedPoints.push({
          onObject: null,
          position: position.clone(),
          surface: this.onSurfaceName!
        });
        return;
      }
      const hitPoints = hitObjects.filter(obj => obj instanceof CKPoint);
      throw `Not yet implemented:: pressed on an existing object ${hitPoints.map(z => z.name)}`;
    }
  }
  override mouseMoved(
    event: MouseEvent,
    position: Vector3,
    hitObjects: Array<CKNodule | SurfaceIntersection>
  ): void {
    super.mouseMoved(event, position, hitObjects);
    if (isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
      this.previewPoints[this.currentSelectedPoints.length].visible = false;
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
      this.previewPoints[this.currentPreviewIndex].visible = false;
    } else {
      this.previewPoints[this.currentPreviewIndex].position.copy(position);
      this.previewPoints[this.currentPreviewIndex].visible = true;
      const firstSurface = firstHit as SurfaceIntersection;
      if (this.onSurfaceName !== firstSurface.surface) {
        console.debug(`Change surface to ${firstSurface.surface}`);
        (
          this.previewPoints[this.currentPreviewIndex].material as Material
        ).dispose();
        if (firstSurface.surface.match(/Sheet/)) {
          this.previewDirection.visible = false;
          this.previewPoints[this.currentPreviewIndex].material =
            new MeshStandardMaterial({
              color: 0x00ffff
            });
        } else if (firstSurface.surface.match(/Ultra/)) {
          this.previewDirection.visible = false;
          this.previewPoints[this.currentPreviewIndex].material =
            new MeshStandardMaterial({
              color: 0x000000
            });
        } else if (firstSurface.surface.match(/Ideal/)) {
          this.previewDirection.setDirection(position.clone().normalize());
          this.previewDirection.visible = true;
          this.previewPoints[this.currentPreviewIndex].material =
            new MeshStandardMaterial({
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

  restart() {
    console.debug("MPH::restart()");
    this.currentSelectedPoints.splice(0);
    for (let k = 1; k < this.maxPoints; k++)
      this.previewPoints[k].visible = false;
    this.currentPreviewIndex = 0;
  }
}
