/** @format */

import { Vector3, Matrix4 } from "three";
import Two from "two.js";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";
import {
  StyleOptions,
  StyleEditPanels,
  DEFAULT_PARAMETRIC_FRONT_STYLE,
  DEFAULT_PARAMETRIC_BACK_STYLE
} from "@/types/Styles";
import { SEStore } from "@/store";

// const desiredXAxis = new Vector3();
// const desiredYAxis = new Vector3();
// const desiredZAxis = new Vector3();
// // const Z_AXIS = new Vector3(0, 0, 1);
const transformMatrix = new Matrix4(); // maps from the un-rotated sphere to the rotated one
const SUBDIVISIONS = SETTINGS.parametric.numPoints;

// WARNING: We can't use one "ptr" declared globally
// Some functions may call each other, hence overriding the current
// value used across them
//let ptr: Parametric | null = null;

/**
 * For drawing surface Parametric. A Parametric consists of two paths (front and back)
 * for a total of 2N subdivisions.
 * We initially assign the same number of segments/subdivisions to each path,
 * but as the Parametric is being deformed the number of subdivisions on each path
 * may change: longer path will hold more subdivision points (while keeping the
 * total points 2N so we don't create/remove new points)
 */
export default class Parametric extends Nodule {
  public partId = 0; // just for debugging
  /**
   * The vector P(t) for tMin <= t <= tMax P(t)= parameterization traces out the curve
   * And the vector P'(t) = parameterizationPrime of the curve.
   */
  private _closed: boolean; // true if P(tNumber.min)=P(tNumber.max)

  /**
   * When an SEParametric consists of multiple Parametric, organize
   * them into a linked list
   */
  public next: Parametric | null = null;

  /**
   * The arcLength of the parametric curve from tNumber.min to tNumber.Max
   */
  // private _initialArcLength: number;
  // private _arcLengthValues: Array<number> = [];
  private numAnchors = 0;
  private _coordValues: Array<Vector3> = [];
  private _pPrimeValues: Array<Vector3> = [];
  private _ppPrimeValues: Array<Vector3> = [];

  // tGlobalMin <= tPartMin < tPartMax <= tGlobalMax
  private tGlobalMin = 0;
  private tGlobalMax = 1;
  private tPartMin = 0;
  private tPartMax = 1;

  /**
   * The TwoJS objects to display the front/back parts and their glowing counterparts.
   */
  private frontParts: Two.Path[] = [];
  private backParts: Two.Path[] = [];
  private glowingFrontParts: Two.Path[] = [];
  private glowingBackParts: Two.Path[] = [];

  private pool: Two.Anchor[] = []; //The pool of vertices
  private glowingPool: Two.Anchor[] = []; //The pool of vertices
  /**
   * The styling variables for the drawn curve. The user can modify these.
   */
  // Front
  private glowingStrokeColorFront =
    SETTINGS.parametric.glowing.strokeColor.front;
  // Back -- use the default non-dynamic back style options so that when the user disables the dynamic back style these options are displayed
  private glowingStrokeColorBack = SETTINGS.parametric.glowing.strokeColor.back;

  /** Initialize the current line width that is adjust by the zoom level and the user widthPercent */
  static currentParametricStrokeWidthFront =
    SETTINGS.parametric.drawn.strokeWidth.front;
  static currentParametricStrokeWidthBack =
    SETTINGS.parametric.drawn.strokeWidth.back;
  static currentGlowingParametricStrokeWidthFront =
    SETTINGS.parametric.drawn.strokeWidth.front +
    SETTINGS.parametric.glowing.edgeWidth;
  static currentGlowingParametricStrokeWidthBack =
    SETTINGS.parametric.drawn.strokeWidth.back +
    SETTINGS.parametric.glowing.edgeWidth;
  foregroundLayer: Two.Group | null = null;
  backgroundLayer: Two.Group | null = null;
  glowingFgLayer: Two.Group | null = null;
  glowingBgLayer: Two.Group | null = null;

  /**
   * Update all the current stroke widths
   * @param factor The ratio of the current magnification factor over the old magnification factor
   */
  static updateCurrentStrokeWidthForZoom(factor: number): void {
    Parametric.currentParametricStrokeWidthFront *= factor;
    Parametric.currentParametricStrokeWidthBack *= factor;
    Parametric.currentGlowingParametricStrokeWidthFront *= factor;
    Parametric.currentGlowingParametricStrokeWidthBack *= factor;
  }

