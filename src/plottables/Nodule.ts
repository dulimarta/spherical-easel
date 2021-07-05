import Two from "two.js";
import { Stylable } from "./Styleable";
import { Resizeable } from "./Resizeable";
import SETTINGS from "@/global-settings";
import { StyleOptions, StyleEditPanels } from "@/types/Styles";
import { hslaColorType, plottableProperties } from "@/types";
import { Vector3 } from "three";

export enum DisplayStyle {
  ApplyTemporaryVariables,
  ApplyCurrentVariables
}

const tmpVector = new Vector3();

/**
 * A Nodule consists of one or more TwoJS(SVG) elements
 */
export default abstract class Nodule implements Stylable, Resizeable {
  /**
   * The number that control the styling of certain colors and opacities and size if dynamicBackStyling is true
   */
  static backStyleContrast = SETTINGS.style.backStyleContrast;

  /**
   * A map that lets use look up the properties of a plottable object
   * using only the TwoJS id. Useful in the creation of icons when processing the SVG
   * in IconFactorys
   */
  public static idPlottableDescriptionMap = new Map<
    string,
    plottableProperties
  >();

  /**
   * Is this needed when we reset the sphere canvas? I'm not sure yet, so I commented out the calls to it
   * when resetting/loading.
   */
  static resetIdPlottableDescriptionMap(): void {
    Nodule.idPlottableDescriptionMap.clear();
  }

  /**
   * Add various TwoJS (SVG) elements of this nodule to appropriate layers
   * @param {Two.Group[]} layers
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
  abstract updateStyle(options: StyleOptions): void;
  /** set the glowing visual style differently depending on if selected or not */
  abstract setSelectedColoring(flag: boolean): void;

  /** Get the current style state of the Nodule */
  abstract currentStyleState(mode: StyleEditPanels): StyleOptions;
  /** Get the default style state of the Nodule */
  abstract defaultStyleState(mode: StyleEditPanels): StyleOptions;

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
    this.backStyleContrast = contrast;
  }

  static getBackStyleContrast(): number {
    return this.backStyleContrast;
  }

  /**
   * Get the back contrasting style using the value of backStyleContrast
   * Principle:
   * Contrast = 1 => no difference between front and back
   * Contrast = 0 => Nothing appears on back of sphere for colors and size reduction is maximized
   */
  static contrastFillColor(frontColor: string): string {
    if (frontColor == "noFill") {
      return "noFill";
    }
    if (frontColor == "noLabelFrontFill") {
      return "noLabelBackFill";
    }
    const hslaColor = Nodule.convertStringToHSLAObject(frontColor);
    hslaColor.l = 1 - (1 - hslaColor.l) * Nodule.backStyleContrast;
    return Nodule.convertHSLAObjectToString(hslaColor);
  }

  static contrastStrokeColor(frontColor: string): string {
    if (frontColor == "noStroke") {
      return "noStroke";
    }
    const hslaColor = Nodule.convertStringToHSLAObject(frontColor);
    hslaColor.l = 1 - (1 - hslaColor.l) * Nodule.backStyleContrast;
    return Nodule.convertHSLAObjectToString(hslaColor);
  }

  // The back linewidth can be up to 20% smaller than their front counterparts.
  static contrastStrokeWidthPercent(frontPercent: number): number {
    return frontPercent - 20 * Nodule.backStyleContrast;
  }
  // The back points can be up to 20% smaller in radius than their front counterparts.
  static contrastPointRadiusPercent(frontPercent: number): number {
    return frontPercent - 20 * (1 - Nodule.backStyleContrast);
  }
  static contrastTextScalePercent(frontPercent: number): number {
    return frontPercent - 20 * (1 - Nodule.backStyleContrast);
  }
  static convertStringToHSLAObject(
    colorStringOld: string | undefined
  ): hslaColorType {
    if (colorStringOld) {
      //remove the first 5 and last character of the string
      const colorString = colorStringOld.slice(5, -1);
      const numberArray = colorString
        .split(",")
        .map(x => x.replace("%", "").trim()); //remove the percent symbols
      if (Number(numberArray[3]) <= 0) {
        // If the alpha/opacity value is zero the color picker slider for alpha/opacity disappears and can't be returned
        numberArray[3] = "0";
      }
      return {
        h: Number(numberArray[0]),
        s: Number(numberArray[1]) / 100,
        l: Number(numberArray[2]) / 100,
        a: Number(numberArray[3])
      };
    } else {
      // This should never happen
      return {
        h: 0,
        s: 0,
        l: 0,
        a: 0
      };
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
}
