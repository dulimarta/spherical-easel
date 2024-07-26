//import Two from "two.js";
import { Anchor } from "two.js/src/anchor";
import { Group } from "two.js/src/group";
import { Path } from "two.js/src/path";
//import { Vector } from "two.js/src/vector";

export class SelectionRectangle extends Group {
  private path: Path;
  private layer: Group;
  private vertex1 = new Anchor(0, 0);
  private vertex2 = new Anchor(1, 0);
  private vertex3 = new Anchor(1, 1);
  private vertex4 = new Anchor(1, 0);

  constructor(layer: Group) {
    super();
    this.layer = layer;

    this.path = new Path(
      [this.vertex1, this.vertex2, this.vertex3, this.vertex4],
      true,
      false
    );
    this.path.noFill();
    this.path.stroke = "#00000000";
    this.path.opacity = 1;
    this.path.linewidth = 1;
    this.path.dashes.push(...[1, 5]);
    this.path.addTo(this);
    // this.addTo(this.layer);
    // this.hide();
  }

  /**
   * Change size and location of the rectangle based on the corners
   */
  public move(corner1: number[], corner2: number[], onBack: boolean): void {
    this.path.vertices[0].set(corner1[0], -corner1[1]);
    this.path.vertices[1].set(corner1[0], -corner2[1]);
    this.path.vertices[2].set(corner2[0], -corner2[1]);
    this.path.vertices[3].set(corner2[0], -corner1[1]);
    if (onBack) {
      this.path.opacity = 0.5;
      this.path.linewidth = 0.5;
    } else {
      this.path.opacity = 1;
      this.path.linewidth = 0.5;
    }
  }

  /**
   * Show the rectangle
   */
  public show(): void {
    this.addTo(this.layer);
  }

  /*
   * Hide the rectangle
   */
  public hide(): void {
    this.remove();
  }
}
