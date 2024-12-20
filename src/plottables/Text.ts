import SETTINGS, { LAYER } from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";
import { Vector2 } from "three";
import {
  StyleOptions,
  StyleCategory,
  DEFAULT_TEXT_TEXT_STYLE,
  DEFAULT_TEXT_FRONT_STYLE,
  DEFAULT_TEXT_BACK_STYLE
} from "@/types/Styles";
import { svgStyleType, toSVGType } from "@/types";
import { Text as TwoJsText } from "two.js/src/text";
import { Group } from "two.js/src/group";
import { useSEStore } from "@/stores/se";
// https://stackoverflow.com/questions/76696724/how-to-import-mathjax-in-esm-modules
import "mathjax/es5/tex-svg";
import Two from "two.js"
import { TextBox } from "./TextBox";
declare const MathJax: any;

let two: Two|null = null// = new Two({fitted: true, autostart: false})

//had to name file Text so that it does not conflict with two.js/src/text
export default class Text extends Nodule {
  protected textObject: Group;
  protected glowingTextObject: TwoJsText;

  private glowingStrokeColor = SETTINGS.text.glowingStrokeColor;

  private _defaultText = "SphericalEasel";
  private _text: Array<string> = [];
  /**
   * The vector location of the Test on the default unit sphere (without the z coord)
   */
  public _locationVector = new Vector2(1, 0);

  constructor(text: string) {
    super(/* noduleName */ "None");
    // this._text = text;
    this.textObject = new Group();

    if (two === null) {
      const se = useSEStore()
      const { twoInstance } = se;
      two = twoInstance as Two
    }
    if (text.includes("$")) {
      // Does it contain a LaTeX math?
      const parts = text.split("$").filter(s => s.trim().length > 0);
      let xOffset = 0;
      let estTextHeight = 15
      parts.forEach((tok, idx) => {
        console.debug(`Placing ${tok} at offset ${xOffset}`)
        if (idx % 2 == 0) { // the token is a plain text
          this._text.push(tok)
          const plainText = new TwoJsText(tok, xOffset, 0, {
            size: SETTINGS.text.fontSize
          })
          this.textObject.add(plainText)
          const { width, height } = plainText.getBoundingClientRect()
          estTextHeight += 0.8 * height + 0.2 * estTextHeight
          console.debug(`Dimension of ${tok} is ${width}x${height}`)
          xOffset += width
        } else { // the token is a TeX equation
          const mathjax_svg: SVGElement = MathJax.tex2svg(tok, { display: true, ex:10 });
          const svg = mathjax_svg.querySelector('svg') as SVGGraphicsElement
          const g = two!!.interpret(svg, /* shallow */ false, /* add */ false)
          g.scale = new Two.Vector(0.1, -0.1)
          // TODO: how to get precise dimensions of the SVG box?
          g.translation.x = xOffset - 10;
          g.mask = undefined // This prevents TwoJS SVG renderer from generating the clip-path
          const dim1 = g.getBoundingClientRect()
          console.debug(`Dimension of of SVG ${dim1.width}x${dim1.height}`)
          const scaleFactor = estTextHeight / dim1.height
          g.scale = new Two.Vector(scaleFactor * 0.1, -scaleFactor * 0.1)
          const dim2 = g.getBoundingClientRect()
          console.debug(`Dimension of of scaled SVG ${dim2.width}x${dim2.height}`)
          xOffset += dim2.width + 8
          this.textObject.add(g)
        }
      });
    } else {
      const oneText = new TwoJsText(text, 1, 0, {
        size: SETTINGS.text.fontSize
      });
      this._text.push(text)
      this.textObject.add(oneText);
    }

    this.glowingTextObject = new TwoJsText("Test", 1, 0, {
      size: SETTINGS.text.fontSize
    });
    // Set the properties of the points that never change - stroke width and some glowing options
    this.textObject.noStroke();
    this.glowingTextObject.linewidth = SETTINGS.text.glowingStrokeWidth;
    this.glowingTextObject.visible = false;

    this.styleOptions.set(StyleCategory.Label, DEFAULT_TEXT_TEXT_STYLE);
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
    // this._svg.forEach(z => {
    //   layers[LAYER.foregroundText].add(z)
    // })
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
      case StyleCategory.Front:
        return DEFAULT_TEXT_FRONT_STYLE; //empty

      case StyleCategory.Back:
        return DEFAULT_TEXT_BACK_STYLE; //empty

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
   * Set the rendering style (flags: ApplyTemporaryVariables, ApplyCurrentVariables) of the label
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
        const labelStyle = this.styleOptions.get(StyleCategory.Label);

        const oneText: TwoJsText = this.textObject.children[0] as TwoJsText;
        oneText.value = this._text[0];
        this.glowingTextObject.value = this._text[0];
        // we may want to modify this to allow changes in the text from the style panel
        // this.textObject.value = labelStyle?.labelDisplayText ?? "TEXT ERROR"
        // this.glowingTextObject.value = labelStyle?.labelDisplayText ?? "TEXT ERROR"
        // this._text = labelStyle?.labelDisplayText ?? "TEXT ERROR"

        if (labelStyle?.labelTextStyle !== "bold") {
          oneText.style = (labelStyle?.labelTextStyle ??
            SETTINGS.label.style) as "normal" | "italic";
          this.glowingTextObject.style = (labelStyle?.labelTextStyle ??
            SETTINGS.label.style) as "normal" | "italic";
          oneText.weight = 500;
          this.glowingTextObject.weight = 500;
        } else if (labelStyle?.labelTextStyle === "bold") {
          oneText.weight = 1000;
          this.glowingTextObject.weight = 1000;
        }

        oneText.family = labelStyle?.labelTextFamily ?? SETTINGS.label.family;
        this.glowingTextObject.family =
          labelStyle?.labelTextFamily ?? SETTINGS.label.family;

        oneText.decoration = (labelStyle?.labelTextDecoration ??
          SETTINGS.label.decoration) as "none" | "underline" | "strikethrough";
        this.glowingTextObject.decoration = (labelStyle?.labelTextDecoration ??
          SETTINGS.label.decoration) as "none" | "underline" | "strikethrough";

        this.textObject.rotation = labelStyle?.labelTextRotation ?? 0;
        this.glowingTextObject.rotation = labelStyle?.labelTextRotation ?? 0;

        // FRONT = To shoehorn text into label, the front fill color is the same as overall stroke color, there are no front/back for text
        const frontFillColor =
          labelStyle?.labelFrontFillColor ?? SETTINGS.text.fillColor;
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
    this._text[0] = txt;
    (this.textObject.children[0] as TwoJsText).value = txt;
    this.glowingTextObject.value = txt;
  }
}
