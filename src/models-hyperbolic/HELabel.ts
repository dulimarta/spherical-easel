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
  zLowerIdealPointsClipMinus,
  zLowerIdealPointsClipPlus,
  zUpperIdealPointsClipMinus,
  zUpperIdealPointsClipPlus
} from "@/plottables-hyperbolic/MeshFactory";
import { HEPoint } from "./HEPoint";
import {
  intersectWithHyperboloid,
  intersectWithIdealPointsStrip
} from "@/utils/helpingHEFunctions";

//import { createLabel } from "@/plottables-hyperbolic/MeshFactory";

type PlaneBounds = {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
};

export class HELabel extends HENodule {
  public parent: HENodule;
  protected _mesh!: THREE.Mesh;
  protected _material!: CustomLabelMaterial;
  protected _fontPath = "/fonts/Roboto.ttf";
  protected _currentText: string;
  protected _labelParentType: string;
  protected _anchorPoint: THREE.Vector4 = new THREE.Vector4(0, 0, 0, 0);
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
    initialAnchor: THREE.Vector4,
    text: string
  ) {
    super();
    this.parent = parent;
    this._currentText = text;
    this._labelParentType = labelType;
    this._upper = initialAnchor.z > 0;
    this._anchorPoint = initialAnchor;

    HENodule.LABEL_COUNT++;
    this.name = "La" + HENodule.LABEL_COUNT;
    // console.log(
    //   "Label Constructor: ",
    //   this.name,
    //   this._upper ? "upper|" : "lower|",
    //   this._ideal ? "ideal" : "NOT at ideal|",
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

    this._mesh = await createLabel(textGeometry.geometry, this.name);
    this._material = this._mesh.material as CustomLabelMaterial;

    if (this._upper) {
      this._mesh.layers.set(
        this._anchorPoint.w === 0
          ? HYPERBOLIC_LAYER.upperSheetInfLabels
          : HYPERBOLIC_LAYER.upperSheetLabels
      );
    } else {
      this._mesh.layers.set(
        this._anchorPoint.w === 0
          ? HYPERBOLIC_LAYER.lowerSheetInfLabels
          : HYPERBOLIC_LAYER.lowerSheetLabels
      );
    }
    this.applyLabelOffset(
      this._anchorPoint.w === 0 ? 0.1 : 0.2,
      this._anchorPoint.w === 0 ? 0.1 : 0.2
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
      if (this.parent instanceof HEPoint) {
        this._anchorPoint = this.parent.position;
      } else {
        //this._anchorPoint = this.parent.getClosestLabelVector(); // not implemented yet
      }
      this.faceCamera();
    }

    // Update visibility
    // console.log(
    //   "ShallowUpdate:",
    //   this.name,
    //   this._showing ? "label SHOWING |" : "label NOT SHOWING|",
    //   this._upper ? "upper|" : "lower|",
    //   this._ideal ? "ideal|" : "NOT ideal|",
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
    if (this._anchorPoint.w === 0) {
      const anchorAngle = Math.atan2(this._anchorPoint.y, this._anchorPoint.x);
      const zCoordinate = this._upper
        ? (zUpperIdealPointsClipMinus.value + zUpperIdealPointsClipPlus.value) /
          2.0
        : (zLowerIdealPointsClipMinus.value + zLowerIdealPointsClipPlus.value) /
          2.0;
      finalTranslationMatrix = new THREE.Matrix4().makeTranslation(
        Math.cos(anchorAngle) * Math.abs(zCoordinate),
        Math.sin(anchorAngle) * Math.abs(zCoordinate),
        zCoordinate
      );
      // console.log("face camera angle: ", this.name, this._angle);
    } else {
      finalTranslationMatrix = new THREE.Matrix4().makeTranslation(
        this._anchorPoint.x,
        this._anchorPoint.y,
        this._anchorPoint.z
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
    const upperLeft = new THREE.Vector4(te[0], te[1], te[2], te[3]);
    const lowerLeft = new THREE.Vector4(te[4], te[5], te[6], te[7]);
    const upperRight = new THREE.Vector4(te[8], te[9], te[10], te[11]);
    const lowerRight = new THREE.Vector4(te[12], te[13], te[14], te[15]);

    const deltaZValues: number[] = [];
    [upperLeft, lowerLeft, upperRight, lowerRight].forEach(column => {
      const zCoordinateOfProjection = Math.sqrt(
        column.x * column.x +
          column.y * column.y +
          (this._anchorPoint.w === 0 ? 0 : 1)
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
    if (this._anchorPoint.w === 0) {
      const intersectionsWithCone = intersectWithIdealPointsStrip(
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
      //Clear the corner images
      this._material.userData.cornerImages = [];
      // Create the final corner images, so that raycasting to the label intersects correctly
      [upperLeft, lowerLeft, upperRight, lowerRight].forEach(column => {
        this._material.userData.cornerImages.push(
          new THREE.Vector3(column.x, column.y, column.z).add(
            displayOutsideZShiftVector
          )
        );
      });
    } else {
      this._material.userData.zOffsetVector.value = new THREE.Vector3(
        displayInsideZShiftVector.x,
        displayInsideZShiftVector.y,
        displayInsideZShiftVector.z
      );
      //Clear the corner images
      this._material.userData.cornerImages = [];
      // Create the final corner images, so that raycasting to the label intersects correctly
      [upperLeft, lowerLeft, upperRight, lowerRight].forEach(column => {
        this._material.userData.cornerImages.push(
          new THREE.Vector3(column.x, column.y, column.z).add(
            displayInsideZShiftVector
          )
        );
      });
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
  set anchorPoint(position: THREE.Vector4) {
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
    this._anchorPoint.copy(position);
    this.faceCamera();
  }
  get anchorPoint(): THREE.Vector4 {
    return this._anchorPoint;
  }

  get upper(): boolean {
    return this._upper;
  }

  get mesh(): THREE.Mesh {
    return this._mesh;
  }
  get material(): CustomMaterial {
    return this._material;
  }
}
