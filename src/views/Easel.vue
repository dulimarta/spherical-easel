<template>
  <v-icon icon="$circle"></v-icon>
  <v-icon icon="mdi-numeric"></v-icon>
  <div>
    <Splitpanes
      class="default-theme"
      @resize="dividerMoved"
      :push-other-panes="false">
      <!-- Use the left page for the toolbox -->
      <Pane min-size="5" max-size="35" :size="toolboxMinified ? 5 : 25">
        <v-container style="background-color: white">
          <v-row>
            <v-btn icon @click="minifyToolbox">
              <v-icon v-if="toolboxMinified">mdi-arrow-right</v-icon>
              <v-icon v-else>mdi-arrow-left</v-icon>
            </v-btn>
            <CurrentToolSelection
              v-if="!toolboxMinified"
              :actionMode="actionMode"
              :toolboxMinified="toolboxMinified" />
          </v-row>
        </v-container>
        <!--Toolbox
          id="toolbox"
          ref="toolbox"
          :minified="toolboxMinified"
          v-on:toggle-tool-box-panel="minifyToolbox" /-->
      </Pane>
      <Pane :size="centerWidth">
        <!-- Use the right pane mainly for the canvas and style panel -->
        <!--
        When minified, the style panel takes only 5% of the remaining width
        When expanded, it takes 30% of the remaining width
      -->
        <v-container fluid ref="mainPanel">
          <v-row>
            <v-col cols="12">
              <v-row justify="center" class="pb-1">
                <v-responsive
                  :aspect-ratio="1"
                  :max-height="currentCanvasSize"
                  :max-width="currentCanvasSize"
                  ref="responsiveBox"
                  id="responsiveBox"
                  class="pa-0">
                  <SphereFrame :canvas-size="currentCanvasSize" />
                  <div class="anchored top left">
                    <!--div
                      v-for="(shortcut, index) in topLeftShortcuts"
                      :key="index"
                      :style="listItemStyle(index, 'left', 'top')"-->
                      <!--ShortcutIcon
                        @click="shortcut.clickFunc"
                        :labelMsg="shortcut.labelMsg"
                        :icon="shortcut.icon"
                        :iconColor="shortcut.iconColor"
                        :btnColor="shortcut.btnColor"
                        :disableBtn="shortcut.disableBtn"
                        :button="shortcut.button" /-->
                    <!--/div-->
                  </div>
                  <div class="anchored bottom left">
                    <div
                      v-for="(shortcut, index) in bottomLeftShortcuts"
                      :key="index"
                      :style="listItemStyle(index, 'left', 'bottom')">
                      <!--ShortcutIcon
                        @click="shortcut.clickFunc"
                        :labelMsg="shortcut.labelMsg"
                        :icon="shortcut.icon"
                        :iconColor="shortcut.iconColor"
                        :btnColor="shortcut.btnColor"
                        :disableBtn="shortcut.disableBtn"
                        :button="shortcut.button" /-->
                    </div>
                  </div>
                  <div class="anchored top right">
                    <div
                      v-for="(shortcut, index) in topRightShortcuts"
                      :key="index"
                      :style="listItemStyle(index, 'right', 'top')">
                      <!--ShortcutIcon
                        @click="shortcut.clickFunc"
                        :labelMsg="shortcut.labelMsg"
                        :icon="shortcut.icon"
                        :iconColor="shortcut.iconColor"
                        :btnColor="shortcut.btnColor"
                        :disableBtn="shortcut.disableBtn"
                        :button="shortcut.button" /-->
                    </div>
                  </div>
                  <div class="anchored bottom right">
                    <div
                      v-for="(shortcut, index) in bottomRightShortcuts"
                      :key="index"
                      :style="listItemStyle(index, 'right', 'bottom')">
                      <!--ShortcutIcon
                        @click="shortcut.clickFunc"
                        :labelMsg="shortcut.labelMsg"
                        :icon="shortcut.icon"
                        :iconColor="shortcut.iconColor"
                        :btnColor="shortcut.btnColor"
                        :disableBtn="shortcut.disableBtn"
                        :button="shortcut.button" /-->
                    </div>
                  </div>
                </v-responsive>
              </v-row>
            </v-col>
          </v-row>
        </v-container>
      </Pane>

      <Pane min-size="5" :max-size="25" :size="panelSize">
        <!--v-card class="pt-2">
          <div id="styleContainer">
            <v-btn
              icon
              v-if="!stylePanelMinified || !notificationsPanelMinified"
              @click="
                () => {
                  stylePanelMinified = true;
                  notificationsPanelMinified = true;
                }
              ">
              <v-icon>mdi-arrow-right</v-icon>
            </v-btn-->

            <!--StylePanel
              :minified="stylePanelMinified"
              v-on:toggle-style-panel="minifyStylePanel" /-->

            <!--MessageBox
              :minified="notificationsPanelMinified"
              v-on:toggle-notifications-panel="minifyNotificationsPanel" />
          </div>
        </v-card-->
      </Pane>
    </Splitpanes>
    <Dialog
      ref="unsavedWorkDialog"
      max-width="40%"
      :title="t('constructions.confirmation')"
      :yes-text="t('constructions.keep')"
      :no-text="t('constructions.discard')"
      :no-action="doLeave">
      {{ t(`constructions.unsavedConstructionMsg`) }}
    </Dialog>
    <Dialog
      ref="clearConstructionDialog"
      :title="t('constructions.confirmReset')"
      :yes-text="t('constructions.proceed')"
      :yes-action="() => resetSphere()"
      :no-text="t('constructions.cancel')"
      max-width="40%">
      <p>{{ t(`constructions.clearConstructionMsg`) }}</p>
    </Dialog>
  </div>
