import { MeshStandardMaterial, SphereGeometry, Vector3, Mesh } from "three";
import { HENodule } from "./HENodule";
// import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";
import { Text } from "troika-three-text";
import { HYPERBOLIC_LAYER } from "@/global-settings-hyperbolic";
import * as THREE from "three/webgpu";
import { CustomPointMaterial } from "@/plottables-hyperbolic/MaterialFactory";

export class HEPoint extends HENodule {
  private _pointMesh: Mesh;
  private _pointMaterial: CustomPointMaterial;
  protected _atInfinity = false;

  constructor(mesh: Mesh, atInfinity: boolean) {
    super();
    this._pointMesh = mesh;
    this._pointMaterial = mesh.material as CustomPointMaterial;
    HENodule.POINT_COUNT++;
    this._pointMesh.name = `P${HENodule.POINT_COUNT}`;
    this.name = `P${HENodule.POINT_COUNT}`;
    this._atInfinity = atInfinity;
  }

  public update(): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) return;
    this.setOutOfDate(false);
    this.shallowUpdate();
    this.updateKids();
  }
  public shallowUpdate(): void {
    this._pointMesh.visible = this.showing;
  }
  public glowingDisplay(): void {
    this._pointMaterial.glowing = true;
  }
  public normalDisplay(): void {
    this._pointMaterial.glowing = false;
  }
  get pointMaterial(): CustomPointMaterial {
    return this._pointMaterial;
  }
  get pointMesh(): Mesh {
    return this._pointMesh;
  }
  get location(): Vector3 {
    return this._pointMaterial.position;
  }
  get upper(): boolean {
    return this._pointMaterial.upper;
  }
  get atInfinity(): boolean {
    return this.atInfinity;
  }
}
