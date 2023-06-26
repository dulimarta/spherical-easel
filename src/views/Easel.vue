<template>
  <v-navigation-drawer location="end" color="black" permanent width="80">
    <StyleDrawer></StyleDrawer>
  </v-navigation-drawer>
  <div>
    <Splitpanes
      :style="contentHeightStyle"
      class="default-theme"
      @resize="dividerMoved"
      :push-other-panes="false">
      <!-- Use the left page for the toolbox -->
      <Pane ref="leftPane" min-size="5" max-size="35" :size="toolboxMinified ? 5 : LEFT_PANE_PERCENTAGE">
        <Toolbox
          id="toolbox"
          ref="toolbox"
          @minify-toggled="handleToolboxMinify" />
      </Pane>
      <Pane>
        <!-- Use the right pane mainly for the canvas and style panel -->
        <!--
        When minified, the style panel takes only 5% of the remaining width
        When expanded, it takes 30% of the remaining width
      -->
        <!-- Shortcut icons are placed using absolute positioning. CSS requires
            their parents to have its position set . Use either relative, absolute -->
        <div id="sphere-and-msghub">
          <SphereFrame
            style="position: relative"
            :available-height="availHeight"
            :available-width="availWidth"
            v-show="svgDataImage.length === 0" />
          <v-overlay
            contained
            :class="['justify-center', 'align-center', previewClass]"
            :model-value="svgDataImage.length > 0">
            <div class="previewText">
              {{ constructionInfo.count }} objects. Created by:
              {{ constructionInfo.author }}
            </div>
            <img
              id="previewImage"
              class="previewImage"
              :src="svgDataImage"
              :width="canvasWidth"
              :height="canvasHeight" />
          </v-overlay>
          <div id="msghub">
            <MessageHub />
          </div>
        </div>
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
import MessageHub from "@/components/MessageHub.vue";
/* Import Command so we can use the command paradigm */
import { Command } from "@/commands/Command";
import EventBus from "../eventHandlers/EventBus";

// Temporarily exclude Style.vue
import Circle from "@/plottables/Circle";
import Point from "@/plottables/Point";
import Line from "@/plottables/Line";
import Label from "@/plottables/Label";
import Segment from "@/plottables/Segment";
import Nodule from "@/plottables/Nodule";
import Ellipse from "@/plottables/Ellipse";
import { SENodule } from "@/models/SENodule";
import { ConstructionInFirestore, SphericalConstruction } from "@/types";
// import IconBase from "@/components/IconBase.vue";
import AngleMarker from "@/plottables/AngleMarker";
import {
  getFirestore,
  DocumentSnapshot,
  doc,
  getDoc
} from "firebase/firestore";
import { run } from "@/commands/CommandInterpreter";
import { ConstructionScript } from "@/types";
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
import { useI18n } from "vue-i18n";
import {
  onBeforeRouteLeave,
  RouteLocationNormalized,
  useRouter
} from "vue-router";
import { useLayout, useDisplay } from "vuetify";
import StyleDrawer from "@/components/style-ui/StyleDrawer.vue";

const LEFT_PANE_PERCENTAGE = 25
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
const { seNodules, temporaryNodules, hasObjects, actionMode, canvasHeight, canvasWidth } =
  storeToRefs(seStore);

const props = defineProps<{
  documentId?: string;
}>();
const { mainRect } = useLayout();
const display = useDisplay();
const contentHeight = computed(() => display.height.value - mainRect.value.top);
const contentHeightStyle = computed(() => ({
  height: contentHeight.value + "px"
}));
const leftPane: Ref<HTMLElement|null> = ref(null)
// const currentCanvasSize = ref(0); // Result of height calculation will be passed to <v-responsive> via this variable

// function buttonList = buttonList;
const toolboxMinified = ref(false);
const previewClass = ref("");
const constructionInfo = ref<any>({});

