import { Vector3 } from "three";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";
import {
  StyleOptions,
  StyleCategory,
  DEFAULT_LINE_FRONT_STYLE,
  DEFAULT_LINE_BACK_STYLE
} from "@/types/Styles";
import { Arc } from "two.js/extras/jsm/arc";
import { Group } from "two.js/src/group";
import { toSVGType } from "@/types";

// The number of vectors used to render the front half (and the same number in the back half)
const SUBDIVS = SETTINGS.line.numPoints;
// The radius of the sphere on the screen
const radius = SETTINGS.boundaryCircle.radius;

/**
 * A line
 *
 * @export
 * @class Line
 * @extends Nodule
 */
export default class Line extends Nodule {
  /** The normal vector to the plane containing the line*/
  private _normalVector: Vector3;

  /**
   * NOTE: Once the above variable is set, the updateDisplay() will correctly render the line.
   * This are the only piece of information that is need to do the rendering, so the updateDisplay() is automatically
   * class when the setter is used to update the normal Vector All other
   * calculations in this class are only for the purpose of rendering the line.
   */

  /** The normal vector determines the rotation and minor axis length of the displayed ellipse */
  private _rotation: number;
  private _halfMinorAxis: number;

  /**
   * A line has half on the front and half on the back. There are glowing counterparts for each part.
   */
  protected _frontHalf: Arc;
  protected _backHalf: Arc;
  protected _glowingFrontHalf: Arc;
  protected _glowingBackHalf: Arc;

  /**
   * The styling variables for the drawn segment. The user can modify these.
   */
  // Front
  protected glowingStrokeColorFront = SETTINGS.line.glowing.strokeColor.front;
  // Back
  protected glowingStrokeColorBack = SETTINGS.line.glowing.strokeColor.back;

  /** Initialize the current line width that is adjust by the zoom level and the user widthPercent */
  static currentLineStrokeWidthFront = SETTINGS.line.drawn.strokeWidth.front;
  static currentLineStrokeWidthBack = SETTINGS.line.drawn.strokeWidth.back;
  static currentGlowingLineStrokeWidthFront =
    SETTINGS.line.drawn.strokeWidth.front + SETTINGS.line.glowing.edgeWidth;
  static currentGlowingLineStrokeWidthBack =
    SETTINGS.line.drawn.strokeWidth.back + SETTINGS.line.glowing.edgeWidth;

  /**
   * Update all the current stroke widths
   * @param factor The ratio of the current magnification factor over the old magnification factor
   */
  static updateCurrentStrokeWidthForZoom(factor: number): void {
    Line.currentLineStrokeWidthFront *= factor;
    Line.currentLineStrokeWidthBack *= factor;
    Line.currentGlowingLineStrokeWidthFront *= factor;
    Line.currentGlowingLineStrokeWidthBack *= factor;
  }

  constructor(noduleName: string = "None") {
    super(noduleName);
    this._frontHalf = new Arc(
      0,
      0,
      2 * radius,
      2 * radius,
      Math.PI,
      2 * Math.PI,
      SUBDIVS
    );
    this._glowingFrontHalf = new Arc(
      0,
      0,
      2 * radius,
      2 * radius,
      Math.PI,
      2 * Math.PI,
      SUBDIVS
    );
    // Create the back half, glowing front half, glowing back half circle by cloning the front half
    this._backHalf = new Arc(0, 0, 2 * radius, 2 * radius, 0, Math.PI, SUBDIVS);
    this._glowingBackHalf = new Arc(
      0,
      0,
      2 * radius,
      2 * radius,
      0,
      Math.PI,
      SUBDIVS
    );

    //Record the path ids for all the TwoJS objects which are not glowing. This is for use in IconBase to create icons.
    Nodule.idPlottableDescriptionMap.set(String(this._frontHalf.id), {
      type: "line",
      side: "front",
      fill: false,
      part: ""
    });
    Nodule.idPlottableDescriptionMap.set(String(this._backHalf.id), {
      type: "line",
      side: "back",
      fill: false,
      part: ""
    });

    // The line is not initially glowing but is visible for the temporary object
    this._frontHalf.visible = true;
    this._backHalf.visible = true;
    this._glowingFrontHalf.visible = false;
    this._glowingBackHalf.visible = false;

    // Set the style that never changes -- Fill
    this._frontHalf.noFill();
    this._glowingFrontHalf.noFill();
    this._backHalf.noFill();
    this._glowingBackHalf.noFill();

    // set the normal vector
    this._normalVector = new Vector3();
    //Let \[Beta]  be the angle between the north pole NP= <0,0,1> and the unit normal vector (with z coordinate positive), then cos(\[Beta]) is half the minor axis.
    //Note:
    //  0 <= \[Beta] <= \[Pi]/2.
    //  _normalVector.z = NP._normalVector = |NP||_normalVector|cos(\[Beta])= cos(\[Beta])
    this._halfMinorAxis = this._normalVector.z;

    this._rotation = 0; //Initially the normal vector is <0,0,1> so the rotation is 0 in general the rotation angle is
    //Let \[Theta] be the angle between the vector <0,1> and <n_x,n_y>, then \[Theta] is the angle of rotation. Note that \[Theta] = -ATan2(n_x,n_y) (measured counterclockwise)

    this.styleOptions.set(StyleCategory.Front, DEFAULT_LINE_FRONT_STYLE);
    this.styleOptions.set(StyleCategory.Back, DEFAULT_LINE_BACK_STYLE);
  }

