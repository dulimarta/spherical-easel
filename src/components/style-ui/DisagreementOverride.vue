<template>
  <div
    id="conflict-props"
    v-if="localDisagreement.length > 0"
    class="text-caption font-italic">
    <span>Disagreeing properties: {{ formattedDisagreement }}</span>
    <v-switch
      style="align-self: flex-end"
      v-model="forceAgreement"
      color="warning">
      <template #label>
        <span class="text-caption">
          {{ forceAgreement ? t("forceAgreement") : t("dontForceAgreement") }}
        </span>
      </template>
    </v-switch>
  </div>
</template>
<style>
#conflict-props {
  margin: 0 0.5em;
  display: flex;
  flex-direction: column;
}
</style>
<script lang="ts" setup>
import { useStylingStore } from "@/stores/styling";
import { storeToRefs } from "pinia";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
type ComponentProps = {
  styleProperties: Array<string>;
};
const styleStore = useStylingStore();
const args = defineProps<ComponentProps>();
const { conflictingProperties: allDisagreement, forceAgreement } =
  storeToRefs(styleStore);
const { t } = useI18n();
// const applyToAll = ref(forceAgreement.value;
const localDisagreement = computed(() => {
  if (!allDisagreement.value) return [];
  return Array.from(allDisagreement.value.values())
    .filter(s => {
      const someProp = args.styleProperties.some(p => s === p);
      return someProp;
    })
    .map(s => {
      return t(s);
    });
});
const formattedDisagreement = computed(() => localDisagreement.value.join(","));
</script>
<i18n lang="json" locale="en">
{
  "angleMarkerRadiusPercent": "Angle marker radius (%)",
  "angleMarkerTickMark": "Angle marker ticks",
  "angleMarkerDoubleArc": "Angle marker double arc",
  "angleMarkerArrowHeads": "Angle marker arrow heads",
  "dashArray": "Dash Pattern",
  "dynamicBackStyle": "Dynamic Back Style",
  "dontForceAgreement": "Do not apply edit to all selections",
  "fillColor": "Fill Color",
  "forceAgreement": "Apply edit to all selections",
  "labelBackFillColor": "Fill color (back)",
  "labelDisplayCaption": "Caption",
  "labelDisplayMode": "Display Mode",
  "labelDisplayText": "Label",
  "labelDynamicBackStyle": "Label Dynamic Back Style",
  "labelFrontFillColor": "Fill color (front)",
  "labelTextDecoration": "Text Decoration",
  "labelTextFamily": "Text Family",
  "labelTextRotation": "Text Rotation Angle",
  "labelTextScalePercent": "Text scale (%)",
  "labelTextStyle": "Text Style",
  "pointRadiusPercent": "Point Radius (%)",
  "reverseDashArray": "Reverse Dash Pattern",
  "strokeColor": "Stroke Color",
  "strokeWidthPercent": "Stroke Width (%)"
}
</i18n>
