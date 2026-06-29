import { CKNodule } from "@/models/CKNodule";
import { CKPoint } from "@/models/CKPoint";
import { Nodule } from "@/plottables/Nodule";
import { LabelParentTypes } from "@/types";
import {
  Color,
  Mesh,
  // MeshBasicMaterial,
  // MeshStandardNodeMaterial,
  NodeMaterial,
  Quaternion,
  Scene,
  Vector3
} from "three/webgpu";
import { FontLoader, TextGeometry } from "three/examples/jsm/Addons.js";
import { color } from "three/tsl";
const fontLoader = new FontLoader();
const robotoFont = await fontLoader.loadAsync(
  "fonts/droid_sans_regular.typeface.json"
);
export class HLabel extends Nodule<CKNodule> {
  _labelMesh: Mesh;
  private _labelMaterial: NodeMaterial;
  private _labelTextGeometry: TextGeometry;
  private labelMinBox = new Vector3();
  private labelMaxBox = new Vector3();
  _parentType: LabelParentTypes;
  constructor(modelRef: CKPoint, parentType: LabelParentTypes) {
    super("New HLabel", modelRef);
    this._parentType = parentType;
    const parentId = modelRef.name;
    this._labelTextGeometry = new TextGeometry(parentId, {
      font: robotoFont,
      size: 0.1,
      depth: 0
    });
    this._labelMaterial = new NodeMaterial();
    this._labelMesh = new Mesh(this._labelTextGeometry, this._labelMaterial);
  }
  glowingDisplay(): void {
    this._labelMaterial.colorNode = color(0xff0000);
    this._labelMaterial.needsUpdate = true;
  }
  normalDisplay(): void {
    this._labelMaterial.colorNode = color(0xffff00);
    this._labelMaterial.needsUpdate = true;
  }
  show(): void {
    // throw new Error("Method not implemented.");
  }
  hide(): void {
    // throw new Error("Method not implemented.");
  }
  addToScene(scene: Scene): void {
    scene?.add(this._labelMesh);
    // this.modelUpdated();
  }
  removeFromScene(): void {
    this._labelMesh.removeFromParent();
    this._labelMesh.geometry.dispose();
    this._labelMaterial.dispose();
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
    this._labelTextGeometry.computeBoundingBox();
    const box = this._labelTextGeometry.boundingBox;
    if (box) {
      // determine the new coordinates of the label bounding box
      // after the label is rotated by the quaternion
      this.labelMinBox.copy(box.min).applyQuaternion(q);
      this.labelMaxBox.copy(box.max).applyQuaternion(q);
      // console.debug(
      //   "MinMax after applying quaternion",
      //   this.labelMinBox,
      //   this.labelMaxBox
      // );

      // Compute the world coordinates of the two bounding
      // box extreme points.
      this.labelMinBox.add(this._labelMesh.position);
      this.labelMaxBox.add(this._labelMesh.position);
      const m1 = this.labelMinBox;
      const m2 = this.labelMaxBox;

      // Compute the shortest distance to the origin
      // among the eight corners
      const shortestDistance = Math.sqrt(
        Math.min(
          m1.x * m1.x + m1.y * m1.y + m1.z * m1.z,
          m1.x * m1.x + m1.y * m1.y + m2.z * m2.z,
          m1.x * m1.x + m2.y * m2.y + m1.z * m1.z,
          m1.x * m1.x + m2.y * m2.y + m2.z * m2.z,
          m2.x * m2.x + m1.y * m1.y + m1.z * m1.z,
          m2.x * m2.x + m1.y * m1.y + m2.z * m2.z,
          m2.x * m2.x + m2.y * m2.y + m1.z * m1.z,
          m2.x * m2.x + m2.y * m2.y + m2.z * m2.z
        )
      );
      // console.debug(
      //   "MinMax after adding parent pos",
      //   this.labelMinBox,
      //   this.labelMaxBox
      // );
      if (shortestDistance < 1.01)
        // make sure the closest point is outside the sphere
        this._labelMesh.position.multiplyScalar(1.01 / shortestDistance);
    }
  }
}
