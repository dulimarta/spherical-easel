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
//import { Shape } from "two.js/src/shape";
import { PreferenceRef } from "../utils/preferenceRef";

/**
 * Each Point object is uniquely associated with a SEPoint object.
 * As part of plottables, Point concerns mainly with the visual appearance, but
 * SEPoint concerns mainly with geometry computations.
 */

export default class Label extends Nodule {
  /**
   * This Label's corresponding SELabel, used so that this Label class can turn off and on the visibility of the object it is labeling and control other things about the object it is labeling
   */
  //public seLabel?: SELabel; // I shouldn't reference this model object in a plottable object 0 verboten!
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
  protected frontText = new Text("Test", 1, 0, {
    size: SETTINGS.label.fontSize
  });
  protected backText = new Text("Test", 1, 0, {
    size: SETTINGS.label.fontSize
  });
  protected glowingFrontText = new Text("Test", 1, 0, {
    size: SETTINGS.label.fontSize
  });
  protected glowingBackText = new Text("Test", 1, 0, {
    size: SETTINGS.label.fontSize
  });
  private glowingStrokeColorFront = SETTINGS.label.glowingStrokeColor.front;
  private glowingStrokeColorBack = SETTINGS.label.glowingStrokeColor.back;

  private seLabelParentType: LabelParentTypes = "point";
  // private _seLabelParentID = -1;
  private _valueDisplayMode = ValueDisplayMode.Number;

  private _defaultName = "";
  /**
   * A string representing the text that will be rendered to the screen. Set with text.value = this.shortUserName
   * shortUser
   Name is at most ??? characters long
   * caption is a longer, ?? characters long
   * Note that initialName is not user modifiable and is used (in shortUserName) until the user changes the name field in the styling panel
   * this.seLabel.parent.name is the name that is restored when defaults are restored.
   * _value is the associated number array, if any, that describes the object being labeled. Typically this is just one number, but for point coordinates is an array of
   * the three coordinate values.
   */
  protected _shortUserName = "";
  protected _caption = "";
  protected _value: number[] = [];

  /**
   * The styling variables for the text. The user can modify these.
   */

  /**
   * Controls how the label is displayed, the initial value depends on the object and this is set in the constructor
   */
  // protected textLabelMode = LabelDisplayMode.NameOnly;
  /**
   * The default size of the text. The size that appears at all zoom levels.
   * Set with text.size = this.defaultSize
   */
  //protected defaultSize = SETTINGS.label.fontSize;

  /**
   *  A string representing the color for the text area to be filled. All valid css representations
   * of color are accepted. text.noFill(); Removes the fill.
   * Set with text.fill= this.front/back FillColor
   */
  // protected frontFillColor = SETTINGS.label.fillColor.front;
  // protected backFillColor = SETTINGS.label.fillColor.back;
  /**
   * A string representing the font style to be applied to the rendered text. e.g: 'normal' or 'italic'.
   * Default value is 'normal'.
   * Set with text.style=this.textStyle
   */
  // protected textStyle = SETTINGS.label.style;
  /**
   * css font-family to be applied to the rendered text. Default value is 'sans-serif'.
   * Set with text.family = this.textFamily
   * see https://www.cssfontstack.com/
   */
  // protected textFamily = SETTINGS.label.family;
  /**
   * A string representing the text decoration to be applied to the rendered text. e.g: 'none',
   * 'underline', or 'strikethrough'. Default value is 'none'
   * Set with text.decoration = this.textDecoration
   */
  // protected textDecoration = SETTINGS.label.decoration;
  /**
   * A string representing the vertical alignment to be applied to the rendered text. e.g: 'middle',
   * 'baseline', or 'top'. Default value is 'middle'.
   * Set with text.baseline = this.verticalAlignment
   */
  //protected textVerticalAlignment = "middle";
  /**
   * A string representing the horizontal alignment to be applied to the rendered text. e.g: 'left',
   * 'right', or 'center'. Default value is 'middle'.
   * Set with text.alignment = this.horizontalAlignment
   */
  //protected textHorizontalAlignment = "middle";
  /**
   * A number representing the leading, a.k.a. line-height, to be applied to the rendered text.
   * Default value is 17. The line-height CSS property sets the height of a line box. It's commonly
   *  used to set the distance between lines of text.
   * Set with text.leading = this.lineHeight
   */
  //protected lineHeight = 17;
  /**
   * A number that represents the rotation of the text in the drawing space, in radians.
   * Set with text.rotation=this.textRotation
   */
  // protected textRotation = SETTINGS.label.rotation;
  /**
   * A number that represents the uniform scale of the text in the drawing space. May be changed by the user to increase/decrease the
   * size of the text relative to the scaled default (ie. the default size is the same at all zoom levels)
   */
  // protected textScalePercent = SETTINGS.label.textScalePercent;

