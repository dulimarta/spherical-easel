/** @format */

// import SETTINGS from "@/global-settings";
import Two, { BoundingClientRect } from "two.js";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";
import { Vector3 } from "three";
import {
  StyleOptions,
  LabelDisplayMode,
  StyleEditPanels
} from "@/types/Styles";
import { SELabel } from "@/models/SELabel";
import { SELine } from "@/models/SELine";
import { SEPoint } from "@/models/SEPoint";
import { SESegment } from "@/models/SESegment";
import { SECircle } from "@/models/SECircle";
import { SEAngleMarker } from "@/models/SEAngleMarker";
import { SESegmentLength } from "@/models/SESegmentLength";

/**
 * Each Point object is uniquely associated with a SEPoint object.
 * As part of plottables, Point concerns mainly with the visual appearance, but
 * SEPoint concerns mainly with geometry computations.
 */

export default class Label extends Nodule {
  /**
   * This Label's corresponding SELabel, used so that this Label class can turn off and on the visibility of the object it is labeling and control other things about the object it is labeling
   */
  public seLabel?: SELabel;
  /**
   * The vector location of the Label on the default unit sphere
   * The location vector in the Default Screen Plane
   * It will always be the case the x and y coordinates of these two vectors are the same.
   * The sign of the z coordinate indicates if the Point is on the back of the sphere
   */
  public _locationVector = new Vector3(1, 0, 0);
  public defaultScreenVectorLocation = new Two.Vector(1, 0);

  /**
   * The TwoJS objects that are used to display the label.
   * One is for the front, the other for the back. Only one is displayed at a time
   */
  protected frontText: Two.Text = new Two.Text("Test", 1, 0, {
    size: SETTINGS.label.fontSize
  });
  protected backText: Two.Text = new Two.Text("Test", 1, 0, {
    size: SETTINGS.label.fontSize
  });
  protected glowingFrontText: Two.Text = new Two.Text("Test", 1, 0, {
    size: SETTINGS.label.fontSize
  });
  protected glowingBackText: Two.Text = new Two.Text("Test", 1, 0, {
    size: SETTINGS.label.fontSize
  });
  private glowingStrokeColorFront = SETTINGS.label.glowingStrokeColor.front;
  private glowingStrokeColorBack = SETTINGS.label.glowingStrokeColor.back;

  /**
   * A string representing the text that will be rendered to the screen. Set with text.value = this.shortUserName
   * shortName is at most ??? characters long
   * caption is a longer, 60 characters long
   * initialName is not user modifiable and is used until the user changes the name and this is the name that is restored when defaults are restored.
   * value is the associated number array, if any, that describes the object being labeled. Typically this is just one number, but for points is an array of
   * the three coordinate values.
   */
  protected initialName = "";
  protected shortUserName = "";
  protected _caption = "";
  protected _value: number[] = [];

  /**
   * The styling variables for the text. The user can modify these.
   */

  /**
   * Controls how the label is displayed, the initial value depends on the object and this is set in the constructor
   */
  protected textLabelMode = LabelDisplayMode.NameOnly;
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
  protected frontFillColor = SETTINGS.label.fillColor.front;
  protected backFillColor = SETTINGS.label.fillColor.back;
  /**
   * A string representing the font style to be applied to the rendered text. e.g: 'normal' or 'italic'.
   * Default value is 'normal'.
   * Set with text.style=this.textStyle
   */
  protected textStyle = SETTINGS.label.style;
  /**
   * css font-family to be applied to the rendered text. Default value is 'sans-serif'.
   * Set with text.family = this.textFamily
   * see https://www.cssfontstack.com/
   */
  protected textFamily = SETTINGS.label.family;
  /**
   * A string representing the text decoration to be applied to the rendered text. e.g: 'none',
   * 'underline', or 'strikethrough'. Default value is 'none'
   * Set with text.decoration = this.textDecoration
   */
  protected textDecoration = SETTINGS.label.decoration;
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
  protected textRotation = SETTINGS.label.rotation;
  /**
   * A number that represents the uniform scale of the text in the drawing space. May be changed by the user to increase/decrease the
   * size of the text relative to the scaled default (ie. the default size is the same at all zoom levels)
   */
  protected textScalePercent = SETTINGS.label.textScalePercent;

  protected dynamicBackStyle = SETTINGS.label.dynamicBackStyle;

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