  /**
   * For temporary calculation with ThreeJS objects
   */
  private tmpVector = new Vector3();
  private tmpVector1 = new Vector3();
  private tmpMatrix = new Matrix4();

  constructor(
    tGlobalMin = 0,
    tGlobalMax = 1,
    tPartMin = 0,
    tPartMax = 1,
    closed = false
  ) {
    super();
    this.tGlobalMin = tGlobalMin;
    this.tGlobalMax = tGlobalMax;
    this.tPartMin = tPartMin;
    this.tPartMax = tPartMax;

    this._closed = closed;

    this.styleOptions.set(
      StyleEditPanels.Front,
      DEFAULT_PARAMETRIC_FRONT_STYLE
    );
    this.styleOptions.set(StyleEditPanels.Back, DEFAULT_PARAMETRIC_BACK_STYLE);
  }

  public setRangeAndFunctions(
    fn: Vector3[],
    fnPrime: Vector3[],
    fnDoublePrime: Vector3[],
    tMinGlobal: number,
    tMaxGlobal: number,
    tMinPart: number,
    tMaxPart: number
  ): void {
    // console.debug(
    //   `Parametric::setRangeAndFunctions part-${this.partId}`,
    //   tMinPart,
    //   tMaxPart
    // );
    this.tGlobalMin = tMinGlobal;
    this.tGlobalMax = tMaxGlobal;
    this.tPartMin = tMinPart;
    this.tPartMax = tMaxPart;
    this._coordValues.splice(0);
    this._coordValues.push(...fn);
    this._pPrimeValues.splice(0);
    this._pPrimeValues.push(...fnPrime);
    this._ppPrimeValues.splice(0);
    this._ppPrimeValues.push(...fnDoublePrime);
    this.buildCurve();
  }

  private buildCurve() {
    this.numAnchors = this.determineAnchorsFromArcLength();
    console.debug("Use", this.numAnchors, "anchor points");
    if (this.frontParts.length === 0) {
      // console.debug(
      //   `Parametric::buildCurve() new build of part-${this.partId} with number of anchors`,
      //   this.numAnchors
      // );
      // This is a new build
      const frontVertices: Two.Vector[] = [];
      for (let k = 0; k < this.numAnchors; k++) {
        // Create Two.Vectors for the paths that will be cloned later
        frontVertices.push(new Two.Vector(0, 0));
      }
      this.frontParts.push(
        new Two.Path(frontVertices, /*closed*/ false, /*curve*/ false)
      );
      this.glowingFrontParts.push(this.frontParts[0].clone());
      // Don't use .clone() for back parts we intentionally want to keep them empty
      this.backParts.push(new Two.Path([], false, false));
      this.glowingBackParts.push(new Two.Path([], false, false));

      // #region updatePlottableMap
      Nodule.idPlottableDescriptionMap.set(String(this.frontParts[0].id), {
        type: "parametric",
        side: "front",
        fill: false,
        part: "0"
      });
      Nodule.idPlottableDescriptionMap.set(String(this.backParts[0].id), {
        type: "parametric",
        side: "back",
        fill: false,
        part: "0"
      });
      // #endregion updatePlottableMap

      // Set the styles that are always true
      // The front/back parts have no fill because that is handled by the front/back fill
      // The front/back fill have no stroke because that is handled by the front/back part
      this.frontParts[0].noFill();
      this.backParts[0].noFill();
      this.glowingFrontParts[0].noFill();
      this.glowingBackParts[0].noFill();

      //Turn off the glowing display initially but leave it on so that the temporary objects show up
      this.frontParts[0].visible = true;
      this.backParts[0].visible = true;
      this.glowingBackParts[0].visible = false;
      this.glowingFrontParts[0].visible = false;
    } else {
      console.debug(
        `Parametric::buildCurve(). a rebuild of part-${this.partId} with number of anchors`,
        this.numAnchors
      );
      // This is a rebuild, check if the number of anchors has changed
      const frontVertexCount = this.frontParts
        .map((p: Two.Path) => p.vertices.length)
        .reduce((total: number, currLen: number) => total + currLen);
      const backVertexCount = this.backParts
        .map((p: Two.Path) => p.vertices.length)
        .reduce((total: number, currLen: number) => total + currLen);
      const delta = this.numAnchors - (frontVertexCount + backVertexCount);
      if (delta > 0) {
        console.debug("*** Adding", delta, "more anchor points!!!");
        // We have to add more anchor points
        let anchor: Two.Anchor;
        // Clone from an existing Two.Anchor (either from frontPart or backPart)
        if (this.frontParts[0].vertices.length > 0)
          anchor = this.frontParts[0].vertices[0].clone();
        else anchor = this.backParts[0].vertices[0].clone();
        for (let m = 0; m < delta - 1; m++) {
          this.frontParts[0].vertices.push(anchor.clone());
          this.glowingFrontParts[0].vertices.push(anchor.clone());
        }
        this.frontParts[0].vertices.push(anchor.clone());
        this.glowingFrontParts[0].vertices.push(anchor); // no .clone on the last one
      } else if (delta < 0) {
        console.debug("The curve needs fewer anchor points");
      }
    }
    this.stylize(DisplayStyle.ApplyCurrentVariables);
    this.adjustSize();
  }

