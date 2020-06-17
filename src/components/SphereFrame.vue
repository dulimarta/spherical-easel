<template>
  <div id="canvas" ref="canvas"></div>
</template>

<script lang="ts">
import VueComponent from "vue";
import { Prop, Component, Watch } from "vue-property-decorator";
import Two from "two.js";
import SETTINGS, { LAYER } from "@/global-settings";
import { Matrix4 } from "three";
import { State } from "vuex-class";
import { ToolStrategy } from "@/eventHandlers/ToolStrategy";
import PointHandler from "@/eventHandlers/PointHandler";
import LineHandler from "@/eventHandlers/LineHandler";
import SegmentHandler from "@/eventHandlers/SegmentHandler";
import CircleHandler from "@/eventHandlers/CircleHandler";
import RotateHandler from "@/eventHandlers/RotateHandler";
import { PositionVisitor } from "@/visitors/PositionVisitor";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { Visitor } from "@/visitors/Visitor";
import EventBus from "@/eventHandlers/EventBus";
import { AddPointCommand } from "@/commands/AddPointCommand";
import Point from "@/plottables/Point";

@Component({})
export default class SphereFrame extends VueComponent {
  @Prop()
  readonly canvasSize!: number;

  @State
  readonly editMode!: string;

  $refs!: {
    canvas: HTMLDivElement;
  };
  private twoInstance: Two;
  private sphereCanvas!: Two.Group;
  private boundaryCircle!: Two.Circle;
  private sphereTransformMat = new Matrix4(); // Transformation from the ideal sphere to the rendered sphere/circle
  private zoomMatrix = new Matrix4();
  private tmpMatrix = new Matrix4();
  private CSSTransformMat = new Matrix4(); // CSSMat = sphereTransform * zoomMat
  private magnificationFactor = 1;
  private currentTool: ToolStrategy | null = null;
  private pointTool!: PointHandler;
  private lineTool!: LineHandler;
  private segmentTool!: SegmentHandler;
  private circleTool!: CircleHandler;
  private rotateTool!: RotateHandler;
  private visitor!: PositionVisitor;
  private layers: Two.Group[] = [];

  constructor() {
    super();
    this.twoInstance = new Two({
      width: this.canvasSize,
      height: this.canvasSize,
      autostart: true,
      ratio: window.devicePixelRatio
    });
    this.layers.splice(0, this.layers.length); // Clear layer array

    const textLayers = [
      LAYER.foregroundText,
      LAYER.backgroundText,
      LAYER.foregroundTextGlowing,
      LAYER.backgroundTextGlowing
    ].map(Number); // shortcut for .map(x => Number(x))
    for (const layer in LAYER) {
      const layerIdx = Number(layer);
      if (!isNaN(layerIdx)) {
        const newLayer = this.twoInstance.makeGroup();
        this.layers.push(newLayer);

        // Don't flip the Y-coord of text layers
        if (textLayers.indexOf(layerIdx) < 0) {
          // Not in textLayers
          (newLayer as any).scale = new Two.Vector(1, -1);
        }
      }
    }
    this.sphereCanvas = this.layers[LAYER.midground];
    console.info("Sphere canvas ID", this.sphereCanvas.id);
    this.$store.commit("setLayers", this.layers);

    // Draw the boundary circle in the ideal radius
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
    const R = SETTINGS.boundaryCircle.radius;

    const t1 = new Two.Text("Text must be upright", 50, 80, {
      size: 12,
      alignment: "left",
      family: "Arial",
      style: "bold"
    });
    this.layers[LAYER.foregroundText].add(t1);

    // Draw horizontal and vertical lines (just for debugging)
    const hLine = new Two.Line(-R, 0, R, 0);
    const vLine = new Two.Line(0, -R, 0, R);
    hLine.stroke = "red";
    vLine.stroke = "green";
    // this.sphereCanvas.add(
    //   hLine,
    //   vLine,
    //   new Two.Line(100, -R, 100, R),
    //   new Two.Line(-R, 100, R, 100)
    // );
    this.visitor = new PositionVisitor();
    EventBus.listen("sphere-rotate", this.handleSphereRotation);
  }

  /** Apply the affine transform (m) to the entire TwoJS SVG tree! */
  // The translation element of the CSS transform matrix
  // is actually the pivot/origin of the zoom
  private set viewTransform(m: Matrix4) {
    this.CSSTransformMat.copy(m);
    const arr = m.elements;

    const el = (this.twoInstance.renderer as any).domElement as HTMLElement;
    // CSS transformation matrix is only 2x3
    el.style.transform = `matrix(${arr[0]},${arr[1]},${arr[4]},${arr[5]},${arr[12]},${arr[13]})`;
    const orig = this.canvasSize / 2;
    el.style.transformOrigin = `${orig}px ${orig}px`;
    el.style.overflow = "visible";
  }

  private get viewTransform() {
    return this.CSSTransformMat;
  }

