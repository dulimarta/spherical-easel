import { CKNodule } from "@/models/CKNodule";
import {
  ArrowHelper,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Material,
  Mesh,
  MeshBasicNodeMaterial,
  MeshStandardMaterial,
  MeshStandardNodeMaterial,
  Scene,
  SphereGeometry,
  Vector3
} from "three/webgpu";
import { PoseTracker } from "./PoseTracker";
import { SurfaceIntersection } from "./ToolStrategy";
import { onKeyDown } from "@vueuse/core";
import { CKPoint } from "@/models/CKPoint";
import { fract, step, time, uniform, uv } from "three/tsl";

type SelectedPointInformation = {
  onObject: CKNodule | null;
  position: Vector3;
  surface: string;
};
export class MultiPointSelectionHandler extends PoseTracker {
  protected previewPoints: Array<Mesh> = [];
  private previewDirection = new idealArrow();
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
    // this.previewDirection.setColor(0xff0066);
    // this.previewDirection.setLength(3.0);
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

const ARROW_HEIGHT = 3;
const ARROW_COLOR = 0x44aaee;
export class idealArrow extends Group {
  private rotationAxis = new Vector3();
  private arrowHead = new Mesh(
    new ConeGeometry(0.1, 0.2, 6, 6),
    new MeshStandardMaterial({ color: ARROW_COLOR })
  );
  private arrowBody: Mesh;
  constructor() {
    super();
    // The rotations are required to align the arrow with the Z-axis
    // so that setDirection is simply a lookAt() call
    const dashPattern = () => {
      const dashCount = uniform(5.0);
      const dashLength = uniform(0.7); // 70% solid, 30% gap
      const speed = uniform(0.1);
      const animatedU = uv().y.sub(time.mul(speed));
      const repeatedU = fract(animatedU.mul(dashCount));
      const visibility = step(repeatedU, dashLength);
      return visibility;
    };
    const arrowBodyMaterial = new MeshStandardNodeMaterial({
      color: ARROW_COLOR,
      transparent: true,
      opacity: 0.35,
      side: DoubleSide
    });
    arrowBodyMaterial.opacityNode = dashPattern();
    this.arrowBody = new Mesh(
      new CylinderGeometry(0.03, 0.03, ARROW_HEIGHT, 6, 20),
      arrowBodyMaterial
    );
    this.arrowHead.rotateX(Math.PI / 2);
    this.arrowHead.translateY(ARROW_HEIGHT);
    this.arrowBody.rotateX(Math.PI / 2);
    this.arrowBody.translateY(ARROW_HEIGHT / 2);
    this.add(this.arrowBody);
    this.add(this.arrowHead);
  }

  setDirection(d: Vector3) {
    this.lookAt(d);
  }
}
