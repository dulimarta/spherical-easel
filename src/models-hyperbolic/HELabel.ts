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
  protected _location: THREE.Vector3 | null = null; // remains null for labels at infinity
  protected _angle: number | null = null; // remains null for labels NOT at infinity
  protected _upper: boolean;
  protected _mesh!: THREE.Mesh;
  protected _material!: CustomTextMaterial;
  private _currentText: string;
  private _textObject!: ThreeTextGeometryInfo;
  private _labelParentType: string;
  private _fontPath: string;

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
    this._fontPath = "/fonts/Roboto.ttf"; // adjust to your font path
    HENodule.LABEL_COUNT++;
    this.name = "La" + HENodule.LABEL_COUNT;
    this._upper = upper;
    this._material = new CustomTextMaterial();

    // Build the mesh async
    this._initMesh(posOrAngle, text, atInfinity, upper);
  }

  private async _initMesh(
    posOrAngle: THREE.Vector3 | number,
    text: string,
    atInfinity: boolean,
    upper: boolean
  ): Promise<void> {
    this._textObject = await Text.create({
      text,
      font: this._fontPath,
      size: 0.03,
      depth: 0 // flat text — uses DoubleSide material, saves ~50% triangles
    });

    this._mesh = new THREE.Mesh(this._textObject.geometry, this._material);
    this._mesh.name = this.name;
    this._material.color.set("black");
    this._mesh.scale.setScalar(10);

    // Center the text horizontally (equivalent to anchorX: "center")
    const bounds = this._textObject.planeBounds;
    // const offsetX = (bounds.min.x + bounds.max.x) / 2;
    // const offsetY = bounds.min.y; // equivalent to anchorY: "bottom"
    // this._mesh.position.x -= offsetX;
    // this._mesh.position.y -= offsetY;

    this._textObject.geometry.translate(
      -(bounds.min.x + bounds.max.x) / 2,
      -bounds.min.y,
      0
    );

    // set the  Position
    this.setLocation(posOrAngle);

    // Face the camera
    this._mesh.quaternion.copy(HENodule.hyperStore.cameraQuaternion);

    // Layers
    if (upper) {
      this._mesh.layers.set(
        atInfinity
          ? HYPERBOLIC_LAYER.upperSheetInfLabels
          : HYPERBOLIC_LAYER.upperSheetLabels
      );
    } else {
      this._mesh.layers.set(
        atInfinity
          ? HYPERBOLIC_LAYER.lowerSheetInfLabels
          : HYPERBOLIC_LAYER.lowerSheetLabels
      );
    }

    this.group.add(this._mesh);
  }

  public async setText(newText: string): Promise<void> {
    this._currentText = newText;
    if (!this._mesh) return;

    // recreate the text object
    this._textObject = await Text.create({
      text: newText,
      font: this._fontPath,
      size: 0.03,
      depth: 0
    });

    // Dispose old geometry to avoid memory leak
    this._mesh.geometry.dispose();
    this._mesh.geometry = this._textObject.geometry;

    // Re-center
    const bounds = this._textObject.planeBounds;
    this._textObject.geometry.translate(
      -(bounds.min.x + bounds.max.x) / 2,
      -bounds.min.y,
      0
    );
  }

  public update(): void {
    //throw new Error("Method not implemented.");
  }
  public shallowUpdate(): void {
    //throw new Error("Method not implemented.");
  }
  //over ride the HENodule glowing display because text is not a CustomMaterial
  public glowingDisplay(): void {
    //throw new Error("Method not implemented.");
  }
  //over ride the HENodule glowing display because text is not a CustomMaterial
  public normalDisplay(): void {
    //throw new Error("Method not implemented.");
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
      this._angle = posOrAngle;
      const unitDir = new THREE.Vector3(
        Math.cos(this._angle),
        Math.sin(this._angle),
        1
      );
      if (this._upper) {
        this._mesh.position.copy(
          unitDir.multiplyScalar(
            (zUpperPAIClipPlus.value + zUpperPAIClipMinus.value) / 2
          )
        );
      } else {
        this._mesh.position.copy(
          unitDir.multiplyScalar(
            (zLowerPAIClipPlus.value + zLowerPAIClipMinus.value) / 2
          )
        );
      }
    } else {
      this._location = posOrAngle;
      this._mesh.position.copy(posOrAngle);
    }

    // if (this.showing) {
    //   this._mesh.visible = true;
    // }
  }
  get location(): THREE.Vector3 | null {
    return this._location;
  }
  get angle(): number | null {
    return this._angle;
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
