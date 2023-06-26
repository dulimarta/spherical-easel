import SETTINGS from "@/global-settings";
import Nodule from "./Nodule";
import {
  StyleOptions,
  StyleEditPanels,
  DEFAULT_NONFREE_ELLIPSE_FRONT_STYLE,
  DEFAULT_NONFREE_ELLIPSE_BACK_STYLE
} from "@/types/Styles";
import Ellipse from "./Ellipse";
import { Vector3 } from "three";

export default class NonFreeEllipse extends Ellipse {
  /**
   * non free ellipses are thinner by nonFreeLineScalePercent
   */
  private nonFreeEllipseScalePercent = SETTINGS.ellipse.nonFree.scalePercent;
  constructor() {
    super();

    this.styleOptions.set(
      StyleEditPanels.Front,
      DEFAULT_NONFREE_ELLIPSE_FRONT_STYLE
    );
    this.styleOptions.set(
      StyleEditPanels.Back,
      DEFAULT_NONFREE_ELLIPSE_BACK_STYLE
    );
  }

  /**
   * Return the default style state
   */
  defaultStyleState(panel: StyleEditPanels): StyleOptions {
    switch (panel) {
      case StyleEditPanels.Front:
        return DEFAULT_NONFREE_ELLIPSE_FRONT_STYLE;
      case StyleEditPanels.Back:
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
    const frontStyle = this.styleOptions.get(StyleEditPanels.Front);
    const backStyle = this.styleOptions.get(StyleEditPanels.Back);
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
