import SETTINGS from "@/global-settings";
import Nodule from "./Nodule";
import {
  StyleOptions,
  StyleCategory,
  DEFAULT_NONFREE_ELLIPSE_FRONT_STYLE,
  DEFAULT_NONFREE_ELLIPSE_BACK_STYLE
} from "@/types/Styles";
import Ellipse from "./Ellipse";
import { toSVGType } from "@/types";

export default class NonFreeEllipse extends Ellipse {
  /**
   * non free ellipses are thinner by nonFreeLineScalePercent
   */
  private nonFreeEllipseScalePercent = SETTINGS.ellipse.nonFree.scalePercent;
  constructor(noduleName: string) {
    super(noduleName);

    this.styleOptions.set(
      StyleCategory.Front,
      DEFAULT_NONFREE_ELLIPSE_FRONT_STYLE
    );
    this.styleOptions.set(
      StyleCategory.Back,
      DEFAULT_NONFREE_ELLIPSE_BACK_STYLE
    );
  }

  /**
   * Return the default style state
   */
  defaultStyleState(panel: StyleCategory): StyleOptions {
    switch (panel) {
      case StyleCategory.Front:
        return DEFAULT_NONFREE_ELLIPSE_FRONT_STYLE;
      case StyleCategory.Back:
        if (SETTINGS.ellipse.dynamicBackStyle)
          return {
            ...DEFAULT_NONFREE_ELLIPSE_BACK_STYLE,
            strokeWidthPercent: Nodule.contrastStrokeWidthPercent(
              this.nonFreeEllipseScalePercent
            ),
            strokeColor: Nodule.contrastStrokeColor(
              SETTINGS.ellipse.drawn.strokeColor.front
            ),
            fillColor: Nodule.contrastFillColor(
              SETTINGS.ellipse.drawn.fillColor.front
            )
          };
        else return DEFAULT_NONFREE_ELLIPSE_BACK_STYLE;

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
    this.frontPart.linewidth =
      (((Ellipse.currentEllipseStrokeWidthFront * frontStrokeWidthPercent) /
        100) *
        this.nonFreeEllipseScalePercent) /
      100;
    this.backPart.linewidth =
      (((Ellipse.currentEllipseStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
        100) *
        this.nonFreeEllipseScalePercent) /
      100;
    this.glowingFrontPart.linewidth =
      (((Ellipse.currentGlowingEllipseStrokeWidthFront *
        frontStrokeWidthPercent) /
        100) *
        this.nonFreeEllipseScalePercent) /
      100;
    this.glowingBackPart.linewidth =
      (((Ellipse.currentGlowingEllipseStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
        100) *
        this.nonFreeEllipseScalePercent) /
      100;
  }
}
