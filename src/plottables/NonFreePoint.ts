/** @format */

// import SETTINGS from "@/global-settings";
import SETTINGS from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";
import {
  StyleOptions,
  StyleCategory,
  DEFAULT_NONFREEPOINT_FRONT_STYLE,
  DEFAULT_NONFREEPOINT_BACK_STYLE
} from "@/types/Styles";
import Point from "@/plottables/Point";
import { toSVGType } from "@/types";

/**
 * Each Point object is uniquely associated with a SEPoint object.
 * As part of plottables, Point concerns mainly with the visual appearance, but
 * SEPoint concerns mainly with geometry computations.
 */

export default class NonFreePoint extends Point {
  /**
   * non free points are smaller by nonFreePointScalePercent
   */
  private nonFreePointScalePercent = SETTINGS.point.nonFree.scalePercent;

  constructor(noduleName: string = "None") {
    super(noduleName);
    // Now apply the new style and size
    this.stylize(DisplayStyle.ApplyCurrentVariables);
    this.adjustSize();
    this.styleOptions.set(
      StyleCategory.Front,
      DEFAULT_NONFREEPOINT_FRONT_STYLE
    );
    this.styleOptions.set(
      StyleCategory.Back,
      DEFAULT_NONFREEPOINT_BACK_STYLE
    );
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
        return DEFAULT_NONFREEPOINT_FRONT_STYLE;
      case StyleCategory.Back:
        if (SETTINGS.point.dynamicBackStyle)
          return {
            ...DEFAULT_NONFREEPOINT_BACK_STYLE,
            pointRadiusPercent: Nodule.contrastPointRadiusPercent(
              this.nonFreePointScalePercent
            ),
            strokeColor: Nodule.contrastStrokeColor(
              SETTINGS.point.nonFree.strokeColor.front
            ),
            fillColor: Nodule.contrastFillColor(
              SETTINGS.point.nonFree.fillColor.front
            )
          };
        else return DEFAULT_NONFREEPOINT_BACK_STYLE;

      default:
        return {};
    }
  }
  /**
   * Sets the variables for point radius glowing/not
   */
  adjustSize(): void {
    const frontStyle = this.styleOptions.get(StyleCategory.Front);
    const backStyle = this.styleOptions.get(StyleCategory.Back);
    const radiusPercentFront = frontStyle?.pointRadiusPercent ?? 100;
    const radiusPercentBack = backStyle?.pointRadiusPercent ?? 90;
    this.frontPoint.scale =
      ((Point.pointScaleFactor * radiusPercentFront) / 100) *
      (this.nonFreePointScalePercent / 100);

    this.backPoint.scale =
      (((Point.pointScaleFactor * this.nonFreePointScalePercent) / 100) *
        (backStyle?.dynamicBackStyle ?? false
          ? Nodule.contrastPointRadiusPercent(radiusPercentFront)
          : radiusPercentBack)) /
      100;

    this.glowingFrontPoint.scale =
      (((Point.pointScaleFactor * this.nonFreePointScalePercent) / 100) *
        radiusPercentFront) /
      100;

    this.glowingBackPoint.scale =
      (((Point.pointScaleFactor * this.nonFreePointScalePercent) / 100) *
        (backStyle?.dynamicBackStyle ?? false
          ? Nodule.contrastStrokeWidthPercent(radiusPercentFront)
          : radiusPercentBack)) /
      100;
  }
}
