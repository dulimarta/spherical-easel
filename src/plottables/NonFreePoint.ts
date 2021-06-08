/** @format */

// import SETTINGS from "@/global-settings";
import SETTINGS from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";
import { StyleOptions, StyleEditPanels } from "@/types/Styles";
import Point from "@/plottables/Point";

/**
 * Each Point object is uniquely associated with a SEPoint object.
 * As part of plottables, Point concerns mainly with the visual appearance, but
 * SEPoint concerns mainly with geometry computations.
 */

export default class NonFreePoint extends Point {
  /**
   * free points are smaller by nonFreePointScalePercent
   */
  private nonFreePointScalePercent = SETTINGS.point.nonFree.scalePercent;

  constructor() {
    super();

    /**
     * Set the style variables for the non-Free point
     */
    // Front
    this.fillColorFront = SETTINGS.point.nonFree.fillColor.front;
    this.strokeColorFront = SETTINGS.point.nonFree.strokeColor.front;
    this.pointRadiusPercentFront = 100;
    // Back
    this.fillColorBack = SETTINGS.point.dynamicBackStyle
      ? Nodule.contrastFillColor(SETTINGS.point.nonFree.fillColor.front)
      : SETTINGS.point.nonFree.fillColor.back;
    this.strokeColorBack = SETTINGS.point.dynamicBackStyle
      ? Nodule.contrastStrokeColor(SETTINGS.point.nonFree.strokeColor.front)
      : SETTINGS.point.nonFree.strokeColor.back;
    this.pointRadiusPercentBack = SETTINGS.point.dynamicBackStyle
      ? Nodule.contrastPointRadiusPercent(
          SETTINGS.point.nonFree.pointStrokeWidth.front
        )
      : 100;

    this.dynamicBackStyle = SETTINGS.point.dynamicBackStyle;

    // Now apply the new style and size
    this.stylize(DisplayStyle.ApplyCurrentVariables);
    this.adjustSize();
  }

  /**
   * Return the default style state
   */
  defaultStyleState(panel: StyleEditPanels): StyleOptions {
    switch (panel) {
      case StyleEditPanels.Front: {
        return {
          panel: panel,
          pointRadiusPercent: 100,
          strokeColor: SETTINGS.point.nonFree.strokeColor.front,
          fillColor: SETTINGS.point.nonFree.fillColor.front
        };
        // Back
      }
      case StyleEditPanels.Back: {
        return {
          panel: panel,

          pointRadiusPercent: SETTINGS.point.dynamicBackStyle
            ? Nodule.contrastPointRadiusPercent(100)
            : 100,

          strokeColor: SETTINGS.point.dynamicBackStyle
            ? Nodule.contrastStrokeColor(
                SETTINGS.point.nonFree.strokeColor.front
              )
            : SETTINGS.point.nonFree.strokeColor.back,

          fillColor: SETTINGS.point.dynamicBackStyle
            ? Nodule.contrastFillColor(SETTINGS.point.nonFree.fillColor.front)
            : SETTINGS.point.nonFree.fillColor.back,

          dynamicBackStyle: SETTINGS.point.dynamicBackStyle
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
   * Sets the variables for point radius glowing/not
   */
  adjustSize(): void {
    this.frontPoint.scale =
      ((Point.pointScaleFactor * this.pointRadiusPercentFront) / 100) *
      (this.nonFreePointScalePercent / 100);

    this.backPoint.scale =
      (((Point.pointScaleFactor * this.nonFreePointScalePercent) / 100) *
        (this.dynamicBackStyle
          ? Nodule.contrastPointRadiusPercent(this.pointRadiusPercentFront)
          : this.pointRadiusPercentBack)) /
      100;

    this.glowingFrontPoint.scale =
      (((Point.pointScaleFactor * this.nonFreePointScalePercent) / 100) *
        this.pointRadiusPercentFront) /
      100;

    this.glowingBackPoint.scale =
      (((Point.pointScaleFactor * this.nonFreePointScalePercent) / 100) *
        (this.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(this.pointRadiusPercentFront)
          : this.pointRadiusPercentBack)) /
      100;
  }
}
