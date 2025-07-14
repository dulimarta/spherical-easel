//import Two from "two.js";
import { Group } from "two.js/src/group";
import { RoundedRectangle } from "two.js/src/shapes/rounded-rectangle";
import { Text } from "two.js/src/text";

export class TextBox extends Group {
  private box: RoundedRectangle;
  private _text: Text;
  private timer;

  constructor(msg: string) {
    super();
    this._text = new Text(msg, 0, 0);
    this._text.size = 10;
    const bbox = this._text.getBoundingClientRect();
    this.box = new RoundedRectangle(0, 0, bbox.width, bbox.height, 4);
    this.box.fill = "#e6c4b3";
    this.box.opacity = 0.7;

    // this.box.addTo(this);
    // this._text.addTo(this);
    this.add(this.box, this._text);
  }

  /**
   * Change the text to show in the box
   *
   * @memberof TextBox
   */
  set text(msg: string) {
    this._text.value = msg;
    const bbox = this._text.getBoundingClientRect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.box as any).width = bbox.width;
  }

  /**
   * Show the text is a specific layer AFTER a delay (in milliseconds)
   * @param layer the target layer
   * @param delay number of milliseconds to wait
   */
  public showWithDelay(layer: Group, delay: number): void {
    this.timer = setTimeout(() => {
      this.addTo(layer);
    }, delay);
  }

  public hide(): void {
    if (this.timer) clearTimeout(this.timer);
    this.remove();
  }
}
