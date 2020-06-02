<template>
  <split-pane split="vertical" :min-percent="15" :max-percent="35"
    :default-percent="toolboxMinified ? 5 : 20" @resize="dividerMoved">
    <template slot="paneL">
      <div>
        <v-btn icon @click="toolboxMinified = !toolboxMinified">
          <v-icon v-if="toolboxMinified">mdi-arrow-right</v-icon>
          <v-icon v-else>mdi-arrow-left</v-icon>
        </v-btn>
      </div>

      <toolbox :minified="toolboxMinified"></toolbox>
    </template>
    <template slot="paneR">
      <v-container fluid ref="rightPanel">
        <v-row>
          <v-col cols="12">Buttons</v-col>
          <v-col cols="12">
            <v-row justify="center" class="pb-1">
              <v-responsive :aspect-ratio="1" :max-height="maxCanvasSize"
                :max-width="maxCanvasSize" ref="responsiveBox"
                id="responsiveBox" class="yellow">
                <div :style="{ height: '100%' }" ref="canvasContent"
                  id="canvasContent"></div>
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
import { Vue } from "vue-property-decorator";
import SplitPane from "vue-splitpane";
import Component from "vue-class-component";
import Toolbox from "@/components/ToolBox.vue";
import SETTINGS from "@/global-settings";

@Component({ components: { SplitPane, Toolbox } })
export default class Easel extends Vue {
  RIGHT_PANE_PERCENTAGE = 80;
  private availHeight = 0;
  private maxCanvasSize = 0;
  private naturalCanvasSize = 0;
  private currentCanvasSize = 0;
  private leftPanePercentage = 30;
  private toolboxMinified = false;
  private twoInstance: Two | null = null;
  private sphereCanvas: Two.Group | null = null;

  mounted(): void {
    window.addEventListener("resize", this.onWindowResized);
    this.adjustSize();
    this.twoInstance = new Two({
      width: this.maxCanvasSize,
      height: this.maxCanvasSize,
      autostart: true,
      ratio: window.devicePixelRatio
    });
    this.naturalCanvasSize = this.maxCanvasSize;
    this.currentCanvasSize = this.maxCanvasSize;
    this.sphereCanvas = this.twoInstance.makeGroup();
    this.sphereCanvas.translation.set(
      this.twoInstance.width / 2,
      this.twoInstance.height / 2
    );

    // Flip Y-coordinate so positive Y-axis is up (north)
    (this.sphereCanvas as any).scale = new Two.Vector(1, -1);
    const circleRadius = Math.min(
      (this.maxCanvasSize / 2), // 80% of the viewport
      (this.maxCanvasSize / 2) // 80% of the viewport
      // SETTINGS.sphere.radius
    );

    this.$store.commit("setSphereRadius", circleRadius);
    const mainCircle = new Two.Circle(0, 0, circleRadius);
    mainCircle.noFill();
    mainCircle.linewidth = SETTINGS.line.thickness;
    this.sphereCanvas.add(mainCircle);

    const el = this.$refs.canvasContent as HTMLElement;
    this.twoInstance.appendTo(el);
    this.twoInstance.play();
  }

  updated(): void {
    console.debug("Updated");
    this.adjustSize();
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

  dividerMoved(leftPercentage: number): void {
    // this.adjustSize();
    const rightPanelWidth = (1 - leftPercentage / 100) * window.innerWidth;
    const canvasContent = this.$refs.canvasContent as HTMLElement;
    const box = canvasContent.getBoundingClientRect();
    console.debug("Canvas size", box.height, box.width, rightPanelWidth);
    this.maxCanvasSize = Math.min(box.height, rightPanelWidth);
    const scaleFactor = this.maxCanvasSize / this.naturalCanvasSize;
    (this.twoInstance!.renderer as any).setSize(
      this.maxCanvasSize,
      this.maxCanvasSize
    );
    this.twoInstance!.scene.scale = scaleFactor;
    this.sphereCanvas!.scale = scaleFactor;
  }

  onWindowResized(): void {
    this.adjustSize();
    const scaleFactor = this.maxCanvasSize / this.naturalCanvasSize;
    (this.twoInstance!.renderer as any).setSize(
      this.maxCanvasSize,
      this.maxCanvasSize
    );
    this.twoInstance!.scene.scale = scaleFactor;
    this.sphereCanvas!.scale = scaleFactor;
  }
}
</script>

<style scoped>
#canvasContent {
  border: 2px dashed darkcyan;
}
</style>
