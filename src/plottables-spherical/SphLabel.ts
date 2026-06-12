import { CKNodule, ModelPublisher } from "@/models/CKNodule";
import { Nodule } from "@/plottables/Nodule";
import { Scene } from "three";
import { Group } from "two.js/src/group";
import { Text } from "two.js/src/text";
import { LabelParentTypes } from "@/types";
import SETTINGS, { LAYER } from "@/global-settings-spherical";
import { CKPoint } from "@/models/CKPoint";
export class SphLabel extends Nodule<CKPoint> {
  frontText: Text;
  labelParentType: LabelParentTypes;
  constructor(modelRef: CKPoint, parentType: LabelParentTypes) {
    super("NewLabel", modelRef);
    this.labelParentType = parentType;
    this.frontText = new Text("NewLabel", 0, 0, { size: 10 });
    this.frontText.noStroke();
  }
  show(): void {
    throw new Error("Method not implemented.");
  }
  hide(): void {
    throw new Error("Method not implemented.");
  }
  addToLayers(layers: Group[], scene: Scene | null): void {
    this.frontText.addTo(layers[LAYER.foregroundLabel]);
  }
  removeFromLayers(): void {
    this.frontText.remove();
  }
  glowingDisplay(): void {
    // throw new Error("Method not implemented.");
  }
  normalDisplay(): void {
    this.frontText.visible = true;
    // throw new Error("Method not implemented.");
  }
  modelUpdated(): void {
    switch (this.labelParentType) {
      case "point":
        this.frontText.value = this.modelRef.name;
        const pos = this.modelRef.ga_coord.vector(2);
        this.frontText.translation.set(
          pos[0] * 1.1 * SETTINGS.boundaryCircle.radius,
          -pos[1] * 1.1 * SETTINGS.boundaryCircle.radius
        );
        break;
      default:
        console.warn("Label parent type not recognized:", this.labelParentType);
    }
    console.debug(
      "Model updated for NewLabel:",
      this.modelRef,
      this.labelParentType
    );
  }
}