  /**
   * This is the only vector that needs to be set in order to render the line.  This also updates the display
   */
  set normalVector(dir: Vector3) {
    this._normalVector.copy(dir).normalize();
    this._halfMinorAxis = this._normalVector.z;
    this._rotation = -Math.atan2(this._normalVector.x, this._normalVector.y); // not a typo because we are measuring off of the positive y axis in the screen plane
    this.updateDisplay();
  }

  glowingDisplay(): void {
    this._frontHalf.visible = true;
    this._glowingFrontHalf.visible = true;
    this._backHalf.visible = true;
    this._glowingBackHalf.visible = true;
  }

  normalDisplay(): void {
    this._frontHalf.visible = true;
    this._glowingFrontHalf.visible = false;
    this._backHalf.visible = true;
    this._glowingBackHalf.visible = false;
  }

  setVisible(flag: boolean): void {
    this._frontHalf.visible = false;
    this._glowingFrontHalf.visible = false;
    this._backHalf.visible = false;
    this._glowingBackHalf.visible = false;
    if (flag) {
      this._backHalf.visible = true;
      this._glowingBackHalf.visible = false;
      this._frontHalf.visible = true;
      this._glowingFrontHalf.visible = false;
    }

    // if (!flag) {
    //   this.frontHalf.visible = false;
    //   this.glowingFrontHalf.visible = false;
    //   this.backHalf.visible = false;
    //   this.glowingBackHalf.visible = false;
    // } else {
    //   this.normalDisplay();
    // }
  }
  /**
   * Update the display of line
   * This method updates the TwoJS objects (frontHalf, backHalf, ...) for display
   * This is only accurate if the normal vector is correct so only
   * call this method once that vector is updated.
   */
  public updateDisplay(): void {
    this._frontHalf.rotation = this._rotation;
    this._glowingFrontHalf.rotation = this._rotation;
    this._backHalf.rotation = this._rotation;
    this._glowingBackHalf.rotation = this._rotation;

    // make sure the height is never zero, otherwise you get an SVG error about a NaN
    const tempHalfMinorAxis =
      Math.abs(this._halfMinorAxis) < SETTINGS.tolerance
        ? 0.00001
        : 2 * radius * this._halfMinorAxis;
    this._frontHalf.height = tempHalfMinorAxis;
    this._glowingFrontHalf.height = tempHalfMinorAxis;
    this._backHalf.height = tempHalfMinorAxis;
    this._glowingBackHalf.height = tempHalfMinorAxis;
  }

  setSelectedColoring(flag: boolean): void {
    //set the new colors into the variables
    if (flag) {
      this.glowingStrokeColorFront = SETTINGS.style.selectedColor.front;
      this.glowingStrokeColorBack = SETTINGS.style.selectedColor.back;
    } else {
      this.glowingStrokeColorFront = SETTINGS.line.glowing.strokeColor.front;
      this.glowingStrokeColorBack = SETTINGS.line.glowing.strokeColor.back;
    }
    // apply the new color variables to the object
    this.stylize(DisplayStyle.ApplyCurrentVariables);
  }

