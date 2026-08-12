import { Text, ThreeTextGeometryInfo } from "three-text/three";
import * as THREE from "three/webgpu";
import {
  CustomMaterial,
  CustomLabelMaterial
} from "@/plottables-hyperbolic/MaterialFactory";
import SETTINGS, {
  HYPERBOLIC_LAYER,
  SURFACE_TYPES
} from "@/global-settings-hyperbolic";
import { HENodule } from "@/models-hyperbolic/HENodule";
import { LabelParentTypes } from "@/types";
import {
  createLabel,
  unitLength,
  zLowerIdealStripClipMinus,
  zLowerIdealStripClipPlus,
  zUpperIdealStripClipMinus,
  zUpperIdealStripClipPlus
} from "@/plottables-hyperbolic/MeshFactory";
import { HEPoint } from "./HEPoint";
import { intersectWithSurface } from "@/utils/helpingHEFunctions";
import { PoseTracker } from "@/eventHandlers-hyperbolic/PoseTracker";

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
  protected _activeUpperValue: boolean;
  protected _activeSurface: SURFACE_TYPES = SURFACE_TYPES.hyperboloid; // to track which surface the label is currently on
  protected _scale: number = 0.5; // in multiples of unit length
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
    this._activeUpperValue = initialAnchor.z > 0;
    this._anchorPoint.copy(initialAnchor);

    HENodule.LABEL_COUNT++;
    this.name = "La" + HENodule.LABEL_COUNT;
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

    this._mesh = await createLabel(
      textGeometry.geometry,
      this.name,
      this._anchorPoint.w === 0 || this._anchorPoint.w < 0 ? 0x000000 : 0xffffff // make labels of ideal points black
    );
    this._material = this._mesh.material as CustomLabelMaterial;

    this.updateLayer();

    this.applyLabelOffset(
      this._anchorPoint.w === 0 ? 0.1 : 0.2,
      this._anchorPoint.w === 0 ? 0.1 : 0.2
    );
    this.adjustScale(this._anchorPoint.w === 0 ? 0.4 : 0.5);

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

  updateLayer(): void {
    switch (true) {
      case this._anchorPoint.w > 0:
        this._mesh.layers.set(
          this._activeUpperValue
            ? HYPERBOLIC_LAYER.upperSheetLabels
            : HYPERBOLIC_LAYER.lowerSheetLabels
        );
        break;
      case this._anchorPoint.w === 0:
        this._mesh.layers.set(
          this._activeUpperValue
            ? HYPERBOLIC_LAYER.upperIdealLabels
            : HYPERBOLIC_LAYER.lowerIdealLabels
        );
        break;
      case this._anchorPoint.w < 0:
        this._mesh.layers.set(
          this._activeUpperValue
            ? HYPERBOLIC_LAYER.upperUltraLabels
            : HYPERBOLIC_LAYER.lowerUltraLabels
        );
        break;
    }
  }
  updateSurface(): void {
    switch (true) {
      case this._anchorPoint.w > 0:
        this._activeSurface = SURFACE_TYPES.hyperboloid;
        break;
      case this._anchorPoint.w == 0:
        this._activeSurface = SURFACE_TYPES.idealStrip;
        break;
      case this._anchorPoint.w < 0:
        this._activeSurface = SURFACE_TYPES.ultraStrip;
        break;
    }
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
      if (
        (this._anchorPoint.w > 0 &&
          this._activeSurface !== SURFACE_TYPES.hyperboloid) ||
        (this._anchorPoint.w === 0 &&
          this._activeSurface !== SURFACE_TYPES.idealStrip) ||
        (this._anchorPoint.w < 0 &&
          this._activeSurface !== SURFACE_TYPES.ultraStrip)
      ) {
        this.updateSurface();
        this.updateLayer();
      }

      if (this._anchorPoint.z > 0 && !this._activeUpperValue) {
        this._activeUpperValue = true;
        this.updateLayer();
      } else if (this._anchorPoint.z <= 0 && this._activeUpperValue) {
        this._activeUpperValue = false;
        this.updateLayer();
      }
      this.faceCamera();
    }

    // Update visibility
    // console.log(
    //   "ShallowUpdate:",
    //   this.name,
    //   this.parent.name,
    //   this._showing ? "label SHOWING |" : "label NOT SHOWING|",
    //   this._upper ? "upper|" : "lower|",
    //   this._anchorPoint.toFixed(2),
    //   this._exists
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
    this._material.scale = this._scale;
    this.faceCamera();
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
      const zCoordinate = this._activeUpperValue
        ? (zUpperIdealStripClipMinus.value + zUpperIdealStripClipPlus.value) /
          2.0
        : (zLowerIdealStripClipMinus.value + zLowerIdealStripClipPlus.value) /
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
    //change the scale inversely with respect to fov(?), and dollyDistance for non-ideal labels
    if (this._anchorPoint.w !== 0) {
      this._material.scale =
        this._scale *
        (((1 - SETTINGS.percentReductionAtMaxDolly) /
          (SETTINGS.dollyDistanceMin - SETTINGS.dollyDistanceMax)) *
          (HENodule.hyperStore.cameraDollyDistance -
            SETTINGS.dollyDistanceMax) +
          SETTINGS.percentReductionAtMaxDolly);
    }
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
    const te = imageOfCorners.elements; // the elements
    const upperLeft = new THREE.Vector4(te[0], te[1], te[2], te[3]);
    const lowerLeft = new THREE.Vector4(te[4], te[5], te[6], te[7]);
    const upperRight = new THREE.Vector4(te[8], te[9], te[10], te[11]);
    const lowerRight = new THREE.Vector4(te[12], te[13], te[14], te[15]);

    const deltaZValues: number[] = [];
    [upperLeft, lowerLeft, upperRight, lowerRight].forEach(column => {
      const distanceSquaredToSurface =
        column.x * column.x +
        column.y * column.y +
        (this._anchorPoint.w === 0 ? 0 : this._anchorPoint.w > 0 ? 1 : -1);
      const zCoordinateOfProjection = Math.sqrt(
        distanceSquaredToSurface > 0 ? distanceSquaredToSurface : 0
      );
      const signedZDistanceToSurface =
        (this._activeUpperValue ? 1 : -1) * column.z - zCoordinateOfProjection;

      deltaZValues.push(signedZDistanceToSurface);
    });

    const minDeltaZ = Math.min(...deltaZValues);
    const maxDeltaZ = Math.max(...deltaZValues);
    const zShiftDirection = new THREE.Vector4(
      0,
      0,
      this._activeUpperValue ? 1 : -1,
      0
    );
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
    switch (true) {
      case this._anchorPoint.w === 0: {
        const intersectionsWithIdealStrip = intersectWithSurface(
          new THREE.Vector3(centerOfText.x, centerOfText.y, centerOfText.z),
          labelToCameraOriginUnitVector,
          0,
          Infinity,
          this._activeUpperValue,
          SURFACE_TYPES.idealStrip
        );
        occluded = intersectionsWithIdealStrip.length > 0;
        break;
      }
      case this._anchorPoint.w > 0: {
        const intersectionsWithHyperboloid = intersectWithSurface(
          new THREE.Vector3(centerOfText.x, centerOfText.y, centerOfText.z),
          labelToCameraOriginUnitVector,
          0,
          Infinity,
          this._activeUpperValue,
          SURFACE_TYPES.hyperboloid
        );
        occluded = intersectionsWithHyperboloid.length > 0;
        break;
      }
      case this._anchorPoint.w < 0: {
        const intersectionsWithHyperboloid = intersectWithSurface(
          new THREE.Vector3(centerOfText.x, centerOfText.y, centerOfText.z),
          labelToCameraOriginUnitVector,
          0,
          Infinity,
          this._activeUpperValue,
          SURFACE_TYPES.ultraStrip
        );
        occluded = intersectionsWithHyperboloid.length > 0;
        break;
      }
      default:
        occluded = false; // default to not occluded if something goes wrong
    }

    const shiftVector = occluded
      ? displayOutsideZShiftVector
      : displayInsideZShiftVector;

    this._material.userData.zOffsetVector.value = new THREE.Vector3(
      shiftVector.x,
      shiftVector.y,
      shiftVector.z
    );

    this._material.userData.cornerImages = [];
    // Create the final corner images, so that raycasting to the label intersects correctly
    [upperLeft, lowerLeft, upperRight, lowerRight].forEach(column => {
      this._material.userData.cornerImages.push(
        new THREE.Vector3(column.x, column.y, column.z).add(shiftVector)
      );
    });
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
    return this._activeUpperValue;
  }

  get mesh(): THREE.Mesh {
    return this._mesh;
  }
  get material(): CustomMaterial {
    return this._material;
  }
}
