import SETTINGS from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";
import {
  StyleOptions,
  StyleEditPanels,
  DEFAULT_NONFREE_LINE_FRONT_STYLE,
  DEFAULT_NONFREE_LINE_BACK__STYLE
} from "@/types/Styles";
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
    // const dashArrayFront: Array<number> = [];
    // if (SETTINGS.line.nonFree.dashArray.front.length > 0) {
    //   dashArrayFront.push(...SETTINGS.line.nonFree.dashArray.front);
    // }

    // Back use the default non-dynamic back style options so that when the user disables the dynamic back style these options are displayed
    // this.dynamicBackStyle = SETTINGS.line.dynamicBackStyle;
    // this.strokeColorBack = SETTINGS.line.nonFree.strokeColor.back;
    // if (SETTINGS.line.nonFree.dashArray.back.length > 0) {
    //   SETTINGS.line.nonFree.dashArray.back.forEach(v =>
    //     this.dashArrayBack.push(v)
    //   );
    // }
    // this.strokeWidthPercentBack = 100;

    // Now apply the new style and size
    this.stylize(DisplayStyle.ApplyCurrentVariables);
    this.adjustSize();
    this.styleOptions.set(
      StyleEditPanels.Front,
      DEFAULT_NONFREE_LINE_FRONT_STYLE
    );
    this.styleOptions.set(
      StyleEditPanels.Back,
      DEFAULT_NONFREE_LINE_BACK__STYLE
    );
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
    const frontStyle = this.styleOptions.get(StyleEditPanels.Front);
    const backStyle = this.styleOptions.get(StyleEditPanels.Back);
    const frontStrokeWidthPercent = frontStyle?.strokeWidthPercent ?? 100;
    const backStrokeWidthPercent = backStyle?.strokeWidthPercent ?? 100;
    this.frontHalf.linewidth =
      ((Line.currentLineStrokeWidthFront * frontStrokeWidthPercent) / 100) *
      (this.nonFreeLineScalePercent / 100);

    this.backHalf.linewidth =
      ((Line.currentLineStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
        100) *
      (this.nonFreeLineScalePercent / 100);

    this.glowingFrontHalf.linewidth =
      ((Line.currentGlowingLineStrokeWidthFront * frontStrokeWidthPercent) /
        100) *
      (this.nonFreeLineScalePercent / 100);

    this.glowingBackHalf.linewidth =
      ((Line.currentGlowingLineStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
        100) *
      (this.nonFreeLineScalePercent / 100);
  }
}