  addToLayers(layers: Group[]): void {
    this._frontHalf.addTo(layers[LAYER.foreground]);
    this._glowingFrontHalf.addTo(layers[LAYER.foregroundGlowing]);
    this._backHalf.addTo(layers[LAYER.background]);
    this._glowingBackHalf.addTo(layers[LAYER.backgroundGlowing]);
  }

  removeFromLayers(): void {
    this._frontHalf.remove();
    this._backHalf.remove();
    this._glowingFrontHalf.remove();
    this._glowingBackHalf.remove();
  }

  toSVG():toSVGType{
    // Create an empty return type and then fill in the non-null parts
    const returnSVGObject: toSVGType = {
      frontGradientDictionary: null,
      backGradientDictionary: null,
      frontStyleDictionary: null,
      backStyleDictionary: null,
      layerSVGArray: [],
      type: "angleMarker"
    }
    return returnSVGObject
  }

  /**
   * Return the default style state
   */
  defaultStyleState(panel: StyleCategory): StyleOptions {
    switch (panel) {
      case StyleCategory.Front:
        return DEFAULT_LINE_FRONT_STYLE;
      case StyleCategory.Back:
        if (SETTINGS.line.dynamicBackStyle)
          return {
            ...DEFAULT_LINE_BACK_STYLE,
            strokeWidthPercent: Nodule.contrastStrokeWidthPercent(100),
            strokeColor: Nodule.contrastStrokeColor(
              SETTINGS.line.drawn.strokeColor.front
            )
          };
        else return DEFAULT_LINE_BACK_STYLE;
      default:
        return {};
    }
  }
  /**
   * Sets the variables for stroke width glowing/not
   */
  adjustSize(): void {
    const frontStyle = this.styleOptions.get(StyleCategory.Front);
    const backStyle = this.styleOptions.get(StyleCategory.Back);
    const frontStrokeWidthPercent = frontStyle?.strokeWidthPercent ?? 100;
    const backStrokeWidthPercent = backStyle?.strokeWidthPercent ?? 100;
    this._frontHalf.linewidth =
      (Line.currentLineStrokeWidthFront * frontStrokeWidthPercent) / 100;

    this._backHalf.linewidth =
      (Line.currentLineStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
      100;
    this._glowingFrontHalf.linewidth =
      (Line.currentGlowingLineStrokeWidthFront * frontStrokeWidthPercent) / 100;
    this._glowingBackHalf.linewidth =
      (Line.currentGlowingLineStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
      100;
  }

  /**
   * Set the rendering style (flags: ApplyTemporaryVariables, ApplyCurrentVariables) of the line
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
        // Use the SETTINGS temporary options to directly modify the js objects.

        // Front
        // no fillColor
        if (
          Nodule.hslaIsNoFillOrNoStroke(SETTINGS.line.temp.strokeColor.front)
        ) {
          this._frontHalf.noStroke();
        } else {
          this._frontHalf.stroke = SETTINGS.line.temp.strokeColor.front;
        }
        // strokeWidthPercent -- The line width is set to the current line width (which is updated for zoom magnification)
        this._frontHalf.linewidth = Line.currentLineStrokeWidthFront;
        // Copy the front dash properties from the front default drawn dash properties
        if (SETTINGS.line.drawn.dashArray.front.length > 0) {
          this._frontHalf.dashes.clear();
          SETTINGS.line.drawn.dashArray.front.forEach(v => {
            this._frontHalf.dashes.push(v);
          });
          if (SETTINGS.line.drawn.dashArray.reverse.front) {
            this._frontHalf.dashes.reverse();
          }
        }

        // Back
        // no fill color
        if (
          Nodule.hslaIsNoFillOrNoStroke(SETTINGS.line.temp.strokeColor.back)
        ) {
          this._backHalf.noStroke();
        } else {
          this._backHalf.stroke = SETTINGS.line.temp.strokeColor.back;
        }
        // strokeWidthPercent -- The line width is set to the current line width (which is updated for zoom magnification)
        this._backHalf.linewidth = Line.currentLineStrokeWidthBack;

        // Copy the back dash properties from the back default drawn dash properties
        if (SETTINGS.line.drawn.dashArray.back.length > 0) {
          this._backHalf.dashes.clear();
          SETTINGS.line.drawn.dashArray.back.forEach(v => {
            this._backHalf.dashes.push(v);
          });
          if (SETTINGS.line.drawn.dashArray.reverse.back) {
            this._backHalf.dashes.reverse();
          }
        }

        // The temporary display is never highlighted
        this._glowingFrontHalf.visible = false;
        this._glowingBackHalf.visible = false;
        break;
      }

      case DisplayStyle.ApplyCurrentVariables: {
        // Use the current variables to directly modify the js objects.

        // Front
        const frontStyle = this.styleOptions.get(StyleCategory.Front);
        // no fillColor
        if (Nodule.hslaIsNoFillOrNoStroke(frontStyle?.strokeColor)) {
          this._frontHalf.noStroke();
        } else {
          this._frontHalf.stroke = frontStyle?.strokeColor ?? "black";
        }
        // strokeWidthPercent applied by adjustSize()

        if (
          frontStyle?.dashArray &&
          frontStyle?.reverseDashArray !== undefined &&
          frontStyle?.dashArray.length > 0
        ) {
          this._frontHalf.dashes.clear();
          this._frontHalf.dashes.push(...frontStyle?.dashArray);
          if (frontStyle.reverseDashArray) {
            this._frontHalf.dashes.reverse();
          }
        } else {
          // the array length is zero and no dash array should be set
          this._frontHalf.dashes.clear();
          this._frontHalf.dashes.push(0);
        }

        // Back
        const backStyle = this.styleOptions.get(StyleCategory.Back);
        // no fillColor
        if (backStyle?.dynamicBackStyle) {
          if (
            Nodule.hslaIsNoFillOrNoStroke(
              Nodule.contrastStrokeColor(frontStyle?.strokeColor)
            )
          ) {
            this._backHalf.noStroke();
          } else {
            this._backHalf.stroke = Nodule.contrastStrokeColor(
              frontStyle?.strokeColor ?? "black"
            );
          }
        } else {
          if (Nodule.hslaIsNoFillOrNoStroke(backStyle?.strokeColor)) {
            this._backHalf.noStroke();
          } else {
            this._backHalf.stroke = backStyle?.strokeColor ?? "black";
          }
        }
        // strokeWidthPercent applied by adjustSize()

        if (
          backStyle?.dashArray &&
          backStyle?.reverseDashArray !== undefined &&
          backStyle.dashArray.length > 0
        ) {
          this._backHalf.dashes.clear();
          this._backHalf.dashes.push(...backStyle.dashArray);
          if (backStyle.reverseDashArray) {
            this._backHalf.dashes.reverse();
          }
        } else {
          // the array length is zero and no dash array should be set
          this._backHalf.dashes.clear();
          this._backHalf.dashes.push(0);
        }

        // Glowing Front
        // no fillColor
        this._glowingFrontHalf.stroke = this.glowingStrokeColorFront;
        // strokeWidthPercent applied by adjustSize()

        // Copy the front dash properties to the glowing object
        if (
          frontStyle?.dashArray &&
          frontStyle?.reverseDashArray !== undefined &&
          frontStyle?.dashArray.length > 0
        ) {
          this._glowingFrontHalf.dashes.clear();
          this._glowingFrontHalf.dashes.push(...frontStyle?.dashArray);
          if (frontStyle.reverseDashArray) {
            this._glowingFrontHalf.dashes.reverse();
          }
        } else {
          // the array length is zero and no dash array should be set
          this._glowingFrontHalf.dashes.clear();
          this._glowingFrontHalf.dashes.push(0);
        }

        // Glowing Back
        // no fillColor
        this._glowingBackHalf.stroke = this.glowingStrokeColorBack;
        // strokeWidthPercent applied by adjustSize()

        // Copy the back dash properties to the glowing object
        if (
          backStyle?.dashArray &&
          backStyle?.reverseDashArray !== undefined &&
          backStyle.dashArray.length > 0
        ) {
          this._glowingBackHalf.dashes.clear();
          this._glowingBackHalf.dashes.push(...backStyle.dashArray);
          if (backStyle.reverseDashArray) {
            this._glowingBackHalf.dashes.reverse();
          }
        } else {
          // the array length is zero and no dash array should be set
          this._glowingBackHalf.dashes.clear();
          this._glowingBackHalf.dashes.push(0);
        }
        break;
      }
    }
  }
}
