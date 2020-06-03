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
            {{naturalCanvasSize}}/{{currentCanvasSize}}
          </v-col>
          <v-col cols="12">
            <v-row justify="center" class="pb-1">
              <v-responsive :aspect-ratio="1" :max-height="maxCanvasSize"
                :max-width="maxCanvasSize" ref="responsiveBox"
                id="responsiveBox" class="pa-0">
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
  private maxCanvasSize = 0; // Result of height calculation will be passed to <v-responsive> via this variable
  private naturalCanvasSize = 0; // The canvas size at creation time
  private currentCanvasSize = 0; // The current canvas size after the window or pane is resized
  private leftPanePercentage = 30;
  private toolboxMinified = false;

  private currentSphereRadius = 1; // The current sphere radius 

  private twoInstance: Two;
  private sphereCanvas!: Two.Group;
  private mainCircle!: Two.Circle;
  private transformMatrix = new Matrix4();
  private tmpMatrix = new Matrix4();
  private tmpVector = new Vector3();

  private currentTool: ToolStrategy | null = null;
  private pointTool!: NormalPointHandler;

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
    this.$store.commit("setSphere", this.sphereCanvas);
    this.mainCircle = new Two.Circle(0, 0, SETTINGS.sphere.radius);
    this.mainCircle.noFill();
    this.mainCircle.linewidth = SETTINGS.line.thickness;
    this.sphereCanvas.add(this.mainCircle);
  }

  mounted(): void {
    window.addEventListener("resize", this.onWindowResized);
    this.adjustSize();
    this.naturalCanvasSize = this.maxCanvasSize;
    this.currentCanvasSize = this.maxCanvasSize;

    // Tell the renderer the new viewport
    (this.twoInstance.renderer as any).setSize(this.maxCanvasSize, this.maxCanvasSize);
    this.sphereCanvas.translation.set(
      this.twoInstance.width / 2,
      this.twoInstance.height / 2
    );

    const radius = Math.min(
      (this.maxCanvasSize / 2), // 80% of the viewport
      (this.maxCanvasSize / 2) // 80% of the viewport
    );
    this.currentSphereRadius = radius;
    this.$store.commit("setSphereRadius", radius);
    // Draw the boundary circle in the ideal radius
    // and scale it later to fit the canvas
    const scaleFactor = radius / SETTINGS.sphere.radius;
    // Flip Y-coordinate so positive Y-axis is up (north)
    (this.sphereCanvas as any).scale = new Two.Vector(scaleFactor, -scaleFactor);

    const el = this.$refs.canvasContent as HTMLElement;
    this.twoInstance.appendTo(el);
    this.twoInstance.play();
    this.pointTool = new NormalPointHandler(this.sphereCanvas, this.transformMatrix);

    el.addEventListener("mousemove", this.handleMouseMoved);
  }

  updated(): void {
    // console.debug("Updated");
    this.adjustSize();
    const el = this.$refs.canvasContent as HTMLElement;
    const elBox = el.getBoundingClientRect();
    this.transformMatrix.makeTranslation(-elBox.width / 2, -elBox.height / 2, 0);
    /* Flip the Y-coordinate */
    this.tmpMatrix.makeScale(2 / this.maxCanvasSize, -2 / this.maxCanvasSize, 1);
    this.transformMatrix.premultiply(this.tmpMatrix);
  }

  private adjustSize(): void {
    this.availHeight =
      window.innerHeight -
      this.$vuetify.application.footer -
      this.$vuetify.application.top;
    const tmp = this.$refs.responsiveBox;
    let canvasPanel: HTMLElement;
    if (tmp instanceof VueComponent)
      canvasPanel = (tmp as VueComponent).$el as HTMLElement;
    else canvasPanel = tmp as HTMLElement;
    const rightBox = canvasPanel.getBoundingClientRect();
    this.maxCanvasSize = this.availHeight - rightBox.top;
    console.debug(
      `Available height ${this.availHeight.toFixed(
        2
      )} Canvas ${this.maxCanvasSize.toFixed(2)}`
    );
  }

  /** Spoit Pane resize handler
   * @param leftPercentage the percentage of the left pane width relative to the entire pane
   */
  dividerMoved(leftPercentage: number): void {
    // this.adjustSize();
    // Calculate the width of the right panel
    const rightPanelWidth = (1 - leftPercentage / 100) * window.innerWidth;
    const canvasContent = this.$refs.canvasContent as HTMLElement;
    const box = canvasContent.getBoundingClientRect();
    console.debug("Canvas size", box.height, box.width, rightPanelWidth);
    // The canvas can't be bigger than its container height or the width
    // of the right panel
    this.maxCanvasSize = Math.min(box.height, rightPanelWidth);

    // Determine how much smaller/bigger the canvas compared to its "birth" size
    const scaleFactor = this.maxCanvasSize / this.naturalCanvasSize;
    // Adjust the boundary circle accordingly
    this.currentSphereRadius = scaleFactor * SETTINGS.sphere.radius;
    (this.twoInstance.renderer as any).setSize(
      this.maxCanvasSize,
      this.maxCanvasSize
    );
    this.sphereCanvas.translation.set(
      this.maxCanvasSize / 2,
      this.maxCanvasSize / 2
    );
    (this.sphereCanvas as any).scale = new Two.Vector(scaleFactor, -scaleFactor);
  }

  onWindowResized(): void {
    this.adjustSize();
    const scaleFactor = this.maxCanvasSize / this.naturalCanvasSize;
    this.currentSphereRadius = scaleFactor * SETTINGS.sphere.radius;
    (this.twoInstance.renderer as any).setSize(
      this.maxCanvasSize,
      this.maxCanvasSize
    );
    this.twoInstance.scene.scale = scaleFactor;
  }

  handleMouseMoved(e: MouseEvent): void {
    // WHen currentTool is NULL, the following line does nothing
    this.currentTool?.mouseMoved(e);
    e.preventDefault();
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
}
</style>
