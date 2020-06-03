<template>
  <split-pane split="vertical" :min-percent="15" :max-percent="35"
    :default-percent="toolboxMinified ? 5 : 20" @resize="dividerMoved">
    <!-- Use the left page for the toolbox -->
    <template slot="paneL">
      <div>
        <v-btn icon @click="toolboxMinified = !toolboxMinified">
          <v-icon v-if="toolboxMinified">mdi-arrow-right</v-icon>
          <v-icon v-else>mdi-arrow-left</v-icon>
        </v-btn>
      </div>

      <toolbox ref="toolbox" :minified="toolboxMinified"></toolbox>
    </template>

    <!-- Use the right pane mainly for the canvas -->
    <template slot="paneR">
      <v-container fluid ref="rightPanel">
        <v-row>
          <v-col cols="12"> Rad:
            {{currentSphereRadius}} Canvas:
            {{currentCanvasSize}}/{{naturalCanvasSize}}
          </v-col>
          <v-col cols="12">
            <v-row justify="center" class="pb-1">
              <v-responsive :aspect-ratio="1"
                :max-height="currentCanvasSize"
                :max-width="currentCanvasSize" ref="responsiveBox"
                id="responsiveBox" class="pa-0 yellow">
                <div ref="canvasContent" id="canvasContent"></div>
              </v-responsive>
            </v-row>
          </v-col>
        </v-row>
      </v-container>
    </template>
  </split-pane>
</template>

<script lang="ts">
import VueComponent from "vue";
import Two from "two.js";
import { Vue, Watch } from "vue-property-decorator";
import SplitPane from "vue-splitpane";
import Component from "vue-class-component";
import Toolbox from "@/components/ToolBox.vue";
import SETTINGS from "@/global-settings";
import { Matrix4, Vector3 } from 'three';
import { State } from 'vuex-class';
import { ToolStrategy } from '../events/ToolStrategy';
import NormalPointHandler from '../events/NormalPointHandler';
@Component({ components: { SplitPane, Toolbox } })
export default class Easel extends Vue {
  readonly RIGHT_PANE_PERCENTAGE = 80;
  private availHeight = 0; // Both split panes are sandwiched between the app bar and footer. This variable hold the number of pixels available for canvas height
  private currentCanvasSize = 0; // Result of height calculation will be passed to <v-responsive> via this variable
  private naturalCanvasSize = 0; // The canvas size at creation time

  private leftPanePercentage = 30;
  private toolboxMinified = false;

  private currentSphereRadius = 1; // The current sphere radius 

  private twoInstance: Two;
  private sphereCanvas!: Two.Group;
  private mainCircle!: Two.Circle;
  private transformMatrix = new Matrix4(); // Transformation between the ideal sphere and the rendered sphere/circle
  private cursorMatrix = new Matrix4();
  private zoomMatrix = new Matrix4(); // zoom in/out transformation
  private tmpMatrix = new Matrix4();
  private tmpVector = new Vector3();

  private currentTool: ToolStrategy | null = null;
  private pointTool!: NormalPointHandler;
  private magnificationFactor = 1;

  @State
  readonly editMode!: string;

  constructor() {
    super();
    this.twoInstance = new Two({
      width: SETTINGS.sphere.radius,
      height: SETTINGS.sphere.radius,
      autostart: true,
      ratio: window.devicePixelRatio
    });
    this.sphereCanvas = this.twoInstance.makeGroup();
    const hi = new Two.Text("Hello", SETTINGS.sphere.radius / 2, SETTINGS.sphere.radius / 2);
    this.$store.commit("setSphere", this.sphereCanvas);
    this.mainCircle = new Two.Circle(0, 0, SETTINGS.sphere.radius);
    this.mainCircle.noFill();
    this.mainCircle.linewidth = SETTINGS.line.thickness;
    this.sphereCanvas.add(this.mainCircle);
    const textGroup = this.twoInstance.makeGroup();
    textGroup.add(hi);
  }

