import { Vector3, Camera, Scene } from "three";
import LineHandler from "./LineHandler";
// import Arrow from "@/3d-objs/Arrow";
import Point from "@/3d-objs/Point";
import SETTINGS from "@/global-settings";
import Two from 'two.js';

export default class SegmentHandler extends LineHandler {
  constructor(scene: Two) {
    super(scene);
    const redDot = new Point(0.05, 0xff0000);
    redDot.positionOnSphere.set(1.0, 0, 0);
    // const greenDot = new Point(0.05, 0x00ff44);
    // greenDot.position.set(0, 1.0, 0);
    // this.smallCircle.add(redDot);
    // this.smallCircle.add(greenDot);
  }

  activate = () => {
    this.rayCaster.layers.enable(SETTINGS.layers.sphere);
    this.rayCaster.layers.enable(SETTINGS.layers.point);
    // The following line automatically calls Line setter function
    this.line.isSegment = true;
  };
}
