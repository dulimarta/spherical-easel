import { HENodule } from "./HENodule";
// import Line from "@/plottables-spherical/Line";
// import { Vector3 } from "three";
// import { Visitable } from "@/visitors/Visitable";
// import { Visitor } from "@/visitors/Visitor";
import SETTINGS from "@/global-settings-hyperbolic";
import {
  OneDimensional,
  Labelable,
  HyperbolicLabelable
  // NormalAndPerpendicularPoint,
  // ObjectState
} from "@/types";
// import i18n from "@/i18n";
// import {
//   DEFAULT_LINE_BACK_STYLE,
//   DEFAULT_LINE_FRONT_STYLE
// } from "@/types/Styles";
// import { DisplayStyle } from "@/plottables-spherical/Nodule";
// import NonFreeLine from "@/plottables-spherical/NonFreeLine";
import { HELabel } from "./HELabel";
import { HEPoint } from "./HEPoint";
import { Matrix4, Mesh, Vector3, Vector4 } from "three";
import {
  CustomLineMaterial,
  CustomMaterial
} from "@/plottables-hyperbolic/MaterialFactory";
import { createLine } from "@/plottables-hyperbolic/MeshFactory";
import { HYPERBOLIC_LAYER } from "@/global-settings-hyperbolic";
import { h2Distance } from "@/utils/helpingHEFunctions";

// const styleSet = new Set([
//   ...Object.getOwnPropertyNames(DEFAULT_LINE_FRONT_STYLE),
//   ...Object.getOwnPropertyNames(DEFAULT_LINE_BACK_STYLE)
// ]);
// const { t } = i18n.global;

export class HELine extends HENodule implements HyperbolicLabelable {
  //implements Visitable, OneDimensional, Labelable

  public label?: HELabel;
  protected _startPoint: HEPoint;
  protected _endPoint: HEPoint;
  protected _unitNormalVector = new Vector3(); // most useful for determining if two lines are the same and the transformation matrix
  protected _upper; // must match for lines to be the same
  protected _radius; // radius of the tube used to display the line
  protected _temporary: boolean;
  protected _nonFreeLine = false;
  protected _transformationMatrix = new Matrix4();
  protected _inverseTransformationMatrix = new Matrix4();
  protected _mesh!: Mesh;
  protected _material!: CustomLineMaterial;
  protected _mode: number; // Mode is a number between 0 and 7, inclusive. The binary expansion of this number is three bits, the most significant tells whether the portion of the line before the start point is drawn, the second most significant bit tells whether the portion of the line between the start and end points is drawn, and the least significant bit tells whether the portion of the line after the end point is drawn. So 7 = 111 in binary means draw all portions of the line and 6 = 110 in binary means draw only the portion of the line before the start point and between the start and end points, but not after the end point, etc.

  tempVector = new Vector3();

  constructor(
    startPoint: HEPoint,
    endPoint: HEPoint,
    mode: number,
    createNonFreeLine: boolean = false,
    temporary: boolean = false
  ) {
    super();
    if (!temporary) {
      HENodule.LINE_COUNT++;
      this.name = `Li${HENodule.LINE_COUNT}`;
    } else {
      HENodule.TEMP_LINE_COUNT++;
      this.name = `tempLi${HENodule.TEMP_LINE_COUNT}`;
    }
    this._nonFreeLine = createNonFreeLine;
    this._temporary = temporary;
    this._upper = startPoint.upper; // assume for now that start and end points are not a mix of upper and lower
    this._mesh = createLine(this.name, mode, this._upper, temporary);
    this._material = this._mesh.material as CustomLineMaterial;
    this._radius = this._material.userData.radius.value;
    this._mode = mode;
    this._startPoint = startPoint;
    this._endPoint = endPoint;
    this.group.add(this._mesh);
    this.shallowUpdate();
  }