</template>

<script lang="ts" setup>
import VueComponent, {
  computed,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  Ref,
  ref
} from "vue";
import { Splitpanes, Pane } from "splitpanes";
import "splitpanes/dist/splitpanes.css";
// import Toolbox from "@/components/ToolBox.vue";
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
import { ConstructionInFirestore } from "@/types";
import AngleMarker from "@/plottables/AngleMarker";
import { FirebaseFirestore, DocumentSnapshot } from "@firebase/firestore-types";
import { run } from "@/commands/CommandInterpreter";
import { ConstructionScript } from "@/types";
import Dialog, { DialogAction } from "@/components/Dialog.vue";
import { useSEStore } from "@/stores/se";
import Parametric from "@/plottables/Parametric";
import { Unsubscribe } from "@firebase/util";
import { FirebaseAuth, User } from "@firebase/auth-types";
import { FirebaseStorage } from "@firebase/storage-types";
import axios, { AxiosResponse } from "axios";
import { mapActions, mapState, storeToRefs } from "pinia";
import ShortcutIcon from "@/components/ShortcutIcon.vue";
import CurrentToolSelection from "@/components/CurrentToolSelection.vue";
import MessageBox from "@/components/MessageBox.vue";
import { toolGroups } from "@/components/toolgroups";
import { appDB, appStorage, appAuth } from "@/firebase-config";
import { useI18n } from "vue-i18n";
import { getCurrentInstance } from "vue";
import { onBeforeRouteLeave, RouteLocationNormalized, useRouter } from "vue-router";
import {useLayout } from "vuetify"
/**
 * Split panel width distribution (percentages):
 * When both side panels open: 20:60:20 (proportions 1:3:1)
 * When left panel open, right panel minified: 20:75:5 (4:15:1)
 * When left panel minifie, right panel open: 5:75:20 (1:15:4)
 */
// @Component({
//   components: {
//     Splitpanes,
//     Pane,
//     Toolbox,
//     SphereFrame,
//     ToolButton,
//     StylePanel,
//     IconBase,
//     Dialog,
//     ShortcutIcon,
//     CurrentToolSelection,
//     MessageBox
//   },
//   methods: {
  const {t} = useI18n()
const seStore = useSEStore();
const router = useRouter()
//     ...mapActions(useSEStore, [
//       "setActionMode",
//       "init",
//       "removeAllFromLayers",
//       "updateDisplay"
//     ])
//   },
const { seNodules, temporaryNodules, hasObjects, actionMode } =
  storeToRefs(seStore);

