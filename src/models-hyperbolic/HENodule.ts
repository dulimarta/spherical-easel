import { CustomMaterial } from "@/plottables-hyperbolic/MaterialFactory";
import { HEStoreType } from "@/stores/hyperbolic";
import { Group, Mesh, MeshBasicMaterial, Scene } from "three";
import { uniform } from "three/tsl";
import * as THREE from "three/webgpu";

let NODE_COUNT = 0;
export abstract class HENodule {
  static POINT_COUNT = 0;
  static TEMP_POINT_COUNT = 0;
  static LINE_COUNT = 0;
  static TEMP_LINE_COUNT = 0;
  static LABEL_COUNT = 0;
  static SEGMENT_COUNT = 0;
  static hyperStore: HEStoreType;
  /* If the object doesn't exist then exists= false (For example the intersection of two circles
        can exist only if the two circles are close enough to each other, but even when they are
        far apart and the intersections don't exist, the user might drag the circles back to where
        the intersections exist). If an object doesn't exist then all of the objects that are
        descendants of the object don't exist. */
  protected _exists = true;

  protected _showing = true;

  /* If the object is selected, it is being used by an event tool or in the style editor. Its glow property is not turned off by the PoseTracker.ts routines*/
  protected _selected = false;

  /* This boolean is set to indicate that the object is out of date and needs to be updated. */
  protected _outOfDate = false;
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

  public setOutOfDate(b: boolean): void {
    this._outOfDate = b;
  }

  /* Marks all descendants (kids, grand kids, etc.) of the current HE|SENodule out of date */
  public markKidsOutOfDate(): void {
    this._kids.forEach(item => {
      item.setOutOfDate(true);
      item.markKidsOutOfDate();
    });
  }

  public addGroupToScene(s: Scene): void {
    // console.log("added", this.name, "to scene");
    s.add(this.group);
  }

  public removeGroupFromScene(s: Scene) {
    this.group.children
      .map(c => c as Mesh)
      .forEach(c => {
        (c.material as CustomMaterial).dispose();
        c.geometry.dispose();
      });
    s.remove(this.group);
    // console.log("removed", this.name, "from scene");
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

  public glowingDisplay(): void {
    // console.log("HENodule set glowDisplay", this.name);
    (this.material as CustomMaterial).glowing = 1;
  }
  public normalDisplay(): void {
    // console.log("HENodule set normalDisplay", this.name);
    (this.material as CustomMaterial).glowing = 0;
  }

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
    // console.log("set showing in HENodule", this.name, " to ", b);
    this._showing = b; // set the variable
    const mesh = this.mesh;
    if (mesh) {
      mesh.visible = b; // set the actual display
    }
  }

  get showing(): boolean {
    return this._showing;
  }

  set glowing(b: boolean) {
    //glowing has no effect on hidden objects
    // console.log("HENodule set glow of ", this.name, " to ", b);
    if (this._selected || !this.showing) return;
    if (b) {
      // Set the display for the corresponding plottable object
      this.glowingDisplay();
    } else {
      this.normalDisplay();
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
      this.glowingDisplay();
    } else {
      this.normalDisplay();
    }
  }
  get selected(): boolean {
    return this._selected;
  }
  //Every HENodule object will have a mesh and a (custom) material
  protected abstract get material(): THREE.MeshStandardNodeMaterial;
  protected abstract get mesh(): Mesh;

  static hyperbolicTranslation(u: number): THREE.Matrix4 {
    return new THREE.Matrix4(
      1,
      0,
      0,
      0, // row1
      0,
      Math.cosh(u),
      Math.sinh(u),
      0, // row2
      0,
      Math.sinh(u),
      Math.cosh(u),
      0, // row3
      0,
      0,
      0,
      1 // row 4
    );
  }
  static hyperbolicRotation(theta: number): THREE.Matrix4 {
    return new THREE.Matrix4(
      Math.cos(theta),
      -Math.sin(theta),
      0,
      0, // row1
      Math.sin(theta),
      Math.cos(theta),
      0,
      0, // row2
      0,
      0,
      1,
      0, // row3
      0,
      0,
      0,
      1 // row 4
    );
  }
}
