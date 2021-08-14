import { SENodule } from "./SENodule";
import { SEPoint } from "./SEPoint";
import Ellipse from "@/plottables/Ellipse";
import { Vector3, Matrix4 } from "three";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
import { OneDimensional, ParametricState } from "@/types";
import SETTINGS from "@/global-settings";
import { UpdateMode, UpdateStateType, CircleState } from "@/types";
import { Labelable } from "@/types";
import { SELabel } from "@/models/SELabel";
import { SEStore } from "@/store";
import i18n from "@/i18n";
import Parametric from "@/plottables/Parametric";
import { SEParametricEndPoint } from "./SEParametricEndPoint";
import {
  DEFAULT_PARAMETRIC_BACK_STYLE,
  DEFAULT_PARAMETRIC_FRONT_STYLE
} from "@/types/Styles";

const styleSet = new Set([
  ...Object.getOwnPropertyNames(DEFAULT_PARAMETRIC_FRONT_STYLE),
  ...Object.getOwnPropertyNames(DEFAULT_PARAMETRIC_BACK_STYLE)
]);
export class SEParametric extends SENodule
  implements Visitable, OneDimensional, Labelable {
  /**
   * The plottable (TwoJS) segment associated with this model segment
   */
  public ref: Parametric;
  /**
   * Pointer to the label of this SEParametric
   */
  public label?: SELabel;

  /** Use in the rotation matrix during a move event */
  private tmpVector = new Vector3();
  private tmpVector1 = new Vector3();
  private tmpVector2 = new Vector3();
  private tmpMatrix = new Matrix4();

  /**
   * Store the maximum number of Perpendiculars/Tangents to this SEParametric
   */
  private _maxNumberOfPerpendiculars = 1;
  private _maxNumberOfTangents = 2;

  /**
   * The SE endpoints of this curve, if any
   */
  private _endPoints: SEParametricEndPoint[] = [];
  /**
   * Create a model SEParametric using:
   * @param parametric The plottable TwoJS Object associated to this object
   */
  constructor(parametric: Parametric) {
    super();
    this.ref = parametric;
    this.ref.updateDisplay();

    // Sample for max number of perpendiculars from any point on the sphere
    // https://stackoverflow.com/questions/9600801/evenly-distributing-n-points-on-a-sphere
    const sample: Vector3[] = [];
    for (let i = 0; i < SETTINGS.parametric.evenSphereSampleSize; i++) {
      const y = 1 - (i / (SETTINGS.parametric.evenSphereSampleSize - 1)) * 2; // y goes from 1 to -1
      const radius = Math.sqrt(1 - y * y); // radius at y
      const theta = ((Math.sqrt(5) + 1) / 2) * i; // golden angle increment
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      sample.push(new Vector3(x, y, z));
    }

    let numberOfPerp: number;
    sample.forEach(vec => {
      numberOfPerp = this.getNormalsToPerpendicularLinesThru(
        vec,
        this.tmpVector,
        true
      ).length;
      if (numberOfPerp > this._maxNumberOfPerpendiculars) {
        this._maxNumberOfPerpendiculars = numberOfPerp;
      }
    });
    // console.log("Number of Perps", this._maxNumberOfPerpendiculars);

    // sample for number of tangents from any point on the sphere
    let numberOfTangents: number;
    sample.forEach(vec => {
      numberOfTangents = this.getNormalsToTangentLinesThru(vec, true).length;
      if (numberOfTangents > this._maxNumberOfTangents) {
        this._maxNumberOfTangents = numberOfTangents;
      }
    });
    console.log("Number of tangent", this._maxNumberOfTangents);
    SEParametric.PARAMETRIC_COUNT++;
    this.name = `Pa${SEParametric.PARAMETRIC_COUNT}`;
  }

  customStyles(): Set<string> {
    return styleSet;
  }

  get maxNumberOfPerpendiculars(): number {
    return this._maxNumberOfPerpendiculars;
  }

  get maxNumberOfTangents(): number {
    return this._maxNumberOfTangents;
  }

  public get noduleDescription(): string {
    return String(
      i18n.t(`objectTree.parametricDescription`, {
        xExpression: this.ref.coordinateExpressions.x,
        yExpression: this.ref.coordinateExpressions.y,
        zExpression: this.ref.coordinateExpressions.z,
        tMinNumber: this.ref.tNumbers.min,
        tMaxNumber: this.ref.tNumbers.max
      })
    );
  }

  public get noduleItemText(): string {
    return (
      this.label?.ref.shortUserName ?? "No Label Short Name In SEParametric"
    );
  }

  get endPoints(): SEParametricEndPoint[] {
    return this._endPoints;
  }
  set endPoints(points: SEParametricEndPoint[]) {
    this._endPoints.slice(0);
    this._endPoints.push(...points);
  }

  public isHitAt(
    unitIdealVector: Vector3,
    currentMagnificationFactor: number
  ): boolean {
    return (
      this.tmpVector
        .subVectors(unitIdealVector, this.closestVector(unitIdealVector))
        .length() <
      SETTINGS.parametric.hitIdealDistance / currentMagnificationFactor
    );
  }

  public update(state: UpdateStateType): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) {
      return;
    }
    this.setOutOfDate(false);

    // The measurement expressions parents must exist
    this._exists = this.ref.seParentExpressions.every(exp => {
      return exp.exists;
    });

    // find the tracing tMin and tMax
    const [tMin, tMax] = this.ref.tMinMaxExpressionValues();
    // if the tMin/tMax values are out of order then parametric curve doesn't exist
    if (tMax <= tMin) {
      this._exists = false;
    }

    if (this._exists) {
      // display the updated parametric
      this.ref.buildCurve();
      this.ref.updateDisplay();
    }

    if (this.showing && this._exists) {
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }
    // These parametric are completely determined by their expression parents and an update on the parents
    // will cause this parametric to be put into the correct location. Therefore there is no need to
    // store it in the stateArray for undo move. Only store for delete

    if (state.mode == UpdateMode.RecordStateForDelete) {
      const parametricState: ParametricState = {
        kind: "parametric",
        object: this
      };
      state.stateArray.push(parametricState);
    }

    this.updateKids(state);
  }

  /**
   * Return the vector on the SECircle that is closest to the idealUnitSphereVector
   * @param idealUnitSphereVector A vector on the unit sphere
   */
  public closestVector(idealUnitSphereVector: Vector3): Vector3 {
    //first transform the idealUnitSphereVector from the target unit sphere to the unit sphere with the parametric (P(t)) in standard position
    const transformedToStandard = new Vector3();
    transformedToStandard.copy(idealUnitSphereVector);
    transformedToStandard.applyMatrix4(SEStore.inverseTotalRotationMatrix);

    // find the tracing tMin and tMax
    const [tMin, tMax] = this.ref.tMinMaxExpressionValues();
    // It must be the case that tMax> tMin because in update we check to make sure -- if it is not true then this parametric doesn't exist

    const closestStandardVector = new Vector3();
    closestStandardVector.copy(
      SENodule.closestVectorParametrically(
        this.ref.P.bind(this.ref), // bind the this.ref so that this in the this.ref.P method is this.ref
        this.ref.PPrime.bind(this.ref), // bind the this.ref so that this in the this.ref.PPrime method is this.ref
        transformedToStandard,
        tMin,
        tMax,
        this.ref.PPPrime.bind(this.ref) // bind the this.ref so that this in the this.ref.PPPrime method is this.ref
      ).vector
    );
    // Finally transform the closest vector on the ellipse in standard position to the target unit sphere
    return closestStandardVector.applyMatrix4(
      this.tmpMatrix.getInverse(SEStore.inverseTotalRotationMatrix)
    );
  }
  /**
   * Return the vector near the SEParameteric (within SETTINGS.parametric.maxLabelDistance) that is closest to the idealUnitSphereVector
   * @param idealUnitSphereVector A vector on the unit sphere
   */
  public closestLabelLocationVector(idealUnitSphereVector: Vector3): Vector3 {
    // First find the closest point on the parametric to the idealUnitSphereVector
    const closest = new Vector3();
    closest.copy(this.closestVector(idealUnitSphereVector));
    // The current magnification level

    const mag = SEStore.zoomMagnificationFactor;

    // If the idealUnitSphereVector is within the tolerance of the closest point, do nothing, otherwise return the vector in the plane of the ideanUnitSphereVector and the closest point that is at the tolerance distance away.
    if (
      closest.angleTo(idealUnitSphereVector) <
      SETTINGS.parametric.maxLabelDistance / mag
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
        Math.sin(SETTINGS.parametric.maxLabelDistance / mag)
      );
      return this.tmpVector2
        .addScaledVector(
          closest,
          Math.cos(SETTINGS.parametric.maxLabelDistance / mag)
        )
        .normalize();
    }
  }
  accept(v: Visitor): void {
    v.actionOnParametric(this);
  }

  /**
   * Return the normal vector(s) to the plane containing a line that is perpendicular to this parametric through the
   * sePoint, in the case that the usual way of defining this line is not well defined  (something is parallel),
   * use the oldNormal to help compute a new normal (which is returned)
   * @param sePoint A point on the line normal to this parametric
   */
  public getNormalsToPerpendicularLinesThru(
    sePointVector: Vector3,
    oldNormal: Vector3, // ignored for Ellipse and Circle and Parametric, but not other one-dimensional objects
    useFullTInterval?: boolean // only used in the constructor when figuring out the maximum number of perpendiculars to a SEParametric
  ): Vector3[] {
    const transformedToStandard = new Vector3();
    transformedToStandard.copy(sePointVector);
    transformedToStandard
      .applyMatrix4(SEStore.inverseTotalRotationMatrix)
      .normalize();

    // find the tracing tMin and tMax
    const [tMin, tMax] = useFullTInterval
      ? [this.ref.tNumbers.min, this.ref.tNumbers.max]
      : this.ref.tMinMaxExpressionValues();

    // It must be the case that tMax> tMin because in update we check to make sure -- if it is not true then this parametric doesn't exist
    // console.log("normal search");
    let normalList: Vector3[] = [];

    normalList = SENodule.getNormalsToPerpendicularLinesThruParametrically(
      //this.ref.P.bind(this.ref), // bind the this.ref so that this in the this.ref.P method is this.ref
      this.ref.PPrime.bind(this.ref), // bind the this.ref so that this in the this.ref.PPrime method is this.ref
      transformedToStandard,
      tMin,
      tMax,
      this.ref.c1DiscontinuityParameterValues,
      this.ref.PPPrime.bind(this.ref) // bind the this.ref so that this in the this.ref.PPPrime method is this.ref
    );

    // normalList.forEach((vec, ind) => {
    //   if (
    //     Math.abs(vec.dot(transformedToStandard)) >
    //     SETTINGS.tolerance / 1000
    //   ) {
    //     console.log(ind, "NOT through point");
    //   }
    //   if (vec.isZero(SETTINGS.tolerance / 1000)) {
    //     console.log(ind, " Vector is ZERO");
    //   }
    // });

    // console.log("# normals before", normalList.length);
    // normalList = normalList
    //   // make sure that the returned vector are not just zeros of PPrime (which do not lead to perpendiculars)
    //   .filter(vec => !vec.isZero(SETTINGS.tolerance / 1000))
    //   // check that normals that are perpendicular to the line that passes through the given vector
    //   .filter(
    //     vec =>
    //       Math.abs(vec.dot(transformedToStandard)) < SETTINGS.tolerance / 1000
    //   )
    //   .filter(vec => vec.normalize());
    // console.log("# normals middle", normalList.length);

    // return normalList.map(vec =>
    //   vec
    //     .applyMatrix4(
    //       this.tmpMatrix.getInverse(SEStore.inverseTotalRotationMatrix)
    //     )
    //     .normalize()
    // );

    // remove duplicates from the list
    const uniqueNormals: Vector3[] = [];
    normalList.forEach(vec => {
      if (
        !uniqueNormals.some(nor =>
          this.tmpVector
            .crossVectors(vec, nor)
            .isZero(SETTINGS.nearlyAntipodalIdeal)
        )
      ) {
        uniqueNormals.push(vec);
      }
      // else {
      //   console.log("Duplicate normal found");
      // }
    });
    // console.log("# normals end", uniqueNormals.length);
    // console.log("uni perp", uniqueNormals);

    if (uniqueNormals.length > this._maxNumberOfPerpendiculars) {
      console.debug(
        "The number of normal vectors is bigger than the number of normals counted in the constructor. (Ignore this if issued by constructor.)"
      );
    }
    return uniqueNormals.map(vec =>
      vec
        .applyMatrix4(
          this.tmpMatrix.getInverse(SEStore.inverseTotalRotationMatrix)
        )
        .normalize()
    );
  }

  /**
   * Return the normal vector(s) to the plane containing a line that is tangent to this parametric through the
   * sePoint, in the case that the usual way of defining this line is not well defined  (something is parallel),
   * use the oldNormal to help compute a new normal (which is returned)
   * @param sePoint A point on the line tangent to this parametric
   */
  public getNormalsToTangentLinesThru(
    sePointVector: Vector3,
    useFullTInterval?: boolean // only used in the constructor when figuring out the maximum number of Tangents to a SEParametric
  ): Vector3[] {
    const transformedToStandard = new Vector3();
    transformedToStandard.copy(sePointVector);
    transformedToStandard
      .applyMatrix4(SEStore.inverseTotalRotationMatrix)
      .normalize();
    // It must be the case that tMax> tMin because in update we check to make sure -- if it is not true then this parametric doesn't exist

    // find the tracing tMin and tMax
    const [tMin, tMax] = useFullTInterval
      ? [this.ref.tNumbers.min, this.ref.tNumbers.max]
      : this.ref.tMinMaxExpressionValues();
    const avoidTValues: number[] = [];
    avoidTValues.push(...this.ref.c1DiscontinuityParameterValues);
    let normalList: Vector3[] = [];
    //If the vector is on the Parametric then there is at at least one tangent
    if (
      this.closestVector(sePointVector).angleTo(sePointVector) <
      0.01 / SEStore.zoomMagnificationFactor
    ) {
      // console.log("here");
      const coorespondingTVal = SENodule.closestVectorParametrically(
        this.ref.P.bind(this.ref), // bind the this.ref so that this in the this.ref.E method is this.ref
        this.ref.PPrime.bind(this.ref), // bind the this.ref so that this in the this.ref.E method is this.ref
        transformedToStandard,
        tMin,
        tMax,
        this.ref.PPPrime.bind(this.ref) // bind the this.ref so that this in the this.ref.E method is this.ref
      ).tVal;
      // console.log("coord t val", coorespondingTVal);
      const tangentVector = new Vector3();
      tangentVector.copy(this.ref.PPrime(coorespondingTVal));
      tangentVector.applyMatrix4(SEStore.inverseTotalRotationMatrix);
      tangentVector.cross(this.ref.P(coorespondingTVal));
      avoidTValues.push(coorespondingTVal);
      // console.log("coordes t val", coorespondingTVal);
      normalList.push(tangentVector.normalize());
    }

    // console.log("normal search");

    normalList.push(
      ...SENodule.getNormalsToTangentLinesThruParametrically(
        this.ref.P.bind(this.ref), // bind the this.ref so that this in the this.ref.P method is this.ref
        this.ref.PPrime.bind(this.ref), // bind the this.ref so that this in the this.ref.PPrime method is this.ref
        transformedToStandard,
        tMin,
        tMax,
        avoidTValues,
        this.ref.PPPrime.bind(this.ref) // bind the this.ref so that this in the this.ref.PPPrime method is this.ref
      )
    );

    // normalList.forEach((vec, ind) => {
    //   if (
    //     Math.abs(vec.dot(transformedToStandard)) >
    //     SETTINGS.tolerance / 1000
    //   ) {
    //     console.log(ind, "NOT through point");
    //   }
    //   if (vec.isZero(SETTINGS.tolerance / 1000)) {
    //     console.log(ind, " Vector is ZERO");
    //   }
    // });

    // console.log("# normals before", normalList.length);
    normalList = normalList
      // make sure that the returned vector are not just zeros of PPrime (which do not lead to Tangents)
      .filter(vec => !vec.isZero(SETTINGS.tolerance / 1000))
      // check that normals that are perpendicular to the line that passes through the given vector
      .filter(
        vec =>
          Math.abs(vec.dot(transformedToStandard)) < SETTINGS.tolerance / 1000
      )
      .filter(vec => vec.normalize());
    // console.log("# normals middle", normalList.length);

    // return normalList.map(vec =>
    //   vec
    //     .applyMatrix4(
    //       this.tmpMatrix.getInverse(SEStore.inverseTotalRotationMatrix)
    //     )
    //     .normalize()
    // );

    // remove duplicates from the list
    const uniqueNormals: Vector3[] = [];
    normalList.forEach(vec => {
      if (
        !uniqueNormals.some(nor =>
          this.tmpVector
            .crossVectors(vec, nor)
            .isZero(SETTINGS.nearlyAntipodalIdeal)
        )
      ) {
        uniqueNormals.push(vec);
      }
      // else {
      //   console.log("Duplicate normal found");
      // }
    });
    // console.log("# normals end", uniqueNormals.length);
    // console.log("uni perp", uniqueNormals);

    if (uniqueNormals.length > this._maxNumberOfTangents) {
      console.debug(
        "The number of normal vectors is bigger than the number of normals counted in the constructor. (Ignore this if issued by constructor.)"
      );
    }
    return uniqueNormals.map(vec =>
      vec
        .applyMatrix4(
          this.tmpMatrix.getInverse(SEStore.inverseTotalRotationMatrix)
        )
        .normalize()
    );
  }

  // I wish the SENodule methods would work but I couldn't figure out how
  // See the attempts in SENodule around line 218
  public isFreePoint(): boolean {
    return false;
  }
  public isOneDimensional(): boolean {
    return true;
  }
  public isPoint(): boolean {
    return false;
  }
  public isPointOnOneDimensional(): boolean {
    return false;
  }
  public isLabel(): boolean {
    return false;
  }
  public isSegmentOfLengthPi(): boolean {
    return false;
  }
  public isLabelable(): boolean {
    return true;
  }
  public isNonFreeLine(): boolean {
    return false;
  }
}
