<template>
  <div id="toolbox-and-sphere">
    <AppNavigation
      @drawer-width-changed="
        w => {
          navDrawerWidth = w;
        }
      " />

    <!-- Shortcut icons are placed using absolute positioning. CSS requires
            their parents to have its position set . Use either relative, absolute -->
    <div id="sphere-and-msghub">
      <!-- DO NOT replace v-show below with v-if. Using v-if, SphereFrame instance
       will not be created and there is no TwoJS layer present to render contents -->
      <div id="earthAndCircle" v-show="svgDataImage.length === 0">
        <EarthLayer
          v-if="localIsEarthMode"
          :available-height="availHeight"
          :available-width="availWidth" />
        <SphereFrame
          :available-width="availWidth"
          :available-height="availHeight"
          :is-earth-mode="localIsEarthMode" />
        <StyleDrawer></StyleDrawer>
      </div>
      <div
        v-if="svgDataImage.length !== 0"
        :class="previewClass"
        :style="{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: `${availWidth}px`,
          height: `${availHeight + 6}px`
        }">
        <div
          v-if="constructionInfo !== null"
          :style="{
            // border: '2px solid gray',
            borderRadius: '0.5em',
            padding: '0.25em',
            color: 'white',
            backgroundColor: constructionInfo.publicDocId
              ? colors.green.darken1
              : colors.grey.base
          }">
          <div>
            {{ constructionInfo.description }} ({{
              constructionInfo.objectCount
            }}
            objects)
          </div>
          <div style="font-size: 10pt">
            By {{ constructionInfo.author }} ({{
              constructionInfo.id.substring(0, 6).toUpperCase()
            }}
            <span v-if="constructionInfo.publicDocId">
              Public ID:
              {{ constructionInfo.publicDocId?.substring(0, 6).toUpperCase() }}
            </span>
            )
          </div>
        </div>
        <img
          id="previewImage"
          :src="svgDataImage"
          :width="0.9 * overlayHeight"
          :height="0.9 * overlayHeight" />
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
        <div style="flex-grow: 1">
          <MessageHub />
        </div>
        <!-- <div id="zoomPanel" class="pr-5"> -->
        <ShortcutIcon class="mx-1" :model="TOOL_DICTIONARY.get('zoomFit')!" />
        <ShortcutIcon class="mx-1" :model="TOOL_DICTIONARY.get('zoomIn')!" />
        <ShortcutIcon class="mr-2" :model="TOOL_DICTIONARY.get('zoomOut')!" />
        <div class="mr-1">
          {{ (100 * zoomMagnificationFactor).toFixed(0) }}%
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
import colors from "vuetify/util/colors";
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
import {
  SphericalConstruction,
  ConstructionScript
} from "@/types/ConstructionTypes";
import AngleMarker from "@/plottables/AngleMarker";

import { runScript } from "@/commands/CommandInterpreter";
import Dialog, { DialogAction } from "@/components/Dialog.vue";
import { useSEStore } from "@/stores/se";
import { useConstructionStore } from "@/stores/construction";
import { useAccountStore } from "@/stores/account";
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
import Text from "@/plottables/Text";

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
const acctStore = useAccountStore();
const router = useRouter();
const {
  seNodules,
  temporaryNodules,
  hasObjects,
  zoomMagnificationFactor,
  isEarthMode,
  canvasWidth,
  canvasHeight
} = storeToRefs(seStore);
const { constructionDocId } = storeToRefs(acctStore);
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

const navDrawerWidth = ref(320);
const previewClass = ref("");
const constructionInfo = ref<SphericalConstruction | null>(null);
const localIsEarthMode = ref(false);

let confirmedLeaving = false;
let attemptedToRoute: RouteLocationNormalized | null = null;

const unsavedWorkDialog: Ref<DialogAction | null> = ref(null);
const clearConstructionWarning = ref(false);
const svgDataImage = ref("");
// const svgDataImageAspectRatio = ref(1); // not needed because the svg has an aspect ratio of 1 and the ratio of the canvas width/height doesn't matter!
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
    //   s.preview.substring(0,60)
    // );
    previewClass.value = "preview-fadein";
    svgDataImage.value = s.preview;
    // svgDataImageAspectRatio.value = s.aspectRatio ?? 1;
    constructionInfo.value = s;
  } else {
    previewClass.value = "preview-fadeout";
    svgDataImage.value = "";
  }
};

const availHeight = ref(100);
const availWidth = ref(100);
function adjustCanvasSize(): void {
  // Total navigation drawer width is 400 pixels
  availWidth.value = display.width.value - navDrawerWidth.value - 80;
  // The MessageHub height is set to 50 pixels
  availHeight.value =
    display.height.value - mainRect.value.bottom - mainRect.value.top - 60;
}

function loadDocument(docId: string): void {
  seStore.removeAllFromLayers();
  seStore.init();
  SENodule.resetAllCounters();
  constructionStore
    .loadPublicConstruction(docId)
    .then((script: ConstructionScript | null) => {
      if (script !== null) {
        runScript(script);
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

function setActionModeToSelectTool(): void {
  seStore.setActionMode("select");
}

function handleResetSphere(): void {
  clearConstructionWarning.value = true;
  constructionClearTimer = setTimeout(() => {
    seStore.removeAllFromLayers();
    seStore.init();
    Command.commandHistory.splice(0);
    Command.redoHistory.splice(0);
    Command.saveHistoryLength();
    SENodule.resetAllCounters();
    constructionDocId.value = null;
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
  // console.debug(`Responding to magnification-updated ${e.factor}`)
  Line.updateCurrentStrokeWidthForZoom(e.factor);
  Segment.updateCurrentStrokeWidthForZoom(e.factor);
  Circle.updateCurrentStrokeWidthForZoom(e.factor);
  AngleMarker.updateCurrentStrokeWidthAndRadiusForZoom(e.factor);
  Point.updatePointScaleFactorForZoom(e.factor);
  Label.updateTextScaleFactorForZoom(e.factor);
  Ellipse.updateCurrentStrokeWidthForZoom(e.factor);
  Parametric.updateCurrentStrokeWidthForZoom(e.factor);
  Text.updateTextScaleFactorForZoom(e.factor);

  // Apply the new size in each nodule in the store
  seNodules.value.forEach(p => {
    p.ref?.adjustSize();
    // p.ref?.stylize(DisplayStyle.ApplyCurrentVariables)
  });
  // The temporary plottables need to be resized too
  temporaryNodules.value.forEach(p => {
    p.adjustSize();
  });
}
//#endregion resizePlottables

function doLeave(): void {
  confirmedLeaving = true;
  if (attemptedToRoute) router.replace({ path: attemptedToRoute.path });
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
    console.debug(`BeforeRouteLeave`, Command.isConstructionModified());
    if (
      hasObjects.value &&
      Command.isConstructionModified() &&
      !confirmedLeaving
    ) {
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
</script>
<style scoped lang="scss">
#sphere-and-msghub {
  height: 100%;
  display: flex;
  justify-content: flex-start;
  // NOTE: DO NOT use column-reverse, otherwise the z-index of Vuetify
  // v-card will be below the TwoJS SVG layers
  flex-direction: column;
}

#msghub {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 3em;
  padding-left: 4px;
  padding-right: 4px;
}

.previewImage {
  position: absolute;
  background-color: violet;
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

#earthAndCircle {
  display: flex;
  flex-direction: column;
  align-items: center;
}

#zoomPanel {
  display: flex;
  align-items: center;
  border-radius: 8px;
  border: solid white;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
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
