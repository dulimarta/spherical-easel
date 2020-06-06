<template>
  <div id="canvas" ref="canvas"></div>
</template>

<script lang="ts">
import VueComponent from 'vue'
import { Prop, Component, Watch } from 'vue-property-decorator'
import Two from 'two.js';
import SETTINGS from "@/global-settings"
import { Matrix4 } from 'three';

@Component({})
export default class SphereFrame extends VueComponent {
  @Prop()
  readonly canvasSize!: number

  $refs!: {
    canvas: HTMLDivElement
  }
  private twoInstance: Two;
  private sphereCanvas!: Two.Group;
  private mainCircle!: Two.Circle;
  private sphereTransformMat = new Matrix4(); // Transformation from the ideal sphere to the rendered sphere/circle
  private zoomMatrix = new Matrix4();
  private tmpMatrix = new Matrix4();
  private CSSTransformMat = new Matrix4(); // CSSMat = sphereTransform * zoomMat
  private magnificationFactor = 1;

  constructor() {
    super();
    this.twoInstance = new Two({
      width: this.canvasSize,
      height: this.canvasSize,
      autostart: true,
      ratio: window.devicePixelRatio
    });
    this.sphereCanvas = this.twoInstance.makeGroup();
    (this.sphereCanvas as any).scale = new Two.Vector(1, -1);
    console.info("Sphere canvas ID", this.sphereCanvas.id);
    this.$store.commit("setSphere", this.sphereCanvas);

    // Draw the boundary circle in the ideal radius
    // and scale it later to fit the canvas
    this.mainCircle = new Two.Circle(0, 0, SETTINGS.sphere.radius);
    this.mainCircle.noFill();
    this.mainCircle.linewidth = SETTINGS.line.thickness;
    this.sphereCanvas.add(this.mainCircle);

    const textGroup = this.twoInstance.makeGroup();
    const R = SETTINGS.sphere.radius;

    const t1 = new Two.Text("Text must be upright",
      50, 80,
      { size: 12, alignment: "left", style: "italic" });
    textGroup.add(t1);

    const hLine = new Two.Line(-R, 0, R, 0);
    const vLine = new Two.Line(0, -R, 0, R);
    hLine.stroke = "red";
    vLine.stroke = "green";
    this.sphereCanvas.add(
      hLine, vLine,
      new Two.Line(100, -R, 100, R),
      new Two.Line(-R, 100, R, 100),
    );

  }
  /** Apply the affine transform (m) to the entire TwoJS SVG tree! */
  // The translation element of the CSS transform matrix
  // is actually the pivot/origin of the zoom
  private set viewTransform(m: Matrix4) {
    this.CSSTransformMat.copy(m);
    const arr = m.elements;

    const el = ((this.twoInstance.renderer as any).domElement as HTMLElement);
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
    this.sphereCanvas.translation.set(this.canvasSize / 2, this.canvasSize / 2);
    this.$refs.canvas.addEventListener('wheel', this.zoomer, { passive: true })
  }

  @Watch("canvasSize")
  onCanvasResize(size: number): void {

    (this.twoInstance.renderer as any).setSize(size, size);
    this.sphereCanvas.translation.set(size / 2, size / 2);
    const radius = (size / 2) - 16; // 16-pixel gap
    this.$store.commit("setSphereRadius", radius);

    const ratio = radius / SETTINGS.sphere.radius;
    this.sphereTransformMat.makeScale(ratio, ratio, 1);
    this.tmpMatrix.multiplyMatrices(this.sphereTransformMat, this.zoomMatrix);
    this.viewTransform = this.tmpMatrix;
  }

  zoomer(e: MouseWheelEvent): void {
    if (e.metaKey) {
      let scrollFraction = e.deltaY / this.canvasSize;

      // Limit to 10% change in magnification
      if (Math.abs(scrollFraction) > 0.1)
        scrollFraction = 0.1 * Math.sign(scrollFraction);


      const scaleFactor = 1 + scrollFraction;
      // Limit zoom-out to 0.4x magnification factor
      if (scaleFactor < 1 && this.magnificationFactor < 0.4) return;

      // Limit zoom-in to 10x magnification factor
      if (scaleFactor > 1 && this.magnificationFactor > 10) return;
      this.magnificationFactor *= scaleFactor;
      const target = (e.currentTarget || e.target) as HTMLDivElement;
      const boundingRect = target.getBoundingClientRect();
      const offsetX = e.clientX - boundingRect.left;
      const offsetY = e.clientY - boundingRect.top;

      // The origin of translation is the center of the canvas
      const tx = offsetX - this.canvasSize / 2;
      const ty = offsetY - this.canvasSize / 2;
      console.debug("Zoom info", scrollFraction.toFixed(2), scaleFactor.toFixed(2), this.magnificationFactor.toFixed(2));
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
}
</script>

<style scoped>
</style>