  private lookupFunctionValueAt(t: number, arr: Array<Vector3>): Vector3 {
    const N = arr.length;
    if (N > 0) {
      const range = this.tGlobalMax - this.tGlobalMin;
      // Convert t in [tMin, tMax] to s in [0,1]
      const s = (t - this.tGlobalMin) / range;
      const idealIndex = s * N; // Where ideal location in the array
      const sIndex = Math.floor(idealIndex); // the discretized location in the array
      if (sIndex < N - 1) {
        /* Use linear interpolation of two neighboring values in the array */
        const fraction = idealIndex - sIndex; // the amount of deviation from the ideal location

        // compute weighted average (1-f)*arr[k] + f*arr[k+1]
        this.tmpVector.set(0, 0, 0);
        this.tmpVector.addScaledVector(arr[sIndex], 1 - fraction);
        this.tmpVector.addScaledVector(arr[sIndex + 1], fraction);
      } else this.tmpVector.copy(arr[N - 1]);
      return this.tmpVector;
    } else throw new Error(`Attempt to evaluate function value at t=${t}`);
  }
  /**
   * The parameterization of the curve.
   * @param t the parameter
   * @returns vector containing the location
   */
  public P(t: number): Vector3 {
    return this.lookupFunctionValueAt(t, this._coordValues);
  }

  /**
   * The parameterization of the derivative of the curve
   * Note: This is *not* a unit parameterization
   * @param t the parameter
   */
  public PPrime(t: number): Vector3 {
    return this.lookupFunctionValueAt(t, this._pPrimeValues);
  }

  /**
   * The parameterization of the derivative of the curve
   * Note: This is *not* a unit parameterization
   * @param t the parameter
   */
  public PPPrime(t: number): Vector3 {
    return this.lookupFunctionValueAt(t, this._ppPrimeValues);
  }

  /**
   * Pre-compute arc length and store the cumulative values in an array
   */
  private determineAnchorsFromArcLength(): number {
    // console.debug(
    //   `Parametric::determineAnchor() part-${this.partId}`,
    //   this.tPartMin,
    //   this.tPartMax
    // );
    // const tMin = this._tNumbers.min;
    // const tMax = this._tNumbers.max;
    // let oldArcLength = 0;
    let newArcLength = 0;
    let currArcLength = 0;
    let iteration = 1;
    let interAnchorDistance = 0;
    const curr = new Vector3();
    const next = new Vector3();
    do {
      newArcLength = 0;
      // replace with Simpson's rule? some adaptive algorithm? PPrime is possibly undefined at certain values
      const tRange = this.tPartMax - this.tPartMin;

      // Approximate the length using inter sample distance
      curr.copy(this.P(this.tPartMin));
      for (let i = 0; i < SUBDIVISIONS * iteration; i++) {
        const tValue =
          this.tPartMin + ((i + 0.5) / (SUBDIVISIONS * iteration)) * tRange;
        const len = next
          .copy(this.P(tValue))
          .sub(curr)
          .length();

        if (!isNaN(len)) {
          newArcLength += len;
        }
        curr.copy(this.P(tValue));
      }
      interAnchorDistance = newArcLength / (SUBDIVISIONS * iteration);
      const growth = (newArcLength - currArcLength) / newArcLength;
      // console.debug(
      //   `Iteration-${iteration} length changed from ${currArcLength.toFixed(
      //     5
      //   )} to ${newArcLength.toFixed(5)}.` + `Growth = ${growth.toFixed(5)}`,
      //   "inter anchor distance",
      //   interAnchorDistance.toFixed(5)
      // );
      // When the arc length increase is no longer "significant"
      // we assume that the curve subdivision is good enough
      if (growth < SETTINGS.parameterization.maxChangeInArcLength) {
        return iteration * SUBDIVISIONS;
      } else {
        currArcLength = newArcLength;
      }
      iteration++;
    } while (
      iteration < SETTINGS.parameterization.maxNumberOfIterationArcLength
    );
    // this._initialArcLength = newArcLength;
    return iteration * SUBDIVISIONS;
  }

