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
                <div class="anchored top left">
                  <!-- <v-btn-toggle
                    v-model="editMode"
                    @change="switchEditMode"
                    class="mr-2 d-flex flex-wrap accent"
                  >
                    <ToolButton :key="80" :button="buttonList[8]"></ToolButton>
                  </v-btn-toggle>-->
                  <v-tooltip
                    bottom
                    :open-delay="toolTipOpenDelay"
                    :close-delay="toolTipCloseDelay"
                  >
                    <!-- TODO:   
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
                </div>
                <div class="anchored bottom right">
                  <v-tooltip
                    bottom
                    :open-delay="toolTipOpenDelay"
                    :close-delay="toolTipCloseDelay"
                  >
                    <template v-slot:activator="{ on }">
                      <v-btn
                        color="primary"
                        icon
                        tile
                        @click="
                          enableZoomIn();
                          displayZoomInToolUseMessage = true;
                        "
                        v-on="on"
                      >
                        <v-icon>mdi-magnify-plus-outline</v-icon>
                      </v-btn>
                    </template>
                    <span>{{ $t("buttons.PanZoomInToolTipMessage") }}</span>
                  </v-tooltip>
                  <v-tooltip
                    bottom
                    :open-delay="toolTipOpenDelay"
                    :close-delay="toolTipCloseDelay"
                  >
                    <template v-slot:activator="{ on }">
                      <v-btn
                        color="primary"
                        icon
                        tile
                        @click="
                          enableZoomOut();
                          displayZoomOutToolUseMessage = true;
                        "
                        v-on="on"
                      >
                        <v-icon>mdi-magnify-minus-outline</v-icon>
                      </v-btn>
                    </template>
                    <span>{{ $t("buttons.PanZoomOutToolTipMessage") }}</span>
                  </v-tooltip>
                </div>
              </v-responsive>
            </v-row>
          </v-col>
        </v-row>
        <v-snackbar
          v-model="displayZoomInToolUseMessage"
          bottom
          left
          :timeout="toolUseMessageDelay"
          :value="displayToolUseMessage"
          multi-line
        >
          <span>
            <strong class="warning--text">
              {{ $t("buttons.PanZoomInDisplayedName") + ": " }}
            </strong>
            {{ $t("buttons.PanZoomInToolUseMessage") }}
          </span>
          <v-btn @click="displayToolUseMessage = false" icon>
            <v-icon color="success">mdi-close</v-icon>
          </v-btn>
        </v-snackbar>
        <v-snackbar
          v-model="displayZoomOutToolUseMessage"
          bottom
          left
          :timeout="toolUseMessageDelay"
          :value="displayToolUseMessage"
          multi-line
        >
          <span>
            <strong class="warning--text">
              {{ $t("buttons.PanZoomOutDisplayedName") + ": " }}
            </strong>
            {{ $t("buttons.PanZoomOutToolUseMessage") }}
          </span>
          <v-btn @click="displayToolUseMessage = false" icon>
            <v-icon color="success">mdi-close</v-icon>
          </v-btn>
        </v-snackbar>
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
import buttonList from "@/components/ToolGroups.vue";
import ToolButton from "@/components/ToolButton.vue";

@Component({ components: { SplitPane, Toolbox, SphereFrame, ToolButton } })
export default class Easel extends Vue {
  readonly RIGHT_PANE_PERCENTAGE = 80;
  private availHeight = 0; // Both split panes are sandwiched between the app bar and footer. This variable hold the number of pixels available for canvas height
  private currentCanvasSize = 0; // Result of height calculation will be passed to <v-responsive> via this variable

  private buttonList = buttonList;
  private leftPanePercentage = 30;
  private toolboxMinified = false;
  /* Use the global settings to set the variables bound to the toolTipOpen/CloseDelay & toolUse */
  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;
  private displayToolTips = SETTINGS.toolTip.disableDisplay;
  private toolUseMessageDelay = SETTINGS.toolUse.delay;
  private displayToolUseMessage = SETTINGS.toolUse.display;

  private displayZoomInToolUseMessage = false;
  private displayZoomOutToolUseMessage = false;

  private editMode = "segment";

  $refs!: {
    responsiveBox: VueComponent;
  };

  constructor() {
    super();
    EventBus.listen("magnification-updated", this.resizePlottables);
  }

  private enableZoomIn(): void {
    console.log("enableZoomIn");
    this.$store.commit("setEditMode", "zoomIn");
  }
  private enableZoomOut(): void {
    this.$store.commit("setEditMode", "zoomOut");
  }
  private adjustSize(): void {
    // console.info("AdjustSize()");
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

  switchEditMode(): void {
    this.$store.commit("setEditMode", this.editMode);
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
  position: relative;
  & .anchored {
    position: absolute;
  }
}

.left {
  left: 0;
}
.right {
  right: 0;
}
.top {
  top: 0;
}
.bottom {
  bottom: 0;
}
</style>
