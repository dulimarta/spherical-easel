<template>
  <div>
    <Splitpanes class="default-theme"
      @resize="dividerMoved"
      :push-other-panes="false">
      <!-- Use the left page for the toolbox -->
      <Pane min-size="5"
        max-size="35"
        :size="toolboxMinified ? 5 : 25">
      <v-container style="background-color: white">
      <v-row>
          <v-btn icon
                @click="minifyToolbox">
                <v-icon v-if="toolboxMinified">mdi-arrow-right</v-icon>
                <v-icon v-else>mdi-arrow-left</v-icon>
              </v-btn>
        <CurrentToolSelection :actionMode="actionMode" :toolboxMinified="this.toolboxMinified"/>

    </v-row>
      </v-container>
            <Toolbox id="toolbox"
              ref="toolbox"
              :minified="toolboxMinified"
              v-on:toggle-tool-box-panel="minifyToolbox" />

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
                    <div v-for="shortcut, index in topLeftShortcuts"
                      :key="index"
                      :style="listItemStyle(index, 'left', 'top')">
                      <ShortcutIcon @click="shortcut.clickFunc"
                        :labelMsg="shortcut.labelMsg"
                        :icon="shortcut.icon"
                        :iconColor="shortcut.iconColor"
                        :btnColor="shortcut.btnColor"
                        :disableBtn="shortcut.disableBtn"
                        :button="shortcut.button" />
                    </div>
                    <!-- <v-btn-toggle
                    v-model="actionMode"
                    @change="switchActionMode"
                    class="mr-2 d-flex flex-wrap accent"
                  >
                    <ToolButton :key="80" :button="buttonList[8]"></ToolButton>
                      </v-btn-toggle>-->

                  </div>
                  <div class="anchored bottom left">
                    <div v-for="shortcut, index in bottomLeftShortcuts"
                      :key="index"
                      :style="listItemStyle(index, 'left', 'bottom')">
                      <ShortcutIcon @click="shortcut.clickFunc"
                        :labelMsg="shortcut.labelMsg"
                        :icon="shortcut.icon"
                        :iconColor="shortcut.iconColor"
                        :btnColor="shortcut.btnColor"
                        :disableBtn="shortcut.disableBtn"
                        :button="shortcut.button" />
                    </div>
                    <!-- <v-btn-toggle v-model="actionMode"
                      @change="switchActionMode"
                      class="mr-2 d-flex flex-wrap accent">
                      <ToolButton :key="80"
                        :button="buttonList[8]"></ToolButton>
                    </v-btn-toggle> -->

                  </div>
                  <div class="anchored top right">
                    <!--<v-tooltip bottom
                    v-if="accountEnabled"
                    :open-delay="toolTipOpenDelay"
                    :close-delay="toolTipCloseDelay">
                    <template v-slot:activator="{ on }">
                      <v-btn icon
                        tile
                        @click="requestShare()"
                        v-on="on">
                        <v-icon>$shareConstruction</v-icon>
                      </v-btn>
                    </template>
                    <span>Reset sphere</span>
                  </v-tooltip>-->

                    <div v-for="shortcut, index in topRightShortcuts"
                      :key="index"
                      :style="listItemStyle(index, 'right', 'top')">
                      <ShortcutIcon @click="shortcut.clickFunc"
                        :labelMsg="shortcut.labelMsg"
                        :icon="shortcut.icon"
                        :iconColor="shortcut.iconColor"
                        :btnColor="shortcut.btnColor"
                        :disableBtn="shortcut.disableBtn"
                        :button="shortcut.button" />
                    </div>

                    <!--<v-tooltip bottom
                      :open-delay="toolTipOpenDelay"
                      :close-delay="toolTipCloseDelay">
                      <template v-slot:activator="{ on }">
                        <v-btn icon
                          tile
                          @click="$refs.clearConstructionDialog.show()"
                          v-on="on">
                          <v-icon>$clearConstruction</v-icon>
                        </v-btn>
                      </template>
                      <span>{{$t('constructions.resetSphere')}}</span>
                    </v-tooltip>-->
                  </div>
                  <div class="anchored bottom right">
                    <div v-for="shortcut, index in bottomRightShortcuts"
                      :key="index"
                      :style="listItemStyle(index, 'right', 'bottom')">
                      <ShortcutIcon @click="shortcut.clickFunc"
                        :labelMsg="shortcut.labelMsg"
                        :icon="shortcut.icon"
                        :iconColor="shortcut.iconColor"
                        :btnColor="shortcut.btnColor"
                        :disableBtn="shortcut.disableBtn"
                        :button="shortcut.button" />
                    </div>
                    <!--<v-tooltip bottom
                      :open-delay="toolTipOpenDelay"
                      :close-delay="toolTipCloseDelay">
                      <template v-slot:activator="{ on }">
                        <v-btn color="primary"
                          icon
                          tile
                          @click="enableZoomIn"
                          v-on="on">
                          <v-icon>$zoomIn</v-icon>
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
                          <v-icon>$zoomOut</v-icon>
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
                          <v-icon>$zoomFit </v-icon>
                        </v-btn>
                      </template>
                      <span>{{ $t("buttons.ZoomFitToolTipMessage") }}</span>
                    </v-tooltip>-->

                  </div>
                </v-responsive>
              </v-row>
            </v-col>
          </v-row>
         <!-- <v-snackbar v-model="displayZoomInToolUseMessage"
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

          <v-snackbar v-model="displayCreateCircleToolUseMessage"
            bottom
            left
            :timeout="toolUseMessageDelay"
            :value="displayToolUseMessage"
            multi-line>
            <span>
              <strong class="warning--text"
                v-html="$t('buttons.CreateCircleDisplayedName').split('<br>').join('').trim() + ': '"></strong>
              {{ $t("buttons.CreateCircleToolUseMessage") }}
            </span>
            <v-btn @click="displayToolUseMessage = false"
              icon>
              <v-icon color="success">mdi-close</v-icon>
            </v-btn>
          </v-snackbar>

          <v-snackbar v-model="displayCreatePointToolUseMessage"
            bottom
            left
            :timeout="toolUseMessageDelay"
            :value="displayToolUseMessage"
            multi-line>
            <span>
              <strong class="warning--text"
                v-html="$t('buttons.CreatePointDisplayedName').split('<br>').join('').trim() + ': '"></strong>
              {{ $t("buttons.CreatePointToolUseMessage") }}
            </span>
            <v-btn @click="displayToolUseMessage = false"
              icon>
              <v-icon color="success">mdi-close</v-icon>
            </v-btn>
          </v-snackbar>

          <v-snackbar v-model="displayCreateLineSegmentToolUseMessage"
            bottom
            left
            :timeout="toolUseMessageDelay"
            :value="displayToolUseMessage"
            multi-line>
            <span>
              <strong class="warning--text"
                v-html="$t('buttons.CreateLineSegmentDisplayedName').split('<br>').join('').trim() + ': '"></strong>
              {{ $t("buttons.CreateLineSegmentToolUseMessage") }}
            </span>
            <v-btn @click="displayToolUseMessage = false"
              icon>
              <v-icon color="success">mdi-close</v-icon>
            </v-btn>
          </v-snackbar>

          <v-snackbar v-model="displayCreateLineToolUseMessage"
            bottom
            left
            :timeout="toolUseMessageDelay"
            :value="displayToolUseMessage"
            multi-line>
            <span>
              <strong class="warning--text"
                v-html="$t('buttons.CreateLineDisplayedName').split('<br>').join('').trim() + ': '"></strong>
              {{ $t("buttons.CreateLineToolUseMessage") }}
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
          </v-snackbar>-->
        </v-container>
      </Pane>

      <Pane min-size="5"
        :max-size="25"
        :size="getPanelSize()">
        <v-card class="pt-2">
          <div id="styleContainer"
            >
              <v-btn icon v-if="!stylePanelMinified || !notificationsPanelMinified"
                @click="() => {stylePanelMinified = true; notificationsPanelMinified = true;}">
                <v-icon>mdi-arrow-right</v-icon>
              </v-btn>


            <StylePanel :minified="stylePanelMinified"
              v-on:toggle-style-panel="minifyStylePanel" />

                     <MessageBox :minified="notificationsPanelMinified"
              v-on:toggle-notifications-panel="minifyNotificationsPanel" />

            </div>

        </v-card>


      </Pane>
    </Splitpanes>
    <Dialog ref="unsavedWorkDialog"
      max-width="40%"
      :title="$t('constructions.confirmation')"
      :yes-text="$t('constructions.keep')"
      :no-text="$t('constructions.discard')"
      :no-action="doLeave">
      {{$t(`constructions.unsavedConstructionMsg`)}}
    </Dialog>
    <Dialog ref="clearConstructionDialog"
      :title="$t('constructions.confirmReset')"
      :yes-text="$t('constructions.proceed')"
      :yes-action="() => resetSphere()"
      :no-text="$t('constructions.cancel')"
      max-width="40%">
      <p> {{$t(`constructions.clearConstructionMsg`)}}</p>
    </Dialog>
  </div>
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
import { SENodule } from "@/models/SENodule";
import { ActionMode, ConstructionInFirestore } from "@/types";
import IconBase from "@/components/IconBase.vue";
import AngleMarker from "@/plottables/AngleMarker";
import { FirebaseFirestore, DocumentSnapshot } from "@firebase/firestore-types";
import { run } from "@/commands/CommandInterpreter";
import { ConstructionScript } from "@/types";
import { Route } from "vue-router";
import Dialog, { DialogAction } from "@/components/Dialog.vue";
import { useSEStore } from "@/stores/se";
import Parametric from "@/plottables/Parametric";
import { Unsubscribe } from "@firebase/util";
import { FirebaseAuth, User } from "@firebase/auth-types";
import { FirebaseStorage } from "@firebase/storage-types";
import axios, { AxiosResponse } from "axios";
import { mapActions, mapState } from "pinia";
import ShortcutIcon from "@/components/ShortcutIcon.vue";
import CurrentToolSelection from "@/components/CurrentToolSelection.vue";
import MessageBox from "@/components/MessageBox.vue";
import {toolGroups} from "@/components/toolgroups";


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
    Dialog,
    ShortcutIcon,
    CurrentToolSelection,
    MessageBox
  },
  methods: {
    ...mapActions(useSEStore, [
      "setActionMode",
      "init",
      "removeAllFromLayers",
      "updateDisplay"
    ]),
    listItemStyle: function(i, xLoc, yLoc) { //xLoc determines left or right, yLoc determines top or bottom
      const style:any = {};

      if (i !== 0) {
        style.position = "absolute";
      }

      switch(i) {
        case 1:
          style[yLoc] = "0px";
          style[xLoc] = "36px";
          break;
        case 2:
          style[yLoc] = "36px";
          style[xLoc] = "0px";
          break;
        case 3:
          style[yLoc] = "0px";
          style[xLoc] = "72px";
          break;
        case 4:
          style[yLoc] = "36px";
          style[xLoc] = "36px";
          break;
        case 5:
          style[yLoc] = "72px";
          style[xLoc] = "0px";
          break;
      }
      return style;
    }
  },
  computed: {
    ...mapState(useSEStore, [
      "seNodules",
      "temporaryNodules",
      "hasObjects",
      "activeToolName",
    ])
  }
})
export default class Easel extends Vue {
  @Prop()
  documentId: string | undefined;

