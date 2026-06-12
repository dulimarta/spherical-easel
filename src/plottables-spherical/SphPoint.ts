import SETTINGS, { LAYER } from "@/global-settings-spherical";
import { ModelPublisher } from "@/models/CKNodule";
import { CKPoint } from "@/models/CKPoint";
import { Nodule } from "@/plottables/Nodule";
import { Scene, Vector3 } from "three";
import { Group } from "two.js/src/group";
import { Circle } from "two.js/src/shapes/circle";
export class SphPoint extends Nodule<CKPoint> {
  protected frontPoint: Circle;
  protected glowingFrontPoint: Circle;
  constructor(modelRef: CKPoint) {
    super("NewPoint", modelRef);
    this.frontPoint = new Circle(0, 0, 5);
    this.glowingFrontPoint = new Circle(0, 0, 5);
    this.frontPoint.visible = false;
    this.glowingFrontPoint.visible = false;
    this.frontPoint.linewidth = 2;
    this.glowingFrontPoint.linewidth = 2;
    this.glowingFrontPoint.stroke = SETTINGS.point.glowing.strokeColor.front;
  }
  show(): void {
    this.frontPoint.visible = true;
    this.glowingFrontPoint.visible = false;
  }
  hide(): void {
    this.frontPoint.visible = false;
    this.glowingFrontPoint.visible = false;
  }
  addToLayers(layers: Group[], scene: Scene | null): void {
    const layer = layers[LAYER.foregroundPoints];
    this.frontPoint.addTo(layer);
    this.glowingFrontPoint.addTo(layer);
  }
  removeFromLayers(): void {
    this.frontPoint.remove();
    this.glowingFrontPoint.remove();
  }
  glowingDisplay(): void {
    this.frontPoint.visible = false;
    this.glowingFrontPoint.visible = true;
  }
  normalDisplay(): void {
    this.frontPoint.visible = true;
    this.glowingFrontPoint.visible = false;
  }

  modelUpdated(): void {
    const pos = this.modelRef.ga_coord.vector(2);
    this.frontPoint.translation.set(
      pos[0] * SETTINGS.boundaryCircle.radius,
      pos[1] * SETTINGS.boundaryCircle.radius
    );
    this.glowingFrontPoint.translation.set(
      pos[0] * SETTINGS.boundaryCircle.radius,
      pos[1] * SETTINGS.boundaryCircle.radius
    );
    if (this.modelRef.isHighlighted()) {
      this.glowingDisplay();
    } else {
      this.normalDisplay();
    }
  }
}