  constructor() {
    super();
    Nodule.LABEL_COUNT++;

    // Set the location of the points front/back/glowing/drawn
    // The location of all points front/back/glowing/drawn is controlled by the
    //  Two.Group that they are all members of. To translate the group is to translate all points

    this.glowingFrontText.translation = this.defaultScreenVectorLocation;
    this.frontText.translation = this.defaultScreenVectorLocation;
    this.glowingBackText.translation = this.defaultScreenVectorLocation;
    this.backText.translation = this.defaultScreenVectorLocation;

    // The text is not initially visible
    this.frontText.visible = false;
    this.glowingFrontText.visible = false;
    this.backText.visible = false;
    this.glowingBackText.visible = false;

    // Set the properties of the points that never change - stroke width and some glowing options
    this.frontText.noStroke();
    this.backText.noStroke();
    this.glowingFrontText.linewidth = SETTINGS.label.glowingStrokeWidth.front;
    // this.glowingFrontText.stroke = SETTINGS.label.glowingStrokeColor.front;
    this.glowingBackText.linewidth = SETTINGS.label.glowingStrokeWidth.back;
    // this.glowingBackText.stroke = SETTINGS.label.glowingStrokeColor.back;
  }
  /**
   * Set the initial names, initialName is not modifiable by the user but shortUserName and caption are
   */
  set initialNames(name: string) {
    this.initialName = name;
    // shortName is the first characters of name
    this.shortUserName = name /*.slice(
      0,
      SETTINGS.label.maxLabelDisplayTextLength
    )*/;
    this.stylize(DisplayStyle.ApplyCurrentVariables);
  }

  /**
   * Return the short name associated with this object
   */
  get shortName(): string {
    return this.shortUserName;
  }

  /**
   * Return the caption associated with this object
   */
  get caption(): string {
    return this._caption;
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
    if (this.seLabel?.showing) {
      this.updateDisplay();
    }
  }
  get positionVector(): Vector3 {
    return this._locationVector;
  }

  /**
   * Set the initial label display mode and update the display
   */
  set initialLabelDisplayMode(mode: LabelDisplayMode) {
    this.textLabelMode = mode;
    this.stylize(DisplayStyle.ApplyCurrentVariables);
  }

