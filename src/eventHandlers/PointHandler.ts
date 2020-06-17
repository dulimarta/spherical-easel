import SelectionHandler from "./SelectionHandler";
import Two from "two.js";
import { Matrix4 } from "three";
import SETTINGS from "@/global-settings";
import EventBus from "./EventBus";
import { SEPoint } from "@/models/SEPoint";
import Point from "@/plottables/Point";
import { AddPointCommand } from "@/commands/AddPointCommand";
const frontPointRadius = SETTINGS.point.temp.radius.front;
const backPointRadius = SETTINGS.point.temp.radius.back;
export default class PointHandler extends SelectionHandler {
  private frontPortion: Two.Circle;
  private backPortion: Two.Circle;
  private pointGroup: Two.Group;
  constructor(scene: Two.Group, transformMatrix: Matrix4) {
    super(scene, transformMatrix);
    this.frontPortion = new Two.Circle(0, 0, frontPointRadius);
    this.backPortion = new Two.Circle(0, 0, backPointRadius);
    this.pointGroup = new Two.Group();
    this.pointGroup.add(this.backPortion, this.frontPortion);
    this.frontPortion.fill = SETTINGS.point.temp.fillColor.front;
    this.frontPortion.stroke = SETTINGS.point.temp.strokeColor.front;
    this.frontPortion.opacity = SETTINGS.point.temp.opacity.front;
    this.backPortion.fill = SETTINGS.point.temp.fillColor.back;
    this.backPortion.stroke = SETTINGS.point.temp.strokeColor.back;
    this.backPortion.opacity = SETTINGS.point.temp.opacity.back;
    this.pointGroup.addTo(scene);
    (this.frontPortion as any).visible = false;
    (this.backPortion as any).visible = false;
  }

  mouseMoved(event: MouseEvent): void {
    super.mouseMoved(event);
    this.pointGroup.translation.copy(this.currentScreenPoint);
    if (this.isOnSphere) {
      (this.frontPortion as any).visible = !event.shiftKey;
      (this.backPortion as any).visible = event.shiftKey;
    } else {
      (this.frontPortion as any).visible = false;
      (this.backPortion as any).visible = false;
    }
  }

  mousePressed(event: MouseEvent): void {
    const hitPoints = this.store.getters.findNearbyPoints(
      this.currentSpherePoint,
      this.currentScreenPoint
    );
    if (hitPoints.length > 0) return;
    if (event.shiftKey) {
      // Ignore the current sign, force it to be always negative
      this.currentSpherePoint.z = -1 * Math.abs(this.currentSpherePoint.z);
    }
    (this.frontPortion as any).visible = false;
    (this.backPortion as any).visible = false;
    const p = new Point();
    const vtx = new SEPoint(p);
    vtx.positionOnSphere = this.currentSpherePoint;
    new AddPointCommand(vtx).execute();
  }
  // eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {
    /* None */
  }

  // eslint-disable-next-line
  mouseLeave(event: MouseEvent): void {
    throw new Error("Method not implemented.");
  }
  activate(): void {
    super.activate();
    this.canvas.add(this.pointGroup);
    (this.frontPortion as any).visible = false;
    (this.backPortion as any).visible = false;
  }
  deactivate(): void {
    super.deactivate();
    this.pointGroup.remove();
  }
}
