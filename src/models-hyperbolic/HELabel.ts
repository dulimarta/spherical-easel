import { Text, ThreeTextGeometryInfo } from "three-text/three";
import * as THREE from "three/webgpu";
import {
  CustomMaterial,
  CustomTextMaterial
} from "@/plottables-hyperbolic/MaterialFactory";
import { HYPERBOLIC_LAYER } from "@/global-settings-hyperbolic";
import { HENodule } from "@/models-hyperbolic/HENodule";
import { LabelParentTypes } from "@/types";
import {
  createLabel,
  unitLength,
  zLowerPAIClipMinus,
  zLowerPAIClipPlus,
  zUpperPAIClipMinus,
  zUpperPAIClipPlus
} from "@/plottables-hyperbolic/MeshFactory";

//import { createLabel } from "@/plottables-hyperbolic/MeshFactory";

// // One-time setup — call this at app startup before any HELabel is created
// Text.setHarfBuzzPath("/hb/hb.wasm");

export class HELabel extends HENodule {
  public parent: HENodule;
  protected _atInfinity: boolean;
  protected _mesh!: THREE.Mesh;
  protected _material!: CustomTextMaterial;
  private _currentText: string;
  private _labelParentType: string;

  constructor(
    labelType: LabelParentTypes,
    parent: HENodule,
    posOrAngle: THREE.Vector3 | number,
    text: string,
    atInfinity: boolean,
    upper: boolean
  ) {
    super();
    this.parent = parent;
    this._currentText = text;
    this._labelParentType = labelType;
    HENodule.LABEL_COUNT++;
    this.name = "La" + HENodule.LABEL_COUNT;
    this._atInfinity = atInfinity;
    console.log("here", this.name);
    this._initMesh({
      posOrAngle: posOrAngle,
      upper: upper
    });
  }

  private async _initMesh({
    posOrAngle,
    upper
  }: {
    posOrAngle: THREE.Vector3 | number;
    upper: boolean;
  }): Promise<void> {
    // Build the mesh async
    console.log("b here", this.name, posOrAngle.toFixed(2));
    this._mesh = await createLabel({
      posOrAngle: posOrAngle,
      text: this._currentText,
      atInfinity: this._atInfinity,
      upper: upper,
      name: this.name
    });
    this._material = this._mesh.material as CustomTextMaterial;
    // this._material.polygonOffset = true;
    // this._material.polygonOffsetFactor = -10; // negative = toward camera
    // this._material.polygonOffsetUnits = -10;

    // Layers
    if (upper) {
      this._mesh.layers.set(
        this._atInfinity
          ? HYPERBOLIC_LAYER.upperSheetInfLabels
          : HYPERBOLIC_LAYER.upperSheetLabels
      );
    } else {
      this._mesh.layers.set(
        this._atInfinity
          ? HYPERBOLIC_LAYER.lowerSheetInfLabels
          : HYPERBOLIC_LAYER.lowerSheetLabels
      );
    }
    this.applyLabelOffset(-0.5, -0.5);
    // Face the camera
    this.faceCamera();

    console.log("Added mesh to group", this._mesh, this.name);
    this.group.add(this._mesh);
  }

  public async changeText(newText: string): Promise<void> {
    this._currentText = newText;
    // record the current location information
    const upper = this._material.userData.upper.value > 0.5;
    const posOrAngle = this._atInfinity
      ? this._material.userData.angle.value
      : this._material.userData.position.value;
    // Dispose old geometry to avoid memory leak
    this._mesh.geometry.dispose();
    this._material.dispose();
    if (Array.isArray(this._mesh.material)) {
      this._mesh.material.forEach(m => m.dispose());
    } else {
      this._mesh.material.dispose();
    }
    if (this._material.map) this._material.map.dispose();
    this.group.remove(this._mesh);

    this._initMesh({
      posOrAngle: posOrAngle,
      upper: upper
    });
  }

  public update(): void {
    //throw new Error("Method not implemented.");
  }
  public shallowUpdate(): void {
    //throw new Error("Method not implemented.");
  }

  //change the scale to size (in multiplies of the unit)
  public adjustScale(size: number): void {
    console.log("New Size", size);
    this._material.scale = size;
  }

  public faceCamera(): void {
    const cameraDirection = new THREE.Vector3(0, 0, -1);
    cameraDirection.applyQuaternion(HENodule.hyperStore.cameraQuaternion);
    // console.log("HELabel dir", cameraDirection.toFixed(2));
    this._material.unitCameraDirection = cameraDirection.normalize();
  }

