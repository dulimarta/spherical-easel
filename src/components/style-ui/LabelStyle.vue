<template>
  <!-- For debugging -->
  <!-- Label(s) not showing overlay -- higher z-index rendered on top -- covers entire panel including the header-->
  <PopOverTabs
    :show-popup="showPopup!"
    :disabled="selectedLabels.size < 1"
    @pop-up-shown="checkLabelsVisibility()"
    @pop-up-hidden="resetLabelsVisibility()">
    <template #tabs>
      <v-tab>
        <v-icon>mdi-pencil</v-icon>
      </v-tab>
      <v-tab><v-icon>mdi-format-text</v-icon></v-tab>
      <v-tab><v-icon>mdi-palette</v-icon></v-tab>
    </template>
    <template #pages>
      <v-window-item>
        <v-text-field
          v-model="styleOptions.labelDisplayText"
          :disabled="
            selectedLabels.size < 1 || hasDisagreement('labelDisplayText')
          "
          :label="t('labelText')"
          :counter="maxLabelDisplayTextLength"
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
          v-if="hasCaption(styleOptions) || true"
          :disabled="
            selectedLabels.size < 1 || hasDisagreement('labelDisplayCaption')
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
          :title="t('labelTextScale')"
          :color="conflictItems.labelTextScalePercent ? 'red' : ''"
          :conflict="hasDisagreement('labelTextScalePercent')"
          :class="{ shake: animatedInput.labelTextScalePercent }"
          :min="minLabelTextScalePercent"
          :max="maxLabelTextScalePercent"
          :step="20"
          :thumb-string-values="textScaleSelectorThumbStrings" />
        <!-- Rotation {{ labelTextRotationAmount }} -->
        <PropertySlider
          :numSelected="selectedLabels.size"
          v-model="styleOptions.labelTextRotation"
          :conflict="hasDisagreement('labelTextRotation')"
          :class="{ shake: animatedInput.labelTextRotation }"
          :title="t('labelTextRotation')"
          :color="conflictItems.labelTextRotation ? 'red' : ''"
          v-on:resetColor="conflictItems.labelTextRotation = false"
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
        <!-- Label Text Family Selections -->
        <v-select
          :disabled="
            selectedLabels.size < 1 || hasDisagreement('labelTextFamily')
          "
          v-model.lazy="styleOptions.labelTextFamily"
          v-bind:label="t('labelTextFamily')"
          :items="labelTextFamilyItems"
          item-title="text"
          item-value="value"
          ref="labelTextFamily"
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
          v-bind:label="t('labelTextStyle')"
          :items="labelTextStyleItems"
          item-title="text"
          item-value="value"
          ref="labelTextStyle"
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
          v-bind:label="t('labelTextDecoration')"
          :items="labelTextDecorationItems"
          item-title="text"
          item-value="value"
          ref="labelTextDecorations"
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
          :items="labelDisplayModeItems"
          item-title="text"
          item-value="value"
          @change="conflictItems.labelDisplayMode = false"
          variant="outlined"
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
        <PropertyColorPicker
          :title="t('labelFrontFillColor')"
          :numSelected="selectedLabels.size"
          ref="labelFrontFillColor"
          style-name="labelFrontFillColor"
          :conflict="conflictItems.labelFrontFillColor"
          v-on:resetColor="conflictItems.labelFrontFillColor = false"
          v-model="styleOptions.labelFrontFillColor"></PropertyColorPicker>
        <PropertyColorPicker
          :numSelected="selectedLabels.size"
          :title="t('labelBackFillColor')"
          :conflict="conflictItems.labelBackFillColor"
          v-on:resetColor="conflictItems.labelBackFillColor = false"
          ref="labelBackFillColor"
          style-name="labelBackFillColor"
          v-model="styleOptions.labelBackFillColor"></PropertyColorPicker>
        <DisagreementOverride
          :style-properties="['labelFrontFillColor', 'labelBackFillColor']" />
      </v-window-item>
    </template>
  </PopOverTabs>

  <!-- Differing data styles detected Overlay --higher z-index rendered on top-->
  <!--

          <OverlayWithFixButton-- v-if="styleOptions.labelDynamicBackStyle"
            z-index="10"
            i18n-title-line="style.dynamicBackStyleHeader"
            i18n-button-label="style.disableDynamicBackStyle"
            i18n-button-tool-tip="style.disableDynamicBackStyleToolTip"
            @click="styleOptions.labelDynamicBackStyle =!styleOptions.labelDynamicBackStyle">
          </OverlayWithFixButton-->

  <!-- Show more or less styling options -->
  <!--Dialog
    ref="backStyleDisagreementDialog"
    :title="t('backStyleDisagreement')"
    width="50%"
    :yes-text="t('enableCommonStyle')"
    :yes-action="overrideDynamicBackStyleDisagreement">
    {{ t("message.multipleObjectDifferingStyles") }}
  </!--Dialog-->
  <!--OverlayWithFixButton
            v-if="!dataAgreement(/labelDynamicBackStyle/)"
            z-index="100"
            i18n-title-line="style.backStyleDisagreement"
            i18n-button-label="style.enableCommonStyle"
            i18n-button-tool-tip="style.backStyleDifferentValuesToolTip"
            @click="forceDataAgreement([`labelDynamicBackStyle`]); styleOptions.labelDynamicBackStyle =!styleOptions.labelDynamicBackStyle">
          </!--OverlayWithFixButton-->
