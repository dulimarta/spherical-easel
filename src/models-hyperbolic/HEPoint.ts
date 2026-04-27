import { MeshStandardMaterial, SphereGeometry, Vector3, Mesh } from "three";
import { HENodule } from "./HENodule";
import {
  HYPERBOLIC_LAYER,
  SETTINGS,
  SURFACE_TYPES
} from "@/global-settings-hyperbolic";
import * as THREE from "three/webgpu";
import {
  CustomMaterial,
  CustomPointMaterial
} from "@/plottables-hyperbolic/MaterialFactory";
import {
  createPoint,
  createIdealPoint,
  createUltraPoint
} from "@/plottables-hyperbolic/MeshFactory";
import { HELabel } from "./HELabel";
import { HyperbolicLabelable, Labelable } from "@/types";

export class HEPoint extends HENodule implements HyperbolicLabelable {
  protected _position = new THREE.Vector4(); // homogeneous coordinates -- w coordinate is -1 for ultra points, 0 for ideal points, and 1 for non-ideal points
  protected _activeUpperValue: boolean; // to track when the point changes upper/lower
  protected _activeSurface: SURFACE_TYPES = SURFACE_TYPES.hyperboloid; // to track which surface the point is currently
  protected _nonFreePoint = false;
  protected _transformationMatrix = new THREE.Matrix4();
  protected _pointMesh!: Mesh;
  protected _pointMaterial!: CustomPointMaterial;
  protected _pointRadius = 0;
  protected _idealMesh!: Mesh;
  protected _idealMaterial!: CustomPointMaterial;
  protected _ultraMesh!: Mesh;
  protected _ultraMaterial!: CustomPointMaterial;

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
    this._pointMesh = createPoint(this.name, temporary);
    this._pointMaterial = this._pointMesh.material as CustomPointMaterial;
    this._pointRadius = this._pointMaterial.radius;
    this._idealMesh = createIdealPoint(this.name, temporary);
    this._idealMaterial = this._idealMesh.material as CustomPointMaterial;
    this._ultraMesh = createUltraPoint(this.name, temporary);
    this._ultraMaterial = this._ultraMesh.material as CustomPointMaterial;

