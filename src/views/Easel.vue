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
          <v-col cols="12"> Canvas:
            {{currentCanvasSize}}

          </v-col>
          <v-col cols="12">
            <v-row justify="center" class="pb-1">
              <v-responsive :aspect-ratio="1"
                :max-height="currentCanvasSize"
                :max-width="currentCanvasSize" ref="responsiveBox"
                id="responsiveBox" class="pa-0 yellow">
                <sphere-frame :canvas-size="currentCanvasSize">
                </sphere-frame>
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
import { Vue, Watch } from "vue-property-decorator";
import SplitPane from "vue-splitpane";
import Component from "vue-class-component";
import Toolbox from "@/components/ToolBox.vue";
import SphereFrame from "@/components/SphereFrame.vue"
import { State } from 'vuex-class';
import { ToolStrategy } from '../events/ToolStrategy';
import NormalPointHandler from '../events/NormalPointHandler';

@Component({ components: { SplitPane, Toolbox, SphereFrame } })
export default class Easel extends Vue {
  readonly RIGHT_PANE_PERCENTAGE = 80;
  private availHeight = 0; // Both split panes are sandwiched between the app bar and footer. This variable hold the number of pixels available for canvas height
  private currentCanvasSize = 0; // Result of height calculation will be passed to <v-responsive> via this variable

  private leftPanePercentage = 30;
  private toolboxMinified = false;

  private currentTool: ToolStrategy | null = null;
  private pointTool!: NormalPointHandler;

  @State
  readonly editMode!: string;

  $refs!: {
    responsiveBox: VueComponent,
    canvasContent: HTMLDivElement
  }

  private adjustSize(): void {
    console.info("AdjustSize()")
    this.availHeight =
      window.innerHeight -
      this.$vuetify.application.footer -
      this.$vuetify.application.top;
    const tmp = this.$refs.responsiveBox;
    if (tmp) {
      let canvasPanel = tmp.$el as HTMLElement;
      const rightBox = canvasPanel.getBoundingClientRect();
      this.currentCanvasSize = this.availHeight - rightBox.top;
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

    console.info("Mounted");
    this.adjustSize();

    const el = this.$refs.canvasContent as HTMLElement;
    // this.pointTool = new NormalPointHandler(this.sphereCanvas, this.CSSTransformMat);

    el.addEventListener("mousemove", this.handleMouseMoved);
  }

  /** Spoit Pane resize handler
   * @param leftPercentage the percentage of the left pane width relative to the entire pane
   */
  dividerMoved(leftPercentage: number): void {

    this.adjustSize();
    // Calculate the width of the right panel
    const rightPanelWidth = (1 - leftPercentage / 100) * window.innerWidth;
    const box = this.$refs.canvasContent.getBoundingClientRect();
    console.debug("Pane resized: ", box.height, box.width, rightPanelWidth);
    // The canvas can't be bigger than its container height or the width
    // of the right panel
    if (box.height > rightPanelWidth) {
      this.currentCanvasSize = rightPanelWidth;
    }
  }

  onWindowResized(): void {
    console.info("Resized");
    this.adjustSize();
  }

  handleMouseMoved(e: MouseEvent): void {
    this.currentTool?.mouseMoved(e);
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

<style scoped lang="scss">
#canvasContent {
  height: 100%;
  border: 2px dashed darkcyan;
  margin: 0;
  padding: 0;
  /* WARNING: when the CSS transform matrix implies scaling factor > 1, the content may spill outside the bounding box of #canvasContent,
    overflow contents must be CLIPPED (hidden)
  */
  overflow: hidden;
}

svg {
  pointer-events: none;
}
</style>
