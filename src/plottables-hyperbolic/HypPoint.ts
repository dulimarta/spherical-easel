import { Nodule } from "@/plottables/Nodule";
import { Color, Mesh, MeshBasicMaterial, Scene, SphereGeometry } from "three";
import { Group } from "two.js/src/group";
import { createPoint } from "./MeshFactory";
import { HYPERBOLIC_LAYER } from "@/global-settings-hyperbolic";
import { ModelPublisher } from "@/models/CKNodule";
import { CKPoint } from "@/models/CKPoint";
import { CustomPointMaterial } from "./MaterialFactory";

export class HypPoint extends Nodule {
  _pointMesh: Mesh;
  private normalDisplayColor: Color = new Color(0xffff00);
  constructor(name: string, modelRef: ModelPublisher) {
    super(name, modelRef);
    this._pointMesh = new Mesh(
      new SphereGeometry(0.05, 32, 32),
      new MeshBasicMaterial({ color: 0x00ff00 })
    );
    this._pointMesh.name = this.name;
  }
  show(): void {
    throw new Error("Method not implemented.");
  }
  hide(): void {
    throw new Error("Method not implemented.");
  }
  addToLayers(layers: Group[], scene: Scene | null): void {
    scene?.add(this._pointMesh);
    console.debug(
      "After adding point to scene:",
      scene?.children.map(child => child.name).filter(name => name.length > 0)
    );
    this._pointMesh.layers.enable(HYPERBOLIC_LAYER.upperSheetPoints);
  }
  removeFromLayers(): void {
    this._pointMesh.removeFromParent();
  }
  glowingDisplay(): void {
    const z = (this._pointMesh.material as CustomPointMaterial).color.getHex();
    this.normalDisplayColor = new Color(z);
    (this._pointMesh.material as CustomPointMaterial).color.set(0xff0000);
  }
  normalDisplay(): void {
    (this._pointMesh.material as CustomPointMaterial).color.set(
      this.normalDisplayColor
    );
  }
  modelUpdated(): void {
    const model = this.modelRef as CKPoint;
    const pos = model.ga_coord.vector(2);
    this._pointMesh.position.set(pos[0], pos[1], pos[2]);
    if (model.isHighlighted()) {
      this.glowingDisplay();
    } else {
      this.normalDisplay();
    }
  }
}