let confirmedLeaving = false;
let attemptedToRoute: RouteLocationNormalized | null = null;
let accountEnabled = false;
let uid = "";
let authSubscription!: Unsubscribe;
const userUid = computed((): string | undefined => {
  return appAuth.currentUser?.uid;
});

const unsavedWorkDialog: Ref<DialogAction | null> = ref(null);
const clearConstructionDialog: Ref<DialogAction | null> = ref(null);
const svgDataImage = ref("");

//#region magnificationUpdate
onBeforeMount(() => {
  EventBus.listen("magnification-updated", resizePlottables);
  EventBus.listen("preview-construction", showConstructionPreview);
});
//#endregion magnificationUpdate

const showConstructionPreview = (s: SphericalConstruction | null) => {
  if (s !== null) {
    if (svgDataImage.value === "") previewClass.value = "preview-fadein";
    svgDataImage.value = s.previewData;
    constructionInfo.value.author = s.author;
    constructionInfo.value.count = s.objectCount;
  } else {
    previewClass.value = "preview-fadeout";
    svgDataImage.value = "";
  }
};

const availHeight = ref(100)
const availWidth = ref(100)
function adjustCanvasSize(): void {
  // The MessageHub height is set to 80 pixels
  availWidth.value = display.width.value * (1 - LEFT_PANE_PERCENTAGE/100) - mainRect.value.left - mainRect.value.right;
  availHeight.value =
    display.height.value - mainRect.value.bottom - mainRect.value.top - 80; // quick hack (-24) to leave room at the bottom
  // console.debug(
  //   "adjustCanvasSize() available height is ",
  //   window.innerHeight,
  //   mainRect.value
  // );
  // currentCanvasSize.value = availHeight.value;
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
  window.addEventListener("resize", adjustCanvasSize);
  adjustCanvasSize();

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
  // event[0].size is the width of the left panel (in percentage)
  // 80px is the width of the right navigation drawer
  availWidth.value =
    display.width.value - mainRect.value.left - mainRect.value.right - 80;
  availHeight.value = display.height.value - mainRect.value.top - mainRect.value.bottom - 90;
  // currentCanvasSize.value = Math.min(availWidth.value, availHeight.value);
}

function setActionModeToSelectTool(): void {
  seStore.setActionMode("select");
}

function onWindowResized(): void {
  console.debug("onWindowResized()");
  adjustCanvasSize();
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
// .splitpanes__pane {
  // color: hsla(40, 50%, 50%, 0.6);
  // display: flex;
  // justify-content: center;
  // align-items: center;
  // font-size: 5em;
// }

#sphere-and-msghub {
  // position: relative is required for the parent of v-overlay
  position: relative;
  display: flex;
  justify-content: flex-start;
  // NOTE: DO NOT use column-reverse, otherwise the z-index of Vuetify
  // v-card will be below the TwoJS SVG layers
  flex-direction: column;
  align-items: stretch;
}
#msghub {
  align-self: center;
  position: fixed;
  bottom: 4px;
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

// .anchored {
//   position: absolute;
//   margin: 4px;
// }
// .right {
//   right: 0;
// }

// .top {
//   top: 0;
// }

.previewText {
  position: absolute;
  background-color: #fffd;
  z-index: 30;
  transform: translateX(-50%);
  padding: 0.25em;
  margin: 0.5em;
}
.previewImage {
  position: absolute;
  z-index: 20;
  transform: translateX(-50%);
  // border: 2px solid black;
}
.preview-fadein {
  animation-duration: 500ms;
  animation-name: preview-expand;
}
.preview-fadeout {
  animation-duration: 500ms;
  animation-name: preview-shrink;
}

@keyframes preview-expand {
  0% {
    transform: scale(0.3) translateX(-100%);
  }
  100% {
    transform: translateX(0%) scale(1);
  }
}

@keyframes preview-shrink {
  0% {
    transform: scale(1) translateX(0%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>
