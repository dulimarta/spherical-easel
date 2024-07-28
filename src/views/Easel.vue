<template>
  <div
    style="
      position: fixed;
      right: 8px;
      width: 80px;
      top: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      z-index: 1;
    ">
    <!-- <div style="height: 60%; background: white; border: 1px solid black; border-radius: 0.5em;"> -->
    <StyleDrawer></StyleDrawer>
    <!-- </div> -->
  </div>
  <!--v-navigation-drawer location="end" width="80" permanent floating style="height: 70vh; margin: auto;
  background-color: transparent;">
  </!--v-navigation-drawer-->
  <div id="toolbox-and-sphere">
    <div id="toolbox">
      <AppNavigation id="toolbox" ref="toolbox" />
    </div>

    <!-- Shortcut icons are placed using absolute positioning. CSS requires
            their parents to have its position set . Use either relative, absolute -->
    <div id="sphere-and-msghub">
      <div id="earthAndCircle" v-if="svgDataImage.length === 0">
        <EarthLayer
          v-if="localIsEarthMode"
          :available-height="availHeight"
          :available-width="availWidth" />
        <SphereFrame
          style="position: relative"
          :available-width="availWidth"
          :available-height="availHeight"
          :is-earth-mode="localIsEarthMode" />
        <!--v-switch
          hide-details
          color="primary"
          :class="['earthToggler', 'bg-blue-lighten-2']"
          density="compact"
          variant="outlined"
          v-model="localIsEarthMode"
          @click="setEarthModeFunction()"
          label="Earth Mode"
        >
          <template
            #append
            v-if="localIsEarthMode"
          >
            <v-icon id="placeBubble">$earthPoint</v-icon>
            <v-menu
              activator="#placeBubble"
              location="right"
              :offset="[24, 16]"
              :close-on-content-click="false"
            >
              <Suspense>
                <AddressInput />
              </Suspense>
            </v-menu>
          </template>
        <v-switch-->
      </div>
      <div v-else :class="['justify-center', 'align-start', previewClass]">
        <!--Aspect ratio {{ svgDataImageAspectRatio }} -->
        <!--div class="previewText">
          <p>{{ constructionInfo.count }} objects.</p>
          <p>Created by: {{ constructionInfo.author }}</p>
        </!--div-->
        <img
          id="previewImage"
          :src="svgDataImage"
          :width="overlayHeight * svgDataImageAspectRatio"
          :height="overlayHeight" />
      </div>
      <div id="msghub">
        <ShortcutIcon
          class="mx-1"
          v-for="t in leftShortcutGroup"
          :key="t.action"
          :model="t" />
        <ShortcutIcon
          :disabled="!hasObjects"
          class="mx-1"
          :model="TOOL_DICTIONARY.get('resetAction')!" />
        <MessageHub />
        <div id="zoomPanel" class="pr-5">
          <div style="display: flex">
            <ShortcutIcon
              :isShortcutTool="true"
              class="mx-1"
              :model="TOOL_DICTIONARY.get('zoomFit')!" />
            <div class="horizontalLine"></div>
          </div>
          <div style="display: flex">
            <ShortcutIcon
              :isShortcutTool="true"
              class="mx-1"
              :model="TOOL_DICTIONARY.get('zoomOut')!" />
            <div class="horizontalLine"></div>
          </div>
          <div style="display: flex">
            <ShortcutIcon
              :isShortcutTool="true"
              class="mx-1"
              :model="TOOL_DICTIONARY.get('zoomIn')!" />
            <div class="horizontalLine"></div>
          </div>
          <span style="padding-left: 15px">
            {{ (100 * zoomMagnificationFactor).toFixed(2) }}
          </span>
          <!-- <v-slider
              v-model="zoomMagnificationFactor"
              :min="0.1"
              :max="2"
              style="min-width: 100px" /> -->
        </div>
      </div>
    </div>
    <Dialog
      ref="unsavedWorkDialog"
      max-width="40%"
      :title="t('unsavedConstructionsConfirmation')"
      :yes-text="t('constructionsKeep')"
      :no-text="t('constructionsDiscard')"
      :no-action="doLeave">
      {{ t(`unsavedConstructionsMessage`) }}
    </Dialog>
    <v-snackbar v-model="clearConstructionWarning" :timeout="DELETE_DELAY">
      {{ t("clearConstructionMessage") }}
      <template #actions>
        <v-btn @click="cancelClearConstruction" color="warning">
          {{ t("undo") }}
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script lang="ts" setup>
import {
  computed,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  Ref,
  ref,
  watch
} from "vue";
import AppNavigation from "@/components/AppNavigation.vue";
import SphereFrame from "@/components/SphereFrame.vue";
import EarthLayer from "@/components/EarthLayer.vue";
// import AddEarthObject from "@/components/AddEarthObject.vue";
import MessageHub from "@/components/MessageHub.vue";
// import AddressInput from "@/components/AddressInput.vue";
import ShortcutIcon from "@/components/ShortcutIcon.vue";
/* Import Command so we can use the command paradigm */
import { Command } from "@/commands/Command";
import EventBus from "../eventHandlers/EventBus";

