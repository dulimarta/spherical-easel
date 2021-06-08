<template>
  <Splitpanes class="default-theme"
    @resize="dividerMoved"
    :push-other-panes="false">
    <!-- Use the left page for the toolbox -->
    <Pane min-size="5"
      max-size="35"
      :size="toolboxMinified ? 5 : 25">
      <v-container fill-height>
        <div id="container">
          <v-btn icon
            @click="minifyToolbox">
            <v-icon v-if="toolboxMinified">mdi-arrow-right</v-icon>
            <v-icon v-else>mdi-arrow-left</v-icon>
          </v-btn>
          <Toolbox id="toolbox"
            ref="toolbox"
            :minified="toolboxMinified" />

        </div>
      </v-container>
    </Pane>
    <Pane :size="centerWidth">

      <!-- Use the right pane mainly for the canvas and style panel -->
      <!-- 
        When minified, the style panel takes only 5% of the remaining width
        When expanded, it takes 30% of the remaining width
      -->
      <v-container fluid
        ref="mainPanel">
        <v-row>
          <v-col cols="12">
            <v-row justify="center"
              class="pb-1">
              <v-responsive :aspect-ratio="1"
                :max-height="currentCanvasSize"
                :max-width="currentCanvasSize"
                ref="responsiveBox"
                id="responsiveBox"
                class="pa-0">
                <SphereFrame :canvas-size="currentCanvasSize" />
                <div class="anchored top left">
                  <!-- <v-btn-toggle
                    v-model="actionMode"
                    @change="switchActionMode"
                    class="mr-2 d-flex flex-wrap accent"
                  >
                    <ToolButton :key="80" :button="buttonList[8]"></ToolButton>
                      </v-btn-toggle>-->
                  <v-tooltip bottom
                    :open-delay="toolTipOpenDelay"
                    :close-delay="toolTipCloseDelay">
                    <!-- TODO:   
                        When not available they should be greyed out (i.e. disabled).-->
                    <template v-slot:activator="{ on }">
                      <v-btn
                        :disabled="!stylePanelMinified || !undoEnabled"
                        icon
                        @click="undoEdit"
                        v-on="on">
                        <v-icon color="blue"
                          :disabled="!stylePanelMinified || !undoEnabled">
                          mdi-undo</v-icon>
                      </v-btn>
                    </template>
                    <span>{{ $t("main.UndoLastAction") }}</span>
                  </v-tooltip>
                  <v-tooltip bottom
                    :open-delay="toolTipOpenDelay"
                    :close-delay="toolTipCloseDelay">
                    <template v-slot:activator="{ on }">
                      <v-btn
                        :disabled="!stylePanelMinified || !redoEnabled"
                        icon
                        @click="redoAction"
                        v-on="on">
                        <v-icon color="blue"
                          :disabled="!stylePanelMinified || !redoEnabled">
                          mdi-redo</v-icon>
                      </v-btn>
                    </template>
                    <span>{{ $t("main.RedoLastAction") }}</span>
                  </v-tooltip>
                </div>
                <div class="anchored top right">
                  <v-tooltip bottom
                    :open-delay="toolTipOpenDelay"
                    :close-delay="toolTipCloseDelay">
                    <template v-slot:activator="{ on }">
                      <v-btn icon
                        tile
                        @click="resetSphere"
                        v-on="on">
                        <v-icon>mdi-broom</v-icon>
                      </v-btn>
                    </template>
                    <span>Reset sphere</span>
                  </v-tooltip>
                </div>
                <div class="anchored bottom right">
                  <v-tooltip bottom
                    :open-delay="toolTipOpenDelay"
                    :close-delay="toolTipCloseDelay">
                    <template v-slot:activator="{ on }">
                      <v-btn color="primary"
                        icon
                        tile
                        @click="enableZoomIn"
                        v-on="on">
                        <v-icon>mdi-magnify-plus-outline</v-icon>
                      </v-btn>
                    </template>
                    <span>{{ $t("buttons.PanZoomInToolTipMessage") }}</span>
                  </v-tooltip>
                  <v-tooltip bottom
                    :open-delay="toolTipOpenDelay"
                    :close-delay="toolTipCloseDelay">
                    <template v-slot:activator="{ on }">
                      <v-btn color="primary"
                        icon
                        tile
                        @click="enableZoomOut"
                        v-on="on">
                        <v-icon>mdi-magnify-minus-outline</v-icon>
                      </v-btn>
                    </template>
                    <span>{{ $t("buttons.PanZoomOutToolTipMessage") }}</span>
                  </v-tooltip>
                  <v-tooltip bottom
                    :open-delay="toolTipOpenDelay"
                    :close-delay="toolTipCloseDelay">
                    <template v-slot:activator="{ on }">
                      <v-btn color="primary"
                        icon
                        tile
                        @click="enableZoomFit"
                        v-on="on">
                        <v-icon>mdi-magnify-scan
                        </v-icon>
                      </v-btn>
                    </template>
                    <span>{{ $t("buttons.ZoomFitToolTipMessage") }}</span>
                  </v-tooltip>
                </div>
              </v-responsive>
            </v-row>
          </v-col>
        </v-row>
        <v-snackbar v-model="displayZoomInToolUseMessage"
          bottom
          left
          :timeout="toolUseMessageDelay"
          :value="displayToolUseMessage"
          multi-line>
          <span>
            <strong class="warning--text"
              v-html="$t('buttons.PanZoomInDisplayedName').split('<br>').join('/').trim() + ': '"></strong>
            {{ $t("buttons.PanZoomInToolUseMessage") }}
          </span>
          <v-btn @click="displayToolUseMessage = false"
            icon>
            <v-icon color="success">mdi-close</v-icon>
          </v-btn>
        </v-snackbar>

        <v-snackbar v-model="displayZoomFitToolUseMessage"
          bottom
          left
          :timeout="toolUseMessageDelay"
          :value="displayToolUseMessage"
          multi-line>
          <span>
            <strong class="warning--text"
              v-html="$t('buttons.ZoomFitDisplayedName').split('<br>').join('').slice(0,-6) + ': '"></strong>
            {{ $t("buttons.ZoomFitToolUseMessage") }}
          </span>
          <v-btn @click="displayToolUseMessage = false"
            icon>
            <v-icon color="success">mdi-close</v-icon>
          </v-btn>
        </v-snackbar>

        <v-snackbar v-model="displayZoomOutToolUseMessage"
          bottom
          left
          :timeout="toolUseMessageDelay"
          :value="displayToolUseMessage"
          multi-line>
          <span>
            <strong class="warning--text"
              v-html="$t('buttons.PanZoomOutDisplayedName').split('<br>').join('/').trim() + ': '"></strong>
            {{ $t("buttons.PanZoomOutToolUseMessage") }}
          </span>
          <v-btn @click="displayToolUseMessage = false"
            icon>
            <v-icon color="success">mdi-close</v-icon>
          </v-btn>
        </v-snackbar>
      </v-container>
    </Pane>

    <Pane min-size="5"
      max-size="25"
      :size="stylePanelMinified ? 5 : 25">
      <div ref="stylePanel"
        id="styleContainer">
        <div>
          <v-btn icon
            @click="minifyStylePanel">
            <v-icon v-if="stylePanelMinified">mdi-arrow-left</v-icon>
            <v-icon v-else>mdi-arrow-right</v-icon>
          </v-btn>
        </div>
        <StylePanel :minified="stylePanelMinified"
          v-on:toggle-style-panel="minifyStylePanel" />
      </div>
    </Pane>

  </Splitpanes>
