import Arrow from "@/3d-objs/Arrow";
import CursorHandler from "./CursorHandler";
import Point from "@/3d-objs/Point";
import SETTINGS from "@/global-settings";
import { AddPointCommand } from "@/commands/AddPointCommand";
import Two from 'two.js';
export default class NormalPointHandler extends CursorHandler {
  private normalArrow: Arrow;
  private isNormalAdded: boolean;

  constructor(scene: Two) {
    super(scene);
    this.normalArrow = new Arrow(0.5 /* length in the "world" */, 0xff8000);
    this.isNormalAdded = false;
  }

  mouseMoved(event: MouseEvent) {
    super.mouseMoved(event);
    if (this.isOnSphere) {
      if (!this.isNormalAdded) {
        this.canvas.add(this.normalArrow);
        this.isNormalAdded = true;
      }
      const x = this.currentSpherePoint.x;
      const y = this.currentSpherePoint.y;
      // projected length of the arrow on the XY plane
      const projectedLength = Math.sqrt(x * x + y * y);
      // Y-axis on screen is positive going down, but
      // Y-axis ih the world coordinate is positive going up
      const angle = Math.atan2(-y, x);
      this.normalArrow.translation.set(this.currentScreenPoint.x - this.canvas.width / 2, this.currentScreenPoint.y - this.canvas.height / 2);
      this.normalArrow.length = projectedLength;
      this.normalArrow.rotation = angle;
    } else {
      this.canvas.remove(this.normalArrow);
      this.isNormalAdded = false;
    }
  }

  mousePressed = () => {
    if (this.isOnSphere && this.theSphere) {
      // The intersection point is returned as a point in the WORLD coordinate
      // But when a new point is added to the sphere, we have to convert
      // for the world coordinate frame to the sphere coordinate frame

      const vtx = new Point();
      // vtx.position.copy(this.currentPoint);
      new AddPointCommand(vtx).execute();
    }
  };

  activate = () => {
    this.rayCaster.layers.disableAll();
    this.rayCaster.layers.enable(SETTINGS.layers.sphere);
  };
}
