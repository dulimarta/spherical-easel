<template>
  <!-- For debugging -->
  <!--ul>
      <li>Style Opt: {{ styleOptions }}</li>
      <li>Selection count {{ selectionCount }}</li>
    </ul-->

  <!-- Label(s) not showing overlay -- higher z-index rendered on top -- covers entire panel including the header-->
  <PopOverTabs icon-name="mdi-tag">
    <template #tabs>
      <v-tab><v-icon>mdi-pencil</v-icon></v-tab>
      <v-tab><v-icon>mdi-format-text</v-icon></v-tab>
      <v-tab><v-icon>mdi-palette</v-icon></v-tab>
    </template>
    <template #pages>
      <!-- Label Text Options -->
      <v-window-item class="pa-2">
        <!-- Label Text Selections -->
        <!--span class="text-subtitle-2">{{ $t("style.labelStyleOptions") }}</span-->
        <v-text-field
          v-model="styleOptions.labelDisplayText"
          :disabled="selectionCount > 1"
          v-bind:label="$t('style.labelText')"
          :counter="maxLabelDisplayTextLength"
          ref="labelDisplayText"
          :class="{
            shake: animatedInput.labelDisplayText,
            conflict: conflictItems.labelDisplayText
          }"
          variant="outlined"
          density="compact"
          :placeholder="placeHolderText(selectionCount, false)"
          v-bind:error-messages="
            $t(labelDisplayTextErrorMessageKey, {
              max: maxLabelDisplayTextLength
            })
          "
          :rules="[
            labelDisplayTextCheck,
            labelDisplayTextTruncate(styleOptions)
          ]"></v-text-field>
        <v-text-field
          v-model.lazy="styleOptions.labelDisplayCaption"
          v-bind:label="$t('style.labelCaption')"
          :counter="maxLabelDisplayCaptionLength"
          :placeholder="placeHolderText(selectionCount, true)"
          ref="labelDisplayCaption"
          :class="{
            shake: animatedInput.labelDisplayCaption,
            conflict: conflictItems.labelDisplayCaption
          }"
          variant="outlined"
          density="compact"
          @keypress="conflictItems.labelDisplayCaption = false"
          v-bind:error-messages="
            $t(labelDisplayCaptionErrorMessageKey, {
              max: maxLabelDisplayCaptionLength
            })
          "
          :rules="[
            labelDisplayCaptionCheck,
            labelDisplayCaptionTruncate(styleOptions)
          ]"></v-text-field>
          Scale % {{ styleOptions.labelTextScalePercent }}
        <SimpleNumberSelector
          :numSelected="selectionCount"
          v-model="styleOptions.labelTextScalePercent"
          title-key="style.labelTextScalePercent"
          ref="labelTextScalePercent"
          :color="conflictItems.labelTextScalePercent ? 'red' : ''"
          :conflict="conflictItems.labelTextScalePercent"
          v-on:resetColor="conflictItems.labelTextScalePercent = false"
          :class="{ shake: animatedInput.labelTextScalePercent }"
          :min="minLabelTextScalePercent"
          :max="maxLabelTextScalePercent"
          :step="20"
          :thumb-string-values="textScaleSelectorThumbStrings" />
          Rotation {{ styleOptions.labelTextRotation }}
        <SimpleNumberSelector
          :numSelected="selectionCount"
          v-model="styleOptions.labelTextRotation"
          ref="labelTextRotation"
          :conflict="conflictItems.labelTextRotation"
          :class="{ shake: animatedInput.labelTextRotation }"
          title-key="style.labelTextRotation"
          :color="conflictItems.labelTextRotation ? 'red' : ''"
          v-on:resetColor="conflictItems.labelTextRotation = false"
          :min="-3.14159"
          :max="3.14159"
          :step="0.39269875"
          :thumb-string-values="
            textRotationSelectorThumbStrings
          "></SimpleNumberSelector>
      </v-window-item>
      <v-window-item class="pa-2">
        <!-- Label Text Family Selections -->
        <v-select
          v-model.lazy="styleOptions.labelTextFamily"
          v-bind:label="$t('style.labelTextFamily')"
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
          v-model.lazy="styleOptions.labelTextStyle"
          v-bind:label="$t('style.labelTextStyle')"
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
          v-model.lazy="styleOptions.labelTextDecoration"
          v-bind:label="$t('style.labelTextDecoration')"
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
          v-model.lazy="styleOptions.labelDisplayMode"
          :class="[
            showMoreLabelStyles ? '' : 'pa-0',
            {
              shake: animatedInput.labelDisplayMode,
              conflict: conflictItems.labelDisplayMode
            }
          ]"
          :disabled="labelDisplayModeValueFilter(styleOptions).length < 2"
          ref="labelDisplayMode"
          v-bind:label="$t('style.labelDisplayMode')"
          :items="labelDisplayModeValueFilter(styleOptions)"
          item-title="text"
          item-value="value"
          @change="conflictItems.labelDisplayMode = false"
          variant="outlined"
          density="compact"></v-select>
      </v-window-item>
      <v-window-item class="pa-2">
        <SimpleColorSelector
          title-key="style.labelFrontFillColor"
          :numSelected="selectionCount"
          ref="labelFrontFillColor"
          style-name="labelFrontFillColor"
          :conflict="conflictItems.labelFrontFillColor"
          v-on:resetColor="conflictItems.labelFrontFillColor = false"
          v-model="styleOptions.labelFrontFillColor"></SimpleColorSelector>
        <SimpleColorSelector
          :numSelected="selectionCount"
          title-key="style.labelBackFillColor"
          :conflict="conflictItems.labelBackFillColor"
          v-on:resetColor="conflictItems.labelBackFillColor = false"
          ref="labelBackFillColor"
          style-name="labelBackFillColor"
          v-model="styleOptions.labelBackFillColor"></SimpleColorSelector>
      </v-window-item>
    </template>
  </PopOverTabs>
  <InputGroup
    v-if="false"
    :numSelected="selectionCount"
    :panel="panel"
    input-selector="labelDisplayText,labelDisplayMode,labelDisplayCaption,labelTextFamily,labelTextStyle,labelTextDecoration">
    <!-- Differing data styles detected Overlay --higher z-index rendered on top-->
    <!--OverlayWithFixButton
            v-if="!dataAgreement(/labelDisplayMode|labelDisplayCaption|labelTextFamily|labelTextStyle|labelTextDecoration/)"
            z-index="1"
            i18n-title-line="style.styleDisagreement"
            i18n-button-label="style.enableCommonStyle"
            i18n-button-tool-tip="style.differentValuesToolTip"
            @click="distinguishConflictingItems(conflictingProps);
            forceDataAgreement([`labelDisplayMode`,`labelDisplayCaption`,`labelTextFamily`,`labelTextStyle`,`labelTextDecoration`])">
          </!--OverlayWithFixButton-->
    <span
      v-if="selectedSENodules.length > 1"
      class="text-subtitle-2"
      style="color: red">
      {{ " " + $t("style.labelStyleOptionsMultiple") }}
    </span>
  </InputGroup>
  <InputGroup
    :numSelected="selectionCount"
    :panel="panel"
    input-selector="labelTextScalePercent,labelTextRotation"
    v-if="showMoreLabelStyles && false">
    <!--OverlayWithFixButton
            v-if="!dataAgreement(/labelTextScalePercent|labelTextRotation/)"
            z-index="1"
            i18n-title-line="style.styleDisagreement"
            i18n-button-label="style.enableCommonStyle"
            i18n-button-tool-tip="style.differentValuesToolTip"
            @click="distinguishConflictingItems(conflictingProps);
            forceDataAgreement([`labelTextScalePercent`,`labelTextRotation`])">
          </OverlayWithFixButton-->
    {{ $t("style.labelTextScalePercent") }} &
    {{ $t("style.labelTextRotation") }}
    <span
      v-if="selectedSENodules.length > 1"
      class="text-subtitle-2"
      style="color: red">
      {{ " " + $t("style.labelStyleOptionsMultiple") }}
    </span>
    <v-divider></v-divider>
  </InputGroup>
  <InputGroup
    :numSelected="selectionCount"
    :panel="panel"
    input-selector="labelFrontFillColor"
    v-if="showMoreLabelStyles && false">
    <!--OverlayWithFixButton
            v-if="!dataAgreement(/labelFrontFillColor/)"
            z-index="1"
            i18n-title-line="style.styleDisagreement"
            i18n-button-label="style.enableCommonStyle"
            i18n-button-tool-tip="style.differentValuesToolTip"
            @click="distinguishConflictingItems(conflictingProps);
            forceDataAgreement([`labelFrontFillColor`])">
          </OverlayWithFixButton-->
  </InputGroup>
  <InputGroup
    :numSelected="selectionCount"
    :panel="panel"
    input-selector="labelBackFillColor"
    v-if="showMoreLabelStyles && false">
    <!--

          <OverlayWithFixButton v-if="styleOptions.labelDynamicBackStyle"
            z-index="10"
            i18n-title-line="style.dynamicBackStyleHeader"
            i18n-button-label="style.disableDynamicBackStyle"
            i18n-button-tool-tip="style.disableDynamicBackStyleToolTip"
            @click="styleOptions.labelDynamicBackStyle =!styleOptions.labelDynamicBackStyle">
          </OverlayWithFixButton>

          <OverlayWithFixButton v-if="!dataAgreement(/labelBackFillColor/)"
            z-index="1"
            i18n-title-line="style.styleDisagreement"
            i18n-button-label="style.enableCommonStyle"
            i18n-button-tool-tip="style.differentValuesToolTip"
            @click="distinguishConflictingItems(conflictingProps);
            forceDataAgreement([`labelBackFillColor`])">
          </OverlayWithFixButton-->
  </InputGroup>

  <!-- Show more or less styling options -->
  <!--v-tooltip
    location="bottom"
    max-width="400px"
    class="pa-0 pm-0">
    <template v-slot:activator="{ props }">
      <v-btn
        v-bind="props"
        @click="toggleShowMoreLabelStyles"
        class="text-subtitle-2"
        text
        variant="plain"
        ripple
        size="x-small">
        <v-icon v-if="showMoreLabelStyles">mdi-chevron-up</v-icon>
        <v-icon v-else>mdi-chevron-down</v-icon>
      </v-btn>
    </template>
    {{ t("style.toggleStyleOptionsToolTip") }}
  </v-tooltip-->
  <Dialog
    ref="backStyleDisagreementDialog"
    :title="t('style.backStyleDisagreement')"
    width="50%"
    :yes-text="t('style.enableCommonStyle')"
    :yes-action="overrideDynamicBackStyleDisagreement">
    Multiple object(s) selected have differing label styles.
  </Dialog>
  <!--OverlayWithFixButton
            v-if="!dataAgreement(/labelDynamicBackStyle/)"
            z-index="100"
            i18n-title-line="style.backStyleDisagreement"
            i18n-button-label="style.enableCommonStyle"
            i18n-button-tool-tip="style.backStyleDifferentValuesToolTip"
            @click="forceDataAgreement([`labelDynamicBackStyle`]); styleOptions.labelDynamicBackStyle =!styleOptions.labelDynamicBackStyle">
          </!--OverlayWithFixButton-->
  <Dialog
    ref="labelNotVisibleDialog"
    width="50%"
    :title="t('style.labelNotVisible')"
    :yes-text="t('style.makeLabelsVisible')"
    :yes-action="toggleAllLabelsVisibility">
    {{ t("style.clickToMakeLabelsVisible") }}
  </Dialog>
  <!--OverlayWithFixButton v-if="!allLabelsShowing"
          z-index="100"
          i18n-title-line="style.labelNotVisible"
          i18n-subtitle-line="style.clickToMakeLabelsVisible"
          i18n-button-label="style.makeLabelsVisible"
          i18n-button-tool-tip="style.labelsNotShowingToolTip"
          @click="toggleAllLabelsVisibility">
        </OverlayWithFixButton-->
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
import Nodule from "@/plottables/Nodule";
import { StyleEditPanels, StyleOptions } from "@/types/Styles";
import { LabelDisplayMode } from "@/types";
import SETTINGS from "@/global-settings";
import InputGroup from "@/components/InputGroupWithReset.vue";
import { Labelable } from "@/types";
import EventBus from "@/eventHandlers/EventBus";
import SimpleNumberSelector from "@/components/style-ui/SimpleNumberSelector.vue";
import SimpleColorSelector from "@/components/style-ui/SimpleColorSelector.vue";
import Dialog, { DialogAction } from "@/components/Dialog.vue";
import { useI18n } from "vue-i18n";
// import OverlayWithFixButton from "@/components/OverlayWithFixButton.vue";
import Label from "@/plottables/Label";
import { storeToRefs } from "pinia";
import { useSEStore } from "@/stores/se";
import { useStyleEditor } from "@/components/StyleEditor";
import { useDialogSequencer } from "@/components/DialogSequencer";
import PopOverTabs from "../PopOverTabs.vue";
// import UI from "@/store/ui-styles";
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
  panel: StyleEditPanels;
  // activePanel: number;
  // noduleFilterFunction: () => void,
};
const props = defineProps<LabelStyleProps>();
const seStore = useSEStore();
const { t } = useI18n();
const {
  selectionCount,
  dataAgreement,
  conflictingProps,
  forceDataAgreement,
  styleOptions
} = useStyleEditor(props.panel, labelFilter, labelMapper);