  /**
   * The Parametric curve is given in on the unit sphere, which might have been rotated, so we always transform from the un-rotated
   * sphere to the rotated one and then project the points to 2D (assigning to front/back depending on the sign of the z coordinate)
   * This method updates the TwoJS objects (frontPart,  ...) for display
   */
  public updateDisplay(): void {
    // console.debug(`Parametric::updateDisplay part-${this.partId}`);
    // Create a matrix4 in the three.js package (called transformMatrix) that maps the unrotated parametric curve to
    // the one in the target desired (updated) position (i.e. the target parametric).

    // The target Parametric (on the sphere of radius SETTINGS.boundaryCircle.radius) is rotated version of the
    // original Parametric (which is on the un-rotated unit sphere)
    // so scale XYZ space
    // this will make the original Parametric (in un-rotated position on the sphere) finally coincide with the target Parametric
    transformMatrix.getInverse(SEStore.inverseTotalRotationMatrix);
    this.tmpMatrix.makeScale(
      SETTINGS.boundaryCircle.radius,
      SETTINGS.boundaryCircle.radius,
      SETTINGS.boundaryCircle.radius
    );
    transformMatrix.multiply(this.tmpMatrix);
    // console.log(transformMatrix);
    // transformMatrix now maps the un-rotated parametric to the target parametric

    // Recalculate the 3D coordinates of the Parametric and record the projection in the TwoJS paths

    // Bring all the anchor points to a common pool
    // Each front/back  path will pull anchor points from
    // this pool as needed
    // find the tracing tMin and tMax
    // const [tMin, tMax] = this.tMinMaxExpressionValues();

    // if the tMin/tMax values are out of order plot nothing (the object doesn't exist)
    if (this.tPartMax <= this.tPartMin) return;
    // const tMin = this._tNumbers.min;
    // const tMax = this._tNumbers.max;

    /* Move all vertices back to pool */
    this.frontParts.forEach((path: Two.Path) => {
      this.pool.push(...path.vertices.splice(0));
    });
    this.backParts.forEach((path: Two.Path) => {
      this.pool.push(...path.vertices.splice(0));
    });
    this.glowingFrontParts.forEach((path: Two.Path) => {
      this.glowingPool.push(...path.vertices.splice(0));
    });
    this.glowingBackParts.forEach((path: Two.Path) => {
      this.glowingPool.push(...path.vertices.splice(0));
    });

    let lastPositiveIndex = -1;
    let lastNegativeIndex = -1;

    let currentFrontPartIndex = 0;
    let currentBackPartIndex = 0;

    let firstBackPart = true;
    let firstFrontPart = true;

    const tRange = this.tPartMax - this.tPartMin;
    for (let index = 0; index < this.numAnchors; index++) {
      // The t value
      const tVal = this.tPartMin + (index / (this.numAnchors - 1)) * tRange;

      // P(tval) is the location on the unit sphere of the Parametric in un-rotated position
      this.tmpVector.copy(this.P(tVal));
      // Set tmpVector equal to location on the target Parametric in rotated position
      this.tmpVector.applyMatrix4(transformMatrix);

      // When the Z-coordinate is negative, the vertex belongs the
      // the back side of the sphere
      if (this.tmpVector.z < 0) {
        // Move to the next back part if necessary
        if (lastNegativeIndex !== index - 1 && !firstBackPart) {
          currentBackPartIndex++;
          // console.log(
          //   "c back part ind",
          //   currentBackPartIndex,
          //   this.backParts.length
          // );
          if (currentBackPartIndex >= this.backParts.length) {
            console.info(
              "Parametric update: Needs more back parts than were allocated initially"
            );
            const newPath = new Two.Path([], false, false);
            this.backParts.push(newPath);
            newPath.noFill();
            newPath.visible = true;
            if (this.backgroundLayer) newPath.addTo(this.backgroundLayer);

            const newGlowPath = new Two.Path([], false, false);
            this.glowingBackParts.push(newGlowPath);
            newGlowPath.noFill();
            newGlowPath.visible = false;
            if (this.glowingBgLayer) newGlowPath.addTo(this.glowingBgLayer);

            Nodule.idPlottableDescriptionMap.set(
              String(this.backParts[currentBackPartIndex - 1].id),
              {
                type: "parametric",
                side: "back",
                fill: false,
                part: currentBackPartIndex.toString()
              }
            );
            this.stylize(DisplayStyle.ApplyCurrentVariables);
            this.adjustSize();
          }
        }
        firstBackPart = false;
        lastNegativeIndex = index;

        const vertex = this.pool.pop();
        if (vertex !== undefined) {
          vertex.x = this.tmpVector.x;
          vertex.y = this.tmpVector.y;
          this.backParts[currentBackPartIndex].vertices.push(vertex);
        }
        const glowingVertex = this.glowingPool.pop();
        if (glowingVertex !== undefined) {
          glowingVertex.x = this.tmpVector.x;
          glowingVertex.y = this.tmpVector.y;
          this.glowingBackParts[currentBackPartIndex].vertices.push(
            glowingVertex
          );
        }
      } else {
        // Move to the next front part if necessary
        if (lastPositiveIndex !== index - 1 && !firstFrontPart) {
          currentFrontPartIndex++;
          // console.log(
          //   "c front part ind",
          //   currentBackPartIndex,
          //   this.backParts.length
          // );
          if (currentFrontPartIndex >= this.frontParts.length) {
            console.info(
              "Parametric Update: Needs more front parts than were allocated initially"
            );
            const newPath = new Two.Path([], false, false);
            this.frontParts.push(newPath);
            newPath.noFill();
            newPath.visible = true;
            if (this.foregroundLayer) newPath.addTo(this.foregroundLayer);

            const newGlowPath = new Two.Path([], false, false);
            this.glowingFrontParts.push(newGlowPath);
            newGlowPath.noFill();
            newGlowPath.visible = true;
            if (this.glowingFgLayer) newGlowPath.addTo(this.glowingFgLayer);

            Nodule.idPlottableDescriptionMap.set(
              String(this.frontParts[currentFrontPartIndex - 1].id),
              {
                type: "parametric",
                side: "front",
                fill: false,
                part: currentFrontPartIndex.toString()
              }
            );
            this.stylize(DisplayStyle.ApplyCurrentVariables);
            this.adjustSize();
          }
        }
        firstFrontPart = false;
        lastPositiveIndex = index;

        const vertex = this.pool.pop();
        if (vertex !== undefined) {
          vertex.x = this.tmpVector.x;
          vertex.y = this.tmpVector.y;
          this.frontParts[currentFrontPartIndex].vertices.push(vertex);
        }
        const glowingVertex = this.glowingPool.pop();
        if (glowingVertex !== undefined) {
          glowingVertex.x = this.tmpVector.x;
          glowingVertex.y = this.tmpVector.y;
          this.glowingFrontParts[currentFrontPartIndex].vertices.push(
            glowingVertex
          );
        }
      }
    }
  }

