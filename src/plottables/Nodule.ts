import { Stylable } from "./Styleable";
import { Resizeable } from "./Resizeable";
import SETTINGS from "@/global-settings";
import { StyleOptions, StyleCategory } from "@/types/Styles";
import {
  hslaColorType,
  plottableProperties,
  svgArcObject,
  toSVGType
} from "@/types";
import { Vector3 } from "three";
//import Two from "two.js";
import { Group } from "two.js/src/group";
import Color from "color";
import { Matrix } from "two.js/src/matrix";

export enum DisplayStyle {
  ApplyTemporaryVariables,
  ApplyCurrentVariables
}

const tmpVector = new Vector3();

/**
 * A Nodule consists of one or more TwoJS(SVG) elements
 */
export default abstract class Nodule implements Stylable, Resizeable {
  // public static NODULE_COUNT = 0; // useful for export to SVG to identify arc objects
  // public id = 0;
  /* If the object is not visible then showing = true (The user can hide objects)*/
  protected _showing = true;
  readonly name: string = "<noname-nodule>";

  constructor(noduleName: string) {
    this.name = noduleName;
    // this.id = Nodule.NODULE_COUNT;
    // Nodule.NODULE_COUNT++;
  }

  /**
   * The number that control the styling of certain colors and opacities and size if dynamicBackStyling is true
   */
  static globalBackStyleContrast = SETTINGS.style.backStyleContrast;

  /** Draw the fills using a gradient or not */
  static globalGradientFill = SETTINGS.style.fill.gradientFill;

  /**
   * A map that lets use look up the properties of a plottable object
   * using only the TwoJS id. Useful in the creation of icons when processing the SVG
   * in IconFactory
   */
  public static idPlottableDescriptionMap = new Map<
    string,
    plottableProperties
  >();

  protected styleOptions: Map<StyleCategory, StyleOptions> = new Map();
  /**
   * Is this needed when we reset the sphere canvas? I'm not sure yet, so I commented out the calls to it
   * when resetting/loading.
   */
  static resetIdPlottableDescriptionMap(): void {
    Nodule.idPlottableDescriptionMap.clear();
  }

  /**
   * Add various TwoJS (SVG) elements of this nodule to appropriate layers
   * @param {Group[]} layers
   */
  abstract addToLayers(layers: Group[]): void;

  /**
   * This operation reverses the action performed by addToLayers()
   */
  abstract removeFromLayers(layers?: Group[]): void;

  /**This operation constraint the visual properties (linewidth, circle size, etc) when the view is zoomed in/out */
  abstract adjustSize(): void;

  /** Update visual style(s) */
  abstract normalDisplay(): void;
  abstract glowingDisplay(): void;
  /** set the glowing visual style differently depending on if selected or not */
  abstract setSelectedColoring(flag: boolean): void;

  /** Get the default style state of the Nodule */
  abstract defaultStyleState(mode: StyleCategory): StyleOptions;

  /** Set the temporary/glowing/default/updated style*/
  abstract stylize(flag: DisplayStyle): void;

  /** Hide the object if flag = false, set normalDisplay() if flag = true  */
  abstract setVisible(flag: boolean): void;

  /**
   * Update the display of the object called after all the necessary variables have been set so
   * an updated object will be rendered correctly
   */
  abstract updateDisplay(): void;

  /**
   * Export to SVG code
   */
  abstract toSVG(): toSVGType[];

  /**
   * startPt is a point on the the boundary of the display circle,
   * this method returns an ordered list of numPoints points from startPoint for and
   * angular length of angularLength in the direction of yAxis.
   * This returns an array of point on the boundary circle so that the angle subtended at the origin between
   * any two consecutive ones is equal and equal to the angle between the first returned to startPt. The last one is
   * a equal measure less than angularLength
   *
   * yAxis must be perpendicular to startPt
   *
   * Used in Circle.ts and Polygon.ts
   */
  static boundaryCircleCoordinates(
    startPt: number[],
    numPoints: number,
    yAxis: number[],
    angularLength: number
  ): number[][] {
    const xAxisVector = new Vector3(startPt[0], startPt[1], 0).normalize();
    const yAxisVector = new Vector3(yAxis[0], yAxis[1], 0).normalize();
    const returnArray = [];
    const tmpVector = new Vector3();

    for (let i = 0; i < numPoints; i++) {
      tmpVector.set(0, 0, 0);
      tmpVector.addScaledVector(
        xAxisVector,
        Math.cos((i + 1) * (angularLength / (numPoints + 1)))
      );
      tmpVector.addScaledVector(
        yAxisVector,
        Math.sin((i + 1) * (angularLength / (numPoints + 1)))
      );
      // now scale to the radius of the boundary circle
      tmpVector.normalize().multiplyScalar(SETTINGS.boundaryCircle.radius);

      returnArray.push([tmpVector.x, tmpVector.y]);
    }
    return returnArray;
  }