  get labelDisplayMode(): LabelDisplayMode {
    return this.textLabelMode;
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
    const rect = this.frontText.getBoundingClientRect() as BoundingClientRect;
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

  addToLayers(layers: Two.Group[]): void {
    layers[LAYER.foregroundText].add(this.frontText);
    layers[LAYER.foregroundTextGlowing].add(this.glowingFrontText);
    layers[LAYER.backgroundText].add(this.backText);
    layers[LAYER.backgroundTextGlowing].add(this.glowingBackText);
  }

  removeFromLayers(layers: Two.Group[]): void {
    layers[LAYER.foregroundText].remove(this.frontText);
    layers[LAYER.foregroundTextGlowing].remove(this.glowingFrontText);
    layers[LAYER.backgroundText].remove(this.backText);
    layers[LAYER.backgroundTextGlowing].remove(this.glowingBackText);
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

  setSelectedColoring(flag: boolean): void {
    //set the new colors into the variables
    if (flag) {
      this.glowingStrokeColorFront = SETTINGS.style.selectedColor.front;
      this.glowingStrokeColorBack = SETTINGS.style.selectedColor.back;
    } else {
      this.glowingStrokeColorFront = SETTINGS.label.glowingStrokeColor.front;
      this.glowingStrokeColorBack = SETTINGS.label.glowingStrokeColor.back;
    }
    // apply the new color variables to the object
    this.stylize(DisplayStyle.ApplyCurrentVariables);
  }
  /**
   * Copies the style options set by the Style Panel into the style variables and then updates the
   * Two.js objects (with adjustSize and stylize(ApplyVariables))
   * @param options The style options
   */
  updateStyle(options: StyleOptions): void {
    console.debug("Label: Update style of", this.initialName, "using", options);
    if (options.labelDisplayMode !== undefined) {
      this.textLabelMode = options.labelDisplayMode;
    }
    if (options.labelDisplayText !== undefined) {
      this.shortUserName = options.labelDisplayText;
    }
    if (options.labelDisplayCaption !== undefined) {
      this._caption = options.labelDisplayCaption;
    }
    if (options.labelTextFamily !== undefined) {
      this.textFamily = options.labelTextFamily;
    }
    if (options.labelTextStyle !== undefined) {
      this.textStyle = options.labelTextStyle;
    }
    if (options.labelTextDecoration !== undefined) {
      this.textDecoration = options.labelTextDecoration;
    }
    if (options.labelTextRotation !== undefined) {
      this.textRotation = options.labelTextRotation;
    }
    // if (options.labelVisibility !== undefined) {
    //   if (this.seLabel !== undefined) {
    //     this.seLabel.showing = options.labelVisibility; //Applied immediately
    //   }
    // }
    // The object of a label refers to the parent
    // if (options.objectVisibility !== undefined) {
    //   if (this.seLabel !== undefined) {
    //     this.seLabel.parent.showing = options.objectVisibility; //Applied immediately
    //   }
    // }
    if (options.labelTextScalePercent !== undefined) {
      this.textScalePercent = options.labelTextScalePercent;
    }

    if (options.labelFrontFillColor !== undefined) {
      this.frontFillColor = options.labelFrontFillColor;
    }

    if (options.labelBackFillColor !== undefined) {
      this.backFillColor = options.labelBackFillColor;
    }

    if (options.dynamicBackStyle !== undefined) {
      this.dynamicBackStyle = options.dynamicBackStyle;
    }

    // if (options.panel === StyleEditPanels.Front) {
    //   // Set the front options
    //   if (options.fillColor !== undefined) {
    //     this.frontFillColor = options.fillColor;
    //   }

    // } else if (options.panel === StyleEditPanels.Back) {
    //   // Set the back options
    //   // options.dynamicBackStyle is boolean, so we need to explicitly check for undefined otherwise
    //   // when it is false, this doesn't execute and this.dynamicBackStyle is not set
    //   if (options.dynamicBackStyle !== undefined) {
    //     this.dynamicBackStyle = options.dynamicBackStyle;
    //   }
    //   // overwrite the back options only in the case the dynamic style is not enabled
    //   if (!this.dynamicBackStyle) {
    //     if (options.fillColor !== undefined) {
    //       this.backFillColor = options.fillColor;
    //     }

    //   }
    // }
    // Now apply the style and size
    this.stylize(DisplayStyle.ApplyCurrentVariables);
    this.adjustSize();
  }
  /**
   * Return the current style state
   */
  currentStyleState(panel: StyleEditPanels): StyleOptions {
    switch (panel) {
      case StyleEditPanels.Front: {
        // This should *never* be called
        return {
          panel: panel,
          fillColor: this.frontFillColor,
          dynamicBackStyle: this.dynamicBackStyle
        };
      }
      case StyleEditPanels.Back: {
        // This should *never* be called
        return {
          panel: panel,
          fillColor: this.backFillColor,
          dynamicBackStyle: this.dynamicBackStyle
        };
      }
      default:
      case StyleEditPanels.Label: {
        // let objectVisibility: boolean | undefined = undefined;
        // if (this.seLabel !== undefined) {
        //   objectVisibility = this.seLabel!.parent.showing;
        // }
        return {
          panel: panel,
          labelDisplayText: this.shortUserName,
          labelDisplayCaption: this._caption,
          labelDisplayMode: this.textLabelMode,
          labelTextFamily: this.textFamily,
          labelTextStyle: this.textStyle,
          labelTextDecoration: this.textDecoration,
          labelTextRotation: this.textRotation,
          // labelVisibility: this.frontText.visible || this.backText.visible,
          // objectVisibility: this.seLabel!.parent.showing,
          labelTextScalePercent: this.textScalePercent,
          labelFrontFillColor: this.frontFillColor,
          labelBackFillColor: this.backFillColor,
          dynamicBackStyle: this.dynamicBackStyle
        };
      }
    }
  }
  /**
   * Return the default style state
   */
  defaultStyleState(panel: StyleEditPanels): StyleOptions {
    switch (panel) {
      case StyleEditPanels.Front: {
        //Should never be called
        return {
          panel: panel,
          fillColor: SETTINGS.label.fillColor.front,
          dynamicBackStyle: SETTINGS.label.dynamicBackStyle
        };
      }
      case StyleEditPanels.Back: {
        //Should never be called
        return {
          panel: panel,
          fillColor: SETTINGS.label.dynamicBackStyle
            ? Nodule.contrastFillColor(SETTINGS.label.fillColor.front)
            : SETTINGS.label.fillColor.back,
          dynamicBackStyle: SETTINGS.label.dynamicBackStyle
        };
      }
      default:
      case StyleEditPanels.Label: {
        let labelVisibility: boolean | undefined = undefined;
        let labelDisplayMode = LabelDisplayMode.NameOnly;
        if (this.seLabel !== undefined) {
          if (this.seLabel.parent instanceof SEPoint) {
            labelDisplayMode = SETTINGS.point.defaultLabelMode;
            if (this.seLabel.parent.isFreePoint()) {
              labelVisibility = SETTINGS.point.showLabelsOfFreePointsInitially;
            } else {
              labelVisibility =
                SETTINGS.point.showLabelsOfNonFreePointsInitially;
            }
          } else if (this.seLabel.parent instanceof SELine) {
            labelDisplayMode = SETTINGS.line.defaultLabelMode;
            labelVisibility = SETTINGS.line.showLabelsInitially;
          } else if (this.seLabel.parent instanceof SESegment) {
            labelDisplayMode = SETTINGS.segment.defaultLabelMode;
            labelVisibility = SETTINGS.segment.showLabelsInitially;
          } else if (this.seLabel.parent instanceof SECircle) {
            labelDisplayMode = SETTINGS.circle.defaultLabelMode;
            labelVisibility = SETTINGS.circle.showLabelsInitially;
          } else if (this.seLabel.parent instanceof SEAngleMarker) {
            labelDisplayMode = SETTINGS.angleMarker.defaultLabelMode;
            labelVisibility = SETTINGS.circle.showLabelsInitially;
          }
        }
        return {
          panel: panel, //
          labelDisplayText: this.initialName,
          labelDisplayCaption: "",
          labelDisplayMode: labelDisplayMode,
          labelTextFamily: SETTINGS.label.family,
          labelTextStyle: SETTINGS.label.style,
          labelTextDecoration: SETTINGS.label.decoration,
          labelTextRotation: SETTINGS.label.rotation,
          // labelVisibility: labelVisibility,
          // objectVisibility: true,
          labelTextScalePercent: SETTINGS.label.textScalePercent,
          labelFrontFillColor: SETTINGS.label.fillColor.front,
          labelBackFillColor: SETTINGS.label.fillColor.back,
          dynamicBackStyle: SETTINGS.label.dynamicBackStyle
        };
      }
    }
  }

  /**
   * Sets the variables for point radius glowing/not
   */
  adjustSize(): void {
    this.frontText.scale =
      (Label.textScaleFactor * this.textScalePercent) / 100;
    this.backText.scale = (Label.textScaleFactor * this.textScalePercent) / 100;
    // this.backText.scale =
    //   (Label.textScaleFactor *
    //     (this.dynamicBackStyle
    //       ? Nodule.contrastTextScalePercent(this.textScalePercentFront)
    //       : this.textScalePercentBack)) /
    //   100;

    this.glowingFrontText.scale =
      (Label.textScaleFactor * this.textScalePercent) / 100;
    this.glowingBackText.scale =
      (Label.textScaleFactor * this.textScalePercent) / 100;
    // this.glowingBackText.scale =
    //   (Label.textScaleFactor *
    //     (this.dynamicBackStyle
    //       ? Nodule.contrastTextScalePercent(this.textScalePercentFront)
    //       : this.textScalePercentBack)) /
    //   100;
  }

  /**
   * Set the rendering style (flags: ApplyTemporaryVariables, ApplyCurrentVariables) of the label
   *
   * ApplyTemporaryVariables means that
   *    1) The temporary variables from SETTINGS.point.temp are copied into the actual Two.js objects
   *    2) The pointScaleFactor is copied from the Point.pointScaleFactor (which accounts for the Zoom magnification) into the actual Two.js objects
   *
   * Apply CurrentVariables means that all current values of the private style variables are copied into the actual Two.js objects
   */
  stylize(flag: DisplayStyle): void {
    switch (flag) {
      case DisplayStyle.ApplyTemporaryVariables: {
        // There is no temporary text so this should never be called
        break;
      }

      case DisplayStyle.ApplyCurrentVariables: {
        // Use the current variables to directly modify the Two.js objects.

        // Properties that have no sides
        let labelText = "";
        switch (this.textLabelMode) {
          case LabelDisplayMode.NameOnly: {
            labelText = this.shortUserName;
            break;
          }
          case LabelDisplayMode.CaptionOnly: {
            labelText = this._caption;
            break;
          }
          case LabelDisplayMode.ValueOnly: {
            if (this._value.length > 0) {
              if (this.seLabel!.parent instanceof SEPoint) {
                labelText =
                  "(" +
                  `${this._value
                    .map(num => num.toFixed(SETTINGS.decimalPrecision))
                    .join(",")}$` +
                  ")";
              } else {
                let multPi = false;
                if (this.seLabel!.parent instanceof SEAngleMarker) {
                  multPi = (this.seLabel!.parent as SEAngleMarker)
                    .displayInMultiplesOfPi;
                } else if (this.seLabel!.parent instanceof SESegment) {
                  const seSegLength = this.seLabel!.parent.kids.find(
                    node => node instanceof SESegmentLength
                  );
                  multPi = (seSegLength as SESegmentLength)
                    .displayInMultiplesOfPi;
                }
                if (!multPi) {
                  labelText = this._value[0].toFixed(SETTINGS.decimalPrecision);
                } else {
                  labelText =
                    (this._value[0] / Math.PI).toFixed(
                      SETTINGS.decimalPrecision
                    ) + "\u{1D7B9}";
                }
              }
            } else {
              labelText = this.shortUserName;
            }
            break;
          }
          case LabelDisplayMode.NameAndCaption: {
            labelText = this.shortUserName + ": " + this._caption;
            break;
          }
          case LabelDisplayMode.NameAndValue: {
            if (this._value.length > 0) {
              if (this.seLabel!.parent instanceof SEPoint) {
                labelText =
                  this.shortName +
                  "(" +
                  `${this._value
                    .map(num => num.toFixed(SETTINGS.decimalPrecision))
                    .join(",")}` +
                  ")";
              } else {
                let multPi = false;
                if (this.seLabel!.parent instanceof SEAngleMarker) {
                  multPi = (this.seLabel!.parent as SEAngleMarker)
                    .displayInMultiplesOfPi;
                } else if (this.seLabel!.parent instanceof SESegment) {
                  const seSegLength = this.seLabel!.parent.kids.find(
                    node => node instanceof SESegmentLength
                  );
                  multPi = (seSegLength as SESegmentLength)
                    .displayInMultiplesOfPi;
                }
                if (!multPi) {
                  labelText =
                    this.shortName +
                    ": " +
                    this._value[0].toFixed(SETTINGS.decimalPrecision);
                } else {
                  labelText =
                    this.shortName +
                    ": " +
                    (this._value[0] / Math.PI).toFixed(
                      SETTINGS.decimalPrecision
                    ) +
                    "\u{1D7B9}";
                }
              }
            } else {
              labelText = this.shortUserName;
            }
            break;
          }
        }
        this.frontText.value = labelText;
        this.backText.value = labelText;
        this.glowingFrontText.value = labelText;
        this.glowingBackText.value = labelText;
        if (this.textStyle !== "bold") {
          this.frontText.style = this.textStyle;
          this.backText.style = this.textStyle;
          this.glowingFrontText.style = this.textStyle;
          this.glowingBackText.style = this.textStyle;
          this.frontText.weight = "normal";
          this.backText.weight = "normal";
          this.glowingFrontText.weight = "normal";
          this.glowingBackText.weight = "normal";
        } else if (this.textStyle === "bold") {
          this.frontText.weight = "bold";
          this.backText.weight = "bold";
          this.glowingFrontText.weight = "bold";
          this.glowingBackText.weight = "bold";
        }

        this.frontText.family = this.textFamily;
        this.backText.family = this.textFamily;
        this.glowingFrontText.family = this.textFamily;
        this.glowingBackText.family = this.textFamily;

        this.frontText.decoration = this.textDecoration;
        this.backText.decoration = this.textDecoration;
        this.glowingFrontText.decoration = this.textDecoration;
        this.glowingBackText.decoration = this.textDecoration;

        this.frontText.rotation = this.textRotation;
        this.backText.rotation = this.textRotation;
        this.glowingFrontText.rotation = this.textRotation;
        this.glowingBackText.rotation = this.textRotation;

        // FRONT
        if (this.frontFillColor === "noLabelFrontFill") {
          this.frontText.noFill();
        } else {
          this.frontText.fill = this.frontFillColor;
        }
        this.glowingFrontText.stroke = this.glowingStrokeColorFront;

        // BACK
        if (this.dynamicBackStyle) {
          if (
            Nodule.contrastFillColor(this.frontFillColor) === "noLabelBackFill"
          ) {
            this.backText.noFill();
          } else {
            this.backText.fill = Nodule.contrastFillColor(this.frontFillColor);
          }
        } else {
          if (this.backFillColor === "noLabelBackFill") {
            this.backText.noFill();
          } else {
            this.backText.fill = this.backFillColor;
          }
        }
        this.glowingBackText.stroke = this.glowingStrokeColorBack;

        break;
      }
    }
  }
}
