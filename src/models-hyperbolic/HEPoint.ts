import { MeshStandardMaterial, SphereGeometry, Vector3, Mesh } from "three";
import { HENodule } from "./HENodule";
// import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";
import { Text } from "troika-three-text";
import { HYPERBOLIC_LAYER } from "@/global-settings-hyperbolic";
import * as THREE from "three/webgpu";
import {
  CustomMaterial,
  CustomPointMaterial
} from "@/plottables-hyperbolic/MaterialFactory";
import {
  createPoint,
  createPointAtInfinity
} from "@/plottables-hyperbolic/MeshFactory";

export class HEPoint extends HENodule {
  protected _atInfinity = false;
  protected _nonFreePoint = false;
  protected _mesh!: Mesh;
  protected _material!: CustomPointMaterial;

  constructor({
    atInfinity,
    upper,
    createNonFreePoint = false
  }: {
    atInfinity: boolean;
    upper: boolean;
    createNonFreePoint?: boolean;
  }) {
    super();
    HENodule.POINT_COUNT++;
    this.name = `P${HENodule.POINT_COUNT}`;
    if (atInfinity) {
      this._mesh = createPointAtInfinity({
        name: `P${HENodule.POINT_COUNT}`,
        upper: upper
      });
    } else {
      this._mesh = createPoint({
        name: `P${HENodule.POINT_COUNT}`,
        upper: upper
      });
    }
    // Add the mesh to a layer so if the lower sheet is turned off, the points in that layer are not displayed
    if (upper) {
      if (atInfinity) {
        this._mesh.layers.set(HYPERBOLIC_LAYER.upperSheetInfPoints);
      } else {
        this._mesh.layers.set(HYPERBOLIC_LAYER.upperSheetPoints);
      }
    } else {
      if (atInfinity) {
        this._mesh.layers.set(HYPERBOLIC_LAYER.lowerSheetInfPoints);
      } else {
        this._mesh.layers.set(HYPERBOLIC_LAYER.lowerSheetPoints);
      }
    }
    this._material = this._mesh.material as CustomPointMaterial;
    this._atInfinity = atInfinity;
    this._nonFreePoint = createNonFreePoint;
    this.group.add(this._mesh);
  }

  public update(): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) return;
    this.setOutOfDate(false);
    this.shallowUpdate();
    this.updateKids();
  }
  public shallowUpdate(): void {
    this._mesh.visible = this.showing;
  }

  // location is used to position points NOT at infinity
  get location(): Vector3 {
    return this._material.position;
  }
  set location(pos: Vector3) {
    this._material.position = pos;
  }
  get upper(): boolean {
    return this._material.upper > 0.5;
  }
  get atInfinity(): boolean {
    return this._atInfinity;
  }
  get radius(): number {
    return this._material.radius;
  }
  set radius(num: number) {
    this._material.radius = num;
  }
  // angle is used to position points at infinity
  get angle(): number {
    return this._material.angle;
  }
  set angle(angle: number) {
    this._material.angle = angle;
  }
  get mesh(): Mesh {
    return this._mesh;
  }
  get material(): CustomPointMaterial {
    return this._material;
  }
}
