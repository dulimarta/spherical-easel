/** @format */

// import SETTINGS from "@/global-settings";
import { Vector3 } from "three";
import Two, { Color } from "two.js";
import globalSettings from "@/global-settings";
import { HiLite } from "@/types";

export default class Point extends Two.Circle implements HiLite {
  // Can't use position because of conflict with TwoJS property
  private _posOnSphere: Vector3;
  public name: string;
  private oldFill: Color;
  constructor(size?: number, color?: number) {
    // Default 3-pixel wide
    super(0, 0, size || 3);
    // 3D position of the point on the sphere surface
    this._posOnSphere = new Vector3();

    // Use "black" as default color, convert to CSS Hex string
    if (color) {
      let hexColor = color.toString(16);
      while (
        hexColor.length < 6 // Make sure hex color is 6 digit
      )
        hexColor = "0" + hexColor;
      this.fill = "#" + hexColor;
    } else this.fill = "hsl(240, 100%, 40%)";
    this.oldFill = this.fill;
    this.noStroke();

    this.name = "Point-" + this.id;
  }
  highlight(): void {
    this.oldFill = this.fill;
    this.fill = "red";
  }

  noHighlight(): void {
    this.fill = this.oldFill;
  }

  set positionOnSphere(pos: Vector3) {
    this._posOnSphere.copy(pos);
    this.translation.set(
      pos.x * globalSettings.sphere.radius,
      pos.y * globalSettings.sphere.radius
    );
  }
  get positionOnSphere() {
    return this._posOnSphere;
  }
}
