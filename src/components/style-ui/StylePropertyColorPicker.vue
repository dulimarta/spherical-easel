<template>
  <div class="flex-row">
    <span class="text-subtitle-2" :style="{ color: conflict ? 'red' : '' }">
      {{ title }}
      <v-icon
        :color="conflict ? '' : internalColor"
        size="small">
        mdi-circle
      </v-icon>
      <span v-if="numSelected > 1" class="text-subtitle-2 ml-2" style="color: red">
        {{ t("labelStyleOptionsMultiple") }}
      </span>
    </span>
    <v-switch
      id="check-btn"
      :disabled="numSelected == 0 || (conflict && numSelected > 1)"
      v-model="noColorData"
      :label="noDataUILabel"
      color="secondary"
      hide-details
      density="compact"></v-switch>
    <v-tooltip location="bottom" activator="#check-btn">
      {{ isOnLabelPanel ? t("noFillLabelTip") : t("noFillTip") }}
    </v-tooltip>
  </div>
  <div class="flex-row">
    <!-- The color picker -->
    <v-color-picker :disabled="noColorData"
    hide-sliders
    hide-canvas
      show-swatches
      :hide-inputs="!showColorInputs"
      :swatches-max-height="96"
      :swatches="colorSwatches"
      v-model="internalColor"
      mode="hexa"
      id="colorPicker"></v-color-picker>
    <HintButton
      style="align-self: flex-start"
      type="colorInput"
      @click="toggleColorInputs"
      :disabled="noColorData"
      :tooltip="t('showInput')">
      <template #icon>mdi-palette</template>
    </HintButton>
  </div>

  <!-- Show no fill checkbox, color code inputs, Undo and Reset to Defaults buttons -->
  <v-container class="pa-0 ma-0">
    <v-row justify="end" no-gutters align="center">
      <v-col cols="auto"></v-col>
      <v-spacer />
      <v-col cols="auto" class="ma-0 pl-0 pr-0 pt-2 pb-2"></v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUpdate, Ref } from "vue";

import SETTINGS from "@/global-settings";
import Color from "color";
import HintButton from "@/components/HintButton.vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
type ComponentProps = {
  title: string;
  conflict: boolean;
  styleName: string;
  numSelected: number;
};
const props = defineProps<ComponentProps>();
// Internal representation is an object with multiple color representations
let pickedColor = defineModel({ type: String });
const internalColor = ref(pickedColor.value !== "none" ? Color(pickedColor.value).hexa() : undefined)

// The v-color-picker swatch can't be disabled. When "No Fill" is enabled, clicking
// on the color swatch will update the internal color.
let savedInternalColor = internalColor.value

const noColorData: Ref<boolean> = ref(pickedColor.value === "none"); // no data means noFill or noStroke

const isOnLabelPanel = ref(false);

// For TwoJS
// private colorString: string | undefined = "hsla(0, 0%,0%,0)";
const showColorInputs = ref(false);
const colorSwatches = ref(SETTINGS.style.swatches);
const noDataUILabel = ref(t("noFill"));

// Vue component life cycle hook
onMounted((): void => {
  var re = /fill/gi;
  noDataUILabel.value =
    props.styleName.search(re) === -1 ? t("noStroke") : t("noFill"); // the noStroke/noFill option

  var re2 = /label/gi;
  isOnLabelPanel.value = props.title.search(re2) !== -1;
});

watch(() => pickedColor.value, externalColor => {
  if (externalColor !== 'none') {
    noColorData.value = false
  }
}, { deep: true })

watch(() => internalColor.value, (newColor, oldColor) => {
  if (noColorData.value === false) {
    pickedColor.value = Color(newColor).hexa()
  }
})

watch(
  () => noColorData.value,
  (noColor): void => {
    if (noColor) {
      // Keep a copy of the internal color so it can be restored later
      showColorInputs.value = false
      savedInternalColor = internalColor.value
      colorSwatches.value = SETTINGS.style.greyedOutSwatches;
      pickedColor.value = 'none'
    } else {
      internalColor.value = savedInternalColor
      colorSwatches.value = SETTINGS.style.swatches;
      pickedColor.value = internalColor.value
    }
  }
);

function toggleColorInputs(): void {
  showColorInputs.value = !showColorInputs.value;
}

</script>

<style lang="scss" scoped>
@import "@/scss/variables.scss";

.select-an-object-text {
  color: rgb(255, 82, 82);
}
.flex-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
</style>
<i18n lang="json" locale="en">
{
  "showInput": "Show Color Input",
  "labelStyleOptionsMultiple": "(multiple)",
  "noFillLabelTip": "If you want to make the labels only appear on the front of the sphere disable automatic back styling and check 'No Fill' on the Label Back Fill Color. Similarly, to make the labels only appear on the back of the sphere disable automatic back styling and check 'No Fill' on the Label Front Fill Color.",
  "noFill": "No Fill",
  "noFillTip": "Check this to remove the fill or stoke from the selected object(s).",
  "noStroke": "No Stroke"
}
</i18n>
