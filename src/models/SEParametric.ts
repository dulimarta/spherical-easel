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
  NormalAndPerpendicularPoint,
  ObjectState,
  ParametricVectorAndTValue,
  NormalAndTangentPoint
} from "@/types";
import SETTINGS from "@/global-settings";
import { Labelable } from "@/types";
import {
  SELabel,
  SEParametricEndPoint,
  SEParametricTracePoint,
  SEExpression
} from "./internal";
import i18n from "@/i18n";
import Parametric from "@/plottables/Parametric";
// import { SEParametricEndPoint } from "./SEParametricEndPoint";
import {
  DEFAULT_PARAMETRIC_BACK_STYLE,
  DEFAULT_PARAMETRIC_FRONT_STYLE
} from "@/types/Styles";
import { ExpressionParser } from "@/expression/ExpressionParser";
// import { SEExpression } from "./SEExpression";
import { DisplayStyle } from "@/plottables/Nodule";
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
const { t } = i18n.global;

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
  private pOut = new Vector3();
  private pPrimeOut = new Vector3();
  private pPrime2Out = new Vector3();
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
  private _fnValues: Vector3[] = [];
  private _fnPrimeValues: Vector3[] = [];
  private _fnPPrimeValues: Vector3[] = [];
  private largestGap = 0; // largest gap between two successive sample points

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
    coordinateExpressions: { x: string; y: string; z: string },
    tExpressions: { min: string; max: string },
    tNumbers: { min: number; max: number } /* hard limit */,
    c1DiscontinuityParameterValues: number[],
    measurementParents: SEExpression[],
    isClosed = false
  ) {
    super();
    // console.debug("x(t)", coordinateExpressions.x);
    // console.debug("y(t)", coordinateExpressions.y);
    // console.debug("z(t)", coordinateExpressions.z);
    // console.debug("T-min", tExpressions.min, "with value", tNumbers.min);
    // console.debug(
    //   "T-max",
    //   tExpressions.max,
    //   "with value",
    //   tNumbers.max,
    //   "Closed?",
    //   isClosed
    // );
    this._isClosed = isClosed;
    this._c1DiscontinuityParameterValues.push(
      ...c1DiscontinuityParameterValues
    );
    this.ref = new Parametric(this.name, tNumbers.min, tNumbers.max, isClosed);
    this.ref.updateDisplay();
    this.ref.stylize(DisplayStyle.ApplyCurrentVariables);
    this.ref.adjustSize();
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
    this._seParentExpressions.forEach((m: SEExpression) => {
      this.varMap.set(m.name, m.value);
    });

    this.createSamplingPointsAndRecalculateFunctions();
    this.ref?.updateDisplay();

    // this.partitionedTValues.forEach((p, pos) => {
    //   console.debug(`Partition ${pos} has ${p.length} sample points`, p);
    // });
  }

  // Return the array of T-vals partitions.
  // A curve with no cusp points has only ONE partition
  get tRanges(): Array<Array<number>> {
    return this.partitionedTValues;
  }

  get fnValues(): Array<Vector3> {
    return this._fnValues;
  }

  get fnPrimeValues(): Array<Vector3> {
    return this._fnPrimeValues;
  }

  get fnPPrimeValues(): Array<Vector3> {
    return this._fnPPrimeValues;
  }

  get isClosedCurve(): boolean {
    return this._isClosed;
  }

  get largestSampleGap(): number {
    return this.largestGap;
  }

  /** Generate  sampling points based of "local curvatures"
   * when the ideal sphere is in its neutral (unrotated) position
   */
  private createSamplingPointsAndRecalculateFunctions(): void {
    console.debug("SEParametric: createSamplingPointsAnd......");
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
    // const rotationMat4 = this.tmpMatrix
    //   .copy(this.store.inverseTotalRotationMatrix)
    //   .invert();
    const N = 5; // initial number of sample points
    const [tMin, tMax] = this.tMinMaxExpressionValues();
    const RANGE = tMax - tMin;
    let vecValue: Vector3;
    const fnValues: Array<TSample> = [];
    // To initialize, place equally spaced (in time) sample points on the curve
    for (let i = 0; i < N; i++) {
      const tValue = tMin + (i * RANGE) / (N - 1);
      this.varMap.set("t", tValue);
      vecValue = new Vector3(
        ExpressionParser.evaluate(this.coordinateSyntaxTrees.x, this.varMap),
        ExpressionParser.evaluate(this.coordinateSyntaxTrees.y, this.varMap),
        ExpressionParser.evaluate(this.coordinateSyntaxTrees.z, this.varMap)
      );
      // vecValue.applyMatrix4(rotationMat4);
      // console.debug(`Seed At t=${tValue.toFixed(4)}`, vecValue.toFixed(4));
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
      const indexM = nextSample!.index;
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
      // fnValues[indexM1].value.applyMatrix4(rotationMat4);

      // The new sample point M2 is between or M1 and old right R
      fnValues.push({
        t: t2,
        left: indexM1,
        right: indexR,
        value: new Vector3(xRight, yRight, zRight) // .applyMatrix4(rotationMat4)
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
    this._tValues.splice(0);
    this._fnValues.splice(0);
    this._tValues.push(...fnValues.map(x => x.t));
    this._fnValues.push(...fnValues.map(x => x.value));
    // Determine the largest get  between two successive sample points
    this.largestGap = this._fnValues.reduce(
      (prevGap: number, currPoint: Vector3, pos: number, arr: Vector3[]) => {
        const nextGap =
          pos + 1 < arr.length ? currPoint.distanceTo(arr[pos + 1]) : 0;
        return prevGap < nextGap ? nextGap : prevGap;
      },
      0
    );

    // Create partitioned T-values based on cusp breakpoints
    const numDiscontinuity = this._c1DiscontinuityParameterValues.length;
    // console.debug("Creating a new parametric", this.name);

    // Create partitioned T-values from the T-values of the sample points
    if (numDiscontinuity === 0) {
      // Only a single range of T values
      // Partition-0: t0, t1, t2, ..., tN
      this.partitionedTValues.push(this._tValues);
    } else {
      // Multiple ranges of (partitioned) T values from Cusp points C1, C2, ..., Ck
      const breakPoints = this._c1DiscontinuityParameterValues.slice(0);
      // Take the smaller of the two upper bounds
      if (
        this._tNumbers.max >
        this._c1DiscontinuityParameterValues[numDiscontinuity - 1]
      )
        breakPoints.push(this._tNumbers.max);

      // Partition the T-values t0, t1, t2, ..., tN using
      // the cusp points C1, C2, C3, ..., Ck, tMax as delimiters

      // Partition-1: t0, t1, ..., ti  (all values <= C1)
      // Partition-2: ti+1, ..., tj (all values <= C2)
      // And so on
      // Partition-M: tm, tm+1, ... , tN (all values <= Ck or values <= tMax)
      let partIndex = 0;
      let sampleIndex = 0;
      for (const upperBound of breakPoints) {
        const tVals = [];
        while (
          sampleIndex < this._tValues.length &&
          this._tValues[sampleIndex] < upperBound
        ) {
          // Loop to create a single partition
          tVals.push(this._tValues[sampleIndex]);
          sampleIndex++;
        }
        partIndex++; // next partition
        if (tVals.length > 0)
          // skip empty partition
          this.partitionedTValues.push(tVals.slice(0));
      }
    }
    // We have to rebuild when either this call is the FIRST build
    // OR some variables have changed their value
    // console.debug("(Re)building function and its derivatives");
    // const fnValues: Vector3[] = [];
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
      this._tValues,
      this.primeCoordinateSyntaxTrees,
      this._fnPrimeValues
    );
    this.evaluateFunctionAndCache(
      this._tValues,
      this.primeX2CoordinateSyntaxTrees,
      this._fnPPrimeValues
    );
    this.ref.setRangeAndFunctions(
      this._tValues,
      this._fnValues,
      Math.max(this._tNumbersHardLimit.min, this.tNumbers.min),
      Math.min(this._tNumbersHardLimit.max, this.tNumbers.max)
    );
    this.ref.stylize(DisplayStyle.ApplyCurrentVariables);
    this.ref.adjustSize();
    this.varMap.delete("t");
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
    this.varMap.delete("t");
  }

  private lookupFunctionValueAt(
    t: number,
    arr: Array<Vector3>,
    result: Vector3
  ) {
    if (arr === undefined)
      console.debug("I am called by", this.lookupFunctionValueAt.caller.name);
    const N = arr.length;
    if (N >= 2) {
      let sIndex = 0;
      while (sIndex < N && t >= this._tValues[sIndex]) sIndex++;
      // We know t >= tVal[0] then after the while-loop sIndex >= 1
      sIndex--;
      if (0 <= sIndex && sIndex + 1 < N) {
        // the amount of deviation from the ideal location
        const fraction =
          (t - this._tValues[sIndex]) /
          (this._tValues[sIndex + 1] - this._tValues[sIndex]);
        // console.debug(
        //   `Interpolating between ${arr[sIndex].toFixed(4)} and ${arr[
        //     sIndex + 1
        //   ].toFixed(4)} with fraction ${fraction.toFixed(3)}`
        // );
        /* Use linear interpolation of two neighboring values in the array */

        // compute weighted average (1-f)*arr[k] + f*arr[k+1]
        result.set(0, 0, 0);
        result.addScaledVector(arr[sIndex], 1 - fraction);
        result.addScaledVector(arr[sIndex + 1], fraction);
      } else if (sIndex < 0) result.copy(arr[0]);
      else result.copy(arr[N - 1]);
    } else {
      console.error(
        `Attempt to evaluate function value at t=${t} for SEParametric ${this.id} with ${N} fn samples`
      );
      // throw new Error(`Attempt to evaluate function value at t=${t}`);
      // result.set(0, 0, 0);
    }
    return this.tmpVector;
  }
  /**
   * The parameterization of the curve.
   * @param t the parameter
   * @returns vector containing the location
   */
  public P(t: number): Vector3 {
    // Interpolated position must be on the sphere, so we have to call normalize()
    this.lookupFunctionValueAt(t, this._fnValues, this.pOut).normalize();
    return this.pOut;
  }

  /**
   * The parameterization of the derivative of the curve
   * Note: This is *not* a unit parameterization
   * @param t the parameter
   */
  public PPrime(t: number): Vector3 {
    this.lookupFunctionValueAt(t, this._fnPrimeValues, this.pPrimeOut);
    return this.pPrimeOut;
  }

  /**
   * The parameterization of the derivative of the curve
   * Note: This is *not* a unit parameterization
   * @param t the parameter
   */
  public PPPrime(t: number): Vector3 {
    this.lookupFunctionValueAt(t, this._fnPPrimeValues, this.pPrime2Out);
    return this.pPrime2Out;
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
      console.debug(`Measurement ${m.name} with value ${m.value}`);
      this.varMap.set(m.name, m.value);
    });
    let tMin = ExpressionParser.evaluate(this.tSyntaxTrees.min, this.varMap);
    let tMax = ExpressionParser.evaluate(this.tSyntaxTrees.max, this.varMap);
    console.debug(
      `T-min: current=${tMin} hard limit=${this._tNumbersHardLimit.min}`
    );
    console.debug(
      `T-max: current=${tMax} hard limit=${this._tNumbersHardLimit.max}`
    );
    // restrict to the parameter interval of tNumber.min to tNumber.max
    tMin = Math.max(tMin, this._tNumbersHardLimit.min);
    tMax = Math.min(tMax, this._tNumbersHardLimit.max);
    console.debug(`Effective T-range [${tMin},${tMax}]`);

    return [tMin, tMax];
  }

  customStyles(): Set<string> {
    return styleSet;
  }

  public get noduleDescription(): string {
    return String(
      i18n.global.t(`objectTree.parametricDescription`, {
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
    const closestPoint = this.closestVector(unitIdealVector);
    const distance = closestPoint.distanceTo(unitIdealVector);
    // console.debug(
    //   `Closest hit from ${unitIdealVector.toFixed(4)} is at`,
    //   closestPoint.toFixed(4),
    //   "with distance",
    //   distance
    // );
    return (
      distance <
      SETTINGS.parametric.hitIdealDistance / currentMagnificationFactor
    );
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
      // TODO: check if measurement parents are updated
      this._seParentExpressions.forEach((m: SEExpression) => {
        this.varMap.set(m.name, m.value);
      });
      let updatedCount = 0;
      for (const [key, val] of this.varMap) {
        const prevValue = this.prevVarMap.get(key);
        // console.debug(
        //   `Measurement ${key} old value ${prevValue} new value ${val}`
        // );
        if (!prevValue || Math.abs(val - prevValue) > 1e-6) {
          updatedCount++;
          this.prevVarMap.set(key, val);
        }
      }
      if (updatedCount === 0) {
        console.debug("No rebuild of function and its derivatives required");
        return;
      }
      if (updatedCount > 0) {
        console.debug("Recreating sample points due to measurement changes");
        this.createSamplingPointsAndRecalculateFunctions();
      }
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
    let closestIndex = 0;
    let minDistance = Number.MAX_VALUE;
    this.fnValues.forEach((p: Vector3, tIndex: number) => {
      const distance = idealUnitSphereVector.distanceTo(p);

      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = tIndex;
      }
    });
    // console.debug(
    //   `Closed sample point `,
    //   this.fnValues[closestIndex].toFixed(3),
    //   `with distance ${minDistance.toFixed(4)}`
    // );

    // So far we identify the closest SAMPLE point (M)
    // Can we improve by looking for a TRUE point in between two successive sample points?
    // Given C is the cursor point
    // L is left neighbor of M and R is the right neighbor of M
    // Use vectors MC, ML, MR to improve closest point
    const N = this._tValues.length;

    // First construct vector MC
    const toCursor = this.tmpVector1
      .copy(idealUnitSphereVector)
      .sub(this.fnValues[closestIndex]);
    let nextIndex: number | undefined = undefined;
    let prevIndex: number | undefined = undefined;
    if (this._isClosed) {
      // Is it closer to the next neighbor?
      nextIndex = (closestIndex + 1) % N;
      prevIndex = (closestIndex - 1 + N) % N;
    } else {
      if (closestIndex + 1 < N) nextIndex = closestIndex + 1;
      if (closestIndex > 0) prevIndex = closestIndex - 1;
    }
    let fraction: number;
    let closestPoint: Vector3;
    // Check between this one and the next sample point
    if (nextIndex) {
      // Construct vector MR
      const toNext = this.tmpVector2
        .copy(this.fnValues[nextIndex])
        .sub(this.fnValues[closestIndex]);
      // Compute the dot product (MC, MR)
      const nextDot = toCursor.dot(toNext);
      if (nextDot >= 0) {
        // acute angle between MC and MR implies the true closest point is between M and R.
        // Project MC to MR and calculate the percentage of its length w.r.t MR
        fraction = nextDot / toNext.lengthSq();
        const tClosest =
          (1 - fraction) * this._tValues[closestIndex] +
          fraction * this._tValues[nextIndex];
        return this.P(tClosest);
      }
    }

    // Check between this one and the previous sample point
    if (prevIndex) {
      // Or is it closer to the previous neighbor?
      // Construct vector ML
      const toPrev = this.tmpVector2
        .copy(this.fnValues[prevIndex])
        .sub(this.fnValues[closestIndex]);
      // Compute the dot product (MC, ML)
      const prevDot = toCursor.dot(toPrev);
      if (prevDot > 0) {
        // acute angle between MC and ML implies the true closest point is between M and L.
        // Project MC to ML and calculate the percentage of its length w.r.t to ML
        fraction = prevDot / toPrev.lengthSq();
        const tClosest =
          (1 - fraction) * this._tValues[closestIndex] +
          fraction * this._tValues[prevIndex];
        return this.P(tClosest);
      }
    }
    return this.fnValues[closestIndex];
  }
  /**
   * Return the vector near the SEParametric (within SETTINGS.parametric.maxLabelDistance) that is closest to the idealUnitSphereVector
   * @param idealUnitSphereVector A vector on the unit sphere
   */
  public closestLabelLocationVector(idealUnitSphereVector: Vector3): Vector3 {
    // First find the closest point on the parametric to the idealUnitSphereVector
    const closest = new Vector3();
    closest.copy(this.closestVector(idealUnitSphereVector));
    // The current magnification level

    const mag = SENodule.store.zoomMagnificationFactor;

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
    return v.actionOnParametric(this);
  }

  private removeDuplicateVectors(
    arr: Array<NormalAndPerpendicularPoint>
  ): void {
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
   * @param sePointVector A point on the line normal to this parametric
   */
  public getNormalsToPerpendicularLinesThru(
    sePointVector: Vector3,
    oldNormal: Vector3 // ignored for Ellipse and Circle and Parametric, but not other one-dimensional objects
    // useFullTInterval?: boolean // only used in the constructor when figuring out the maximum number of perpendiculars to a SEParametric
  ): Array<NormalAndPerpendicularPoint> {
    // find the tracing tMin and tMax
    // const [tMin, tMax] = useFullTInterval
    //   ? [this._tNumbersHardLimit.min, this._tNumbersHardLimit.max]
    //   : this.tMinMaxExpressionValues();

    // It must be the case that tMax> tMin because in update we check to make sure -- if it is not true then this parametric doesn't exist
    let normalList: Array<NormalAndPerpendicularPoint> = [];

    normalList = this.partitionedTValues.flatMap(tVals =>
      SENodule.getNormalsToPerpendicularLinesThruParametrically(
        this.P.bind(this), // bind the this so that this in the this.P method is this
        this.PPrime.bind(this), // bind the this.ref so that this in the this.ref.PPrime method is this.ref
        sePointVector,
        tVals,
        this.PPPrime.bind(this) // bind the this.ref so that this in the this.ref.PPPrime method is this.ref
      )
    );

    // console.log("# normals before", normalList.length);
    // normalList.forEach((n: Vector3, k: number) => {
    //   console.debug(`Normal-${k}`, n.toFixed(3));
    // });

    // remove duplicates from the list
    this.removeDuplicateVectors(normalList);
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
  ): NormalAndTangentPoint[] {
    // It must be the case that tMax> tMin because in update we check to make sure -- if it is not true then this parametric doesn't exist

    // find the tracing tMin and tMax
    const [tMin, tMax] = useFullTInterval
      ? [this._tNumbersHardLimit.min, this._tNumbersHardLimit.max]
      : this.tMinMaxExpressionValues();
    if (tMax < tMin) return [];

    const normalList: NormalAndTangentPoint[] = [];
    //If the vector is on the Parametric then there is at at least one tangent
    if (
      this.closestVector(sePointVector).angleTo(sePointVector) <
      0.01 / SENodule.store.zoomMagnificationFactor
    ) {
      const correspondingTVal = this.partitionedTValues
        .map(tVals =>
          SENodule.closestVectorParametrically(
            this.P.bind(this), // bind the this so that this in the this.E method is this
            this.PPrime.bind(this), // bind the this so that this in the this.E method is this
            sePointVector,
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
            const d1 = prev.vector.distanceTo(sePointVector);
            const d2 = curr.vector.distanceTo(sePointVector);
            return d1 < d2 ? prev : curr;
          }
        ).tVal;
      const tangentVector = new Vector3();
      tangentVector.copy(this.PPrime(correspondingTVal));
      // tangentVector.applyMatrix4(this.store.inverseTotalRotationMatrix);
      tangentVector.cross(this.P(correspondingTVal));
      // avoidTValues.push(coorespondingTVal);
      normalList.push({
        normal: tangentVector.normalize(),
        tangentAt: this.PPrime(correspondingTVal)
      });
    }

    if (normalList.length > 0)
      console.log("normals to tangent so far", normalList);

    const out = this.partitionedTValues
      .flatMap(tVals =>
        SENodule.getNormalsToTangentLinesThruParametrically(
          this.P.bind(this), // bind the this.ref so that this in the this.ref.P method is this.ref
          this.PPrime.bind(this), // bind the this.ref so that this in the this.ref.PPrime method is this.ref
          sePointVector,
          tVals,
          this.PPPrime.bind(this) // bind the this.ref so that this in the this.ref.PPPrime method is this.ref
        )
      )
      .filter(
        (pair: NormalAndTangentPoint) =>
          !pair.normal.isZero(SETTINGS.tolerance / 1000)
      );
    if (out.length > 0) {
      normalList.push(...out);
      console.log("normals to tangent updated", normalList);
    }

    normalList.forEach((vec, ind) => {
      if (Math.abs(vec.normal.dot(sePointVector)) > SETTINGS.tolerance / 1000) {
        console.log(ind, "NOT through point");
      }
    });

    if (normalList.length > 0) console.log("unique perpendicular", normalList);
    return normalList;
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

  public getLabel(): SELabel | null {
    return (this as Labelable).label!;
  }
}
