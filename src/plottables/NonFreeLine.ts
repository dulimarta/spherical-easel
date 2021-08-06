import SETTINGS from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";
import {
  StyleOptions,
  StyleEditPanels,
  DEFAULT_NONFREE_LINE_FRONT_STYLE,
  DEFAULT_NONFREE_LINE_BACK_STYLE
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
      DEFAULT_NONFREE_LINE_BACK_STYLE
    );
  }

  /**
   * Return the default style state
   */
  defaultStyleState(panel: StyleEditPanels): StyleOptions {
    switch (panel) {
      case StyleEditPanels.Front:
        return DEFAULT_NONFREE_LINE_FRONT_STYLE;

      case StyleEditPanels.Back:
        if (SETTINGS.line.dynamicBackStyle)
          return {
            ...DEFAULT_NONFREE_LINE_BACK_STYLE,
            strokeWidthPercent: Nodule.contrastStrokeWidthPercent(100),
            strokeColor: Nodule.contrastStrokeColor(
              SETTINGS.line.nonFree.strokeColor.front
            )
          };
        else return DEFAULT_NONFREE_LINE_BACK_STYLE;

      default:
        return {};
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
