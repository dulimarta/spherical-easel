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
                    v-if="accountEnabled"
                    :open-delay="toolTipOpenDelay"
                    :close-delay="toolTipCloseDelay">
                    <template v-slot:activator="{ on }">
                      <v-btn icon
                        tile
                        @click="requestShare()"
                        v-on="on">
                        <v-icon>mdi-share</v-icon>
                      </v-btn>
                    </template>
                    <span>Reset sphere</span>
                  </v-tooltip>
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
      <v-card>
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
      </v-card>
    </Pane>
    <Dialog ref="unsavedWorkDialog"
      max-width="40%"
      title="Confirmation Required"
      yes-text="Keep"
      no-text="Discard"
      :no-action="doLeave">
      {{$t(`constructions.unsavedConstructionMsg`)}}
      You have unsaved work. Do you want to stay on this page and keep your
      work or switch to another page and discard your work.
    </Dialog>
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
import Ellipse from "@/plottables/Ellipse";
import { namespace } from "vuex-class";
import { SENodule } from "@/models/SENodule";
import { ActionMode, AppState, ConstructionInFirestore } from "@/types";
import IconBase from "@/components/IconBase.vue";
import AngleMarker from "@/plottables/AngleMarker";
import { FirebaseFirestore, DocumentSnapshot } from "@firebase/firestore-types";
import { run } from "@/commands/CommandInterpreter";
import { ConstructionScript } from "@/types";
import { Route } from "vue-router";
import Dialog, { DialogAction } from "@/components/Dialog.vue";
import { SEStore } from "@/store";
import Parametric from "@/plottables/Parametric";
import { Matrix4 } from "three";
import { Unsubscribe } from "@firebase/util";
import { FirebaseAuth, User } from "@firebase/auth-types";
const SE = namespace("se");

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
    IconBase,
    Dialog
  }
})
export default class Easel extends Vue {
  @Prop()
  documentId: string | undefined;

  @SE.State((s: AppState) => s.seNodules)
  readonly seNodules!: SENodule[];

  @SE.State((s: AppState) => s.temporaryNodules)
  readonly temporaryNodules!: Nodule[];

  readonly $appDB!: FirebaseFirestore;
  readonly $appAuth!: FirebaseAuth;

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
  private actionMode: { id: ActionMode; name: string } = {
    id: "rotate",
    name: ""
  };
  private confirmedLeaving = false;
  private attemptedToRoute: Route | null = null;
  private accountEnabled = false;
  private uid = "";
  private authSubscription!: Unsubscribe;

  $refs!: {
    responsiveBox: VueComponent;
    toolbox: VueComponent;
    mainPanel: VueComponent;
    stylePanel: HTMLDivElement;
    unsavedWorkDialog: VueComponent & DialogAction;
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
  get hasObjects(): boolean {
    // Any objects must include at least one point
    return SEStore.sePoints.length > 0;
  }

  private setUndoEnabled(e: { value: boolean }): void {
    this.undoEnabled = e.value;
  }
  private setRedoEnabled(e: { value: boolean }): void {
    this.redoEnabled = e.value;
  }

  private enableZoomIn(): void {
    this.displayZoomInToolUseMessage = true;
    SEStore.setActionMode({
      id: "zoomIn",
      name: "PanZoomInDisplayedName"
    });
  }
  private enableZoomOut(): void {
    this.displayZoomOutToolUseMessage = true;
    SEStore.setActionMode({
      id: "zoomOut",
      name: "PanZoomOutDisplayedName"
    });
  }
  private enableZoomFit(): void {
    this.displayZoomFitToolUseMessage = true;
    SEStore.setActionMode({
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
    SEStore.removeAllFromLayers();
    SEStore.init();
    SENodule.resetAllCounters();
    // Nodule.resetIdPlottableDescriptionMap(); // Needed?
    this.$appDB
      .collection("constructions") // load the script from public collection
      .doc(docId)
      .get()
      .then((doc: DocumentSnapshot) => {
        if (doc.exists) {
          const { script } = doc.data() as ConstructionInFirestore;
          run(JSON.parse(script) as ConstructionScript);
        } else {
          EventBus.fire("show-alert", {
            key: "constructions.constructionNotFound",
            keyOptions: { docId: docId },
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
    EventBus.listen("secret-key-detected", () => {
      if (this.uid.length > 0) this.accountEnabled = true;
    });
    this.authSubscription = this.$appAuth.onAuthStateChanged(
      (u: User | null) => {
        if (u !== null) this.uid = u.uid;
      }
    );
  }
  beforeDestroy(): void {
    if (this.authSubscription) this.authSubscription();
    EventBus.unlisten("set-action-mode-to-select-tool");
    EventBus.unlisten("secret-key-detected");
  }

  /**
   * Split pane resize handler
   * @param event an array of numeric triplets {min: ____, max: ____, size: ____}
   */
  dividerMoved(event: Array<{ min: number; max: number; size: number }>): void {
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

  setActionModeToSelectTool(): void {
    SEStore.setActionMode({
      id: "select",
      name: "SelectDisplayedName"
    });
  }

  switchActionMode(): void {
    SEStore.setActionMode(this.actionMode);
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
    SEStore.removeAllFromLayers();
    SEStore.init();
    Command.commandHistory.splice(0);
    Command.redoHistory.splice(0);
    SENodule.resetAllCounters();
    // Nodule.resetIdPlottableDescriptionMap(); // Needed?
  }

  //#region resizePlottables
  resizePlottables(e: { factor: number }): void {
    // const oldFactor = this.previousZoomMagnificationFactor;
    // Update the current stroke widths/radius in each plottable class
    Line.updateCurrentStrokeWidthForZoom(e.factor);
    Segment.updateCurrentStrokeWidthForZoom(e.factor);
    Circle.updateCurrentStrokeWidthForZoom(e.factor);
    AngleMarker.updateCurrentStrokeWidthAndRadiusForZoom(e.factor);
    Point.updatePointScaleFactorForZoom(e.factor);
    Label.updateTextScaleFactorForZoom(e.factor);
    Ellipse.updateCurrentStrokeWidthForZoom(e.factor);
    Parametric.updateCurrentStrokeWidthForZoom(e.factor);

    // Apply the new size in each nodule in the store
    this.seNodules.forEach((p: SENodule) => {
      p.ref?.adjustSize();
    });
    // The temporary plottables need to be resized too
    this.temporaryNodules.forEach((p: Nodule) => {
      p.adjustSize();
    });
  }
  //#endregion resizePlottables

  requestShare(): void {
    // Alternate place to handle "Share Construction"
    // EventBus.fire("share-construction-requested", {});
  }

  doLeave(): void {
    this.confirmedLeaving = true;
    if (this.attemptedToRoute)
      this.$router.replace({ path: this.attemptedToRoute.path });
  }

  beforeRouteLeave(toRoute: Route, fromRoute: Route, next: any): void {
    if (this.hasObjects && !this.confirmedLeaving) {
      this.$refs.unsavedWorkDialog.show();
      this.attemptedToRoute = toRoute;
      next(false); // Stay on this view
    } else {
      /* Proceed to the next view when the canvas has no objects OR 
      user has confirmed leaving this view */
      next();
    }
  }
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
