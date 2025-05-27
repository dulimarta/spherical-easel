<template>
  <PopOverTabs
    :show-popup="showPopup!"
    :name="t('label', i18nMessageSelector())"
    :disabled="selectedLabels.size < 1"
    @pop-up-shown="displayAllLabels()">
    <template #tabs>
      <v-tab>
        <v-icon>mdi-pencil</v-icon>
      </v-tab>
      <v-tab><v-icon>mdi-format-text</v-icon></v-tab>
      <v-tab><v-icon>mdi-palette</v-icon></v-tab>
    </template>
    <template #pages>
      <v-window-item>
        <!-- First Tab-->
        <v-text-field
          v-model="styleOptions.labelDisplayText"
          :disabled="
            selectedLabels.size < 1 || hasDisagreement('labelDisplayText')
          "
          :label="t('labelText', i18nMessageSelector())"
          :counter="!hasLabelObject() ? 1000 : maxLabelDisplayTextLength"
          :class="{
            shake: animatedInput.labelDisplayText,
            conflict: conflictItems.labelDisplayText
          }"
          variant="outlined"
          density="compact"
          :placeholder="placeHolderText(selectedLabels.size, false)"
          :error-messages="
            t(labelDisplayTextErrorMessageKey, {
              max: maxLabelDisplayTextLength
            })
          "
          :rules="[
            labelDisplayTextCheck,
            labelDisplayTextTruncate(styleOptions)
          ]"></v-text-field>
        <v-text-field
          :disabled="
            selectedLabels.size < 1 ||
            hasDisagreement('labelDisplayCaption') ||
            !hasCaption(styleOptions)
          "
          v-model.lazy="styleOptions.labelDisplayCaption"
          v-bind:label="t('labelCaption')"
          :counter="maxLabelDisplayCaptionLength"
          :placeholder="placeHolderText(selectedLabels.size, true)"
          ref="labelDisplayCaption"
          :class="{
            shake: animatedInput.labelDisplayCaption,
            conflict: conflictItems.labelDisplayCaption
          }"
          variant="outlined"
          density="compact"
          @keypress="conflictItems.labelDisplayCaption = false"
          v-bind:error-messages="
            t(labelDisplayCaptionErrorMessageKey, {
              max: maxLabelDisplayCaptionLength
            })
          "
          :rules="[
            labelDisplayCaptionCheck,
            labelDisplayCaptionTruncate(styleOptions)
          ]"></v-text-field>
        <PropertySlider
          :numSelected="selectedLabels.size"
          v-model="styleOptions.labelTextScalePercent"
          :title="t('labelTextScale', i18nMessageSelector())"
          :color="conflictItems.labelTextScalePercent ? 'red' : ''"
          :conflict="hasDisagreement('labelTextScalePercent')"
          :class="{ shake: animatedInput.labelTextScalePercent }"
          :min="minLabelTextScalePercent"
          :max="maxLabelTextScalePercent"
          :step="20"
          :thumb-string-values="textScaleSelectorThumbStrings" />
        <PropertySlider
          :numSelected="selectedLabels.size"
          v-model="styleOptions.labelTextRotation"
          :conflict="hasDisagreement('labelTextRotation')"
          :class="{ shake: animatedInput.labelTextRotation }"
          :title="t('labelTextRotation', i18nMessageSelector())"
          :color="conflictItems.labelTextRotation ? 'red' : ''"
          :min="-3.14159"
          :max="3.14159"
          :step="0.39269875"
          :thumb-string-values="
            textRotationSelectorThumbStrings
          "></PropertySlider>
        <DisagreementOverride
          :style-properties="[
            'labelDisplayText',
            'labelDisplayCaption',
            'labelTextScalePercent',
            'labelTextRotation'
          ]" />
      </v-window-item>
      <v-window-item>
        <!-- Second Tab -->
        <!-- Label Text Family Selections -->
        <v-select
          :disabled="
            selectedLabels.size < 1 || hasDisagreement('labelTextFamily')
          "
          v-model.lazy="styleOptions.labelTextFamily"
          v-bind:label="t('labelTextFamily', i18nMessageSelector())"
          :items="labelTextFamilyItems"
          item-title="text"
          item-value="value"
          ref="labelTextFamily"
          @mousedown="emits('ignore-mouse-down')"
          :class="{
            shake: animatedInput.labelTextFamily,
            conflict: conflictItems.labelTextFamily
          }"
          @change="conflictItems.labelTextFamily = false"
          variant="outlined"
          density="compact"></v-select>
        <v-select
          :disabled="
            selectedLabels.size < 1 || hasDisagreement('labelTextStyle')
          "
          v-model.lazy="styleOptions.labelTextStyle"
          v-bind:label="t('labelTextStyle', i18nMessageSelector())"
          :items="labelTextStyleItems"
          item-title="text"
          item-value="value"
          ref="labelTextStyle"
          @mousedown="emits('ignore-mouse-down')"
          :class="{
            shake: animatedInput.labelTextStyle,
            conflict: conflictItems.labelTextStyle
          }"
          @change="conflictItems.labelTextStyle = false"
          variant="outlined"
          density="compact"></v-select>
        <v-select
          :disabled="
            selectedLabels.size < 1 || hasDisagreement('labelTextDecoration')
          "
          v-model.lazy="styleOptions.labelTextDecoration"
          v-bind:label="t('labelTextDecoration', i18nMessageSelector())"
          :items="labelTextDecorationItems"
          item-title="text"
          item-value="value"
          ref="labelTextDecorations"
          @mousedown="emits('ignore-mouse-down')"
          :class="{
            shake: animatedInput.labelTextDecoration,
            conflict: conflictItems.labelTextDecoration
          }"
          @change="conflictItems.labelTextDecoration = false"
          variant="outlined"
          density="compact"></v-select>
        <!-- Label Display Mode Selections -->
        <v-select
          :disabled="
            selectedLabels.size < 1 || hasDisagreement('labelDisplayMode')
          "
          v-model.lazy="styleOptions.labelDisplayMode"
          :class="[
            'pa-0',
            {
              shake: animatedInput.labelDisplayMode,
              conflict: conflictItems.labelDisplayMode
            }
          ]"
          ref="labelDisplayMode"
          v-bind:label="t('labelDisplayMode')"
          :items="filteredLabelDisplayModeItems"
          item-title="text"
          item-value="value"
          variant="outlined"
          @mousedown="emits('ignore-mouse-down')"
          density="compact"></v-select>
        <DisagreementOverride
          :style-properties="[
            'labelDisplayMode',
            'labelTextDecoration',
            'labelTextFamily',
            'labelTextStyle'
          ]" />
      </v-window-item>
      <v-window-item>
        <!-- Third Tab-->
        <PropertyColorPicker
          :title="t('labelFrontFillColor', i18nMessageSelector())"
          :numSelected="selectedLabels.size"
          ref="labelFrontFillColor"
          style-name="labelFrontFillColor"
          :conflict="hasDisagreement('labelFrontFillColor')"
          v-model="styleOptions.labelFrontFillColor"></PropertyColorPicker>
        <v-switch
          v-if="!hasTextObject()"
          color="secondary"
          v-model="styleOptions.labelDynamicBackStyle"
          :label="
            t('labelAutomaticBackStyle', i18nMessageSelector())
          "></v-switch>
        <PropertyColorPicker
          v-if="!styleOptions.labelDynamicBackStyle && !hasTextObject()"
          :numSelected="selectedLabels.size"
          :title="t('labelBackFillColor')"
          :conflict="hasDisagreement('labelBackFillColor')"
          ref="labelBackFillColor"
          style-name="labelBackFillColor"
          v-model="styleOptions.labelBackFillColor"></PropertyColorPicker>
        <DisagreementOverride
          :style-properties="[
            'labelFrontFillColor',
            'labelBackFillColor',
            'labelDynamicBackStyle'
          ]" />
      </v-window-item>
    </template>
    <template #bottom>
      <div
        class="ma-1"
        :style="{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-end',
          gap: '8px'
        }">
        <v-tooltip activator="#restore-btn" :text="t('undoStyles')"></v-tooltip>
        <v-tooltip
          activator="#default-btn"
          :text="t('defaultStyles')"></v-tooltip>
        <v-btn
          id="restore-btn"
          @click="emits('undo-styles')"
          icon="mdi-undo"
          size="small"></v-btn>
        <v-btn
          id="default-btn"
          @click="emits('apply-default-styles')"
          icon="mdi-backup-restore"
          size="small"></v-btn>
      </div>
    </template>
  </PopOverTabs>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeMount, watch, Ref } from "vue";