  updateLayer(): void {
    if (!this._temporary) {
      // only non-temporary lines are added to layers, because temporary lines move between upper and lower dynamically
      this._mesh.layers.set(
        this._upper
          ? HYPERBOLIC_LAYER.upperSheetLines
          : HYPERBOLIC_LAYER.lowerSheetLines
      );
    }
  }
  // // customStyles(): Set<string> {
  // //   return styleSet;
  // // }
  // //
  // // accept(v: Visitor): boolean {
  // //   return v.actionOnLine(this);
  // // }
  // //
  // // get nearlyAntipodal(): boolean {
  // //   return this.tmpVector
  // //     .crossVectors(
  // //       this._endPoint.locationVector,
  // //       this._endPoint.locationVector
  // //     )
  // //     .isZero(SETTINGS.nearlyAntipodalIdeal);
  // // }
  // //
  // // public get noduleDescription(): string {
  // //   return String(
  // //     i18n.global.t(`objectTree.lineThrough`, {
  // //       pt1: this._startSEPoint.label?.ref.shortUserName,
  // //       pt2: this._endSEPoint.label?.ref.shortUserName,
  // //       normalX: this._normalVector.x.toFixed(SETTINGS.decimalPrecision),
  // //       normalY: this._normalVector.y.toFixed(SETTINGS.decimalPrecision),
  // //       normalZ: this._normalVector.z.toFixed(SETTINGS.decimalPrecision)
  // //     })
  // //   );
  // // }
  // //
  // // public get noduleItemText(): string {
  // //   return this.label?.ref.shortUserName ?? "No Label Short Name In SELine";
  // // }
  // //
  // // public isHitAt(
  // //   unitIdealVector: Vector3,
  // //   currentMagnificationFactor: number
  // // ): boolean {
  // //   // Is the sphereVector is perpendicular to the line normal?
  // //   return (
  // //     Math.abs(unitIdealVector.dot(this._normalVector)) <
  // //     SETTINGS.line.hitIdealDistance / currentMagnificationFactor
  // //   );
  // // }
  // //
  // /**
  //  * Return the vector on the SELine that is closest to the idealUnitSphereVector
  //  * @param idealUnitSphereVector A vector on the unit sphere
  //  */
  // // public closestVector(idealUnitSphereVector: Vector3): Vector3 {
  // //   // The normal to the plane of the normal vector and the idealUnitVector
  // //   this.tmpVector.crossVectors(this._normalVector, idealUnitSphereVector);

