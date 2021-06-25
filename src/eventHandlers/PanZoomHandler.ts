import { ToolStrategy } from "./ToolStrategy";
import { Vector2 } from "three";
import { ZoomSphereCommand } from "@/commands/ZoomSphereCommand";
// import AppStore from "@/store";
import EventBus from "./EventBus";
import SETTINGS from "@/global-settings";

import { SEStore } from "@/store";

export enum ZoomMode {
  MAGNIFY,
  MINIFY,
  FIT
}

// const tmpMatrix = new Matrix4();

export default class PanZoomHandler implements ToolStrategy {
  // protected store = AppStore; // Vuex global state
  /**
   * The HTML element that is the target of the zoom?
   */
  private targetElement: HTMLElement;
  /**
   * The mode of the zoom tool, either Magnify or Minify
   */
  private _mode = ZoomMode.MAGNIFY;

  /**
   * Variables for the pan (translate) operations. (ut = untransformed)
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
   * In indicates that an actual pan view changed happened and a command should be stored in the command stack
   * That is the mouse move event, moved far enough to trigger a pan view change.
   */
  private didPan = false;
  /**
   * Helps indicate if the user mouse pressed and released at the same location - does a zoom at
   * the location of the mouse event
   */
  private isMousePressed = false;

  /**
   * The percentage the magnification factor changes by on user click.
   */
  private percentChange = SETTINGS.zoom.percentChange / 100;
  /**
   * Record the CSS magnification factor and translation vector at the time of
   * mouse press  so we can undo the zoom.
   */
  private mousePressMagnificationFactor = 1;
  private mousePressTranslationVector = [0, 0];
  private lastPanTranslationVector = [0, 0];

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
    // Do nothing if the mode is to Fit the sphere
    if (this._mode == ZoomMode.FIT) return;
    this.isMousePressed = true;

    // Get the current magnification factor and translation vector so we can untransform the pixel location and issue command that can be undone.
    this.mousePressMagnificationFactor = SEStore.zoomMagnificationFactor;
    const temp = SEStore.zoomTranslation;
    for (let i = 0; i < 2; i++) {
      this.mousePressTranslationVector[i] = temp[i];
    }
    // Read the target DOM element to determine the current (mouse press) location
    const target = (event.currentTarget || event.target) as HTMLDivElement;
    const boundingRect = target.getBoundingClientRect();
    const offsetX = event.clientX - boundingRect.left;
    const offsetY = event.clientY - boundingRect.top;

    // Compute the pixel location of the mouse press event
    this.currentPixelPosition.set(offsetX, offsetY);

