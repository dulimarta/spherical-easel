/** @format */

// import SETTINGS from "@/global-settings";
import Two from "two.js";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule from "./Nodule";
import { Vector3 } from "three";

/**
 * Each Point object is uniquely associated with a SEPoint object.
 * As part of plottables, Point concerns mainly with the visual appearance, but
 * SEPoint concerns mainly with geometry computations.
 */

// TODO: complete the code for dynamicBackStyle

const defaultRadiusFront = SETTINGS.point.drawn.radius.front;
const defaultRadiusBack = SETTINGS.point.drawn.radius.back;
const annularWidth = SETTINGS.point.glowing.annularWidth;
//The style options at the defaults
const frontFillColor = SETTINGS.point.drawn.fillColor.front;
const backFillColor =
  /*SETTINGS.point.dynamicBackStyle
    ? Nodule.contrastColorString(this.frontFillColor)
    : */ SETTINGS
    .point.drawn.fillColor.back;
const stokeColorFront = SETTINGS.point.drawn.strokeColor.front;
const strokeColorBack =
  /*SETTINGS.point.dynamicBackStyle
    ? Nodule.contrastColorString(this.stokeColorFront)
    : */ SETTINGS
    .point.drawn.strokeColor.back;
const strokeWidthFront = SETTINGS.point.drawn.strokeWidth.front;
const strokeWidthBack = SETTINGS.point.drawn.strokeWidth.back;
const frontOpacity = SETTINGS.point.drawn.opacity.front;
const backOpacity = SETTINGS.point.drawn.opacity.back;
const glowingOpacityFront = SETTINGS.point.glowing.opacity.front;
const glowingOpacityBack = SETTINGS.point.glowing.opacity.back;
const glowingFillColorFront = SETTINGS.point.glowing.fillColor.front;
const glowingFillColorBack =
  /*SETTINGS.point.dynamicBackStyle
  ? Nodule.contrastColorString(this.glowingFillColorFront)
  : */ SETTINGS
    .point.glowing.fillColor.back;
export default class Point extends Nodule {
  // The owner link is needed because all the mouse tools interact
  // with the TwoJS object but we have to link it with the corresponding
  // model object.
  public _pos = new Vector3();
  // public owner!: SEPoint; // this field will be initialized by the SEPoint owner
  // public name: string;
  private frontPoint: Two.Circle;
  private backPoint: Two.Circle;

  //Glowing companion points that are displayed when the point is glowing
  private glowingFrontPoint: Two.Circle;
  private glowingBackPoint: Two.Circle;
  constructor() {
    super();
    this.frontPoint = new Two.Circle(0, 0, defaultRadiusFront);
    this.backPoint = new Two.Circle(0, 0, defaultRadiusBack);
    this.glowingFrontPoint = new Two.Circle(
      0,
      0,
      defaultRadiusFront + annularWidth
    );
    this.glowingBackPoint = new Two.Circle(
      0,
      0,
      defaultRadiusBack + annularWidth
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

  get position(): Vector3 {
    return this._pos;
  }

  set position(v: Vector3) {
    this._pos.copy(v);
    if (v.z < 0) this.backNormalStyle();
    else this.frontNormalStyle();
    this.translation
      .set(v.x, v.y)
      .multiplyScalar(SETTINGS.boundaryCircle.radius);
  }

  adjustSizeForZoom(factor: number): void {
    const newRadius = defaultRadiusFront * factor;
    let newScale = 1;
    if (newRadius > SETTINGS.point.drawn.radius.rmax) {
      // debugger; // eslint-disable-line
      newScale = SETTINGS.point.drawn.radius.rmax / newRadius;
    }
    if (newRadius < SETTINGS.point.drawn.radius.rmin) {
      // debugger; // eslint-disable-line
      newScale = SETTINGS.point.drawn.radius.rmin / newRadius;
    }

    this.frontPoint.scale = newScale;
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
    if (this._pos.z > 0) this.frontGlowStyle();
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
    if (this._pos.z > 0) this.frontNormalStyle();
    else this.backNormalStyle();
  }

  private setAllPointsStyle() {
    //Set up the fill colors, opacity, stroke width, and stroke colors of the front/back/glow/noglow
    this.frontPoint.fill = frontFillColor;
    this.frontPoint.stroke = stokeColorFront;
    this.frontPoint.linewidth = strokeWidthFront /* (this.localScale * Coordinates.getGlobalScale()) */;
    this.frontPoint.opacity = frontOpacity;

    this.backPoint.fill = backFillColor;
    this.backPoint.stroke = strokeColorBack;
    this.backPoint.linewidth = strokeWidthBack /* (this.localScale * Coordinates.getGlobalScale()) */;
    this.backPoint.opacity = backOpacity;

    this.glowingFrontPoint.fill = glowingFillColorFront;
    this.glowingFrontPoint.noStroke(); // no linewidth
    this.glowingFrontPoint.opacity = glowingOpacityFront;

    this.glowingBackPoint.fill = glowingFillColorBack;
    this.glowingBackPoint.noStroke(); // no linewidth
    this.glowingBackPoint.opacity = glowingOpacityBack;
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

  stylize(flag: string): void {
    throw new Error("Method not implemented.");
  }

  public update(): void {
    this.normalStyle();
  }
}
