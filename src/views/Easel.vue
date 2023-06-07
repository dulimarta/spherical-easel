<template>
  <div>
    <Splitpanes
      :style="contentHeightStyle"
      class="default-theme"
      @resize="dividerMoved"
      :push-other-panes="false">
      <!-- Use the left page for the toolbox -->
      <Pane min-size="5" max-size="35" :size="toolboxMinified ? 5 : 25">
        <Toolbox
          id="toolbox"
          ref="toolbox"
          @minify-toggled="handleToolboxMinify" />
      </Pane>
      <Pane :size="centerWidth">
        <!-- Use the right pane mainly for the canvas and style panel -->
        <!--
        When minified, the style panel takes only 5% of the remaining width
        When expanded, it takes 30% of the remaining width
      -->
        <v-container fluid ref="mainPanel">
          <v-row justify="center">
            <!-- Shortcut icons are placed using absolute positioning. CSS requires
            their parents to have its position set . Use either relative, absolute -->
            <div style="position: relative">

              <EarthComp :canvas-size="currentCanvasSize" v-if="isEarthMode" />

              <SphereFrame :canvas-size="currentCanvasSize" />
              <button @click="isEarthMode=!isEarthMode" id="earthTogger">Earth Mode</button>
              <v-overlay
                contained
                class="align-center justify-center"
                :model-value="svgDataImage.length > 0">
                <img
                  :src="svgDataImage"
                  style="background: hsla(0, 100%, 100%, 1)"
                  :width="currentCanvasSize" :height="currentCanvasSize"/>
              </v-overlay>
              <div class="anchored top right">
                <div
                  v-for="(shortcut, index) in topRightShortcuts"
                  :key="index"
                  :style="listItemStyle(index, 'right', 'top')">
                  <ShortcutIcon :model="shortcut" />
                </div>
              </div>
            </div>
          </v-row>
        </v-container>
      </Pane>

      <Pane min-size="5" :max-size="25" :size="panelSize">
        <v-card class="pt-2">
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
            </v-btn>

            <StylePanel :minified="stylePanelMinified" />
            <!-- v-on:toggle-style-panel="minifyStylePanel" /-->

            <!--MessageBox
              :minified="notificationsPanelMinified"
              v-on:toggle-notifications-panel="minifyNotificationsPanel" /-->
          </div>
        </v-card>
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
import {
  computed,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  Ref,
  ref
} from "vue";
import { Splitpanes, Pane } from "splitpanes";
import "splitpanes/dist/splitpanes.css";
import Toolbox from "@/components/ToolBox.vue";
import SphereFrame from "@/components/SphereFrame.vue";
import EarthComp from "@/components/EarthComp.vue";
import ShortcutIcon from "@/components/ShortcutIcon.vue";
/* Import Command so we can use the command paradigm */
import { Command } from "@/commands/Command";
import SETTINGS from "@/global-settings";
import EventBus from "../eventHandlers/EventBus";

// import buttonList from "@/components/ToolGroups.vue";
// import ToolButton from "@/components/ToolButton.vue";
// Temporarily exclude Style.vue
import StylePanel from "@/components/Style.vue";
import Circle from "@/plottables/Circle";
import Point from "@/plottables/Point";
import Line from "@/plottables/Line";
import Label from "@/plottables/Label";
import Segment from "@/plottables/Segment";
import Nodule from "@/plottables/Nodule";
import Ellipse from "@/plottables/Ellipse";
import { SENodule } from "@/models/SENodule";
import { ConstructionInFirestore, ToolButtonType } from "@/types";
import AngleMarker from "@/plottables/AngleMarker";
import {
  getFirestore,
  DocumentSnapshot,
  doc,
  getDoc
} from "firebase/firestore";
import { run } from "@/commands/CommandInterpreter";
import { ConstructionScript, ShortcutIconType } from "@/types";
import Dialog, { DialogAction } from "@/components/Dialog.vue";
import { useSEStore } from "@/stores/se";
import Parametric from "@/plottables/Parametric";
import { getAuth, User, Unsubscribe } from "firebase/auth";
import {
  getStorage,
  ref as storageRef,
  getDownloadURL
} from "firebase/storage";
import axios, { AxiosResponse } from "axios";
import { storeToRefs } from "pinia";
import { toolGroups } from "@/components/toolgroups";
import { useI18n } from "vue-i18n";
// import { getCurrentInstance } from "vue";
import {
  onBeforeRouteLeave,
  RouteLocationNormalized,
  useRouter
} from "vue-router";
import { useLayout, useDisplay } from "vuetify";

const appDB = getFirestore();
const appAuth = getAuth();
const appStorage = getStorage();
/**
 * Split panel width distribution (percentages):
 * When both side panels open: 20:60:20 (proportions 1:3:1)
 * When left panel open, right panel minified: 20:75:5 (4:15:1)
 * When left panel minifie, right panel open: 5:75:20 (1:15:4)
 */
const { t } = useI18n();
const seStore = useSEStore();
const router = useRouter();
const { seNodules, temporaryNodules, hasObjects, actionMode } =
  storeToRefs(seStore);
