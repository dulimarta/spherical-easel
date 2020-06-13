/** @format */

import LineHandler from "./LineHandler";
import Two from "two.js";
import { Matrix4 } from "three";

export default class SegmentHandler extends LineHandler {
  // private marker = new Point(5, 0xff0000);
  // private majorAxisDir = new Vector3();
  constructor(scene: Two.Group, transformMatrix: Matrix4) {
    super(scene, transformMatrix, true /* segment of line */);
  }

  activate = (): void => {
    // The following line automatically calls Line setter function
    this.line.isSegment = true;
  };
}