  // //   // Check to see if the tmpVector is zero (i.e the normal and  idealUnit vectors are parallel -- ether
  // //   // nearly antipodal or in the same direction)
  // //   if (this.tmpVector.isZero(SETTINGS.nearlyAntipodalIdeal)) {
  // //     return this._endSEPoint.locationVector; // An arbitrary point will do as all points are equally far away
  // //   } else {
  // //     // Make the tmpVector unit
  // //     this.tmpVector.normalize();
  // //     return this.tmpVector.cross(this._normalVector).normalize();
  // //   }
  // // }
  // //
  // /**
  //  * Return the vector near the SELine (within SETTINGS.line.maxLabelDistance) that is closest to the idealUnitSphereVector
  //  * @param idealUnitSphereVector A vector on the unit sphere
  //  */
  // // public closestLabelLocationVector(
  // //   idealUnitSphereVector: Vector3,
  // //   zoomMagnificationFactor: number
  // // ): Vector3 {
  // //   // First find the closest point on the segment to the idealUnitSphereVector
  // //   this.tmpVector.copy(this.closestVector(idealUnitSphereVector));
  // //
  // //   // The current magnification level
  // //
  // //   // If the idealUnitSphereVector is within the tolerance of the closest point, do nothing, otherwise return the vector in the plane of the ideanUnitSphereVector and the closest point that is at the tolerance distance away.
  // //   if (
  // //     this.tmpVector.angleTo(idealUnitSphereVector) <
  // //     SETTINGS.line.maxLabelDistance / zoomMagnificationFactor
  // //   ) {
  // //     return idealUnitSphereVector;
  // //   } else {
  // //     // tmpVector1 is the normal to the plane of the closest point vector and the idealUnitVector
  // //     // This can't be zero because tmpVector can be the closest on the segment to idealUnitSphereVector and parallel with ideanUnitSphereVector
  // //     this.tmpVector1
  // //       .crossVectors(idealUnitSphereVector, this.tmpVector)
  // //       .normalize();
  // //     // compute the toVector (so that tmpVector2= toVector, tmpVector= fromVector, tmpVector1 form an orthonormal frame)
  // //     this.tmpVector2.crossVectors(this.tmpVector, this.tmpVector1).normalize();
  // //     // return cos(SETTINGS.segment.maxLabelDistance)*fromVector/tmpVec + sin(SETTINGS.segment.maxLabelDistance)*toVector/tmpVec2
  // //     this.tmpVector2.multiplyScalar(
  // //       Math.sin(SETTINGS.line.maxLabelDistance / zoomMagnificationFactor)
  // //     );
  // //     return this.tmpVector2
  // //       .addScaledVector(
  // //         this.tmpVector,
  // //         Math.cos(SETTINGS.line.maxLabelDistance / zoomMagnificationFactor)
  // //       )
  // //       .normalize();
  // //   }
  // // }
  // //
  // /**
  //  * Return the normal vector to the plane containing the line that is perpendicular to this line through the
  //  * sePoint, in the case that the usual way of defining this line is not well defined  (something is parallel),
  //  * use the oldNormal to help compute a new normal (which is returned)
  //  * @param sePoint A point on the line normal to this circle
  //  */
  // // public getNormalsToPerpendicularLinesThru(
  // //   sePointVector: Vector3,
  // //   oldNormal: Vector3
  // // ): NormalAndPerpendicularPoint[] {
  // //   this.tmpVector3.crossVectors(sePointVector, this._normalVector);
  // //
  // //   // The perpendicular point is the intersection between the plain containing the (new) line and
  // //   // the plane of THIS line
  // //   this.tmpVector2.crossVectors(this.tmpVector3, this._normalVector);
  // //
  // //   if (this.tmpVector2.z < 0) this.tmpVector2.multiplyScalar(-1); // Two possible points, pick the foreground
  // //   // Check to see if the tmpVector is zero (i.e the normal vector and given point are parallel -- ether
  // //   // nearly antipodal or in the same direction)
  // //
  // //   if (this.tmpVector3.isZero(SETTINGS.nearlyAntipodalIdeal)) {
  // //     // In this case any line containing the sePoint will be perpendicular to the line, but
  // //     //  we want to choose one line whose normal is near the oldNormal and perpendicular to sePointVector
  // //     // So project the oldNormal vector onto the plane perpendicular to sePointVector
  // //     this.tmpVector3
  // //       .copy(oldNormal)
  // //       .addScaledVector(sePointVector, -1 * oldNormal.dot(sePointVector))
  // //       .normalize();
  // //   }
  // //   this.tmpVector3.normalize();
  // //   this.tmpVector2.normalize();
  // //
  // //   return [{ normal: this.tmpVector3, normalAt: this.tmpVector2 }];
  // // }

