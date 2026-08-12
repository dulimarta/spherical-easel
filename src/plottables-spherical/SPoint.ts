import { Nodule } from "@/plottables/Nodule";
import { Mesh, NodeMaterial, Scene, SphereGeometry } from "three/webgpu";
import { color } from "three/tsl";
import { HYPERBOLIC_LAYER } from "@/global-settings-hyperbolic";
import { CKPoint } from "@/models/CKPoint";

export class SPoint extends Nodule<CKPoint> {
  private _pointMesh: Mesh;
  private _pointMaterial: NodeMaterial;
  constructor(name: string, modelRef: CKPoint) {
    super(name, modelRef);

    this._pointMaterial = new NodeMaterial();
    this._pointMesh = new Mesh(
      new SphereGeometry(0.01, 32, 32),
      this._pointMaterial
    );
    this._pointMesh.name = this.name;
    this._pointMaterial.colorNode = color(0xffff00);
    this.viewGroup.add(this._pointMesh);
  }
  show(): void {
    // throw new Error("Method not implemented.");
  }
  hide(): void {
    // throw new Error("Method not implemented.");
  }
  glowingDisplay(): void {
    // console.debug("Setting fragmentNode color to glowing");
    this._pointMaterial.colorNode = color(0xff0000);
    this._pointMaterial.needsUpdate = true;
  }
  normalDisplay(): void {
    this._pointMaterial.colorNode = color(0xffff00);
    this._pointMaterial.needsUpdate = true;
    // console.debug("Setting fragmentNode color to normal");
  }
  modelUpdated(): void {
    const pos = this.modelRef.ga_coord.vector(2);
    this._pointMesh.position.set(pos[0], pos[1], pos[2]);
    // console.debug(
    //   "SPoint model updated, position:",
    //   pos,
    //   "Highlighted:",
    //   this.modelRef.isHighlighted()
    // );
    if (this.modelRef.isHighlighted()) {
      this.glowingDisplay();
    } else {
      this.normalDisplay();
    }
  }
}