  readonly seNodules!: SENodule[];
  readonly temporaryNodules!: Nodule[];
  readonly hasObjects!: boolean;

  readonly setActionMode!: (arg: { id: ActionMode; name: string }) => void;
  readonly removeAllFromLayers!: () => void;
  readonly init!: () => void;
  readonly updateDisplay!: () => void;

  readonly $appDB!: FirebaseFirestore;
  readonly $appAuth!: FirebaseAuth;
  readonly $appStorage!: FirebaseStorage;

  private availHeight = 0; // Both split panes are sandwiched between the app bar and footer. This variable hold the number of pixels available for canvas height
  private currentCanvasSize = 0; // Result of height calculation will be passed to <v-responsive> via this variable

  private buttonList = buttonList;
  private toolboxMinified = false;
  private stylePanelMinified = true;
  private notificationsPanelMinified = true;
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
  private displayCreateCircleToolUseMessage = false;
  private displayCreatePointToolUseMessage = false;
  private displayCreateLineSegmentToolUseMessage = false;
  private displayCreateLineToolUseMessage = false;

  private confirmedLeaving = false;
  private attemptedToRoute: Route | null = null;
  private accountEnabled = false;
  private uid = "";
  private authSubscription!: Unsubscribe;

  private actionMode: { id: ActionMode; name: string } = {
    id: "rotate",
    name: ""
  };