</template>
<script setup lang="ts">
import {
  computed,
  ref,
  onMounted,
  onBeforeMount,
  onBeforeUnmount,
  watch,
  Ref
} from "vue";
import { SENodule } from "@/models/SENodule";
import { LabelStyleProperty, StyleOptions } from "@/types/Styles";
import { LabelDisplayMode } from "@/types";
import SETTINGS from "@/global-settings";
import { Labelable } from "@/types";
import EventBus from "@/eventHandlers/EventBus";
import PropertySlider from "./StylePropertySlider.vue";
import PropertyColorPicker from "./StylePropertyColorPicker.vue";
import DisagreementOverride from "./DisagreementOverride.vue";
import Dialog, { DialogAction } from "@/components/Dialog.vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useSEStore } from "@/stores/se";
const attrs = useAttrs();
import PopOverTabs from "./PopOverTabs.vue";
import { useAttrs } from "vue";
import { useStylingStore } from "@/stores/styling";
type labelDisplayModeItem = {
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
  // panel: StyleEditPanels;
  // activePanel: number;
  // noduleFilterFunction: () => void,
};
const props = defineProps<LabelStyleProps>();
let groupSelection = defineModel<number>({});
const seStore = useSEStore();
const styleStore = useStylingStore();
const { selectedLabels, styleOptions, forceAgreement } =
  storeToRefs(styleStore);
const { hasDisagreement } = styleStore;
const { t } = useI18n();

// You are not allow to style labels  directly  so remove them from the selection and warn the user
const { selectedSENodules } = storeToRefs(seStore);
const backStyleDisagreementDialog: Ref<DialogAction | null> = ref(null);
const labelDisplayText = ref(null);
const labelDisplayCaption = ref(null);
// const labelTextScalePercentage = ref(
//   styleOptions.value.labelTextScalePercent ?? 100
// );
// const labelTextRotationAmount: Ref<number> = ref(
//   styleOptions.value.labelTextRotation ?? 0
// );
let popupVisible = false;

// usingAutomaticBackStyle = false means that the user is setting the color for the back on their own and is
// *not* using the contrast (i.e. not using the dynamic back styling)
// usingAutomaticBackStyle = true means the program is setting the style of the back objects
// private usingAutomaticBackStyle = true;

const conflictingPropNames: string[] = []; // this should always be identical to conflictingProps in the template above.

const maxLabelTextScalePercent = SETTINGS.style.maxLabelTextScalePercent;
const minLabelTextScalePercent = SETTINGS.style.minLabelTextScalePercent;
//step is 20 from 60 to 200 is 8 steps
const textScaleSelectorThumbStrings: Array<string> = [];

//Many of the label style will not be commonly modified so create a button/variable for
// the user to click to show more of the Label Styling options

const maxLabelDisplayTextLength = SETTINGS.label.maxLabelDisplayTextLength;
const labelDisplayTextErrorMessageKey = "";
const labelDisplayTestResults = [true, true];
const lastValidDisplayText = ref("");

const maxLabelDisplayCaptionLength =
  SETTINGS.label.maxLabelDisplayCaptionLength;
const labelDisplayCaptionErrorMessageKey = "";
const labelDisplayCaptionTestResults = [true, true];
const labelVisibiltyState = new Map<string, boolean>();

//step is Pi/8 from -pi to pi is 17 steps
const textRotationSelectorThumbStrings: Array<string> = [];

watch(
  () => selectedSENodules.value,
  (afterArr: SENodule[], beforeArr: SENodule[]) => {
    if (popupVisible === false) return;
    beforeArr
      .filter(n => n.getLabel() !== null)
      .forEach(n => {
        const theLabel = n.getLabel();
        const prevLabelState = labelVisibiltyState.get(n.name);
        if (typeof prevLabelState === "undefined") {
          labelVisibiltyState.set(n.name, theLabel!.showing);
        } else {
          theLabel!.showing = prevLabelState;
        }
      });

    afterArr
      .filter(n => n.getLabel() != null)
      .forEach(n => {
        const withLabel = n as unknown as Labelable;
        const prevLabelState = labelVisibiltyState.get(n.name);
        if (typeof prevLabelState === "undefined") {
          labelVisibiltyState.set(n.name, withLabel.label!.showing);
        }
        withLabel.label!.showing = true;
      });
  },
  {
    deep: true
  }
);

// watch(
//   () => labelTextScalePercentage.value,
//   (textScale: number) => {
//     styleOptions.value.labelTextScalePercent = textScale;
//   }
// );
// watch(
//   () => labelTextRotationAmount.value,
//   (textRotation: number) => {
//     styleOptions.value.labelTextRotation = textRotation;
//   }
// );

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
  //   this.textRotationSelectorThumbStrings
  // );
});

