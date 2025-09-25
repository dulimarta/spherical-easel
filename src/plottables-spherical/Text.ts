import SETTINGS, { LAYER } from "@/global-settings-spherical";
import Nodule, { DisplayStyle } from "./Nodule";
import { Vector2 } from "three";
import {
  StyleOptions,
  StyleCategory,
  DEFAULT_TEXT_TEXT_STYLE
  // DEFAULT_TEXT_FRONT_STYLE,
  // DEFAULT_TEXT_BACK_STYLE
} from "@/types/Styles";
import { svgStyleType, toSVGType } from "@/types";
import { Text as TwoJsText } from "two.js/src/text";
import { Group } from "two.js/src/group";
import Label from "./Label";

//had to name the file Text so that it does not conflict with two.js/src/text
export default class Text extends Nodule {
  protected textObject: TwoJsText;
  protected glowingTextObject: TwoJsText;

  private glowingStrokeColor = SETTINGS.text.glowingStrokeColor;

  private _defaultText = "Default Text";
  // private _text = "";
  /**
   * The vector location of the Test on the default unit sphere (without the z coord)
   */
  public _locationVector = new Vector2(1, 0);

  constructor(noduleName: string = "None") {
    super(noduleName);
    this.textObject = new TwoJsText("Test", 1, 0, {
      size: SETTINGS.text.fontSize
    });
    this.glowingTextObject = new TwoJsText("Test", 1, 0, {
      size: SETTINGS.text.fontSize
    });
    // Set the properties of the points that never change - stroke width and some glowing options
    this.textObject.noStroke();
    this.glowingTextObject.linewidth = SETTINGS.text.glowingStrokeWidth;
    this.glowingTextObject.stroke = SETTINGS.text.glowingStrokeColor;
    this.glowingTextObject.visible = false;

    this.styleOptions.set(StyleCategory.Label, DEFAULT_TEXT_TEXT_STYLE);
  }

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

  glowingDisplay(): void {
    this.textObject.visible = true;
    this.glowingTextObject.visible = true;
  }

  normalDisplay(): void {
    this.textObject.visible = true;
    this.glowingTextObject.visible = false;
  }

  addToLayers(layers: Group[]): void {
    layers[LAYER.foregroundText].add(this.glowingTextObject);
    layers[LAYER.foregroundText].add(this.textObject);
  }
  removeFromLayers(layers: Group[]): void {
    layers[LAYER.foregroundText].remove(this.textObject);
    layers[LAYER.foregroundText].remove(this.glowingTextObject);
  }
  updateDisplay(): void {
    this.normalDisplay();
  }
  setVisible(flag: boolean): void {
    if (!flag) {
      this.textObject.visible = false;
      this.glowingTextObject.visible = false;
    } else {
      this.normalDisplay();
    }
  }

  // setSelectedColoring(flag: boolean): void {
  //   //set the new colors into the variables
  //   if (flag) {
  //     this.glowingStrokeColor = SETTINGS.style.selectedColor.front;
  //   } else {
  //     this.glowingStrokeColor = SETTINGS.text.glowingStrokeColor;
  //   }
  //   // apply the new color variables to the object
  //   this.stylize(DisplayStyle.ApplyCurrentVariables);
  // }

  /**
   * Copies the style options set by the Style Panel into the style variables and then updates the
   * js objects (with adjustSize and stylize(ApplyVariables))
   * @param options The style options
   */
  updateStyle(mode: StyleCategory, options: StyleOptions): void {
    super.updateStyle(mode, options);
  }

  /**
   * Return the default style state
   */
  defaultStyleState(panel: StyleCategory): StyleOptions {
    // throw new Error(
    //   "Called defaultStyleState in Text with non-Label panel."
    // );
    switch (panel) {
      case StyleCategory.Label:
        return {
          ...DEFAULT_TEXT_TEXT_STYLE,
          labelDisplayText: this._defaultText
        };
      // case StyleCategory.Front:
      //   return DEFAULT_TEXT_FRONT_STYLE; //empty

      // case StyleCategory.Back:
      //   return DEFAULT_TEXT_BACK_STYLE; //empty

      default:
        return {};
    }
  }
  /**
   * Sets the variables for point radius glowing/not
   */
  adjustSize(): void {
    // console.log("Text adjust size")
    const labelStyle = this.styleOptions.get(StyleCategory.Label);
    const textScalePercent = labelStyle?.labelTextScalePercent ?? 100;
    this.textObject.scale = (Text.textScaleFactor * textScalePercent) / 100;
    this.glowingTextObject.scale =
      (Text.textScaleFactor * textScalePercent) / 100;
  }

