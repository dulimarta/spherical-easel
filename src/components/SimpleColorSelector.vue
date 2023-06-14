<template>
  <div>
    <div>
      <span class="text-subtitle-2" :style="{ color: conflict ? 'red' : '' }">
        {{ $t(titleKey) + " " }}
      </span>
      <v-icon :color="conflict ? internalColor.hexa : `blue`" size="small">
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
            :open-delay="toolTipOpenDelay"
            :close-delay="toolTipCloseDelay"
            max-width="400px">
            <template v-slot:activator="{ props }">
              <span v-bind="props">
                <v-checkbox
                  v-model="noColorData"
                  :label="noDataUILabel"
                  color="indigo darken-3"
                  hide-details
                  density="compact"
                  @click="changeEvent"></v-checkbox>
              </span>
            </template>
            {{
              isOnLabelPanel
                ? $t("style.noFillLabelTip")
                : $t("style.noFillTip")
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
    <div @click="changeEvent">
      <v-color-picker
        :disabled="noColorData"
        hide-sliders
        hide-canvas
        show-swatches
        :hide-inputs="!showColorInputs"
        :swatches-max-height="100"
        :swatches="colorSwatches"
        v-model="internalColor"
        mode="hsla"
        id="colorPicker"></v-color-picker>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUpdate, Ref } from "vue";

import SETTINGS from "@/global-settings";
// import Nodule from "@/plottables/Nodule";
import { hslaColorType } from "@/types";
import HintButton from "@/components/HintButton.vue";
import i18n from "../i18n";

const NO_HSLA_DATA = "hsla(0, 0%,0%,0)";
// @Component({ components: { HintButton, OverlayWithFixButton } })
// export default class SimpleColorSelector extends Vue {
type ComponentProps = {
  titleKey: string;
  conflict: boolean;
  styleName: string;
  numSelected: number;
  hslaColor: string;
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
const internalColor: Ref<any> = ref({});
const toolTipOpenDelay = SETTINGS.toolTip.openDelay;
const toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

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

function changeEvent(): void {
  // console.log("emit!");
  emit("resetColor");
}
// Vue component life cycle hook
onMounted((): void => {
  // console.log("mounting!", hslaColor);
  if (props.hslaColor !== undefined && props.hslaColor !== null) {
    calculateInternalColorFrom(props.hslaColor);
    // set the noData flag
    if (
      internalColor.value.hsla.h === 0 &&
      internalColor.value.hsla.s === 0 &&
      internalColor.value.hsla.l === 0 &&
      internalColor.value.hsla.a === 0
    ) {
      noColorData.value = true;
    }
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
  //noDataUILabel = `No ${inTitleCase}`;
  // console.log("style name", styleName);
  // console.log("noStrData", noDataStr);
});

onBeforeUpdate((): void => {
  console.log("before update Simple color selector", internalColor.value);
  const col = internalColor.value.hsla;
  console.debug("Color changed to", col);
  const hue = col.h.toFixed(0);
  const sat = (col.s * 100).toFixed(0) + "%";
  const lum = (col.l * 100).toFixed(0) + "%";
  const alpha = col.a.toFixed(3);
  console.debug("update:modelValue", `hsla(${hue},${sat},${lum},${alpha})`);
  emit("update:modelValue", `hsla(${hue},${sat},${lum},${alpha})`);
});

function toggleColorInputs(): void {
  // if (!noData) {
  showColorInputs.value = !showColorInputs.value;
  // } else {
  //   showColorInputs = false;
  // }
}

function convertColorToRGBAString(colorObject: hslaColorType): string {
  // THANK YOU INTERNET!
  const hue = colorObject.h;
  const sat = colorObject.s * 100;
  const lum = colorObject.l;
  const a = (sat * Math.min(lum, 1 - lum)) / 100;
  const f = (n: number): string => {
    const k = (n + hue / 30) % 12;
    const color = lum - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "00");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

watch(() => props.hslaColor, calculateInternalColorFrom);
function calculateInternalColorFrom(hslaString: string): void {
  // console.debug("HSLA string changed", hslaString);
  if (hslaString === undefined) return;

  const parts = hslaString
    .trim()
    .replace(/hsla *\(/, "")
    .replace(")", "")
    .split(",");
  internalColor.value.hsla = {
    h: Number(parts[0]),
    s: Number(parts[1].replace("%", "")) / 100,
    l: Number(parts[2].replace("%", "")) / 100,
    a: Number(parts[3])
  };

  if (noColorData.value) {
    internalColor.value.hexa = convertColorToRGBAString({
      h: 0,
      s: 1,
      l: 1,
      a: 0
    });
  } else {
    internalColor.value.hexa = convertColorToRGBAString(
      internalColor.value.hsla
    );
  }
}

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
      if (
        internalColor.value.hsla.h !== 0 ||
        internalColor.value.hsla.s !== 0 ||
        internalColor.value.hsla.l !== 0 ||
        internalColor.value.hsla.a !== 0
      ) {
        preNoColor = props.hslaColor;
      }
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
