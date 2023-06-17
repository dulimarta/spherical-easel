<template>
  <div>
    <span class="text-subtitle-2" :style="{ color: conflict ? 'red' : '' }">
      {{ $t(titleKey) + " " }}
    </span>
    <v-icon
      :color="conflict ? '' : internalColor"
      size="small"
      v-show="noColorData === false">
      mdi-checkbox-blank
    </v-icon>
    <span v-if="numSelected > 1" class="text-subtitle-2" style="color: red">
      {{ " " + $t("style.labelStyleOptionsMultiple") }}
    </span>
  </div>

  <!-- Show no fill checkbox, color code inputs, Undo and Reset to Defaults buttons -->
  <v-container class="pa-0 ma-0">
    <v-row justify="end" no-gutters align="center">
      <v-col cols="auto">
        <v-tooltip
          location="bottom"
          max-width="400px">
          <template v-slot:activator="{ props }">
            <span v-bind="props">
              <v-checkbox
                v-model="noColorData"
                :label="noDataUILabel"
                color="indigo darken-3"
                hide-details
                density="compact"
                @click="toggleNoColor"></v-checkbox>
            </span>
          </template>
          {{
            isOnLabelPanel ? $t("style.noFillLabelTip") : $t("style.noFillTip")
          }}
        </v-tooltip>
      </v-col>
      <v-spacer />
      <v-col cols="auto" class="ma-0 pl-0 pr-0 pt-2 pb-2">
        <HintButton
          type="colorInput"
          @click="toggleColorInputs"
          :disabled="noColorData"
          i18n-label="style.showColorInputs"
          i18n-tooltip="style.showColorInputsToolTip"></HintButton>
      </v-col>
    </v-row>
  </v-container>
  <!-- The color picker -->
  <v-color-picker
    :disabled="noColorData"
    hide-sliders
    hide-canvas
    :show-swatches="!noColorData"
    :hide-inputs="!showColorInputs"
    :swatches-max-height="96"
    :swatches="colorSwatches"
    v-model="internalColor"
    mode="hexa"
    id="colorPicker"
    @update:model-value="colorChanged"></v-color-picker>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUpdate, Ref } from "vue";

import SETTINGS from "@/global-settings";
// import Nodule from "@/plottables/Nodule";
import { hslaColorType } from "@/types";
import Color from "color";
import HintButton from "@/components/HintButton.vue";
import i18n from "@/i18n";

const NO_HSLA_DATA = "hsla(0, 0%,0%,0)";
// @Component({ components: { HintButton, OverlayWithFixButton } })
// export default class SimpleColorSelector extends Vue {
type ComponentProps = {
  titleKey: string;
  conflict: boolean;
  styleName: string;
  numSelected: number;
  modelValue?: string;
};
// @Prop() readonly titleKey!: string;
// @Prop() conflict!: boolean;
// external representation: hsla in CSS
// @PropSync("data") hslaColor!: string;
// @Prop({ required: true }) readonly styleName!: string;
// @Prop() readonly numSelected!: number;
const props = defineProps<ComponentProps>();
const emit = defineEmits(["resetColor", "update:modelValue"]);
// Internal representation is an object with multiple color representations
const internalColor: Ref<string> = ref("#FF00FF00");

const noColorData = ref(false); // no data means noFill or noStroke
let preNoColor: string = NO_HSLA_DATA;

const isOnLabelPanel = ref(false);

// private boxSampleColor: string = "";

// For TwoJS
// private colorString: string | undefined = "hsla(0, 0%,0%,0)";
const showColorInputs = ref(false);

const colorSwatches = ref(SETTINGS.style.swatches);
let noDataStr = "";
const noDataUILabel = ref(i18n.global.t("style.noFill"));

function toggleNoColor(ev: PointerEvent): void {
  console.log("What is toggle flag?", noColorData.value);
  // emit("update:modelValue", noColorData.value ? "none" : Color(internalColor).hsl())
  // emit("resetColor");
}
function colorChanged(arg: string) {
  let newColor = Color(arg).hsl().string();
  const toks = newColor.split(",");
  // Note: the Color function does not product the alpha value
  // we have to insert the alpha value manually
  if (toks.length == 3) { // only three tokens, missing the alpha value
    newColor = newColor.replace(/\)$/, ", 1.0)").replace(/^hsl/, "hsla");
  }
  console.log("Color changed to", arg, newColor);
  emit("update:modelValue", newColor);
}
// Vue component life cycle hook
onMounted((): void => {
  // console.log("mounting!", hslaColor);
  if (props.modelValue !== undefined && props.modelValue !== null) {
    internalColor.value = Color(props.modelValue).hexa();
  }
  // boxSampleColor = internalColor.hexa;
  // If these commands are in the beforeUpdate() method they are executed over and over but
  // they only need to be executed once.
  const propName = props.styleName.replace("Color", "");
  const firstLetter = props.styleName.charAt(0);
  const inTitleCase = firstLetter.toUpperCase() + propName.substring(1);
  noDataStr = `no${inTitleCase}`;
  var re = /fill/gi;
  noDataUILabel.value =
    props.styleName.search(re) === -1
      ? i18n.global.t("style.noStroke")
      : i18n.global.t("style.noFill"); // the noStroke/noFill option

  var re2 = /label/gi;
  isOnLabelPanel.value = props.titleKey.search(re2) !== -1;
});

// onBeforeUpdate((): void => {
//   console.log("before update Simple color selector", internalColor.value);
// const col = internalColor.value.hsla;
// console.debug("Color changed to", col);
// const hue = col.h.toFixed(0);
// const sat = (col.s * 100).toFixed(0) + "%";
// const lum = (col.l * 100).toFixed(0) + "%";
// const alpha = col.a.toFixed(3);
// console.debug("update:modelValue", `hsla(${hue},${sat},${lum},${alpha})`);
// emit("update:modelValue", `hsla(${hue},${sat},${lum},${alpha})`);
// });

function toggleColorInputs(): void {
  // if (!noData) {
  showColorInputs.value = !showColorInputs.value;
  // } else {
  //   showColorInputs = false;
  // }
}

watch(
  () => props.modelValue,
  (hsla: string | undefined) => {
    // internalColor.value = Color(hsla).hexa()
  }
);

watch(
  () => noColorData.value,
  (noColor): void => {
    // console.debug(
    //   "Saved HSLA",
    //   preNoColor,
    //   "current HSLA",
    //   hslaColor
    // );
    if (noColor) {
      // if (
      //   internalColor.value.hsla.h !== 0 ||
      //   internalColor.value.hsla.s !== 0 ||
      //   internalColor.value.hsla.l !== 0 ||
      //   internalColor.value.hsla.a !== 0
      // ) {
      //   preNoColor = props.hslaColor;
      // }
      //preNoColor = hslaColor;
      // emit('update:modelValue', NO_HSLA_DATA);
      showColorInputs.value = false;
      colorSwatches.value = SETTINGS.style.greyedOutSwatches;
    } else {
      // emit("update:modelValue", preNoColor)
      colorSwatches.value = SETTINGS.style.swatches;
      // showColorInputs = true;
      //   // colorData = Nodule.convertStringToHSLAObject(colorString);
    }
    // If color selector is on the label panel, then all changes are directed at the label(s).
  }
);
</script>

<style lang="scss" scoped>
@import "@/scss/variables.scss";

.select-an-object-text {
  color: rgb(255, 82, 82);
}
</style>
