import { HENodule } from "./HENodule";
// import Line from "@/plottables-spherical/Line";
// import { Vector3 } from "three";
// import { Visitable } from "@/visitors/Visitable";
// import { Visitor } from "@/visitors/Visitor";
import SETTINGS from "@/global-settings-hyperbolic";
import {
  OneDimensional,
  Labelable
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
export class HELine extends HENodule {
  //implements Visitable, OneDimensional, Labelable

  public label?: HELabel;
  protected _startPoint: HEPoint;
  protected _endPoint: HEPoint;
  protected _normalVector = new Vector3();
  protected _upper;
  protected _radius = 0.15; // radius of the initial tube
  protected _nonFreePoint = false;
  protected _transformationMatrix = new Matrix4();
  protected _mesh!: Mesh;
  protected _material!: CustomLineMaterial;
  protected _mode: number; // A number between 0 and 7, inclusive. The binary expansion of this number is three bits, the first tell whether the portion of the line before the start point is drawn, the second bit tells whether the portion of the line between the start and end points is drawn, and the third bit tells whether the portion of the line after the end point is drawn. So 7 = 111 in binary means draw all portions of the line and 6 = 110 in binary means draw only the portion of the line before the start point and between the start and end points, but not after the end point, etc.

  constructor(
    startPoint: HEPoint,
    // normalVector: Vector3,
    endPoint: HEPoint,
    mode: number = 7,
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

    this._startPoint = startPoint;
    this._endPoint = endPoint;
    // for now, both start and end point are on the same sheet so the start/end cannot be antipodal, so the normal vector is well defined as the cross product of the position vectors of the start and end points
    this._normalVector
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
    this._upper = startPoint.upper;
    this._mode = mode;

    this._mesh = createLine({
      name: this.name,
      radius: this._radius,
      upper: this._upper,
      temporary: temporary
    });

    this._material = this._mesh.material as CustomLineMaterial;

    this.updateTransformationMatrix(); // set the transformation matrix

    // Add the mesh to a layer so if the lower sheet is turned off, the lines in that layer are not displayed
    if (!temporary) {
      // only non-temporary lines are added to layers, because temporary lines move between upper and lower dynamically
      this._mesh.layers.set(
        this._upper
          ? HYPERBOLIC_LAYER.upperSheetLines
          : HYPERBOLIC_LAYER.lowerSheetLines
      );
    }
    this.group.add(this._mesh);
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
    this._exists = this._startPoint.exists && this._endPoint.exists;

    if (this._exists) {
      // Given an set of this.startPoint, this.endPoint and (old) this.normalVector, and compute the next normal vector
      // Compute a temporary normal from the two points
      this._normalVector
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
      this.updateTransformationMatrix();
      // // Check to see if the tempNormal is zero (i.e the start and end vectors are parallel -- ether
      // // nearly antipodal or in the same direction)
      // if (this.tmpVector.isZero(SETTINGS.nearlyAntipodalIdeal)) {
      //   // The start and end vectors align, compute  the next normal vector from the old normal and the start vector
      //   this.tmpVector.crossVectors(
      //     this._startSEPoint.locationVector,
      //     this._normalVector
      //   );
      //   this.tmpVector.crossVectors(
      //     this.tmpVector,
      //     this._startSEPoint.locationVector
      //   );
      // }

      // this._normalVector.copy(this.tmpVector).normalize();

      // Set the normal vector in the plottable object (the setter also calls the updateDisplay() method)
      // this.ref.normalVector = this._normalVector;
      // this.ref.updateDisplay();
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
    // The magic happens here! See the Mathematica notebook "Hyperbolic Line Transformation"for details about how the matrices were created
    // First find the polar angles of the start and end points
    let thetaS = Math.atan2(
      this._startPoint.position.y,
      this._startPoint.position.x
    );
    let thetaE = Math.atan2(
      this._endPoint.position.y,
      this._endPoint.position.x
    );

    if (this._startPoint.position.w === 0 && this._endPoint.position.w === 0) {
      // both start and end points are ideal
      const thetaHalfSum = (thetaE + thetaS) / 2;
      const thetaHalfDiff = (thetaE - thetaS) / 2;
      this._transformationMatrix = new Matrix4(
        Math.cos(thetaHalfSum) / Math.sin(-thetaHalfDiff),
        -Math.sin(thetaHalfSum),
        (Math.cos(thetaHalfDiff) * Math.cos(thetaHalfSum)) /
          Math.sin(-thetaHalfDiff),
        0, //row 0
        Math.sin(thetaHalfSum) / Math.sin(-thetaHalfDiff),
        Math.cos(thetaHalfSum),
        (Math.cos(thetaHalfDiff) / Math.sin(-thetaHalfDiff)) *
          Math.sin(thetaHalfSum),
        0, // row 1
        1 / Math.tan(-thetaHalfDiff),
        0,
        1 / Math.sin(-thetaHalfDiff),
        0, // row 2
        0,
        0,
        0,
        1 //row 3
      );
      this._material.mode = 0 * 4 + 1 * 2 + 0 * 1; // 010 in binary so the portion between start and end is draw
      this._material.startY =
        -2 * Math.sinh(Math.acosh(SETTINGS.maxZClip) + 1.001);
      this._material.endY =
        2 * Math.sinh(Math.acosh(SETTINGS.maxZClip) + 1.001);
    } else {
      let radiusS =
        this._startPoint.position.w !== 0
          ? Math.acosh(this._startPoint.position.z) // same as h2Distance(new Vector3(0, 0, 1), this._startPoint.position)
          : 0; // this value doesn't matter when the start is ideal
      let radiusE =
        this._endPoint.position.w !== 0
          ? Math.acosh(this._endPoint.position.z) // same as h2Distance(new Vector3(0, 0, 1), this._endPoint.position)
          : 0; // this value doesn't matter when the end is ideal
      let endAtInfinity = this._endPoint.position.w === 0;
      this._material.mode = this._mode;
      if (
        this._startPoint.position.w === 0 &&
        this._endPoint.position.w !== 0
      ) {
        // start is ideal and end is not ideal so switch the roles of start and end
        const thetaTemp = thetaE;
        thetaE = thetaS;
        thetaS = thetaTemp;
        const radiusTemp = radiusE;
        radiusE = radiusS;
        radiusS = radiusTemp;
        endAtInfinity = true;
        function reverse3Bits(n: number): number {
          const bit0 = (n & 1) << 2; // Extract bit 0 and move it to bit 2 position
          const bit1 = n & 2; // Extract bit 1 (middle) and keep it there
          const bit2 = (n & 4) >> 2; // Extract bit 2 and move it to bit 0 position

          return bit0 | bit1 | bit2; // Combine them
        }
        this._material.mode = reverse3Bits(this._mode);
      }
      const commonTerm = Math.sqrt(
        Math.sin(thetaE - thetaS) * Math.sin(thetaE - thetaS) +
          (Math.cos(thetaE - thetaS) * Math.cosh(radiusS) -
            Math.sinh(radiusS) / (endAtInfinity ? 1 : Math.tanh(radiusE))) *
            (Math.cos(thetaE - thetaS) * Math.cosh(radiusS) -
              Math.sinh(radiusS) / (endAtInfinity ? 1 : Math.tanh(radiusE)))
      );
      this._transformationMatrix = new Matrix4(
        (Math.cosh(radiusS) * Math.sin(thetaE) -
          (Math.sin(thetaS) * Math.sinh(radiusS)) /
            (endAtInfinity ? 1 : Math.tanh(radiusE))) /
          commonTerm,

        (-Math.sin(thetaE - thetaS) * Math.sin(thetaS) +
          Math.cos(thetaS) *
            Math.cosh(radiusS) *
            (Math.cos(thetaE - thetaS) * Math.cosh(radiusS) -
              Math.sinh(radiusS) / (endAtInfinity ? 1 : Math.tanh(radiusE)))) /
          commonTerm,

        Math.cos(thetaS) * Math.sinh(radiusS),

        0, //row 1

        (-Math.cos(thetaE) * Math.cosh(radiusS) +
          (Math.cos(thetaS) * Math.sinh(radiusS)) /
            (endAtInfinity ? 1 : Math.tanh(radiusE))) /
          commonTerm,

        (Math.cos(thetaS) * Math.sin(thetaE - thetaS) +
          Math.cosh(radiusS) *
            Math.sin(thetaS) *
            (Math.cos(thetaE - thetaS) * Math.cosh(radiusS) -
              Math.sinh(radiusS) / (endAtInfinity ? 1 : Math.tanh(radiusE)))) /
          commonTerm,

        Math.sin(thetaS) * Math.sinh(radiusS),

        0, //row 2

        (Math.sin(thetaE - thetaS) * Math.sinh(radiusS)) / commonTerm,

        (Math.cosh(radiusS) *
          Math.sinh(radiusS) *
          (Math.cos(thetaE - thetaS) -
            Math.tanh(radiusS) / (endAtInfinity ? 1 : Math.tanh(radiusE)))) /
          commonTerm,

        Math.cosh(radiusS),

        0, //row 3

        0,
        0,
        0,
        1 //row 4
      );

      this._material.startY = new Vector4()
        .copy(
          endAtInfinity ? this._endPoint.position : this._startPoint.position
        )
        .applyMatrix4(this._transformationMatrix.invert()).y;

      this._material.endY = new Vector4()
        .copy(
          endAtInfinity ? this._startPoint.position : this._endPoint.position
        )
        .applyMatrix4(this._transformationMatrix.invert()).y;
    }

    this._material.transformationMatrix = this._transformationMatrix;
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
  set upper(isUpper: boolean) {
    this._upper = isUpper;
  }
  get radius(): number {
    return this._material.radius;
  }
  set radius(num: number) {
    this._material.radius = num;
  }
  get normalVector(): Vector3 {
    return this._normalVector;
  }

  // set normalVector(normalVec: Vector3) {
  //   this._normalVector.copy(normalVec);
  // }

  get startPoint(): HEPoint {
    return this._startPoint;
  }

  get endPoint(): HEPoint {
    return this._endPoint;
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
