import { Vector3, Matrix4 } from "three";
import Two from "two.js";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";
import { StyleOptions, StyleEditPanels } from "@/types/Styles";
import { SENodule } from "@/models/SENodule";
import Line from "./Line";

export default class NonFreeLine extends Line {
  /**
   * non free lines are thinner by nonFreeLineScalePercent
   */
  private nonFreeLineScalePercent = SETTINGS.line.nonFree.scalePercent;

  constructor() {
    super();
    /**
     * The styling variables for the drawn non-free line. The user can modify these.
     */
    // Front
    this.strokeColorFront = SETTINGS.line.nonFree.strokeColor.front;
    if (SETTINGS.line.nonFree.dashArray.front.length > 0) {
      SETTINGS.line.nonFree.dashArray.front.forEach(v =>
        this.dashArrayFront.push(v)
      );
    }
    this.strokeWidthPercentFront = 100;

    // Back use the default non-dynamic back style options so that when the user disables the dynamic back style these options are displayed
    this.dynamicBackStyle = SETTINGS.line.dynamicBackStyle;
    this.strokeColorBack = SETTINGS.line.nonFree.strokeColor.back;
    if (SETTINGS.line.nonFree.dashArray.back.length > 0) {
      SETTINGS.line.nonFree.dashArray.back.forEach(v =>
        this.dashArrayBack.push(v)
      );
    }
    this.strokeWidthPercentBack = 100;

    // Now apply the new style and size
    this.stylize(DisplayStyle.ApplyCurrentVariables);
    this.adjustSize();
  }

  /**
   * Return the default style state
   */
  defaultStyleState(panel: StyleEditPanels): StyleOptions {
    switch (panel) {
      case StyleEditPanels.Front: {
        const dashArrayFront = [] as number[];
        if (SETTINGS.line.nonFree.dashArray.front.length > 0) {
          SETTINGS.line.nonFree.dashArray.front.forEach(v =>
            dashArrayFront.push(v)
          );
        }
        return {
          panel: panel,
          strokeWidthPercent: 100,
          strokeColor: SETTINGS.line.nonFree.strokeColor.front,
          dashArray: dashArrayFront
        };
      }
      case StyleEditPanels.Back: {
        const dashArrayBack = [] as number[];

        if (SETTINGS.line.nonFree.dashArray.back.length > 0) {
          SETTINGS.line.nonFree.dashArray.back.forEach(v =>
            dashArrayBack.push(v)
          );
        }
        return {
          panel: panel,

          strokeWidthPercent: SETTINGS.line.dynamicBackStyle
            ? Nodule.contrastStrokeWidthPercent(100)
            : 100,

          strokeColor: SETTINGS.line.dynamicBackStyle
            ? Nodule.contrastStrokeColor(
                SETTINGS.line.nonFree.strokeColor.front
              )
            : SETTINGS.line.nonFree.strokeColor.back,

          dashArray: dashArrayBack,

          dynamicBackStyle: SETTINGS.line.dynamicBackStyle
        };
      }
      default:
      case StyleEditPanels.Label: {
        return {
          panel: panel
        };
      }
    }
  }
  /**
   * Sets the variables for stroke width glowing/not
   */
  adjustSize(): void {
    this.frontHalf.linewidth =
      ((Line.currentLineStrokeWidthFront * this.strokeWidthPercentFront) /
        100) *
      (this.nonFreeLineScalePercent / 100);

    this.backHalf.linewidth =
      ((Line.currentLineStrokeWidthBack *
        (this.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(this.strokeWidthPercentFront)
          : this.strokeWidthPercentBack)) /
        100) *
      (this.nonFreeLineScalePercent / 100);

    this.glowingFrontHalf.linewidth =
      ((Line.currentGlowingLineStrokeWidthFront *
        this.strokeWidthPercentFront) /
        100) *
      (this.nonFreeLineScalePercent / 100);

    this.glowingBackHalf.linewidth =
      ((Line.currentGlowingLineStrokeWidthBack *
        (this.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(this.strokeWidthPercentFront)
          : this.strokeWidthPercentBack)) /
        100) *
      (this.nonFreeLineScalePercent / 100);
  }
}
