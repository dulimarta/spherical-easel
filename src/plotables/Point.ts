/** @format */

// import SETTINGS from "@/global-settings";
import Two, { Color } from "two.js";
import { Stylable } from "@/plotables/Styleable";
import { SEPoint } from "@/models/SEPoint";

/**
 * Each Point object is uniquely associated with a SEPoint object.
 * As part of plotables, Point concerns mainly with the visual appearance, but
 * SEPoint concerns mainly with geometry computations.
 */
export default class Point extends Two.Circle implements Stylable {
  private pointColor: Color;

  // The owner link is needed because all the mouse tools interact
  // with the TwoJS object but we have to link it with the corresponding
  // model object.
  public owner!: SEPoint; // this field will be initialized by the SEPoint owner
  public name: string;

  constructor(size?: number, color?: number) {
    // Default 3-pixel wide
    super(0, 0, size || 6);
    // 3D position of the point on the sphere surface

    // Use "black" as default color, convert to CSS Hex string
    if (color) {
      let hexColor = color.toString(16);
      while (
        hexColor.length < 6 // Make sure hex color is 6 digit
      )
        hexColor = "0" + hexColor;
      this.fill = "#" + hexColor;
    } else this.fill = "hsl(240, 100%, 40%)";
    this.pointColor = this.fill;
    this.noStroke();

    this.name = "Point-" + this.id;
  }

  frontGlowStyle(): void {
    throw new Error("Method not implemented.");
  }
  backGlowStyle(): void {
    throw new Error("Method not implemented.");
  }

  frontNormalStyle(): void {
    this.fill = this.pointColor;
    this.noStroke();
    this.scale = 1;
  }

  backNormalStyle(): void {
    this.fill = "gray";
    this.stroke = "black";
    this.scale = 0.6;
  }
}