  $refs!: {
    responsiveBox: VueComponent;
    toolbox: VueComponent;
    mainPanel: VueComponent;
    stylePanel: HTMLDivElement;
    unsavedWorkDialog: VueComponent & DialogAction;
    clearConstructionDialog: VueComponent & DialogAction;
  };

  get topLeftShortcuts() {
    return [
      {
        labelMsg: "main.UndoLastAction",
        icon: SETTINGS.icons.undo.props.mdiIcon,
        clickFunc: this.undoEdit,
        iconColor: "blue",
        btnColor: null,
        disableBtn: !this.stylePanelMinified || !this.undoEnabled,
        button: null,
      },
      {
        labelMsg: "main.RedoLastAction",
        icon: SETTINGS.icons.redo.props.mdiIcon,
        clickFunc: this.redoAction,
        iconColor: "blue",
        btnColor: null,
        disableBtn: !this.stylePanelMinified || !this.undoEnabled,
        button: null,
      }
    ];
  }
  get topRightShortcuts() {
    return [
      {
        labelMsg: "constructions.resetSphere",
        icon: SETTINGS.icons.clearConstruction.props.mdiIcon,
        clickFunc: () => {
          this.$refs.clearConstructionDialog.show();
        },
        iconColor: null,
        btnColor: "primary",
        disableBtn: false,
        button: null,
      }
    ];
  }