import Circle from "@/plottables/Circle";
import Point from "@/plottables/Point";
import Line from "@/plottables/Line";
import Label from "@/plottables/Label";
import Segment from "@/plottables/Segment";
import Ellipse from "@/plottables/Ellipse";
import { SENodule } from "@/models/SENodule";
import { SphericalConstruction } from "@/types";
import AngleMarker from "@/plottables/AngleMarker";

import { run } from "@/commands/CommandInterpreter";
import { ConstructionScript } from "@/types";
import Dialog, { DialogAction } from "@/components/Dialog.vue";
import { useSEStore } from "@/stores/se";
import { useConstructionStore } from "@/stores/construction";
import Parametric from "@/plottables/Parametric";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import {
  onBeforeRouteLeave,
  RouteLocationNormalized,
  useRouter
} from "vue-router";
import { useLayout, useDisplay } from "vuetify";
import StyleDrawer from "@/components/style-ui/StyleDrawer.vue";
import { TOOL_DICTIONARY } from "@/components/tooldictionary";

const LEFT_PANE_PERCENTAGE = 25;
const DELETE_DELAY = 5000; // in milliseconds
/**
 * Split panel width distribution (percentages):
 * When both side panels open: 20:60:20 (proportions 1:3:1)
 * When left panel open, right panel minified: 20:75:5 (4:15:1)
 * When left panel minifie, right panel open: 5:75:20 (1:15:4)
 */
const { t } = useI18n();
const seStore = useSEStore();
const constructionStore = useConstructionStore();
const router = useRouter();
const {
  seNodules,
  temporaryNodules,
  hasObjects,
  zoomMagnificationFactor,
  isEarthMode
} = storeToRefs(seStore);
const props = defineProps<{
  documentId?: string;
}>();
const { mainRect } = useLayout();
const display = useDisplay();
const contentHeight = computed(() => display.height.value - mainRect.value.top);
const overlayHeight = computed(() => contentHeight.value - 60);

const leftShortcutGroup = computed(() => [
  TOOL_DICTIONARY.get("undoAction")!,
  TOOL_DICTIONARY.get("redoAction")!
]);
// const rightShortcutGroup = computed(() => [
//   TOOL_DICTIONARY.get("zoomOut")!,
//   TOOL_DICTIONARY.get("zoomIn")!,
//   TOOL_DICTIONARY.get("zoomFit")!
// ]);

// const leftPane: Ref<HTMLElement | null> = ref(null);
// const currentCanvasSize = ref(0); // Result of height calculation will be passed to <v-responsive> via this variable

// function buttonList = buttonList;
// const toolboxMinified = ref(false);
const previewClass = ref("");
const constructionInfo = ref<any>({});
const localIsEarthMode = ref(false);

