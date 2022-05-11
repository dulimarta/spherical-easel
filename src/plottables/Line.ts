import { Vector3, Matrix4 } from "three";
import Two, { Color } from "two.js";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";
import {
  StyleOptions,
  StyleEditPanels,
  DEFAULT_LINE_FRONT_STYLE,
  DEFAULT_LINE_BACK_STYLE
} from "@/types/Styles";
import { SEStore } from "@/store";

/**
 * A line segment
 *
 * @export
 * @class Segment
 * @extends Nodule
 */
export default class Line extends Nodule {
  /** The normal vector to the plane containing the line*/
  private _normalVector: Vector3;

  /**
   * NOTE: Once the above variable is set, the updateDisplay() will correctly render the line.
   * This is the only piece of information that is need to do the rendering, so the updateDisplay() is automatically
   * called when the setter is used to update the normal Vector. All other
   * calculations in this class are only for the purpose of rendering the line.
   */

  /**
   * A line has half on the front and half on the back.There are glowing counterparts for each part.
   */
  protected frontHalf: Two.Ellipse;
  protected backHalf: Two.Ellipse;
  protected glowingFrontHalf: Two.Ellipse;
  protected glowingBackHalf: Two.Ellipse;

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

  /** Temporary ThreeJS objects for computing */
  private tmpVector = new Vector3();
  private desiredXAxis = new Vector3();
  private desiredYAxis = new Vector3();
  private transformMatrix = new Matrix4();
  constructor() {
    super();

    this.frontHalf = new Two.Ellipse(0, 0, 50, 100, SETTINGS.line.numPoints);
    // Create the back half, glowing front half, glowing back half circle
    // Don't clone because the resolution drops when you clone. Each ellipse needs a higher resolution than the default of 4
    this.backHalf = new Two.Ellipse(0, 0, 50, 100, SETTINGS.line.numPoints);
    this.glowingBackHalf = new Two.Ellipse(
      0,
      0,
      50,
      100,
      SETTINGS.line.numPoints
    );
    this.glowingFrontHalf = new Two.Ellipse(
      0,
      0,
      50,
      100,
      SETTINGS.line.numPoints
    );

    //Record the path ids for all the TwoJS objects which are not glowing. This is for use in IconBase to create icons.
    Nodule.idPlottableDescriptionMap.set(String(this.frontHalf.id), {
      type: "line",
      side: "front",
      fill: false,
      part: ""
    });
    Nodule.idPlottableDescriptionMap.set(String(this.backHalf.id), {
      type: "line",
      side: "back",
      fill: false,
      part: ""
    });

    // Set the style that never changes -- Fill and closed
    this.frontHalf.noFill();
    this.glowingFrontHalf.noFill();
    this.backHalf.noFill();
    this.glowingBackHalf.noFill();

    this.frontHalf.closed = false;
    this.glowingFrontHalf.closed = false;
    this.backHalf.closed = false;
    this.glowingBackHalf.closed = false;

    // Be sure to clone() the incoming start and end points
    // Otherwise update by other Line will affect this one!
    this._normalVector = new Vector3();

    this.styleOptions.set(StyleEditPanels.Front, DEFAULT_LINE_FRONT_STYLE);
    this.styleOptions.set(StyleEditPanels.Back, DEFAULT_LINE_BACK_STYLE);
  }

  frontGlowingDisplay(): void {
    const layers = SEStore.layers;
    this.frontHalf.addTo(layers[LAYER.foreground]);
    this.glowingFrontHalf.addTo(layers[LAYER.foregroundGlowing]);
  }

  backGlowingDisplay(): void {
    const layers = SEStore.layers;
    this.backHalf.addTo(layers[LAYER.background]);
    this.glowingBackHalf.addTo(layers[LAYER.backgroundGlowing]);
  }

  glowingDisplay(): void {
    this.frontGlowingDisplay();
    this.backGlowingDisplay();
  }

  frontNormalDisplay(): void {
    const layers = SEStore.layers;
    this.frontHalf.addTo(layers[LAYER.foreground]);
    this.glowingFrontHalf.remove();
  }

  backNormalDisplay(): void {
    const layers = SEStore.layers;
    this.backHalf.addTo(layers[LAYER.background]);
    this.glowingBackHalf.remove();
  }

