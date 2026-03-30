import { Text, ThreeTextGeometryInfo } from "three-text/three";
import * as THREE from "three/webgpu";
import {
  CustomMaterial,
  CustomLabelMaterial
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
import { HEPoint } from "./HEPoint";
import {
  intersectWithHyperboloid,
  intersectWithPointAtInfinityStrip
} from "@/utils/helpingHEFunctions";

//import { createLabel } from "@/plottables-hyperbolic/MeshFactory";

// // One-time setup — call this at app startup before any HELabel is created
// Text.setHarfBuzzPath("/hb/hb.wasm");
type PlaneBounds = {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
};

export class HELabel extends HENodule {
  public parent: HENodule;
  protected _atInfinity: boolean;
  protected _mesh!: THREE.Mesh;
  protected _material!: CustomLabelMaterial;
  protected _fontPath = "/fonts/Roboto.ttf";
  protected _currentText: string;
  protected _labelParentType: string;
  protected _angle: number = 0;
  protected _position: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  protected _upper: boolean;
  protected _scale: number = 0.2; // initial scale in multiples of unit length
  protected _offset: THREE.Vector2 = new THREE.Vector2(0, 0);
  protected _labelDisplayedInside: boolean = true;
  protected _bounds: PlaneBounds = {
    min: { x: 0, y: 0, z: 0 },
    max: { x: 0, y: 0, z: 0 }
  };

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
    this._upper = upper;
    this._atInfinity = atInfinity;
    if (atInfinity) {
      this._angle = posOrAngle as number;
    } else {
      this._position = posOrAngle as THREE.Vector3;
    }

    HENodule.LABEL_COUNT++;
    this.name = "La" + HENodule.LABEL_COUNT;
    // console.log(
    //   "Label Constructor: ",
    //   this.name,
    //   this._upper ? "upper|" : "lower|",
    //   this._atInfinity ? "At infinity|" : "NOT at infinity|",
    //   this._angle,
    //   this._position.toFixed(2)
    // );
    // console.log(this.name, "Parent Location: ", (this.parent as HEPoint).angle);
    this._initMesh();
  }

  private async _initMesh(): Promise<void> {
    // Build the mesh async
    //console.log("b here", this.name, posOrAngle.toFixed(2));
    const textGeometry = await Text.create({
      text: this._currentText,
      font: this._fontPath,
      size: 1, // scaled later by scale and unit in the material positionNode
      depth: 0 // flat text — uses DoubleSide material, saves ~50% triangles
    });
    this._bounds = textGeometry.planeBounds;

    this._mesh = await createLabel({
      textGeometry: textGeometry.geometry,
      position: this._position,
      angle: this._angle,
      atInfinity: this._atInfinity,
      upper: this._upper,
      name: this.name
    });
    this._material = this._mesh.material as CustomLabelMaterial;
    // this._material.polygonOffset = true;
    // this._material.polygonOffsetFactor = -10; // negative = toward camera
    // this._material.polygonOffsetUnits = -10;

    // Layers
    if (this._upper) {
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
    this.applyLabelOffset(
      this.atInfinity ? 0.1 : 0.2,
      this.atInfinity ? 0.1 : 0.2
    );
    this.adjustScale(0.6);
    // Face the camera and update the material transformation matrix
    this.faceCamera();

    this.group.add(this._mesh);
    // set the visibility
    this.shallowUpdate();
  }

  public async changeText(newText: string): Promise<void> {
    this._currentText = newText;

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

    this._initMesh();
  }

  public update(): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) return;
    this.setOutOfDate(false);
    this.shallowUpdate();
    //this.updateKids(); //Labels have no kids so this is not necessary
  }
  public shallowUpdate(): void {
    this._exists = this.parent.exists;

    if (this._exists) {
      // update the label location using its parent
      if (this.atInfinity) {
        // The only labels at infinity are those labeling points
        this._angle = (this.parent as HEPoint).angle;
      } else {
        // this._material.position = this.parent.getClosestLabelVector(); // not implemented yet
      }
    }

    // Update visibility
    // console.log(
    //   "ShallowUpdate:",
    //   this.name,
    //   this._showing ? "label SHOWING |" : "label NOT SHOWING|",
    //   this._upper ? "upper|" : "lower|",
    //   this._atInfinity ? "At infinity|" : "NOT at infinity|",
    //   this._angle,
    //   this._position.toFixed(2)
    // );
    if (this._showing && this._exists) {
      this._material.visible = true;
    } else {
      this._material.visible = false;
    }
  }

  //change the scale to size (in multiplies of the unit)
  public adjustScale(size: number): void {
    this._scale = size;
    this._material.userData.scale.value = this._scale;
    // this.faceCamera();
  }

  public faceCamera(): void {
    const cameraDirection = new THREE.Vector3(0, 0, -1);
    cameraDirection.applyQuaternion(HENodule.hyperStore.cameraQuaternion);

    // first rotate the text so that the left/right baseline is perpendicular to the projection of the camera direction to the x/y plane.
    const angle = Math.atan2(cameraDirection.y, cameraDirection.x);
    const zAngle = (angle + (Math.PI * 3) / 2).modTwoPi();
    const zRotationMatrix = new THREE.Matrix4().makeRotationZ(zAngle);

    // the unit normal of the text is <0,0,1>, so the axis of rotation is
    // cross(<0,0,1>,unitCameraDirection) and the angle of rotation is the angle between them.
    const axis = new THREE.Vector3()
      .crossVectors(new THREE.Vector3(0, 0, 1), cameraDirection)
      .normalize();
    const angle2 = (Math.acos(cameraDirection.z) + Math.PI).modTwoPi();
    const rotationMatrix = new THREE.Matrix4().makeRotationAxis(axis, angle2);

    let finalTranslationMatrix: THREE.Matrix4;
    if (this._atInfinity) {
      const zCoordinate = this._upper
        ? (zUpperPAIClipMinus.value + zUpperPAIClipPlus.value) / 2.0
        : (zLowerPAIClipMinus.value + zLowerPAIClipPlus.value) / 2.0;
      finalTranslationMatrix = new THREE.Matrix4().makeTranslation(
        Math.cos(this._angle) * Math.abs(zCoordinate),
        Math.sin(this._angle) * Math.abs(zCoordinate),
        zCoordinate
      );
      // console.log("face camera angle: ", this.name, this._angle);
    } else {
      finalTranslationMatrix = new THREE.Matrix4().makeTranslation(
        this._position
      );
    }

    const transformationMatrix = new THREE.Matrix4().multiplyMatrices(
      finalTranslationMatrix,
      new THREE.Matrix4().multiplyMatrices(rotationMatrix, zRotationMatrix)
    );
    this._material.scale = this._scale;
    this._material.transformationMatrix = transformationMatrix;

    // now check if the label is occluded and set the z offset accordingly so the label is not displayed on both sides of the hyperboloid or cone

    // // Compute the locations of the corners
    const imageOfCorners = transformationMatrix.clone().multiply(
      new THREE.Matrix4(
        // upper left
        (this._bounds.min.x * this._scale + this._offset.x) * unitLength.value,
        (this._bounds.max.y * this._scale + this._offset.y) * unitLength.value,
        0,
        1,
        // lower left
        (this._bounds.min.x * this._scale + this._offset.x) * unitLength.value,
        (this._bounds.min.y * this._scale + this._offset.y) * unitLength.value,
        0,
        1,
        // upper right
        (this._bounds.max.x * this._scale + this._offset.x) * unitLength.value,
        (this._bounds.max.y * this._scale + this._offset.y) * unitLength.value,
        0,
        1,
        // lower right
        (this._bounds.max.x * this._scale + this._offset.x) * unitLength.value,
        (this._bounds.min.y * this._scale + this._offset.y) * unitLength.value,
        0,
        1
      ).transpose() // the constructor uses row major order, but I have listed the elements in column major order
    );

    // Get the columns of the imageOfCorners
    const te = imageOfCorners.elements; // te stands for "the elements"
    const col0 = new THREE.Vector4(te[0], te[1], te[2], te[3]);
    const col1 = new THREE.Vector4(te[4], te[5], te[6], te[7]);
    const col2 = new THREE.Vector4(te[8], te[9], te[10], te[11]);
    const col3 = new THREE.Vector4(te[12], te[13], te[14], te[15]);

    const deltaZValues: number[] = [];
    [col0, col1, col2, col3].forEach(column => {
      const zCoordinateOfProjection = Math.sqrt(
        column.x * column.x + column.y * column.y + (this._atInfinity ? 0 : 1)
      );
      const signedZDistanceToSurface =
        (this._upper ? 1 : -1) * column.z - zCoordinateOfProjection;

      deltaZValues.push(signedZDistanceToSurface);
    });

    const minDeltaZ = Math.min(...deltaZValues);
    const maxDeltaZ = Math.max(...deltaZValues);
    const zShiftDirection = new THREE.Vector4(0, 0, this._upper ? 1 : -1, 0);
    const displayInsideZShiftVector = zShiftDirection
      .clone()
      .multiplyScalar(-1 * Math.min(0, minDeltaZ));
    const displayOutsideZShiftVector = zShiftDirection
      .clone()
      .multiplyScalar(-1 * Math.max(0, maxDeltaZ));

    // Check if the label is occluded with the label on the inside. A label is occluded if the line from the center of the text to the camera intersects the surface.
    const centerOfText = new THREE.Vector4(
      (((this._bounds.max.x + this._bounds.min.x) / 2) * this._scale +
        this._offset.x) *
        unitLength.value,
      (((this._bounds.max.y + this._bounds.min.y) / 2) * this._scale +
        this._offset.y) *
        unitLength.value,
      0,
      1
    )
      .applyMatrix4(transformationMatrix)
      .add(displayInsideZShiftVector);

    const labelToCameraOriginUnitVector = HENodule.hyperStore.cameraOrigin
      .clone()
      .sub(centerOfText)
      .normalize();

    let occluded: boolean;
    if (this._atInfinity) {
      const intersectionsWithCone = intersectWithPointAtInfinityStrip(
        new THREE.Vector3(centerOfText.x, centerOfText.y, centerOfText.z),
        labelToCameraOriginUnitVector,
        0,
        Infinity,
        this._upper
      );
      occluded = intersectionsWithCone.length > 0;
    } else {
      const intersectionsWithHyperboloid = intersectWithHyperboloid(
        new THREE.Vector3(centerOfText.x, centerOfText.y, centerOfText.z),
        labelToCameraOriginUnitVector,
        0,
        Infinity,
        this._upper
      );
      occluded = intersectionsWithHyperboloid.length > 0;
    }

    if (occluded) {
      //display inside is occluded, so try outside
      this._material.userData.zOffsetVector.value = new THREE.Vector3(
        displayOutsideZShiftVector.x,
        displayOutsideZShiftVector.y,
        displayOutsideZShiftVector.z
      );
    } else {
      this._material.userData.zOffsetVector.value = new THREE.Vector3(
        displayInsideZShiftVector.x,
        displayInsideZShiftVector.y,
        displayInsideZShiftVector.z
      );
    }
  }

  public applyLabelOffset(x: number, y: number): void {
    this._offset.x = x;
    this._offset.y = y;
    this._material.userData.xyOffSetVector.value = new THREE.Vector2(x, y);
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
    } else {
      this._position = posOrAngle;
    }
    this.faceCamera();
  }
  get location(): THREE.Vector3 | null {
    return this._position;
  }
  get angle(): number | null {
    return this._angle;
  }
  get upper(): boolean {
    return this._upper;
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
