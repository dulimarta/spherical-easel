import Two from 'two.js';
import SETTINGS from '@/global-settings';

// Create Arrow shape along the Y-axis
export default class Arrow extends Two.Group {
  private body: Two.Line;
  private head: Two.Line;
  private bodyLength: number;
  constructor(length: number, color: number) {
    super();
    color = color || 0x000000;
    const tipLength = 0.1 * length * SETTINGS.sphere.radius;
    this.bodyLength = length * SETTINGS.sphere.radius;
    this.head = new Two.Polygon(0, 0, tipLength, 3);
    this.head.fill = "#" + color.toString(16);
    this.head.stroke = "#" + color.toString(16);
    this.head.join = "round";
    this.head.rotation = Math.PI / 2;
    this.head.translation.set(this.bodyLength, 0);
    this.add(this.head);
    this.body = new Two.Line(0, 0, this.bodyLength, 0);
    this.body.stroke = "#" + color.toString(16);
    this.add(this.body);
    this.linewidth = 5;
  }

  set length(val: number) {
    this.body.scale = val;
    this.head.translation.set(this.bodyLength * val, 0);
  }
}
