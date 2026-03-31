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
import { HELabel } from "./HELabel";

export class HEPoint extends HENodule {
  protected _atInfinity = false;
  protected _upper;

  protected _angle = 0; // angle is used to position points at infinity
  protected _position = new Vector3(); // position is used to position points NOT at infinity
  protected _height = 0.33; // height is used to control the length of the cone that represents points at infinity
  protected _radius = this._atInfinity ? 0.18 : 0.15; // radius is used to control the radius of the points not at infinity or the radius of the base of the cone that represents points at infinity
  protected _nonFreePoint = false;
  protected _transformationMatrix = new THREE.Matrix4();
  protected _mesh!: Mesh;
  protected _material!: CustomPointMaterial;
  public label?: HELabel;

  constructor(
    posOrAngle: THREE.Vector3 | number,
    atInfinity: boolean,
    upper: boolean,
    createNonFreePoint: boolean = false,
    temporary: boolean = false
  ) {
    super();
    HENodule.POINT_COUNT++;
    this.name = `P${HENodule.POINT_COUNT}`;
    if (atInfinity) {
      this._mesh = createPointAtInfinity({
        name: this.name,
        radius: this._radius,
        height: this._height,
        upper: upper,
        angle: typeof posOrAngle == "number" ? posOrAngle : 0,
        temporary: temporary
      });
    } else {
      this._mesh = createPoint({
        radius: this._radius,
        name: this.name,
        upper: upper,
        temporary: temporary
      });
    }
    if (typeof posOrAngle === "number") {
      this._angle = posOrAngle;
    } else {
      this._position.copy(posOrAngle);
    }
    this._material = this._mesh.material as CustomPointMaterial;
    this._upper = upper;
    this._atInfinity = atInfinity;
    this._nonFreePoint = createNonFreePoint;
    this.updateTransformationMatrix(); // set the transformation matrix

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
    this.updateTransformationMatrix();
  }

  public setLabel(lab: HELabel) {
    this.label = lab;
  }
  public getLabel(): HELabel {
    return this.label!;
  }

  updateTransformationMatrix(): void {
    if (this._atInfinity) {
      this._transformationMatrix = new THREE.Matrix4()
        .makeRotationAxis(new Vector3(0, 0, 1), this._angle - Math.PI / 2)
        .multiply(
          new THREE.Matrix4().makeRotationAxis(
            new Vector3(1, 0, 0),
            this._upper ? Math.PI / 4 : -Math.PI / 4
          )
        );
    } else {
      this._transformationMatrix = new THREE.Matrix4().makeTranslation(
        this._position.x,
        this._position.y,
        this._position.z
      );
    }
    this._material.transformationMatrix = this._transformationMatrix;
  }
  get upper(): boolean {
    return this._upper;
  }
  set upper(isUpper: boolean) {
    this._upper = isUpper;
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
    return this._angle;
  }
  set angle(angle: number) {
    this._angle = angle;
    this.shallowUpdate();
  }
  // location is used to position points NOT at infinity
  get position(): Vector3 {
    return this._position;
  }
  set position(pos: Vector3) {
    this._position = pos;
    this.shallowUpdate();
  }
  get mesh(): Mesh {
    return this._mesh;
  }
  get material(): CustomPointMaterial {
    return this._material;
  }
}