// You are not allow to style labels  directly  so remove them from the selection and warn the user
const { selectedSENodules } = storeToRefs(seStore);
const dialogSequencer = useDialogSequencer();
const backStyleDisagreementDialog: Ref<DialogAction | null> = ref(null);
const labelNotVisibleDialog: Ref<DialogAction | null> = ref(null);
// $refs
const labelDisplayText = ref(null);
const labelDisplayCaption = ref(null);

watch(() => selectedSENodules.value, resetAllItemsFromConflict);
function resetAllItemsFromConflict(): void {
  // console.log("here");
  const key = Object.keys(conflictItems);
  key.forEach(prop => {
    (conflictItems as any)[prop] = false;
  });
}

watch(
  () => selectedSENodules.value,
  (arr: SENodule[]) => {
    const test1 = dataAgreement(/labelDynamicBackStyle/);
    console.info("Watching", arr.length, test1, allLabelsShowing.value);
    if (!dataAgreement(/labelDynamicBackStyle/) || true) {
      dialogSequencer.showDialog(backStyleDisagreementDialog.value!);
    }
    if (!allLabelsShowing || true) {
      dialogSequencer.showDialog(labelNotVisibleDialog.value!);
    }
  },
  {
    deep: true
  }
);

// Include only those objects that have SELabel
function labelFilter(n: SENodule): boolean {
  return n.isLabelable();
}