</template>

<script lang="ts">
import VueComponent from "vue";
import { Vue, Component, Prop } from "vue-property-decorator";
import { Splitpanes, Pane } from "splitpanes";
import "splitpanes/dist/splitpanes.css";
import Toolbox from "@/components/ToolBox.vue";
import SphereFrame from "@/components/SphereFrame.vue";
/* Import Command so we can use the command paradigm */
import { Command } from "@/commands/Command";
import SETTINGS from "@/global-settings";
import EventBus from "../eventHandlers/EventBus";

import buttonList from "@/components/ToolGroups.vue";
import ToolButton from "@/components/ToolButton.vue";
import StylePanel from "@/components/Style.vue";
import Circle from "@/plottables/Circle";
import Point from "@/plottables/Point";
import Line from "@/plottables/Line";
import Label from "@/plottables/Label";
import Segment from "@/plottables/Segment";
import Nodule from "@/plottables/Nodule";
import { State } from "vuex-class";
import { SENodule } from "@/models/SENodule";
import { AppState } from "@/types";
import IconBase from "@/components/IconBase.vue";
import AngleMarker from "@/plottables/AngleMarker";
import { FirebaseFirestore, DocumentSnapshot } from "@firebase/firestore-types";
import { run } from "@/commands/CommandInterpreter";
import { ConstructionScript } from "@/types";
/**
 * Split panel width distribution (percentages):
 * When both side panels open: 20:60:20 (proportions 1:3:1)
 * When left panel open, right panel minified: 20:75:5 (4:15:1)
 * When left panel minifie, right panel open: 5:75:20 (1:15:4)
 */
