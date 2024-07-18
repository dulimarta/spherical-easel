import SETTINGS from "@/global-settings";
import Nodule from "./Nodule";
import {
  StyleOptions,
  StyleCategory,
  DEFAULT_NONFREE_SEGMENT_FRONT_STYLE,
  DEFAULT_NONFREE_SEGMENT_BACK_STYLE
} from "@/types/Styles";
import Segment from "./Segment";
import { toSVGType } from "@/types";

export default class NonFreeSegment extends Segment {
  /**
   * non free lines are thinner by nonFreeLineScalePercent
   */
  private nonFreeSegmentScalePercent = SETTINGS.segment.nonFree.scalePercent;

  constructor(noduleName: string) {
    super(noduleName);

    this.styleOptions.set(
      StyleCategory.Front,
      DEFAULT_NONFREE_SEGMENT_FRONT_STYLE
    );
    this.styleOptions.set(
      StyleCategory.Back,
      DEFAULT_NONFREE_SEGMENT_BACK_STYLE
    );
  }

  toSVG():toSVGType{
    // Create an empty return type and then fill in the non-null parts
    const returnSVGType: toSVGType = {
      frontGradientDictionary: null,
      backGradientDictionary: null,
      frontStyleDictionary: null,
      backStyletDictionary: null,
      layerSVGArray: [],
      type: "angleMarker"
    }
    return returnSVGType
  }

  /**
   * Return the default style state
   */
  defaultStyleState(panel: StyleCategory): StyleOptions {
    switch (panel) {
      case StyleCategory.Front:
        return DEFAULT_NONFREE_SEGMENT_FRONT_STYLE;
      case StyleCategory.Back:
        if (SETTINGS.segment.dynamicBackStyle)
          return {
            ...DEFAULT_NONFREE_SEGMENT_BACK_STYLE,
            strokeWidthPercent: Nodule.contrastStrokeWidthPercent(
              this.nonFreeSegmentScalePercent
            ),
            strokeColor: Nodule.contrastStrokeColor(
              SETTINGS.segment.drawn.strokeColor.front
            )
          };
        else return DEFAULT_NONFREE_SEGMENT_BACK_STYLE;

      default:
      case StyleCategory.Label: {
        return {};
      }
    }
  }
  /**
   * Sets the variables for stroke width glowing/not front/back/extra
   */
  adjustSize(): void {
    const frontStyle = this.styleOptions.get(StyleCategory.Front);
    const backStyle = this.styleOptions.get(StyleCategory.Back);
    const frontStrokeWidthPercent = frontStyle?.strokeWidthPercent ?? 100;
    const backStrokeWidthPercent = backStyle?.strokeWidthPercent ?? 100;
    this.frontPart.linewidth =
      (((Segment.currentSegmentStrokeWidthFront * frontStrokeWidthPercent) /
        100) *
        this.nonFreeSegmentScalePercent) /
      100;
    this.backPart.linewidth =
      (((Segment.currentSegmentStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
        100) *
        this.nonFreeSegmentScalePercent) /
      100;
    this._glowingFrontPart.linewidth =
      (((Segment.currentGlowingSegmentStrokeWidthFront *
        frontStrokeWidthPercent) /
        100) *
        this.nonFreeSegmentScalePercent) /
      100;
    this._glowingBackPart.linewidth =
      (((Segment.currentGlowingSegmentStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
        100) *
        this.nonFreeSegmentScalePercent) /
      100;

    this._frontExtra.linewidth =
      (((Segment.currentSegmentStrokeWidthFront * frontStrokeWidthPercent) /
        100) *
        this.nonFreeSegmentScalePercent) /
      100;
    this._backExtra.linewidth =
      (((Segment.currentSegmentStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
        100) *
        this.nonFreeSegmentScalePercent) /
      100;
    this._glowingFrontExtra.linewidth =
      (((Segment.currentGlowingSegmentStrokeWidthFront *
        frontStrokeWidthPercent) /
        100) *
        this.nonFreeSegmentScalePercent) /
      100;
    this._glowingBackExtra.linewidth =
      (((Segment.currentGlowingSegmentStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
        100) *
        this.nonFreeSegmentScalePercent) /
      100;
  }
}
