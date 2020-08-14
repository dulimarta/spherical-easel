/** @format */

// import SETTINGS from "@/global-settings";
import Two from "two.js";
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

/**
 * Each Point object is uniquely associated with a SEPoint object.
 * As part of plottables, Point concerns mainly with the visual appearance, but
 * SEPoint concerns mainly with geometry computations.
 */

export default class Label extends Nodule {
  /**
   * This Label's corresponding SELabel, used so that this Label class can turn off and on the visibility of the object it is labeling
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

  /**
   * A string representing the text that will be rendered to the stage. Set with text.value = this.shortName
   * shortName is at most 5 characters long
   * caption is a longer, 60 characters long
   * initialName is not user modifable and is used until the user changes the name and this is the name that is restored when defaults are restored.
   */
  protected initialName = "";
  protected shortUserName = "";
  protected caption = "";

  /**
   * The styling variables for the text. The user can modify these.
   */
  /**
   * Controls how the label is displayed
   */

  protected textLabelMode = SETTINGS.label.labelMode;
  /**
   * The default size of the text. The size that appears at all zoom levels.
   * Set with text.size = this.defaultSize
   */
  //protected defaultSize = SETTINGS.label.fontSize;

  /**
   * A number between 0 and 1 that is the opacity of the text.
   * Set with text.opacity= this.front/back opacity
   */
  protected frontOpacity = SETTINGS.label.opacity.front;
  protected backOpacity = SETTINGS.label.opacity.back;
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

