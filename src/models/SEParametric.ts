import { SENodule } from "./SENodule";
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
  ObjectState,
  ParametricVectorAndTValue
} from "@/types";
import SETTINGS from "@/global-settings";
import { Labelable } from "@/types";
import { SELabel } from "@/models/SELabel";
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
import { SEStoreType, useSEStore } from "@/stores/se";
const styleSet = new Set([
  ...Object.getOwnPropertyNames(DEFAULT_PARAMETRIC_FRONT_STYLE),
  ...Object.getOwnPropertyNames(DEFAULT_PARAMETRIC_BACK_STYLE)
]);

import { Heap } from "@datastructures-js/heap";

// To keep the sample points in t-value order when new sample points
// are appended to the array, keep track of its left and right neighbors
type TSample = {
  t: number; // Floating point
  left: number; // integer index
  right: number; // integer index
  value: Vector3;
};

// Data structure stored in a max heap used for adaptive smoothing
type TCurve = {
  index: number; // index into the TSample array
  curvature: number; // local curvature at the sample point
};

export class SEParametric
  extends SENodule
  implements Visitable, OneDimensional, Labelable
{
  /**
   * The corresponding plottable TwoJS object
   */
  public declare ref: Parametric;

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

  /** the current T-value bounds which can be affected by measurement expressions */
  private _tNumbers: MinMaxNumber = { min: NaN, max: NaN };

  /** the current T-value bounds which can be affected by measurement expressions */
  private _tNumbersHardLimit: MinMaxNumber = { min: NaN, max: NaN };

  private _tValues: Array<number> = [];
  private partitionedTValues: Array<Array<number>> = [];
  private _isClosed: boolean;
  private fnValues: Vector3[] = [];
  private fnPrimeValues: Vector3[] = [];
  private fnPPrimeValues: Vector3[] = [];

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

  private store: SEStoreType;

  /**
   * Create a model SEParametric using:
   * @param parametric The plottable TwoJS Object associated to this object
   */
  constructor(
    coordinateExpressions: { x: string; y: string; z: string },
    tExpressions: { min: string; max: string },
    tNumbers: { min: number; max: number } /* hard limit */,
    c1DiscontinuityParameterValues: number[],
    measurementParents: SEExpression[],
    isClosed = false
  ) {
    super();
    this.store = useSEStore();
    this._isClosed = isClosed;
    this._c1DiscontinuityParameterValues.push(
      ...c1DiscontinuityParameterValues
    );
    this.ref = new Parametric(tNumbers.min, tNumbers.max, isClosed);
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
    this._tNumbersHardLimit.min = tNumbers.min;
    this._tNumbersHardLimit.max = tNumbers.max;
    const currentTValues = this.tMinMaxExpressionValues();
    this._tNumbers.min = currentTValues[0];
    this._tNumbers.max = currentTValues[1];

    if (tExpressions.min.trim().length > 0) {
      this._tExpressions.min = tExpressions.min;
      this.tSyntaxTrees.min = ExpressionParser.parse(tExpressions.min);
    }
    if (tExpressions.max.trim().length > 0) {
      this._tExpressions.max = tExpressions.max;
      this.tSyntaxTrees.max = ExpressionParser.parse(tExpressions.max);
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
    const tSamples = this.createSamplingPoints();
    this._tValues.push(...tSamples.map(x => x.t));
    this.fnValues.push(...tSamples.map(x => x.value));
    const numDiscontinuity = c1DiscontinuityParameterValues.length;
    console.debug("Creating a new parametric", this.name);

    // Create partitioned T-values from the T-values of the sample points
    if (numDiscontinuity === 0) {
      // Only a single range of T values
      // Partition-0: t0, t1, t2, ..., tN
      this.partitionedTValues.push(this._tValues);
    } else {
      // Multiple ranges of (partitioned) T values from Cusp points C1, C2, ..., Ck
      const breakPoints = c1DiscontinuityParameterValues.slice(0);
      // Take the smaller of the two upper bounds
      if (tNumbers.max > c1DiscontinuityParameterValues[numDiscontinuity - 1])
        breakPoints.push(currentTValues[1]);

      // Partition the T-values t0, t1, t2, ..., tN using
      // the cusp points C1, C2, C3, ..., Ck, tMax as delimiters

      // Partition-1: t0, t1, ..., ti  (all values <= C1)
      // Partition-2: ti+1, ..., tj (all values <= C2)
      // And so on
      // Partition-M: tm, tm+1, ... , tN (all values <= Ck or values <= tMax)
      let partIndex = 0;
      for (const upperBound of breakPoints) {
        const tVals = [];
        while (this._tValues[partIndex] < upperBound) {
          // Loop to create a single partition
          tVals.push(this._tValues[partIndex]);
          partIndex++; // next partition
        }
        this.partitionedTValues.push(tVals.slice(0));
      }
      // this.partitionedTValues.forEach((p, pos) => {
      //   console.debug(`Partition ${pos} has ${p.length} sample points`, p);
      // });
    }
    this.calculateDerivatives(tSamples);
  }

  // Return the array of T-vals partitions.
  // A curve with no cusp points has only ONE partition
  get tRanges(): Array<Array<number>> {
    return this.partitionedTValues;
  }

  get isClosedCurve(): boolean {
    return this._isClosed;
  }

  /** Generate adaptive sampling points based of "local curvatures" */
  private createSamplingPoints(): Array<TSample> {
    // Area of a triangle formed by three consecutive sample points
    // This also measures the local curvature
    const computeArea = (a: TSample, b: TSample, c: TSample): number => {
      return (
        0.5 *
        Math.abs(
          a.value.x * b.value.y +
            b.value.x * c.value.y +
            c.value.x * a.value.y -
            a.value.x * c.value.y -
            b.value.x * a.value.y -
            c.value.x * b.value.y
        )
      );
    };
    const rotationMat4 = this.tmpMatrix
      .copy(this.store.inverseTotalRotationMatrix)
      .invert();
    const N = 5; // initial number of sample points
    const RANGE = this._tNumbersHardLimit.max - this._tNumbersHardLimit.min;
    let vecValue: Vector3;
    const fnValues: Array<TSample> = [];
    // To initialize, place equally spaced (in time) sample points on the curve
    for (let i = 0; i < N; i++) {
      const tValue = this._tNumbersHardLimit.min + (i * RANGE) / (N - 1);
      this.varMap.set("t", tValue);
      vecValue = new Vector3(
        ExpressionParser.evaluate(this.coordinateSyntaxTrees.x, this.varMap),
        ExpressionParser.evaluate(this.coordinateSyntaxTrees.y, this.varMap),
        ExpressionParser.evaluate(this.coordinateSyntaxTrees.z, this.varMap)
      );
      vecValue.applyMatrix4(rotationMat4);
      // console.debug(`At t=${tValue.toFixed(4)}`, vecValue.toFixed(4));
      fnValues.push({
        t: tValue,
        left: i > 0 ? i - 1 : this._isClosed ? N - 1 : 0, // left neighbor of the first point is itself (unless it is a closed curve)
        right: i < N - 1 ? i + 1 : this._isClosed ? 0 : N - 1, // right neighbor of the last point is itself
        value: vecValue
      });
    }
    // Calculate the local curvatures of the inner sample points
    const AREA_THRESHOLD = 0.001;
    // Provide our own array so we can manually peek into the elements
    // This action is required when curvature of a point already in the heap must be recalculated
    const tCurveArr: Array<TCurve> = [];
    const curvatureHeap = new Heap<TCurve>(
      (a: TCurve, b: TCurve) => (a.curvature < b.curvature ? +1 : -1), // Max heap
      tCurveArr
    );

    let prev: TSample = fnValues[0];
    let curr: TSample = fnValues[1];
    // Computer curvature of all the interior points
    // exclude curvature of fnValues[0] and fnValues[N-1]
    for (let k = 2; k < N; k++) {
      const next = fnValues[k];
      // Use the area of the triangle made of three consecutive points
      // as the approximation to the local curvature
      const curvature = computeArea(prev, curr, next);

      // Lowest index = 1, highest index = N-2
      curvatureHeap.push({ index: k - 1, curvature });
      prev = curr;
      curr = next;
    }
    // Improve the samples by adding sample points around existing points
    // with high curvature.
    // Since we use a max heap, highest curvature will be
    // processed first
    while (curvatureHeap.size() > 0) {
      // In the following loop, 3 equally-spaced points L, M, R are expanded
      // into 4 equally-spaced points L, M1, M2, R
      // i.e M is "deleted" and replaced by M1 and M2
      const nextSample = curvatureHeap.pop();

      // console.debug(
      //   `Next point with curvature ${nextSample.curvature.toFixed(4)} at ${
      //     nextSample.index
      //   }`
      // );
      const indexM = nextSample.index;
      const indexL = fnValues[indexM].left; // index of L
      const tLeft = fnValues[indexL].t;
      const indexR = fnValues[indexM].right; // index of R
      const tRight = fnValues[indexR].t;
      // Recalculate the point on the left third
      const t1 = (2 * tLeft + tRight) / 3; // T-value for M1
      this.varMap.set("t", t1);
      const xLeft = ExpressionParser.evaluate(
        this.coordinateSyntaxTrees.x,
        this.varMap
      );
      const yLeft = ExpressionParser.evaluate(
        this.coordinateSyntaxTrees.y,
        this.varMap
      );
      const zLeft = ExpressionParser.evaluate(
        this.coordinateSyntaxTrees.z,
        this.varMap
      );
      // Recalculate the point on the right third
      const t2 = (tLeft + 2 * tRight) / 3; // T-value for M2
      this.varMap.set("t", t2);
      const xRight = ExpressionParser.evaluate(
        this.coordinateSyntaxTrees.x,
        this.varMap
      );
      const yRight = ExpressionParser.evaluate(
        this.coordinateSyntaxTrees.y,
        this.varMap
      );
      const zRight = ExpressionParser.evaluate(
        this.coordinateSyntaxTrees.z,
        this.varMap
      );
      const indexM2 = fnValues.length; // Must be the length BEFORE push
      // Reuse the space previously occupied by M for M1
      const indexM1 = indexM;
      fnValues[indexM1].t = t1;
      // left neighbor of M1 remains the same (L), but its right neighbor is now M2
      fnValues[indexM1].right = indexM2;
      fnValues[indexM1].value.set(xLeft, yLeft, zLeft);
      // The new sample point M2 is between or M1 and old right R
      fnValues.push({
        t: t2,
        left: indexM1,
        right: indexR,
        value: new Vector3(xRight, yRight, zRight)
      });

      // Left neighbor of R changes to M2
      fnValues[indexR].left = indexM2;

      // Recalculate curvature at L using LL, L, M1
      let heapFixRequired = false;
      const leftOfIndexL = fnValues[indexL].left;
      const areaL = computeArea(
        fnValues[leftOfIndexL],
        fnValues[indexL],
        fnValues[indexM1]
      );
      // Update the curvature of L in the heap
      const posOfL = tCurveArr.findIndex((z: TCurve) => z.index == indexL);
      // posOfL is negative when L is not an interior point, i.e the first sample point
      if (posOfL >= 0) {
        tCurveArr[posOfL].curvature = areaL;
        heapFixRequired = true;
      }
      // Recalculate curvature at R using M2, R, RR
      const rightOfIndexR = fnValues[indexR].right;
      const areaR = computeArea(
        fnValues[indexM2],
        fnValues[indexR],
        fnValues[rightOfIndexR]
      );
      // Update the curvature of R in the heap
      const posOfR = tCurveArr.findIndex((z: TCurve) => z.index == indexR);
      // posOfR is negative when R is not an interior point, i.e the last sample point
      if (posOfR >= 0) {
        tCurveArr[posOfR].curvature = areaR;
        heapFixRequired = true;
      }

      // Reorder the heap when we performed a manual update to the heap entries
      if (heapFixRequired) curvatureHeap.fix();

      // Calculate new curvature at M1 using L, M1, M2
      const areaM1 = computeArea(
        fnValues[indexL],
        fnValues[indexM1],
        fnValues[indexM2]
      );

      if (areaM1 > AREA_THRESHOLD)
        curvatureHeap.push({ index: indexM1, curvature: areaM1 });

      // Calculate new curvature at M2 using M1, M2, R
      const areaM2 = computeArea(
        fnValues[indexM1],
        fnValues[indexM2],
        fnValues[indexR]
      );

      if (areaM2 > AREA_THRESHOLD)
        curvatureHeap.push({ index: indexM2, curvature: areaM2 });
    }
    // Now sort the sample points by their T-value
    fnValues.sort((a: TSample, b: TSample) => a.t - b.t);
    return fnValues;
  }

  private calculateDerivatives(samples: TSample[]): void {
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
    if (updatedCount === 0) {
      // console.debug("No rebuilding function and its derivatives required");
      return;
    }
    // We have to rebuild when either this call is the FIRST build
    // OR some variables have changed their value
    // console.debug("(Re)building function and its derivatives");
    // const fnValues: Vector3[] = [];
    const tSamples = samples.map(z => z.t);
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
    // this.evaluateFunctionAndCache(this.coordinateSyntaxTrees);
    this.evaluateFunctionAndCache(
      tSamples,
      this.primeCoordinateSyntaxTrees,
      this.fnPrimeValues
    );
    this.evaluateFunctionAndCache(
      tSamples,
      this.primeX2CoordinateSyntaxTrees,
      this.fnPPrimeValues
    );
    this.ref.setRangeAndFunctions(
      this._tValues,
      this.fnValues,
      Math.max(this._tNumbersHardLimit.min, this.tNumbers.min),
      Math.min(this._tNumbersHardLimit.max, this.tNumbers.max)
    );
    this.ref.stylize(DisplayStyle.ApplyCurrentVariables);
    this.ref.adjustSize();
  }

  private evaluateFunctionAndCache(
    tSamples: Array<number>,
    fn: CoordinateSyntaxTrees,
    cache: Array<Vector3>
  ): void {
    // console.debug(
    //   `Evaluate function in range, [${this._tNumbersHardLimit.min}, ${this._tNumbersHardLimit.max}]`
    // );
    cache.splice(0);

    let vecValue: Vector3;
    for (let i = 0; i < tSamples.length; i++) {
      const tValue = tSamples[i];
      this.varMap.set("t", tValue);
      vecValue = new Vector3(
        ExpressionParser.evaluate(fn.x, this.varMap),
        ExpressionParser.evaluate(fn.y, this.varMap),
        ExpressionParser.evaluate(fn.z, this.varMap)
      );
      cache.push(vecValue);
    }
  }

  private lookupFunctionValueAt(t: number, arr: Array<Vector3>): Vector3 {
    if (arr === undefined)
      console.debug("I am called by", this.lookupFunctionValueAt.caller.name);
    const N = arr.length;
    if (N >= 2) {
      let sIndex = 0;
      while (sIndex < N && t > this._tValues[sIndex]) sIndex++;
      if (sIndex < N - 1) {
        // the amount of deviation from the ideal location
        const fraction =
          (t - this._tValues[sIndex]) /
          (this._tValues[sIndex + 1] - this._tValues[sIndex]);
        /* Use linear interpolation of two neighboring values in the array */

        // compute weighted average (1-f)*arr[k] + f*arr[k+1]
        this.tmpVector.set(0, 0, 0);
        this.tmpVector.addScaledVector(arr[sIndex], 1 - fraction);
        this.tmpVector.addScaledVector(arr[sIndex + 1], fraction);
      } else this.tmpVector.copy(arr[N - 1]);
    } else {
      console.error(
        `Attempt to evaluate function value at t=${t} for SEParametric ${this.id} with ${N} fn samples`
      );
      // throw new Error(`Attempt to evaluate function value at t=${t}`);
      this.tmpVector.set(0, 0, 0);
    }
    return this.tmpVector;
  }
  /**
   * The parameterization of the curve.
   * @param t the parameter
   * @returns vector containing the location
   */
  public P(t: number): Vector3 {
    return this.lookupFunctionValueAt(t, this.fnValues);
  }

  /**
   * The parameterization of the derivative of the curve
   * Note: This is *not* a unit parameterization
   * @param t the parameter
   */
  public PPrime(t: number): Vector3 {
    return this.lookupFunctionValueAt(t, this.fnPrimeValues);
  }

  /**
   * The parameterization of the derivative of the curve
   * Note: This is *not* a unit parameterization
   * @param t the parameter
   */
  public PPPrime(t: number): Vector3 {
    return this.lookupFunctionValueAt(t, this.fnPPrimeValues);
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
    const distance = this.tmpVector
      .subVectors(unitIdealVector, this.closestVector(unitIdealVector))
      .length();
    const isHit =
      distance <
      SETTINGS.parametric.hitIdealDistance / currentMagnificationFactor;
    return isHit;
  }

  public shallowUpdate(): void {
    // The measurement expressions parents must exist
    this._exists = this._seParentExpressions.every(exp => exp.exists);

    // find the tracing tMin and tMax
    const [tMin, tMax] = this.tMinMaxExpressionValues();
    // if the tMin/tMax values are out of order then parametric curve doesn't exist
    if (tMax <= tMin) {
      this._exists = false;
    }

    if (this._exists) {
      // TODO: when is it necessary to recreate the sample points?
      // console.debug("Recreating sample points");
      // this.createSamplingPoints();
      // const tSamples = this.createSamplingPoints();
      // this._tValues.splice(0);
      // this.fnValues.splice(0);
      // this._tValues.push(...tSamples.map(x => x.t));
      // this.fnValues.push(...tSamples.map(x => x.value));
      // this.calculateDerivatives(tSamples);
      this.ref?.updateDisplay();
    }

    if (this.showing && this._exists) {
      this.ref?.setVisible(true);
    } else {
      this.ref?.setVisible(false);
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
   * Return the vector on the SEParametric that is closest to the idealUnitSphereVector
   * @param idealUnitSphereVector A vector on the unit sphere
   */
  public closestVector(idealUnitSphereVector: Vector3): Vector3 {
    // console.debug(
    //   "Looking for closest point to parametric",
    //   this.id,
    //   "with",
    //   this.tValues.length,
    //   "sample points from",
    //   idealUnitSphereVector.toFixed(3)
    // );
    if (this._tValues.length > 0) {
      //first transform the idealUnitSphereVector from the target unit sphere to the unit sphere with the parametric (P(t)) in standard position
      const transformedToStandard = new Vector3();
      transformedToStandard.copy(idealUnitSphereVector);
      transformedToStandard.applyMatrix4(this.store.inverseTotalRotationMatrix);

      // find the tracing tMin and tMax
      // const [tMin, tMax] = this.tMinMaxExpressionValues();
      // It must be the case that tMax> tMin because in update we check to make sure -- if it is not true then this parametric doesn't exist

      const closestStandardVector = new Vector3();
      closestStandardVector.copy(
        SENodule.closestVectorParametrically(
          this.P.bind(this), // bind the this so that this in the this.P method is this.ref
          this.PPrime.bind(this), // bind the this so that this in the this.PPrime method is this
          transformedToStandard,
          this._tValues,
          this.PPPrime.bind(this) // bind the this so that this in the this.PPPrime method is this
        ).vector
      );
      // Finally transform the closest vector on the ellipse in standard position to the target unit sphere
      // console.debug(
      //   "Closest point to parametric",
      //   this.id,
      //   "at",
      //   closestStandardVector.toFixed(3)
      // );
      return closestStandardVector.applyMatrix4(
        this.tmpMatrix.copy(this.store.inverseTotalRotationMatrix).invert()
      );
    } else return idealUnitSphereVector;
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

    const mag = this.store.zoomMagnificationFactor;

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

  accept(v: Visitor): boolean {
    console.debug("SEParametric accepting visitor");
    return v.actionOnParametric(this);
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
    oldNormal: Vector3 // ignored for Ellipse and Circle and Parametric, but not other one-dimensional objects
    // useFullTInterval?: boolean // only used in the constructor when figuring out the maximum number of perpendiculars to a SEParametric
  ): Array<NormalVectorAndTValue> {
    const transformedToStandard = new Vector3();
    transformedToStandard.copy(sePointVector);
    transformedToStandard
      .applyMatrix4(this.store.inverseTotalRotationMatrix)
      .normalize();

    // find the tracing tMin and tMax
    // const [tMin, tMax] = useFullTInterval
    //   ? [this._tNumbersHardLimit.min, this._tNumbersHardLimit.max]
    //   : this.tMinMaxExpressionValues();

    // It must be the case that tMax> tMin because in update we check to make sure -- if it is not true then this parametric doesn't exist
    // console.log("normal search");
    let normalList: Array<NormalVectorAndTValue> = [];

    // TODO: Replace with a loop here
    normalList = this.partitionedTValues.flatMap(tVals =>
      SENodule.getNormalsToPerpendicularLinesThruParametrically(
        // this.ref.P.bind(this), // bind the this so that this in the this.P method is this
        this.PPrime.bind(this), // bind the this.ref so that this in the this.ref.PPrime method is this.ref
        transformedToStandard,
        tVals,
        [], // this._c1DiscontinuityParameterValues,
        this.PPPrime.bind(this) // bind the this.ref so that this in the this.ref.PPPrime method is this.ref
      )
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
    this.tmpMatrix.copy(this.store.inverseTotalRotationMatrix).invert();
    normalList.forEach((pair: NormalVectorAndTValue) => {
      pair.normal.applyMatrix4(this.tmpMatrix).normalize();
      this.tmpVector1.copy(this.P(pair.tVal));
      this.tmpVector1.applyMatrix4(this.tmpMatrix).normalize();
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
    zoomMagnificationFactor: number,
    useFullTInterval?: boolean // only used in the constructor when figuring out the maximum number of Tangents to a SEParametric
  ): Vector3[] {
    const transformedToStandard = new Vector3();
    transformedToStandard.copy(sePointVector);
    transformedToStandard
      .applyMatrix4(this.store.inverseTotalRotationMatrix)
      .normalize();
    // It must be the case that tMax> tMin because in update we check to make sure -- if it is not true then this parametric doesn't exist

    // find the tracing tMin and tMax
    const [tMin, tMax] = useFullTInterval
      ? [this._tNumbersHardLimit.min, this._tNumbersHardLimit.max]
      : this.tMinMaxExpressionValues();
    if (tMax < tMin) return [];

    // const avoidTValues: number[] = [];
    // avoidTValues.push(...this._c1DiscontinuityParameterValues);
    const normalList: Vector3[] = [];
    //If the vector is on the Parametric then there is at at least one tangent
    if (
      this.closestVector(sePointVector).angleTo(sePointVector) <
      0.01 / this.store.zoomMagnificationFactor
    ) {
      const coorespondingTVal = this.partitionedTValues
        .map(tVals =>
          SENodule.closestVectorParametrically(
            this.P.bind(this), // bind the this so that this in the this.E method is this
            this.PPrime.bind(this), // bind the this so that this in the this.E method is this
            transformedToStandard,
            tVals,
            this.PPPrime.bind(this) // bind the this so that this in the this.E method is this
          )
        )
        .reduce(
          (
            prev: ParametricVectorAndTValue,
            curr: ParametricVectorAndTValue
          ) => {
            // If we have several partitions, find the closest among all of them
            const d1 = prev.vector.distanceTo(transformedToStandard);
            const d2 = curr.vector.distanceTo(transformedToStandard);
            return d1 < d2 ? prev : curr;
          }
        ).tVal;
      const tangentVector = new Vector3();
      tangentVector.copy(this.PPrime(coorespondingTVal));
      tangentVector.applyMatrix4(this.store.inverseTotalRotationMatrix);
      tangentVector.cross(this.P(coorespondingTVal));
      // avoidTValues.push(coorespondingTVal);
      normalList.push(tangentVector.normalize());
    }

    if (normalList.length > 0)
      console.log("normals to tangent so far", normalList);

    const out = this.partitionedTValues.flatMap(tVals =>
      SENodule.getNormalsToTangentLinesThruParametrically(
        this.P.bind(this), // bind the this.ref so that this in the this.ref.P method is this.ref
        this.PPrime.bind(this), // bind the this.ref so that this in the this.ref.PPrime method is this.ref
        transformedToStandard,
        tVals,
        [],
        this.PPPrime.bind(this) // bind the this.ref so that this in the this.ref.PPPrime method is this.ref
      )
    );
    if (out.length > 0) {
      normalList.push(...out);
      console.log("normals to tangent updated", normalList);
    }

    const taggedList: Array<NormalVectorAndTValue> = normalList.map(
      (vec: Vector3) => {
        return {
          normal: vec,
          tVal: NaN
        };
      }
    );

    normalList.forEach((vec, ind) => {
      if (
        Math.abs(vec.dot(transformedToStandard)) >
        SETTINGS.tolerance / 1000
      ) {
        console.log(ind, "NOT through point");
      }
      if (vec.isZero(SETTINGS.tolerance / 1000)) {
        console.log(ind, " Vector is ZERO");
      }
    });

    // remove duplicates from the list
    // console.log("perpendiculars", normalList);
    this.removeDuplicateVectors(taggedList);

    if (normalList.length > 0) console.log("unique perpendicular", normalList);

    // if (uniqueNormals.length > this._maxNumberOfTangents) {
    //   console.debug(
    //     "The number of normal vectors is bigger than the number of normals counted in the constructor. (Ignore this if issued by constructor.)"
    //   );
    // }
    this.tmpMatrix.copy(this.store.inverseTotalRotationMatrix).invert();
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

  // Factor out specialized glowing setter from SENodule
  // to SEParametric to remove dependency from SENodule to Parametric
  set glowing(b: boolean) {
    // let ptr: Parametric | null = this.ref;
    if (b) this.ref?.glowingDisplay();
    // while (ptr !== null) {
    //   ptr.glowingDisplay();
    //   ptr = ptr.next;
    // }
    else this.ref?.normalDisplay();
    // while (ptr !== null) {
    //   ptr.normalDisplay();
    //   ptr = ptr.next;
    // }
  }
}