let confirmedLeaving = false;
let attemptedToRoute: RouteLocationNormalized | null = null;

const unsavedWorkDialog: Ref<DialogAction | null> = ref(null);
const clearConstructionWarning = ref(false);
const svgDataImage = ref("");
const svgDataImageAspectRatio = ref(1);
let constructionClearTimer: any;

//#region magnificationUpdate
onBeforeMount(() => {
  EventBus.listen("magnification-updated", resizePlottables);
  EventBus.listen("preview-construction", showConstructionPreview);
});
//#endregion magnificationUpdate

const showConstructionPreview = (s: SphericalConstruction | null) => {
  if (s !== null) {
    // console.debug(
    //   "Previewing construction",
    //   s.id,
    //   " preview image ",
    //   s.preview
    // );
    if (svgDataImage.value === "") previewClass.value = "preview-fadein";
    svgDataImage.value = s.preview;
    svgDataImageAspectRatio.value = s.aspectRatio ?? 1;
    constructionInfo.value.author = s.author;
    constructionInfo.value.count = s.objectCount;
  } else {
    previewClass.value = "preview-fadeout";
    svgDataImage.value = "";
  }
};

const availHeight = ref(100);
const availWidth = ref(100);
function adjustCanvasSize(): void {
  // The MessageHub height is set to 80 pixels
  availWidth.value =
    display.width.value * (1 - LEFT_PANE_PERCENTAGE / 100) -
    mainRect.value.left -
    mainRect.value.right;
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
  constructionStore
    .loadPublicConstruction(docId)
    .then((script: ConstructionScript | null) => {
      if (script !== null) {
        run(script);
        seStore.updateDisplay();
      } else {
        EventBus.fire("show-alert", {
          key: "constructions.constructionNotFound",
          keyOptions: { docId: docId },
          type: "error"
        });
      }
    });

  // Nodule.resetIdPlottableDescriptionMap(); // Needed?
  // load the script from public collection
}

/** mounted() is part of VueJS lifecycle hooks */
onMounted((): void => {
  window.addEventListener("resize", adjustCanvasSize);
  adjustCanvasSize();

  if (props.documentId) loadDocument(props.documentId);
  EventBus.listen("set-action-mode-to-select-tool", setActionModeToSelectTool);
  EventBus.listen("initiate-clear-construction", handleResetSphere);
  window.addEventListener("keydown", handleKeyDown);
});

onBeforeUnmount((): void => {
  EventBus.unlisten("set-action-mode-to-select-tool");
  window.removeEventListener("keydown", handleKeyDown);
});

/**
 * Split pane resize handler
 * @param event an array of numeric triplets {min: ____, max: ____, size: ____}
 */
// function dividerMoved(
//   event: Array<{ min: number; max: number; size: number }>
// ): void {
//   // event[0].size is the width of the left panel (in percentage)
//   // 80px is the width of the right navigation drawer
//   availWidth.value =
//     display.width.value - mainRect.value.left - mainRect.value.right - 80;
//   availHeight.value =
//     display.height.value - mainRect.value.top - mainRect.value.bottom - 90;
//   // currentCanvasSize.value = Math.min(availWidth.value, availHeight.value);
// }

function setActionModeToSelectTool(): void {
  seStore.setActionMode("select");
}

// function onWindowResized(): void {
//   console.debug("onWindowResized()");
//   adjustCanvasSize();
// }

function handleResetSphere(): void {
  clearConstructionWarning.value = true;
  constructionClearTimer = setTimeout(() => {
    seStore.removeAllFromLayers();
    seStore.init();
    Command.commandHistory.splice(0);
    Command.redoHistory.splice(0);
    SENodule.resetAllCounters();
    EventBus.fire("undo-enabled", { value: Command.commandHistory.length > 0 });
    EventBus.fire("redo-enabled", { value: Command.redoHistory.length > 0 });
    // Nodule.resetIdPlottableDescriptionMap(); // Needed?
  }, DELETE_DELAY);
}