// Map each object to its plotabble label
function labelMapper(n: SENodule): Nodule {
  return (n as unknown as Labelable).label!.ref!;
}

// usingAutomaticBackStyle = false means that the user is setting the color for the back on their own and is
// *not* using the contrast (i.e. not using the dynamic back styling)
// usingAutomaticBackStyle = true means the program is setting the style of the back objects
// private usingAutomaticBackStyle = true;

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

const conflictingPropNames: string[] = []; // this should always be identical to conflictingProps in the template above.

const maxLabelTextScalePercent = SETTINGS.style.maxLabelTextScalePercent;
const minLabelTextScalePercent = SETTINGS.style.minLabelTextScalePercent;
//step is 20 from 60 to 200 is 8 steps
const textScaleSelectorThumbStrings: Array<string> = [];

//Many of the label style will not be commonly modified so create a button/variable for
// the user to click to show more of the Label Styling options
const showMoreLabelStyles = ref(false);
const moreOrLessText = ref(t("style.moreStyleOptions")); // The text for the button to toggle between less/more options

const maxLabelDisplayTextLength = SETTINGS.label.maxLabelDisplayTextLength;
const labelDisplayTextErrorMessageKey = "";
const labelDisplayTestResults = [true, true];
const lastValidDisplayText = ref("");

