<template>
  <!-- Displays the current tool in the left panel by the collapsible arrow -->
  <span v-if="actionMode">
    <v-container>
      <v-row align="center" :style="rowHeight">
        <!-- Vuetify custom icons require a '$' prefix -->
        <v-icon class="mx-3" :icon="'$' + actionMode" :size="iconSize"></v-icon>
        <!-- Checks if ApplyTransformation is selected and changes the display accordingly. -->
        <span
          class="text-body-1 ml-1"
          v-if="actionMode != 'applyTransformation'">
          {{ t(`buttons.${activeToolName}`, {}) }}
        </span>
        <template v-else>
          <div class="text-body-1">
            {{ t(`buttons.${activeToolName}`, {}) }}
          </div>
          <div class="text-body-2">
            {{ t("objects.selectTransformation") }}
          </div>
        </template>
      </v-row>
      <v-row v-if="toolHint !== null">
        <span
          :style="{
            maxWidth: '25em',
            height: '4em'
          }"
          class="text-caption font-italic mb-2">
          {{ toolHint }}
        </span>
      </v-row>
    </v-container>
  </span>
  <span class="text-body-1" v-else>
    {{ t(`buttons.NoToolSelected`, {}).toString() }}
  </span>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from "vue";
import { useSEStore } from "@/stores/se";
import { useI18n } from "vue-i18n";
// import EventBus from "@/eventHandlers-spherical/EventBus";
import { ActionMode } from "@/types";
import { storeToRefs } from "pinia";
import SETTINGS from "@/global-settings";
import EventBus from "@/eventHandlers-spherical/EventBus";
import { TOOL_DICTIONARY } from "./tooldictionary";
import { Handler } from "mitt";

// Associate each ActionMode with the corresponding I18N key

const ACTION_MODE_MAP: Map<ActionMode, string> = new Map([
  ["angle", "CreateAngleDisplayedName"],
  ["antipodalPoint", "CreateAntipodalPointDisplayedName"],
  ["circle", "CreateCircleDisplayedName"],
  ["coordinate", "CreateCoordinateDisplayedName"],
  ["delete", "DeleteDisplayedName"],
  ["ellipse", "CreateEllipseDisplayedName"],
  ["hide", "HideDisplayedName"],
  ["iconFactory", "CreateIconDisplayedName"],
  ["intersect", "CreateIntersectionDisplayedName"],
  ["line", "CreateLineDisplayedName"],
  ["move", "MoveDisplayedName"],
  ["perpendicular", "CreatePerpendicularDisplayedName"],
  ["tangent", "CreateTangentDisplayedName"],
  ["point", "CreatePointDisplayedName"],
  ["pointDistance", "CreatePointDistanceDisplayedName"],
  ["pointOnObject", "CreatePointOnOneDimDisplayedName"],
  ["polar", "CreatePolarDisplayedName"],
  ["rotate", "RotateDisplayedName"],
  ["segment", "CreateLineSegmentDisplayedName"],
  ["segmentLength", "CreateSegmentLengthDisplayedName"],
  ["select", "SelectDisplayedName"],
  ["toggleLabelDisplay", "ToggleLabelDisplayedName"],
  ["zoomFit", "ZoomFitDisplayedName"],
  ["zoomIn", "PanZoomInDisplayedName"],
  ["zoomOut", "PanZoomOutDisplayedName"],
  ["measureTriangle", "MeasureTriangleDisplayedName"],
  ["measurePolygon", "MeasurePolygonDisplayedName"],
  ["midpoint", "CreateMidpointDisplayedName"],
  ["nSectPoint", "CreateNSectSegmentDisplayedName"],
  ["angleBisector", "CreateAngleBisectorDisplayedName"],
  ["nSectLine", "CreateNSectAngleDisplayedName"],
  ["threePointCircle", "CreateThreePointCircleDisplayedName"],
  ["measuredCircle", "CreateMeasuredCircleDisplayedName"],
  ["translation", "CreateTranslationDisplayedName"],
  ["rotation", "CreateRotationDisplayedName"],
  ["reflection", "CreateReflectionDisplayedName"],
  ["pointReflection", "CreatePointReflectionDisplayedName"],
  ["inversion", "CreateInversionDisplayedName"],
  ["applyTransformation", "ApplyTransformationDisplayedName"],
  // Use the following entry to define a new tool
  ["dummy", "DummyDisplayedName"],
  ["text", "TextDisplayedName"]
]);

const seStore = useSEStore();
const { actionMode } = storeToRefs(seStore);
const { t } = useI18n();
const toolHint = ref<string | null>(null);
const iconSize = ref(SETTINGS.icons.currentToolSectionIconSize);
const rowHeight = ref(
  "min-height:" + SETTINGS.icons.currentToolSectionIconSize + "px"
);
// applyTransformationText.value = i18n
//   .t(`objects.selectTransformation`)
//   .toString();

const activeToolName = computed((): string => {
  const i18nKey = ACTION_MODE_MAP.get(actionMode.value);
  return i18nKey ? i18nKey : `Unmapped actionMode ${actionMode.value}`;
});

type MessageType = {
  key: string;
  keyOptions?: unknown;
  secondaryMsg: string;
  secondaryMsgKeyOptions: string;
  type: string;
  timestamp: number;
};
onMounted((): void => {
  setIconSize();
  EventBus.listen("show-alert", ((m: MessageType) => {
    // console.debug("Incoming message", m);
    if (m.type === "directive") {
      toolHint.value = "";
      setTimeout(() => {
        toolHint.value = t(m.secondaryMsg);
      }, 300);
    }
  }) as Handler<unknown>);
  //Added to make the initial action mode show when app is loaded for the first time or the clear button is clicked
  const associatedButton = TOOL_DICTIONARY.get(actionMode.value);
  if (associatedButton) {
    toolHint.value = t(associatedButton.toolUseMessage);
  }
});

watch(
  () => actionMode.value,
  (): void => {
    setIconSize();
  }
);

function setIconSize(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const zIcons = SETTINGS.icons as unknown as Record<ActionMode, any>;
  // console.log(
  //   actionMode.value,
  //   zIcons[actionMode.value].props,
  //   typeof zIcons[actionMode.value].props.mdiIcon == "string"
  // );
  if (
    zIcons[actionMode.value] &&
    zIcons[actionMode.value].props &&
    typeof zIcons[actionMode.value].props.mdiIcon == "string"
  ) {
    iconSize.value = SETTINGS.icons.currentToolSectionIconSize * 0.75; // mdiIcons are smaller
  } else {
    iconSize.value = SETTINGS.icons.currentToolSectionIconSize;
  }
}
//The next 3 functions are for the text for the applied transformation.
// onBeforeMount((): void => {
//   console.debug("CurrentToolSelection: setting up event bus listener");
//   // EventBus.listen("set-apply-transformation-footer-text", additionalFooterText);
// });

// function additionalFooterText(e: { text: string }): void {
//   console.debug("apply transform", e.text);
//   applyTransformationText.value = e.text;
// }
</script>

<style></style>