import { LabelStyleOptions } from "@/types/Styles";
import { LabelDisplayMode } from "@/types";
import SETTINGS from "@/global-settings";
import PropertySlider from "./StylePropertySlider.vue";
import PropertyColorPicker from "./StylePropertyColorPicker.vue";
import DisagreementOverride from "./DisagreementOverride.vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useSEStore } from "@/stores/se";
import PopOverTabs from "./PopOverTabs.vue";
import { useStylingStore } from "@/stores/styling";
import { CommandGroup } from "@/commands/CommandGroup";
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";

type LabelDisplayModeItem = {
  text: any; //typeof VueI18n.TranslateResult
  value: LabelDisplayMode;
  optionRequiresMeasurementValueToExist: boolean;
  optionRequiresCaptionToExist: boolean;
};

type Animatable = {
  labelDisplayText: boolean;
  labelDisplayMode: boolean;
  labelDisplayCaption: boolean;
  labelTextFamily: boolean;
  labelTextStyle: boolean;
  labelTextDecoration: boolean;
  labelTextScalePercent: boolean;
  labelTextRotation: boolean;
};

type ConflictItems = {
  labelDisplayText: boolean;
  labelDisplayMode: boolean;
  labelDisplayCaption: boolean;
  labelTextFamily: boolean;
  labelTextStyle: boolean;
  labelTextDecoration: boolean;
  labelTextScalePercent: boolean;
  labelTextRotation: boolean;
  labelBackFillColor: boolean;
  labelFrontFillColor: boolean;
};
type LabelStyleProps = {
  showPopup: boolean;
};
const emits = defineEmits([
  "ignore-mouse-down", //this tells the mousedown handler in StyleDrawer to ignore this event when it happens in the pull down menus of these styling options.
  "undo-styles",
  "apply-default-styles"
]);
const props = defineProps<LabelStyleProps>();
const seStore = useSEStore();
const styleStore = useStylingStore();
const { selectedLabels, styleOptions, measurableSelections } =
  storeToRefs(styleStore);
