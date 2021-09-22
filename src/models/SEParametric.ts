import { SENodule } from "./SENodule";
// import { SEPoint } from "./SEPoint";
// import Ellipse from "@/plottables/Ellipse";
import { Vector3, Matrix4 } from "three";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
import {
  OneDimensional,
  CoordExpression,
  CoordinateSyntaxTrees,
  MinMaxNumber,
  MinMaxExpression,
  MinMaxSyntaxTrees,
  NormalVectorAndTValue,
  ObjectState
} from "@/types";
import SETTINGS from "@/global-settings";
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
import { ExpressionParser } from "@/expression/ExpressionParser";
import { SEExpression } from "./SEExpression";
import { DisplayStyle } from "@/plottables/Nodule";
import { SEParametricTracePoint } from "./SEParametricTracePoint";
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
   * The SE endpoints of this curve, if any
   */
  private _endPoints: SEParametricEndPoint[] = [];
  private _tracePoint!: SEParametricTracePoint;

  /**
   * These are string expressions that once set define the Parametric curve
   */
  private _coordinateExpressions: CoordExpression = { x: "", y: "", z: "" };

  private coordinateSyntaxTrees: CoordinateSyntaxTrees = {
    x: ExpressionParser.NOT_DEFINED,
    y: ExpressionParser.NOT_DEFINED,
    z: ExpressionParser.NOT_DEFINED
  };

  private primeCoordinateSyntaxTrees: CoordinateSyntaxTrees = {
    x: ExpressionParser.NOT_DEFINED,
    y: ExpressionParser.NOT_DEFINED,
    z: ExpressionParser.NOT_DEFINED
  };

  private primeX2CoordinateSyntaxTrees: CoordinateSyntaxTrees = {
    x: ExpressionParser.NOT_DEFINED,
    y: ExpressionParser.NOT_DEFINED,
    z: ExpressionParser.NOT_DEFINED
  };
  /**
   * The expressions that are the parents of this curve
   */

  private _seParentExpressions: SEExpression[] = [];

  /**
   * _tNumbers hold the current min/max of the entire curve. This value
   *   may get updated when tExpressions are updated
   * _tNumbersHardLimit hold the lifetime min/max of the entire curve. This
   *   value is "read-only", i.e. stay constant throughout the curve lifetime.
   *
   * When tExpressions are provided, the active t range may change
   * However, the active tNumbers must always be bound by the hard limits.
   */
  private _tExpressions: MinMaxExpression = { min: "", max: "" };
  private _tNumbers: MinMaxNumber = { min: NaN, max: NaN };
  private _tNumbersHardLimit: MinMaxNumber = { min: NaN, max: NaN };

  private _c1DiscontinuityParameterValues: number[] = [];

  private tSyntaxTrees: MinMaxSyntaxTrees = {
    min: ExpressionParser.NOT_DEFINED,
    max: ExpressionParser.NOT_DEFINED
  };
  /**
   * The map which gets updated with the current value of the measurements
   */
  readonly varMap = new Map<string, number>();

  /**
   * The map which holds the previous value of the measurements.
   * This helps to avoid unnecessary rebuilding of curves.
   */
  readonly prevVarMap = new Map<string, number>();

  /**
   * Create a model SEParametric using:
   * @param parametric The plottable TwoJS Object associated to this object
   */
  constructor(
    parametric: Parametric,
    coordinateExpressions: { x: string; y: string; z: string },
    tExpressions: { min: string; max: string },
    tNumbers: { min: number; max: number } /* hard limit */,
    c1DiscontinuityParameterValues: number[],
    measurementParents: SEExpression[]
  ) {
    super();
    this.ref = parametric;
    // Set the expressions for the curve, its derivative, and the tMin & tMax
    this.coordinateExpressions.x = coordinateExpressions.x;
    this.coordinateExpressions.y = coordinateExpressions.y;
    this.coordinateExpressions.z = coordinateExpressions.z;
    // P(t)
    this.coordinateSyntaxTrees.x = ExpressionParser.parse(
      coordinateExpressions.x
    );
    this.coordinateSyntaxTrees.y = ExpressionParser.parse(
      coordinateExpressions.y
    );
    this.coordinateSyntaxTrees.z = ExpressionParser.parse(
      coordinateExpressions.z
    );

    // P'(t)
    this.primeCoordinateSyntaxTrees.x = ExpressionParser.differentiate(
      this.coordinateSyntaxTrees.x,
      "t"
    );
    this.primeCoordinateSyntaxTrees.y = ExpressionParser.differentiate(
      this.coordinateSyntaxTrees.y,
      "t"
    );
    this.primeCoordinateSyntaxTrees.z = ExpressionParser.differentiate(
      this.coordinateSyntaxTrees.z,
      "t"
    );

    // P''(t)
    this.primeX2CoordinateSyntaxTrees.x = ExpressionParser.differentiate(
      this.primeCoordinateSyntaxTrees.x,
      "t"
    );
    this.primeX2CoordinateSyntaxTrees.y = ExpressionParser.differentiate(
      this.primeCoordinateSyntaxTrees.y,
      "t"
    );
    this.primeX2CoordinateSyntaxTrees.z = ExpressionParser.differentiate(
      this.primeCoordinateSyntaxTrees.z,
      "t"
    );
    this._tNumbersHardLimit = tNumbers;
    if (tExpressions.min.trim().length > 0) {
      this._tExpressions.min = tExpressions.min;
      this.tSyntaxTrees.min = ExpressionParser.parse(tExpressions.min);
    }
    if (tExpressions.max.trim().length > 0) {
      this._tExpressions.max = tExpressions.max;
      this.tSyntaxTrees.max = ExpressionParser.parse(tExpressions.max);
    }

    const numDiscontinuity = c1DiscontinuityParameterValues.length;
    if (numDiscontinuity > 0) {
      console.log(
        "****** Parametric curve with discontinuity!!!!!",
        c1DiscontinuityParameterValues
      );
      if (this._tNumbersHardLimit.min < c1DiscontinuityParameterValues[0]) {
        this._c1DiscontinuityParameterValues.push(this._tNumbers.min);
      }
      this._c1DiscontinuityParameterValues.push(
        ...c1DiscontinuityParameterValues
      );
      if (
        this._tNumbersHardLimit.max >
        c1DiscontinuityParameterValues[numDiscontinuity - 1]
      )
        this._c1DiscontinuityParameterValues.push(this._tNumbers.max);
      let ptr: Parametric | null = this.ref; // Head of the list
      for (
        let m = 1;
        m < this._c1DiscontinuityParameterValues.length - 1;
        m++
      ) {
        const p = new Parametric();
        p.partId = m;
        ptr.next = p;
        ptr = p;
      }
    }
    this._seParentExpressions.push(...measurementParents);

    // Sample for max number of perpendiculars from any point on the sphere
    // https://stackoverflow.com/questions/9600801/evenly-distributing-n-points-on-a-sphere
    // const sample: Vector3[] = [];
    // for (let i = 0; i < SETTINGS.parametric.evenSphereSampleSize; i++) {
    //   const y = 1 - (i / (SETTINGS.parametric.evenSphereSampleSize - 1)) * 2; // y goes from 1 to -1
    //   const radius = Math.sqrt(1 - y * y); // radius at y
    //   const theta = ((Math.sqrt(5) + 1) / 2) * i; // golden angle increment
    //   const x = Math.cos(theta) * radius;
    //   const z = Math.sin(theta) * radius;
    //   sample.push(new Vector3(x, y, z));
    // }

    SEParametric.PARAMETRIC_COUNT++;
    this.name = `Pa${SEParametric.PARAMETRIC_COUNT}`;
    this.calculateFunctionAndDerivatives(true); // true: First build
    let ptr: Parametric | null = this.ref;
    while (ptr !== null) {
      ptr.updateDisplay();
      ptr = ptr.next;
    }
  }

  private calculateFunctionAndDerivatives(firstBuild = false): void {
    this._seParentExpressions.forEach((m: SEExpression) => {
      this.varMap.set(m.name, m.value);
    });
    let updatedCount = 0;
    for (const [key, val] of this.varMap) {
      const prevValue = this.prevVarMap.get(key);
      if (!prevValue || Math.abs(val - prevValue) > 1e-6) {
        updatedCount++;
        this.prevVarMap.set(key, val);
      }
    }
    if (!firstBuild && updatedCount === 0) {
      // console.debug("No rebuilding function and its derivatives required");
      return;
    }
    // We have to rebuild when either this call is the FIRST build
    // OR some variables have changed their value
    // console.debug("(Re)building function and its derivatives");
    const fnValues: Vector3[] = [];
    const fnPrimeValues: Vector3[] = [];
    const fnPPrimeValues: Vector3[] = [];
    if (this.tSyntaxTrees.min !== ExpressionParser.NOT_DEFINED) {
      const minValue = ExpressionParser.evaluate(
        this.tSyntaxTrees.min,
        this.varMap
      );

      this._tNumbers.min = Math.max(this._tNumbersHardLimit.min, minValue);
    } else this._tNumbers.min = this._tNumbersHardLimit.min;
    if (this.tSyntaxTrees.max !== ExpressionParser.NOT_DEFINED) {
      const maxValue = ExpressionParser.evaluate(
        this.tSyntaxTrees.max,
        this.varMap
      );
      this._tNumbers.max = Math.min(this._tNumbersHardLimit.max, maxValue);
    } else this._tNumbers.max = this._tNumbersHardLimit.max;
    this.evaluateFunctionAndCache(this.coordinateSyntaxTrees, fnValues);
    this.evaluateFunctionAndCache(
      this.primeCoordinateSyntaxTrees,
      fnPrimeValues
    );
    this.evaluateFunctionAndCache(
      this.primeX2CoordinateSyntaxTrees,
      fnPPrimeValues
    );
    if (this._c1DiscontinuityParameterValues.length === 0) {
      console.debug("We have just ONE continuous curve");
      this.ref.setRangeAndFunctions(
        fnValues,
        fnPrimeValues,
        fnPPrimeValues,
        this._tNumbersHardLimit.min,
        this._tNumbersHardLimit.max,
        this.tNumbers.min,
        this.tNumbers.max
      );
    } else {
      console.debug(
        "We have",
        this._c1DiscontinuityParameterValues.length - 1,
        "continuous curves"
      );
      let p: Parametric | null = this.ref;
      const breakPoints = this._c1DiscontinuityParameterValues;
      let m = 1;
      while (p !== null) {
        p.setRangeAndFunctions(
          fnValues,
          fnPrimeValues,
          fnPPrimeValues,
          this._tNumbersHardLimit.min,
          this._tNumbersHardLimit.max,
          breakPoints[m - 1],
          breakPoints[m]
        );
        p.stylize(DisplayStyle.ApplyCurrentVariables);
        p.adjustSize();
        m++;
        p = p.next;
      }
    }
  }

  private evaluateFunctionAndCache(
    fn: CoordinateSyntaxTrees,
    cache: Array<Vector3>
  ): void {
    const N = SETTINGS.parameterization.subdivisions * 4;
    const RANGE = this._tNumbersHardLimit.max - this._tNumbersHardLimit.min;
    // console.debug(
    //   `Evaluate function in range, [${this._tNumbersHardLimit.min}, ${this._tNumbersHardLimit.max}]`
    // );
    cache.splice(0);

    let vecValue: Vector3;
    for (let i = 0; i < N; i++) {
      const tValue = this._tNumbersHardLimit.min + (i * RANGE) / (N - 1);
      this.varMap.set("t", tValue);
      vecValue = new Vector3(
        ExpressionParser.evaluate(fn.x, this.varMap),
        ExpressionParser.evaluate(fn.y, this.varMap),
        ExpressionParser.evaluate(fn.z, this.varMap)
      );
      cache.push(vecValue);
    }
  }
  /**
   * The tMin & tMax starting *tracing* parameter of the curve.
   */
  public tMinMaxExpressionValues(): number[] {
    if (
      this.tSyntaxTrees.min === ExpressionParser.NOT_DEFINED ||
      this.tSyntaxTrees.max === ExpressionParser.NOT_DEFINED
    )
      return [this._tNumbersHardLimit.min, this._tNumbersHardLimit.max];
    // first update the map with the current values of the measurements
    this._seParentExpressions.forEach((m: SEExpression) => {
      const measurementName = m.name;
      // console.debug("Measurement", m, measurementName);
      this.varMap.set(measurementName, m.value);
    });
    let tMin = ExpressionParser.evaluate(this.tSyntaxTrees.min, this.varMap);
    let tMax = ExpressionParser.evaluate(this.tSyntaxTrees.max, this.varMap);
    // restrict to the parameter interval of tNumber.min to tNumber.max
    if (tMin < this._tNumbersHardLimit.min) tMin = this._tNumbersHardLimit.min;
    if (tMax > this._tNumbersHardLimit.max) tMax = this._tNumbersHardLimit.max;

    return [tMin, tMax];
  }

  customStyles(): Set<string> {
    return styleSet;
  }

  public get noduleDescription(): string {
    return String(
      i18n.t(`objectTree.parametricDescription`, {
        xExpression: this.coordinateExpressions.x,
        yExpression: this.coordinateExpressions.y,
        zExpression: this.coordinateExpressions.z,
        tMinNumber: this.tNumbers.min,
        tMaxNumber: this.tNumbers.max
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

  set tracePoint(pt: SEParametricTracePoint) {
    this._tracePoint = pt;
  }
  get tracePoint(): SEParametricTracePoint {
    return this._tracePoint;
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

  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) return;

    this.setOutOfDate(false);

    // The measurement expressions parents must exist
    this._exists = this._seParentExpressions.every(exp => exp.exists);

    // find the tracing tMin and tMax
    const [tMin, tMax] = this.tMinMaxExpressionValues();
    // if the tMin/tMax values are out of order then parametric curve doesn't exist
    if (tMax <= tMin) {
      this._exists = false;
    }

    if (this._exists) {
      // display the updated parametric
      this.calculateFunctionAndDerivatives();
      let ptr: Parametric | null = this.ref;
      while (ptr !== null) {
        ptr.updateDisplay();
        ptr = ptr.next;
      }
    }

    if (this.showing && this._exists) {
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }

    // These parametric are completely determined by their measurement parents and an update on the parents
    // will cause this parametric to be put into the correct location. So we don't store any additional information
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        console.log(
          `Parametric with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      orderedSENoduleList.push(this.id);
      objectState.set(this.id, { kind: "parametric", object: this });
    }

    this.updateKids(objectState, orderedSENoduleList);
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
    const [tMin, tMax] = this.tMinMaxExpressionValues();
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

  private removeDuplicateVectors(arr: Array<NormalVectorAndTValue>): void {
    let N = arr.length;
    const duplicatePos: Array<number> = [];
    for (let k = 0; k < N; k++) {
      for (let m = k + 1; m < N; m++) {
        const dotProd = Math.abs(arr[k].normal.dot(arr[m].normal));
        if (Math.abs(dotProd - 1) < 1e-6) duplicatePos.push(m);
      }
      // Remove duplicate items from the highest index first
      // so the positions of the other items are not affected
      for (let n = duplicatePos.length - 1; n >= 0; n--) {
        arr.splice(duplicatePos[n], 1);
        N--;
      }
      duplicatePos.splice(0);
    }
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
  ): Array<NormalVectorAndTValue> {
    const transformedToStandard = new Vector3();
    transformedToStandard.copy(sePointVector);
    transformedToStandard
      .applyMatrix4(SEStore.inverseTotalRotationMatrix)
      .normalize();

    // find the tracing tMin and tMax
    const [tMin, tMax] = useFullTInterval
      ? [this._tNumbersHardLimit.min, this._tNumbersHardLimit.max]
      : this.tMinMaxExpressionValues();

    // It must be the case that tMax> tMin because in update we check to make sure -- if it is not true then this parametric doesn't exist
    // console.log("normal search");
    let normalList: Array<NormalVectorAndTValue> = [];

    // TODO: Replace with a loop here
    normalList = SENodule.getNormalsToPerpendicularLinesThruParametrically(
      // this.ref.P.bind(this.ref), // bind the this.ref so that this in the this.ref.P method is this.ref
      this.ref.PPrime.bind(this.ref), // bind the this.ref so that this in the this.ref.PPrime method is this.ref
      transformedToStandard,
      tMin,
      tMax,
      [],
      this.ref.PPPrime.bind(this.ref) // bind the this.ref so that this in the this.ref.PPPrime method is this.ref
    );

    // console.log("# normals before", normalList.length);
    // normalList.forEach((n: Vector3, k: number) => {
    //   console.debug(`Normal-${k}`, n.toFixed(3));
    // });

    // remove duplicates from the list
    this.removeDuplicateVectors(normalList);
    // console.log("Unique normals", normalList.length);
    // normalList.forEach((n: NormalVectorAndTValue, k: number) => {
    //   console.debug(`Normal-${k}`, n.normal.toFixed(3));
    // });
    normalList.forEach((pair: NormalVectorAndTValue) => {
      pair.normal
        .applyMatrix4(
          this.tmpMatrix.getInverse(SEStore.inverseTotalRotationMatrix)
        )
        .normalize();
      this.tmpVector1.copy(this.ref.P(pair.tVal));
      this.tmpVector1
        .applyMatrix4(
          this.tmpMatrix.getInverse(SEStore.inverseTotalRotationMatrix)
        )
        .normalize();
    });
    return normalList;
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
      ? [this._tNumbersHardLimit.min, this._tNumbersHardLimit.max]
      : this.tMinMaxExpressionValues();
    const avoidTValues: number[] = [];
    // avoidTValues.push(...this._c1DiscontinuityParameterValues);
    const normalList: Vector3[] = [];
    //If the vector is on the Parametric then there is at at least one tangent
    if (
      this.closestVector(sePointVector).angleTo(sePointVector) <
      0.01 / SEStore.zoomMagnificationFactor
    ) {
      const coorespondingTVal = SENodule.closestVectorParametrically(
        this.ref.P.bind(this.ref), // bind the this.ref so that this in the this.ref.E method is this.ref
        this.ref.PPrime.bind(this.ref), // bind the this.ref so that this in the this.ref.E method is this.ref
        transformedToStandard,
        tMin,
        tMax,
        this.ref.PPPrime.bind(this.ref) // bind the this.ref so that this in the this.ref.E method is this.ref
      ).tVal;
      const tangentVector = new Vector3();
      tangentVector.copy(this.ref.PPrime(coorespondingTVal));
      tangentVector.applyMatrix4(SEStore.inverseTotalRotationMatrix);
      tangentVector.cross(this.ref.P(coorespondingTVal));
      avoidTValues.push(coorespondingTVal);
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
    const taggedList: Array<NormalVectorAndTValue> = normalList.map(
      (vec: Vector3) => {
        return {
          normal: vec,
          tVal: NaN
        };
      }
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

    // remove duplicates from the list
    // console.log("perpendiculars", normalList);
    this.removeDuplicateVectors(taggedList);

    // console.log("unique perpendicular", normalList);

    // if (uniqueNormals.length > this._maxNumberOfTangents) {
    //   console.debug(
    //     "The number of normal vectors is bigger than the number of normals counted in the constructor. (Ignore this if issued by constructor.)"
    //   );
    // }
    this.tmpMatrix.getInverse(SEStore.inverseTotalRotationMatrix);
    return taggedList.map((z: NormalVectorAndTValue) => {
      z.normal.applyMatrix4(this.tmpMatrix).normalize();
      return z.normal;
    });
  }

  get coordinateExpressions(): CoordExpression {
    return this._coordinateExpressions;
  }
  get c1DiscontinuityParameterValues(): number[] {
    return this._c1DiscontinuityParameterValues;
  }
  get tExpressions(): MinMaxExpression {
    return this._tExpressions;
  }
  get tNumbers(): MinMaxNumber {
    return this._tNumbers;
  }
  get seParentExpressions(): SEExpression[] {
    return this._seParentExpressions;
  }

  public isOneDimensional(): boolean {
    return true;
  }
  
  public isLabelable(): boolean {
    return true;
  }
}
