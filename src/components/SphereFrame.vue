<template>
  <div id="canvas" ref="canvas"></div>
</template>

<style lang="scss" scoped></style>
<script lang="ts">
import VueComponent from "vue";
import { Prop, Component, Watch } from "vue-property-decorator";
import Two from "two.js";
import SETTINGS, { LAYER } from "@/global-settings";
import { State } from "vuex-class";
import AppStore from "@/store";
import { ZoomSphereCommand } from "@/commands/ZoomSphereCommand";

import { ToolStrategy } from "@/eventHandlers/ToolStrategy";
import SelectionHandler from "@/eventHandlers/SelectionHandler";
import PointHandler from "@/eventHandlers/PointHandler";
import LineHandler from "@/eventHandlers/LineHandler";
import SegmentHandler from "@/eventHandlers/SegmentHandler";
import CircleHandler from "@/eventHandlers/CircleHandler";
import RotateHandler from "@/eventHandlers/RotateHandler";
import IntersectionPointHandler from "@/eventHandlers/IntersectionPointHandler";
import PanZoomHandler, { ZoomMode } from "@/eventHandlers/PanZoomHandler";
import { PositionVisitor } from "@/visitors/PositionVisitor";
import EventBus from "@/eventHandlers/EventBus";
import MoveHandler from "../eventHandlers/MoveHandler";

@Component({})
export default class SphereFrame extends VueComponent {
  @Prop()
  readonly canvasSize!: number;

  @State
  readonly actionMode!: string;

  @State
  readonly zoomMagnificationFactor!: number;

  @State
  readonly zoomTranslation!: number[];

  $refs!: {
    canvas: HTMLDivElement;
  };
  /**
   * The main (the only one) TwoJS object that contains the layers (each a Two.Group) making up the screen graph
   * First layers  (Two.Groups) are added to the twoInstance (index by the enum LAYER from
   * global-settings.ts), then TwoJs objects (Two.Path, Two.Ellipse, etc..) are added to the
   * appropriate layer. This object is refreahed at 60 fps (in constructir -- autostart: true).
   */
  private twoInstance: Two;

  private sphereCanvas!: Two.Group;
  /**
   * The circle that is the end of the projection of the Default Sphere in the Default Screen Plane
   */
  private boundaryCircle!: Two.Circle;
  /**
   * The Global Vuex Store
   */
  protected store = AppStore;

  /** Tools for handling user input */
  private currentTool: ToolStrategy | null = null;
  private selectTool!: SelectionHandler;
  private pointTool!: PointHandler;
  private lineTool!: LineHandler;
  private segmentTool!: SegmentHandler;
  private circleTool!: CircleHandler;
  private rotateTool!: RotateHandler;
  private zoomTool!: PanZoomHandler;
  private moveTool!: MoveHandler;
  private intersectTool!: IntersectionPointHandler;

  /**
   * A way to change the location of the points in the store to enact a rotation, this visits
   * all points and updates their position according to a matrix4 passed as an argument. It visits
   * all lines and circles and tells them to update.
   */
  private visitor!: PositionVisitor;

  /**
   * The layers for displaying the various objects in the right way. So a point in the
   * background is not displayed over a line in the foreground
   */
  private layers: Two.Group[] = [];

  constructor() {
    super();
    this.twoInstance = new Two({
      width: this.canvasSize,
      height: this.canvasSize,
      autostart: true,
      ratio: window.devicePixelRatio
    });
    // Clear layer array
    this.layers.splice(0, this.layers.length);

    //#region addlayers
    // Record the text layer number so that the y axis is not flipped for them
    const textLayers = [
      LAYER.foregroundText,
      LAYER.backgroundText,
      LAYER.foregroundTextGlowing,
      LAYER.backgroundTextGlowing
    ].map(Number); // shortcut for .map(x => Number(x))
    for (const layer in LAYER) {
      const layerIdx = Number(layer);
      if (!isNaN(layerIdx)) {
        // Create the layers
        const newLayer = this.twoInstance.makeGroup();
        this.layers.push(newLayer);

        // Don't flip the y-coord of text layers
        if (textLayers.indexOf(layerIdx) < 0) {
          // Not in textLayers
          (newLayer as any).scale = new Two.Vector(1, -1);
        }
      }
    }
    //#endregion addlayers

    // The midground is where the temporary objects and the boundary circle were drawn TODO: Needed?
    this.sphereCanvas = this.layers[LAYER.midground];
    // console.info("Sphere canvas ID", this.sphereCanvas.id);
    // Add the layers to the store
    this.$store.commit("setLayers", this.layers);

    // Draw the boundary circle in the default radius
    // and scale it later to fit the canvas
    this.boundaryCircle = new Two.Circle(0, 0, SETTINGS.boundaryCircle.radius);
    this.boundaryCircle.noFill();
    this.boundaryCircle.linewidth = SETTINGS.boundaryCircle.linewidth;
    this.layers[LAYER.midground].add(this.boundaryCircle);
    // const box1 = new Two.Rectangle(-100, 150, 100, 150);
    // box1.fill = "hsl(200,80%,50%)";
    // const box2 = new Two.Rectangle(100, 150, 100, 150);
    // box2.fill = "red";
    // box1.addTo(this.layers[LAYER.background]);
    // box2.addTo(this.layers[LAYER.foregroundText]);

    const t1 = new Two.Text("Text must be upright", 50, 80, {
      size: 12,
      alignment: "left",
      family: "Arial",
      style: "bold"
    });
    this.layers[LAYER.foregroundText].add(t1);

    // Draw horizontal and vertical lines (just for debugging)
    // const R = SETTINGS.boundaryCircle.radius;
    // const hLine = new Two.Line(-R, 0, R, 0);
    // const vLine = new Two.Line(0, -R, 0, R);
    // hLine.stroke = "red";
    // vLine.stroke = "green";
    // this.sphereCanvas.add(
    //   hLine,
    //   vLine,
    //   new Two.Line(100, -R, 100, R),
    //   new Two.Line(-R, 100, R, 100)
    // );
    this.visitor = new PositionVisitor();

    // Add Event Bus (a Vue component) listeners to change the display of the sphere - rotate and Zoom/Pan
    EventBus.listen("sphere-rotate", this.handleSphereRotation);
    EventBus.listen("zoom-updated", this.updateView);
  }

