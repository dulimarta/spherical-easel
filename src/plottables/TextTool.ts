import SETTINGS, { LAYER } from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";

import { Vector3 } from "three";
import {
  StyleOptions,
  StyleCategory,
  DEFAULT_LABEL_TEXT_STYLE
} from "@/types/Styles";
import {
  LabelDisplayMode,
  LabelParentTypes,
  svgStyleType,
  toSVGType
} from "@/types";
import { ValueDisplayMode } from "@/types";
//import Two from "two.js";
import { Vector } from "two.js/src/vector";
import { Text } from "two.js/src/text";
import { Group } from "two.js/src/group";

//had to name file TextTool so that it does not conflict wit two.js/src/text
export default class TextTool extends Nodule {
  /**
   * The vector location of the Label on the default unit sphere
   * The location vector in the Default Screen Plane
   * It will always be the case the x and y coordinates of these two vectors are the same.
   * The sign of the z coordinate indicates if the Point is on the back of the sphere
   */
  public _locationVector = new Vector3(1, 0, 0);
  public defaultScreenVectorLocation = new Vector(1, 0);

  /**
   * The TwoJS objects that are used to display the label.
   * One is for the front, the other for the back. Only one is displayed at a time
   */
  protected Text = new Text("Test", 1, 0, {
    size: SETTINGS.label.fontSize
  });


  //private _defaultName = "";

  /**
   * Initialize the current point scale factor that is adjusted by the zoom level and the user pointRadiusPercent
   * Set with text.scale=this.scale;
   */
  static textScaleFactor = 1;
  /**
   * Update the text scale factor -- the text is drawn of the default size in the constructor
   * so to account for the zoom magnification we only need to keep track of the scale factor (which is
   * really just one over the current magnification factor) and then scale the text on the zoom event.
   * This is accomplished by the adjustSize() method
   * @param factor The ratio of the old magnification factor over the new magnification factor
   */
  static updateTextScaleFactorForZoom(factor: number): void {
    TextTool.textScaleFactor *= factor;
  }

  static isEarthMode = false;



  addToLayers(layers: Group[]): void {
    layers[LAYER.glassLayer].add(this.Text);
    throw new Error("Method not implemented.");
  }
  removeFromLayers(layers: Group[]): void {
    layers[LAYER.glassLayer].remove(this.Text);
    throw new Error("Method not implemented.");
  }
  adjustSize(): void {
    throw new Error("Method not implemented.");
  }
  normalDisplay(): void {
    throw new Error("Method not implemented.");
  }
  glowingDisplay(): void {
    throw new Error("Method not implemented.");
  }
  setSelectedColoring(flag: boolean): void {
    throw new Error("Method not implemented.");
  }
  defaultStyleState(mode: StyleCategory): StyleOptions {
    throw new Error("Method not implemented.");
  }
  stylize(flag: DisplayStyle): void {
    throw new Error("Method not implemented.");
  }
  setVisible(flag: boolean): void {
    throw new Error("Method not implemented.");
  }
  updateDisplay(): void {
    this.normalDisplay();
    throw new Error("Method not implemented.");
  }
  toSVG(nonScaling?: { stroke: boolean; text: boolean; pointRadius: boolean; scaleFactor: number; }, svgForIcon?: boolean): toSVGType[] {
    throw new Error("Method not implemented.");
  }
}