  private set viewTransform(m: Matrix4) {
    const arr = m.elements;
    const el = ((this.twoInstance.renderer as any).domElement as HTMLElement);
    // CSS transformation matrix is only 2x3
    el.style.transform = `matrix(${arr[0]},${arr[1]},${arr[4]},${arr[5]},${arr[12]},${arr[13]})`;
    const orig = this.currentCanvasSize / 2;
    el.style.transformOrigin = `${orig}px ${orig}px`;
    el.style.overflow = "visible";
  }

  private get viewTransform() {
    return this.transformMatrix;
  }

  private adjustSize(): void {
    this.availHeight =
      window.innerHeight -
      this.$vuetify.application.footer -
      this.$vuetify.application.top;
    const tmp = this.$refs.responsiveBox;
    if (tmp) {
      let canvasPanel: HTMLElement;
      if (tmp instanceof VueComponent)
        canvasPanel = (tmp as VueComponent).$el as HTMLElement;
      else canvasPanel = tmp as HTMLElement;
      const rightBox = canvasPanel.getBoundingClientRect();
      this.currentCanvasSize = this.availHeight - rightBox.top;
      this.currentSphereRadius = this.currentCanvasSize / 2;
    }
    // console.debug(
    //   `Available height ${this.availHeight.toFixed(
    //     2
    //   )} Canvas ${this.currentCanvasSize.toFixed(2)}`
    // );
  }


  /** mounted() is part of VueJS lifecycle hooks */
  mounted(): void {
    window.addEventListener("resize", this.onWindowResized);
    this.adjustSize();
    this.naturalCanvasSize = this.currentCanvasSize;

    // Tell the renderer the new viewport
    (this.twoInstance.renderer as any).setSize(this.currentCanvasSize, this.currentCanvasSize);
    this.sphereCanvas.translation.set(
      this.twoInstance.width / 2,
      this.twoInstance.height / 2
    );
    const radius = Math.min(
      (this.currentCanvasSize / 2), // 80% of the viewport
      (this.currentCanvasSize / 2) // 80% of the viewport
    );
    this.currentSphereRadius = radius;
    this.$store.commit("setSphereRadius", radius);
    // Draw the boundary circle in the ideal radius
    // and scale it later to fit the canvas
    // const scaleFactor = radius / SETTINGS.sphere.radius;
    // Flip Y-coordinate so positive Y-axis is up (north)
    // this.viewTransform = ;
    // ((this.twoInstance.renderer as any).domElement as HTMLElement).style.transform = `matrix(${scaleFactor},0,0,${scaleFactor},0,0)`;
    // (this.sphereCanvas as any).scale = new Two.Vector(scaleFactor, -scaleFactor);

    const el = this.$refs.canvasContent as HTMLElement;
    this.twoInstance.appendTo(el);
    this.twoInstance.play();
    this.pointTool = new NormalPointHandler(this.sphereCanvas, this.cursorMatrix);

    el.addEventListener("mousemove", this.handleMouseMoved);
    el.addEventListener("wheel", this.zoomer, { passive: true })
  }

  /** updated() is part of VueJS lifecycle hooks */

  updated(): void {
    console.debug("Updated");
    // this.adjustSize();
    // const el = this.$refs.canvasContent as HTMLElement;
    // const elBox = el.getBoundingClientRect();
    this.cursorMatrix.identity();
    this.tmpMatrix.makeTranslation(-this.currentCanvasSize / 2, -this.currentCanvasSize / 2, 0);
    this.cursorMatrix.multiply(this.tmpMatrix);

    // /* Flip the Y-coordinate */
    // this.tmpMatrix.makeScale(2 / this.currentCanvasSize, -2 / this.currentCanvasSize, 1);
    // this.cursorMatrix.multiply(this.tmpMatrix);
    const ratio = this.currentSphereRadius / SETTINGS.sphere.radius;

    const ds = this.currentCanvasSize - this.naturalCanvasSize;
    this.transformMatrix.identity();
    this.tmpMatrix.makeTranslation(ds / 2, ds / 2, 0);
    this.transformMatrix.multiply(this.tmpMatrix);
    this.tmpMatrix.makeScale(ratio, ratio, ratio);
    this.transformMatrix.multiply(this.tmpMatrix);
    this.tmpMatrix.multiplyMatrices(this.transformMatrix, this.zoomMatrix);
    this.viewTransform = this.tmpMatrix;
  }