  mounted(): void {
    this.twoInstance.appendTo(this.$refs.canvas);
    this.twoInstance.play();
    // this.sphereCanvas.translation.set(this.canvasSize / 2, this.canvasSize / 2);
    // this.$refs.canvas.addEventListener("wheel", this.handleMouseScroll); // by Hans
    this.$refs.canvas.addEventListener("mousemove", this.handleMouseMoved);
    this.$refs.canvas.addEventListener("mousedown", this.handleMousePressed);
    this.$refs.canvas.addEventListener("mouseup", this.handleMouseReleased);
    this.$refs.canvas.addEventListener("mouseleave", this.handleMouseLeave);
    this.$refs.canvas.addEventListener("wheel", this.handleMouseWheel); // by Will
    this.selectTool = new SelectionHandler(this.layers);
    this.currentTool = this.selectTool;
    this.pointTool = new PointHandler(this.layers);
    this.lineTool = new LineHandler(this.layers);
    this.segmentTool = new SegmentHandler(this.layers);
    this.circleTool = new CircleHandler(this.layers);
    this.rotateTool = new RotateHandler(this.layers);
    this.zoomTool = new PanZoomHandler(this.$refs.canvas);
    this.moveTool = new MoveHandler(this.layers);
    this.intersectTool = new IntersectionPointHandler(this.layers);
  }

  beforeDestroy(): void {
    this.$refs.canvas.removeEventListener("mousemove", this.handleMouseMoved);
    this.$refs.canvas.removeEventListener("mousedown", this.handleMousePressed);
    this.$refs.canvas.removeEventListener("mouseup", this.handleMouseReleased);
    this.$refs.canvas.removeEventListener("mouseleave", this.handleMouseLeave);
    this.$refs.canvas.removeEventListener("wheel", this.handleMouseWheel);
  }

  @Watch("canvasSize")
  onCanvasResize(size: number): void {
    // console.debug("onCanvasResize");
    (this.twoInstance.renderer as any).setSize(size, size);
    // Move the origin of all layers to the center of the viewport
    this.layers.forEach(z => {
      z.translation.set(this.canvasSize / 2, this.canvasSize / 2);
    });

    const radius = size / 2 - 16; // 16-pixel gap
    this.$store.commit("setSphereRadius", radius);

    const ratio = radius / SETTINGS.boundaryCircle.radius;
    this.$store.dispatch("changeZoomFactor", ratio);
    // Each window size gets its own zoom matrix
    // When you resize a window the zoom resets
    this.$store.commit("setZoomTranslation", [0, 0]);

    this.updateView();
  }

  /** Apply the affine transform (m) to the entire TwoJS SVG tree! */
  // The translation element of the CSS transform matrix
  // is actually the pivot/origin of the zoom
  // #region updateView
  private updateView() {
    // Get the current maginiication factor and translation vector
    const mag = this.store.state.zoomMagnificationFactor;
    const transVector = this.store.state.zoomTranslation;

    // Get the DOM element to apply the transform to
    const el = (this.twoInstance.renderer as any).domElement as HTMLElement;
    // Set the transform
    const mat = `matrix(${mag},0,0,${mag},${transVector[0]},${transVector[1]})`;
    // console.debug("CSS transform matrix: ", mat);
    el.style.transform = mat;
    // Set the origin of the transform
    const origin = this.canvasSize / 2;
    el.style.transformOrigin = `${origin}px ${origin}px`;
    // What does this do?
    el.style.overflow = "visible";
  }
  // #endregion updateView