const { hasDisagreement, hasLabelObject, i18nMessageSelector, hasTextObject } =
  styleStore;
const { t } = useI18n();
const { seLabels } = storeToRefs(seStore);

const maxLabelTextScalePercent = SETTINGS.style.maxLabelTextScalePercent;
const minLabelTextScalePercent = SETTINGS.style.minLabelTextScalePercent;
//step is 20 from 60 to 200 is 8 steps
const textScaleSelectorThumbStrings: Array<string> = [];
const maxLabelDisplayTextLength = SETTINGS.label.maxLabelDisplayTextLength;
const labelDisplayTextErrorMessageKey = "";
const lastValidDisplayText = ref("");
const maxLabelDisplayCaptionLength =
  SETTINGS.label.maxLabelDisplayCaptionLength;
const labelDisplayCaptionErrorMessageKey = "";

//step is Pi/8 from -pi to pi is 17 steps
const textRotationSelectorThumbStrings: Array<string> = [];
const filteredLabelDisplayModeItems: Ref<Array<LabelDisplayModeItem>> = ref([]);

watch(
  () => measurableSelections.value,
  (measurable, oldMeasurable) => {
    console.debug(`Measurable changes from ${oldMeasurable} to ${measurable}`);
    filteredLabelDisplayModeItems.value = labelDisplayModeItems.filter(
      x => !x.optionRequiresMeasurementValueToExist || measurable
    );
    console.debug(
      "Label Display Option",
      filteredLabelDisplayModeItems.value.length
    );

    // Check if the current labelDisplaMode value exists in the filtered entries
    // If not, reset it to the first item in the filtered entry
    if (
      !filteredLabelDisplayModeItems.value.some(
        x => x.value === styleOptions.value.labelDisplayMode
      )
    ) {
      styleOptions.value.labelDisplayMode =
        filteredLabelDisplayModeItems.value[0].value;
    }
  }
);

onBeforeMount((): void => {
  for (
    let s = SETTINGS.style.minLabelTextScalePercent;
    s <= SETTINGS.style.maxLabelTextScalePercent;
    s += 20
  )
    textScaleSelectorThumbStrings.push(s.toFixed(0) + "%");
  for (let angle = -180; angle <= 180; angle += 22.5) {
    textRotationSelectorThumbStrings.push(
      angle.toFixed(1).replace(/\.0$/, "") + "\u{00B0}"
    );
  }
  // console.log(
  //   "rotation angle thumb labels",
  //   textRotationSelectorThumbStrings
  // );
});