    // Compute untransformed (ut) location of the pixel location, this is the start dragging
    // location *pre* affine transformation
    this.utStartDragPosition.set(
      (offsetX - this.mousePressTranslationVector[0]) /
        this.mousePressMagnificationFactor,
      (offsetY - this.mousePressTranslationVector[1]) /
        this.mousePressMagnificationFactor
    );
  }

  mouseMoved(event: MouseEvent): void {
    // Do nothing if the mode is to Fit the sphere
    if (this._mode == ZoomMode.FIT) return;
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

    // Do the pan in the event the user is dragging (at least 10 pixels?)
    // Add the extra check for minimum drag distance to prevent a bug
    // where the translation components become NaN
    if (this.isDragging) {
      this.doPan(event);
      this.didPan = true;
    }
  }

  mouseReleased(event: MouseEvent): void {
    // Do nothing if the mode is to Fit the sphere
    if (this._mode == ZoomMode.FIT) return;
    /* The this.didPan condition prevents a zoomCommand from being stored when we were dragging but didn't drag far enough to trigger an actual pan view change*/
    if (this.isDragging && this.didPan) {
      /* End the Pan operation */
      this.isDragging = false;
      //this.didPan = false;

      // Store the zoom as a command that can be undone or redone
      const zoomCommand = new ZoomSphereCommand(
        this.mousePressMagnificationFactor, // For a pan the magnification factor doesn't change between mouse press and mouse release
        this.lastPanTranslationVector,
        this.mousePressMagnificationFactor,
        this.mousePressTranslationVector
      );
      // Push the command on to the command stack, but do not execute it because it has already been enacted
      zoomCommand.push();
    } else {
      /* Do the zoom operation unless the isMousePressed is false (which might happen if the mouse leave event was triggered
       */
      if (this.isMousePressed) {
        this.doZoom(event);
      }
    }
    this.isMousePressed = false;
  }

  doZoom(event: MouseEvent): void {
    // Get the current magnification factor and set a variable for the next one
    const currentMagFactor = SEStore.zoomMagnificationFactor;
    let newMagFactor = currentMagFactor;
    // Get the current translation vector to allow us to untransform the CSS transformation
    const currentTranslationVector = SEStore.zoomTranslation;

    // Set the next magnification factor depending on the mode.
    if (this._mode === ZoomMode.MINIFY) {
      if (currentMagFactor < SETTINGS.zoom.minMagnification) {
        console.error(
          `Exceeded zoom out limit ${SETTINGS.zoom.minMagnification}`
        );
        EventBus.fire("show-alert", {
          key: `handlers.panZoomHandlerZoomOutLimitReached`,
          keyOptions: {},
          type: "warning"
        });
        return;
      }
      newMagFactor = (1 - this.percentChange) * currentMagFactor;
    }
    if (this._mode === ZoomMode.MAGNIFY) {
      if (currentMagFactor > SETTINGS.zoom.maxMagnification) {
        console.error(
          `Exceeded zoom in limit ${SETTINGS.zoom.maxMagnification}`
        );
        EventBus.fire("show-alert", {
          key: `handlers.panZoomHandlerZoomInLimitReached`,
          keyOptions: {},
          type: "warning"
        });
        return;
      }
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
      pixelX - untransformedPixelX * newMagFactor,
      pixelY - untransformedPixelY * newMagFactor
    ];
    // When zooming out, add extra translation so the pivot of
    // zoom is eventually (0,0) when the magnification factor reaches 1
    if (newMagFactor < currentMagFactor) {
      if (newMagFactor > 1) {
        const fraction = (newMagFactor - 1) / (currentMagFactor - 1);
        newTranslationVector[0] *= fraction;
        newTranslationVector[1] *= fraction;
        // console.debug("Modified zoom translation", newTranslationVector);
      } else {
        newTranslationVector[0] = 0;
        newTranslationVector[1] = 0;
      }
    }

    // #region writeFactorVectorToStore
    // Set the new magnification factor and the new translation vector in the store
    SEStore.setZoomMagnificationFactor(newMagFactor);
    SEStore.setZoomTranslation(newTranslationVector);
    // #endregion writeFactorVectorToStore

    // Update the display
    EventBus.fire("zoom-updated", {});

    // Store the zoom as a command that can be undone or redone
    const zoomCommand = new ZoomSphereCommand(
      newMagFactor,
      newTranslationVector,
      this.mousePressMagnificationFactor,
      this.mousePressTranslationVector
    );
    // Push the command on to the command stack, but do not execute it because it has already been enacted
    zoomCommand.push();
  }

  doPan(event: MouseEvent): void {
    const mag = SEStore.zoomMagnificationFactor;
    // // Only allow panning if we are zoomed in
    // if (mag < 1) return;
    this.lastPanTranslationVector = [
      this.currentPixelPosition.x - mag * this.utStartDragPosition.x,
      this.currentPixelPosition.y - mag * this.utStartDragPosition.y
    ];
    // Set the new translation vector in the store
    SEStore.setZoomTranslation(this.lastPanTranslationVector);

    // Update the display
    EventBus.fire("zoom-updated", {});
  }

  mouseLeave(event: MouseEvent): void {
    // Do nothing if the mode is to Fit the sphere
    if (this._mode == ZoomMode.FIT) return;
    this.isDragging = false;
    this.isMousePressed = false;
  }

  activate(): void {
    // No code required yet
  }

  deactivate(): void {
    // No code required yet
  }
  doZoomFit(size: number): void {
    // Get the current magnification factor and set a variable for the next one
    const currentMagFactor = SEStore.zoomMagnificationFactor;
    // Get the current translation vector to allow us to untransform the CSS transformation
    const currentTranslationVector = SEStore.zoomTranslation;

    const radius = size / 2 - 16; // 16-pixel gap
    SEStore.setSphereRadius(radius);

    // The radius over the default radius is the magnification factor
    const newMagFactor = radius / SETTINGS.boundaryCircle.radius;

    // Set the new magnification factor and the new translation vector in the store
    // The origin of the screen is the zoom translation vector
    SEStore.setZoomMagnificationFactor(newMagFactor);
    SEStore.setZoomTranslation([0, 0]);

    // Update the display
    EventBus.fire("zoom-updated", {});
    // Store the zoom as a command that can be undone or redone
    const zoomCommand = new ZoomSphereCommand(
      newMagFactor,
      [0, 0],
      currentMagFactor,
      currentTranslationVector
    );
    // Push the command on to the command stack, but do not execute it because it has already been enacted
    zoomCommand.push();
  }
}