const maxLabelDisplayCaptionLength =
  SETTINGS.label.maxLabelDisplayCaptionLength;
const labelDisplayCaptionErrorMessageKey = "";
const labelDisplayCaptionTestResults = [true, true];

const labelDisplayModeItems: labelDisplayModeItem[] = [
  {
    text: t("style.labelDisplayModes.nameOnly"),
    value: LabelDisplayMode.NameOnly,
    optionRequiresMeasurementValueToExist: false,
    optionRequiresCaptionToExist: false
  },
  {
    text: t("style.labelDisplayModes.captionOnly"),
    value: LabelDisplayMode.CaptionOnly,
    optionRequiresMeasurementValueToExist: false,
    optionRequiresCaptionToExist: true
  },
  {
    text: t("style.labelDisplayModes.valueOnly"),
    value: LabelDisplayMode.ValueOnly,
    optionRequiresMeasurementValueToExist: true,
    optionRequiresCaptionToExist: false
  },
  {
    text: t("style.labelDisplayModes.nameAndCaption"),
    value: LabelDisplayMode.NameAndCaption,
    optionRequiresMeasurementValueToExist: false,
    optionRequiresCaptionToExist: true
  },
  {
    text: t("style.labelDisplayModes.nameAndValue"),
    value: LabelDisplayMode.NameAndValue,
    optionRequiresMeasurementValueToExist: true,
    optionRequiresCaptionToExist: false
  }
];

const labelTextFamilyItems = [
  {
    text: t("style.genericSanSerif"),
    value: "sans/-serif"
  },
  {
    text: t("style.genericSerif"),
    value: "serif"
  },
  {
    text: t("style.monospace"),
    value: "monospace"
  },
  {
    text: t("style.cursive"),
    value: "cursive"
  },
  {
    text: t("style.fantasy"),
    value: "fantasy"
  }
];

const labelTextStyleItems = [
  {
    text: t("style.normal"),
    value: "normal"
  },
  {
    text: t("style.italic"),
    value: "italic"
  },
  {
    text: t("style.bold"),
    value: "bold"
  }
];

