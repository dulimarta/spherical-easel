import SETTINGS from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";
import {
  StyleOptions,
  StyleEditPanels,
  DEFAULT_NONFREE_CIRCLE_FRONT_STYLE,
  DEFAULT_NONFREE_CIRCLE_BACK_STYLE
} from "@/types/Styles";
import Circle from "./Circle";

export default class NonFreeCircle extends Circle {
  /**
   * non free circles are thinner by nonFreeCircleScalePercent
   */
  private nonFreeCircleScalePercent = SETTINGS.circle.nonFree.scalePercent;

  constructor() {
    super();

    // Apply the new style and size
    this.stylize(DisplayStyle.ApplyCurrentVariables);
    this.adjustSize();
    this.styleOptions.set(
      StyleEditPanels.Front,
      DEFAULT_NONFREE_CIRCLE_FRONT_STYLE
    );
    this.styleOptions.set(
      StyleEditPanels.Back,
      DEFAULT_NONFREE_CIRCLE_BACK_STYLE
    );
  }

  /**
   * Return the default style state
   */
  defaultStyleState(panel: StyleEditPanels): StyleOptions {
    switch (panel) {
      case StyleEditPanels.Front:
        return DEFAULT_NONFREE_CIRCLE_FRONT_STYLE;

      case StyleEditPanels.Back:
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
    const frontStyle = this.styleOptions.get(StyleEditPanels.Front);
    const backStyle = this.styleOptions.get(StyleEditPanels.Back);
    const frontStrokeWidthPercent = frontStyle?.strokeWidthPercent ?? 100;
    const backStrokeWidthPercent = backStyle?.strokeWidthPercent ?? 100;
    this.frontPart.linewidth =
      ((Circle.currentCircleStrokeWidthFront * frontStrokeWidthPercent) / 100) *
      (this.nonFreeCircleScalePercent / 100);

    this.backPart.linewidth =
      ((Circle.currentCircleStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
        100) *
      (this.nonFreeCircleScalePercent / 100);

    this.glowingFrontPart.linewidth =
      ((Circle.currentGlowingCircleStrokeWidthFront * frontStrokeWidthPercent) /
        100) *
      (this.nonFreeCircleScalePercent / 100);

    this.glowingBackPart.linewidth =
      ((Circle.currentGlowingCircleStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
        100) *
      (this.nonFreeCircleScalePercent / 100);
  }
}
