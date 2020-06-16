/** @format */

// import SETTINGS from "@/global-settings";
import Two from "two.js";
import { SEPoint } from "@/models/SEPoint";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule from "./Nodule";

/**
 * Each Point object is uniquely associated with a SEPoint object.
 * As part of plottables, Point concerns mainly with the visual appearance, but
 * SEPoint concerns mainly with geometry computations.
 */

// TODO: complete the code for dynamicBackColor

const frontDefaultRadius = SETTINGS.point.drawn.radius.front;
const backDefaultRadius = SETTINGS.point.drawn.radius.back;
const annularWidth = SETTINGS.point.glowing.annularWidth;
//The style options at the defaults
const frontFillColor = SETTINGS.point.drawn.fillColor.front;
const backFillColor =
  /*SETTINGS.point.dynamicBackColor
    ? Nodule.contrastColorString(this.frontFillColor)
    : */ SETTINGS
    .point.drawn.fillColor.back;
const frontStokeColor = SETTINGS.point.drawn.strokeColor.front;
const backStrokeColor =
  /*SETTINGS.point.dynamicBackColor
    ? Nodule.contrastColorString(this.frontStokeColor)
    : */ SETTINGS
    .point.drawn.strokeColor.back;
const frontStrokeWidth = SETTINGS.point.drawn.lineWidth.front;
const backStrokeWidth = SETTINGS.point.drawn.lineWidth.back;
const frontOpacity = SETTINGS.point.drawn.opacity.front;
const backOpacity = SETTINGS.point.drawn.opacity.back;
const glowingFrontOpacity = SETTINGS.point.glowing.opacity.front;
const glowingBackOpacity = SETTINGS.point.glowing.opacity.back;
const frontGlowFillColor = SETTINGS.point.glowing.fillColor.front;
const backGlowFillColor =
  /*SETTINGS.point.dynamicBackColor
  ? Nodule.contrastColorString(this.frontGlowFillColor)
  : */ SETTINGS
    .point.glowing.fillColor.back;
export default class Point extends Nodule {
  // The owner link is needed because all the mouse tools interact
  // with the TwoJS object but we have to link it with the corresponding
  // model object.
  public owner!: SEPoint; // this field will be initialized by the SEPoint owner
  // public name: string;
  private frontPoint: Two.Circle;
  private backPoint: Two.Circle;

  //Glowing companion points that are displayed when the point is glowing
  private glowingFrontPoint: Two.Circle;
  private glowingBackPoint: Two.Circle;
  constructor() {
    super();
    this.frontPoint = new Two.Circle(0, 0, frontDefaultRadius);
    this.backPoint = new Two.Circle(0, 0, backDefaultRadius);
    this.glowingFrontPoint = new Two.Circle(
      0,
      0,
      frontDefaultRadius + annularWidth
    );
    this.glowingBackPoint = new Two.Circle(
      0,
      0,
      backDefaultRadius + annularWidth
    );
    this.add(
      this.glowingBackPoint,
      this.backPoint,
      this.glowingFrontPoint,
      this.frontPoint
    );
    this.glowingBackPoint.translation = this.translation;
    this.backPoint.translation = this.translation;
    this.glowingFrontPoint.translation = this.translation;
    this.frontPoint.translation = this.translation;
    // 3D position of the point on the sphere surface
    // Use "black" as default color, convert to CSS Hex string
    this.name = "Point-" + this.id;
    this.setAllPointsStyle();
  }

  frontGlowStyle(): void {
    (this.frontPoint as any).visible = true;
    (this.glowingFrontPoint as any).visible = true;
    (this.backPoint as any).visible = false;
    (this.glowingBackPoint as any).visible = false;
  }

  backGlowStyle(): void {
    (this.frontPoint as any).visible = false;
    (this.glowingFrontPoint as any).visible = false;
    (this.backPoint as any).visible = true;
    (this.glowingBackPoint as any).visible = true;
  }

  glowStyle(): void {
    if (this.owner.positionOnSphere.z > 0) this.frontGlowStyle();
    else this.backGlowStyle();
  }

  frontNormalStyle(): void {
    (this.frontPoint as any).visible = true;
    (this.glowingFrontPoint as any).visible = false;
    (this.backPoint as any).visible = false;
    (this.glowingBackPoint as any).visible = false;
  }

  backNormalStyle(): void {
    (this.frontPoint as any).visible = false;
    (this.glowingFrontPoint as any).visible = false;
    (this.backPoint as any).visible = true;
    (this.glowingBackPoint as any).visible = false;
  }

  normalStyle(): void {
    if (this.owner.positionOnSphere.z > 0) this.frontNormalStyle();
    else this.backNormalStyle();
  }

  private setAllPointsStyle() {
    //Set up the fill colors, opacity, stroke width, and stroke colors of the front/back/glow/noglow
    this.frontPoint.fill = frontFillColor;
    this.frontPoint.stroke = frontStokeColor;
    this.frontPoint.linewidth = frontStrokeWidth /* (this.localScale * Coordinates.getGlobalScale()) */;
    this.frontPoint.opacity = frontOpacity;

    this.backPoint.fill = backFillColor;
    this.backPoint.stroke = backStrokeColor;
    this.backPoint.linewidth = backStrokeWidth /* (this.localScale * Coordinates.getGlobalScale()) */;
    this.backPoint.opacity = backOpacity;

    this.glowingFrontPoint.fill = frontGlowFillColor;
    this.glowingFrontPoint.noStroke(); // no linewidth
    this.glowingFrontPoint.opacity = glowingFrontOpacity;

    this.glowingBackPoint.fill = backGlowFillColor;
    this.glowingBackPoint.noStroke(); // no linewidth
    this.glowingBackPoint.opacity = glowingBackOpacity;
  }

  addToLayers(layers: Two.Group[]): void {
    layers[LAYER.foregroundPoints].add(this.frontPoint);
    layers[LAYER.foregroundPointsGlowing].add(this.glowingFrontPoint);
    layers[LAYER.backgroundPoints].add(this.backPoint);
    layers[LAYER.backgroundPointsGlowing].add(this.glowingBackPoint);
    this.normalStyle();
  }

  removeFromLayers(/*layers: Two.Group[]*/): void {
    this.frontPoint.remove();
    this.glowingFrontPoint.remove();
    this.backPoint.remove();
    this.glowingBackPoint.remove();
  }
}