onMounted((): void => {
  // The following filter is easier to interpret if we negate the filter condition
  // i.e. exclude if the option requires measurement AND the selections are NOT measurable
  filteredLabelDisplayModeItems.value = labelDisplayModeItems.filter(
    x => !x.optionRequiresMeasurementValueToExist || measurableSelections.value
  );
});

// These methods are linked to the Style Data fade-in-card
function labelDisplayTextCheck(txt: string | undefined): boolean | string {
  if (!hasLabelObject()) {
    return true;
  } // if (no label object) is true, then the selection is just text objects and the limit of 8 characters doesn't apply
  if (txt !== undefined && txt !== null) {
    if (txt.length > SETTINGS.label.maxLabelDisplayTextLength) {
      return t("message.maxLabelDisplayTextLength", {
        max: SETTINGS.label.maxLabelDisplayTextLength
      });
    } else if (txt.length === 0) {
      return t("message.minLabelDisplayTextLength", {});
    }
  }
  return true;
}

function labelDisplayTextTruncate(opt: LabelStyleOptions): boolean {
  if (!hasLabelObject()) {
    return true;
  } // if (no label object) is true, then the selection is just text objects and the limit of 8 characters doesn't apply
  if (opt.labelDisplayText !== undefined && opt.labelDisplayText !== null) {
    if (
      opt.labelDisplayText.length > SETTINGS.label.maxLabelDisplayTextLength
    ) {
      const txt = opt.labelDisplayText;
      opt.labelDisplayText = txt.slice(
        0,
        SETTINGS.label.maxLabelDisplayTextLength
      );
    } else if (opt.labelDisplayText.length === 0) {
      opt.labelDisplayText = "";
    } else {
      lastValidDisplayText.value = opt.labelDisplayText;
    }
  }
  return true;
}

function labelDisplayCaptionCheck(txt: string | undefined): boolean | string {
  if (txt && txt.length > SETTINGS.label.maxLabelDisplayCaptionLength) {
    return t("message.maxCaptionLength", {
      max: SETTINGS.label.maxLabelDisplayCaptionLength
    }) as string;
  }
  return true;
}

function labelDisplayCaptionTruncate(opt: LabelStyleOptions): boolean {
  if (opt.labelDisplayCaption !== undefined) {
    if (
      opt.labelDisplayCaption.length >
      SETTINGS.label.maxLabelDisplayCaptionLength
    ) {
      const txt = opt.labelDisplayCaption;
      opt.labelDisplayCaption = txt.slice(
        0,
        SETTINGS.label.maxLabelDisplayCaptionLength
      );
    }
  }
  return true;
}

function placeHolderText(numSelected: number, caption: boolean): string {
  if (numSelected > 1) {
    if (caption) {
      return t("commonCaptionText");
    } else {
      return t("commonLabelText");
    }
  } else {
    if (caption) {
      return t("captionText");
    } else {
      return t("labelText");
    }
  }
}

function hasCaption(opt: LabelStyleOptions | undefined): boolean {
  if (!opt) return false;
  return (
    opt.labelDisplayMode === LabelDisplayMode.CaptionOnly ||
    opt.labelDisplayMode === LabelDisplayMode.NameAndCaption
  );
}

function displayAllLabels() {
  const cmdGroup = new CommandGroup();
  let subCommandCount = 0;
  selectedLabels.value.forEach(labName => {
    const lab = seLabels.value.find(z => {
      return z.ref.name === labName;
    });
    if (lab && !lab.ref.showing) {
      const newCmd = new SetNoduleDisplayCommand(lab, true);
      cmdGroup.addCommand(newCmd);
      subCommandCount++;
    }
  });
  if (subCommandCount > 0) {
    cmdGroup.execute();
  }
}