  /**
   * Set the rendering style (flags: ApplyTemporaryVariables, ApplyCurrentVariables) of the text
   *
   * ApplyTemporaryVariables means that
   *    1) The temporary variables from SETTINGS.point.temp are copied into the actual js objects
   *    2) The pointScaleFactor is copied from the Point.pointScaleFactor (which accounts for the Zoom magnification) into the actual js objects
   *
   * Apply CurrentVariables means that all current values of the private style variables are copied into the actual js objects
   */
  stylize(flag: DisplayStyle): void {
    switch (flag) {
      case DisplayStyle.ApplyTemporaryVariables: {
        // There is no temporary text so this should never be called
        break;
      }

      case DisplayStyle.ApplyCurrentVariables: {
        // Use the current variables to directly modify the js objects.
        const textStyle = this.styleOptions.get(StyleCategory.Label);

        // we may want to modify this to allow changes in the text from the style panel
        // console.log("Set text in",this.name,"name=",textStyle?.labelDisplayText )
        this.textObject.value = textStyle?.labelDisplayText ?? "TEXT ERROR";
        this.glowingTextObject.value =
          textStyle?.labelDisplayText ?? "TEXT ERROR";
        // this._text = textStyle?.labelDisplayText ?? "TEXT ERROR"

        if (textStyle?.labelTextStyle !== "bold") {
          this.textObject.style = (textStyle?.labelTextStyle ??
            SETTINGS.label.style) as "normal" | "italic";
          this.glowingTextObject.style = (textStyle?.labelTextStyle ??
            SETTINGS.label.style) as "normal" | "italic";
          this.textObject.weight = 500;
          this.glowingTextObject.weight = 500;
        } else if (textStyle?.labelTextStyle === "bold") {
          this.textObject.weight = 1000;
          this.glowingTextObject.weight = 1000;
        }

        this.textObject.family =
          textStyle?.labelTextFamily ?? SETTINGS.label.family;
        this.glowingTextObject.family =
          textStyle?.labelTextFamily ?? SETTINGS.label.family;

        this.textObject.decoration = (textStyle?.labelTextDecoration ??
          SETTINGS.label.decoration) as "none" | "underline" | "strikethrough";
        this.glowingTextObject.decoration = (textStyle?.labelTextDecoration ??
          SETTINGS.label.decoration) as "none" | "underline" | "strikethrough";

        this.textObject.rotation = textStyle?.labelTextRotation ?? 0;
        this.glowingTextObject.rotation = textStyle?.labelTextRotation ?? 0;

        // FRONT = To shoehorn text into label, the front fill color is the same as overall stroke color, there are no front/back for text
        const frontFillColor =
          textStyle?.labelFrontFillColor ?? SETTINGS.text.fillColor;
        if (Nodule.rgbaIsNoFillOrNoStroke(frontFillColor)) {
          this.textObject.noFill();
        } else {
          this.textObject.fill = frontFillColor;
        }
        this.glowingTextObject.stroke = this.glowingStrokeColor;

        break;
      }
    }
  }

  toSVG(nonScaling?: {
    stroke: boolean;
    text: boolean;
    pointRadius: boolean;
    scaleFactor: number;
  }): toSVGType[] {
    // Create an empty return type and then fill in the non-null parts
    const returnSVGObject: toSVGType = {
      frontGradientDictionary: null,
      backGradientDictionary: null,
      frontStyleDictionary: null,
      backStyleDictionary: null,
      layerSVGArray: [],
      type: "text"
    };

    const frontReturnDictionary = new Map<svgStyleType, string>();
    frontReturnDictionary.set("font-family", this.textObject.family);
    frontReturnDictionary.set("font-style", this.textObject.style);
    frontReturnDictionary.set("font-weight", String(this.textObject.weight));
    frontReturnDictionary.set("text-decoration", this.textObject.decoration);
    frontReturnDictionary.set(
      "fill",
      String(this.textObject.fill).slice(0, 7) // separate out the alpha channel
    );
    frontReturnDictionary.set(
      "fill-opacity",
      String(Number("0x" + String(this.textObject.fill).slice(7)) / 255) // separate out the alpha channel
    );
    returnSVGObject.frontStyleDictionary = frontReturnDictionary;

    let svgFrontString =
      "<text " +
      Label.svgTransformMatrixString(
        this.textObject.rotation,
        nonScaling?.text
          ? 1 / nonScaling.scaleFactor
          : (this.textObject.scale as number),
        this.textObject.position.x,
        this.textObject.position.y
      );

    svgFrontString += ">" + this.textObject.value + "</text>";
    returnSVGObject.layerSVGArray.push([LAYER.foregroundText, svgFrontString]);
    //console.log("text front style dictionary", returnSVGObject.frontStyleDictionary)
    return [returnSVGObject];
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
    this.glowingTextObject.position.set(
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
    // this._text = txt;
    this.updateStyle(StyleCategory.Label, {
      labelDisplayText: txt
    });
    this.stylize(DisplayStyle.ApplyCurrentVariables);
  }
  get text(): string {
    const textStyle = this.styleOptions.get(StyleCategory.Label);
    return textStyle?.labelDisplayText ?? "";
  }

  public setDefaultText(txt: string): void {
    this._defaultText = txt;
  }
}
