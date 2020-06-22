import { ToolStrategy } from "./ToolStrategy";
import { Matrix4, Vector2 } from "three";
import EventBus from "./EventBus";

export enum ZoomMode {
  MAGNIFY,
  MINIFY
}

const tmpMatrix = new Matrix4();

export default class PanZoomHandler implements ToolStrategy {
  private targetElement: HTMLElement;
  private _mode = ZoomMode.MAGNIFY;
  private zoomMatrix = new Matrix4();
  private startDragPosition = new Vector2();
  private currentPosition = new Vector2();
  private magnificationFactor = 1.0;
  private translateX = 0;
  private translateY = 0;

  private isDragging = false;
  private isMousePressed = false;
  constructor(element: HTMLElement) {
    this.targetElement = element;
  }

  set zoomMode(val: ZoomMode) {
    this._mode = val;
  }

  mouseMoved(event: MouseEvent): void {
    if (this.isMousePressed) {
      this.isDragging = true;
    }
    const target = (event.currentTarget || event.target) as HTMLDivElement;
    const boundingRect = target.getBoundingClientRect();
    const offsetX = event.clientX - boundingRect.left;
    const offsetY = event.clientY - boundingRect.top;

    this.currentPosition.set(offsetX, offsetY);
    if (this.isDragging) this.doPan(event);
  }

  mousePressed(event: MouseEvent): void {
    this.isMousePressed = true;
    const target = (event.currentTarget || event.target) as HTMLDivElement;
    const boundingRect = target.getBoundingClientRect();
    const offsetX = event.clientX - boundingRect.left;
    const offsetY = event.clientY - boundingRect.top;

    this.currentPosition.set(offsetX, offsetY);
    this.startDragPosition.copy(this.currentPosition);
  }

  doZoom(event: MouseEvent): void {
    if (this._mode === ZoomMode.MINIFY) {
      if (this.magnificationFactor < 0.4) return;
      this.magnificationFactor *= 0.9;
    }
    if (this._mode === ZoomMode.MAGNIFY) {
      if (this.magnificationFactor > 10) return;
      this.magnificationFactor *= 1.1;
    }
    const target = (event.currentTarget || event.target) as HTMLDivElement;
    const boundingRect = target.getBoundingClientRect();
    const tx = event.clientX - boundingRect.left - boundingRect.width / 2;
    const ty = event.clientY - boundingRect.top - boundingRect.height / 2;
    const mag = this.magnificationFactor;
    if (mag < 1) {
      this.zoomMatrix.makeScale(mag, mag, mag);
    } else {
      this.zoomMatrix.makeTranslation(this.translateX, this.translateY, 0);
      //   this.zoomMatrix.identity();
      tmpMatrix.makeTranslation(tx, ty, 0);
      this.zoomMatrix.multiply(tmpMatrix);
      tmpMatrix.makeScale(mag, mag, mag);
      this.zoomMatrix.multiply(tmpMatrix);
      tmpMatrix.makeTranslation(-tx, -ty, 0);
      this.zoomMatrix.multiply(tmpMatrix);
    }
    // console.debug("Updated zoom matrix", this.zoomMatrix.elements);
    EventBus.fire("zoom-updated", this.zoomMatrix);
  }

  doPan(event: MouseEvent): void {
    if (this.magnificationFactor < 1) return;
    this.translateX = this.currentPosition.x - this.startDragPosition.x;
    this.translateY = this.currentPosition.y - this.startDragPosition.y;
    tmpMatrix.makeTranslation(this.translateX, this.translateY, 0);
    tmpMatrix.multiply(this.zoomMatrix);
    EventBus.fire("zoom-updated", tmpMatrix);
  }

  mouseReleased(event: MouseEvent): void {
    if (this.isDragging) {
      this.isDragging = false;
      if (this.magnificationFactor > 1) {
        tmpMatrix.makeTranslation(this.translateX, this.translateY, 0);
        this.zoomMatrix.premultiply(tmpMatrix);
        EventBus.fire("zoom-updated", this.zoomMatrix);
      }
      /* Pan */
    } else {
      this.doZoom(event);
      /* Zoom */
    }
    this.isMousePressed = false;
  }

  mouseLeave(event: MouseEvent): void {
    // no code yet
  }

  activate(): void {
    // console.debug("Activate PZtool");
  }
  deactivate(): void {
    // console.debug("Deactivate PZtool");
  }
}