  // protected dynamicBackStyle = SETTINGS.label.dynamicBackStyle;

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
    Label.textScaleFactor *= factor;
  }

  static isEarthMode = false;

  constructor(noduleName: string, parentType: LabelParentTypes) {
    super(noduleName);

    this.seLabelParentType = parentType;

    // Set the location of the points front/back/glowing/drawn
    // The location of all points front/back/glowing/drawn is controlled by the
    //  Group that they are all members of. To translate the group is to translate all points

    this.glowingFrontText.translation = this.defaultScreenVectorLocation;
    this.frontText.translation = this.defaultScreenVectorLocation;
    this.glowingBackText.translation = this.defaultScreenVectorLocation;
    this.backText.translation = this.defaultScreenVectorLocation;

    // Set the properties of the labels that never change - stroke width and some glowing options
    this.frontText.noStroke();
    this.backText.noStroke();
    this.glowingFrontText.linewidth = SETTINGS.label.glowingStrokeWidth.front;
    // this.glowingFrontText.stroke = SETTINGS.label.glowingStrokeColor.front;
    this.glowingBackText.linewidth = SETTINGS.label.glowingStrokeWidth.back;
    // this.glowingBackText.stroke = SETTINGS.label.glowingStrokeColor.back;

    this.styleOptions.set(StyleCategory.Label, DEFAULT_LABEL_TEXT_STYLE);
    // this.styleOptions.set(StyleCategory.Front, DEFAULT_LABEL_FRONT_STYLE);
    // this.styleOptions.set(StyleCategory.Back, DEFAULT_LABEL_BACK_STYLE);
  }

  set valueDisplayMode(vdm: ValueDisplayMode) {
    this._valueDisplayMode = vdm;
    this.stylize(DisplayStyle.ApplyCurrentVariables);
  }

  set defaultName(name: string) {
    this._defaultName = name;
  }
  /**
   * Set and get the shortUserName
   */
  set shortUserName(name: string) {
    this._shortUserName = name;
    // const shortName = name.slice(0, SETTINGS.label.maxLabelDisplayTextLength);
    this.updateStyle(StyleCategory.Label, {
      labelDisplayText: name
    });
    this.stylize(DisplayStyle.ApplyCurrentVariables);
  }
  get shortUserName(): string {
    return this._shortUserName;
  }

  /**
   * Return and set the caption associated with this object
   */
  get caption(): string {
    // const labelStyle = this.styleOptions.get(StyleCategory.Label);
    // return labelStyle?.labelDisplayCaption ?? "No Label";
    return this._caption;
  }
  set caption(cap: string) {
    this._caption = cap;
    this.updateStyle(StyleCategory.Label, {
      labelDisplayCaption: cap
    });
  }

  /**
   * Sets/Gets the the value of this label and update the display
   */
  set value(n: number[]) {
    this._value.splice(0);
    n.forEach(num => this._value.push(num));
    this.stylize(DisplayStyle.ApplyCurrentVariables);
  }
  get value(): number[] {
    return this._value;
  }

  /**
   * Get and Set the location of the point in the Default Sphere, this also updates the display
   */
  set positionVector(idealUnitSphereVectorLocation: Vector3) {
    this._locationVector
      .copy(idealUnitSphereVectorLocation)
      .multiplyScalar(SETTINGS.boundaryCircle.radius);
    // Translate the whole group (i.e. all points front/back/glowing/drawn) to the new center vector
    this.defaultScreenVectorLocation.set(
      this._locationVector.x,
      -this._locationVector.y // the minus sign because the up/down coordinate are *not* reversed on text layers
    );
  }
  get positionVector(): Vector3 {
    return this._locationVector;
  }

  /**
   * Set the initial label display mode and update the display
   */
  set initialLabelDisplayMode(mode: LabelDisplayMode) {
    this.updateStyle(StyleCategory.Label, {
      labelDisplayMode: mode
    });
    this.stylize(DisplayStyle.ApplyCurrentVariables);
  }
  get labelDisplayMode(): LabelDisplayMode {
    const labelStyle = this.styleOptions.get(StyleCategory.Label);
    return labelStyle?.labelDisplayMode ?? LabelDisplayMode.NameOnly;
  }
  /**  Return the a rectangle in pixel space of the text*/
  get boundingRectangle(): {
    bottom: number;
    height: number;
    left: number;
    right: number;
    top: number;
    width: number;
  } {
    const rect = this.frontText.getBoundingClientRect();
    return {
      bottom: rect.bottom,
      height: rect.height,
      left: rect.left,
      right: rect.right,
      top: rect.top,
      width: rect.width
    };
  }
  frontGlowingDisplay(): void {
    this.frontText.visible = true;
    this.glowingFrontText.visible = true;
    this.backText.visible = false;
    this.glowingBackText.visible = false;
  }

  backGlowingDisplay(): void {
    this.frontText.visible = false;
    this.glowingFrontText.visible = false;
    this.backText.visible = true;
    this.glowingBackText.visible = true;
  }

  glowingDisplay(): void {
    if (this._locationVector.z > 0) {
      this.frontGlowingDisplay();
    } else {
      this.backGlowingDisplay();
    }
  }

  frontNormalDisplay(): void {
    this.frontText.visible = true;
    this.glowingFrontText.visible = false;
    this.backText.visible = false;
    this.glowingBackText.visible = false;
  }

  backNormalDisplay(): void {
    this.frontText.visible = false;
    this.glowingFrontText.visible = false;
    this.backText.visible = true;
    this.glowingBackText.visible = false;
  }

  normalDisplay(): void {
    if (this._locationVector.z > 0) {
      this.frontNormalDisplay();
    } else {
      this.backNormalDisplay();
    }
  }

  addToLayers(layers: Group[]): void {
    layers[LAYER.foregroundLabel].add(this.frontText);
    layers[LAYER.foregroundLabelGlowing].add(this.glowingFrontText);
    layers[LAYER.backgroundLabel].add(this.backText);
    layers[LAYER.backgroundLabelGlowing].add(this.glowingBackText);
    // this.frontText.addTo(layers[LAYER.foregroundText]);
    // this.glowingFrontText.addTo(layers[LAYER.foregroundTextGlowing]);
    // this.backText.addTo(layers[LAYER.backgroundText]);
    // this.glowingBackText.addTo(layers[LAYER.backgroundTextGlowing]);
  }

  removeFromLayers(layers: Group[]): void {
    layers[LAYER.foregroundLabel].remove(this.frontText);
    layers[LAYER.foregroundLabelGlowing].remove(this.glowingFrontText);
    layers[LAYER.backgroundLabel].remove(this.backText);
    layers[LAYER.backgroundLabelGlowing].remove(this.glowingBackText);
  }

  updateDisplay(): void {
    this.normalDisplay();
  }

  setVisible(flag: boolean): void {
    if (!flag) {
      this.frontText.visible = false;
      this.glowingFrontText.visible = false;
      this.backText.visible = false;
      this.glowingBackText.visible = false;
    } else {
      this.normalDisplay();
    }
  }

  // setSelectedColoring(flag: boolean): void {
  //   //set the new colors into the variables
  //   if (flag) {
  //     this.glowingStrokeColorFront = SETTINGS.style.selectedColor.front;
  //     this.glowingStrokeColorBack = SETTINGS.style.selectedColor.back;
  //   } else {
  //     this.glowingStrokeColorFront = SETTINGS.label.glowingStrokeColor.front;
  //     this.glowingStrokeColorBack = SETTINGS.label.glowingStrokeColor.back;
  //   }
  //   // apply the new color variables to the object
  //   this.stylize(DisplayStyle.ApplyCurrentVariables);
  // }

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
      type: "label"
    };
    if (this._locationVector.z > 0) {
      const frontReturnDictionary = new Map<svgStyleType, string>();
      frontReturnDictionary.set("font-family", this.frontText.family);
      frontReturnDictionary.set("font-style", this.frontText.style);
      frontReturnDictionary.set("font-weight", String(this.frontText.weight));
      frontReturnDictionary.set("text-decoration", this.frontText.decoration);
      frontReturnDictionary.set(
        "fill",
        String(this.frontText.fill).slice(0, 7) // separate out the alpha channel
      );
      frontReturnDictionary.set(
        "fill-opacity",
        String(Number("0x" + String(this.frontText.fill).slice(7)) / 255) // separate out the alpha channel
      );
      returnSVGObject.frontStyleDictionary = frontReturnDictionary;

      let svgFrontString =
        "<text " +
        Label.svgTransformMatrixString(
          this.frontText.rotation,
          nonScaling?.text
            ? 1 / nonScaling.scaleFactor
            : (this.frontText.scale as number),
          this.frontText.position.x,
          this.frontText.position.y
        );

      svgFrontString += ">" + this.frontText.value + "</text>";
      returnSVGObject.layerSVGArray.push([
        LAYER.foregroundLabel,
        svgFrontString
      ]);
    } else {
      const backReturnDictionary = new Map<svgStyleType, string>();
      backReturnDictionary.set("font-family", this.backText.family);
      backReturnDictionary.set("font-style", this.backText.style);
      backReturnDictionary.set("font-weight", String(this.backText.weight));
      backReturnDictionary.set("text-decoration", this.backText.decoration);
      backReturnDictionary.set(
        "fill",
        String(this.backText.fill).slice(0, 7) // separate out the alpha channel
      );
      backReturnDictionary.set(
        "fill-opacity",
        String(Number("0x" + String(this.backText.fill).slice(7)) / 255) // separate out the alpha channel
      );

      returnSVGObject.backStyleDictionary = backReturnDictionary;

      let svgBackString =
        "<text " +
        Label.svgTransformMatrixString(
          this.backText.rotation,
          nonScaling?.text
            ? 1 / nonScaling.scaleFactor
            : (this.backText.scale as number),
          this.backText.position.x,
          this.backText.position.y
        );

      svgBackString += ">" + this.backText.value + "</text>";
      returnSVGObject.layerSVGArray.push([
        LAYER.backgroundLabel,
        svgBackString
      ]);
    }
    return [returnSVGObject];
  }

  /**
   * Copies the style options set by the Style Panel into the style variables and then updates the
   * js objects (with adjustSize and stylize(ApplyVariables))
   * @param options The style options
   */
  updateStyle(mode: StyleCategory, options: StyleOptions): void {
    super.updateStyle(mode, options);

    if (options.labelDisplayText) {
      this._shortUserName = options.labelDisplayText.slice(
        0,
        SETTINGS.label.maxLabelDisplayTextLength
      );
    }

    if (options.labelDisplayCaption) {
      this._caption = options.labelDisplayCaption.slice(
        0,
        SETTINGS.label.maxLabelDisplayCaptionLength
      );
    }

    // if (this.seLabel?.parent instanceof SEAngleMarker) {
    //   const angleMarker = this.seLabel.parent;
    //   this._shortUserName = `Am${angleMarker.angleMarkerNumber}`;
    // } else if (this.seLabel?.parent instanceof SEPolygon) {
    //   const polygon = this.seLabel.parent;
    //   this._shortUserName = `Po${polygon.polygonNumber}`;
    // }
    // override any update to the names of the angleMarkers and polygons. why?
    // if (this.seLabelParentType === "angleMarker") {
    //   this._shortUserName = this._defaultName; //`Am${this._seLabelParentID}`;
    // } else if (this.seLabelParentType === "polygon") {
    //   this._shortUserName = this._defaultName; // `Po${this._seLabelParentID}`;
    // }
  }

  /**
   * Return the default style state
   */
  defaultStyleState(panel: StyleCategory): StyleOptions {
    if (panel === StyleCategory.Label) {
      let labelDisplayMode = LabelDisplayMode.NameOnly;

      switch (this.seLabelParentType) {
        case "point":
          labelDisplayMode = SETTINGS.point.defaultLabelMode;
          break;
        case "line":
          labelDisplayMode = SETTINGS.line.defaultLabelMode;
          break;
        case "segment":
          labelDisplayMode = SETTINGS.segment.defaultLabelMode;
          break;
        case "circle":
          labelDisplayMode = SETTINGS.circle.defaultLabelMode;
          break;
        case "angleMarker":
          labelDisplayMode = SETTINGS.angleMarker.defaultLabelMode;
          break;
        case "parametric":
          labelDisplayMode = SETTINGS.parametric.defaultLabelMode;
          break;
        case "ellipse":
          labelDisplayMode = SETTINGS.ellipse.defaultLabelMode;
          break;
        case "polygon":
          labelDisplayMode = SETTINGS.polygon.defaultLabelMode;
          break;
        default:
          labelDisplayMode = LabelDisplayMode.NameOnly;
      }
      // Angle Markers and polygons are exceptions which are both plottable and an expression.
      // As expressions MUST have a name of a measurement token (ie. M###), we can't
      // use the parent name for the short name, so to get around this we use this
      // and the (angleMarker|polygon)Number.
      // The default name is set in the constructor for all objects
      return {
        ...DEFAULT_LABEL_TEXT_STYLE,
        labelDisplayText: this._defaultName,
        labelDisplayCaption: "",
        labelDisplayMode: labelDisplayMode
      };
    } else {
      //Should never be called
      throw new Error(
        "Called defaultStyleState in Label with non-Label panel."
      );
    }
  }

  /**
   * Sets the variables for point radius glowing/not
   */
  adjustSize(): void {
    const labelStyle = this.styleOptions.get(StyleCategory.Label);
    const textScalePercent = labelStyle?.labelTextScalePercent ?? 100;
    this.frontText.scale = (Label.textScaleFactor * textScalePercent) / 100;
    this.backText.scale = (Label.textScaleFactor * textScalePercent) / 100;

    this.glowingFrontText.scale =
      (Label.textScaleFactor * textScalePercent) / 100;
    this.glowingBackText.scale =
      (Label.textScaleFactor * textScalePercent) / 100;
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
        // Properties that have no sides
        let labelText = "";
        // Compute the numerical part of the label (if any) and add it to the end of label
        if (this.value.length > 0) {
          if (this.seLabelParentType === "point") {
            if (!Label.isEarthMode) {
              //For coordinates of a point
              labelText =
                "(" +
                `${this._value
                .map(num => num.toFixed(PreferenceRef.instance.easelDecimalPrecision ?? SETTINGS.decimalPrecision))
                  .join(",")}` +
                ")";
            } else {
              labelText = this.convertXYZtoLatLong(this.value);
            }
          } else {
            switch (this._valueDisplayMode) {
              case ValueDisplayMode.Number:
                labelText = this._value[0].toFixed(PreferenceRef.instance.easelDecimalPrecision ?? SETTINGS.decimalPrecision);
                break;
              case ValueDisplayMode.MultipleOfPi:
                labelText =
                  (this._value[0] / Math.PI).toFixed(
                    PreferenceRef.instance.easelDecimalPrecision ?? SETTINGS.decimalPrecision
                  ) + "\u{1D7B9}";
                break;
              case ValueDisplayMode.DegreeDecimals:
                labelText =
                  this._value[0]
                    .toDegrees()
                  .toFixed(PreferenceRef.instance.easelDecimalPrecision ?? SETTINGS.decimalPrecision) + "\u{00B0}";
                break;
              case ValueDisplayMode.EarthModeMiles:
                if (this.seLabelParentType == "polygon") {
                  labelText =
                    (
                      this._value[0] *
                      SETTINGS.earthMode.radiusMiles *
                      SETTINGS.earthMode.radiusMiles
                  ).toFixed(PreferenceRef.instance.easelDecimalPrecision ?? SETTINGS.decimalPrecision) + " mi\u{00B2}"; //TODO: How do I internationalize this?
                  break;
                } else {
                  labelText =
                    (this._value[0] * SETTINGS.earthMode.radiusMiles).toFixed(
                      PreferenceRef.instance.easelDecimalPrecision ?? SETTINGS.decimalPrecision
                    ) + " mi"; //TODO: How do I internationalize this?
                  break;
                }
              case ValueDisplayMode.EarthModeKilos:
                if (this.seLabelParentType == "polygon") {
                  labelText =
                    (
                      this._value[0] *
                      SETTINGS.earthMode.radiusKilometers *
                      SETTINGS.earthMode.radiusKilometers
                    ).toFixed(PreferenceRef.instance.easelDecimalPrecision ?? SETTINGS.decimalPrecision) + " km\u{00B2}"; //TODO: How do I internationalize this?
                  break;
                } else {
                  labelText =
                    (
                      this._value[0] * SETTINGS.earthMode.radiusKilometers
                  ).toFixed(PreferenceRef.instance.easelDecimalPrecision ?? SETTINGS.decimalPrecision) + " km"; //TODO: How do I internationalize this?
                  break;
                }
            }
          }
        }

        switch (labelStyle?.labelDisplayMode) {
          case LabelDisplayMode.NameOnly: {
            labelText = labelStyle?.labelDisplayText ?? "No Label Text1";
            break;
          }
          case LabelDisplayMode.CaptionOnly: {
            labelText = labelStyle?.labelDisplayCaption ?? "No Caption";
            break;
          }
          case LabelDisplayMode.ValueOnly: {
            if (this._value.length === 0) {
              // this is the case where the label doesn't have a corresponding value (When it does have a value it is computed above)
              //labelText = this.shortUserName;
              labelText = labelStyle?.labelDisplayText ?? "No Label Text2";
            }
            break;
          }
          case LabelDisplayMode.NameAndCaption: {
            labelText =
              labelStyle?.labelDisplayText +
              ": " +
              labelStyle?.labelDisplayCaption;
            //this.shortUserName + ": " + labelStyle?.labelDisplayCaption;
            break;
          }
          case LabelDisplayMode.NameAndValue: {
            if (this._value.length > 0) {
              // if (
              //   this.seLabelParentType === "angleMarker" ||
              //   this.seLabelParentType === "polygon"
              // ) {
              //   labelText = labelStyle?.labelDisplayText + ": " + labelText;
              // } else {

              labelText = labelStyle?.labelDisplayText + ": " + labelText;
              // }
            } else {
              // this is the case where the label doesn't have a corresponding value (When it does have a value it is computed above)
              labelText = labelStyle?.labelDisplayText ?? "No Label Text3"; //this.shortUserName;
            }
            break;
          }
        }
        // console.debug(`Label text is ${labelText}, Value array is`, this.value)
        this.frontText.value = labelText;
        this.backText.value = labelText;
        this.glowingFrontText.value = labelText;
        this.glowingBackText.value = labelText;
        if (labelStyle?.labelTextStyle !== "bold") {
          this.frontText.style = (labelStyle?.labelTextStyle ??
            SETTINGS.label.style) as "normal" | "italic";
          this.backText.style = (labelStyle?.labelTextStyle ??
            SETTINGS.label.style) as "normal" | "italic";
          this.glowingFrontText.style = (labelStyle?.labelTextStyle ??
            SETTINGS.label.style) as "normal" | "italic";
          this.glowingBackText.style = (labelStyle?.labelTextStyle ??
            SETTINGS.label.style) as "normal" | "italic";
          this.frontText.weight = 500;
          this.backText.weight = 500;
          this.glowingFrontText.weight = 500;
          this.glowingBackText.weight = 500;
        } else if (labelStyle?.labelTextStyle === "bold") {
          this.frontText.weight = 1000;
          this.backText.weight = 1000;
          this.glowingFrontText.weight = 1000;
          this.glowingBackText.weight = 1000;
        }

        this.frontText.family =
          labelStyle?.labelTextFamily ?? SETTINGS.label.family;
        this.backText.family =
          labelStyle?.labelTextFamily ?? SETTINGS.label.family;
        this.glowingFrontText.family =
          labelStyle?.labelTextFamily ?? SETTINGS.label.family;
        this.glowingBackText.family =
          labelStyle?.labelTextFamily ?? SETTINGS.label.family;

        this.frontText.decoration = (labelStyle?.labelTextDecoration ??
          SETTINGS.label.decoration) as "none" | "underline" | "strikethrough";
        this.backText.decoration = (labelStyle?.labelTextDecoration ??
          SETTINGS.label.decoration) as "none" | "underline" | "strikethrough";
        this.glowingFrontText.decoration = (labelStyle?.labelTextDecoration ??
          SETTINGS.label.decoration) as "none" | "underline" | "strikethrough";
        this.glowingBackText.decoration = (labelStyle?.labelTextDecoration ??
          SETTINGS.label.decoration) as "none" | "underline" | "strikethrough";

        this.frontText.rotation = labelStyle?.labelTextRotation ?? 0;
        this.backText.rotation = labelStyle?.labelTextRotation ?? 0;
        this.glowingFrontText.rotation = labelStyle?.labelTextRotation ?? 0;
        this.glowingBackText.rotation = labelStyle?.labelTextRotation ?? 0;

        // FRONT
        const frontFillColor =
          labelStyle?.labelFrontFillColor ?? SETTINGS.label.fillColor.front;
        const backFillColor =
          labelStyle?.labelBackFillColor ?? SETTINGS.label.fillColor.back;
        if (Nodule.rgbaIsNoFillOrNoStroke(frontFillColor)) {
          this.frontText.noFill();
        } else {
          this.frontText.fill = frontFillColor;
        }
        this.glowingFrontText.stroke = this.glowingStrokeColorFront;

        // BACK
        if (
          labelStyle?.labelDynamicBackStyle !== undefined &&
          labelStyle?.labelDynamicBackStyle === true
        ) {
          if (
            Nodule.rgbaIsNoFillOrNoStroke(
              Nodule.contrastFillColor(frontFillColor)
            )
          ) {
            this.backText.noFill();
          } else {
            this.backText.fill = Nodule.contrastFillColor(frontFillColor);
          }
        } else {
          if (Nodule.rgbaIsNoFillOrNoStroke(backFillColor)) {
            this.backText.noFill();
          } else {
            this.backText.fill = backFillColor;
          }
        }
        this.glowingBackText.stroke = this.glowingStrokeColorBack;

        break;
      }
    }
  }
  convertXYZtoLatLong(coords: number[]): string {
    const latitude = Math.asin(coords[2]);
    const longitude = Math.atan2(coords[1], coords[0]);
    let latitudeString: string;
    if (latitude < 0) {
      latitudeString =
        Math.abs(latitude).toDegrees().toFixed(PreferenceRef.instance.easelDecimalPrecision ?? SETTINGS.decimalPrecision) +
        "\u{00B0}" +
        "S";
    } else {
      latitudeString =
        latitude.toDegrees().toFixed(PreferenceRef.instance.easelDecimalPrecision ?? SETTINGS.decimalPrecision) +
        "\u{00B0}" +
        "N";
    }
    let longitudeString: string;
    if (longitude < 0) {
      longitudeString =
        Math.abs(longitude).toDegrees().toFixed(PreferenceRef.instance.easelDecimalPrecision ?? SETTINGS.decimalPrecision) +
        "\u{00B0}" +
        "W";
    } else {
      longitudeString =
        longitude.toDegrees().toFixed(PreferenceRef.instance.easelDecimalPrecision ?? SETTINGS.decimalPrecision) +
        "\u{00B0}" +
        "E";
    }

    return "(" + latitudeString + "," + longitudeString + ")";
  }
}
