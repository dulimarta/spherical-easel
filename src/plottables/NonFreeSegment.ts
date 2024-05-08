import SETTINGS from "@/global-settings";
import Nodule from "./Nodule";
import {
  StyleOptions,
  StyleEditPanels,
  DEFAULT_NONFREE_SEGMENT_FRONT_STYLE,
  DEFAULT_NONFREE_SEGMENT_BACK_STYLE
} from "@/types/Styles";
import Segment from "./Segment";

export default class NonFreeSegment extends Segment {
  /**
   * non free lines are thinner by nonFreeLineScalePercent
   */
  private nonFreeSegmentScalePercent = SETTINGS.segment.nonFree.scalePercent;

  constructor(noduleName: string) {
    super(noduleName);

    this.styleOptions.set(
      StyleEditPanels.Front,
      DEFAULT_NONFREE_SEGMENT_FRONT_STYLE
    );
    this.styleOptions.set(
      StyleEditPanels.Back,
      DEFAULT_NONFREE_SEGMENT_BACK_STYLE
    );
  }

  /**
   * Return the default style state
   */
  defaultStyleState(panel: StyleEditPanels): StyleOptions {
    switch (panel) {
      case StyleEditPanels.Front:
        return DEFAULT_NONFREE_SEGMENT_FRONT_STYLE;
      case StyleEditPanels.Back:
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
      case StyleEditPanels.Label: {
        return {};
      }
    }
  }
  /**
   * Sets the variables for stroke width glowing/not front/back/extra
   */
  adjustSize(): void {
    const frontStyle = this.styleOptions.get(StyleEditPanels.Front);
    const backStyle = this.styleOptions.get(StyleEditPanels.Back);
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
    this.glowingFrontPart.linewidth =
      (((Segment.currentGlowingSegmentStrokeWidthFront *
        frontStrokeWidthPercent) /
        100) *
        this.nonFreeSegmentScalePercent) /
      100;
    this.glowingBackPart.linewidth =
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
    this.glowingFrontExtra.linewidth =
      (((Segment.currentGlowingSegmentStrokeWidthFront *
        frontStrokeWidthPercent) /
        100) *
        this.nonFreeSegmentScalePercent) /
      100;
    this.glowingBackExtra.linewidth =
      (((Segment.currentGlowingSegmentStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
        100) *
        this.nonFreeSegmentScalePercent) /
      100;
  }
}
