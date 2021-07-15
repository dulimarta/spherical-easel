/** @format */

import { Vector3, Vector2, Matrix4 } from "three";
import Two from "two.js";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";
import { StyleOptions, StyleEditPanels } from "@/types/Styles";
import AppStore from "@/store";
import { SENodule } from "@/models/SENodule";
import { namespace } from "vuex-class";
import {
  AppState,
  UpdateMode,
  CoordExpression,
  MinMaxExpression,
  MinMaxNumber
} from "@/types";
import { SEExpression } from "@/models/SEExpression";
import { SEStore } from "@/store";
import { ExpressionParser } from "@/expression/ExpressionParser";

// const desiredXAxis = new Vector3();
// const desiredYAxis = new Vector3();
// const desiredZAxis = new Vector3();
// // const Z_AXIS = new Vector3(0, 0, 1);
const transformMatrix = new Matrix4(); // maps from the un-rotated sphere to the rotated one
const SUBDIVISIONS = SETTINGS.parametric.numPoints;

/**
 * For drawing surface Parametric. A Parametric consists of two paths (front and back)
 * for a total of 2N subdivisions.
 * We initially assign the same number of segments/subdivisions to each path,
 * but as the Parametric is being deformed the number of subdivisions on each path
 * may change: longer path will hold more subdivision points (while keeping the
 * total points 2N so we don't create/remove new points)
 */
export default class Parametric extends Nodule {
  /**
   * These are string expressions that once set define the Parametric curve
   */
  private _coordinateExpressions: CoordExpression = { x: "", y: "", z: "" };

  private _primeCoordinateExpression: CoordExpression = { x: "", y: "", z: "" };

  private _tExpressions: MinMaxExpression = { min: "", max: "" };

  private _tNumbers: MinMaxNumber = { min: NaN, max: NaN };

  /**
   * The expressions that are the parents of this curve
   */
  private seParentExpressions: SEExpression[] = [];

  /**
   * A parser to convert from the expression to a formula/number
   */
  private parser = new ExpressionParser();

  /**
   * The vector P(t) for tMin <= t <= tMax P(t)= parameterization traces out the curve
   * And the vector P'(t) = parameterizationPrime of the curve.
   */
  private parameterization = new Vector3();
  private parameterizationPrime = new Vector3();
  private _closed: boolean; // true if P(tNumber.min)=P(tNumber.max)

  /**
   * The map which gets updated with the current value of the measurements
   */
  readonly varMap = new Map<string, number>();

  /**
   * The arcLength of the parametric curve from tNumber.min to tNumber.Max
   */
  private _arcLength: number;
  /**
   * The tMin & tMax starting *tracing* parameter of the curve.
   */
  public tMinMaxExpressionValues(): number[] | null {
    if (this._tExpressions.min === "" || this._tExpressions.max === "")
      return null;
    // first update the map with the current values of the measurements
    this.seParentExpressions.forEach((m: SEExpression) => {
      const measurementName = m.name;
      // console.debug("Measurement", m, measurementName);
      this.varMap.set(measurementName, m.value);
    });

    return [
      this.parser.evaluateWithVars(this._tExpressions.min, this.varMap),
      this.parser.evaluateWithVars(this._tExpressions.max, this.varMap)
    ];
  }

  /**
   * The parameterization of the curve.
   * @param t the parameter
   * @returns vector containing the location
   */
  public P(t: number): Vector3 {
    // first update the map with the current value of
    this.seParentExpressions.forEach((m: SEExpression) => {
      const measurementName = m.name;
      // console.debug("Measurement", m, measurementName);
      this.varMap.set(measurementName, m.value);
    });
    //add the current t value
    this.varMap.set("t", t);

    return this.parameterization.set(
      this.parser.evaluateWithVars(this._coordinateExpressions.x, this.varMap),
      this.parser.evaluateWithVars(this._coordinateExpressions.y, this.varMap),
      this.parser.evaluateWithVars(this._coordinateExpressions.z, this.varMap)
    );
  }
  /**
   * The parameterization of the derivative of the curve
   * Note: This is *not* a unit parameterization
   * @param t the parameter
   */
  public PPrime(t: number): Vector3 {
    // first update the map with the current value of
    this.seParentExpressions.forEach((m: SEExpression) => {
      const measurementName = m.name;
      // console.debug("Measurement", m, measurementName);
      this.varMap.set(measurementName, m.value);
    });
    //add the current t value
    this.varMap.set("t", t);

    return this.parameterizationPrime.set(
      this.parser.evaluateWithVars(
        this._primeCoordinateExpression.x,
        this.varMap
      ),
      this.parser.evaluateWithVars(
        this._primeCoordinateExpression.y,
        this.varMap
      ),
      this.parser.evaluateWithVars(
        this._primeCoordinateExpression.z,
        this.varMap
      )
    );
  }