  public shallowUpdate(): void {
    this._exists =
      this._startPoint.exists &&
      this._endPoint.exists &&
      this._endPoint.position.z * this._startPoint.position.z > 0; // the start and end must have the same upper/lower to exist, this means that the cross product of them is never the zero vector

    this._unitNormalVector
      .crossVectors(
        new Vector3(
          this._startPoint.position.x,
          this._startPoint.position.y,
          this._startPoint.position.z
        ),
        new Vector3(
          this._endPoint.position.x,
          this._endPoint.position.y,
          this._endPoint.position.z
        )
      )
      .normalize();

    // In order for the plane through the start, end and origin to intersect the hyperboloid we need Normal.x^2+Normal.y^2>Normal.z^2
    this._exists =
      this._exists &&
      this._unitNormalVector.x * this._unitNormalVector.x +
        this._unitNormalVector.y * this._unitNormalVector.y >
        this._unitNormalVector.z * this._unitNormalVector.z;

    if (this._exists) {
      if (this._startPoint.upper !== this._upper) {
        this._upper = this._startPoint.upper; // must be updated before updateLayer is called
        this.updateLayer();
      }
      this._material.userData.normalVector.copy(this._unitNormalVector); // update the normal vector so that intersections are done correctly
      this.updateTransformationMatrix();
    }

    if (this.showing && this._exists) {
      this._mesh.visible = true;
    } else {
      this._mesh.visible = false;
    }
  }

