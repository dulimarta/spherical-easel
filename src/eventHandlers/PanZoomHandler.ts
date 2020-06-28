import { ToolStrategy } from "./ToolStrategy";
import { Matrix4, Vector2 } from "three";
import { AddZoomSphereCommand } from "@/commands/AddZoomSphereCommand";
import EventBus from "./EventBus";
import SETTINGS from "@/global-settings";

export enum ZoomMode {
  MAGNIFY,
  MINIFY
}

const tmpMatrix = new Matrix4();

export default class PanZoomHandler implements ToolStrategy {
  /**
   * The HTML element that is the target of the zoom?
   */
  private targetElement: HTMLElement;
  /**
   * The mode of the zoom tool, either Magnify or Minify
   */
  private _mode = ZoomMode.MAGNIFY;

  /**
   * The matrix the describes takes the ?previous? ?standard view? view to the current view
   */
  private zoomMatrix = new Matrix4();

  /**
   * Variables for the pan (translate) operations.
   */
  private startDragPosition = new Vector2();
  private currentPosition = new Vector2();
  private translateX = 0;
  private translateY = 0;

  /**
   * Indicates that the user mouse pressed at one location, moved the mouse with the mouse
   * pressed, and mouse released at a final location - does a pan to the current location of the
   * the mouse.
   */
  private isDragging = false;
  /**
   * Indicates that the user mouse pressed and released at the same location - does a zoom at
   * the location of the mouse event
   */
  private isMousePressed = false;

  /**
   * The magnification factor for the CSS transform?
   */
  private magnificationFactor = 1.0;

  /**
   * The percentage the magnification factor changes by on user click.
   */
  private percentChange = SETTINGS.zoom.percentChange / 100;

  constructor(element: HTMLElement) {
    this.targetElement = element;
  }

  /**
   * Sets the zoom mode. Controlled by the button (zoom in/out) the user selects.
   */
  set zoomMode(val: ZoomMode) {
    this._mode = val;
  }

  mousePressed(event: MouseEvent): void {
    console.log("mag", this.magnificationFactor);
    this.isMousePressed = true;

    // Read the target DOM element to determine the current (mouse press) location
    const target = (event.currentTarget || event.target) as HTMLDivElement;
    const boundingRect = target.getBoundingClientRect();
    const offsetX = event.clientX - boundingRect.left;
    const offsetY = event.clientY - boundingRect.top;

    this.currentPosition.set(offsetX, offsetY);
    this.startDragPosition.copy(this.currentPosition);
  }
  mouseMoved(event: MouseEvent): void {
    // If the mouse was pressed and then moved, the user is dragging (to pan the view)
    if (this.isMousePressed) {
      this.isDragging = true;
    }

    // Read the target DOM element to determine the current (mouse mouse) location
    const target = (event.currentTarget || event.target) as HTMLDivElement;
    const boundingRect = target.getBoundingClientRect();
    const offsetX = event.clientX - boundingRect.left;
    const offsetY = event.clientY - boundingRect.top;

    this.currentPosition.set(offsetX, offsetY);
    if (this.isDragging) this.doPan(event);
  }

  mouseReleased(event: MouseEvent): void {
    if (this.isDragging) {
      /* End the Pan operation */
      this.isDragging = false;

      if (this.magnificationFactor > 1) {
        tmpMatrix.makeTranslation(this.translateX, this.translateY, 0);
        this.zoomMatrix.premultiply(tmpMatrix);
        EventBus.fire("zoom-updated", this.zoomMatrix);
        const zoomCommand = new AddZoomSphereCommand(this.zoomMatrix);
        zoomCommand.push();
      }
    } else {
      /* Do the zoom operation */
      this.doZoom(event);
    }
    this.isMousePressed = false;
  }

  doZoom(event: MouseEvent): void {
    if (this._mode === ZoomMode.MINIFY) {
      if (this.magnificationFactor < SETTINGS.zoom.minMagnification) return;
      this.magnificationFactor *= 1 - this.percentChange;
    }
    if (this._mode === ZoomMode.MAGNIFY) {
      if (this.magnificationFactor > SETTINGS.zoom.maxMagnification) return;
      this.magnificationFactor *= 1 + this.percentChange;
    }
    const target = (event.currentTarget || event.target) as HTMLDivElement;
    const boundingRect = target.getBoundingClientRect();
    console.log("Bounding Rect", boundingRect);
    console.log("clientX", event.clientX);
    console.log("clientY", event.clientY);
    const tx = event.clientX - boundingRect.left - boundingRect.width / 2;
    const ty = event.clientY - boundingRect.top - boundingRect.height / 2;
    const mag = this.magnificationFactor;
    if (mag < 1) {
      // If zooming out  the center of the viewport doesn't change
      this.zoomMatrix.makeScale(mag, mag, mag);
    } else {
      // this.zoomMatrix.makeTranslation(this.translateX, this.translateY, 0);
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
    const zoomCommand = new AddZoomSphereCommand(this.zoomMatrix);
    zoomCommand.push();
  }

  doPan(event: MouseEvent): void {
    // Only allow panning if we are zoomed in
    if (this.magnificationFactor < 1) return;
    this.translateX = this.currentPosition.x - this.startDragPosition.x;
    this.translateY = this.currentPosition.y - this.startDragPosition.y;
    tmpMatrix.makeTranslation(this.translateX, this.translateY, 0);
    tmpMatrix.multiply(this.zoomMatrix);
    EventBus.fire("zoom-updated", tmpMatrix);
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