  get bottomRightShortcuts() {
    return [
      {
        labelMsg: "buttons.PanZoomInToolTipMessage",
        icon: SETTINGS.icons.zoomIn.props.mdiIcon,
        clickFunc: this.enableZoomIn,
        iconColor: null,
        btnColor: "primary",
        disableBtn: false,
        button: toolGroups[0].children.find((e) => e.actionModeValue == "zoomIn"),
      },

      {
        labelMsg: "buttons.PanZoomOutToolTipMessage",
        icon: SETTINGS.icons.zoomOut.props.mdiIcon,
        clickFunc: this.enableZoomOut,
        iconColor: null,
        btnColor: "primary",
        disableBtn: false,
        button: toolGroups[0].children.find((e) => e.actionModeValue == "zoomOut"),
      },

      {
        labelMsg: "buttons.ZoomFitToolTipMessage",
        icon: SETTINGS.icons.zoomFit.props.mdiIcon,
        clickFunc: this.enableZoomFit,
        iconColor: null,
        btnColor: "primary",
        disableBtn: false,
        button: toolGroups[0].children.find((e) => e.actionModeValue == "zoomFit"),

      }
    ];
  }

  get bottomLeftShortcuts() {return [
      {
        labelMsg: "buttons.CreatePointToolTipMessage",
        icon: "$vuetify.icons.value.point",
        clickFunc: this.createPoint,
        iconColor: null,
        btnColor: "primary",
        disableBtn: false,
        button: toolGroups[2].children.find((e) => e.actionModeValue == "point"),
      },

      {
        labelMsg: "buttons.CreateLineToolTipMessage",
        icon: "$vuetify.icons.value.line",
        clickFunc: this.createLine,
        iconColor: null,
        btnColor: "primary",
        disableBtn: false,
        button: toolGroups[2].children.find((e) => e.actionModeValue == "line"),
      },

      {
        labelMsg: "buttons.CreateLineSegmentToolTipMessage",
        icon: "$vuetify.icons.value.segment",
        clickFunc: this.createSegment,
        iconColor: null,
        btnColor: "primary",
        disableBtn: false,
        button: toolGroups[2].children.find((e) => e.actionModeValue == "segment"),
      },

      {
        labelMsg: "buttons.CreateCircleToolTipMessage",
        icon: "$vuetify.icons.value.circle",
        clickFunc: this.createCircle,
        iconColor: null,
        btnColor: "primary",
        disableBtn: false,
        button: toolGroups[2].children.find((e) => e.actionModeValue == "circle"),
      }
    ];
  }


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

  private setUndoEnabled(e: { value: boolean }): void {
    this.undoEnabled = e.value;
  }
  private setRedoEnabled(e: { value: boolean }): void {
    this.redoEnabled = e.value;
  }

  private enableZoomIn(): void {
    this.displayZoomInToolUseMessage = true;
    this.setActionMode({
      id: "zoomIn",
      name: "PanZoomInDisplayedName"
    });
  }
  private enableZoomOut(): void {
    this.displayZoomOutToolUseMessage = true;
    this.setActionMode({
      id: "zoomOut",
      name: "PanZoomOutDisplayedName"
    });
  }
  private enableZoomFit(): void {
    this.displayZoomFitToolUseMessage = true;
    this.setActionMode({
      id: "zoomFit",
      name: "ZoomFitDisplayedName"
    });
  }