  normalDisplay(): void {
    this.frontNormalDisplay();
    this.backNormalDisplay();
  }

  /**
   * Update the display of line by projecting to the plane where it is an ellipse
   * This method updates the TwoJS objects (frontHalf, backHalf, ...) for display
   * This is only accurate if the normal vector are correct so only
   * call this method once that vector is updated.
   */
  public updateDisplay(): void {
    const projectedLineData = Nodule.projectedCircleData(
      this._normalVector, // When the radius is pi/2, either normal vector (ie. multiply this one by -1) will result in the same data
      Math.PI / 2 // the radius of a line is always Pi/2
    );
    // no need to update the center of the ellipse because for lines it is always (0,0)

    // For lines the start angle is 0 or pi (NOTE: this is before rotating)
    // Convert these to percents
    let frontStart = 0;
    let frontEnd = 0;
    let backStart = 0;
    let backEnd = 0;
    if (projectedLineData.frontStartAngle < SETTINGS.tolerance) {
      frontStart = 0;
      frontEnd = 0.5;
      backStart = 0.5;
      backEnd = 1;
    } else {
      backStart = 0;
      backEnd = 0.5;
      frontStart = 0.5;
      frontEnd = 1;
    }

    this.frontHalf.width = 2 * projectedLineData.majorAxis;
    this.frontHalf.height = 2 * projectedLineData.minorAxis;
    this.frontHalf.beginning = frontStart;
    this.frontHalf.ending = frontEnd;
    this.frontHalf.rotation = projectedLineData.tiltAngle;

    this.glowingFrontHalf.width = 2 * projectedLineData.majorAxis;
    this.glowingFrontHalf.height = 2 * projectedLineData.minorAxis;
    this.glowingFrontHalf.beginning = frontStart;
    this.glowingFrontHalf.ending = frontEnd;
    this.glowingFrontHalf.rotation = projectedLineData.tiltAngle;

    this.backHalf.width = 2 * projectedLineData.majorAxis;
    this.backHalf.height = 2 * projectedLineData.minorAxis;
    this.backHalf.beginning = backStart;
    this.backHalf.ending = backEnd;
    this.backHalf.rotation = projectedLineData.tiltAngle;

    this.glowingBackHalf.width = 2 * projectedLineData.majorAxis;
    this.glowingBackHalf.height = 2 * projectedLineData.minorAxis;
    this.glowingBackHalf.beginning = backStart;
    this.glowingBackHalf.ending = backEnd;
    this.glowingBackHalf.rotation = projectedLineData.tiltAngle;
  }

  /**
   * This is the only vector that needs to be set in order to render the line.  This also updates the display
   */
  set normalVector(dir: Vector3) {
    this._normalVector.copy(dir).normalize();
    this.updateDisplay();
  }

  setVisible(flag: boolean): void {
    if (!flag) {
      this.frontHalf.remove();
      this.glowingFrontHalf.remove();
      this.backHalf.remove();
      this.glowingBackHalf.remove();
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
      this.glowingStrokeColorFront = SETTINGS.line.glowing.strokeColor.front;
      this.glowingStrokeColorBack = SETTINGS.line.glowing.strokeColor.back;
    }
    // apply the new color variables to the object
    this.stylize(DisplayStyle.ApplyCurrentVariables);
  }

  // It looks like we have to define our own clone() function
  // The builtin clone() does not seem to work correctly
  clone(): this {
    const dup = new Line();
    dup._normalVector.copy(this._normalVector);

    // no need to copy the center, it is always (0,0)

    dup.frontHalf.rotation = this.frontHalf.rotation;
    dup.frontHalf.width = this.frontHalf.width;
    dup.frontHalf.height = this.frontHalf.height;
    dup.frontHalf.beginning = this.frontHalf.beginning;
    dup.frontHalf.ending = this.frontHalf.ending;

    dup.glowingFrontHalf.rotation = this.glowingFrontHalf.rotation;
    dup.glowingFrontHalf.width = this.glowingFrontHalf.width;
    dup.glowingFrontHalf.height = this.glowingFrontHalf.height;
    dup.glowingFrontHalf.beginning = this.glowingFrontHalf.beginning;
    dup.glowingFrontHalf.ending = this.glowingFrontHalf.ending;

    dup.backHalf.rotation = this.backHalf.rotation;
    dup.backHalf.width = this.backHalf.width;
    dup.backHalf.height = this.backHalf.height;
    dup.backHalf.beginning = this.backHalf.beginning;
    dup.backHalf.ending = this.backHalf.ending;

    dup.glowingBackHalf.rotation = this.glowingBackHalf.rotation;
    dup.glowingBackHalf.width = this.glowingBackHalf.width;
    dup.glowingBackHalf.height = this.glowingBackHalf.height;
    dup.glowingBackHalf.beginning = this.glowingBackHalf.beginning;
    dup.glowingBackHalf.ending = this.glowingBackHalf.ending;

    return dup as this;
  }