  public update() // objectState?: Map<number, ObjectState>,
  // orderedSENoduleList?: number[]
  : void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) return;

    this.setOutOfDate(false);

    this.shallowUpdate();

    // Lines are NOT completely determined by their parents so we store additional information
    // If the parent points of the line are antipodal, the normal vector determines the
    // plane of the line.
    // if (objectState && orderedSENoduleList) {
    //   if (objectState.has(this.id)) {
    //     // `Line with id ${this.id} has been visited twice proceed no further down this branch of the DAG. Hopefully this is because we are moving two or more SENodules at the same time in the MoveHandler.`
    //     return;
    //   }
    //   orderedSENoduleList.push(this.id);
    //   const normal = new Vector3();
    //   normal.copy(this._normalVector);
    //   objectState.set(this.id, {
    //     kind: "line",
    //     object: this,
    //     normalVector: normal
    //   });
    // }

    this.updateKids(); //objectState, orderedSENoduleList);
  }

  updateTransformationMatrix(): void {
    this._material.upper = this._upper ? 1 : 0;

    // The magic happens here. See the Mathematica document "Hyperbolic Line Transformation" for details.
    const Nx = this._unitNormalVector.x;
    const Ny = this._unitNormalVector.y;
    const Nz = this._unitNormalVector.z;
    const A = 1 / Math.sqrt(Nx * Nx + Ny * Ny - Nz * Nz);
    const B = 1 / Math.sqrt(Nx * Nx + Ny * Ny);

    this._transformationMatrix = new Matrix4(
      -A * Nx,
      B * Ny,
      -A * B * Nx * Nz,
      0, // row 0
      -A * Ny,
      -B * Nx,
      -A * B * Ny * Nz,
      0, // row 1
      A * Nz,
      0,
      A / B,
      0, // row 2
      0,
      0,
      0,
      1 // row 3
    );
    const computeStandardY = (
      point: Vector4,
      inverseMatrix: Matrix4,
      maxY: number
    ): number => {
      if (point.w > 0) {
        // Non-ideal point: apply inverse transformation directly
        return new Vector4().copy(point).applyMatrix4(inverseMatrix).y;
      } else {
        // Ideal point: apply inverse to the direction (w=0) and
        // use the sign of y to determine which end of the cylinder
        const dir = new Vector4().copy(point).applyMatrix4(inverseMatrix);
        return dir.y >= 0 ? maxY : -maxY;
      }
    };
    this._inverseTransformationMatrix.copy(this._transformationMatrix).invert();

    // now set the startY|endY values
    const maxY = Math.sinh(Math.acosh(SETTINGS.maxZClip) + 1.001);
    this._material.startY = computeStandardY(
      this._startPoint.position,
      this._inverseTransformationMatrix,
      maxY
    );

    this._material.endY = computeStandardY(
      this._endPoint.position,
      this._inverseTransformationMatrix,
      maxY
    );

    this._material.inverseTransformationMatrix =
      this._inverseTransformationMatrix;
    this._material.transformationMatrix = this._transformationMatrix;
    this._material.radius = this._radius;

    // console.log(
    //   "startY",
    //   this._material.startY,
    //   "endY",
    //   this._material.endY,
    //   "idealDir.y",
    //   new Vector4()
    //     .copy(this._startPoint.position)
    //     .applyMatrix4(this._inverseTransformationMatrix).y
    // );
  }

  /**
   * Move the line
   * @param currentSphereVector The current location of the mouse
   * @param previousSphereVector The previous location of the mouse
   * @param altKeyPressed Controls which point defining the line or segment the line or segment rotates about
   * @param ctrlKeyPressed If pressed overrides the altKey method and just rotates the entire line/segment based on the change in mouse position.
   */
  // public move(
  //   previousSphereVector: Vector3,
  //   currentSphereVector: Vector3,
  //   altKeyPressed: boolean,
  //   ctrlKeyPressed: boolean
  // ): void {
  //   let rotationAngle;
  //   // If the ctrlKey Is press translate the segment in the direction of previousSphereVector
  //   //  to currentSphereVector (i.e. just rotate the line)
  //   if (ctrlKeyPressed) {
  //     rotationAngle = previousSphereVector.angleTo(currentSphereVector);
  //     // If the rotation is big enough preform the rotation
  //     if (rotationAngle > SETTINGS.rotate.minAngle) {
  //       // The axis of rotation
  //       this.desiredZAxis
  //         .crossVectors(previousSphereVector, currentSphereVector)
  //         .normalize();
  //       // Form the matrix that performs the rotation
  //       // this.changeInPositionRotationMatrix.makeRotationAxis(
  //       //   desiredZAxis,
  //       //   rotationAngle
  //       // );
  //       this.tmpVector1
  //         .copy(this.startSEPoint.locationVector)
  //         .applyAxisAngle(this.desiredZAxis, rotationAngle);
  //       this.startSEPoint.locationVector = this.tmpVector1;
  //       this.tmpVector2
  //         .copy(this.endSEPoint.locationVector)
  //         .applyAxisAngle(this.desiredZAxis, rotationAngle);
  //       this.endSEPoint.locationVector = this.tmpVector2;
  //       // Update both points, because we might need to update their kids!
  //       // First mark the kids out of date so that the update method does a topological sort
  //       this.startSEPoint.markKidsOutOfDate();
  //       this.endSEPoint.markKidsOutOfDate();
  //       this.endSEPoint.update();
  //       this.startSEPoint.update();
  //     }
  //   } else {
  //     let pivot = this.startSEPoint;
  //     let freeEnd = this.endSEPoint;
  //     if (altKeyPressed) {
  //       pivot = this.endSEPoint;
  //       freeEnd = this.startSEPoint;
  //     }
  //
  //     // We want to measure the rotation angle with respect to the rotationAxis
  //     // Essentially we rotate a plane "hinged" at the rotationAxis so
  //     // the angle of rotation must be measure as the amount of changes of the
  //     // plane normal vector
  //
  //     // Determine the normal vector to the plane containing the pivot and the previous position
  //     this.tmpVector1
  //       .crossVectors(pivot.locationVector, previousSphereVector)
  //       .normalize();
  //     // Determine the normal vector to the plane containing the pivot and the current position
  //     this.tmpVector2
  //       .crossVectors(pivot.locationVector, currentSphereVector)
  //       .normalize();
  //     // The angle between tmpVector1 and tmpVector2 is the distance to move on the Ideal Unit Sphere
  //     rotationAngle = this.tmpVector1.angleTo(this.tmpVector2);
  //
  //     // Determine which direction to rotate.
  //     this.tmpVector1.cross(this.tmpVector2);
  //     rotationAngle *= Math.sign(this.tmpVector1.z);
  //
  //     // Reverse the direction of the rotation if the current points is on the back of the sphere
  //     if (currentSphereVector.z < 0) {
  //       rotationAngle *= -1;
  //     }
  //
  //     // If the pivot and currentSphereVector are on opposite side of the sphere, reverse the direction
  //     if (currentSphereVector.z * pivot.locationVector.z < 0) {
  //       rotationAngle *= -1;
  //     }
  //     // Rotate the freeEnd by the rotation angle around the axisOfRotation
  //     const axisOfRotation = pivot.locationVector;
  //     // Test for antipodal endpoints
  //     if (
  //       this.tmpVector1
  //         .addVectors(freeEnd.locationVector, pivot.locationVector)
  //         .isZero(SETTINGS.nearlyAntipodalIdeal)
  //     ) {
  //       // Set the direction of the rotation correctly for moving the normalVector
  //       rotationAngle *= currentSphereVector.z < 0 ? -1 : 1;
  //       // If the end points are antipodal move the normal vector
  //       this.tmpVector1.copy(this.normalVector);
  //       this.tmpVector1.applyAxisAngle(axisOfRotation, rotationAngle);
  //       this.normalVector = this.tmpVector1;
  //       this.markKidsOutOfDate();
  //       this.update();
  //     } else {
  //       // For non-antipodal points move the freeEnd
  //       this.tmpVector1.copy(freeEnd.locationVector);
  //       this.tmpVector1.applyAxisAngle(axisOfRotation, rotationAngle);
  //       freeEnd.locationVector = this.tmpVector1;
  //       // First mark the kids out of date so that the update method does a topological sort
  //       // First mark the kids out of date so that the update method does a topological sort
  //       freeEnd.markKidsOutOfDate();
  //       pivot.markKidsOutOfDate();
  //       freeEnd.update();
  //       pivot.update();
  //     }
  //   }
  // }

  get upper(): boolean {
    return this._upper;
  }

  get radius(): number {
    return this._radius;
  }
  set radius(num: number) {
    this._radius = num;
    this._material.radius = num;
  }

  get unitNormalVector(): Vector3 {
    return this._unitNormalVector;
  }

  get mode(): number {
    return this._mode;
  }

  set mode(newMode: number) {
    // console.log("set mode in HELine");
    // check to see if this line in the newMode exists, if so send a message to the use and don't change anything
    let lineIsNew = true;
    if (!this._temporary) {
      HENodule.hyperStore.linesMap.forEach(line => {
        if (
          line.name != this.name &&
          this.tempVector
            .crossVectors(line.unitNormalVector, this._unitNormalVector)
            .isZero() &&
          line.upper == this._upper &&
          line.mode == newMode
        ) {
          lineIsNew = false;
        }
      });
    }
    if (lineIsNew) {
      this._mode = newMode;
      this._material.mode = newMode;
      this.shallowUpdate();
    }
  }

  get startPoint(): HEPoint {
    return this._startPoint;
  }
  set startPoint(newStart: Vector4) {
    this._startPoint.position.copy(newStart);
    this.shallowUpdate();
  }

  // These both need to be set at the same time so that it is possible for temporary lines to be displayed on both upper and lower sheets.
  public setNewStartAndEndVectors(
    newStartVector: Vector4,
    newEndVector: Vector4
  ): void {
    this._startPoint.position.copy(newStartVector);
    this._endPoint.position.copy(newEndVector);
    this.shallowUpdate();
  }

  get endPoint(): HEPoint {
    return this._endPoint;
  }
  set endPoint(newEnd: Vector4) {
    this._endPoint.position.copy(newEnd);
    this.shallowUpdate();
  }

  public isOneDimensional(): boolean {
    return true;
  }

  public setLabel(lab: HELabel) {
    this.label = lab;
  }
  public getLabel(): HELabel {
    return this.label!;
  }
  get mesh(): Mesh {
    return this._mesh;
  }
  get material(): CustomMaterial {
    return this._material;
  }

  // public isLineWithAntipodalPoints(): boolean {
  //   if (
  //     Math.abs(
  //       this._endSEPoint.locationVector.angleTo(
  //         this._startSEPoint.locationVector
  //       ) - Math.PI
  //     ) < SETTINGS.line.closeEnoughToPi
  //   ) {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }
}