function cancelClearConstruction() {
  if (constructionClearTimer) {
    clearTimeout(constructionClearTimer);
    constructionClearTimer = null;
  }
  clearConstructionWarning.value = false;
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
  seNodules.value.forEach(p => {
    p.ref?.adjustSize();
  });
  // The temporary plottables need to be resized too
  temporaryNodules.value.forEach(p => {
    p.adjustSize();
  });
}
//#endregion resizePlottables

function doLeave(): void {
  confirmedLeaving = true;
  if (attemptedToRoute) router.push({ path: attemptedToRoute.path });
}

//When the SetEarthModeCommand is undone, we need to watch the isEarthMode variable in the store
// so setting isEarthMode in the store updates the localIsEarthMode variable and the vue component updates
watch(
  () => isEarthMode.value,
  () => {
    localIsEarthMode.value = !localIsEarthMode.value;
  }
);

onBeforeRouteLeave(
  (
    toRoute: RouteLocationNormalized,
    // eslint-disable-next-line no-unused-vars
    _: RouteLocationNormalized
  ): boolean => {
    if (hasObjects.value && !confirmedLeaving) {
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

// function handleToolboxMinify(state: boolean) {
//   toolboxMinified.value = state;
// }
</script>
<style scoped lang="scss">
#sphere-and-msghub {
  // position: relative is required for the parent of v-overlay
  position: relative;
  // height 100% is also required to to keep message hub at the bottom
  // during SVG preview
  height: 100%;
  display: flex;
  justify-content: flex-start;
  background-color: white;
  // NOTE: DO NOT use column-reverse, otherwise the z-index of Vuetify
  // v-card will be below the TwoJS SVG layers
  flex-direction: column;
  align-items: stretch;
}

#msghub {
  align-self: center;
  position: absolute;
  bottom: 4px;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: stretch;
  gap: 4px;
  padding-left: 5px;
  padding-right: 5px;
}

#toolbox {
  // height: 100%;
  // overflow: auto;
  // display: flex;
}

.previewText {
  position: absolute;
  background-color: #fffd;
  border: 2px solid grey;
  border-radius: 0.5em;
  transform: translateX(-50%);
  z-index: 30;
  padding: 0.25em;
  margin: 0.5em;
  width: 20em;
}

.previewImage {
  position: absolute;
  z-index: 20;
  aspect-ratio: 1/1;
  transform: translateX(-50%);
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

/* Use class instead of id when applying to a vuetify builtin component.
 * Looks like IDs are not preserved after built */

.earthToggler {
  position: absolute;
  bottom: 88px;
  left: 12px;
  margin: 0;
  padding: 0 1em;
  border-radius: 8px;
  align-self: flex-start;
}

.displayEarthObject {
  position: absolute;
  bottom: 140px;
  left: 12px;
  margin: 0;
  padding: 0 0em;
  border-radius: 8px;
  align-self: flex-start;
}

#earthAndCircle {
  display: flex;
  flex-direction: column;
  align-items: center;
}

#undoPanel {
  border-radius: 8px;
  border: solid white;
  display: flex;
  align-items: center;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
}

#zoomPanel {
  display: flex;
  align-items: center;
  border-radius: 8px;
  border: solid white;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
}

.horizontalLine {
  background-color: black;
  width: 1px;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  // height: 80%;
}

#toolbox-and-sphere {
  display: flex;
  position: fixed;

  flex-direction: row;
  width: 100%;
  justify-content: stretch;
  height: 100%;
}
</style>
<i18n locale="en" lang="json">
{
  "clearConstructionMessage": "The current construction will be cleared",
  "unsavedConstructionsMessage": "You have unsaved constructions. Keep or discard?",
  "unsavedConstructionsConfirmation": "Unsaved Constructions",
  "constructionsDiscard": "Discard",
  "constructionsKeep": "Keep",
  "undo": "Undo"
}
</i18n>