  removeAllPartsFromLayers(): void {
    this.frontHalf.remove();
    this.backHalf.remove();
    this.glowingFrontHalf.remove();
    this.glowingBackHalf.remove();
  }

  /**
   * Return the default style state
   */
  defaultStyleState(panel: StyleEditPanels): StyleOptions {
    switch (panel) {
      case StyleEditPanels.Front:
        return DEFAULT_LINE_FRONT_STYLE;
      case StyleEditPanels.Back:
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
    const frontStyle = this.styleOptions.get(StyleEditPanels.Front)!;
    const backStyle = this.styleOptions.get(StyleEditPanels.Back);
    const frontStrokeWidthPercent = frontStyle?.strokeWidthPercent ?? 100;
    const backStrokeWidthPercent = backStyle?.strokeWidthPercent ?? 100;
    this.frontHalf.linewidth =
      (Line.currentLineStrokeWidthFront * frontStrokeWidthPercent) / 100;
    this.backHalf.linewidth =
      (Line.currentLineStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
      100;
    this.glowingFrontHalf.linewidth =
      (Line.currentGlowingLineStrokeWidthFront * frontStrokeWidthPercent) / 100;
    this.glowingBackHalf.linewidth =
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
   *    1) The temporary variables from SETTINGS.point.temp are copied into the actual Two.js objects
   *    2) The pointScaleFactor is copied from the Point.pointScaleFactor (which accounts for the Zoom magnification) into the actual Two.js objects
   *
   * Apply CurrentVariables means that all current values of the private style variables are copied into the actual Two.js objects
   */
  stylize(flag: DisplayStyle): void {
    switch (flag) {
      case DisplayStyle.ApplyTemporaryVariables: {
        // Use the SETTINGS temporary options to directly modify the Two.js objects.

        // Front
        // no fillColor
        if (
          Nodule.hlsaIsNoFillOrNoStroke(SETTINGS.line.temp.strokeColor.front)
        ) {
          this.frontHalf.noStroke();
        } else {
          this.frontHalf.stroke = SETTINGS.line.temp.strokeColor.front;
        }
        // strokeWidthPercent -- The line width is set to the current line width (which is updated for zoom magnification)
        this.frontHalf.linewidth = Line.currentLineStrokeWidthFront;
        // Copy the front dash properties from the front default drawn dash properties
        if (SETTINGS.line.drawn.dashArray.front.length > 0) {
          this.frontHalf.dashes.clear();
          SETTINGS.line.drawn.dashArray.front.forEach(v => {
            this.frontHalf.dashes.push(v);
          });
          if (SETTINGS.line.drawn.dashArray.reverse.front) {
            this.frontHalf.dashes.reverse();
          }
        }

        // Back
        // no fill color
        if (
          Nodule.hlsaIsNoFillOrNoStroke(SETTINGS.line.temp.strokeColor.back)
        ) {
          this.backHalf.noStroke();
        } else {
          this.backHalf.stroke = SETTINGS.line.temp.strokeColor.back;
        }
        // strokeWidthPercent -- The line width is set to the current line width (which is updated for zoom magnification)
        this.backHalf.linewidth = Line.currentLineStrokeWidthBack;

        // Copy the back dash properties from the back default drawn dash properties
        if (SETTINGS.line.drawn.dashArray.back.length > 0) {
          this.backHalf.dashes.clear();
          SETTINGS.line.drawn.dashArray.back.forEach(v => {
            this.backHalf.dashes.push(v);
          });
          if (SETTINGS.line.drawn.dashArray.reverse.back) {
            this.backHalf.dashes.reverse();
          }
        }

        // The temporary display is never highlighted
        this.glowingFrontHalf.remove();
        this.glowingBackHalf.remove();
        break;
      }

      case DisplayStyle.ApplyCurrentVariables: {
        // Use the current variables to directly modify the Two.js objects.

        // Front
        const frontStyle = this.styleOptions.get(StyleEditPanels.Front);
        // no fillColor
        if (Nodule.hlsaIsNoFillOrNoStroke(frontStyle?.strokeColor)) {
          this.frontHalf.noStroke();
        } else {
          this.frontHalf.stroke = (frontStyle?.strokeColor ??
            "black") as Two.Color;
        }
        // strokeWidthPercent applied by adjustSize()

        if (
          frontStyle?.dashArray &&
          frontStyle?.reverseDashArray !== undefined &&
          frontStyle?.dashArray.length > 0
        ) {
          this.frontHalf.dashes.clear();
          this.frontHalf.dashes.push(...frontStyle?.dashArray);
          if (frontStyle.reverseDashArray) {
            this.frontHalf.dashes.reverse();
          }
        } else {
          // the array length is zero and no dash array should be set
          this.frontHalf.dashes.clear();
          this.frontHalf.dashes.push(0);
        }

        // Back
        const backStyle = this.styleOptions.get(StyleEditPanels.Back);
        // no fillColor
        if (backStyle?.dynamicBackStyle) {
          if (
            Nodule.hlsaIsNoFillOrNoStroke(
              Nodule.contrastStrokeColor(frontStyle?.strokeColor)
            )
          ) {
            this.backHalf.noStroke();
          } else {
            this.backHalf.stroke = Nodule.contrastStrokeColor(
              frontStyle?.strokeColor ?? "black"
            );
          }
        } else {
          if (Nodule.hlsaIsNoFillOrNoStroke(backStyle?.strokeColor)) {
            this.backHalf.noStroke();
          } else {
            this.backHalf.stroke = backStyle?.strokeColor as Two.Color;
          }
        }
        // strokeWidthPercent applied by adjustSize()

        if (
          backStyle?.dashArray &&
          backStyle?.reverseDashArray !== undefined &&
          backStyle.dashArray.length > 0
        ) {
          this.backHalf.dashes.clear();
          this.backHalf.dashes.push(...backStyle.dashArray);
          if (backStyle.reverseDashArray) {
            this.backHalf.dashes.reverse();
          }
        } else {
          // the array length is zero and no dash array should be set
          this.backHalf.dashes.clear();
          this.backHalf.dashes.push(0);
        }

        // Glowing Front
        // no fillColor
        this.glowingFrontHalf.stroke = this.glowingStrokeColorFront;
        // strokeWidthPercent applied by adjustSize()

        // Copy the front dash properties to the glowing object
        if (
          frontStyle?.dashArray &&
          frontStyle?.reverseDashArray !== undefined &&
          frontStyle?.dashArray.length > 0
        ) {
          this.glowingFrontHalf.dashes.clear();
          this.glowingFrontHalf.dashes.push(...frontStyle?.dashArray);
          if (frontStyle.reverseDashArray) {
            this.glowingFrontHalf.dashes.reverse();
          }
        } else {
          // the array length is zero and no dash array should be set
          this.glowingFrontHalf.dashes.clear();
          this.glowingFrontHalf.dashes.push(0);
        }

        // Glowing Back
        // no fillColor
        this.glowingBackHalf.stroke = this.glowingStrokeColorBack;
        // strokeWidthPercent applied by adjustSize()

        // Copy the back dash properties to the glowing object
        if (
          backStyle?.dashArray &&
          backStyle?.reverseDashArray !== undefined &&
          backStyle.dashArray.length > 0
        ) {
          this.glowingBackHalf.dashes.clear();
          this.glowingBackHalf.dashes.push(...backStyle.dashArray);
          if (backStyle.reverseDashArray) {
            this.glowingBackHalf.dashes.reverse();
          }
        } else {
          // the array length is zero and no dash array should be set
          this.glowingBackHalf.dashes.clear();
          this.glowingBackHalf.dashes.push(0);
        }
        break;
      }
    }
  }
}