const isEarthMode = ref(false)
const props = defineProps<{
  documentId?: string;
}>();
const { mainRect } = useLayout();
const display = useDisplay();
const contentHeight = computed(() => display.height.value - mainRect.value.top);
const contentHeightStyle = computed(() => ({
  height: contentHeight.value + "px"
}));
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

const unsavedWorkDialog: Ref<DialogAction | null> = ref(null);
const clearConstructionDialog: Ref<DialogAction | null> = ref(null);
const svgDataImage = ref("");
const topRightShortcuts = computed((): ShortcutIconType[] => {
  return [
    {
      tooltipMessage: "constructions.resetSphere",
      icon: SETTINGS.icons.clearConstruction.props.mdiIcon,
      clickFunc: () => {
        clearConstructionDialog.value?.show();
      },
      iconColor: "blue",
      disableBtn: false
    }
  ];
});

//#region magnificationUpdate
onBeforeMount(() => {
  EventBus.listen("magnification-updated", resizePlottables);
  EventBus.listen("undo-enabled", setUndoEnabled);
  EventBus.listen("redo-enabled", setRedoEnabled);
  EventBus.listen("preview-construction", (s: string) => {
    svgDataImage.value = s;
  });
});
//#endregion magnificationUpdate

const centerWidth = computed((): number => {
  return (
    100 - (toolboxMinified.value ? 5 : 25) - (stylePanelMinified.value ? 5 : 25)
  );
});

function setUndoEnabled(e: { value: boolean }): void {
  undoEnabled = e.value;
}
function setRedoEnabled(e: { value: boolean }): void {
  redoEnabled = e.value;
}

function adjustSize(): void {
  availHeight =
    window.innerHeight - mainRect.value.bottom - mainRect.value.top - 24; // quick hack (-24) to leave room at the bottom
  console.debug(
    "adjustSize() available height is ",
    window.innerHeight,
    mainRect.value
  );
  currentCanvasSize.value = availHeight;
}

function loadDocument(docId: string): void {
  seStore.removeAllFromLayers();
  seStore.init();
  SENodule.resetAllCounters();
  // Nodule.resetIdPlottableDescriptionMap(); // Needed?
  // load the script from public collection
  getDoc(doc(appDB, "constructions", docId)).then(
    async (doc: DocumentSnapshot) => {
      if (doc.exists()) {
        const { script } = doc.data() as ConstructionInFirestore;
        // Check whether the script is inline or stored in Firebase storage
        if (script.startsWith("https:")) {
          // The script must be fetched from Firebase storage
          const constructionStorage = storageRef(appStorage, script);
          const scriptText = await getDownloadURL(constructionStorage)
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
    }
  );
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
  availHeight = window.innerHeight - mainRect.value.top - mainRect.value.bottom;
  currentCanvasSize.value = Math.min(availableWidth, availHeight);
}

const panelSize = computed((): number => {
  if (!stylePanelMinified.value || !notificationsPanelMinified) {
    return 30;
  }
  return 5;
});

function setActionModeToSelectTool(): void {
  seStore.setActionMode("select");
}

function onWindowResized(): void {
  console.debug("onWindowResized()");
  adjustSize();
}
/* Undoes the last user action that changed the state of the sphere. */
// function undoEdit(): void {
//   Command.undo();
// }
// /* Redoes the last user action that changed the state of the sphere. */
// function redoAction(): void {
//   Command.redo();
// }

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

function doLeave(): void {
  confirmedLeaving = true;
  if (attemptedToRoute) router.replace({ path: attemptedToRoute.path });
}

function listItemStyle(idx: number, xLoc: string, yLoc: string) {
  //xLoc determines left or right, yLoc determines top or bottom
  const style: any = {};

  switch (idx) {
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

onBeforeRouteLeave(
  (
    toRoute: RouteLocationNormalized,
    fromRoute: RouteLocationNormalized
  ): boolean => {
    if (hasObjects && !confirmedLeaving) {
      unsavedWorkDialog.value?.show();
      attemptedToRoute = toRoute;
      return false;
    } else {
      /* Proceed to the next view when the canvas has no objects OR
      user has confirmed leaving this view */
      return true;
    }
  }
);

function handleToolboxMinify(state: boolean) {
  toolboxMinified.value = state;
}
</script>
<style scoped lang="scss">
.splitpanes__pane {
  // color: hsla(40, 50%, 50%, 0.6);
  // display: flex;
  // justify-content: center;
  // align-items: center;
  // font-size: 5em;
}
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
  height: 100%;
  overflow: auto;
}

#styleContainer {
  // border: 2px solid red;
  height: calc(100vh - 136px);
  padding-bottom: 0;
  color: #000;
  font-family: "Gill Sans", "Gill Sans MT", "Calibri", "Trebuchet MS",
    sans-serif;
}

.anchored {
  position: absolute;
  margin: 4px;
}
.right {
  right: 0;
}

.top {
  top: 0;
}
#earthTogger{
position: absolute;
top: 0;
color: white;
background-color: blue;
border-radius: 10px;
padding:5px;
}
</style>