  /** Spoit Pane resize handler
   * @param leftPercentage the percentage of the left pane width relative to the entire pane
   */
  dividerMoved(leftPercentage: number): void {

    this.adjustSize();
    // Calculate the width of the right panel
    const rightPanelWidth = (1 - leftPercentage / 100) * window.innerWidth;
    const canvasContent = this.$refs.canvasContent as HTMLElement;
    const box = canvasContent.getBoundingClientRect();
    console.debug("Pane resized: ", box.height, box.width, rightPanelWidth);
    // The canvas can't be bigger than its container height or the width
    // of the right panel
    if (box.height > rightPanelWidth) {
      this.currentCanvasSize = rightPanelWidth;
      this.currentSphereRadius = this.currentCanvasSize / 2;
    }

    // Determine how much smaller/bigger the canvas compared to its "birth" size
    // const scaleFactor = this.currentCanvasSize / this.naturalCanvasSize;
    // Adjust the boundary circle accordingly
    (this.twoInstance.renderer as any).setSize(
      this.currentCanvasSize,
      this.currentCanvasSize
    );
    this.sphereCanvas.translation.set(
      this.currentCanvasSize / 2,
      this.currentCanvasSize / 2
    );
    // (this.sphereCanvas as any).scale = new Two.Vector(scaleFactor, -scaleFactor);
  }

  onWindowResized(): void {
    console.debug("Resized");
    this.adjustSize();
    this.currentSphereRadius = this.currentCanvasSize / 2;
    (this.twoInstance.renderer as any).setSize(
      this.currentCanvasSize,
      this.currentCanvasSize
    );
    // this.transformMatrix.makeTranslation(-this.currentCanvasSize / 2, -this.currentCanvasSize / 2, 0);
    // this.tmpMatrix.makeScale(scaleFactor, scaleFactor, scaleFactor);
    // this.transformMatrix.multiply(this.tmpMatrix);
    // this.viewTransform = this.transformMatrix;

  }

  handleMouseMoved(e: MouseEvent): void {
    // WHen currentTool is NULL, the following line does nothing
    this.currentTool?.mouseMoved(e);
    e.preventDefault();
  }

  zoomer(e: MouseWheelEvent): void {
    if (e.metaKey) {
      e.preventDefault();
      console.debug(e);
      const scrollFraction = e.deltaY / this.currentCanvasSize;

      const scaleFactor = 1 + scrollFraction;
      if (scaleFactor < 1 && this.magnificationFactor < 0.4) return;
      if (scaleFactor > 1 && this.magnificationFactor > 10) return;
      this.magnificationFactor *= scaleFactor;
      const tx = e.offsetX - this.currentCanvasSize / 2;
      const ty = e.offsetY - this.currentCanvasSize / 2;
      console.debug("Zoom info", scrollFraction.toFixed(2), scaleFactor.toFixed(2), this.magnificationFactor.toFixed(2));
      const mag = this.magnificationFactor;
      if (mag > 1) {
        // Scale up/down from the current mouse position
        this.zoomMatrix.identity();
        this.tmpMatrix.makeTranslation(tx, ty, 0);
        this.zoomMatrix.multiply(this.tmpMatrix);
        this.tmpMatrix.makeScale(mag, mag, mag);
        this.zoomMatrix.multiply(this.tmpMatrix);
        this.tmpMatrix.makeTranslation(-tx, -ty, 0);
        this.zoomMatrix.multiply(this.tmpMatrix);
      } else {
        this.zoomMatrix.makeScale(mag, mag, mag);
      }
      this.tmpMatrix.multiplyMatrices(this.transformMatrix, this.zoomMatrix);
      this.viewTransform = this.tmpMatrix;
    }
  }
  @Watch("editMode")
  switchEditMode(mode: string): void {
    this.currentTool = null;

    switch (mode) {
      case "point":
        this.currentTool = this.pointTool;
        break;
      default:
        this.currentTool = null;
    }
    this.currentTool?.activate();
  }
}
</script>

<style scoped>
#canvasContent {
  height: 100%;
  border: 2px dashed darkcyan;
  margin: 0;
  padding: 0;
  overflow: visible;
}
</style>
