import { CKNodule } from "@/models/CKNodule";
import { CKPoint } from "@/models/CKPoint";
import { Nodule } from "@/plottables/Nodule";
import { LabelParentTypes } from "@/types";
import {
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  Scene
} from "three";
import { FontLoader, TextGeometry } from "three/examples/jsm/Addons.js";
import { Group } from "two.js/src/group";
const fontLoader = new FontLoader();
const robotoFont = await fontLoader.loadAsync(
  "fonts/droid_sans_regular.typeface.json"
);
export class HypLabel extends Nodule<CKNodule> {
  _labelMesh: Mesh;
  _parentType: LabelParentTypes;
  constructor(modelRef: CKPoint, parentType: LabelParentTypes) {
    super("New HLabel", modelRef);
    this._parentType = parentType;
    const parentId = modelRef.name;
    const textGeometry = new TextGeometry(parentId, {
      font: robotoFont,
      size: 0.2,
      depth: 0
    });
    this._labelMesh = new Mesh(
      textGeometry,
      new MeshBasicMaterial({ color: 0xffff00 })
    );
  }
  glowingDisplay(): void {
    (this._labelMesh.material as MeshBasicMaterial).color = new Color(0xff0000);
  }
  normalDisplay(): void {
    (this._labelMesh.material as MeshBasicMaterial).color = new Color(0xffff00);
  }
  show(): void {
    // throw new Error("Method not implemented.");
  }
  hide(): void {
    // throw new Error("Method not implemented.");
  }
  addToLayers(layers: Group[], scene: Scene | null): void {
    scene?.add(this._labelMesh);
    // this.modelUpdated();
  }
  removeFromLayers(): void {
    this._labelMesh.removeFromParent();
    this._labelMesh.geometry.dispose();
    (this._labelMesh.material as MeshBasicMaterial).dispose();
  }
  modelUpdated(): void {
    // console.debug("Label model updated, but method not implemented yet.");
    switch (this._parentType) {
      case "point":
        const pos = (this.modelRef as CKPoint).ga_coord.vector(2);
        this._labelMesh.position.set(pos[0], pos[1], pos[2]);
        if (this.modelRef.isHighlighted()) this.glowingDisplay();
        else this.normalDisplay();
    }
  }

  lookAtCamera(q: Quaternion): void {
    this._labelMesh.quaternion.copy(q);
  }
}