  /**  The cotangent function used in Circle and Anglemarker*/
  static ctg(x: number): number {
    return 1 / Math.tan(x);
  }

  /**
   * For the ellipse which is the projection of the circle (of radius circleRadius and rotated rotations)
   * onto the view plane (in the unit circle),
   * @param t
   * @returns Return the coordinates of a point with parameter value t
   */
  public static pointOnProjectedEllipse(
    centerVector: Vector3,
    circleRadius: number,
    t: number
  ): Array<number> {
    const beta = Math.acos(centerVector.z);
    const rotation = -Math.atan2(centerVector.x, centerVector.y);
    return [
      (Math.sqrt(2 - Math.cos(circleRadius) ** 2) *
        Math.cos(rotation) *
        Math.sin(t)) /
        Math.sqrt(2 + Nodule.ctg(circleRadius) ** 2) -
        (Math.cos(t) * Math.cos(beta) * Math.sin(circleRadius) +
          Math.cos(circleRadius) * Math.sin(beta)) *
          Math.sin(rotation),
      Math.cos(t) *
        Math.cos(beta) *
        Math.cos(rotation) *
        Math.sin(circleRadius) +
        Math.cos(circleRadius) * Math.cos(rotation) * Math.sin(beta) +
        (Math.sqrt(2 - Math.cos(circleRadius) ** 2) *
          Math.sin(t) *
          Math.sin(rotation)) /
          Math.sqrt(2 + Nodule.ctg(circleRadius) ** 2)
    ];
  }

  /**
   *
   * @param object
   * @returns string of startPointX startPointX A radiusX radiusY rotation displayFlag1 displayFlag2 ednPointX endPointy
   */
  static svgArcString(object: svgArcObject, includeStart?: boolean): string {
    let svgReturnString = "";
    if (includeStart == undefined || includeStart == false) {
      svgReturnString += " A";
    } else {
      svgReturnString +=
        "M" +
        object.startPt.x.zeroOut() +
        " " +
        object.startPt.y.zeroOut() +
        " A";
    }
    svgReturnString += object.radiiXYWithSpace;
    svgReturnString += object.rotationDegrees + " ";
    svgReturnString +=
      object.displayShort0OrLong1 + " " + object.displayCCW0OrCW1 + " ";
    svgReturnString +=
      object.endPt.x.zeroOut() + " " + object.endPt.y.zeroOut()+" ";
    return svgReturnString;
  }

  /**
   *
   * @param object
   * @returns string of endPointX endPointX A radiusX radiusY rotation displayFlag1 displayFlag2 startPointX startPointy
   */
  static svgArcStringReverse(
    object: svgArcObject,
    includeStart?: boolean
  ): string {
    let svgReturnString = "";
    if (includeStart == undefined || includeStart == false) {
      svgReturnString += " A";
    } else {
      svgReturnString =
        "M" + object.endPt.x.zeroOut() + " " + object.endPt.y.zeroOut() + " A";
    }
    svgReturnString += object.radiiXYWithSpace;
    svgReturnString += object.rotationDegrees + " ";
    svgReturnString +=
      object.displayShort0OrLong1 +
      " " +
      (object.displayCCW0OrCW1 == 1 ? 0 : 1) + " ";
    svgReturnString +=
      object.startPt.x.zeroOut() + " " + object.startPt.y.zeroOut() +" ";
    return svgReturnString;
  }

  //** Applies matrix to the start and end point and changes the rotation to rot */
  static applyMatrixToSVGArcString(
    object: svgArcObject,
    mat: Matrix,
    rot: number
  ): svgArcObject {
    let coords = mat.multiply(object.startPt.x, object.startPt.y, 1);
    object.startPt.x = coords[0];
    object.startPt.y = coords[1];
    coords = mat.multiply(object.endPt.x, object.endPt.y, 1);
    object.endPt.x = coords[0];
    object.endPt.y = coords[1];
    object.rotationDegrees = rot;
    return object;
  }

  static svgTransformMatrixString(
    rotation: number,
    scale: number,
    xPosition: number,
    yPosition: number
  ): string {
    return (
      'transform="matrix(' +
      String(Math.cos(rotation) * Number(scale)) +
      "," +
      String(Math.sin(rotation) * Number(scale)) +
      "," +
      String(-Math.sin(rotation) * Number(scale)) +
      "," +
      String(Math.cos(rotation) * Number(scale)) +
      "," +
      String(xPosition) +
      "," +
      String(yPosition) +
      ')" '
    );
  }

  static setGradientFill(value: boolean): void {
    this.globalGradientFill = value;
  }

  static getGradientFill(): boolean {
    return this.globalGradientFill;
  }

  static setBackStyleContrast(contrast: number): void {
    this.globalBackStyleContrast = contrast;
  }