onMounted((): void => {
  EventBus.listen(
    "style-label-conflict-color-reset",
    resetAndRestoreConflictItems
  );
  EventBus.listen(
    "style-update-conflicting-props",
    (names: { propNames: string[] }): void => {
      // this.conflictingPropNames.forEach(name =>
      //   console.log("old prop", name)
      // );
      conflictingPropNames.splice(0);
      names.propNames.forEach(name => conflictingPropNames.push(name));
      // this.conflictingPropNames.forEach(name =>
      //   console.log("new prop", name)
      // );
    }
  );
});

function countEnabledProperties(propList: Array<string>) {
  let count = 0;
  // console.debug("Style options", styleOptions)
  propList.forEach(propName => {
    console.debug(`Is ${propName} present?`);
    if (styleOptions.value[propName]) count++;
  });
  return count;
}

function resetAndRestoreConflictItems(): void {
  // resetAllItemsFromConflict();
  distinguishConflictingItems(conflictingPropNames);
}

onBeforeUnmount((): void => {
  EventBus.unlisten("style-label-conflict-color-reset");
  EventBus.unlisten("style-update-conflicting-props");
});

function overrideDynamicBackStyleDisagreement() {}

// TODO: this function needs more work: label names are required
function checkLabelsVisibility() {
  popupVisible = true;

  selectedLabels.value.forEach(n => {
    if (!labelVisibiltyState.has(n.name)) {
      labelVisibiltyState.set(n.name, n.showing);
    }
    if (!n.showing) {
      n.showing = true;
    }
  });
}
// TODO: this function needs more work
function resetLabelsVisibility() {
  popupVisible = false;
  groupSelection.value = undefined;
  selectedLabels.value.forEach(n => {
    const visibility = labelVisibiltyState.get(n.name);
    if (typeof visibility === "boolean") n.showing = visibility;
  });
}

// These methods are linked to the Style Data fade-in-card
function labelDisplayTextCheck(txt: string | undefined): boolean | string {
  if (txt !== undefined && txt !== null) {
    if (txt.length > SETTINGS.label.maxLabelDisplayTextLength) {
      return t("message.maxLabelDisplayTextLength", {
        max: SETTINGS.label.maxLabelDisplayTextLength
      });
    } else if (txt.length === 0) {
      // console.log("here");
      return t("message.minLabelDisplayTextLength", {});
    }
  }
  return true;
}

function labelDisplayTextTruncate(opt: LabelStyleProperty): boolean {
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
function labelDisplayCaptionTruncate(opt: LabelStyleProperty): boolean {
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
    // else if (opt.labelDisplayCaption.length === 0) {
    //   // the label mode should be set to name only
    //   opt.labelDisplayMode = LabelDisplayMode.NameOnly;
    // }
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

function distinguishConflictingItems(conflictingProps: string[]): void {
  conflictingProps.forEach(conflictPropName => {
    switch (conflictPropName) {
      case "labelDisplayText":
        // clear the display of the labels
        if (labelDisplayText !== undefined) {
          (labelDisplayText as any).$el.getElementsByTagName("input")[0].value =
            "";
        }
        break;
      case "labelDisplayCaption":
        // clear the display of the captions
        if (labelDisplayCaption !== undefined) {
          (labelDisplayCaption as any).$el.getElementsByTagName(
            "input"
          )[0].value = "";
        }
        break;
    }
    // console.log(this.$refs);
    // (this.animatedInput as any)[conflictPropName] = true;
    if (conflictPropName.search(/Color/) === -1) {
      (conflictItems as any)[conflictPropName] = "error";
    } else {
      (conflictItems as any)[conflictPropName] = "red";
    }
    // setTimeout(() => {
    //   (this.animatedInput as any)[conflictPropName] = false;
    //   // (this.conflictItems as any)[conflictPropName] = undefined;
    // }, 1000);
  });
}
function hasCaption(opt: LabelStyleProperty | undefined): boolean {
  if (!opt) return false;
  return (
    opt.labelDisplayMode === LabelDisplayMode.CaptionOnly ||
    opt.labelDisplayMode === LabelDisplayMode.NameAndCaption
  );
}

const labelDisplayModeItems: labelDisplayModeItem[] = [
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
    value: "sans/-serif"
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
    value: "strikethrough"
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
  "backStyleDisagreement": "Back Styling Disagreement",
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
  "labelFrontFillColor": "Label Front Fill Color",
  "labelNotVisible": "Labels Not Visible",
  "labelText": "Label Text",
  "labelStyle": "Label Style",
  "labelTextDecoration": "Label Text Decoration",
  "labelTextFamily": "Label Text Family",
  "labelTextRotation": "Label Rotation ()",
  "labelTextScale": "Label Scale (%)",
  "labelTextStyle": "Label Text Style",
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
  }
}
</i18n>
<i18n lang="json" locale="id">
{
  "backStyleDisagreement": "Gaya Tampilan Belakang Bertentangan",
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
  }
}
</i18n>
