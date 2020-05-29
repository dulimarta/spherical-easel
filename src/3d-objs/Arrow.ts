import { Vector3 } from "three";
import Two from "two.js";
import SETTINGS from "@/global-settings";

/**
 * An arrow shape
 */
export default class Arrow extends Two.Group {
  private body: Two.Line;
  private head: Two.Polygon;
  private bodyLength: number;
  constructor(length: number, color?: number) {
    super();
    color = color || 0x000000;
    const tipLength = 0.1 * length * SETTINGS.sphere.boundaryCircleRadius;
    this.bodyLength = length * SETTINGS.sphere.boundaryCircleRadius;
    this.head = new Two.Polygon(0, 0, tipLength, 3);
    let hexColor = color.toString(16);
    while (hexColor.length < 6) hexColor = "0" + hexColor;
    this.head.fill = "#" + hexColor;
    this.head.stroke = "#" + hexColor;
    this.head.join = "round";
    this.head.rotation = Math.PI / 2;
    this.head.translation.set(this.bodyLength, 0);
    this.add(this.head);
    this.body = new Two.Line(0, 0, this.bodyLength, 0);
    this.body.stroke = "#" + hexColor;
    this.add(this.body);
    this.linewidth = 5;
  }

  /**
   * Setter function to adjust the arrow length and reposition the arrow head
   *
   * @memberof Arrow
   */
  set length(val: number) {
    this.body.scale = val;
    this.head.translation.set(this.bodyLength * val, 0);
  }

  /**
   * Setter function to place the arrow as a normal vector at a point on a unit sphere
   *
   * @memberof Arrow
   */
  set sphereLocation(v: Vector3) {
    // Projected length on the XY-plane
    this.length = Math.sqrt(v.x * v.x + v.y * v.y);
    // Y-axis on screen is positive going down, but
    // Y-axis ih the world coordinate is positive going up
    this.rotation = Math.atan2(v.y, v.x);
    this.translation.set(
      v.x * SETTINGS.sphere.boundaryCircleRadius,
      v.y * SETTINGS.sphere.boundaryCircleRadius
    );
  }
}