  /**
   * Get the parameters for the curve
   */
  get closed(): boolean {
    return this._closed;
  }
  // get coordinateExpressions(): CoordExpression {
  //   return this._coordinateExpressions;
  // }
  // get c1DiscontinuityParameterValues(): number[] {
  //   return this._c1DiscontinuityParameterValues;
  // }
  // get tExpressions(): MinMaxExpression {
  //   return this._tExpressions;
  // }
  // get tNumbers(): MinMaxNumber {
  //   return this._tNumbers;
  // }
  // get seParentExpressions(): SEExpression[] {
  //   return this._seParentExpressions;
  // }
  get numberOfParts(): number {
    return (
      this.frontParts.filter((p: Two.Path) => p.vertices.length > 0).length +
      this.backParts.filter((p: Two.Path) => p.vertices.length > 0).length
    );
  }

  public endPointVector(minMax: boolean): Vector3 | undefined {
    transformMatrix.getInverse(SEStore.inverseTotalRotationMatrix);
    this.tmpMatrix.makeScale(
      SETTINGS.boundaryCircle.radius,
      SETTINGS.boundaryCircle.radius,
      SETTINGS.boundaryCircle.radius
    );
    transformMatrix.multiply(this.tmpMatrix);

    // find the tracing tMin and tMax
    // const [tMin, tMax] = this.tMinMaxExpressionValues() ?? [
    //   this._tNumbers.min,
    //   this._tNumbers.max
    // ];

    // if the tMin/tMax values are out of order plot nothing (the object doesn't exist)
    if (this.tGlobalMax <= this.tGlobalMin) return undefined;

    let tVal: number;
    if (minMax) {
      tVal = this.tGlobalMin;
    } else {
      tVal = this.tGlobalMax;
    }
    // P(tval) is the location on the unit sphere of the Parametric in un-rotated position
    this.tmpVector.copy(this.P(tVal));
    // Set tmpVector equal to location on the target Parametric in rotated position
    return this.tmpVector.applyMatrix4(transformMatrix);
  }