const labelTextDecorationItems = [
  {
    text: t("style.none"),
    value: "none"
  },
  {
    text: t("style.underline"),
    value: "underline"
  },
  {
    text: t("style.strikethrough"),
    value: "strikethrough"
  },
  {
    text: t("style.overline"),
    value: "overline"
  }
];

//step is Pi/8 from -pi to pi is 17 steps
const textRotationSelectorThumbStrings: Array<string> = [];

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
    resetAndRestoreConflictItemss
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

function resetAndRestoreConflictItemss(): void {
  resetAllItemsFromConflict();
  distinguishConflictingItems(conflictingPropNames);
}

onBeforeUnmount((): void => {
  EventBus.unlisten("style-label-conflict-color-reset");
  EventBus.unlisten("style-update-conflicting-props");
});

const allLabelsShowing = computed((): boolean => {
  return selectedSENodules.value.every(node => {
    if (node.isLabelable()) {
      return (node as unknown as Labelable).label!.showing;
    } else {
      return true;
    }
  });
});

function overrideDynamicBackStyleDisagreement() {
  forceDataAgreement([`labelDynamicBackStyle`]);
  styleOptions.value.labelDynamicBackStyle =
    !styleOptions.value.labelDynamicBackStyle;
  // dialogSequencer.hideDialog(backStyleDisagreementDialog.value!)
}

function toggleShowMoreLabelStyles(): void {
  showMoreLabelStyles.value = !showMoreLabelStyles.value;
  if (!showMoreLabelStyles.value) {
    moreOrLessText.value = t("style.moreStyleOptions");
  } else {
    moreOrLessText.value = t("style.lessStyleOptions");
  }
}
function toggleAllLabelsVisibility(): void {
  EventBus.fire("toggle-label-visibility", { fromPanel: true });
  // dialogSequencer.hideDialog(labelNotVisibleDialog.value!)
}

// These methods are linked to the Style Data fade-in-card
function labelDisplayTextCheck(txt: string | undefined): boolean | string {
  if (txt !== undefined && txt !== null) {
    if (txt.length > SETTINGS.label.maxLabelDisplayTextLength) {
      return t("style.maxLabelDisplayTextLengthWarning", {
        max: SETTINGS.label.maxLabelDisplayTextLength
      }) as string;
    } else if (txt.length === 0) {
      // console.log("here");
      return t("style.minLabelDisplayTextLengthWarning", {}) as string;
    }
  }
  return true;
}

function labelDisplayTextTruncate(opt: StyleOptions): boolean {
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
      opt.labelDisplayText = lastValidDisplayText.value;
    } else {
      lastValidDisplayText.value = opt.labelDisplayText;
    }
  }
  return true;
}

function labelDisplayCaptionCheck(txt: string | undefined): boolean | string {
  if (txt && txt.length > SETTINGS.label.maxLabelDisplayCaptionLength) {
    return t("style.maxLabelDisplayCaptionLengthWarning", {
      max: SETTINGS.label.maxLabelDisplayCaptionLength
    }) as string;
  }
  return true;
}
function labelDisplayCaptionTruncate(opt: StyleOptions): boolean {
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

//This controls if the labelDisplayModeItems include ValueOnly and NameAndValue (When no value in the Label)\
// and if the caption is empty, NameAndCaption and Caption Only are not options
function labelDisplayModeValueFilter(
  opt: StyleOptions
  // items: labelDisplayModeItem[]
): labelDisplayModeItem[] {
  const returnItems: labelDisplayModeItem[] = [];
  const allLabels = selectedSENodules.value
    .filter(labelFilter)
    .map(labelMapper)
    .map((n: Nodule) => n as Label);
  if (allLabels.every((lab: Label) => lab.value.length !== 0)) {
    // value is present in all labels so pass long all options in labelDisplayModeItems
    returnItems.push(...labelDisplayModeItems);
  } else {
    // value is not present in all labels so pass long all options in labelDisplayModeItems that don't have value in them
    returnItems.push(
      ...labelDisplayModeItems.filter(
        item => !item.optionRequiresMeasurementValueToExist
      )
    );
  }

  if (opt.labelDisplayCaption && opt.labelDisplayCaption.length > 0) {
    // caption is present in all labels
    return returnItems;
  } else {
    // caption is not present in all labels so pass long all options in labelDisplayModeItems that don't have caption in them
    return returnItems.filter(itm => !itm.optionRequiresCaptionToExist);
  }
}

function placeHolderText(numSelected: number, caption: boolean): string {
  if (numSelected > 1) {
    if (caption) {
      return "Common Caption Text";
    } else {
      return "Common Label Text";
    }
  } else {
    if (caption) {
      return "Caption Text";
    } else {
      return "Label Text";
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
