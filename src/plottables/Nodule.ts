import { Stylable } from "./Styleable";
import { Resizeable } from "./Resizeable";
import SETTINGS from "@/global-settings";
import { StyleOptions, StyleCategory } from "@/types/Styles";
import { hslaColorType, plottableProperties } from "@/types";
import { Vector3 } from "three";
import Two from "two.js";
import Color from "color";

export enum DisplayStyle {
  ApplyTemporaryVariables,
  ApplyCurrentVariables
}

const tmpVector = new Vector3();

/**
 * A Nodule consists of one or more TwoJS(SVG) elements
 */
export default abstract class Nodule implements Stylable, Resizeable {
  //public static NODULE_COUNT = 0;
  //public id = 0;
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
  abstract addToLayers(layers: Two.Group[]): void;

  /**
   * This operation reverses the action performed by addToLayers()
   */
  abstract removeFromLayers(layers?: Two.Group[]): void;

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