  frontGlowingDisplay(): void {
    this.frontParts.forEach(part => (part.visible = true));
    this.glowingFrontParts.forEach(part => (part.visible = true));
  }
  backGlowingDisplay(): void {
    this.backParts.forEach(part => (part.visible = true));
    this.glowingBackParts.forEach(part => (part.visible = true));
  }
  glowingDisplay(): void {
    this.frontGlowingDisplay();
    this.backGlowingDisplay();
  }

  frontNormalDisplay(): void {
    this.frontParts.forEach(part => (part.visible = true));
    this.glowingFrontParts.forEach(part => (part.visible = false));
  }
  backNormalDisplay(): void {
    this.backParts.forEach(part => (part.visible = true));
    this.glowingBackParts.forEach(part => (part.visible = false));
  }
  normalDisplay(): void {
    this.frontNormalDisplay();
    this.backNormalDisplay();
  }

  public setVisible(flag: boolean): void {
    if (!flag) {
      this.frontParts.forEach(part => (part.visible = false));
      this.backParts.forEach(part => (part.visible = false));

      this.glowingBackParts.forEach(part => (part.visible = false));
      this.glowingFrontParts.forEach(part => (part.visible = false));
    } else {
      this.normalDisplay();
    }
  }

  setSelectedColoring(flag: boolean): void {
    //set the new colors into the variables
    if (flag) {
      this.glowingStrokeColorFront = SETTINGS.style.selectedColor.front;
      this.glowingStrokeColorBack = SETTINGS.style.selectedColor.back;
    } else {
      this.glowingStrokeColorFront =
        SETTINGS.parametric.glowing.strokeColor.front;
      this.glowingStrokeColorBack =
        SETTINGS.parametric.glowing.strokeColor.back;
    }
    // apply the new color variables to the object
    this.stylize(DisplayStyle.ApplyCurrentVariables);
  }

  /**
   * Adds the front/back/glowing/not parts to the correct layers
   * @param layers
   */
  public addToLayers(layers: Two.Group[]): void {
    // These must always be executed even if the front/back part is empty
    // Otherwise when they become non-empty they are not displayed

    this.foregroundLayer = layers[LAYER.foreground];
    this.backgroundLayer = layers[LAYER.background];
    this.glowingFgLayer = layers[LAYER.foregroundGlowing];
    this.glowingBgLayer = layers[LAYER.backgroundGlowing];
    this.frontParts.forEach(part => part.addTo(layers[LAYER.foreground]));
    this.glowingFrontParts.forEach(part =>
      part.addTo(layers[LAYER.foregroundGlowing])
    );

    this.backParts.forEach(part => part.addTo(layers[LAYER.background]));
    this.glowingBackParts.forEach(part =>
      part.addTo(layers[LAYER.backgroundGlowing])
    );
  }

  public removeFromLayers(/*layers: Two.Group[]*/): void {
    this.frontParts.forEach(part => part.remove());

    this.glowingFrontParts.forEach(part => part.remove());
    this.backParts.forEach(part => part.remove());

    this.glowingBackParts.forEach(part => part.remove());
  }

  /**
   * Return the default style state
   */
  defaultStyleState(panel: StyleEditPanels): StyleOptions {
    switch (panel) {
      case StyleEditPanels.Front:
        return DEFAULT_PARAMETRIC_FRONT_STYLE;
      case StyleEditPanels.Back:
        if (SETTINGS.parametric.dynamicBackStyle)
          return {
            ...DEFAULT_PARAMETRIC_BACK_STYLE,
            strokeWidthPercent: Nodule.contrastStrokeWidthPercent(100),
            strokeColor: Nodule.contrastStrokeColor(
              SETTINGS.parametric.drawn.strokeColor.front
            ),
            fillColor: Nodule.contrastFillColor(
              SETTINGS.parametric.drawn.fillColor.front
            )
          };
        else return DEFAULT_PARAMETRIC_BACK_STYLE;
      default:
        return {};
    }
  }

