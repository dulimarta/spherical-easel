import { HEStoreType } from "@/stores/hyperbolic";
import { Group, Mesh, MeshBasicMaterial, Scene } from "three";
import { uniform } from "three/tsl";
import * as THREE from "three/webgpu";

let NODE_COUNT = 0;
export abstract class HENodule {
  static POINT_COUNT = 0;
  static LINE_COUNT = 0;
  static SEGMENT_COUNT = 0;
  static hyperStore: HEStoreType;

  //Unit is the unit length in the scene at any given dolly distance and any given zoom level
  // all other lengths and size are relative to this unit. I.e. if a point has a size of 1.2, then in the
  // scene it is rendered at unit.value * size.value in world coordinates.
  // one goal of the unit is to adjust the size of objects so they appear the same (or similar) size at
  // all(some?) dolly distances and zoom levels.
  protected unit: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>> =
    uniform(1.0);

  protected _parents: HENodule[] = [];
  protected _kids: HENodule[] = [];
  public id: number;
  public name = "";

  public group = new Group();
  constructor() {
    this.id = NODE_COUNT++;
  }

  private addParent(n: HENodule) {
    this._parents.push(n);
  }

  private removeParent(n: HENodule) {
    const idx = this._parents.findIndex(node => node.id === n.id);
    if (idx >= 0) this._parents.splice(idx, 1);
  }
  private addKid(n: HENodule) {
    this._kids.push(n);
  }

  private removeKid(n: HENodule) {
    const idx = this._kids.findIndex(node => node.id === n.id);
    if (idx >= 0) this._parents.splice(idx, 1);
  }
  public registerChild(n: HENodule) {
    this.addKid(n);
    n.addParent(this);
  }
  public unregisterChild(n: HENodule) {
    this.removeKid(n);
    n.removeParent(this);
  }
  public removeThisNode() {
    this._parents.forEach(item => {
      item.unregisterChild(this);
    });
    while (this._kids.length > 0) {
      this._kids[0].removeThisNode();
    }
  }

  public addToScene(s: Scene): void {
    s.add(this.group);
  }
  public removeFromScene(s: Scene) {
    this.group.children
      .map(c => c as Mesh)
      .forEach(c => {
        (c.material as MeshBasicMaterial).dispose();
        c.geometry.dispose();
      });
    s.remove(this.group);
  }

  public abstract update(): void;
  public abstract shallowUpdate(): void;
  public abstract glowingDisplay(): void;
  public abstract normalDisplay(): void;
}