  mounted(): void {
    this.twoInstance.appendTo(this.$refs.canvas);
    this.twoInstance.play();
    // this.sphereCanvas.translation.set(this.canvasSize / 2, this.canvasSize / 2);
    this.$refs.canvas.addEventListener("wheel", this.zoomer);
    this.$refs.canvas.addEventListener("mousemove", this.handleMouseMoved);
    this.$refs.canvas.addEventListener("mousedown", this.handleMousePressed);
    this.$refs.canvas.addEventListener("mouseup", this.handleMouseReleased);
    this.pointTool = new PointHandler(this.sphereCanvas, this.CSSTransformMat);
    this.lineTool = new LineHandler(this.sphereCanvas, this.CSSTransformMat);
    this.segmentTool = new SegmentHandler(
      this.sphereCanvas,
      this.CSSTransformMat
    );
    this.circleTool = new CircleHandler(
      this.sphereCanvas,
      this.CSSTransformMat
    );
    this.rotateTool = new RotateHandler(
      this.sphereCanvas,
      this.CSSTransformMat
    );
  }

  beforeDestroy(): void {
    this.$refs.canvas.removeEventListener("wheel", this.zoomer);
    this.$refs.canvas.removeEventListener("mousemove", this.handleMouseMoved);
    this.$refs.canvas.removeEventListener("mousedown", this.handleMousePressed);
    this.$refs.canvas.removeEventListener("mouseup", this.handleMouseReleased);
  }

  @Watch("canvasSize")
  onCanvasResize(size: number): void {
    (this.twoInstance.renderer as any).setSize(size, size);
    // Move the origin of all layers to the center of the viewport
    this.layers.forEach(z => {
      z.translation.set(this.canvasSize / 2, this.canvasSize / 2);
    });

    const radius = size / 2 - 16; // 16-pixel gap
    this.$store.commit("setSphereRadius", radius);

    const ratio = radius / SETTINGS.boundaryCircle.radius;
    EventBus.fire("magnification-updated", {
      factor: ratio
    });
    this.sphereTransformMat.makeScale(ratio, ratio, 1);
    this.tmpMatrix.multiplyMatrices(this.sphereTransformMat, this.zoomMatrix);
    this.viewTransform = this.tmpMatrix;
  }

  zoomer(e: MouseWheelEvent): void {
    if (e.metaKey) {
      e.preventDefault();
      let scrollFraction = e.deltaY / this.canvasSize;
      if (e.ctrlKey) {
        // Flip the sign for pinch/zoom gestures on Mac trackpad
        scrollFraction *= -1;
      }

      // Limit to 10% change in magnification
      if (Math.abs(scrollFraction) > 0.1)
        scrollFraction = 0.1 * Math.sign(scrollFraction);

      const scaleFactor = 1 + scrollFraction;
      // Limit zoom-out to 0.4x magnification factor
      if (scaleFactor < 1 && this.magnificationFactor < 0.4) return;

      // Limit zoom-in to 10x magnification factor
      if (scaleFactor > 1 && this.magnificationFactor > 10) return;
      this.magnificationFactor *= scaleFactor;
      const sphereRatio = (this.canvasSize / 2 - 16) / SETTINGS.boundaryCircle.radius;
      EventBus.fire("magnification-updated", {
        factor: this.magnificationFactor * sphereRatio
      });
      const target = (e.currentTarget || e.target) as HTMLDivElement;
      const boundingRect = target.getBoundingClientRect();
      const offsetX = e.clientX - boundingRect.left;
      const offsetY = e.clientY - boundingRect.top;

      // The origin of translation is the center of the canvas
      const tx = offsetX - this.canvasSize / 2;
      const ty = offsetY - this.canvasSize / 2;
      // console.debug("Zoom info", scrollFraction.toFixed(2), scaleFactor.toFixed(2), this.magnificationFactor.toFixed(2));
      const mag = this.magnificationFactor;

      // Update the zoom matrix
      if (mag > 1) {
        // Zoom from the current mouse position requires a composite transform
        this.zoomMatrix.identity();
        this.tmpMatrix.makeTranslation(tx, ty, 0);
        this.zoomMatrix.multiply(this.tmpMatrix);
        this.tmpMatrix.makeScale(mag, mag, mag);
        this.zoomMatrix.multiply(this.tmpMatrix);
        this.tmpMatrix.makeTranslation(-tx, -ty, 0);
        this.zoomMatrix.multiply(this.tmpMatrix);
      } else {
        // Zoom from the origin when magnification factor is less than 1
        this.zoomMatrix.makeScale(mag, mag, mag);
      }
      // Construct the view matrix
      this.tmpMatrix.multiplyMatrices(this.sphereTransformMat, this.zoomMatrix);
      this.viewTransform = this.tmpMatrix; // Use the setter
    }
  }

  handleMouseMoved(e: MouseEvent): void {
    // WHen currentTool is NULL, currentTool? resolves to no action
    this.currentTool?.mouseMoved(e);
  }
  handleMousePressed(e: MouseEvent): void {
    this.currentTool?.mousePressed(e);
  }

  handleMouseReleased(e: MouseEvent): void {
    // WHen currentTool is NULL, the following line does nothing
    this.currentTool?.mouseReleased(e);
  }

  handleSphereRotation(e: unknown): void {
    if (this.visitor) {
      this.visitor.setTransform((e as any).transform);
      this.$store.state.points.forEach((p: SEPoint) => {
        p.accept(this.visitor);
      });
      this.$store.state.lines.forEach((l: SELine) => {
        l.accept(this.visitor);
      });
    }
  }

  @Watch("editMode")
  switchEditMode(mode: string): void {
    this.currentTool?.deactivate();
    this.currentTool = null;
    switch (mode) {
      case "rotate":
        this.currentTool = this.rotateTool;
        break;
      case "move":
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
      default:
        this.currentTool = null;
    }
    this.currentTool?.activate();
  }
}
</script>

<style scoped></style>