//   computed: {
//     ...mapState(useSEStore, [
//       "seNodules",
//       "temporaryNodules",
//       "hasObjects",
//       "activeToolName"
//     ])
//   }
// })
// export default class Easel extends Vue {
const props = defineProps<{
  documentId?: string;
}>();
const { mainRect, getLayoutItem } = useLayout()

let availHeight = 0; // Both split panes are sandwiched between the app bar and footer. This variable hold the number of pixels available for canvas height
const currentCanvasSize = ref(0); // Result of height calculation will be passed to <v-responsive> via this variable

// function buttonList = buttonList;
const toolboxMinified = ref(false);
const stylePanelMinified = ref(true);
const notificationsPanelMinified = ref(true);

let undoEnabled = false;
let redoEnabled = false;

let confirmedLeaving = false;
let attemptedToRoute: RouteLocationNormalized | null = null;
let accountEnabled = false;
let uid = "";
let authSubscription!: Unsubscribe;

// $refs!: {
const responsiveBox = ref(null);
// toolbox: VueComponent;
// mainPanel: VueComponent;
// stylePanel: HTMLDivElement;
const unsavedWorkDialog: Ref<DialogAction | null> = ref(null);
const clearConstructionDialog: Ref<DialogAction | null> = ref(null);
// };

const topLeftShortcuts = computed(() => {
  return [
    // {
    //   labelMsg: "main.UndoLastAction",
    //   icon: SETTINGS.icons.undo.props.mdiIcon,
    //   clickFunc: undoEdit,
    //   iconColor: "blue",
    //   btnColor: null,
    //   disableBtn: !stylePanelMinified.value || !undoEnabled,
    //   button: null
    // },
    // {
    //   labelMsg: "main.RedoLastAction",
    //   icon: SETTINGS.icons.redo.props.mdiIcon,
    //   clickFunc: redoAction,
    //   iconColor: "blue",
    //   btnColor: null,
    //   disableBtn: !stylePanelMinified.value || !undoEnabled,
    //   button: null
    // }
  ];
});
const topRightShortcuts = computed(() => {
  return [
    // {
    //   labelMsg: "constructions.resetSphere",
    //   icon: SETTINGS.icons.clearConstruction.props.mdiIcon,
    //   clickFunc: () => {
    //     clearConstructionDialog.value?.show();
    //   },
    //   iconColor: "blue",
    //   btnColor: "primary",
    //   disableBtn: false,
    //   button: null
    // }
  ];
});

const bottomRightShortcuts = computed(() => {
  return [
    // {
    //   labelMsg: "buttons.PanZoomInToolTipMessage",
    //   icon: SETTINGS.icons.zoomIn.props.mdiIcon,
    //   clickFunc: enableZoomIn,
    //   iconColor: "blue",
    //   btnColor: "primary",
    //   disableBtn: false,
    //   button: toolGroups[0].children.find(e => e.actionModeValue == "zoomIn")
    // },

    // {
    //   labelMsg: "buttons.PanZoomOutToolTipMessage",
    //   icon: SETTINGS.icons.zoomOut.props.mdiIcon,
    //   clickFunc: enableZoomOut,
    //   iconColor: "blue",
    //   btnColor: "primary",
    //   disableBtn: false,
    //   button: toolGroups[0].children.find(e => e.actionModeValue == "zoomOut")
    // },

    // {
    //   labelMsg: "buttons.ZoomFitToolTipMessage",
    //   icon: SETTINGS.icons.zoomFit.props.mdiIcon,
    //   clickFunc: enableZoomFit,
    //   iconColor: "blue",
    //   btnColor: "primary",
    //   disableBtn: false,
    //   button: toolGroups[0].children.find(e => e.actionModeValue == "zoomFit")
    // }
  ];
});