  public d = (t: number): number => {
    return this.P(t).dot(this.tmpVector);
  };
  public dp = (t: number): number => {
    return this.PPrime(t).dot(this.tmpVector);
  };

  /**
   * Vuex global state
   */
  protected store = AppStore; //

  /**
   * The TwoJS objects to display the front/back parts and their glowing counterparts.
   */
  private frontParts: Two.Path[] = [];
  private backParts: Two.Path[] = [];
  private glowingFrontParts: Two.Path[] = [];
  private glowingBackParts: Two.Path[] = [];
  private numberOfParts = 2; // we need at least two of each front and back to render the object

  private pool: Two.Anchor[] = []; //The pool of vertices
  private glowingPool: Two.Anchor[] = []; //The pool of vertices
  /**
   * The styling variables for the drawn curve. The user can modify these.
   */
  // Front
  private strokeColorFront = SETTINGS.parametric.drawn.strokeColor.front;
  private glowingStrokeColorFront =
    SETTINGS.parametric.glowing.strokeColor.front;
  private strokeWidthPercentFront = 100;
  private dashArrayFront = [] as number[]; // Initialize in constructor
  // Back -- use the default non-dynamic back style options so that when the user disables the dynamic back style these options are displayed
  private dynamicBackStyle = SETTINGS.parametric.dynamicBackStyle;
  private strokeColorBack = SETTINGS.parametric.drawn.strokeColor.back;
  private glowingStrokeColorBack = SETTINGS.parametric.glowing.strokeColor.back;
  private strokeWidthPercentBack = 100;
  private dashArrayBack = [] as number[]; // Initialize in constructor

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
    coordinateExpressions: { x: string; y: string; z: string },
    primeCoordinateExpressions: { x: string; y: string; z: string },
    tExpressions: { min: string; max: string },
    tNumbers: { min: number; max: number },
    measurementParents: SEExpression[],
    closed: boolean
  ) {
    super();
    // Set the expressions for the curve, its derivative, and the tMin & tMax
    this._coordinateExpressions.x = coordinateExpressions.x;
    this._coordinateExpressions.y = coordinateExpressions.y;
    this._coordinateExpressions.z = coordinateExpressions.z;

    this._primeCoordinateExpression.x = primeCoordinateExpressions.x;
    this._primeCoordinateExpression.y = primeCoordinateExpressions.y;
    this._primeCoordinateExpression.z = primeCoordinateExpressions.z;

    this._tExpressions.min = tExpressions.min;
    this._tExpressions.max = tExpressions.max;

    this._tNumbers.min = tNumbers.min;
    this._tNumbers.max = tNumbers.max;

    this.seParentExpressions.push(...measurementParents);

    this._closed = closed;

    // Determine the number of front/back parts need to render the curve
    // Do this by sampling along the curve from tNumbers.min to tNumbers.max and then intersecting the curve with the plane through two points on the curve (and counting the intersections)

    // we know that is is not the case that tNumber.max <= tNumber.min because the ParametricForm.vue checked for this
    const tValues: number[] = [];
    for (
      let i = 0;
      i < SETTINGS.parameterization.numberOfTestTValues + 1;
      i++
    ) {
      tValues.push(
        this._tNumbers.min +
          (i / SETTINGS.parameterization.numberOfTestTValues) *
            (this._tNumbers.max - this._tNumbers.min)
      );
    }
    // First form the objective function, this is the function that we want to find the zeros.
    // We want to find the t values where the P(t) is perpendicular to tmpVector
    // because tmpVector will be a normal to the plane containing P(t1) and P(t2)
    // This means we want the dot product to be zero

    console.log("here1");
    tValues.forEach(t1 => {
      tValues.forEach(t2 => {
        if (t1 < t2 && Math.abs(t2 - t1) > 0.2) {
          // console.log("t1", t1);
          // console.log(this.P(t1));
          // console.log("t2", t2, this.P(t2));
          this.tmpVector1.copy(this.P(t1));
          this.tmpVector.crossVectors(this.tmpVector1, this.P(t2));
          // console.log(this.tmpVector, this.P(1), this.P(2));
          // const zeros = SENodule.findZeros(
          //   this.P.bind(this),
          //   this._tNumbers.min,
          //   this._tNumbers.max,
          //   this.tmpVector.x,
          //   this.tmpVector.y,
          //   this.tmpVector.z,
          //   this.PPrime.bind(this)
          // );
          // console.log("tmpVec", this.tmpVector.x, this.d(1));
          const zeros = SENodule.findZerosParametrically(
            this.d.bind(this),
            this._tNumbers.min,
            this._tNumbers.max,
            this.dp.bind(this)
          );
          console.log("zeros", zeros.length);
          if (zeros.length > this.numberOfParts) {
            this.numberOfParts = zeros.length;
          }
        }
      });
    });
    console.log("number of parts", this.numberOfParts);

    // to set the number of vertices need to render the parametric curve use the density of SUBDIVISIONS per unit arcLength and multiply by the arcLength
    this._arcLength = this.arcLength(this._tNumbers.min, this._tNumbers.max);
    console.log("arcLength", this._arcLength);
    // As the Parametric is moved around the vertices are passed between the front and back parts, but it
    // is always true that sum of the number of all frontVertices and the sum of all the backVertices = floor(2*SUBDIVISIONS*arcLength)
    const frontVertices: Two.Vector[] = [];
    for (let k = 0; k < Math.floor(SUBDIVISIONS * this._arcLength); k++) {
      // Create Two.Vectors for the paths that will be cloned later
      frontVertices.push(new Two.Vector(0, 0));
    }
    this.frontParts[0] = new Two.Path(
      frontVertices,
      /*closed*/ false,
      /*curve*/ false
    );

    // now create, record ids, and set nofill (and strip of their anchors so that the number of anchors is correct) the other parts that may be needed
    for (let i = 0; i < this.numberOfParts; i++) {
      this.glowingFrontParts[i] = this.frontParts[0].clone();
      this.backParts[i] = this.frontParts[0].clone();
      this.glowingBackParts[i] = this.frontParts[0].clone();

      if (i > 0) {
        // clear the vectors from all the parts so that the total number (between front and back) of vectors is 2*SUBDIVISIONS
        this.frontParts[i] = this.frontParts[0].clone();
        this.frontParts[i].vertices.splice(0);
        this.glowingFrontParts[i].vertices.splice(0);
        this.backParts[i].vertices.splice(0);
        this.glowingBackParts[i].vertices.splice(0);
      }
      Nodule.idPlottableDescriptionMap.set(String(this.frontParts[i].id), {
        type: "parametric",
        side: "front",
        fill: false,
        part: ""
      });
      Nodule.idPlottableDescriptionMap.set(String(this.backParts[i].id), {
        type: "parametric",
        side: "back",
        fill: false,
        part: ""
      });

      // Set the styles that are always true
      // The front/back parts have no fill because that is handled by the front/back fill
      // The front/back fill have no stroke because that is handled by the front/back part
      this.frontParts[i].noFill();
      this.backParts[i].noFill();
      this.glowingFrontParts[i].noFill();
      this.glowingBackParts[i].noFill();

      //Turn off the glowing display initially but leave it on so that the temporary objects show up
      this.frontParts[i].visible = true;
      this.backParts[i].visible = true;
      this.glowingBackParts[i].visible = false;
      this.glowingFrontParts[i].visible = false;
    }

    if (SETTINGS.parametric.drawn.dashArray.front.length > 0) {
      SETTINGS.parametric.drawn.dashArray.front.forEach(v =>
        this.dashArrayFront.push(v)
      );
    }
    if (SETTINGS.parametric.drawn.dashArray.back.length > 0) {
      SETTINGS.parametric.drawn.dashArray.back.forEach(v =>
        this.dashArrayBack.push(v)
      );
    }
  }
  /**
   *
   * @param tMin starting t parameter
   * @param tMax ending t parameter
   * @returns acrLength of the curve from tMin to tMax
   */
  arcLength(tMin: number, tMax: number): number {
    let oldArcLength = 0;
    let newArcLength: number;
    let iteration = 1;
    do {
      newArcLength = 0;
      // replace with Simpson's rule? some adaptive algorithm? PPrime is possibly undefined at certain values
      for (
        let i = 0;
        i < SETTINGS.parameterization.subdivisions * iteration;
        i++
      ) {
        newArcLength =
          newArcLength +
          this.PPrime(
            tMin +
              ((i + 0.5) /
                (SETTINGS.parameterization.subdivisions * iteration)) *
                (tMax - tMin)
          ).length();
        // console.log(
        //   "PPrime",
        //   this.PPrime(
        //     tMin +
        //       (i / (SETTINGS.parameterization.subdivisions * iteration)) *
        //         (tMax - tMin)
        //   ).x,
        //   this.PPrime(
        //     tMin +
        //       (i / (SETTINGS.parameterization.subdivisions * iteration)) *
        //         (tMax - tMin)
        //   ).length()
        // );
      }
      newArcLength /=
        (SETTINGS.parameterization.subdivisions * iteration) / (tMax - tMin);

      if (
        Math.abs(oldArcLength - newArcLength) <
        SETTINGS.parameterization.maxChangeInArcLength
      ) {
        return newArcLength;
      } else {
        oldArcLength = newArcLength;
        iteration++;
        // console.log("arc length iteration", iteration, oldArcLength);
      }
    } while (
      iteration < SETTINGS.parameterization.maxNumberOfIterationArcLength
    );

    return newArcLength;
  }
  /**
   * The Parametric curve is given in on the unit sphere, which might have been rotated, so we always transform from the unrotated
   * sphere to the rotated one and then project the points to 2D (assigning to front/back depending on the sign of the z coordinate)
   * This method updates the TwoJS objects (frontPart, frontExtra, ...) for display
   * This is only accurate if the a, b, and foci(1|2)Vector are correct so only
   * call this method once those variables are updated.
   */
  public updateDisplay(): void {
    // Create a matrix4 in the three.js package (called transformMatrix) that maps the unrotated parametric curve to
    // the one in the target desired (updated) position (i.e. the target parametric).

    // The target Parametric (on the sphere of radius SETTINGS.boundaryCircle.radius) is rotated version of the
    // original Parametric (which is on the un-rotated unit sphere)
    // so scale XYZ space
    // this will make the original Parametric (in unrotated position on the sphere) finally coincide with the target Parametric
    transformMatrix.getInverse(SEStore.inverseTotalRotationMatrix);
    this.tmpMatrix.makeScale(
      SETTINGS.boundaryCircle.radius,
      SETTINGS.boundaryCircle.radius,
      SETTINGS.boundaryCircle.radius
    );
    transformMatrix.multiply(this.tmpMatrix);
    // transformMatrix now maps the un-rotated parametric to the target parametric

    // Recalculate the 3D coordinates of the Parametric and record the projection in the TwoJS paths

    // // Parts becomes closed when the other parts vanishes
    // this.frontPart.closed = backLen === 0;
    // this.backPart.closed = frontLen === 0;
    // this.glowingFrontPart.closed = backLen === 0;
    // this.glowingBackPart.closed = frontLen === 0;

    // Bring all the anchor points to a common pool
    // Each front/back  path will pull anchor points from
    // this pool as needed

    for (let i = 0; i < this.numberOfParts; i++) {
      this.pool.push(...this.frontParts[i].vertices.splice(0));
      this.pool.push(...this.backParts[i].vertices.splice(0));
    }

    for (let i = 0; i < this.numberOfParts; i++) {
      this.glowingPool.push(...this.glowingFrontParts[i].vertices.splice(0));
      this.glowingPool.push(...this.glowingBackParts[i].vertices.splice(0));
    }

    // find the tracing tMin and tMax
    let [tMin, tMax] = this.tMinMaxExpressionValues() ?? [
      this._tNumbers.min,
      this._tNumbers.max
    ];

    // if the tMin/tMax values are out of order plot nothing?
    if (tMax <= tMin) return;

    // restrict to the parameter interval of tNumber.min to tNumber.max
    if (tMin < this._tNumbers.min) tMin = this._tNumbers.min;
    if (tMax > this._tNumbers.max) tMax = this._tNumbers.max;

    const tempArcLength = this.arcLength(tMin, tMax);

    let lastPositiveIndex = 0;
    let lastNegativeIndex = 0;

    let currentFrontPartIndex = 0;
    let currentBackPartIndex = 0;

    for (
      let index = 0;
      index < 2 * Math.floor(SUBDIVISIONS * tempArcLength);
      index++
    ) {
      // The t value
      const tVal =
        tMin +
        (index / (2 * Math.floor(SUBDIVISIONS * tempArcLength))) *
          (tMax - tMin);

      // P(tval) is the location on the unit sphere of the Parametric in un-rotated position
      this.tmpVector.copy(this.P(tVal));
      // Set tmpVector equal to location on the target Parametric in rotated position
      this.tmpVector.applyMatrix4(transformMatrix);

      // When the Z-coordinate is negative, the vertex belongs the
      // the back side of the sphere
      if (this.tmpVector.z > 0) {
        // Move to the next back part if necessary
        if (lastNegativeIndex !== index - 1) {
          lastNegativeIndex = index;
          currentBackPartIndex++;
          if (currentBackPartIndex >= this.backParts.length) {
            throw new Error(
              "Parametric update: Needs more back parts than were allocated in the constructor"
            );
          }
        }

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
        if (lastPositiveIndex !== index - 1) {
          lastPositiveIndex = index;
          currentFrontPartIndex++;
          if (currentFrontPartIndex >= this.backParts.length) {
            throw new Error(
              "Parametric Update: Needs more front parts than were allocated in the constructor"
            );
          }
        }

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

  setVisible(flag: boolean): void {
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
  addToLayers(layers: Two.Group[]): void {
    // These must always be executed even if the front/back part is empty
    // Otherwise when they become non-empty they are not displayed

    this.frontParts.forEach(part => part.addTo(layers[LAYER.foreground]));
    this.glowingFrontParts.forEach(part =>
      part.addTo(layers[LAYER.foregroundGlowing])
    );

    this.backParts.forEach(part => part.addTo(layers[LAYER.background]));
    this.glowingBackParts.forEach(part =>
      part.addTo(layers[LAYER.backgroundGlowing])
    );
  }

  removeFromLayers(/*layers: Two.Group[]*/): void {
    this.frontParts.forEach(part => part.remove());

    this.glowingFrontParts.forEach(part => part.remove());
    this.backParts.forEach(part => part.remove());

    this.glowingBackParts.forEach(part => part.remove());
  }

  /**
   * Copies the style options set by the Style Panel into the style variables and then updates the
   * Two.js objects (with adjustSize and stylize(ApplyVariables))
   * @param options The style options
   */
  updateStyle(options: StyleOptions): void {
    console.debug("Circle Update style of Parametric using", options);
    if (options.panel === StyleEditPanels.Front) {
      // Set the front options
      if (options.strokeWidthPercent !== undefined) {
        this.strokeWidthPercentFront = options.strokeWidthPercent;
      }

      if (options.strokeColor !== undefined) {
        this.strokeColorFront = options.strokeColor;
      }
      if (options.dashArray !== undefined) {
        this.dashArrayFront.clear();
        for (let i = 0; i < options.dashArray.length; i++) {
          this.dashArrayFront.push(options.dashArray[i]);
        }
      }
    } else if (options.panel == StyleEditPanels.Back) {
      // Set the back options
      // options.dynamicBackStyle is boolean, so we need to explicitly check for undefined otherwise
      // when it is false, this doesn't execute and this.dynamicBackStyle is not set
      if (options.dynamicBackStyle !== undefined) {
        this.dynamicBackStyle = options.dynamicBackStyle;
      }
      // overwrite the back options only in the case the dynamic style is not enabled
      if (!this.dynamicBackStyle) {
        if (options.strokeWidthPercent !== undefined) {
          this.strokeWidthPercentBack = options.strokeWidthPercent;
        }
        if (options.strokeColor !== undefined) {
          this.strokeColorBack = options.strokeColor;
        }
        if (options.dashArray !== undefined) {
          // clear the dashArray
          this.dashArrayBack.clear();
          for (let i = 0; i < options.dashArray.length; i++) {
            this.dashArrayBack.push(options.dashArray[i]);
          }
        }
      }
    }
    // Now apply the style and size
    this.stylize(DisplayStyle.ApplyCurrentVariables);
    this.adjustSize();
  }

  /**
   * Return the current style state
   */
  currentStyleState(panel: StyleEditPanels): StyleOptions {
    switch (panel) {
      case StyleEditPanels.Front: {
        const dashArrayFront = [] as number[];
        if (this.dashArrayFront.length > 0) {
          this.dashArrayFront.forEach(v => dashArrayFront.push(v));
        }
        return {
          panel: panel,
          strokeWidthPercent: this.strokeWidthPercentFront,
          strokeColor: this.strokeColorFront,
          dashArray: dashArrayFront
        };
      }
      case StyleEditPanels.Back: {
        const dashArrayBack = [] as number[];
        if (this.dashArrayBack.length > 0) {
          this.dashArrayBack.forEach(v => dashArrayBack.push(v));
        }
        return {
          panel: panel,
          strokeWidthPercent: this.strokeWidthPercentBack,
          strokeColor: this.strokeColorBack,
          dashArray: dashArrayBack,
          dynamicBackStyle: this.dynamicBackStyle
        };
      }
      default:
      case StyleEditPanels.Label: {
        return {
          panel: panel
        };
      }
    }
  }
  /**
   * Return the default style state
   */
  defaultStyleState(panel: StyleEditPanels): StyleOptions {
    switch (panel) {
      case StyleEditPanels.Front: {
        const dashArrayFront = [] as number[];
        if (SETTINGS.parametric.drawn.dashArray.front.length > 0) {
          SETTINGS.parametric.drawn.dashArray.front.forEach(v =>
            dashArrayFront.push(v)
          );
        }
        return {
          panel: panel,
          strokeWidthPercent: 100,
          fillColor: SETTINGS.parametric.drawn.fillColor.front,
          strokeColor: SETTINGS.parametric.drawn.strokeColor.front,
          dashArray: dashArrayFront
        };
      }
      case StyleEditPanels.Back: {
        const dashArrayBack = [] as number[];

        if (SETTINGS.parametric.drawn.dashArray.back.length > 0) {
          SETTINGS.parametric.drawn.dashArray.back.forEach(v =>
            dashArrayBack.push(v)
          );
        }
        return {
          panel: panel,

          strokeWidthPercent: SETTINGS.parametric.dynamicBackStyle
            ? Nodule.contrastStrokeWidthPercent(100)
            : 100,

          strokeColor: SETTINGS.parametric.dynamicBackStyle
            ? Nodule.contrastStrokeColor(
                SETTINGS.parametric.drawn.strokeColor.front
              )
            : SETTINGS.parametric.drawn.strokeColor.back,

          fillColor: SETTINGS.parametric.dynamicBackStyle
            ? Nodule.contrastFillColor(
                SETTINGS.parametric.drawn.fillColor.front
              )
            : SETTINGS.parametric.drawn.fillColor.back,

          dashArray: dashArrayBack,

          dynamicBackStyle: SETTINGS.parametric.dynamicBackStyle
        };
      }
      default:
      case StyleEditPanels.Label: {
        return {
          panel: panel
        };
      }
    }
  }

  /**
   * Sets the variables for stroke width glowing/not
   */
  adjustSize(): void {
    this.frontParts.forEach(
      part =>
        (part.linewidth =
          (Parametric.currentParametricStrokeWidthFront *
            this.strokeWidthPercentFront) /
          100)
    );
    this.backParts.forEach(
      part =>
        (part.linewidth =
          (Parametric.currentParametricStrokeWidthBack *
            (this.dynamicBackStyle
              ? Nodule.contrastStrokeWidthPercent(this.strokeWidthPercentFront)
              : this.strokeWidthPercentBack)) /
          100)
    );
    this.glowingFrontParts.forEach(
      part =>
        (part.linewidth =
          (Parametric.currentGlowingParametricStrokeWidthFront *
            this.strokeWidthPercentFront) /
          100)
    );
    this.glowingBackParts.forEach(
      part =>
        (part.linewidth =
          (Parametric.currentGlowingParametricStrokeWidthBack *
            (this.dynamicBackStyle
              ? Nodule.contrastStrokeWidthPercent(this.strokeWidthPercentFront)
              : this.strokeWidthPercentBack)) /
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
  stylize(flag: DisplayStyle): void {
    switch (flag) {
      case DisplayStyle.ApplyTemporaryVariables: {
        // Use the SETTINGS temporary options to directly modify the Two.js objects.

        // THIS SHOULD NEVER BE EXECUTED
        //FRONT
        if (SETTINGS.parametric.temp.strokeColor.front === "noStroke") {
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
        }
        //BACK
        if (SETTINGS.parametric.temp.strokeColor.back === "noStroke") {
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
        }

        // The temporary display is never highlighted
        this.glowingFrontParts.forEach(part => (part.visible = false));
        this.glowingBackParts.forEach(part => (part.visible = false));
        break;
      }

      case DisplayStyle.ApplyCurrentVariables: {
        // Use the current variables to directly modify the Two.js objects.

        // FRONT

        if (this.strokeColorFront === "noStroke") {
          this.frontParts.forEach(part => part.noStroke());
        } else {
          this.frontParts.forEach(
            part => (part.stroke = this.strokeColorFront)
          );
        }
        // strokeWidthPercent is applied by adjustSize()

        if (this.dashArrayFront.length > 0) {
          this.frontParts.forEach(part => part.dashes.clear());
          this.dashArrayFront.forEach(v => {
            this.frontParts.forEach(part => part.dashes.push(v));
          });
        } else {
          // the array length is zero and no dash array should be set
          this.frontParts.forEach(part => part.dashes.clear());
          this.frontParts.forEach(part => part.dashes.push(0));
        }
        // BACK
        if (this.dynamicBackStyle) {
          if (
            Nodule.contrastStrokeColor(this.strokeColorFront) === "noStroke"
          ) {
            this.backParts.forEach(part => part.noStroke());
          } else {
            this.backParts.forEach(
              part =>
                (part.stroke = Nodule.contrastStrokeColor(
                  this.strokeColorFront
                ))
            );
          }
        } else {
          if (this.strokeColorBack === "noStroke") {
            this.backParts.forEach(part => part.noStroke());
          } else {
            this.backParts.forEach(
              part => (part.stroke = this.strokeColorBack)
            );
          }
        }

        // strokeWidthPercent applied by adjustSizer()

        if (this.dashArrayBack.length > 0) {
          this.backParts.forEach(part => part.dashes.clear());
          this.dashArrayBack.forEach(v => {
            this.backParts.forEach(part => part.dashes.push(v));
          });
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
        if (this.dashArrayFront.length > 0) {
          this.glowingFrontParts.forEach(part => part.dashes.clear());
          this.dashArrayFront.forEach(v => {
            this.glowingFrontParts.forEach(part => part.dashes.push(v));
          });
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
        if (this.dashArrayBack.length > 0) {
          this.glowingBackParts.forEach(part => part.dashes.clear());
          this.dashArrayBack.forEach(v => {
            this.glowingBackParts.forEach(part => part.dashes.push(v));
          });
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
