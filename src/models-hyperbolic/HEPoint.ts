import { MeshStandardMaterial, SphereGeometry, Vector3, Mesh } from "three";
import { HENodule } from "./HENodule";
import SETTINGS, { HYPERBOLIC_LAYER } from "@/global-settings-hyperbolic";
import * as THREE from "three/webgpu";
import {
  CustomMaterial,
  CustomPointMaterial
} from "@/plottables-hyperbolic/MaterialFactory";
import {
  createPoint,
  createIdealPoint
} from "@/plottables-hyperbolic/MeshFactory";
import { HELabel } from "./HELabel";
import { cos } from "three/tsl";
import { L } from "vitest/dist/chunks/environment.d.cL3nLXbE.js";
import { HyperbolicLabelable, Labelable } from "@/types";

export class HEPoint extends HENodule implements HyperbolicLabelable {
  protected _upper;
  protected _position = new THREE.Vector4(); // homogeneous coordinates -- w coordinate is 0 for ideal points and 1 for non-ideal points
  protected _height = 0.33; // height is used to control the length of the cone that represents ideal points
  protected _radius; // radius is used to control the radius of the non-ideal points  or the radius of the base of the cone that represents ideal points
  protected _nonFreePoint = false;
  protected _transformationMatrix = new THREE.Matrix4();
  protected _mesh!: Mesh;
  protected _material!: CustomPointMaterial;
  public label?: HELabel;

  constructor(
    position: THREE.Vector4,
    createNonFreePoint: boolean = false,
    temporary: boolean = false
  ) {
    super();

    if (!temporary) {
      HENodule.POINT_COUNT++;
      this.name = `P${HENodule.POINT_COUNT}`;
    } else {
      HENodule.TEMP_POINT_COUNT++;
      this.name = `tempP${HENodule.TEMP_POINT_COUNT}`;
    }

    if (position.w === 0) {
      this._radius = 0.15; // radius of the base of the cone representing ideal points
      this._mesh = createIdealPoint(
        this.name,
        position.z > 0,
        temporary,
        this._radius,
        this._height
      );
    } else {
      this._radius = 0.12; // radius of the non-ideal points
      this._mesh = createPoint(
        this.name,
        position.z > 0,
        temporary,
        this._radius
      );
    }
    this._material = this._mesh.material as CustomPointMaterial;
    this._position.copy(position);
    this._upper = position.z > 0;
    this._nonFreePoint = createNonFreePoint;
    this.updateTransformationMatrix(); // set the transformation matrix

    // Add the mesh to a layer so if the lower sheet is turned off, the points in that layer are not displayed
    if (!temporary) {
      // only non-temporary points are added to layers, because temporary points move between upper and lower dynamically
      if (this._upper) {
        this._mesh.layers.set(
          this._position.w === 0
            ? HYPERBOLIC_LAYER.upperSheetIdealPoints
            : HYPERBOLIC_LAYER.upperSheetPoints
        );
      } else {
        this._mesh.layers.set(
          this._position.w === 0
            ? HYPERBOLIC_LAYER.lowerSheetIdealPoints
            : HYPERBOLIC_LAYER.lowerSheetPoints
        );
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
    //change the scale inversely with respect to fov(?), and dollyDistance for non-ideal points
    this._material.radius =
      this._radius *
      (((1 - SETTINGS.percentReductionAtMaxDolly) /
        (SETTINGS.dollyDistanceMin - SETTINGS.dollyDistanceMax)) *
        (HENodule.hyperStore.cameraDollyDistance - SETTINGS.dollyDistanceMax) +
        SETTINGS.percentReductionAtMaxDolly);
    this.updateTransformationMatrix();
  }

  public setLabel(lab: HELabel) {
    this.label = lab;
  }
  public getLabel(): HELabel {
    return this.label!;
  }

  updateTransformationMatrix(): void {
    if (this._position.w === 0) {
      const angle = Math.atan2(this._position.y, this._position.x);
      this._transformationMatrix = this._transformationMatrix
        .makeRotationAxis(new Vector3(0, 0, 1), angle - Math.PI / 2) // -Pi/2 because the cone is along the y axis and atan2 measures angle from the x axis
        .multiply(
          new THREE.Matrix4().makeRotationAxis(
            new Vector3(1, 0, 0),
            this._upper ? Math.PI / 4 : -Math.PI / 4
          )
        );
    } else {
      this._transformationMatrix = this._transformationMatrix.makeTranslation(
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

  get radius(): number {
    return this._material.radius;
  }
  set radius(num: number) {
    this._material.radius = num;
  }

  get position(): THREE.Vector4 {
    return this._position;
  }
  set position(pos: THREE.Vector4) {
    this._position.copy(pos);
    this._upper = pos.z > 0;
    this.shallowUpdate();
  }
  get mesh(): Mesh {
    return this._mesh;
  }
  get material(): CustomPointMaterial {
    return this._material;
  }
}
