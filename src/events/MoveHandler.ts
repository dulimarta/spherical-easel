import CursorHandler from "./CursorHandler";
import { Camera, Scene } from "three";
import SETTINGS from "@/global-settings";
import Point from "@/3d-objs/Point";

export default class MoveHandler extends CursorHandler {
  private isDragging = false;
  private moveTarget: Point | null = null;
  constructor(args: { camera: Camera; scene: Scene }) {
    super(args);
  }

  mouseMoved(event: MouseEvent) {
    super.mouseMoved(event);
    if (this.isDragging && this.moveTarget instanceof Point) {
      this.moveTarget.position.copy(this.currentV3Point);
      const vtx = this.store.state.points.find(
        v => v.ref.id === this.moveTarget?.id
      );
      if (vtx) {
        // Update all lines having this point as start point
        vtx.startOf.forEach(z => {
          z.ref.startV3Point = this.currentV3Point;
        });
        // Update all lines having this point as end point
        vtx.endOf.forEach(z => {
          z.ref.endV3Point = this.currentV3Point;
        });
        // Update all circles having this point as center point
        vtx.centerOf.forEach(z => {
          z.ref.centerPoint = this.currentV3Point;
        });
        // Update all circles having this point as circum point
        vtx.circumOf.forEach(z => {
          z.ref.circlePoint = this.currentV3Point;
        });
      }
    }
  }

  //eslint-disable-next-line
  mousePressed(event: MouseEvent) {
    this.isDragging = true;
    if (this.hitObject instanceof Point) this.moveTarget = this.hitObject;
  }

  //eslint-disable-next-line
  mouseReleased(event: MouseEvent) {
    this.isDragging = false;
    this.moveTarget = null;
  }

  activate() {
    this.rayCaster.layers.disableAll();
    this.rayCaster.layers.enable(SETTINGS.layers.sphere);
    this.rayCaster.layers.enable(SETTINGS.layers.point);
  }
}
