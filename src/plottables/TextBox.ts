import Two from "two.js";

export class TextBox extends Two.Group {
  private box: Two.RoundedRectangle;
  private _text: Two.Text;
  private timer: any;
  constructor(msg: string) {
    super();
    this._text = new Two.Text(msg, 0, 0);
    const bbox = this._text.getBoundingClientRect();
    this.box = new Two.RoundedRectangle(
      0,
      0,
      (bbox as any).width,
      (bbox as any).height,
      4
    );
    this.box.fill = "hsl(20,50%,80%)";
    this.box.opacity = 0.7;
    this.add(this.box, this._text);
  }

  set text(msg: string) {
    this._text.value = msg;
    const bbox = this._text.getBoundingClientRect();
    (this.box as any).width = (bbox as any).width;
  }

  public showWithDelay(layer: Two.Group, delay: number) {
    this.timer = setTimeout(() => {
      this.addTo(layer);
    }, delay);
  }
  public hide() {
    if (this.timer) clearTimeout(this.timer);
    this.remove();
  }
}