const labelDisplayModeItems: LabelDisplayModeItem[] = [
  {
    text: t("labelDisplayModes.nameOnly"),
    value: LabelDisplayMode.NameOnly,
    optionRequiresMeasurementValueToExist: false,
    optionRequiresCaptionToExist: false
  },
  {
    text: t("labelDisplayModes.captionOnly"),
    value: LabelDisplayMode.CaptionOnly,
    optionRequiresMeasurementValueToExist: false,
    optionRequiresCaptionToExist: true
  },
  {
    text: t("labelDisplayModes.valueOnly"),
    value: LabelDisplayMode.ValueOnly,
    optionRequiresMeasurementValueToExist: true,
    optionRequiresCaptionToExist: false
  },
  {
    text: t("labelDisplayModes.nameAndCaption"),
    value: LabelDisplayMode.NameAndCaption,
    optionRequiresMeasurementValueToExist: false,
    optionRequiresCaptionToExist: true
  },
  {
    text: t("labelDisplayModes.nameAndValue"),
    value: LabelDisplayMode.NameAndValue,
    optionRequiresMeasurementValueToExist: true,
    optionRequiresCaptionToExist: false
  }
];

const labelTextFamilyItems = [
  {
    text: t("fonts.genericSanSerif"),
    value: "sans-serif"
  },
  {
    text: t("fonts.genericSerif"),
    value: "serif"
  },
  {
    text: t("fonts.monospace"),
    value: "monospace"
  },
  {
    text: t("fonts.cursive"),
    value: "cursive"
  },
  {
    text: t("fonts.fantasy"),
    value: "fantasy"
  }
];

const labelTextStyleItems = [
  {
    text: t("textStyle.normal"),
    value: "normal"
  },
  {
    text: t("textStyle.italic"),
    value: "italic"
  },
  {
    text: t("textStyle.bold"),
    value: "bold"
  }
];

const labelTextDecorationItems = [
  {
    text: t("textDecoration.none"),
    value: "none"
  },
  {
    text: t("textDecoration.underline"),
    value: "underline"
  },
  {
    text: t("textDecoration.strikethrough"),
    value: "line-through" //strikethrough doesn't work, but line-through does
  },
  {
    text: t("textDecoration.overline"),
    value: "overline"
  }
];
// shakes the input a bit if there is a conflict on that particular input
const animatedInput: Animatable = {
  labelDisplayText: false,
  labelDisplayMode: false,
  labelDisplayCaption: false,
  labelTextFamily: false,
  labelTextStyle: false,
  labelTextDecoration: false,
  labelTextScalePercent: false,
  labelTextRotation: false
};
// change the background color of the input if there is a conflict on that particular input
const conflictItems: ConflictItems = {
  labelDisplayText: false,
  labelDisplayMode: false,
  labelDisplayCaption: false,
  labelTextFamily: false,
  labelTextStyle: false,
  labelTextDecoration: false,
  labelTextScalePercent: false,
  labelTextRotation: false,
  labelBackFillColor: false,
  labelFrontFillColor: false
};
</script>
<style lang="scss" scoped>
@import "@/scss/variables.scss";
.select-an-object-text {
  color: rgb(255, 82, 82);
}

/* customize outline color of conflicting input fields
   Use :v-deep (SCSS) or /deep/ (CSS) to reach out INTO the
   html elements managed by Vuetify
 */
.v-text-field--outlined.conflict {
  ::v-deep fieldset {
    border-color: rgba(192, 0, 250, 0.986);
    border-width: 2px;
  }
}

