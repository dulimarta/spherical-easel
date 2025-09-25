import SETTINGS from "@/global-settings-spherical";
import Nodule, { DisplayStyle } from "./Nodule";
import {
  StyleOptions,
  StyleCategory,
  DEFAULT_NONFREE_CIRCLE_FRONT_STYLE,
  DEFAULT_NONFREE_CIRCLE_BACK_STYLE
} from "@/types/Styles";
import Circle from "./Circle";
import { toSVGType } from "@/types";

export default class NonFreeCircle extends Circle {
  /**
   * non free circles are thinner by nonFreeCircleScalePercent
   */
  private nonFreeCircleScalePercent = SETTINGS.circle.nonFree.scalePercent;

  constructor(noduleName: string = "None") {
    super(noduleName);

    // Apply the new style and size
    this.stylize(DisplayStyle.ApplyCurrentVariables);
    this.adjustSize();
    this.styleOptions.set(
      StyleCategory.Front,
      DEFAULT_NONFREE_CIRCLE_FRONT_STYLE
    );
    this.styleOptions.set(
      StyleCategory.Back,
      DEFAULT_NONFREE_CIRCLE_BACK_STYLE
    );
  }

  /**
   * Return the default style state
   */
  defaultStyleState(panel: StyleCategory): StyleOptions {
    switch (panel) {
      case StyleCategory.Front:
        return DEFAULT_NONFREE_CIRCLE_FRONT_STYLE;

      case StyleCategory.Back:
        if (SETTINGS.circle.dynamicBackStyle)
          return {
            ...DEFAULT_NONFREE_CIRCLE_BACK_STYLE,
            strokeWidthPercent: Nodule.contrastStrokeWidthPercent(
              this.nonFreeCircleScalePercent
            ),
            strokeColor: Nodule.contrastStrokeColor(
              SETTINGS.circle.nonFree.strokeColor.front
            )
          };
        else return DEFAULT_NONFREE_CIRCLE_BACK_STYLE;

      default:
        return {};
    }
  }
  /**
   * Sets the variables for stroke width glowing/not
   */
  adjustSize(): void {
    // console.debug("Non free circle: adjust size");
    const frontStyle = this.styleOptions.get(StyleCategory.Front);
    const backStyle = this.styleOptions.get(StyleCategory.Back);
    const frontStrokeWidthPercent = frontStyle?.strokeWidthPercent ?? 100;
    const backStrokeWidthPercent = backStyle?.strokeWidthPercent ?? 100;
    this._frontPart.linewidth =
      ((Circle.currentCircleStrokeWidthFront * frontStrokeWidthPercent) / 100) *
      (this.nonFreeCircleScalePercent / 100);

    this._backPart.linewidth =
      ((Circle.currentCircleStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
        100) *
      (this.nonFreeCircleScalePercent / 100);

    this._glowingFrontPart.linewidth =
      ((Circle.currentGlowingCircleStrokeWidthFront * frontStrokeWidthPercent) /
        100) *
      (this.nonFreeCircleScalePercent / 100);

    this._glowingBackPart.linewidth =
      ((Circle.currentGlowingCircleStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
        100) *
      (this.nonFreeCircleScalePercent / 100);
  }
}