    // Set the properties of the points that never change - stroke width and glowing options
    this.frontText.noStroke();
    this.backText.noStroke();
    this.glowingFrontText.linewidth = SETTINGS.label.glowingStrokeWidth.front;
    this.glowingFrontText.stroke = SETTINGS.label.glowingStrokeColor.front;
    this.glowingBackText.linewidth = SETTINGS.label.glowingStrokeWidth.back;
    this.glowingBackText.stroke = SETTINGS.label.glowingStrokeColor.back;
  }
  /**
   * Set the initial names, initialName is not modifiable by the user but shortUserName and caption are
   */
  set initialNames(name: string) {
    this.initialName = name;
    this.shortUserName = name;
    this.stylize(DisplayStyle.ApplyCurrentVariables);
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
    this.updateDisplay();
  }
  get positionVector(): Vector3 {
    return this._locationVector;
  }
  // Return the a rectangle in pixel space of the text
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
      bottom: (rect as any).bottom,
      height: (rect as any).height,
      left: (rect as any).left,
      right: (rect as any).right,
      top: (rect as any).top,
      width: (rect as any).width
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
      this.caption = options.labelDisplayCaption;
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
    if (options.labelVisibility !== undefined) {
      if (this.seLabel !== undefined) {
        this.seLabel.showing = options.labelVisibility; //Applied immediately
      }
    }
    if (options.objectVisibility !== undefined) {
      if (this.seLabel !== undefined) {
        this.seLabel.parent.showing = options.objectVisibility; //Applied immediately
      }
    }
    if (options.labelTextScalePercent) {
      this.textScalePercent = options.labelTextScalePercent;
    }
    if (options.panel === StyleEditPanels.Front) {
      // Set the front options
      if (options.fillColor !== undefined) {
        this.frontFillColor = options.fillColor;
      }
      if (options.opacity !== undefined) {
        this.frontOpacity = options.opacity;
      }
    } else if (options.panel === StyleEditPanels.Back) {
      // Set the back options
      // options.dynamicBackStyle is boolean, so we need to explicitly check for undefined otherwise
      // when it is false, this doesn't execute and this.dynamicBackStyle is not set
      if (options.dynamicBackStyle !== undefined) {
        this.dynamicBackStyle = options.dynamicBackStyle;
      }
      // overwrite the back options only in the case the dynamic style is not enabled
      if (!this.dynamicBackStyle) {
        if (options.fillColor !== undefined) {
          this.backFillColor = options.fillColor;
        }
        if (options.opacity !== undefined) {
          this.backOpacity = options.opacity;
        }
      }
    }
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
        return {
          panel: panel,
          fillColor: this.frontFillColor,
          opacity: this.frontOpacity,
          dynamicBackStyle: this.dynamicBackStyle
        };
      }
      case StyleEditPanels.Back: {
        return {
          panel: panel,
          fillColor: this.backFillColor,
          opacity: this.backOpacity,
          dynamicBackStyle: this.dynamicBackStyle
        };
      }
      default:
      case StyleEditPanels.Basic: {
        let objectVisibility: boolean | undefined = undefined;
        if (this.seLabel !== undefined) {
          objectVisibility = this.seLabel.parent.showing;
        }
        return {
          panel: panel,
          labelDisplayText: this.shortUserName,
          labelDisplayCaption: this.caption,
          labelDisplayMode: this.textLabelMode,
          labelTextFamily: this.textFamily,
          labelTextStyle: this.textStyle,
          labelTextDecoration: this.textDecoration,
          labelTextRotation: this.textRotation,
          labelVisibility: this.frontText.visible || this.backText.visible,
          objectVisibility: objectVisibility,
          labelTextScalePercent: this.textScalePercent
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
        return {
          panel: panel,
          fillColor: SETTINGS.label.fillColor.front,
          opacity: SETTINGS.label.opacity.front,
          dynamicBackStyle: SETTINGS.label.dynamicBackStyle
        };
      }
      case StyleEditPanels.Back: {
        return {
          panel: panel,
          fillColor: SETTINGS.label.dynamicBackStyle
            ? Nodule.contrastFillColor(SETTINGS.label.fillColor.front)
            : SETTINGS.label.fillColor.back,
          opacity: SETTINGS.label.dynamicBackStyle
            ? Nodule.contrastOpacity(SETTINGS.label.opacity.front)
            : SETTINGS.label.opacity.back,
          dynamicBackStyle: SETTINGS.label.dynamicBackStyle
        };
      }
      default:
      case StyleEditPanels.Basic: {
        let labelVisibility: boolean | undefined = undefined;
        if (this.seLabel !== undefined) {
          if (this.seLabel.parent instanceof SEPoint) {
            labelVisibility = SETTINGS.point.showLabelsInitially;
          } else if (this.seLabel.parent instanceof SELine) {
            labelVisibility = SETTINGS.line.showLabelsInitially;
          } else if (this.seLabel.parent instanceof SESegment) {
            labelVisibility = SETTINGS.segment.showLabelsInitially;
          } else if (this.seLabel.parent instanceof SECircle) {
            labelVisibility = SETTINGS.circle.showLabelsInitially;
          }
        }
        return {
          panel: panel, //
          labelDisplayText: this.initialName,
          labelDisplayCaption: "",
          labelDisplayMode: SETTINGS.label.labelMode,
          labelTextFamily: SETTINGS.label.family,
          labelTextStyle: SETTINGS.label.style,
          labelTextDecoration: SETTINGS.label.decoration,
          labelTextRotation: SETTINGS.label.rotation,
          labelVisibility: labelVisibility,
          objectVisibility: true,
          labelTextScalePercent: SETTINGS.label.textScalePercent
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
   * Set the rendering style (flags: ApplyTemporaryVariables, ApplyCurrentVariables, ResetVariablesToDefaults) of the line
   *
   * ApplyTemporaryVariables means that
   *    1) The temporary variables from SETTINGS.point.temp are copied into the actual Two.js objects
   *    2) The pointScaleFactor is copied from the Point.pointScaleFactor (which accounts for the Zoom magnification) into the actual Two.js objects
   *
   * Apply CurrentVariables means that all current values of the private style variables are copied into the actual Two.js objects
   *
   * ResetVariablesToDefaults means that all the private style variables are set to their defaults from SETTINGS.
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
        let value: string;
        switch (this.textLabelMode) {
          case LabelDisplayMode.NameOnly: {
            value = this.shortUserName;
            break;
          }
          case LabelDisplayMode.CaptionOnly: {
            value = this.caption;
            break;
          }
          case LabelDisplayMode.NameAndCaption: {
            value = this.shortUserName + ": " + this.caption;
            break;
          }
        }
        this.frontText.value = value;
        this.backText.value = value;
        this.glowingFrontText.value = value;
        this.glowingBackText.value = value;
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
        if (this.frontFillColor === "noFill") {
          this.frontText.noFill();
        } else {
          this.frontText.fill = this.frontFillColor;
        }
        this.frontText.opacity = this.frontOpacity;

        // BACK
        if (this.dynamicBackStyle) {
          if (Nodule.contrastFillColor(this.frontFillColor) === "noFill") {
            this.backText.noFill();
          } else {
            this.backText.fill = Nodule.contrastFillColor(this.frontFillColor);
          }
        } else {
          if (this.backFillColor === "noFill") {
            this.backText.noFill();
          } else {
            this.backText.fill = this.backFillColor;
          }
        }
        this.backText.opacity = this.dynamicBackStyle
          ? Nodule.contrastOpacity(this.frontOpacity)
          : this.backOpacity;

        break;
      }
    }
  }
}
