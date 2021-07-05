/** @format */

import { Vector3, Vector2, Matrix4 } from "three";
import Two from "two.js";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";
import { StyleOptions, StyleEditPanels } from "@/types/Styles";
import AppStore from "@/store";
import { SENodule } from "@/models/SENodule";
import { namespace } from "vuex-class";
import { AppState, UpdateMode } from "@/types";
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
   * These are string expression that once set define the Parametric curve
   */
  private _xCoordinateExpression = "0";
  private _yCoordinateExpression = "0";
  private _zCoordinateExpression = "0";

  private _xPrimeCoordinateExpression = "0";
  private _yPrimeCoordinateExpression = "0";
  private _zPrimeCoordinateExpression = "0";

  private _tMinExpression = "0";
  private _tMaxExpression = "0";

  /**
   * The expressions that are the parents of this curve
   */
  private parentExpressions: SEExpression[] = [];

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
  private _closed: boolean; // true if E(tMin)=E(tMax)

  /**
   * The map which gets updated with the current value of the measurements
   */
  readonly varMap = new Map<string, number>();

  /**
   * The tMin starting parameter of the curve.
   */
  public tMin(): number {
    // first update the map with the current values of the measurements
    this.parentExpressions.forEach((m: SEExpression) => {
      const measurementName = m.name;
      // console.debug("Measurement", m, measurementName);
      this.varMap.set(measurementName, m.value);
    });

    return this.parser.evaluateWithVars(this._tMinExpression, this.varMap);
  }
  /**
   * The tMax starting parameter of the curve.
   */
  public tMax(): number {
    // first update the map with the current values of the measurements
    this.parentExpressions.forEach((m: SEExpression) => {
      const measurementName = m.name;
      // console.debug("Measurement", m, measurementName);
      this.varMap.set(measurementName, m.value);
    });

    return this.parser.evaluateWithVars(this._tMaxExpression, this.varMap);
  }

  /**
   * The parameterization of the curve.
   * @param t the parameter
   * @returns
   */
  public P(t: number): Vector3 {
    // first update the map with the current value of
    this.parentExpressions.forEach((m: SEExpression) => {
      const measurementName = m.name;
      // console.debug("Measurement", m, measurementName);
      this.varMap.set(measurementName, m.value);
    });
    //add the current t value
    this.varMap.set("t", t);

    return this.parameterization.set(
      this.parser.evaluateWithVars(this._xCoordinateExpression, this.varMap),
      this.parser.evaluateWithVars(this._yCoordinateExpression, this.varMap),
      this.parser.evaluateWithVars(this._zCoordinateExpression, this.varMap)
    );
  }
  /**
   * The parameterization of the derivative of the curve
   * Note: This is *not* a unit parameterization
   * @param t the parameter
   */
  public PPrime(t: number): Vector3 {
    // first update the map with the current value of
    this.parentExpressions.forEach((m: SEExpression) => {
      const measurementName = m.name;
      // console.debug("Measurement", m, measurementName);
      this.varMap.set(measurementName, m.value);
    });
    //add the current t value
    this.varMap.set("t", t);

    return this.parameterizationPrime.set(
      this.parser.evaluateWithVars(
        this._xPrimeCoordinateExpression,
        this.varMap
      ),
      this.parser.evaluateWithVars(
        this._yPrimeCoordinateExpression,
        this.varMap
      ),
      this.parser.evaluateWithVars(
        this._zPrimeCoordinateExpression,
        this.varMap
      )
    );
  }

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
  private numberOfParts = 1; // we need at least one of each front and back to render the object

  /**
   * The styling variables for the drawn circle. The user can modify these.
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
  private tmpMatrix = new Matrix4();

  constructor(
    xCoordinateExpression: string,
    yCoordinateExpression: string,
    zCoordinateExpression: string,
    xPrimeCoordinateExpression: string,
    yPrimeCoordinateExpression: string,
    zPrimeCoordinateExpression: string,
    tMinExpression: string,
    tMaxExpression: string,
    measurementParents: SEExpression[],
    closed: boolean
  ) {
    super();
    // Set the expressions for the curve, its derivative, and the tMin & tMax
    this._xCoordinateExpression = xCoordinateExpression;
    this._yCoordinateExpression = yCoordinateExpression;
    this._zCoordinateExpression = zCoordinateExpression;

    this._xPrimeCoordinateExpression = xPrimeCoordinateExpression;
    this._yPrimeCoordinateExpression = yPrimeCoordinateExpression;
    this._zPrimeCoordinateExpression = zPrimeCoordinateExpression;

    this._tMinExpression = tMinExpression;
    this._tMaxExpression = tMaxExpression;

    this.parentExpressions.push(...measurementParents);

    this._closed = closed;

    // Determine the number of front/back parts need to render the curve
    // Do this by sampling along the curve from tMin to tMax and then intersecting the curve with the plane through two points on the curve (and counting the intersections)

    // we know that is is not the case that tMax <= tMin because the ParametricForm checked for this
    const tValues: number[] = [];
    const currentTMin = this.tMin();
    const currentTMax = this.tMax();
    for (
      let i = 0;
      i < SETTINGS.parameterization.numberOfTestTValues + 1;
      i++
    ) {
      tValues.push(
        currentTMin +
          (i / SETTINGS.parameterization.numberOfTestTValues) *
            (currentTMax - currentTMin)
      );
    }
    // First form the objective function, this is the function that we want to find the zeros.
    // We want to find the t values where the P(t) is perpendicular to tmpVector
    // because tmpVector is a normal to the plane containing P(t1) and P(t2)
    // This means we want the dot product to be zero
    const d = (t: number): number => {
      return this.P(t).dot(this.tmpVector);
    };
    const dp = (t: number): number => {
      return this.PPrime(t).dot(this.tmpVector);
    };

    tValues.forEach(t1 => {
      tValues.forEach(t2 => {
        if (t1 < t2) {
          this.tmpVector.crossVectors(this.P(t1), this.P(t2));
          const zeros = SENodule.findZerosParametrically(
            d,
            currentTMin,
            currentTMax,
            dp
          );
          if (zeros.length / 2 > this.numberOfParts) {
            this.numberOfParts = zeros.length;
          }
        }
      });
    });
    console.log("number of parts", this.numberOfParts);

    // As the Parametric is moved around the vertices are passed between the front and back parts, but it
    // is always true that sum of the number of all frontVertices and the sum of all the backVertices = 2*SUBDIVISIONS
    const frontVertices: Two.Vector[] = [];
    for (let k = 0; k < SUBDIVISIONS; k++) {
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
    const pool: Two.Anchor[] = [];
    for (let i = 0; i < this.numberOfParts; i++) {
      pool.push(...this.frontParts[i].vertices.splice(0));
      pool.push(...this.backParts[i].vertices.splice(0));
    }
    const glowingPool: Two.Anchor[] = [];
    for (let i = 0; i < this.numberOfParts; i++) {
      glowingPool.push(...this.glowingFrontParts[i].vertices.splice(0));
      glowingPool.push(...this.glowingBackParts[i].vertices.splice(0));
    }
    // find the first change in sign of the z coordinate

    for (let pos = 0; pos < 2 * SUBDIVISIONS; pos++) {
      // The t value
      tVal =
        this._tMin + (pos / (2 * SUBDIVISIONS)) * (this._tMax - this._tMin);

      // E(tval) is the location on the unit sphere of the Parametric in standard position
      this.tmpVector.copy(this.P(tVal));
      // Set tmpVector equal to location on the target Parametric
      this.tmpVector.applyMatrix4(transformMatrix);

      //   // When the Z-coordinate is negative, the vertex belongs the
      //   // the back side of the sphere
      //   if (this.tmpVector.z > 0) {
      // console.log("pool size initially", pool.length);
    }
  }

  /**
   * Get the parameters for the curve
   */
  get closed(): boolean {
    return this._closed;
  }

  frontGlowingDisplay(): void {
    this.frontPart.visible = true;
    this.glowingFrontPart.visible = true;
    this.frontFill.visible = true;
  }
  backGlowingDisplay(): void {
    this.backPart.visible = true;
    this.glowingBackPart.visible = true;
    this.backFill.visible = true;
  }
  glowingDisplay(): void {
    this.frontGlowingDisplay();
    this.backGlowingDisplay();
  }
  frontNormalDisplay(): void {
    this.frontPart.visible = true;
    this.glowingFrontPart.visible = false;
    this.frontFill.visible = true;
  }
  backNormalDisplay(): void {
    this.backPart.visible = true;
    this.glowingBackPart.visible = false;
    this.backFill.visible = true;
  }
  normalDisplay(): void {
    this.frontNormalDisplay();
    this.backNormalDisplay();
  }

  setVisible(flag: boolean): void {
    if (!flag) {
      this.frontPart.visible = false;
      this.backPart.visible = false;
      this.frontFill.visible = false;
      this.backFill.visible = false;
      this.glowingBackPart.visible = false;
      this.glowingFrontPart.visible = false;
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
   * This method is used to copy the temporary Parametric created with the Parametric Tool (in the midground) into a
   * permanent one in the scene (in the foreground).
   */
  clone(): this {
    // Use the constructor for this class to create a template to copy over the
    // values from the current (the `this`) Circle object
    const dup = new Parametric();
    dup._focus1Vector.copy(this._focus1Vector);
    dup._focus2Vector.copy(this._focus2Vector);
    dup._a = this._a;
    dup._b = this._b;

    // Duplicate the non-glowing parts
    dup.frontPart.closed = this.frontPart.closed;
    dup.frontPart.rotation = this.frontPart.rotation;
    dup.frontPart.translation.copy(this.frontPart.translation);
    dup.backPart.closed = this.backPart.closed;
    dup.backPart.rotation = this.backPart.rotation;
    dup.backPart.translation.copy(this.backPart.translation);
    dup.dynamicBackStyle = this.dynamicBackStyle;

    // Duplicate the glowing parts
    dup.glowingFrontPart.closed = this.glowingFrontPart.closed;
    dup.glowingFrontPart.rotation = this.glowingFrontPart.rotation;
    dup.glowingFrontPart.translation.copy(this.glowingFrontPart.translation);
    dup.glowingBackPart.closed = this.glowingBackPart.closed;
    dup.glowingBackPart.rotation = this.glowingBackPart.rotation;
    dup.glowingBackPart.translation.copy(this.glowingBackPart.translation);

    // The clone (i.e. dup) initially has equal number of vertices for the front and back part
    //  so adjust to match `this`. If one of the this.front or this.back has more vertices then
    //  the corresponding dup part, then remove the excess vertices from the one with more and
    //  move them to the other
    while (dup.frontPart.vertices.length > this.frontPart.vertices.length) {
      // Transfer from frontPart to backPart
      dup.backPart.vertices.push(dup.frontPart.vertices.pop()!);
      dup.glowingBackPart.vertices.push(dup.glowingFrontPart.vertices.pop()!);
    }
    while (dup.backPart.vertices.length > this.backPart.vertices.length) {
      // Transfer from backPart to frontPart
      dup.frontPart.vertices.push(dup.backPart.vertices.pop()!);
      dup.glowingFrontPart.vertices.push(dup.glowingBackPart.vertices.pop()!);
    }
    // After the above two while statement execute this. glowing/not front/back and dup. glowing/not front/back are the same length
    // Now we can copy the vertices from the this.front/back to the dup.front/back
    dup.frontPart.vertices.forEach((v: Two.Anchor, pos: number) => {
      v.copy(this.frontPart.vertices[pos]);
    });
    dup.backPart.vertices.forEach((v: Two.Anchor, pos: number) => {
      v.copy(this.backPart.vertices[pos]);
    });
    dup.glowingFrontPart.vertices.forEach((v: Two.Anchor, pos: number) => {
      v.copy(this.glowingFrontPart.vertices[pos]);
    });
    dup.glowingBackPart.vertices.forEach((v: Two.Anchor, pos: number) => {
      v.copy(this.glowingBackPart.vertices[pos]);
    });

    //Clone the front/back fill
    // #frontFill + #backFill + #storage = constant at all times
    const poolFill = [];
    poolFill.push(...dup.frontFill.vertices.splice(0));
    poolFill.push(...dup.backFill.vertices.splice(0));
    poolFill.push(...dup.fillStorageAnchors.splice(0));

    while (dup.frontFill.vertices.length < this.frontFill.vertices.length) {
      dup.frontFill.vertices.push(poolFill.pop()!);
    }
    while (dup.backFill.vertices.length < this.backFill.vertices.length) {
      dup.backFill.vertices.push(poolFill.pop()!);
    }
    dup.fillStorageAnchors.push(...poolFill.splice(0));

    dup.frontFill.vertices.forEach((v: Two.Anchor, pos: number) => {
      v.copy(this.frontFill.vertices[pos]);
    });

    dup.backFill.vertices.forEach((v: Two.Anchor, pos: number) => {
      v.copy(this.backFill.vertices[pos]);
    });

    return dup as this;
  }

  /**
   * Adds the front/back/glowing/not parts to the correct layers
   * @param layers
   */
  addToLayers(layers: Two.Group[]): void {
    // These must always be executed even if the front/back part is empty
    // Otherwise when they become non-empty they are not displayed
    this.frontFill.addTo(layers[LAYER.foreground]);
    this.frontPart.addTo(layers[LAYER.foreground]);
    this.glowingFrontPart.addTo(layers[LAYER.foregroundGlowing]);
    this.backFill.addTo(layers[LAYER.background]);
    this.backPart.addTo(layers[LAYER.background]);
    this.glowingBackPart.addTo(layers[LAYER.backgroundGlowing]);
  }

  removeFromLayers(/*layers: Two.Group[]*/): void {
    this.frontPart.remove();
    this.frontFill.remove();
    this.glowingFrontPart.remove();
    this.backPart.remove();
    this.backFill.remove();
    this.glowingBackPart.remove();
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
      if (options.fillColor !== undefined) {
        this.fillColorFront = options.fillColor;
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
        if (options.fillColor !== undefined) {
          this.fillColorBack = options.fillColor;
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
          fillColor: this.fillColorFront,
          dashArray: dashArrayFront
        };
        break;
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
          fillColor: this.fillColorBack,
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
    this.frontPart.linewidth =
      (Parametric.currentParametricStrokeWidthFront *
        this.strokeWidthPercentFront) /
      100;
    this.backPart.linewidth =
      (Parametric.currentParametricStrokeWidthBack *
        (this.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(this.strokeWidthPercentFront)
          : this.strokeWidthPercentBack)) /
      100;
    this.glowingFrontPart.linewidth =
      (Parametric.currentGlowingParametricStrokeWidthFront *
        this.strokeWidthPercentFront) /
      100;
    this.glowingBackPart.linewidth =
      (Parametric.currentGlowingParametricStrokeWidthBack *
        (this.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(this.strokeWidthPercentFront)
          : this.strokeWidthPercentBack)) /
      100;
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

        //FRONT
        if (SETTINGS.parametric.temp.fillColor.front === "noFill") {
          this.frontFill.noFill();
        } else {
          this.frontGradientColor.color =
            SETTINGS.parametric.temp.fillColor.front;
          this.frontFill.fill = this.frontGradient;
        }
        if (SETTINGS.parametric.temp.strokeColor.front === "noStroke") {
          this.frontPart.noStroke();
        } else {
          this.frontPart.stroke = SETTINGS.parametric.temp.strokeColor.front;
        }
        // The Parametric width is set to the current Parametric width (which is updated for zoom magnification)
        this.frontPart.linewidth = Parametric.currentParametricStrokeWidthFront;
        // Copy the front dash properties from the front default drawn dash properties
        if (SETTINGS.parametric.drawn.dashArray.front.length > 0) {
          this.frontPart.dashes.clear();
          SETTINGS.parametric.drawn.dashArray.front.forEach(v => {
            this.frontPart.dashes.push(v);
          });
        }
        //BACK
        if (SETTINGS.parametric.temp.fillColor.back === "noFill") {
          this.backFill.noFill();
        } else {
          this.backGradientColor.color =
            SETTINGS.parametric.temp.fillColor.back;
          this.backFill.fill = this.backGradient;
        }
        if (SETTINGS.parametric.temp.strokeColor.back === "noStroke") {
          this.backPart.noStroke();
        } else {
          this.backPart.stroke = SETTINGS.parametric.temp.strokeColor.back;
        }
        // The Parametric width is set to the current Parametric width (which is updated for zoom magnification)
        this.backPart.linewidth = Parametric.currentParametricStrokeWidthBack;
        // Copy the front dash properties from the front default drawn dash properties
        if (SETTINGS.parametric.drawn.dashArray.back.length > 0) {
          this.backPart.dashes.clear();
          SETTINGS.parametric.drawn.dashArray.back.forEach(v => {
            this.backPart.dashes.push(v);
          });
        }

        // The temporary display is never highlighted
        this.glowingFrontPart.visible = false;
        this.glowingBackPart.visible = false;
        break;
      }

      case DisplayStyle.ApplyCurrentVariables: {
        // Use the current variables to directly modify the Two.js objects.

        // FRONT
        if (this.fillColorFront === "noFill") {
          this.frontFill.noFill();
        } else {
          this.frontGradientColor.color = this.fillColorFront;
          this.frontFill.fill = this.frontGradient;
        }

        if (this.strokeColorFront === "noStroke") {
          this.frontPart.noStroke();
        } else {
          this.frontPart.stroke = this.strokeColorFront;
        }
        // strokeWidthPercent is applied by adjustSize()

        if (this.dashArrayFront.length > 0) {
          this.frontPart.dashes.clear();
          this.dashArrayFront.forEach(v => {
            this.frontPart.dashes.push(v);
          });
        } else {
          // the array length is zero and no dash array should be set
          this.frontPart.dashes.clear();
          this.frontPart.dashes.push(0);
        }
        // BACK
        if (this.dynamicBackStyle) {
          if (Nodule.contrastFillColor(this.fillColorFront) === "noFill") {
            this.backFill.noFill();
          } else {
            this.backGradientColor.color = Nodule.contrastFillColor(
              this.fillColorFront
            );

            this.backFill.fill = this.backGradient;
          }
        } else {
          if (this.fillColorBack === "noFill") {
            this.backFill.noFill();
          } else {
            this.backGradientColor.color = this.fillColorBack;
            console.log("here 2");
            this.backFill.fill = this.backGradient;
          }
        }

        if (this.dynamicBackStyle) {
          if (
            Nodule.contrastStrokeColor(this.strokeColorFront) === "noStroke"
          ) {
            this.backPart.noStroke();
          } else {
            this.backPart.stroke = Nodule.contrastStrokeColor(
              this.strokeColorFront
            );
          }
        } else {
          if (this.strokeColorBack === "noStroke") {
            this.backPart.noStroke();
          } else {
            this.backPart.stroke = this.strokeColorBack;
          }
        }

        // strokeWidthPercent applied by adjustSizer()

        if (this.dashArrayBack.length > 0) {
          this.backPart.dashes.clear();
          this.dashArrayBack.forEach(v => {
            this.backPart.dashes.push(v);
          });
        } else {
          // the array length is zero and no dash array should be set
          this.backPart.dashes.clear();
          this.backPart.dashes.push(0);
        }

        // UPDATE the glowing object

        // Glowing Front
        // no fillColor for glowing ellipses
        this.glowingFrontPart.stroke = this.glowingStrokeColorFront;
        // strokeWidthPercent applied by adjustSize()

        // Copy the front dash properties to the glowing object
        if (this.dashArrayFront.length > 0) {
          this.glowingFrontPart.dashes.clear();
          this.dashArrayFront.forEach(v => {
            this.glowingFrontPart.dashes.push(v);
          });
        } else {
          // the array length is zero and no dash array should be set
          this.glowingFrontPart.dashes.clear();
          this.glowingFrontPart.dashes.push(0);
        }

        // Glowing Back
        // no fillColor for glowing ellipses
        this.glowingBackPart.stroke = this.glowingStrokeColorBack;
        // strokeWidthPercent applied by adjustSize()

        // Copy the back dash properties to the glowing object
        if (this.dashArrayBack.length > 0) {
          this.glowingBackPart.dashes.clear();
          this.dashArrayBack.forEach(v => {
            this.glowingBackPart.dashes.push(v);
          });
        } else {
          // the array length is zero and no dash array should be set
          this.glowingBackPart.dashes.clear();
          this.glowingBackPart.dashes.push(0);
        }
        break;
      }
    }
  }
}