.v-btn__content {
  height: 400px;
  word-wrap: break-word;
}
.shake {
  animation: shake 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  transform: translate3d(0, 0, 0);
}
@keyframes shake {
  10%,
  90% {
    transform: translate3d(-1px, 0, 0);
  }
  20%,
  80% {
    transform: translate3d(2px, 0, 0);
  }
  30%,
  50%,
  70% {
    transform: translate3d(-4px, 0, 0);
  }
  40%,
  60% {
    transform: translate3d(4px, 0, 0);
  }
}
</style>
<i18n lang="json" locale="en">
{
  "label": "Label | Text | Label & Text",
  "backStyleDisagreement": "Back Styling Disagreement",
  "labelAutomaticBackStyle": "Infer Label Back Styles from Front Styles",
  "clickToMakeLabelsVisible": "Click the button below to make labels visible",
  "commonCaptionText": "Common Caption Text",
  "commonLabelText": "Common Label Text",
  "enableCommonStyle": "Enable Common Style",
  "fonts": {
    "cursive": "Cursive Font",
    "fantasy": "Fantasy",
    "genericSanSerif": "San Serif Font",
    "genericSerif": "Serif Font",
    "monospace": "Monospace Font"
  },
  "labelBackFillColor": "Label Back Fill Color",
  "labelCaption": "Label Caption",
  "labelDisplayMode": "Label Display Mode",
  "labelDisplayModes": {
    "captionOnly": "Caption Only",
    "nameAndCaption": "Name & Caption",
    "nameAndValue": "Name & Value",
    "nameOnly": "Name Only",
    "valueOnly": "Value Only"
  },
  "labelFrontFillColor": "Label Front Fill Color|Text Front Fill Color|Label & Text Front Fill Color",
  "labelNotVisible": "Labels Not Visible",
  "labelText": "Label|Text|Label & Text",
  "labelStyle": "Label Style|Text Style|Label & Text Style",
  "labelTextDecoration": "Label Decoration|Text Decoration|Label & Text Decoration",
  "labelTextFamily": "Label Family|Text Family|Label & Text Family",
  "labelTextRotation": "Label Rotation |Text Rotation |Label & Text Rotation ",
  "labelTextScale": "Label Scale |Text Scale |Label & Text Scale ",
  "labelTextStyle": "Label Style|Text Style|Label & Text Style",
  "makeLabelsVisible": "Make Labels Visible",
  "message": {
    "maxLabelDisplayTextLength": "Label cannot be longer than {max} characters",
    "minLabelDisplayTextLength": "Label must have at least 1 character",
    "maxCaptionLength": "Caption cannot be longer than {max} characters",
    "multipleObjectDifferingStyles": "Multiple object(s) selected have differing label styles."
  },
  "textDecoration": {
    "none": "No decoration",
    "overline": "Overline",
    "strikethrough": "Strikethrough",
    "underline": "Underline"
  },
  "textStyle": {
    "bold": "Bold",
    "italic": "Italic",
    "normal": "Normal"
  },
  "defaultStyles": "Restore Default Styles (ALL)",
  "undoStyles": "Undo Recent Style Changes (ALL)"
}
</i18n>
<i18n lang="json" locale="id">
{
  "backStyleDisagreement": "Gaya Tampilan Belakang Bertentangan",
  "labelAutomaticBackStyle": "Gaya Tampilan Belakang Ditentutan dari Tampilan Muka",
  "clickToMakeLabelsVisible": "Tekan tombol dibawah untuk menampilkan label",
  "commonCaptionText": "Keterangan Teks Gabungan",
  "commonLabelText": "Label Teks Gabungan",
  "enableCommonStyle": "Aktifkan Gaya Tampilan Gabungan",
  "fonts": {
    "cursive": "Cursive Font",
    "fantasy": "Fantasy",
    "genericSanSerif": "San Serif Font",
    "genericSerif": "Serif Font",
    "monospace": "Monospace Font"
  },
  "labelBackFillColor": "Warna pengisi latar belakang",
  "labelCaption": "Keterangan Teks",
  "labelDisplayMode": "Mode Penampilan Label",
  "labelDisplayModes": {
    "captionOnly": "Keterangan Saja",
    "nameAndCaption": "Nama & Keterangan",
    "nameAndValue": "Nama & Nilai",
    "nameOnly": "Nama Saja",
    "valueOnly": "Nilai Saja"
  },
  "labelFrontFillColor": "Warning Pengisi Label Later Depan",
  "labelNotVisible": "Label Tidak Ditampilkan",
  "labelText": "Teks Label",
  "labelTextDecoration": "Dekorasi Teks Label",
  "labelTextFamily": "Keluarga Text Label",
  "labelTextRotation": "Rotasi Label",
  "labelTextScale": "Persentasi Skala Label",
  "labelTextStyle": "Gaya Tampilan Teks Label",
  "makeLabelsVisible": "Tampilkan Label",
  "message": {
    "maxLabelDisplayTextLength": "Label terlalu panjang. Max {max} huruf",
    "minLabelDisplayTextLength": "Label minimum 1 karakter",
    "maxCaptionLength": "Teks Keterangna terlalu panjang. Max {max} huruf",
    "multipleObjectDifferingStyles": "Objek yang diseleksi memiliki gaya tampilan label berbeda"
  },
  "textDecoration": {
    "none": "Tanpa dekorasi",
    "overline": "Garis atas",
    "strikethrough": "Garis coret",
    "underline": "Garis bawah"
  },
  "textStyle": {
    "bold": "Bold",
    "italic": "Italic",
    "normal": "Normal"
  },
  "defaultStyles": "Kembali ke Gaya Awal",
  "undoStyles": "Batalkan Ubahan Gaya"
}
</i18n>