const bottomLeftShortcuts = computed(() => {
  return [
    // {
    //   labelMsg: "buttons.CreatePointToolTipMessage",
    //   icon: "$point",
    //   clickFunc: createPoint,
    //   iconColor: "blue",
    //   btnColor: "primary",
    //   disableBtn: false,
    //   button: toolGroups[2].children.find(e => e.actionModeValue == "point")
    // },

    // {
    //   labelMsg: "buttons.CreateLineToolTipMessage",
    //   icon: "$line",
    //   clickFunc: createLine,
    //   iconColor: "blue",
    //   btnColor: "primary",
    //   disableBtn: false,
    //   button: toolGroups[2].children.find(e => e.actionModeValue == "line")
    // },

    // {
    //   labelMsg: "buttons.CreateLineSegmentToolTipMessage",
    //   icon: "$segment",
    //   clickFunc: createSegment,
    //   iconColor: "blue",
    //   btnColor: "primary",
    //   disableBtn: false,
    //   button: toolGroups[2].children.find(e => e.actionModeValue == "segment")
    // },

    // {
    //   labelMsg: "buttons.CreateCircleToolTipMessage",
    //   icon: "$circle",
    //   clickFunc: createCircle,
    //   iconColor: "blue",
    //   btnColor: "primary",
    //   disableBtn: false,
    //   button: toolGroups[2].children.find(e => e.actionModeValue == "circle")
    // }
  ];
});

//#region magnificationUpdate
onBeforeMount(() => {
  EventBus.listen("magnification-updated", resizePlottables);
  EventBus.listen("undo-enabled", setUndoEnabled);
  EventBus.listen("redo-enabled", setRedoEnabled);
});
//#endregion magnificationUpdate

const centerWidth = computed((): number => {
  return 100 - (toolboxMinified ? 5 : 25) - (stylePanelMinified.value ? 5 : 25);
});

function setUndoEnabled(e: { value: boolean }): void {
  undoEnabled = e.value;
}
function setRedoEnabled(e: { value: boolean }): void {
  redoEnabled = e.value;
}

function enableZoomIn(): void {
  seStore.setActionMode({
    id: "zoomIn",
    name: "PanZoomInDisplayedName"
  });
}
function enableZoomOut(): void {
  seStore.setActionMode({
    id: "zoomOut",
    name: "PanZoomOutDisplayedName"
  });
}
function enableZoomFit(): void {
  seStore.setActionMode({
    id: "zoomFit",
    name: "ZoomFitDisplayedName"
  });
}

function createPoint(): void {
  seStore.setActionMode({
    id: "point",
    name: "CreatePointDisplayedName"
  });
}

function createLine(): void {
  seStore.setActionMode({
    id: "line",
    name: "CreateLineDisplayedName"
  });
}
function createSegment(): void {
  seStore.setActionMode({
    id: "segment",
    name: "CreateLineSegmentDisplayedName"
  });
}

function createCircle(): void {
  seStore.setActionMode({
    id: "circle",
    name: "CreateCircleDisplayedName"
  });
}

function adjustSize(): void {
  availHeight =
    window.innerHeight - mainRect.value.bottom - mainRect.value.top - 24; // quick hack (-24) to leave room at the bottom

  const tmp = getLayoutItem("responsiveBox")
  if (tmp) {
    currentCanvasSize.value = availHeight - tmp.top;
  }
}