  private createPoint(): void {
    this.displayCreatePointToolUseMessage = true;
    this.setActionMode({
      id: "point",
      name: "CreatePointDisplayedName"
    });
  }

  private createLine(): void {
    this.displayCreateLineToolUseMessage = true;
    this.setActionMode({
      id: "line",
      name: "CreateLineDisplayedName"
    });
  }
  private createSegment(): void {
    this.displayCreateLineSegmentToolUseMessage = true;
    this.setActionMode({
      id: "segment",
      name: "CreateLineSegmentDisplayedName"
    });
  }

  private createCircle(): void {
    this.displayCreateCircleToolUseMessage = true;
    this.setActionMode({
      id: "circle",
      name: "CreateCircleDisplayedName"
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
    this.removeAllFromLayers();
    this.init();
    SENodule.resetAllCounters();
    // Nodule.resetIdPlottableDescriptionMap(); // Needed?
    this.$appDB
      .collection("constructions") // load the script from public collection
      .doc(docId)
      .get()
      .then(async (doc: DocumentSnapshot) => {
        if (doc.exists) {
          const { script } = doc.data() as ConstructionInFirestore;
          // Check whether the script is inline or stored in Firebase storage
          if (script.startsWith("https:")) {
            // The script must be fetched from Firebase storage
            const scriptText = await this.$appStorage
              .refFromURL(script)
              .getDownloadURL()
              .then((url: string) => axios.get(url))
              .then((r: AxiosResponse) => r.data);
            run(JSON.parse(scriptText) as ConstructionScript);
          } else {
            // The script is inline
            run(JSON.parse(script) as ConstructionScript);
          }
          this.updateDisplay();
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
    window.addEventListener("keydown", this.handleKeyDown);
  }
  beforeDestroy(): void {
    if (this.authSubscription) this.authSubscription();
    EventBus.unlisten("set-action-mode-to-select-tool");
    EventBus.unlisten("secret-key-detected");
    window.removeEventListener("keydown", this.handleKeyDown);
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
  }

  minifyNotificationsPanel(): void {
    this.notificationsPanelMinified = !this.notificationsPanelMinified;

  }
  minifyStylePanel(): void {
    this.stylePanelMinified = !this.stylePanelMinified;
  }

  getPanelSize(): number {
    if (!this.stylePanelMinified || !this.notificationsPanelMinified) {
      return 30;
    }
    return 5;
  }

  setActionModeToSelectTool(): void {
    this.setActionMode({
      id: "select",
      name: "SelectDisplayedName"
    });
  }

  switchActionMode(): void {
    this.setActionMode(this.actionMode);
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
    this.$refs.clearConstructionDialog.hide();
    this.removeAllFromLayers();
    this.init();
    Command.commandHistory.splice(0);
    Command.redoHistory.splice(0);
    SENodule.resetAllCounters();
    EventBus.fire("undo-enabled", { value: Command.commandHistory.length > 0 });
    EventBus.fire("redo-enabled", { value: Command.redoHistory.length > 0 });
    // Nodule.resetIdPlottableDescriptionMap(); // Needed?
  }

  handleKeyDown(keyEvent: KeyboardEvent): void {
    // TO DO: test this on PC
    if (navigator.userAgent.indexOf("Mac OS X") !== -1) {
      //Mac shortcuts
      if (keyEvent.code === "KeyZ" && !keyEvent.shiftKey && keyEvent.metaKey) {
        Command.undo();
      } else if (
        keyEvent.code === "KeyZ" &&
        keyEvent.shiftKey &&
        keyEvent.metaKey
      ) {
        Command.redo();
      }
    } else {
      //pc shortcuts
      if (keyEvent.code === "KeyZ" && !keyEvent.shiftKey && keyEvent.ctrlKey) {
        Command.undo();
      } else if (
        keyEvent.code === "KeyY" &&
        !keyEvent.shiftKey &&
        keyEvent.ctrlKey
      ) {
        Command.redo();
      }
    }
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

    //console.debug("Resize all nodules and the temporary ones");
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

#currentTool {
  display: flex;
  flex-direction: row;
  justify-content: flex-start; /* Pull contents vertically to the top */
  align-items: flex-end; /* Align contents horizontally to the right */
  height: 100%;
  color: #000;
  font-family: "Gill Sans", "Gill Sans MT", "Calibri", "Trebuchet MS",
    sans-serif;
}

#tool {
  font-size: 20px;
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