    this._position.copy(position);
    this._nonFreePoint = createNonFreePoint;
    // initialize the point
    this._activeUpperValue = this._position.z > 0;
    this.updateLayer();
    this.updateSurface();
    this.updateOrAddToGroup();
    this.updateTransformationMatrix();
  }
  updateLayer(): void {
    switch (true) {
      case this._position.w > 0:
        this._pointMesh.layers.set(
          this._position.z > 0
            ? HYPERBOLIC_LAYER.upperSheetPoints
            : HYPERBOLIC_LAYER.lowerSheetPoints
        );
        break;
      case this._position.w == 0:
        this._idealMesh.layers.set(
          this._position.z > 0
            ? HYPERBOLIC_LAYER.upperIdealPoints
            : HYPERBOLIC_LAYER.lowerIdealPoints
        );
        break;
      case this._position.w < 0:
        this._ultraMesh.layers.set(
          this._position.z > 0
            ? HYPERBOLIC_LAYER.upperUltraPoints
            : HYPERBOLIC_LAYER.lowerUltraPoints
        );
        break;
    }
  }

  updateSurface(): void {
    switch (true) {
      case this._position.w > 0:
        this._activeSurface = SURFACE_TYPES.hyperboloid;
        break;
      case this._position.w == 0:
        this._activeSurface = SURFACE_TYPES.idealStrip;
        break;
      case this._position.w < 0:
        this._activeSurface = SURFACE_TYPES.ultraStrip;
        break;
    }
  }

  updateOrAddToGroup(): void {
    switch (true) {
      case this._position.w > 0:
        this.group.add(this._pointMesh);
        this.group.remove(this._idealMesh);
        this.group.remove(this._ultraMesh);
        break;
      case this._position.w === 0:
        this.group.remove(this._pointMesh);
        this.group.add(this._idealMesh);
        this.group.remove(this._ultraMesh);
        break;
      case this._position.w < 0:
        this.group.remove(this._pointMesh);
        this.group.remove(this._idealMesh);
        this.group.add(this._ultraMesh);
        break;
    }
  }

  removeAllMeshesFromGroup(): void {
    // console.log("remove from group in HEPoint", this.name);
    this.group.remove(this._pointMesh);
    this.group.remove(this._idealMesh);
    this.group.remove(this._ultraMesh);
  }

  updateVisibility(showing: boolean): void {
    switch (true) {
      case this._position.w > 0:
        this._pointMesh.visible = showing;
        this._idealMesh.visible = false;
        this._ultraMesh.visible = false;
        break;
      case this._position.w == 0:
        this._pointMesh.visible = false;
        this._idealMesh.visible = showing;
        this._ultraMesh.visible = false;
        break;
      case this._position.w < 0:
        this._pointMesh.visible = false;
        this._idealMesh.visible = false;
        this._ultraMesh.visible = showing;
        break;
    }
  }

  public update(): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) return;
    this.setOutOfDate(false);
    this.shallowUpdate();
    this.updateKids();
  }

  public shallowUpdate(): void {
    if (
      (this._position.w > 0 &&
        this._activeSurface !== SURFACE_TYPES.hyperboloid) ||
      (this._position.w === 0 &&
        this._activeSurface !== SURFACE_TYPES.idealStrip) ||
      (this._position.w < 0 && this._activeSurface !== SURFACE_TYPES.ultraStrip)
    ) {
      this.updateSurface();
      this.updateLayer();
      this.updateOrAddToGroup();
    }

    if (this._position.z > 0 && !this._activeUpperValue) {
      this._activeUpperValue = true;
      this.updateLayer();
    } else if (this._position.z <= 0 && this._activeUpperValue) {
      this._activeUpperValue = false;
      this.updateLayer();
    }
    this.updateVisibility(this.showing);

    //change the scale inversely with respect to fov(?), and dollyDistance for non-ideal points
    if (this._activeSurface === SURFACE_TYPES.hyperboloid) {
      this._pointMaterial.radius =
        this._pointRadius *
        (((1 - SETTINGS.percentReductionAtMaxDolly) /
          (SETTINGS.dollyDistanceMin - SETTINGS.dollyDistanceMax)) *
          (HENodule.hyperStore.cameraDollyDistance -
            SETTINGS.dollyDistanceMax) +
          SETTINGS.percentReductionAtMaxDolly);
    }

    this.updateTransformationMatrix();
  }

  updateTransformationMatrix(): void {
    switch (true) {
      case this._position.w > 0: {
        this._transformationMatrix.makeTranslation(
          this._position.x,
          this._position.y,
          this._position.z
        );
        this._pointMaterial.transformationMatrix = this._transformationMatrix;
        this._pointMaterial.position = this._position;
        break;
      }
      case this._position.w === 0: {
        const angle = Math.atan2(this._position.y, this._position.x);
        this._transformationMatrix
          .makeRotationAxis(new Vector3(0, 0, 1), angle - Math.PI / 2) // -Pi/2 because the cone is along the y axis and atan2 measures angle from the x axis
          .multiply(
            new THREE.Matrix4().makeRotationAxis(
              new Vector3(1, 0, 0),
              this._position.z > 0 ? Math.PI / 4 : -Math.PI / 4
            )
          );
        this._idealMaterial.transformationMatrix = this._transformationMatrix;
        this._idealMaterial.position = this._position;
        break;
      }
      // case this._position.w < 0: {
      //   const [x, y, z] = this._position.toArray();

      //   // The relevant direction for the ultra-ideal point is (x, y, -z)
      //   // which is the outward normal to the hyperboloid / polar plane normal
      //   const len = Math.sqrt(x * x + y * y + z * z);
      //   const angle = Math.acos(Math.max(-1, Math.min(1, y / len))); // the angle between normal vector to cylinder <0,1,0> and the inward normal vector at the point (x,y,z) which is <-x,-y,z>
      //   const axis = new Vector3(-z, 0, -x).normalize();

      //   // Handle degenerate case where cylinder is already aligned (angle ≈ 0 or π)
      //   if (axis.lengthSq() < 1e-10) {
      //     // Already aligned or anti-aligned — use identity or 180° rotation
      //     if (y > 0) {
      //       this._transformationMatrix.makeTranslation(x, y, z);
      //     } else {
      //       this._transformationMatrix
      //         .makeTranslation(x, y, z)
      //         .multiply(new THREE.Matrix4().makeRotationX(Math.PI));
      //     }
      //   } else {
      //     const rotMatrix = new THREE.Matrix4().makeRotationAxis(axis, angle);
      //     this._transformationMatrix
      //       .makeTranslation(x, y, z)
      //       .multiply(rotMatrix);
      //   }

      //   this._ultraMaterial.transformationMatrix = this._transformationMatrix;
      //   this._ultraMaterial.position = this._position;
      //   break;
      // }
      case this._position.w < 0: {
        const [x, y, z] = this._position.toArray();

        // 1. The Minkowski normal for the point (x, y, z) is (x, y, -z)
        // We want to align the Torus's local Z-axis (0, 0, 1) with this normal.
        const targetNormal = new THREE.Vector3(x, y, -z).normalize();
        const localUp = new THREE.Vector3(0, 0, 1); // Because we rotated the Lathe geometry to XY

        // 2. Calculate the rotation required to align localUp with targetNormal
        const quaternion = new THREE.Quaternion().setFromUnitVectors(
          localUp,
          targetNormal
        );
        const rotMatrix = new THREE.Matrix4().makeRotationFromQuaternion(
          quaternion
        );

        // 3. Apply translation THEN rotation
        // This places the center of the torus at (x, y, z) and tips it to face (x, y, -z)
        this._transformationMatrix.makeTranslation(x, y, z).multiply(rotMatrix);

        this._ultraMaterial.transformationMatrix = this._transformationMatrix;
        this._ultraMaterial.position = this._position;
        break;
      }
    }
  }
  public setLabel(lab: HELabel) {
    this.label = lab;
  }
  public getLabel(): HELabel {
    return this.label!;
  }

  get upper(): boolean {
    return this._position.z > 0;
  }

  get pointRadius(): number {
    return this._pointMaterial.radius;
  }
  set radius(num: number) {
    this._pointMaterial.radius = num;
  }

  get position(): THREE.Vector4 {
    return this._position;
  }
  set position(pos: THREE.Vector4) {
    this._position.copy(pos);
    this.shallowUpdate();
  }
  get mesh(): Mesh {
    let returnMesh;
    switch (true) {
      case this._position.w > 0:
        returnMesh = this._pointMesh;
        break;
      case this._position.w == 0:
        returnMesh = this._idealMesh;
        break;
      case this._position.w < 0:
        returnMesh = this._ultraMesh;
        break;
    }
    return returnMesh;
  }

  get material(): CustomPointMaterial {
    let returnMaterial;
    switch (true) {
      case this._position.w > 0:
        returnMaterial = this._pointMaterial;
        break;
      case this._position.w == 0:
        returnMaterial = this._idealMaterial;
        break;
      case this._position.w < 0:
        returnMaterial = this._ultraMaterial;
        break;
    }
    return returnMaterial;
  }
}