  public applyLabelOffset(x: number, y: number): void {
    this._material.offsetX = x;
    this._material.offsetY = y;
  }
  /**
   * Set or get the location vector of the SEPoint on the unit ideal sphere
   */
  public setLocation(posOrAngle: THREE.Vector3 | number) {
    // Record the location on the unit ideal sphere of this SELabel
    // If the parent is not out of date, use the closest vector, if not set the location directly
    // and the program will update the parent later so that the set location is on the parent (even though it is
    // at the time of execution)
    // if (!this.parent.isOutOfDate()) {
    //   this._locationVector
    //     .copy(
    //       (this.parent as unknown as Labelable).closestLabelLocationVector(
    //         pos,
    //         SENodule.store.zoomMagnificationFactor
    //       )
    //     )
    //     .normalize();
    // } else {
    // this._locationVector.copy(pos);
    // }
    // Set the position of the associated displayed plottable Label
    if (typeof posOrAngle === "number") {
      this._material.angle = posOrAngle;
    } else {
      this._material.position = posOrAngle;
    }
  }
  get location(): THREE.Vector3 | null {
    return this._material.position;
  }
  get angle(): number | null {
    return this._material.angle;
  }
  get upper(): boolean {
    return this._material.upper > 0.5;
  }
  get atInfinity(): boolean {
    return this._atInfinity;
  }
  get mesh(): THREE.Mesh {
    return this._mesh;
  }
  get material(): CustomMaterial {
    return this._material;
  }
}

// import { Mesh, Vector3 } from "three";
// import { HENodule } from "./HENodule";
// import { Text } from "troika-three-text";
// import { HYPERBOLIC_LAYER } from "@/global-settings-hyperbolic";
// import { LabelParentTypes } from "@/types";
// import { MeshStandardNodeMaterial } from "three/webgpu";

// export class HELabel extends HENodule {
//   public parent: HENodule;
//   protected _locationVector: Vector3 | null = null;
//   protected _angle: number | null = null; // if the label is at infinity, this is the angle.
//   protected _mesh!: Text;
//   protected _material!: MeshStandardNodeMaterial;
//   private _heLabelParentType: LabelParentTypes;

//   constructor(
//     labelType: LabelParentTypes,
//     parent: HENodule,
//     positionOrAngle: Vector3 | number,
//     text: string,
//     atInfinity: boolean,
//     upper: boolean
//   ) {
//     super();
//     this._heLabelParentType = labelType;
//     this.parent = parent;
//     this._mesh = new Text();
//     HENodule.LABEL_COUNT++;
//     this.name = "La" + HENodule.LABEL_COUNT;
//     this._mesh.text = text;
//     this._mesh.anchorX = "center";
//     this._mesh.anchorY = "bottom";
//     // this._mesh.position.set(0, 0, 0);
//     this._mesh.fontSize = 0.03;
//     this._mesh.color = "black"; //0x000000;
//     // Copy the camera quaternion so the text is always facing the camera
//     this._mesh.quaternion.copy(HENodule.hyperStore.cameraQuaternion);
//     if (positionOrAngle instanceof Vector3) {
//       console.log(`Creating text at ${positionOrAngle.toFixed(2)}`);
//       this._mesh.position.copy(positionOrAngle);
//     } else {
//       console.log(`Creating text at angle ${positionOrAngle.toFixed(2)}`);

//       this._mesh.position.copy(positionOrAngle);
//     }

//     // Copy the camera quaternion so the text is always facing the camera
//     // this._mesh.quaternion.copy(HENodule.hyperStore.cameraQuaternion);
//     // Disable depthTest so the text is not occluded by other objects?
//     // But the sideeffect is that text objects will never get occluded
//     // this._mesh.material.depthTest = false;

//     this._material = new CustomTextMaterial();
//     this._mesh.sync(() => {
//       this._mesh.material = this._material; // overwrite the native material of the
//     });
//     this.group.add(this._mesh);

//     // // Disable depthTest so the text is not occluded by other objects?
//     // // But the sideeffect is that text objects will never get occluded
//     // // txtObject.material.depthTest = false;

//     // Add the mesh to a layer so if the lower sheet is turned off, the points in that layer are not displayed
//     if (upper) {
//       if (atInfinity) {
//         this._mesh.layers.set(HYPERBOLIC_LAYER.upperSheetInfLabels);
//       } else {
//         this._mesh.layers.set(HYPERBOLIC_LAYER.upperSheetLabels);
//       }
//     } else {
//       if (atInfinity) {
//         this._mesh.layers.set(HYPERBOLIC_LAYER.lowerSheetInfLabels);
//       } else {
//         this._mesh.layers.set(HYPERBOLIC_LAYER.lowerSheetLabels);
//       }
//     }
//   }

// }
