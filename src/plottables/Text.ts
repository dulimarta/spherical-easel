import SETTINGS, { LAYER } from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";

import { Vector2, Vector3 } from "three";
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
import { Text as TwoJsText } from "two.js/src/text";
import { Group } from "two.js/src/group";

//had to name file Text so that it does not conflict with two.js/src/text
export default class Text extends Nodule {
  public textObject: TwoJsText;
  /**
   * The vector location of the Label on the default unit sphere
   * The location vector in the Default Screen Plane
   * It will always be the case the x and y coordinates of these two vectors are the same.
   * The sign of the z coordinate indicates if the Point is on the back of the sphere
   */
  public _locationVector = new Vector2(1, 0);
  public defaultScreenVectorLocation = new Vector(1, 0);

  constructor(noduleName: string = "None") {
    super(noduleName);
    this.textObject = new TwoJsText();
    // this.text = new TwoJsText(txt, x, y);
    // this._locationVector.x = x;
    // this._locationVector.y = -y;
  }
  //private _defaultName = "";

  /**
   * Initialize the current text scale factor that is adjusted by the zoom level and the user textPercent
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
    Text.textScaleFactor *= factor;
  }

  static isEarthMode = false;

  addToLayers(layers: Group[]): void {
    layers[LAYER.foregroundText].add(this.textObject);
  }
  removeFromLayers(layers: Group[]): void {
    layers[LAYER.foregroundText].remove(this.textObject);
  }
  adjustSize(): void {
    this.textObject.scale = Text.textScaleFactor;
    // (Text.textScaleFactor * textScalePercent) / 100; // use when text is edited using the style panel -- i.e. when textScalePercents is set as a style option
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
    //**None */
  }
  stylize(flag: DisplayStyle): void {
    /**None**/
  }
  setVisible(flag: boolean): void {
    this.textObject.visible = flag;
  }
  updateDisplay(): void {
    this.normalDisplay();
    //console.debug("Calling Text.normalDisplay();");
    /**None**/
  }
  toSVG(
    nonScaling?: {
      stroke: boolean;
      text: boolean;
      pointRadius: boolean;
      scaleFactor: number;
    },
    svgForIcon?: boolean
  ): toSVGType[] {
    // Possibly don't need this.
    /**None**/
    return [];
  }

  get boundingRectangle(): {
    bottom: number;
    height: number;
    left: number;
    right: number;
    top: number;
    width: number;
  } {
    const rect = this.textObject.getBoundingClientRect();
    return {
      bottom: rect.bottom,
      height: rect.height,
      left: rect.left,
      right: rect.right,
      top: rect.top,
      width: rect.width
    };
  }

  set positionVector(screenVector: Vector2) {
    // console.log("Calling set Text.positionVector");
    // console.log(`${screenVector.toFixed(3)}`);
    this._locationVector.set(screenVector.x, screenVector.y);
    //.multiplyScalar(SETTINGS.boundaryCircle.radius);
    // Translate the whole group (i.e. all points front/back/glowing/drawn) to the new center vector

    this.textObject.position.set(
      this._locationVector.x,
      -this._locationVector.y
    );
    //this.updateDisplay();  //<--- do not do this! disconnect the setting of position with the display, if you leave this in
    //then this turns on the display of the vertex point of the angle marker in a bad way. It turns on the
    //     // the display so that the following problem occurs.
    //     //   1. Create/Measure an angle from three new points
    //     //   2. Hide the point at the vertex
    //     //   3. Create an angle bisector
    //     //   4. Notice that the vertex point appears but is now not selectable (because the this.showing is false, but the
    //     //    actual display is showing, so it is not found in the Highligher.ts handler subclass )
    //     // I spent at least 8 hours looking for how this occurs ... :-()
  }
  get positionVector(): Vector2 {
    return this._locationVector;
  }
  set text(txt: string) {
    this.textObject.value = txt;
  }
}