  /**
   * Sets the variables for stroke width glowing/not
   */
  public adjustSize(): void {
    const frontStyle = this.styleOptions.get(StyleEditPanels.Front);
    const frontStrokeWidthPercent = frontStyle?.strokeWidthPercent ?? 100;
    const backStyle = this.styleOptions.get(StyleEditPanels.Back);
    const backStrokeWidthPercent = backStyle?.strokeWidthPercent ?? 100;
    this.frontParts.forEach(
      part =>
        (part.linewidth =
          (Parametric.currentParametricStrokeWidthFront *
            frontStrokeWidthPercent) /
          100)
    );
    this.backParts.forEach(
      part =>
        (part.linewidth =
          (Parametric.currentParametricStrokeWidthBack *
            (backStyle?.dynamicBackStyle
              ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
              : backStrokeWidthPercent)) /
          100)
    );
    this.glowingFrontParts.forEach(
      part =>
        (part.linewidth =
          (Parametric.currentGlowingParametricStrokeWidthFront *
            frontStrokeWidthPercent) /
          100)
    );
    this.glowingBackParts.forEach(
      part =>
        (part.linewidth =
          (Parametric.currentGlowingParametricStrokeWidthBack *
            (backStyle?.dynamicBackStyle
              ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
              : backStrokeWidthPercent)) /
          100)
    );
  }

