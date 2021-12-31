import Two, { BoundingClientRect } from "two.js";

export class TextBox extends Two.Group {
  private box: Two.RoundedRectangle;
  private _text: Two.Text;
  private timer: any;

  constructor(msg: string) {
    super();
    this._text = new Two.Text(msg, 0, 0);
    const bbox = this._text.getBoundingClientRect() as Two.BoundingClientRect;
    this.box = new Two.RoundedRectangle(0, 0, bbox.width, bbox.height, 4);
    this.box.fill = "hsl(20,50%,80%)";
    this.box.opacity = 0.7;
    this.add(this.box, this._text);
  }

  /**
   * Change the text to show in the box
   *
   * @memberof TextBox
   */
  set text(msg: string) {
    this._text.value = msg;
    const bbox = this._text.getBoundingClientRect() as Two.BoundingClientRect;
    (this.box as any).width = bbox.width;
  }

  /**
   * Show the text is a specific layer AFTER a delay (in milliseconds)
   * @param layer the target layer
   * @param delay number of milliseconds to wait
   */
  public showWithDelay(layer: Two.Group, delay: number): void {
    this.timer = setTimeout(() => {
      this.addTo(layer);
    }, delay);
  }

  public hide(): void {
    if (this.timer) clearTimeout(this.timer);
    this.remove();
  }
}
