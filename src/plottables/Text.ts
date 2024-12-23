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
import { toSVGType } from "@/types";
import { Text as TwoJsText } from "two.js/src/text";
import { Group } from "two.js/src/group";
import { Path } from "two.js/src/path";

// https://stackoverflow.com/questions/76696724/how-to-import-mathjax-in-esm-modules
import "mathjax/es5/tex-svg";
import Two from "two.js";
declare const MathJax: any;

let two = new Two({ fitted: true, autostart: false });
const TEX_OPTIONS = { display: true, ex: 10 };
const TEXT_HEIGHT = 8; // Why 8? it seems to work :-)

console.debug("MJ Config", MathJax.config);

//had to name the file Text so that it does not conflict with two.js/src/text
export default class Text extends Nodule {
  protected textObject: Group;
  // protected glowingTextObject: Group;

  // private glowingStrokeColor = SETTINGS.text.glowingStrokeColor;

  private _defaultText = "SphericalEasel";
  /**
   * The vector location of the Test on the default unit sphere (without the z coord)
   */
  public _locationVector = new Vector2(1, 0);
  static mathJaxScaleFactor = 0;

  constructor(text: string, noduleName: string = "None") {
    super(noduleName);
    // this.textObject = new Group();
    // this.glowingTextObject = new Group();

    if (Text.mathJaxScaleFactor === 0) {
      // Compute the scale factor based on the height of lowercase 'm'
      const em: SVGElement = MathJax.tex2svg("\\text{m}", TEX_OPTIONS);
      const em_svg = em.querySelector("svg") as SVGGraphicsElement;
      const em_group = two.interpret(em_svg, true, false);
      em_group.mask = undefined;
      em_group.scale = new Two.Vector(1, -1);
      const em_box2 = em_group.getBoundingClientRect();
      Text.mathJaxScaleFactor = TEXT_HEIGHT / em_box2.height;
    }
    this.textObject = this.setupUsing(text);
    console.debug("Text group is", this.textObject);

    // Set the properties of the points that never change - stroke width and some glowing options
    // this.textObject.noStroke();
    // this.glowingTextObject.linewidth = SETTINGS.text.glowingStrokeWidth;
    // this.glowingTextObject.visible = false;

    this.styleOptions.set(StyleCategory.Label, DEFAULT_TEXT_TEXT_STYLE);
  }

  setupUsing(text: string): Group {
    // Wrap non-Tex tokens inside \text{}, and remove $
    // "Hello $\alpha$" becomes "\text{Hello} \alpha"
    // "Hello world" becomes "\text{Hello world}"
    let asTex: string;
    asTex = text
      .split("$")
      // Wrap non-TeX tokens in \text{___}
      .map((tok, idx) => (idx % 2 === 0 ? `\\text{${tok}}` : tok))
      .join("");
    const mathjax_svg: SVGElement = MathJax.tex2svg(asTex, TEX_OPTIONS);
    const svg = mathjax_svg.querySelector("svg") as SVGElement;
    // FALSE FALSE: ok
    // FALSE TRUE: ok
    // TRUE FALSE: ok
    // TRUE TRUE: does not show up
    console.debug("Parsed SVG", svg);
    const g = two!!.interpret(svg, /* shallow */ false, /* add */ false);
    g.scale = new Two.Vector(Text.mathJaxScaleFactor, -Text.mathJaxScaleFactor);
    g.mask = undefined; // This prevents TwoJS SVG renderer from generating the clip-path
    console.debug("TeX group is", g.id);
    return g;
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
    // this.glowingTextObject.visible = true;
    const pp = this.textObject.getByType(Two.Path);
    pp.map(s => s as Path).forEach(p => {
      p.fill = "rgb(230,5,5)";
    });
  }

  normalDisplay(): void {
    this.textObject.visible = true;
    // this.glowingTextObject.visible = false;
    const pp = this.textObject.getByType(Two.Path);
    pp.map(s => s as Path).forEach(p => {
      p.fill = "black";
    });
  }

  addToLayers(layers: Group[]): void {
    // We must add glowing text before the text itself,
    // otherwise the glowing shadow will cover the text
    // layers[LAYER.foregroundText].add(this.glowingTextObject);
    layers[LAYER.foregroundText].add(this.textObject);
  }
  removeFromLayers(layers: Group[]): void {
    layers[LAYER.foregroundText].remove(this.textObject);
    // layers[LAYER.foregroundText].remove(this.glowingTextObject);
  }
  updateDisplay(): void {
    this.normalDisplay();
  }
  setVisible(flag: boolean): void {
    if (!flag) {
      this.textObject.visible = false;
      // this.glowingTextObject.visible = false;
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
    const scaleFactor =
      (Text.textScaleFactor * Text.mathJaxScaleFactor * textScalePercent) / 100;
    this.textObject.scale = new Two.Vector(scaleFactor, -scaleFactor);

    // this.glowingTextObject.scale =
    //   (Text.textScaleFactor * Text.mathJaxScaleFactor * textScalePercent) / 100;
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
    console.debug("Stylize is called");
    switch (flag) {
      case DisplayStyle.ApplyTemporaryVariables: {
        // There is no temporary text so this should never be called
        break;
      }

      case DisplayStyle.ApplyCurrentVariables: {
        // Use the current variables to directly modify the js objects.
        const labelStyle = this.styleOptions.get(StyleCategory.Label);
        this.textObject.rotation = labelStyle?.labelTextRotation ?? 0;
        // this.glowingTextObject.rotation = labelStyle?.labelTextRotation ?? 0;
        // FRONT = To shoehorn text into label, the front fill color is the same as overall stroke color, there are no front/back for text
        // const frontFillColor =
        //   labelStyle?.labelFrontFillColor ?? SETTINGS.text.fillColor;
        // if (Nodule.rgbaIsNoFillOrNoStroke(frontFillColor)) {
        //   this.textObject.noFill();
        // } else {
        //   this.textObject.fill = frontFillColor;
        // }

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
    // this.glowingTextObject.position.set(
    //   this._locationVector.x,
    //   -this._locationVector.y
    // );

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
    console.debug("Setting text to", txt);
    // this.textObject.children.splice(0);
    // this.glowingTextObject.children.splice(0);
    this.setupUsing(txt);
  }

  public setDefaultText(txt: string): void {
    this._defaultText = txt;
  }
}
