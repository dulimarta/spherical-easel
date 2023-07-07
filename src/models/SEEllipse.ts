import { SENodule } from "./SENodule";
import { SEPoint, SELabel } from "./internal";
import Ellipse from "@/plottables/Ellipse";
import { Vector3, Matrix4 } from "three";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
import {
  NormalAndPerpendicularPoint,
  NormalAndTangentPoint,
  ObjectState,
  OneDimensional
} from "@/types";
import SETTINGS from "@/global-settings";
import {
  DEFAULT_ELLIPSE_BACK_STYLE,
  DEFAULT_ELLIPSE_FRONT_STYLE
} from "@/types/Styles";
import { Labelable } from "@/types";
// import { SELabel } from "@/models/SELabel";
import i18n from "@/i18n";
import NonFreeEllipse from "@/plottables/NonFreeEllipse";
import { DisplayStyle } from "@/plottables/Nodule";
const { t } = i18n.global;
const styleSet = new Set([
  ...Object.getOwnPropertyNames(DEFAULT_ELLIPSE_FRONT_STYLE),
  ...Object.getOwnPropertyNames(DEFAULT_ELLIPSE_BACK_STYLE)
]);
export class SEEllipse
  extends SENodule
  implements Visitable, OneDimensional, Labelable
{
  /**
   * The plottable (TwoJS) segment associated with this model segment
   */
  public declare ref: Ellipse;
  /**
   * Pointer to the label of this SESegment
   */
  public label?: SELabel;
  /**
   * The model SE object that are the foci of the ellipse
   */
  private _focus1SEPoint: SEPoint;
  private _focus2SEPoint: SEPoint;
  /**
   * The model SE point that is on the ellipse
   */
  private _ellipseSEPoint: SEPoint;

  /**
   * The parameters a,b that define the the ellipse in standard position (foci in the x-z plane, at (-sin(d),0,cos(d)) and (sin(d),0,cos(d)), so
   * the center is at (0,0,1), d = 1/2 angle(F1,F2)), half the length of axis (of the ellipse) that projects onto the  x-axis is a,
   * half the length of the axis (of the ellipse) that projects on the y-axis is b, using the spherical Pythagorean Theorem cos(d)*cos(b)=cos(a)
   */
  private _a: number;
  private _b: number;

  /**
   * Used during this.move(): A matrix that is used to indicate the *change* in position of the
   * ellipse on the sphere.
   */
  private changeInPositionRotationMatrix: Matrix4 = new Matrix4();
  /** Use in the rotation matrix during a move event */
  private desiredZAxis = new Vector3();
  private tmpVector0 = new Vector3();
  private tmpVector1 = new Vector3();
  private tmpVector2 = new Vector3();
  private tmpVector3 = new Vector3();
  private tmpMatrix = new Matrix4();

  /**
   * The vector E'(t) and E''(t), tMin and tMax for tMin <= t <= tMax E(t)= first and second derivatives of the ellipse
   */
  private parameterizationPrime = new Vector3();
  private parameterizationDoublePrime = new Vector3();

  /**
   * Create a model SEEllipse using:
   * @param ellipse The plottable TwoJS Object associated to this object
   * @param focus1Point The model SEPoint object that is one of the foci of the ellipse
   * @param focus2Point The model SEPoint object that is one of the foci of the ellipse
   * @param ellipsePoint The model SEPoint object that is on the circle
   */
  constructor(
    // ellipse: Ellipse,
    focus1Point: SEPoint,
    focus2Point: SEPoint,
    ellipsePoint: SEPoint,
    createNonFree: boolean
  ) {
    super();

    /**
     * Set the SEPoints
     */
    this._focus1SEPoint = focus1Point;
    this._focus2SEPoint = focus2Point;
    this._ellipseSEPoint = ellipsePoint;
    this.ref = createNonFree ? new NonFreeEllipse() : new Ellipse();
    this.ref.focus1Vector.copy(focus1Point.locationVector);
    this.ref.focus2Vector.copy(focus2Point.locationVector);
    this.ref.updateDisplay();
    this.ref.stylize(DisplayStyle.ApplyCurrentVariables);
    this.ref.adjustSize();
    //Set the parameters for the parameterization of the ellipse
    this._a =
      0.5 *
      (focus1Point.locationVector.angleTo(ellipsePoint.locationVector) +
        focus2Point.locationVector.angleTo(ellipsePoint.locationVector));

    this._b = Math.acos(
      Math.cos(this._a) /
        Math.cos(
          focus1Point.locationVector.angleTo(focus2Point.locationVector) / 2
        )
    );

    //Set the vectors and parameters for plotting
    this.ref.focus1Vector = this._focus1SEPoint.locationVector;
    this.ref.focus2Vector = this._focus2SEPoint.locationVector;
    this.ref.a = this._a;
    this.ref.b = this._b;
    this.ref.updateDisplay();

    SEEllipse.ELLIPSE_COUNT++;
    this.name = `E${SEEllipse.ELLIPSE_COUNT}`;
  }

  customStyles(): Set<string> {
    return styleSet;
  }

  get focus1SEPoint(): SEPoint {
    return this._focus1SEPoint;
  }
  get focus2SEPoint(): SEPoint {
    return this._focus2SEPoint;
  }
  get ellipseSEPoint(): SEPoint {
    return this._ellipseSEPoint;
  }
  get ellipseAngleSum(): number {
    return (
      this._focus1SEPoint.locationVector.angleTo(
        this._ellipseSEPoint.locationVector
      ) +
      this._focus2SEPoint.locationVector.angleTo(
        this._ellipseSEPoint.locationVector
      )
    );
  }
  get a(): number {
    return this._a;
  }
  set a(a: number) {
    this._a = a;
  }
  set b(b: number) {
    this._b = b;
  }
  get b(): number {
    return this._b;
  }
  public get noduleDescription(): string {
    return String(
      i18n.global.t(`objectTree.ellipseThrough`, {
        focus1: this._focus1SEPoint.label?.ref.shortUserName,
        focus2: this._focus2SEPoint.label?.ref.shortUserName,
        through: this._ellipseSEPoint.label?.ref.shortUserName
      })
    );
  }

  public get noduleItemText(): string {
    return this.label?.ref.shortUserName ?? "No Label Short Name In SEEllipse";
  }

  /**
   * The parameterization of the derivative of the ellipse on the sphere in standard position.
   * Note: This is *not* a unit parameterization
   * @param t the parameter between 0 and 2 PI
   * @returns
   */
  public Ep(t: number): Vector3 {
    return this.parameterizationPrime.set(
      -Math.sin(this._a) * Math.sin(t),
      Math.sin(this._b) * Math.cos(t),
      ((this._a > Math.PI / 2 ? -1 : 1) /
        (2 *
          Math.sqrt(
            Math.cos(this._a) * Math.cos(this._a) +
              Math.sin(this._a - this._b) *
                Math.sin(this._a + this._b) *
                Math.sin(t) *
                Math.sin(t)
          ))) *
        Math.sin(this._a - this._b) *
        Math.sin(this._a + this._b) *
        Math.sin(2 * t)
    );
  }

  /**
   * The parameterization of the second derivative of the ellipse on the sphere.
   * Note: This is *not* a unit parameterization
   * @param t the parameter between 0 and 2 PI
   * @returns
   */
  public Epp(t: number): Vector3 {
    return this.parameterizationDoublePrime.set(
      -Math.sin(this._a) * Math.cos(t),
      -Math.sin(this._b) * Math.sin(t),
      ((this._a > Math.PI / 2 ? -1 : 1) /
        Math.sqrt(
          (Math.cos(this._a) * Math.cos(this._a) +
            Math.sin(this._a - this._b) *
              Math.sin(this._a + this._b) *
              Math.sin(t) *
              Math.sin(t)) *
            (Math.cos(this._a) * Math.cos(this._a) +
              Math.sin(this._a - this._b) *
                Math.sin(this._a + this._b) *
                Math.sin(t) *
                Math.sin(t)) *
            (Math.cos(this._a) * Math.cos(this._a) +
              Math.sin(this._a - this._b) *
                Math.sin(this._a + this._b) *
                Math.sin(t) *
                Math.sin(t))
        )) *
        Math.sin(this._a - this._b) *
        Math.sin(this._a + this._b) *
        (Math.cos(this._a) * Math.cos(this._a) * Math.cos(2 * t) -
          Math.sin(this._a - this._b) *
            Math.sin(this._a + this._b) *
            Math.sin(t) *
            Math.sin(t) *
            Math.sin(t) *
            Math.sin(t))
    );
  }

  public isHitAt(
    unitIdealVector: Vector3,
    currentMagnificationFactor: number
  ): boolean {
    const angleSum =
      unitIdealVector.angleTo(this._focus1SEPoint.locationVector) +
      unitIdealVector.angleTo(this._focus2SEPoint.locationVector);

    return (
      Math.abs(angleSum - this.ellipseAngleSum) <
      SETTINGS.ellipse.hitIdealDistance / currentMagnificationFactor
    );
    // This could also be as
    // this.tmpVector
    //   .subVectors(unitIdealVector, this.closestVector(unitIdealVector))
    //   .length() <
    //   SETTINGS.ellipse.hitIdealDistance / currentMagnificationFactor;
  }

  public shallowUpdate(): void {
    this._exists =
      // The three defining points must exist
      this._focus1SEPoint.exists &&
      this._focus2SEPoint.exists &&
      this._ellipseSEPoint.exists;

    // If these three points exist we can check other criteria for existence
    if (this._exists) {
      this._a =
        0.5 *
        (this._focus1SEPoint.locationVector.angleTo(
          this._ellipseSEPoint.locationVector
        ) +
          this._focus2SEPoint.locationVector.angleTo(
            this._ellipseSEPoint.locationVector
          ));

      this._b = Math.acos(
        Math.cos(this._a) /
          Math.cos(
            this._focus1SEPoint.locationVector.angleTo(
              this._focus2SEPoint.locationVector
            ) / 2
          )
      );

      const sumOfFocusVectors = this.tmpVector2.addVectors(
        this._focus1SEPoint.locationVector,
        this._focus2SEPoint.locationVector
      );

      // The foci must not be antipodal
      this._exists =
        this._exists &&
        !sumOfFocusVectors.isZero(SETTINGS.nearlyAntipodalIdeal);

      //The foci must not be right on each other
      this._exists =
        this._exists &&
        this._focus1SEPoint.locationVector.angleTo(
          this._focus2SEPoint.locationVector
        ) > SETTINGS.ellipse.minimumAngleSumDifference;

      // The ellipse point can't be on the line segment connecting the foci or on the line segment connecting the antipodes of the foci
      this._exists =
        this._exists &&
        2 * this._a -
          this._focus1SEPoint.locationVector.angleTo(
            this._focus2SEPoint.locationVector
          ) >
          SETTINGS.ellipse.minimumAngleSumDifference &&
        2 * this._a <
          2 * Math.PI -
            this._focus1SEPoint.locationVector.angleTo(
              this._focus2SEPoint.locationVector
            ) -
            SETTINGS.ellipse.minimumAngleSumDifference;
    }

    if (this._exists) {
      //update the focus vector and the a and b radius values
      // Update the appropriate values in the plottable object Ellipse
      this.ref.a = this._a;
      this.ref.b = this._b;
      this.ref.focus1Vector = this._focus1SEPoint.locationVector;
      this.ref.focus2Vector = this._focus2SEPoint.locationVector;
      // display the new circle with the updated values
      this.ref.updateDisplay();
    }

    if (this.showing && this._exists) {
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }
  }

  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) return;

    this.setOutOfDate(false);
    this.shallowUpdate();

    // These ellipse are completely determined by their point parents and an update on the parents
    // will cause this ellipse to be put into the correct location.So we don't store any additional information
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        console.log(
          `Ellipse with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      orderedSENoduleList.push(this.id);
      objectState.set(this.id, { kind: "ellipse", object: this });
    }

    this.updateKids(objectState, orderedSENoduleList);
  }

  /**
   * Return the vector on the SECircle that is closest to the idealUnitSphereVector
   * @param idealUnitSphereVector A vector on the unit sphere
   */
  public closestVector(idealUnitSphereVector: Vector3): Vector3 {
    //first transform the idealUnitSphereVector from the target unit sphere to the unit sphere with the ellipse (E(t)) in standard position
    const transformedToStandard = new Vector3();
    transformedToStandard.copy(idealUnitSphereVector);
    transformedToStandard.applyMatrix4(
      this.tmpMatrix.copy(this.ref.ellipseFrame).invert()
    );
    //console.debug(`transformedToStandard ${transformedToStandard.toFixed(2)}`);
    const closestStandardVector = new Vector3();
    //form collection of t values that trace the ellipse and create a fairly small grid to search for the zeros
    const tValues: number[] = [];
    for (let i = 0; i <= 100; i++) {
      tValues.push((i * 2 * Math.PI) / 100);
    }
    closestStandardVector.copy(
      SENodule.closestVectorParametrically(
        this.ref.E.bind(this.ref), // bind the this.ref so that this in the this.ref.E method is this.ref
        this.Ep.bind(this), // bind the this.ref so that this in the this.ref.Ep method is this.ref
        transformedToStandard,
        tValues, //[0 - SETTINGS.tolerance, 2 * Math.PI + SETTINGS.tolerance], // FIXME
        // this.ref.tMin,
        // this.ref.tMax,
        this.Epp.bind(this) // bind the this.ref so that this in the this.ref.E method is this.ref
      ).vector
    );
    // Finally transform the closest vector on the ellipse in standard position to the target unit sphere
    return closestStandardVector
      .applyMatrix4(this.ref.ellipseFrame)
      .normalize();
  }
  /**
   * Return the vector near the SECircle (within SETTINGS.circle.maxLabelDistance) that is closest to the idealUnitSphereVector
   * @param idealUnitSphereVector A vector on the unit sphere
   */
  public closestLabelLocationVector(
    idealUnitSphereVector: Vector3,
    zoomMagnificationFactor: number
  ): Vector3 {
    // First find the closest point on the ellipse to the idealUnitSphereVector
    const closest = new Vector3();
    closest.copy(this.closestVector(idealUnitSphereVector));
    // The current magnification level

    const mag = zoomMagnificationFactor;

    // If the idealUnitSphereVector is within the tolerance of the closest point, do nothing, otherwise return the vector in the plane of the ideanUnitSphereVector and the closest point that is at the tolerance distance away.
    if (
      closest.angleTo(idealUnitSphereVector) <
      SETTINGS.ellipse.maxLabelDistance / mag
    ) {
      return idealUnitSphereVector;
    } else {
      // tmpVector1 is the normal to the plane of the closest point vector and the idealUnitVector
      // This can't be zero because tmpVector can be the closest on the segment to idealUnitSphereVector and parallel with ideanUnitSphereVector
      this.tmpVector1.crossVectors(idealUnitSphereVector, closest).normalize();
      // compute the toVector (so that tmpVector2= toVector, tmpVector= fromVector, tmpVector1 form an orthonormal frame)
      this.tmpVector2.crossVectors(closest, this.tmpVector1).normalize;
      // return cos(SETTINGS.segment.maxLabelDistance)*fromVector/tmpVec + sin(SETTINGS.segment.maxLabelDistance)*toVector/tmpVec2
      this.tmpVector2.multiplyScalar(
        Math.sin(SETTINGS.ellipse.maxLabelDistance / mag)
      );
      return this.tmpVector2
        .addScaledVector(
          closest,
          Math.cos(SETTINGS.ellipse.maxLabelDistance / mag)
        )
        .normalize();
    }
  }
  accept(v: Visitor): boolean {
    return v.actionOnEllipse(this);
  }

  /**
   * Return the normal vector(s) to the plane containing a line that is perpendicular to this ellipse through the
   * sePoint, in the case that the usual way of defining this line is not well defined  (something is parallel),
   * use the oldNormal to help compute a new normal (which is returned)
   * @param sePoint A point on the line normal to this circle
   */
  public getNormalsToPerpendicularLinesThru(
    sePointVector: Vector3,
    oldNormal: Vector3 // ignored for Ellipse and Circle, but not other one-dimensional objects
  ): NormalAndPerpendicularPoint[] {
    // first check to see if the sePointVector is antipodal or the same as the center of the ellipse
    // First set tmpVector to the center of the ellipse
    this.tmpVector0
      .addVectors(
        this._focus1SEPoint.locationVector,
        this._focus2SEPoint.locationVector
      )
      .normalize();
    // Cross the center with the ideanUnitSphereVector
    this.tmpVector0.crossVectors(this.tmpVector0, sePointVector);

    // Check to see if the tmpVector is zero (i.e the center and  idealUnit vectors are parallel -- ether
    // nearly antipodal or in the same direction)
    if (this.tmpVector0.isZero(SETTINGS.nearlyAntipodalIdeal)) {
      // In this case there are two lines containing the sePoint will be perpendicular to the ellipse,
      this.tmpVector1
        .crossVectors(
          this._focus1SEPoint.locationVector,
          this._focus2SEPoint.locationVector
        )
        .normalize(); // one possible normal vector

      // First set tmpVector1 to the center of the ellipse
      this.tmpVector2
        .addVectors(
          this._focus1SEPoint.locationVector,
          this._focus2SEPoint.locationVector
        )
        .normalize();

      this.tmpVector0.crossVectors(this.tmpVector1, this.tmpVector2);
      // // now set tmpVector1 to the other possible normal vector
      // this.tmpVector1.crossVectors(this.tmpVector, this.tmpVector1).normalize;
      // if (
      //   this.tmpVector.angleTo(oldNormal) < this.tmpVector1.angleTo(oldNormal)
      // ) {
      //   return [this.tmpVector];
      // } else {
      // TODO: Compute the perpendicular intersection point
      return [
        { normal: this.tmpVector1, normalAt: this.tmpVector3 },
        { normal: this.tmpVector0, normalAt: this.tmpVector2 }
      ];
      // }
    } else {
      const transformedToStandard = new Vector3();
      transformedToStandard.copy(sePointVector);
      transformedToStandard.applyMatrix4(
        this.tmpMatrix.copy(this.ref.ellipseFrame).invert()
      );
      const tValues: number[] = [];
      for (let i = 0; i <= 100; i++) {
        tValues.push((i * 2 * Math.PI) / 100);
      }
      const normalList =
        SENodule.getNormalsToPerpendicularLinesThruParametrically(
          this.ref.E.bind(this.ref), // bind the this.ref so that this in the this.ref.E method is this.ref
          this.Ep.bind(this), // bind the this.ref so that this in the this.ref.E method is this.ref
          transformedToStandard,
          tValues, // FIXME
          // this.ref.tMin,
          // this.ref.tMax,
          this.Epp.bind(this) // bind the this.ref so that this in the this.ref.E method is this.ref
        );
      // // return the normal vector that is closest to oldNormal DO NOT DO THIS FOR NOW
      // const minAngle = Math.min(
      //   ...(normalList.map(vec => vec.angleTo(oldNormal)) as number[])
      // );
      // const ind = normalList.findIndex((vec: Vector3) => {
      //   return vec.angleTo(oldNormal) === minAngle;
      // });
      // console.log("normal list length", normalList.length);
      normalList.forEach((pair: NormalAndPerpendicularPoint) => {
        pair.normal.applyMatrix4(this.ref.ellipseFrame).normalize();
        pair.normalAt.applyMatrix4(this.ref.ellipseFrame).normalize();
      });
      return normalList;
    }
  }

  /**
   * Return the normal vectors to the planes containing the line that is tangent to this Ellipse through the
   * sePointVector, in the case that the usual way of defining this line is not well defined  (something is parallel),
   * use the oldNormal to help compute a new normal (which is returned)
   * @param sePointVector A point on the line tangent to this Ellipse
   */
  public getNormalsToTangentLinesThru(
    sePointVector: Vector3,
    zoomMagnificationFactor: number,
    useFullTInterval?: boolean // only used in the constructor when figuring out the maximum number of Tangents to a SEParametric
  ): NormalAndTangentPoint[] {
    const sumOfDistancesToFoci =
      sePointVector.angleTo(this._focus1SEPoint.locationVector) +
      sePointVector.angleTo(this._focus2SEPoint.locationVector);

    this.tmpVector0.copy(this._focus1SEPoint.locationVector);
    this.tmpVector1.copy(this._focus2SEPoint.locationVector);
    const sumOfDistancesToAntipodesOfFoci =
      sePointVector.angleTo(this.tmpVector0.multiplyScalar(-1)) +
      sePointVector.angleTo(this.tmpVector1.multiplyScalar(-1));

    // If the vector is on the Ellipse or its antipode then there is one tangent
    if (
      (this._a < Math.PI / 2 &&
        (Math.abs(sumOfDistancesToFoci - this.ellipseAngleSum) <
          0.001 / zoomMagnificationFactor ||
          Math.abs(sumOfDistancesToAntipodesOfFoci - this.ellipseAngleSum) <
            0.001 / zoomMagnificationFactor)) ||
      (this._a > Math.PI / 2 &&
        (Math.abs(
          sumOfDistancesToAntipodesOfFoci - 2 * Math.PI + this.ellipseAngleSum
        ) <
          0.001 / zoomMagnificationFactor ||
          Math.abs(sumOfDistancesToFoci - 2 * Math.PI + this.ellipseAngleSum) <
            0.001 / zoomMagnificationFactor))
    ) {
      // console.log("here");
      const transformedToStandard = new Vector3();
      transformedToStandard.copy(sePointVector);
      transformedToStandard.applyMatrix4(
        this.tmpMatrix.copy(this.ref.ellipseFrame).invert()
      );
      const tValues: number[] = [];
      for (let i = 0; i <= 100; i++) {
        tValues.push((i * 2 * Math.PI) / 100);
      }
      const closest = SENodule.closestVectorParametrically(
        this.ref.E.bind(this.ref), // bind the this.ref so that this in the this.ref.E method is this.ref
        this.Ep.bind(this), // bind the this.ref so that this in the this.ref.E method is this.ref
        transformedToStandard,
        tValues, // FIXME
        // this.ref.tMin,
        // this.ref.tMax,
        this.Epp.bind(this) // bind the this.ref so that this in the this.ref.E method is this.ref
      );
      // console.log("coord t val", coorespondingTVal);
      const tangentVector = new Vector3();
      tangentVector.copy(this.Ep(closest.tVal));
      tangentVector.applyMatrix4(this.ref.ellipseFrame);
      tangentVector.cross(sePointVector);
      // conso{le.log("tan vec", tangentVector.x, tangentVector.y, tangentVector.z);
      return [{ normal: tangentVector.normalize(), tangentAt: closest.vector }];
    }
    // If the vector is inside the Ellipse or the antipode of the Ellipse there is no tangent or the ellipse is a great circle (a=Pi/2)
    if (
      Math.abs(this._a - Math.PI / 2) < SETTINGS.tolerance ||
      (this._a < Math.PI / 2 &&
        (sumOfDistancesToFoci < this.ellipseAngleSum ||
          sumOfDistancesToAntipodesOfFoci < this.ellipseAngleSum)) ||
      (this._a > Math.PI / 2 &&
        (sumOfDistancesToAntipodesOfFoci < 2 * Math.PI - this.ellipseAngleSum ||
          sumOfDistancesToFoci < 2 * Math.PI - this.ellipseAngleSum))
    ) {
      return [];
    }
    // Use the parametrization to find the tangents in the remaining case when there are two tangents
    const transformedToStandard = new Vector3();
    transformedToStandard.copy(sePointVector);
    transformedToStandard.applyMatrix4(
      this.tmpMatrix.copy(this.ref.ellipseFrame).invert()
    );
    const tValues: number[] = [];
    for (let i = 0; i <= 100; i++) {
      tValues.push((i * 2 * Math.PI) / 100);
    }
    const normalList = SENodule.getNormalsToTangentLinesThruParametrically(
      this.ref.E.bind(this.ref),
      this.Ep.bind(this),
      transformedToStandard,
      tValues, // FIXME
      // this.ref.tMin,
      // this.ref.tMax,
      this.Epp.bind(this)
    );
    normalList.forEach(pair => {
      pair.normal.applyMatrix4(this.ref.ellipseFrame).normalize();
      pair.tangentAt.applyMatrix4(this.ref.ellipseFrame).normalize();
    });

    return normalList;
  }

  /**
   * Move the the ellipse by moving the free points it depends on
   * Simply forming a rotation matrix mapping the previous to current sphere and applying
   * that rotation to the foci and ellipse points of defining the ellipse.
   * @param previousSphereVector Vector3 previous location on the unit ideal sphere of the mouse
   * @param currentSphereVector Vector3 current location on the unit ideal sphere of the mouse
   */
  public move(
    previousSphereVector: Vector3,
    currentSphereVector: Vector3
  ): void {
    const rotationAngle = previousSphereVector.angleTo(currentSphereVector);

    // If the rotation is big enough preform the rotation
    if (Math.abs(rotationAngle) > SETTINGS.rotate.minAngle) {
      // The axis of rotation
      this.desiredZAxis
        .crossVectors(previousSphereVector, currentSphereVector)
        .normalize();
      // Form the matrix that performs the rotation
      this.changeInPositionRotationMatrix.makeRotationAxis(
        this.desiredZAxis,
        rotationAngle
      );
      this.tmpVector1
        .copy(this.focus1SEPoint.locationVector)
        .applyMatrix4(this.changeInPositionRotationMatrix);
      this.focus1SEPoint.locationVector = this.tmpVector1;
      this.tmpVector1
        .copy(this.focus2SEPoint.locationVector)
        .applyMatrix4(this.changeInPositionRotationMatrix);
      this.focus2SEPoint.locationVector = this.tmpVector1;
      this.tmpVector0
        .copy(this.ellipseSEPoint.locationVector)
        .applyMatrix4(this.changeInPositionRotationMatrix);
      this.ellipseSEPoint.locationVector = this.tmpVector0;
      // Update all points, because we might need to update their kids!
      // First mark the kids out of date so that the update method does a topological sort
      this.ellipseSEPoint.markKidsOutOfDate();
      this.focus1SEPoint.markKidsOutOfDate();
      this.focus2SEPoint.markKidsOutOfDate();
      this.ellipseSEPoint.update();
      this.focus1SEPoint.update();
      this.focus2SEPoint.update();
    }
  }

  public isOneDimensional(): boolean {
    return true;
  }

  public isLabelable(): boolean {
    return true;
  }
}
