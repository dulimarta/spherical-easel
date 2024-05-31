import SETTINGS from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";
import {
  StyleOptions,
  StyleCategory,
  DEFAULT_NONFREE_LINE_FRONT_STYLE,
  DEFAULT_NONFREE_LINE_BACK_STYLE
} from "@/types/Styles";
import Line from "./Line";

export default class NonFreeLine extends Line {
  /**
   * non free lines are thinner by nonFreeLineScalePercent
   */
  private nonFreeLineScalePercent = SETTINGS.line.nonFree.scalePercent;

  constructor(noduleName: string = "None") {
    super(noduleName);

    // Apply the new style and size
    this.stylize(DisplayStyle.ApplyCurrentVariables);
    this.adjustSize();
    this.styleOptions.set(
      StyleCategory.Front,
      DEFAULT_NONFREE_LINE_FRONT_STYLE
    );
    this.styleOptions.set(
      StyleCategory.Back,
      DEFAULT_NONFREE_LINE_BACK_STYLE
    );
  }

  /**
   * Return the default style state
   */
  defaultStyleState(panel: StyleCategory): StyleOptions {
    switch (panel) {
      case StyleCategory.Front:
        return DEFAULT_NONFREE_LINE_FRONT_STYLE;

      case StyleCategory.Back:
        if (SETTINGS.line.dynamicBackStyle)
          return {
            ...DEFAULT_NONFREE_LINE_BACK_STYLE,
            strokeWidthPercent: Nodule.contrastStrokeWidthPercent(
              this.nonFreeLineScalePercent
            ),
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
    //console.debug("Non free line");
    const frontStyle = this.styleOptions.get(StyleCategory.Front);
    const backStyle = this.styleOptions.get(StyleCategory.Back);
    const frontStrokeWidthPercent = frontStyle?.strokeWidthPercent ?? 100;
    const backStrokeWidthPercent = backStyle?.strokeWidthPercent ?? 100;
    this.frontHalf.linewidth =
      ((Line.currentLineStrokeWidthFront * frontStrokeWidthPercent) / 100) *
      (this.nonFreeLineScalePercent / 100);
    //console.debug("  linewidth", this.frontHalf.linewidth);
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