  /**
   * Set the rendering style (flags: ApplyTemporaryVariables, ApplyCurrentVariables) of the Parametric
   *
   * ApplyTemporaryVariables means that
   *    1) The temporary variables from SETTINGS.point.temp are copied into the actual Two.js objects
   *    2) The pointScaleFactor is copied from the Point.pointScaleFactor (which accounts for the Zoom magnification) into the actual Two.js objects
   *
   * Apply CurrentVariables means that all current values of the private style variables are copied into the actual Two.js objects
   */
  public stylize(flag: DisplayStyle): void {
    switch (flag) {
      case DisplayStyle.ApplyTemporaryVariables: {
        // Use the SETTINGS temporary options to directly modify the Two.js objects.

        // THIS SHOULD NEVER BE EXECUTED
        //FRONT
        if (
          Nodule.hlsaIsNoFillOrNoStroke(
            SETTINGS.parametric.temp.strokeColor.front
          )
        ) {
          this.frontParts.forEach(part => part.noStroke());
        } else {
          this.frontParts.forEach(
            part => (part.stroke = SETTINGS.parametric.temp.strokeColor.front)
          );
        }
        // The Parametric width is set to the current Parametric width (which is updated for zoom magnification)
        this.frontParts.forEach(
          part =>
            (part.linewidth = Parametric.currentParametricStrokeWidthFront)
        );
        // Copy the front dash properties from the front default drawn dash properties
        if (SETTINGS.parametric.drawn.dashArray.front.length > 0) {
          this.frontParts.forEach(part => part.dashes.clear());
          SETTINGS.parametric.drawn.dashArray.front.forEach(v => {
            this.frontParts.forEach(part => part.dashes.push(v));
          });
          if (SETTINGS.parametric.drawn.dashArray.reverse.front) {
            this.frontParts.forEach(part => part.dashes.reverse());
          }
        }
        //BACK
        if (
          Nodule.hlsaIsNoFillOrNoStroke(
            SETTINGS.parametric.temp.strokeColor.back
          )
        ) {
          this.backParts.forEach(part => part.noStroke());
        } else {
          this.backParts.forEach(
            part => (part.stroke = SETTINGS.parametric.temp.strokeColor.back)
          );
        }
        // The Parametric width is set to the current Parametric width (which is updated for zoom magnification)
        this.backParts.forEach(
          part => (part.linewidth = Parametric.currentParametricStrokeWidthBack)
        );
        // Copy the front dash properties from the front default drawn dash properties
        if (SETTINGS.parametric.drawn.dashArray.back.length > 0) {
          this.backParts.forEach(part => part.dashes.clear());
          SETTINGS.parametric.drawn.dashArray.back.forEach(v => {
            this.backParts.forEach(part => part.dashes.push(v));
          });
          if (SETTINGS.parametric.drawn.dashArray.reverse.back) {
            this.backParts.forEach(part => part.dashes.reverse());
          }
        }

        // The temporary display is never highlighted
        this.glowingFrontParts.forEach(part => (part.visible = false));
        this.glowingBackParts.forEach(part => (part.visible = false));
        break;
      }

      case DisplayStyle.ApplyCurrentVariables: {
        // Use the current variables to directly modify the Two.js objects.

        // FRONT
        const frontStyle = this.styleOptions.get(StyleEditPanels.Front);
        const strokeColorFront = frontStyle?.strokeColor ?? "black";

        if (Nodule.hlsaIsNoFillOrNoStroke(strokeColorFront)) {
          this.frontParts.forEach(part => part.noStroke());
        } else {
          this.frontParts.forEach(part => (part.stroke = strokeColorFront));
        }
        // strokeWidthPercent is applied by adjustSize()

        if (
          frontStyle?.dashArray &&
          frontStyle?.reverseDashArray !== undefined &&
          frontStyle.dashArray.length > 0
        ) {
          this.frontParts.forEach(part => part.dashes.clear());
          frontStyle.dashArray.forEach(v => {
            this.frontParts.forEach(part => part.dashes.push(v));
          });
          if (frontStyle.reverseDashArray) {
            this.frontParts.forEach(part => part.dashes.reverse());
          }
        } else {
          // the array length is zero and no dash array should be set
          this.frontParts.forEach(part => part.dashes.clear());
          this.frontParts.forEach(part => part.dashes.push(0));
        }
        // BACK
        const backStyle = this.styleOptions.get(StyleEditPanels.Back);
        const strokeColorBack = backStyle?.strokeColor ?? "black";
        if (backStyle?.dynamicBackStyle) {
          if (
            Nodule.hlsaIsNoFillOrNoStroke(
              Nodule.contrastStrokeColor(strokeColorFront)
            )
          ) {
            this.backParts.forEach(part => part.noStroke());
          } else {
            this.backParts.forEach(
              part =>
                (part.stroke = Nodule.contrastStrokeColor(strokeColorFront))
            );
          }
        } else {
          if (Nodule.hlsaIsNoFillOrNoStroke(strokeColorBack)) {
            this.backParts.forEach(part => part.noStroke());
          } else {
            this.backParts.forEach(part => (part.stroke = strokeColorBack));
          }
        }

        // strokeWidthPercent applied by adjustSizer()

        if (
          backStyle?.dashArray &&
          backStyle?.reverseDashArray !== undefined &&
          backStyle.dashArray.length > 0
        ) {
          this.backParts.forEach(part => part.dashes.clear());
          backStyle.dashArray.forEach(v => {
            this.backParts.forEach(part => part.dashes.push(v));
          });
          if (backStyle.reverseDashArray) {
            this.backParts.forEach(part => part.dashes.reverse());
          }
        } else {
          // the array length is zero and no dash array should be set
          this.backParts.forEach(part => part.dashes.clear());
          this.backParts.forEach(part => part.dashes.push(0));
        }

        // UPDATE the glowing object

        // Glowing Front
        // no fillColor for glowing ellipses
        this.glowingFrontParts.forEach(
          part => (part.stroke = this.glowingStrokeColorFront)
        );
        // strokeWidthPercent applied by adjustSize()

        // Copy the front dash properties to the glowing object
        if (
          frontStyle?.dashArray &&
          frontStyle?.reverseDashArray !== undefined &&
          frontStyle.dashArray.length > 0
        ) {
          this.glowingFrontParts.forEach(part => part.dashes.clear());
          frontStyle.dashArray.forEach(v => {
            this.glowingFrontParts.forEach(part => part.dashes.push(v));
          });
          if (frontStyle.reverseDashArray) {
            this.glowingFrontParts.forEach(part => part.dashes.reverse());
          }
        } else {
          // the array length is zero and no dash array should be set
          this.glowingFrontParts.forEach(part => part.dashes.clear());
          this.glowingFrontParts.forEach(part => part.dashes.push(0));
        }

        // Glowing Back
        // no fillColor for glowing ellipses
        this.glowingBackParts.forEach(
          part => (part.stroke = this.glowingStrokeColorBack)
        );
        // strokeWidthPercent applied by adjustSize()

        // Copy the back dash properties to the glowing object
        if (
          backStyle?.dashArray &&
          backStyle?.reverseDashArray !== undefined &&
          backStyle.dashArray.length > 0
        ) {
          this.glowingBackParts.forEach(part => part.dashes.clear());
          backStyle.dashArray.forEach(v => {
            this.glowingBackParts.forEach(part => part.dashes.push(v));
          });
          if (backStyle.reverseDashArray) {
            this.glowingBackParts.forEach(part => part.dashes.reverse());
          }
        } else {
          // the array length is zero and no dash array should be set
          this.glowingBackParts.forEach(part => part.dashes.clear());
          this.glowingBackParts.forEach(part => part.dashes.push(0));
        }
        break;
      }
    }
  }
}