@Component({
  components: {
    Splitpanes,
    Pane,
    Toolbox,
    SphereFrame,
    ToolButton,
    StylePanel,
    IconBase
  }
})
export default class Easel extends Vue {
  @Prop()
  documentId: string | undefined;
  @State((s: AppState) => s.sePoints)
  readonly points!: SENodule[];

  @State((s: AppState) => s.seLines)
  readonly lines!: SENodule[];

  @State((s: AppState) => s.seSegments)
  readonly segments!: SENodule[];

  @State((s: AppState) => s.seCircles)
  readonly circles!: SENodule[];

  readonly $appDB!: FirebaseFirestore;

  readonly store = this.$store.direct;
  // readonly UIModule = getModule(UI, this.$store);
  private availHeight = 0; // Both split panes are sandwiched between the app bar and footer. This variable hold the number of pixels available for canvas height
  private currentCanvasSize = 0; // Result of height calculation will be passed to <v-responsive> via this variable

  private buttonList = buttonList;
  private toolboxMinified = false;
  private stylePanelMinified = true;
  /* Use the global settings to set the variables bound to the toolTipOpen/CloseDelay & toolUse */
  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;
  private displayToolTips = SETTINGS.toolTip.disableDisplay;
  private toolUseMessageDelay = SETTINGS.toolUse.delay;
  private displayToolUseMessage = SETTINGS.toolUse.display;

  private undoEnabled = false;
  private redoEnabled = false;
  private displayZoomInToolUseMessage = false;
  private displayZoomOutToolUseMessage = false;
  private displayZoomFitToolUseMessage = false;
  private actionMode = { id: "", name: "" };

  $refs!: {
    responsiveBox: VueComponent;
    toolbox: VueComponent;
    mainPanel: VueComponent;
    stylePanel: HTMLDivElement;
  };

  //#region magnificationUpdate
  constructor() {
    super();
    EventBus.listen("magnification-updated", this.resizePlottables);
    EventBus.listen("undo-enabled", this.setUndoEnabled);
    EventBus.listen("redo-enabled", this.setRedoEnabled);
  }
  //#endregion magnificationUpdate

  get centerWidth(): number {
    return (
      100 - (this.toolboxMinified ? 5 : 25) - (this.stylePanelMinified ? 5 : 25)
    );
  }

  private setUndoEnabled(e: unknown): void {
    this.undoEnabled = (e as any).value;
  }
  private setRedoEnabled(e: unknown): void {
    this.redoEnabled = (e as any).value;
  }

  private enableZoomIn(): void {
    this.displayZoomInToolUseMessage = true;
    this.store.commit.setActionMode({
      id: "zoomIn",
      name: "PanZoomInDisplayedName"
    });
  }
  private enableZoomOut(): void {
    this.displayZoomOutToolUseMessage = true;
    this.store.commit.setActionMode({
      id: "zoomOut",
      name: "PanZoomOutDisplayedName"
    });
  }
  private enableZoomFit(): void {
    this.displayZoomFitToolUseMessage = true;
    this.store.commit.setActionMode({
      id: "zoomFit",
      name: "ZoomFitDisplayedName"
    });
  }
  private adjustSize(): void {
    this.availHeight =
      window.innerHeight -
      this.$vuetify.application.footer -
      this.$vuetify.application.top -
      24; // quick hack (-24) to leave room at the bottom
    const tmp = this.$refs.responsiveBox;
    if (tmp) {
      let canvasPanel = tmp.$el as HTMLElement;
      const rightBox = canvasPanel.getBoundingClientRect();
      this.currentCanvasSize = this.availHeight - rightBox.top;
    }
  }

