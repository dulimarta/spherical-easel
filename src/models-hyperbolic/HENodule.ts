import { CustomPointMaterial } from "@/plottables-hyperbolic/MeshFactory";
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
  /* If the object doesn't exist then exists= false (For example the intersection of two circles
        can exist only if the two circles are close enough to each other, but even when they are
        far apart and the intersections don't exist, the user might drag the circles back to where
        the intersections exist). If an object doesn't exist then all of the objects that are
        descendants of the object don't exist. */
  protected _exists = true;

  protected _showing = true;

  /* If the object is selected, it is either being used by an event tool or is in the setSelectedSENodules in mutations. Its glow property is not turned off by the highlighter.ts routines*/
  protected _selected = false;

  /* This boolean is set to indicate that the object is out of date and needs to be updated. */
  protected _outOfDate = false;
  protected _parents: HENodule[] = [];
  protected _kids: HENodule[] = [];
  public id: number;
  public name = "";

  // every non-abstract  subclass of HENodule has a Mesh and an associated material. 
  private _mesh: Mesh;
  private _material: CustomPointMaterial;

  constructor(mesh: Mesh) {
    this.id = NODE_COUNT++;
    this._mesh = mesh;
    this._material = this._mesh.material as CustomPointMaterial;
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

  public setOutOfDate(b: boolean): void {
    this._outOfDate = b;
  }

  /* Marks all descendants (kids, grand kids, etc.) of the current SENodule out of date */
  public markKidsOutOfDate(): void {
    this._kids.forEach(item => {
      item.setOutOfDate(true);
      item.markKidsOutOfDate();
    });
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

  public isOutOfDate(): boolean {
    return this._outOfDate;
  }
  public canUpdateNow(): boolean {
    return !this._parents.some(item => item.isOutOfDate());
  }

  /* Kids of the current SENodule are updated  */
  public updateKids() // objectState?: Map<number, ObjectState>,
  // orderedSENoduleList?: number[]
  : void {
    // In order to do a topological sort of the Data Structure (Directed Acyclic Graph), we first
    // query which of the kids of this object are updatable right now and then for those that are updatable
    // we update them. This means that every descendant object is visited only once.
    const updatableNowIndexList: number[] = [];
    this._kids.forEach((item, index) => {
      if (item.canUpdateNow()) {
        updatableNowIndexList.push(index);
      }
    });

    for (let i = 0; i < updatableNowIndexList.length; i++) {
      this._kids[updatableNowIndexList[i]].update();
    }
    return;
  }

  public abstract update(): void;
  public abstract shallowUpdate(): void;
  public abstract glowingDisplay(): void;
  public abstract normalDisplay(): void;

  set exists(b: boolean) {
    this._exists = b;
  }

  get exists(): boolean {
    return this._exists;
  }

  get kids(): HENodule[] {
    return this._kids;
  }

  get parents(): HENodule[] {
    return this._parents;
  }

  set showing(b: boolean) {
    this._showing = b;
    // Set the showing variable
    // if (this.ref) {
    //   // console.log("set showing in SENodule to ", b, " in ", this.name)
    //   this.ref.showing = b; // internally this invokes setVisible()
    //   // Set the display for the corresponding plottable object
    //   // this.ref?.setVisible(b);
    // }
  }

  get showing(): boolean {
    return this._showing;
  }

  set glowing(b: boolean) {
    //glowing has no effect on hidden objects
    //console.log("SENodule set glow of ", this.name, " to ", b);
    //console.log("SENodul::object:", this.name, " ref id ", this.ref?.id);
    if (/*this._selected || */ !this.showing) return;
    if (b) {
      // Set the display for the corresponding plottable object
      // this.ref?.glowingDisplay();
    } else {
      // this.ref?.normalDisplay();
    }
  }

  /** Careful n.selected is not the same as being on the setSelectedSENodules list. A selected
   *  object's glow property is not turned off by the highlighter.ts routines */
  set selected(b: boolean) {
    // console.log("SENodule::selected() arg", b);
    // selecting has no effect on hidden objects
    if (!this.showing) return;
    this._selected = b;
    if (b) {
      // Set the display for the corresponding plottable object
      // this.ref?.glowingDisplay();
      // TODO: do we need to set glowing?
      // this.glowing = true;
    } else {
      // this.ref?.normalDisplay();
    }
  }

  get selected(): boolean {
    return this._selected;
  }
}