  handleMouseWheel(event: MouseWheelEvent): void {
    console.log("Mouse Wheel Zoom!");
    // Compute (pixelX,pixelY) = the location of the mouse release in pixel coordinates relative to
    //  the top left of the sphere frame. This is a location *post* affine transformation
    const target = (event.currentTarget || event.target) as HTMLDivElement;
    const boundingRect = target.getBoundingClientRect();
    const pixelX = event.clientX - boundingRect.left - boundingRect.width / 2;
    const pixelY = event.clientY - boundingRect.top - boundingRect.height / 2;
    event.preventDefault();

    // Compute the fraction to zoom in or out by
    let scrollFraction = event.deltaY / boundingRect.height;
    if (event.ctrlKey) {
      // Flip the sign for pinch/zoom gestures on Mac trackpad
      scrollFraction *= -1;
    }
    // Get the current magnification factor and set a variable for the next one
    const currentMagFactor = this.store.state.zoomMagnificationFactor;
    let newMagFactor = currentMagFactor;
    // Set the next magnification factor. Positive scroll fraction means zoom out, negative zoom in.
    if (scrollFraction < 0) {
      if (currentMagFactor < SETTINGS.zoom.minMagnification) return;
      newMagFactor = (1 - Math.abs(scrollFraction)) * currentMagFactor;
    }
    if (scrollFraction > 0) {
      if (currentMagFactor > SETTINGS.zoom.maxMagnification) return;
      newMagFactor = (1 + scrollFraction) * currentMagFactor;
    }
    // Get the current translation vector to allow us to untransform the CSS transformation
    const currentTranslationVector = [
      this.store.state.zoomTranslation[0],
      this.store.state.zoomTranslation[1]
    ];

    // Compute (untransformedPixelX,untransformedPixelY) which is the location of the mouse
    // wheel event *pre* affine transformation
    const untransformedPixelX =
      (pixelX - currentTranslationVector[0]) / currentMagFactor;
    const untransformedPixelY =
      (pixelY - currentTranslationVector[1]) / currentMagFactor;
    // Compute the new translation Vector. We want the untransformedPixel vector to be mapped
    // to the pixel vector under the new maginification factor. That is, if
    //  Z(x,y)= newMagFactor*(x,y) + newTranslationVector
    // then we must have
    //  Z(untransformedPixel) = pixel Vector
    // Solve for newTranlationVector yields

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
      } else {
        newTranslationVector[0] = 0;
        newTranslationVector[1] = 0;
      }
    }

    // Set the new magnifiction factor and the next translation vector in the store
    this.store.dispatch("changeZoomFactor", newMagFactor);
    this.store.commit("setZoomTranslation", newTranslationVector);
    // Update the display
    this.updateView();
    //EventBus.fire("zoom-updated", {});
    // Store the zoom as a command that can be undone or redone
    const zoomCommand = new ZoomSphereCommand(
      newMagFactor,
      newTranslationVector,
      currentMagFactor,
      currentTranslationVector
    );
    // Push the command on to the command stack, but do not execute it because it has already been enacted
    zoomCommand.push();
  }
  handleMouseMoved(e: MouseEvent): void {
    // Only process events from the left (inner) mouse button to avoid adverse interactions with any pop-up menu
    if (e.button === 0)
      // When currentTool is NULL, currentTool? resolves to no action
      this.currentTool?.mouseMoved(e);
  }

  handleMousePressed(e: MouseEvent): void {
    // Only process events from the left (inner) mouse button to avoid adverse interactions with any pop-up menu
    if (e.button === 0)
      this.currentTool?.mousePressed(e);
  }

  handleMouseReleased(e: MouseEvent): void {
    // Only process events from the left (inner) mouse button to avoid adverse interactions with any pop-up menu
    if (e.button === 0)
      // When currentTool is NULL, the following line does nothing
      this.currentTool?.mouseReleased(e);
  }

  handleMouseLeave(e: MouseEvent): void {
    // Only process events from the left (inner) mouse button to avoid adverse interactions with any pop-up menu
    if (e.button === 0)
      // When currentTool is NULL, the following line does nothing
      this.currentTool?.mouseLeave(e);
  }

  //#region handleSphereRotation
  handleSphereRotation(e: unknown): void {
    this.$store.commit("rotateSphere", (e as any).transform);
  }
  //#endregion handleSphereRotation

  @Watch("actionMode")
  switchActionMode(mode: string): void {
    this.currentTool?.deactivate();
    this.currentTool = null;
    switch (mode) {
      case "select":
        this.currentTool = this.selectTool;
        break;
      case "rotate":
        this.currentTool = this.rotateTool;
        break;
      case "move":
        this.currentTool = this.moveTool;
        break;
      case "point":
        this.currentTool = this.pointTool;
        break;
      case "line":
        this.currentTool = this.lineTool;
        break;
      case "segment":
        this.currentTool = this.segmentTool;
        break;
      case "circle":
        this.currentTool = this.circleTool;
        break;
      case "zoomIn":
        this.currentTool = this.zoomTool;
        this.zoomTool.zoomMode = ZoomMode.MAGNIFY;
        break;
      case "zoomOut":
        this.currentTool = this.zoomTool;
        this.zoomTool.zoomMode = ZoomMode.MINIFY;
        break;
      case "intersect":
        this.currentTool = this.intersectTool;
        break;
      default:
        this.currentTool = null;
    }
    this.currentTool?.activate();
  }
}
</script>