  loadDocument(docId: string): void {
    this.$store.direct.commit.removeAllFromLayers();
    this.$store.direct.commit.init();
    SENodule.resetAllCounters();
    Nodule.resetAllCounters();
    this.$appDB
      .collection("constructions") // load the script from public collection
      .doc(docId)
      .get()
      .then((doc: DocumentSnapshot) => {
        if (doc.exists) {
          const { script } = doc.data() as any;
          run(JSON.parse(script) as ConstructionScript);
        } else {
          // TODO: add a new I18N entry for the following error message
          EventBus.fire("show-alert", {
            key: `Construction ${docId} not found`,
            keyOptions: { docId },
            type: "error"
          });
        }
      });
  }
  /** mounted() is part of VueJS lifecycle hooks */
  mounted(): void {
    window.addEventListener("resize", this.onWindowResized);
    this.adjustSize(); // Why do we need this?  this.onWindowResized just calls this.adjustSize() but if you remove it the app doesn't work -- strange!
    if (this.documentId) this.loadDocument(this.documentId);
    EventBus.listen(
      "set-action-mode-to-select-tool",
      this.setActionModeToSelectTool
    );
  }

  /**
   * Split pane resize handler
   * @param event an array of numeric triplets {min: ____, max: ____, size: ____}
   */
  dividerMoved(event: any): void {
    const availableWidth =
      ((100 - event[0].size - event[2].size) / 100) *
      (window.innerWidth -
        this.$vuetify.application.left -
        this.$vuetify.application.right);
    this.availHeight =
      window.innerHeight -
      this.$vuetify.application.top -
      this.$vuetify.application.footer;
    this.currentCanvasSize = Math.min(availableWidth, this.availHeight);
  }

  minifyToolbox(): void {
    this.toolboxMinified = !this.toolboxMinified;
    // Minify the other panel when this one is expanded
    // if (!this.toolboxMinified && !this.stylePanelMinified) {
    //   this.stylePanelMinified = true;
    // }
  }

  minifyStylePanel(): void {
    this.stylePanelMinified = !this.stylePanelMinified;
    // Minify the other panel when this one is expanded
    // if (!this.toolboxMinified && !this.stylePanelMinified) {
    //   this.toolboxMinified = true;
    // }
    // Set the selection tool to be active when opening the style panel.
    if (!this.stylePanelMinified) {
      this.setActionModeToSelectTool();
    }
  }

  setActionModeToSelectTool() {
    this.store.commit.setActionMode({
      id: "select",
      name: "SelectDisplayedName"
    });
  }

  switchActionMode(): void {
    this.store.commit.setActionMode(this.actionMode);
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

  resetSphere(): void {
    this.$store.direct.commit.removeAllFromLayers();
    this.$store.direct.commit.init();
    Command.commandHistory.splice(0);
    Command.redoHistory.splice(0);
    SENodule.resetAllCounters();
    Nodule.resetAllCounters();
  }

  //#region resizePlottables
  resizePlottables(e: any): void {
    const oldFactor = this.store.state.previousZoomMagnificationFactor;
    // Update the current stroke widths in each plottable class
    Line.updateCurrentStrokeWidthForZoom(oldFactor / e.factor);
    Segment.updateCurrentStrokeWidthForZoom(oldFactor / e.factor);
    Circle.updateCurrentStrokeWidthForZoom(oldFactor / e.factor);
    AngleMarker.updateCurrentStrokeWidthForZoom(oldFactor / e.factor);
    Point.updatePointScaleFactorForZoom(oldFactor / e.factor);
    Label.updateTextScaleFactorForZoom(oldFactor / e.factor);

    // Update the size of each nodule in the store
    this.$store.state.seNodules.forEach((p: SENodule) => {
      p.ref?.adjustSize();
    });
    // The temporary plottables need to be resized too
    this.$store.state.temporaryNodules.forEach((p: Nodule) => {
      p.adjustSize();
    });
  }
  //#endregion resizePlottables
}
</script>
<style scoped lang="scss">
#container {
  display: flex;
  flex-direction: column;
  justify-content: flex-start; /* Pull contents vertically to the top */
  align-items: flex-end; /* Align contents horizontally to the right */
  height: 100%;
  color: #000;
  font-family: "Gill Sans", "Gill Sans MT", "Calibri", "Trebuchet MS",
    sans-serif;
}

#toolbox {
  width: 100%;
}

#responsiveBox {
  border: 2px double darkcyan;
  position: relative;
  & .anchored {
    position: absolute;
  }
}

#styleContainer {
  // border: 2px solid red;
  height: calc(100vh - 136px);
  padding-bottom: 0;
  color: #000;
  font-family: "Gill Sans", "Gill Sans MT", "Calibri", "Trebuchet MS",
    sans-serif;
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
