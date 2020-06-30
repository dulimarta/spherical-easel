import { ToolStrategy } from "./ToolStrategy";
import { Matrix4, Vector2 } from "three";
import { AddZoomSphereCommand } from "@/commands/AddZoomSphereCommand";
import AppStore from "@/store";
import { State } from "vuex-class";
import EventBus from "./EventBus";
import SETTINGS from "@/global-settings";

export enum ZoomMode {
  MAGNIFY,
  MINIFY
}

const tmpMatrix = new Matrix4();

export default class PanZoomHandler implements ToolStrategy {
  protected store = AppStore; // Vuex global state
  /**
   * The HTML element that is the target of the zoom?
   */
  private targetElement: HTMLElement;
  /**
   * The mode of the zoom tool, either Magnify or Minify
   */
  private _mode = ZoomMode.MAGNIFY;

  /**
   * Variables for the pan (translate) operations.
   */
  private utStartDragPosition = new Vector2();
  private currentPixelPosition = new Vector2();

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
    this.isMousePressed = true;

    // Read the target DOM element to determine the current (mouse press) location
    const target = (event.currentTarget || event.target) as HTMLDivElement;
    const boundingRect = target.getBoundingClientRect();
    const offsetX = event.clientX - boundingRect.left;
    const offsetY = event.clientY - boundingRect.top;

    // Compute the pixel location of the mouse press event
    this.currentPixelPosition.set(offsetX, offsetY);
    // Get the current magnification factor and translation vector so we can untransform the pixel location
    const mag = this.store.getters.zoomMagnificationFactor;
    const translationVector = this.store.getters.zoomTranslation;
    // Compute untransformed location of the pixel location, this is the start dragging
    // location *pre* affine transformation
    this.utStartDragPosition.set(
      (offsetX - translationVector[0]) / mag,
      (offsetY - translationVector[1]) / mag
    );
  }
  mouseMoved(event: MouseEvent): void {
    // If the mouse was pressed and then moved, the user is dragging (to pan the view)
    if (this.isMousePressed) {
      this.isDragging = true;
    }

    // Read the target DOM element to determine the current (mouse mouse) location in pixels
    const target = (event.currentTarget || event.target) as HTMLDivElement;
    const boundingRect = target.getBoundingClientRect();
    const offsetX = event.clientX - boundingRect.left;
    const offsetY = event.clientY - boundingRect.top;
    this.currentPixelPosition.set(offsetX, offsetY);

    // Do the pan in the event the user is dragging.
    if (this.isDragging) {
      this.doPan(event);
    }
  }

  mouseReleased(event: MouseEvent): void {
    if (this.isDragging) {
      /* End the Pan operation */
      this.isDragging = false;

      // TODO: Store the last pan as a command that can be undone or redone
      //const zoomCommand = new AddZoomSphereCommand(this.newZoomMatrix);
      //zoomCommand.push();
    } else {
      /* Do the zoom operation */
      this.doZoom(event);
    }
    this.isMousePressed = false;
  }

  doZoom(event: MouseEvent): void {
    // Get the current magnification factor and set a variable for the next one
    const currentMagFactor = this.store.getters.zoomMagnificationFactor;
    let newMagFactor = currentMagFactor;
    // Get the current translation vector to allow us to untransform the CSS transformation
    const currentTranslationVector = this.store.getters.zoomTranslation;

    // Set the next magnification factor depending on the mode.
    if (this._mode === ZoomMode.MINIFY) {
      if (currentMagFactor < SETTINGS.zoom.minMagnification) return;
      newMagFactor = (1 - this.percentChange) * currentMagFactor;
    }
    if (this._mode === ZoomMode.MAGNIFY) {
      if (currentMagFactor > SETTINGS.zoom.maxMagnification) return;
      newMagFactor = (1 + this.percentChange) * currentMagFactor;
    }

    // Compute (pixelX,pixelY) = the location of the mouse release in pixel coordinates relative to
    //  the top left of the sphere frame. This is a location *post* affine transformation
    const target = (event.currentTarget || event.target) as HTMLDivElement;
    const boundingRect = target.getBoundingClientRect();
    const pixelX = event.clientX - boundingRect.left - boundingRect.width / 2;
    const pixelY = event.clientY - boundingRect.top - boundingRect.height / 2;

    // Compute (untransformedPixelX,untransformedPixelY) which is the location of the mouse
    // release event *pre* affine transformation
    const untransformedPixelX =
      (pixelX - currentTranslationVector[0]) / currentMagFactor;
    const untransformedPixelY =
      (pixelY - currentTranslationVector[1]) / currentMagFactor;

    // Compute the new translation Vector. We want the untransformedPixel vector to be mapped
    // to the pixel vector under the new magnification factor. That is, if
    //  Z(x,y)= newMagFactor*(x,y) + newTranslationVector
    // then we must have
    //  Z(untransformedPixel) = pixel Vector
    // Solve for newTranslationVector yields
    const newTranslationVector = [
      untransformedPixelX * -newMagFactor + pixelX,
      untransformedPixelY * -newMagFactor + pixelY
    ];

    // Set the new magnification factor and the next translation vector in the store
    this.store.commit("setZoomMagnificationFactor", newMagFactor);
    this.store.commit("setZoomTranslation", newTranslationVector);

    // Update the display
    EventBus.fire("zoom-updated", {});
    // TODO: Store the last pan as a command that can be undone or redone
    //const zoomCommand = new AddZoomSphereCommand(this.newZoomMatrix);
    //zoomCommand.push();
  }

  doPan(event: MouseEvent) {
    const mag = this.store.getters.zoomMagnificationFactor;
    // // Only allow panning if we are zoomed in
    // if (mag < 1) return;
    const newTranslationVector = [
      this.currentPixelPosition.x - mag * this.utStartDragPosition.x,
      this.currentPixelPosition.y - mag * this.utStartDragPosition.y
    ];

    this.store.commit("setZoomTranslation", newTranslationVector);

    EventBus.fire("zoom-updated", {});
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
