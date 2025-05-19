import { Stylable } from "./Styleable";
import { Resizeable } from "./Resizeable";
import SETTINGS from "@/global-settings";
import { StyleOptions, StyleCategory } from "@/types/Styles";
import {
  svgArcObject,
  svgGradientType,
  svgStopType,
  svgStyleType,
  toSVGType
} from "@/types";
import { Vector3 } from "three";
import { Group } from "two.js/src/group";
import convert from "color-convert";
import { Matrix } from "two.js/src/matrix";
import { Stop } from "two.js/src/effects/stop";
import { RadialGradient } from "two.js/src/effects/radial-gradient";
import { Path } from "two.js/src/path";

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
  private _showing = true;
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

  protected styleOptions: Map<StyleCategory, StyleOptions> = new Map();

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
  // /** set the glowing visual style differently depending on if selected or not */
  // abstract setSelectedColoring(flag: boolean): void;

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
  abstract toSVG(
    nonScaling?: {
      stroke: boolean;
      text: boolean;
      pointRadius: boolean;
      scaleFactor: number;
    },
    svgForIcon?: boolean
  ): toSVGType[];

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

  // some parts of each segment may not be long enough to add to the polygon or to the segment arc objects this function helps check that
  static longEnoughToAdd(path: Path): boolean {
    const matrix = path.matrix;
    var start = matrix.multiply(path.vertices[0].x, path.vertices[0].y, 1);
    var end = matrix.multiply(
      path.vertices[path.vertices.length - 1].x,
      path.vertices[path.vertices.length - 1].y,
      1
    );
    return (
      (start[0] - end[0]) * (start[0] - end[0]) +
        (start[1] - end[1]) * (start[1] - end[1]) >
      1
    );
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
      object.endPt.x.zeroOut() + " " + object.endPt.y.zeroOut() + " ";
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
      (object.displayCCW0OrCW1 == 1 ? 0 : 1) +
      " ";
    svgReturnString +=
      object.startPt.x.zeroOut() + " " + object.startPt.y.zeroOut() + " ";
    return svgReturnString;
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

  static createSVGGradientDictionary(
    gradient: RadialGradient,
    centerStop: Stop,
    colorStop: Stop
  ): Map<svgGradientType, string | Map<svgStopType, string>[]> {
    const returnDictionary = new Map<
      svgGradientType,
      string | Map<svgStopType, string>[]
    >();
    returnDictionary.set("cx", String(gradient.center.x));
    returnDictionary.set("cy", String(gradient.center.y));
    returnDictionary.set("fx", String(gradient.focal.x));
    returnDictionary.set("fy", String(gradient.focal.y));
    returnDictionary.set("gradientUnits", gradient.units);
    returnDictionary.set("r", String(SETTINGS.boundaryCircle.radius));
    returnDictionary.set("spreadMethod", "pad");
    const stop1FrontDictionary = new Map<svgStopType, string>();
    stop1FrontDictionary.set("offset", String(centerStop.offset * 100) + "%");

    stop1FrontDictionary.set(
      "stop-color",
      String(centerStop.color).slice(0, 7) // separate out the alpha channel
    );
    stop1FrontDictionary.set(
      "stop-opacity",
      String(Number("0x" + String(centerStop.color).slice(7)) / 255) // separate out the alpha channel
    );
    const stop2FrontDictionary = new Map<svgStopType, string>();
    stop2FrontDictionary.set("offset", String(colorStop.offset * 100) + "%");

    stop2FrontDictionary.set(
      "stop-color",
      String(colorStop.color).slice(0, 7) // separate out the alpha channel
    );
    stop2FrontDictionary.set(
      "stop-opacity",
      String(Number("0x" + String(colorStop.color).slice(7)) / 255) // separate out the alpha channel
    );

    returnDictionary.set("stops", [stop1FrontDictionary, stop2FrontDictionary]);

    return returnDictionary;
  }

  static createSVGStyleDictionary(args: {
    strokeObject?: Path;
    fillObject?: Path;
    strokeScale?: number;
  }): Map<svgStyleType, string> {
    const returnStyleDictionary = new Map<svgStyleType, string>();

    // Collect the style information: fill, stroke, stroke-width
    if (args.fillObject && typeof args.fillObject.fill == "string") {
      returnStyleDictionary.set(
        "fill",
        String(args.fillObject.fill).slice(0, 7) // separate out the alpha channel
      );
      returnStyleDictionary.set(
        "fill-opacity",
        String(Number("0x" + String(args.fillObject.fill).slice(7)) / 255) // separate out the alpha channel
      );
    } else {
      returnStyleDictionary.set("fill", "none"); // if the fill is a gradient, this will be overwritten in Command.ts, if the fill is a color it won't be overwritten
    }

    if (args.strokeObject && typeof args.strokeObject.stroke == "string") {
      returnStyleDictionary.set(
        "stroke",
        String(args.strokeObject.stroke).slice(0, 7) // separate out the alpha channel
      );
      returnStyleDictionary.set(
        "stroke-opacity",
        String(Number("0x" + String(args.strokeObject.stroke).slice(7)) / 255) // separate out the alpha channel
      );
      const scale = args.strokeScale == undefined ? 1 : args.strokeScale;
      returnStyleDictionary.set(
        "stroke-width",
        String(args.strokeObject.linewidth * scale)
      );
      returnStyleDictionary.set("stroke-linecap", args.strokeObject.cap);
      returnStyleDictionary.set("stroke-linejoin", args.strokeObject.join);
      returnStyleDictionary.set(
        "stroke-miterlimit",
        String(args.strokeObject.miter)
      );
      // check to see if there is any dashing for the front of circle
      if (
        !(
          args.strokeObject.dashes.length == 2 &&
          args.strokeObject.dashes[0] == 0 &&
          args.strokeObject.dashes[1] == 0
        )
      ) {
        var dashString = "";
        for (let num = 0; num < args.strokeObject.dashes.length; num++) {
          dashString += args.strokeObject.dashes[num] + " ";
        }
        returnStyleDictionary.set("stroke-dasharray", dashString);
      }
    } else {
      returnStyleDictionary.set("stroke", "none");
    }
    return returnStyleDictionary;
  }

  static setGradientFill(value: boolean): void {
    console.log("set Gradient Fill?", value)
    this.globalGradientFill = value;
  }

  static getGradientFill(): boolean {
    console.log("get Gradient Fill?", this.globalGradientFill)
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
      Nodule.rgbaIsNoFillOrNoStroke(frontColor) ||
      Nodule.globalBackStyleContrast === 0
    ) {
      return "#00000000"; // transparent
    }
    if (frontColor != undefined) {
      const hexColorString = frontColor.slice(1, 7);
      const alphaString = frontColor.slice(7);
      const hslArray = convert.hex.hsl.raw(hexColorString);
      const newLValue =
        1 - (1 - hslArray[2] / 100) * Nodule.globalBackStyleContrast;
      return (
        "#" +
        convert.hsl.hex([hslArray[0], hslArray[1], newLValue * 100]) +
        alphaString
      );
    }
    return "#00000011"; //solid black = failure of the the method
  }
  static contrastStrokeColor(frontColor: string | undefined): string {
    if (
      Nodule.rgbaIsNoFillOrNoStroke(frontColor) ||
      Nodule.globalBackStyleContrast === 0
    ) {
      return "#00000000"; // transparent
    }
    if (frontColor != undefined) {
      const hexColorString = frontColor.slice(1, 7);
      const alphaString = frontColor.slice(7);
      const hslArray = convert.hex.hsl.raw(hexColorString);
      const newLValue =
        1 - (1 - hslArray[2] / 100) * Nodule.globalBackStyleContrast;
      return (
        "#" +
        convert.hsl.hex([hslArray[0], hslArray[1], newLValue * 100]) +
        alphaString
      );
    }
    return "#00000011"; //solid black = failure of the the method
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

  static rgbaIsNoFillOrNoStroke(colorStringOld: string | undefined): boolean {
    if (colorStringOld === undefined) return true;
    if (colorStringOld === "none") return true;
    if (
      colorStringOld.startsWith("#") &&
      colorStringOld.length == 9 &&
      colorStringOld.endsWith("00")
    )
      return true;
    return false;
  }

  /** Get the current style state of the Nodule */
  currentStyleState(mode: StyleCategory): StyleOptions {
    // console.log("current style state of ", this.name, this.styleOptions.get(mode))
    return this.styleOptions.get(mode) ?? {};
  }
  /**
   * Copies the style options set by the Style Panel into the style variables and then updates the
   * js objects (with adjustSize and stylize(ApplyVariables))
   * @param options The style options
   */
  updateStyle(mode: StyleCategory, options: StyleOptions): void {
    // console.log("Update style of plottable", this, "using", options);
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
    // console.log("Set showing in Nodule to ", b)
    this._showing = b;
    this.setVisible(b);
  }

  get showing(): boolean {
    return this._showing;
  }
}
