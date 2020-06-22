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
import PanZoomHandler, { ZoomMode } from "@/eventHandlers/PanZoomHandler"
import { PositionVisitor } from "@/visitors/PositionVisitor";
import EventBus from "@/eventHandlers/EventBus";
const tmpMatrix1 = new Matrix4();
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
  private CSSTransformMat = new Matrix4(); // CSSMat = sphereTransform * zoomMat
  private magnificationFactor = 1;
  private currentTool: ToolStrategy | null = null;
  private pointTool!: PointHandler;
  private lineTool!: LineHandler;
  private segmentTool!: SegmentHandler;
  private circleTool!: CircleHandler;
  private rotateTool!: RotateHandler;
  private zoomTool!: PanZoomHandler;
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
    EventBus.listen("zoom-updated", this.zoomer);
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
    this.$refs.canvas.addEventListener("mousemove", this.handleMouseMoved);
    this.$refs.canvas.addEventListener("mousedown", this.handleMousePressed);
    this.$refs.canvas.addEventListener("mouseup", this.handleMouseReleased);
    this.pointTool = new PointHandler(this.layers, this.CSSTransformMat);
    this.lineTool = new LineHandler(this.layers, this.CSSTransformMat);
    this.segmentTool = new SegmentHandler(
      this.layers,
      this.CSSTransformMat
    );
    this.circleTool = new CircleHandler(
      this.layers,
      this.CSSTransformMat
    );
    this.rotateTool = new RotateHandler(
      this.layers,
      this.CSSTransformMat
    );
    this.zoomTool = new PanZoomHandler(this.$refs.canvas);
  }

  beforeDestroy(): void {
    this.$refs.canvas.removeEventListener("mousemove", this.handleMouseMoved);
    this.$refs.canvas.removeEventListener("mousedown", this.handleMousePressed);
    this.$refs.canvas.removeEventListener("mouseup", this.handleMouseReleased);
    this.$refs.canvas.removeEventListener("mouseleave", this.handleMouseLeave);
  }

  @Watch("canvasSize")
  onCanvasResize(size: number): void {
    console.debug("onCanvasResize");
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
    tmpMatrix1.multiplyMatrices(this.sphereTransformMat, this.zoomMatrix);
    this.viewTransform = tmpMatrix1;
  }

  private zoomer(mat: Matrix4): void {
    console.debug("New zoom matrix", mat.elements);
    tmpMatrix1.multiplyMatrices(this.sphereTransformMat, mat);
    this.viewTransform = tmpMatrix1; // Use the setter
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

  handleMouseLeave(e: MouseEvent): void {
    this.currentTool?.mouseLeave(e);
  }

  handleSphereRotation(e: unknown): void {
    this.$store.commit('rotateSphere', (e as any).transform);
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
      case "zoomIn":
        this.currentTool = this.zoomTool;
        this.zoomTool.zoomMode = ZoomMode.MAGNIFY;
        break;
      case "zoomOut":
        this.currentTool = this.zoomTool;
        this.zoomTool.zoomMode = ZoomMode.MINIFY;
        break;
      default:
        this.currentTool = null;
    }
    this.currentTool?.activate();
  }
}
</script>

<style scoped></style>