  static getBackStyleContrast(): number {
    return this.globalBackStyleContrast;
  }
  /**
   * Get the back contrasting style using the value of globalBackStyleContrast
   * Principle:
   * Contrast = 1 => no difference between front and back
   * Contrast = 0 => Nothing appears on back of sphere for colors and size reduction is maximized
   */
  static contrastFillColor(frontColor: string | undefined): string {
    if (
      Nodule.hslaIsNoFillOrNoStroke(frontColor) ||
      Nodule.globalBackStyleContrast === 0
    ) {
      return "hsla(0,0%,0%,0)";
    }

    const hslaColor = Nodule.convertStringToHSLAObject(frontColor);
    hslaColor.l = 1 - (1 - hslaColor.l) * Nodule.globalBackStyleContrast;
    return Nodule.convertHSLAObjectToString(hslaColor);
  }

  static contrastStrokeColor(frontColor: string | undefined): string {
    if (
      Nodule.hslaIsNoFillOrNoStroke(frontColor) ||
      Nodule.globalBackStyleContrast === 0
    ) {
      return "hsla(0,0%,0%,0)";
    }
    const hslaColor = Nodule.convertStringToHSLAObject(frontColor);
    hslaColor.l = 1 - (1 - hslaColor.l) * Nodule.globalBackStyleContrast;
    return Nodule.convertHSLAObjectToString(hslaColor);
  }

  // The back linewidth can be up to 20% smaller than their front counterparts.
  static contrastStrokeWidthPercent(frontPercent: number): number {
    return frontPercent - 20 * Nodule.globalBackStyleContrast;
  }
  // The back points can be up to 20% smaller in radius than their front counterparts.
  static contrastPointRadiusPercent(frontPercent: number): number {
    return frontPercent - 20 * (1 - Nodule.globalBackStyleContrast);
  }
  static contrastTextScalePercent(frontPercent: number): number {
    return frontPercent - 20 * (1 - Nodule.globalBackStyleContrast);
  }
  static convertStringToHSLAObject(
    colorStringOld: string | undefined
  ): hslaColorType {
    if (colorStringOld) {
      const numberArray = Color(colorStringOld).hsl().array();
      if (numberArray.length < 4) {
        // Alpha value is missing (or not parsed), default alpha to 1.0 (fully opaque)
        let alpha: number = 1;
        if (colorStringOld.startsWith("#") && colorStringOld.length === 9) {
          // If we have 8 hex digits, positions 7 and 8 are the alpha value
          const alphaHexString = colorStringOld.substring(7);
          alpha = parseInt(alphaHexString, 16) / 255;
        }
        numberArray.push(alpha);
      }
      return {
        h: numberArray[0],
        s: numberArray[1] / 100,
        l: numberArray[2] / 100,
        a: numberArray[3]
      };
    } else {
      // This should never happen
      throw new Error(`Color string is undefined`);
    }
  }
  static hslaIsNoFillOrNoStroke(colorStringOld: string | undefined): boolean {
    if (colorStringOld === undefined) return true;
    if (colorStringOld === "none") return true;
    if (colorStringOld?.startsWith("#")) return false;
    if (colorStringOld) {
      const { h, s, l, a } = Nodule.convertStringToHSLAObject(colorStringOld);
      if (h === 0 && s === 0 && l === 0 && a === 0) return true;
      return (
        Number.isNaN(h) || Number.isNaN(s) || Number.isNaN(l) || Number.isNaN(a)
      );
    } else {
      throw new Error(`Color string is undefined`);
    }
  }
  static convertHSLAObjectToString(colorObject: hslaColorType): string {
    // if (colorObject.a == undefined || colorObject.a == 0) {
    //   // If the alpha/opacity value is zero the color picker slider for alpha/opacity disappears and can't be returned
    //   colorObject.a = 0.001;
    //   //this.displayOpacityZeroMessage = true;
    // }
    return (
      "hsla(" +
      colorObject.h +
      ", " +
      colorObject.s * 100 +
      "%, " +
      colorObject.l * 100 +
      "%, " +
      colorObject.a +
      ")"
    );
  }

  /** Get the current style state of the Nodule */
  currentStyleState(mode: StyleCategory): StyleOptions {
    return this.styleOptions.get(mode) ?? {};
  }
  /**
   * Copies the style options set by the Style Panel into the style variables and then updates the
   * js objects (with adjustSize and stylize(ApplyVariables))
   * @param options The style options
   */
  updateStyle(mode: StyleCategory, options: StyleOptions): void {
    // console.debug("Update style of plottable", this, "using", options);
    const currentOptions = this.styleOptions.get(mode);
    // console.log(
    //   "mode",
    //   mode,
    //   "options",
    //   options,
    //   "current options",
    //   currentOptions
    // );
    this.styleOptions.set(mode, { ...currentOptions, ...options });
    // console.log("style options", this.styleOptions);
    // Now apply the style and size
    this.stylize(DisplayStyle.ApplyCurrentVariables);
    this.adjustSize();
  }

  set showing(b: boolean) {
    this._showing = b;
    this.setVisible(b);
  }

  get showing(): boolean {
    return this._showing;
  }
}
