import { Group } from "three";
import Arrow from "./Arrow";

export default class Axes extends Group {
  constructor(length?: number, radius?: number) {
    super();
    // Red: X-Axis, Green: Y-Axis, Blue: Z-Axis
    // Each arrow is pointed along the positive Y-axis
    const redArrow = new Arrow(length || 1.5, radius || 0.1, 0xff0000);
    const greenArrow = new Arrow(length || 1.5, radius || 0.1, 0x00ff00);
    const blueArrow = new Arrow(length || 1.5, radius || 0.1, 0x0080ff);
    blueArrow.rotateX(Math.PI / 2);
    redArrow.rotateZ(-Math.PI / 2);
    this.add(redArrow);
    this.add(greenArrow);
    this.add(blueArrow);
  }
}