function loadDocument(docId: string): void {
  seStore.removeAllFromLayers();
  seStore.init();
  SENodule.resetAllCounters();
  // Nodule.resetIdPlottableDescriptionMap(); // Needed?
  appDB
    .collection("constructions") // load the script from public collection
    .doc(docId)
    .get()
    .then(async (doc: DocumentSnapshot) => {
      if (doc.exists) {
        const { script } = doc.data() as ConstructionInFirestore;
        // Check whether the script is inline or stored in Firebase storage
        if (script.startsWith("https:")) {
          // The script must be fetched from Firebase storage
          const scriptText = await appStorage
            .refFromURL(script)
            .getDownloadURL()
            .then((url: string) => axios.get(url))
            .then((r: AxiosResponse) => r.data);
          run(JSON.parse(scriptText) as ConstructionScript);
        } else {
          // The script is inline
          run(JSON.parse(script) as ConstructionScript);
        }
        seStore.updateDisplay();
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
onMounted((): void => {
  window.addEventListener("resize", onWindowResized);
  adjustSize(); // Why do we need this?  onWindowResized just calls adjustSize() but if you remove it the app doesn't work -- strange!
  if (props.documentId) loadDocument(props.documentId);
  EventBus.listen("set-action-mode-to-select-tool", setActionModeToSelectTool);
  EventBus.listen("secret-key-detected", () => {
    if (uid.length > 0) accountEnabled = true;
  });
  authSubscription = appAuth.onAuthStateChanged((u: User | null) => {
    if (u !== null) uid = u.uid;
  });
  window.addEventListener("keydown", handleKeyDown);
});

onBeforeUnmount((): void => {
  if (authSubscription) authSubscription();
  EventBus.unlisten("set-action-mode-to-select-tool");
  EventBus.unlisten("secret-key-detected");
  window.removeEventListener("keydown", handleKeyDown);
});

/**
 * Split pane resize handler
 * @param event an array of numeric triplets {min: ____, max: ____, size: ____}
 */
function dividerMoved(
  event: Array<{ min: number; max: number; size: number }>
): void {
  const availableWidth =
    ((100 - event[0].size - event[2].size) / 100) *
    (window.innerWidth - mainRect.value.left - mainRect.value.right);
  availHeight =
    window.innerHeight - mainRect.value.top - mainRect.value.bottom;
  currentCanvasSize.value = Math.min(availableWidth, availHeight);
}

function minifyToolbox(): void {
  toolboxMinified.value = !toolboxMinified.value;
}

function minifyNotificationsPanel(): void {
  notificationsPanelMinified.value = !notificationsPanelMinified.value;
}
function minifyStylePanel(): void {
  stylePanelMinified.value = !stylePanelMinified.value;
}

const panelSize = computed((): number => {
  if (!stylePanelMinified.value || !notificationsPanelMinified) {
    return 30;
  }
  return 5;
});

function setActionModeToSelectTool(): void {
  seStore.setActionMode({
    id: "select",
    name: "SelectDisplayedName"
  });
}

function onWindowResized(): void {
  adjustSize();
}
/* Undoes the last user action that changed the state of the sphere. */
function undoEdit(): void {
  Command.undo();
}
/* Redoes the last user action that changed the state of the sphere. */
function redoAction(): void {
  Command.redo();
}

function resetSphere(): void {
  clearConstructionDialog.value?.hide();
  seStore.removeAllFromLayers();
  seStore.init();
  Command.commandHistory.splice(0);
  Command.redoHistory.splice(0);
  SENodule.resetAllCounters();
  EventBus.fire("undo-enabled", { value: Command.commandHistory.length > 0 });
  EventBus.fire("redo-enabled", { value: Command.redoHistory.length > 0 });
  // Nodule.resetIdPlottableDescriptionMap(); // Needed?
}

function handleKeyDown(keyEvent: KeyboardEvent): void {
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
function resizePlottables(e: { factor: number }): void {
  // const oldFactor = previousZoomMagnificationFactor;
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
  seNodules.value.forEach((p: SENodule) => {
    p.ref?.adjustSize();
  });
  // The temporary plottables need to be resized too
  temporaryNodules.value.forEach((p: Nodule) => {
    p.adjustSize();
  });
}
//#endregion resizePlottables

function requestShare(): void {
  // Alternate place to handle "Share Construction"
  // EventBus.fire("share-construction-requested", {});
}

function doLeave(): void {
  confirmedLeaving = true;
  if (attemptedToRoute) router.replace({ path: attemptedToRoute.path });
}

function listItemStyle(i: number, xLoc: string, yLoc: string) {
  //xLoc determines left or right, yLoc determines top or bottom
  const style: any = {};

  if (i !== 0) {
    style.position = "absolute";
  }

  switch (i) {
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

onBeforeRouteLeave((toRoute: RouteLocationNormalized, fromRoute: RouteLocationNormalized): boolean => {
  if (hasObjects && !confirmedLeaving) {
    unsavedWorkDialog.value?.show();
    attemptedToRoute = toRoute;
    return false
  } else {
    /* Proceed to the next view when the canvas has no objects OR
      user has confirmed leaving this view */
    return true
  }
})
</script>
<style scoped lang="scss">
#container {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  /* Pull contents vertically to the top */
  align-items: flex-end;
  /* Align contents horizontally to the right */
  height: 100%;
  color: #000;
  font-family: "Gill Sans", "Gill Sans MT", "Calibri", "Trebuchet MS",
    sans-serif;
}

#currentTool {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  /* Pull contents vertically to the top */
  align-items: flex-end;
  /* Align contents horizontally to the right */
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
