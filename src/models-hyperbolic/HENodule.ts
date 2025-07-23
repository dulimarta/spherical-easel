import { HEStoreType } from "@/stores/hyperbolic";
import { Group, Mesh, MeshBasicMaterial, Scene } from "three";

let NODE_COUNT = 0;
export abstract class HENodule {
  static POINT_COUNT = 0;
  static LINE_COUNT = 0;
  static SEGMENT_COUNT = 0;
  static hyperStore: HEStoreType;

  protected _parents: HENodule[] = [];
  protected _kids: HENodule[] = [];
  public id: number;
  public name = "";
  // public mesh: Array<Mesh> = [];
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
  private addKind(n: HENodule) {
    this._kids.push(n);
  }

  private removeKid(n: HENodule) {
    const idx = this._kids.findIndex(node => node.id === n.id);
    if (idx >= 0) this._parents.splice(idx, 1);
  }
  public registerChild(n: HENodule) {
    this.addKind(n);
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
