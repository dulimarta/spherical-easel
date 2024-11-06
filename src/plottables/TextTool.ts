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
  public text: Text;
  constructor(txt: string, x: number, y: number, noduleName: string = "None") {
    super(noduleName);
    this.text = new Text(txt, x, y);
  }
  /**
   * The vector location of the Label on the default unit sphere
   * The location vector in the Default Screen Plane
   * It will always be the case the x and y coordinates of these two vectors are the same.
   * The sign of the z coordinate indicates if the Point is on the back of the sphere
   */
  public _locationVector = new Vector3(1, 0, 0);
  public defaultScreenVectorLocation = new Vector(1, 0);

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
    layers[LAYER.foregroundText].add(this.text);
  }
  removeFromLayers(layers: Group[]): void {
    layers[LAYER.foregroundText].remove(this.text);
  }
  adjustSize(): void {
  }
  normalDisplay(): void {
    /** None **/
  }
  glowingDisplay(): void {
    /**None**/
  }
  setSelectedColoring(flag: boolean): void {
    /**None**/
  }
  defaultStyleState(mode: StyleCategory): StyleOptions {
    /**None**/
  }
  stylize(flag: DisplayStyle): void {
    /**None**/
  }
  setVisible(flag: boolean): void {
    /**None**/
  }
  updateDisplay(): void {
    this.normalDisplay();
    console.debug("Calling TextTool.normalDisplay();");
    /**None**/
  }
  toSVG(nonScaling?: { stroke: boolean; text: boolean; pointRadius: boolean; scaleFactor: number; }, svgForIcon?: boolean): toSVGType[] {
    // Possibly don't need this.
    /**None**/
    return [];
  }

  // setup getter for boundingRectangle -> getBoundingClientRect(); reference Label.ts in this dir.
}
