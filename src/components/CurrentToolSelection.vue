<template>
  <!-- Displays the current tool in the left panel by the collapsible arrow -->
  <span v-if="actionMode">
    <v-container>
      <v-row align="center">
        <!-- Vuetify custom icons require a '$' prefix -->
        <v-icon class="mx-3" :icon="'$' + actionMode"></v-icon>
        <!-- Checks if ApplyTransformation is selected and changes the display accordingly. -->
        <span
          class="text-body-1 ml-1"
          v-if="actionMode != 'applyTransformation'">
          {{ $t(`buttons.${activeToolName}`, {}) }}
        </span>
        <template v-else>
          <div class="text-body-1">
            {{ $t(`buttons.${activeToolName}`, {}) }}
          </div>
          <div class="text-body-2">
            {{ t("objects.selectTransformation") }}
          </div>
        </template>
      </v-row>
    </v-container>
  </span>
  <span class="text-body-1" v-else>
    {{ $t(`buttons.NoToolSelected`, {}).toString() }}
  </span>
</template>

<script lang="ts" setup>
import { ref, onBeforeMount, computed, onBeforeUnmount, onMounted } from "vue";
import { useSEStore } from "@/stores/se";
import { useI18n } from "vue-i18n";
// import EventBus from "@/eventHandlers/EventBus";
import { ActionMode } from "@/types";
import { storeToRefs } from "pinia";

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
  ["measuredCircle", "MeasureCircleDisplayedName"],
  ["translation", "CreateTranslationDisplayedName"],
  ["rotation", "CreateRotationDisplayedName"],
  ["reflection", "CreateReflectionDisplayedName"],
  ["pointReflection", "CreatePointReflectionDisplayedName"],
  ["inversion", "CreateInversionDisplayedName"],
  ["applyTransformation", "ApplyTransformationDisplayedName"]
]);

const seStore = useSEStore();
const { actionMode } = storeToRefs(seStore);
const { t } = useI18n();
const applyTransformationText = ref("");
// applyTransformationText.value = i18n
//   .t(`objects.selectTransformation`)
//   .toString();

const activeToolName = computed((): string => {
  const i18nKey = ACTION_MODE_MAP.get(actionMode.value);
  return i18nKey ? i18nKey : `Unmapped actionMode ${actionMode.value}`;
});

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
