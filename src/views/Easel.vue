<template>
  <split-pane
    split="vertical"
    :min-percent="15"
    :max-percent="35"
    :default-percent="toolboxMinified ? 5 : 20"
    @resize="dividerMoved"
  >
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
          <v-col cols="12">
            <v-btn-toggle class="accent">
              <v-tooltip
                bottom
                :open-delay="toolTipOpenDelay"
                :close-delay="toolTipCloseDelay"
              >
                <!-- TODO: Move these edit controls to the the panel containing the sphere. 
                When not available they should be greyed out (i.e. disabled).-->
                <template v-slot:activator="{ on }">
                  <v-btn icon @click="undoEdit" v-on="on">
                    <v-icon>mdi-undo</v-icon>
                  </v-btn>
                </template>
                <span>{{ $t("main.UndoLastAction") }}</span>
              </v-tooltip>
              <v-tooltip
                bottom
                :open-delay="toolTipOpenDelay"
                :close-delay="toolTipCloseDelay"
              >
                <template v-slot:activator="{ on }">
                  <v-btn icon @click="redoAction" v-on="on">
                    <v-icon>mdi-redo</v-icon>
                  </v-btn>
                </template>
                <span>{{ $t("main.RedoLastAction") }}</span>
              </v-tooltip>
            </v-btn-toggle>
          </v-col>
          <v-col cols="12">
            <v-row justify="center" class="pb-1">
              <v-responsive
                :aspect-ratio="1"
                :max-height="currentCanvasSize"
                :max-width="currentCanvasSize"
                ref="responsiveBox"
                id="responsiveBox"
                class="pa-0"
              >
                <sphere-frame :canvas-size="currentCanvasSize"></sphere-frame>
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
import { Vue } from "vue-property-decorator";
import SplitPane from "vue-splitpane";
import Component from "vue-class-component";
import Toolbox from "@/components/ToolBox.vue";
import SphereFrame from "@/components/SphereFrame.vue";
/* Import Command so we can use the command paradigm */
import { Command } from "@/commands/Command";
import SETTINGS from "@/global-settings";
import EventBus from "../eventHandlers/EventBus";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";

@Component({ components: { SplitPane, Toolbox, SphereFrame } })
export default class Easel extends Vue {
  readonly RIGHT_PANE_PERCENTAGE = 80;
  private availHeight = 0; // Both split panes are sandwiched between the app bar and footer. This variable hold the number of pixels available for canvas height
  private currentCanvasSize = 0; // Result of height calculation will be passed to <v-responsive> via this variable

  private leftPanePercentage = 30;
  private toolboxMinified = false;
  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

  $refs!: {
    responsiveBox: VueComponent;
  };

  constructor() {
    super();
    EventBus.listen("magnification-updated", this.resizePlottables);
  }

  private adjustSize(): void {
    console.info("AdjustSize()");
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
    this.adjustSize();
  }

  /** Split Pane resize handler
   * @param leftPercentage the percentage of the left pane width relative to the entire pane
   */
  dividerMoved(leftPercentage: number): void {
    this.adjustSize();
    // Calculate the width of the right panel
    const rightPanelWidth = (1 - leftPercentage / 100) * window.innerWidth;
    const box = this.$refs.responsiveBox.$el.getBoundingClientRect();
    // The canvas can't be bigger than its container height or the width
    // of the right panel
    if (box.height > rightPanelWidth) {
      // FIXME: the screen flickers
      this.currentCanvasSize = rightPanelWidth;
    }
  }

  onWindowResized(): void {
    this.adjustSize();
  }
  /* Undoes the last user action that changed the state of the sphere. */
  undoEdit(): void {
    Command.undo();
  }
  /* Redoes the last user action that changed the state of the sphere. */
  redoAction(): void {
    Command.redo();
  }

  resizePlottables(e: any): void {
    this.$store.state.points.forEach((p: SEPoint) => {
      p.ref.adjustSizeForZoom(e.factor);
    });
    this.$store.state.lines.forEach((p: SELine) => {
      p.ref.adjustSizeForZoom(e.factor);
    });
  }
}
</script>

<style scoped lang="scss">
#responsiveBox {
  border: 2px double darkcyan;
}
</style>
