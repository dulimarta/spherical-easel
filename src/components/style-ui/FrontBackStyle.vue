<template>
  <!-- {{ styleOptions }} -->
  <PopOverTabs
    :show-popup="showPopup"
    :name="editModeIsBack ? t('back') : t('front')"
    :disabled="selectedPlottables.size === 0">
    <!-- the tabs will be hidden when dynamic style is enabled AND we are editing the back styles -->
    <template #tabs v-if="!styleOptions.dynamicBackStyle || !editModeIsBack">
      <v-tab><v-icon>mdi-palette</v-icon></v-tab>
      <v-tab
        v-if="
          hasSomeProperties([
            'strokeWidthPercent',
            'pointRadiusPercent',
            'dashArray'
          ])
        ">
        <v-icon>mdi-format-line-style</v-icon>
      </v-tab>
      <v-tab v-if="hasStyle(/angle/)"><v-icon>mdi-angle-acute</v-icon></v-tab>
    </template>
    <template #top>
      <div v-if="editModeIsBack" class="px-2">
        <!-- Enable the Dynamic Back Style Overlay -->
        <v-switch
          v-model="styleOptions.dynamicBackStyle"
          color="secondary"
          :label="t('autoBackStyle')"></v-switch>
      </div>
    </template>
    <!-- the pages will be hidden when dynamic style is enabled AND we are editing the back styles -->
    <template #pages v-if="!styleOptions.dynamicBackStyle || !editModeIsBack">
      <v-window-item
        class="pa-2"
        v-if="hasSomeProperties(['strokeColor', 'fillColor']) || true">
        <!-- FIRST TAB: Color -->

        <StylePropertyColorPicker
          :numSelected="selectedPlottables.size"
          :title="t('strokeColor')"
          v-if="
            isCommonProperty('strokeColor') && !hasDisagreement('strokeColor')
          "
          :conflict="hasDisagreement('strokeColor')"
          style-name="strokeColor"
          v-model="styleOptions.strokeColor" />
        <StylePropertyColorPicker
          :title="t('fillColor')"
          :numSelected="selectedPlottables.size"
          :conflict="hasDisagreement('fillColor')"
          v-if="isCommonProperty('fillColor') && !hasDisagreement('fillColor')"
          style-name="fillColor"
          v-model="styleOptions.fillColor" />
        <DisagreementOverride
          :style-properties="[
            'strokeColor',
            'fillColor'
          ]"></DisagreementOverride>
      </v-window-item>
      <v-window-item
        class="pa-2"
        v-if="
          hasSomeProperties([
            'strokeWidthPercent',
            'pointRadiusPercent',
            'dashArray'
          ])
        ">
        <!-- SECOND TAB: Stroke -->
        <StylePropertySlider
          v-if="isCommonProperty('strokeWidthPercent')"
          :numSelected="selectedPlottables.size"
          :conflict="hasDisagreement('strokeWidthPercent')"
          v-model="styleOptions.strokeWidthPercent"
          :title="t('strokeWidthPercent')"
          :min="minStrokeWidthPercent"
          :max="maxStrokeWidthPercent"
          :step="20"
          :thumb-string-values="strokeWidthScaleSelectorThumbStrings" />
        <StylePropertySlider
          v-if="isCommonProperty('pointRadiusPercent')"
          :numSelected="selectedPlottables.size"
          v-model="styleOptions.pointRadiusPercent"
          :conflict="hasDisagreement('pointRadiusPercent')"
          :title="t('pointRadiusPercent')"
          :min="minPointRadiusPercent"
          :max="maxPointRadiusPercent"
          :step="20"
          :thumb-string-values="
            pointRadiusSelectorThumbStrings
          "></StylePropertySlider>
        <!-- Dis/enable Dash Pattern, Undo and Reset to Defaults buttons -->
        <div
          v-if="isCommonProperty('dashArray')"
          :style="{ display: 'flex', flexDirection: 'column' }">
          <div
            :style="{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }">
            <v-tooltip
              location="bottom"
              max-width="400px"
              activator="#use-dash"
              :text="t('dashPatternCheckBoxToolTip')" />
            <v-switch
              class="mr-4"
              id="use-dash"
              v-model="styleOptions.useDashPattern"
              density="compact"
              :color="hasDisagreement('dashArray') ? 'red' : 'secondary'">
              <template v-slot:label>
                <span
                  :style="{
                    color: hasDisagreement('dashArray') ? 'red' : ``
                  }">
                  {{ t("dashPattern") }}
                </span>
              </template>
            </v-switch>
            <v-tooltip
              location="bottom"
              max-width="400px"
              activator="#swap-dash"
              :text="t('dashPatternReverseArrayToolTip')" />
            <v-switch
              v-if="styleOptions.useDashPattern"
              v-model="styleOptions.reverseDashArray"
              :color="hasDisagreement('reverseDashArray') ? `red` : 'secondary'"
              density="compact">
              <template v-slot:label>
                <span
                  :style="{
                    color: hasDisagreement('reverseDashArray') ? 'red' : ``
                  }">
                  {{ t("dashArrayReverse") }}
                </span>
              </template>
            </v-switch>
          </div>
          <!-- The dash property slider -->
          <v-range-slider
            v-if="styleOptions.useDashPattern"
            v-model="styleOptions.dashArray"
            min="1"
            strict
            :step="setStep(hasStyle('angleMarker'))"
            :max="setMax(hasStyle('angleMarker'))"
            :color="hasDisagreement('dashArray') ? 'red' : ''"
            density="compact">
            <template #prepend>
              {{ styleOptions.reverseDashArray ? "Gap" : "Dash" }}
              {{ styleOptions.dashArray ? styleOptions.dashArray[0] : "" }}
            </template>
            <template #append>
              {{ styleOptions.reverseDashArray ? "Dash" : "Gap" }}
              {{ styleOptions.dashArray ? styleOptions.dashArray[1] : "" }}
            </template>
          </v-range-slider>
        </div>
        <DisagreementOverride
          :style-properties="[
            'strokeWidthPercent',
            'pointRadiusPercent',
            'dashArray'
          ]"></DisagreementOverride>
      </v-window-item>
      <v-window-item class="pa-2" v-if="hasStyle(/angle/)">
        <!-- THIRD TAB-->
        <!-- Angle Marker Decoration Selector -->

        <StylePropertySlider
          :numSelected="selectedPlottables.size"
          :conflict="hasDisagreement('angleMarkerRadiusPercent')"
          v-model="styleOptions.angleMarkerRadiusPercent"
          :title="t('angleMarkerRadiusPercent')"
          :min="minAngleMarkerRadiusPercent"
          :max="maxAngleMarkerRadiusPercent"
          :step="20"
          :thumb-string-values="
            angleMarkerRadiusSelectorThumbStrings
          "></StylePropertySlider>
        <template v-if="!editModeIsBack">
          <v-switch
            v-model="styleOptions.angleMarkerTickMark"
            :color="
              hasDisagreement('angleMarkerTickMark') ? 'red' : 'secondary'
            ">
            <template v-slot:label>
              <span
                :style="{
                  color: hasDisagreement('angleMarkerTickMark') ? 'red' : ``
                }">
                {{ t("angleMarkerTickMark") }}
              </span>
            </template>
          </v-switch>
          <v-switch
            v-model="styleOptions.angleMarkerDoubleArc"
            :color="
              hasDisagreement('angleMarkerDoubleArc') ? 'red' : 'secondary'
            ">
            <template v-slot:label>
              <span
                :style="{
                  color: hasDisagreement('angleMarkerDoubleArc') ? 'red' : ``
                }">
                {{ t("angleMarkerDoubleArc") }}
              </span>
            </template>
          </v-switch>

          <v-switch
            v-model="styleOptions.angleMarkerArrowHeads"
            :color="
              hasDisagreement('angleMarkerArrowHeads') ? 'red' : 'secondary'
            ">
            <template v-slot:label>
              <span
                :style="{
                  color: hasDisagreement('angleMarkerArrowHeads') ? 'red' : ``
                }">
                {{ t("angleMarkerArrowHeads") }}
              </span>
            </template>
          </v-switch>
        </template>
        <DisagreementOverride
          :style-properties="
            editModeIsBack
              ? ['angleMarkerRadiusPercent']
              : [
                  'angleMarkerRadiusPercent',
                  'angleMarkerTickMark',
                  'angleMarkerDoubleArc',
                  'angleMarkerArrowHeads'
                ]
          "></DisagreementOverride>
      </v-window-item>
    </template>
    <template #bottom v-if="!styleOptions.dynamicBackStyle || !editModeIsBack">
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

  <!-- objects(s) not showing overlay ---higher z-index rendered on top -- covers entire panel including the header-->
</template>
<script setup lang="ts">
import { computed, onBeforeMount, useAttrs } from "vue";
import Nodule from "@/plottables/Nodule";
import { StyleCategory } from "@/types/Styles";
import SETTINGS from "@/global-settings";
import StylePropertySlider from "./StylePropertySlider.vue";
import StylePropertyColorPicker from "./StylePropertyColorPicker.vue";
import DisagreementOverride from "./DisagreementOverride.vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useStylingStore } from "@/stores/styling";
import PopOverTabs from "./PopOverTabs.vue";

type ComponentProps = {
  showPopup: boolean;
  panel: StyleCategory;
};
const { attrs } = useAttrs();
const emits = defineEmits(["undo-styles", "apply-default-styles"]);

const props = defineProps<ComponentProps>();
const styleStore = useStylingStore();
const { selectedPlottables, styleOptions } = storeToRefs(styleStore);
const { hasStyle, hasDisagreement, isCommonProperty, hasSomeProperties } =
  styleStore;
const { t } = useI18n({ useScope: "local" });

const maxStrokeWidthPercent = SETTINGS.style.maxStrokeWidthPercent;
const minStrokeWidthPercent = SETTINGS.style.minStrokeWidthPercent;
//step is 20 from 60 to 200 is 8 steps
const strokeWidthScaleSelectorThumbStrings: Array<string> = [];

//Many of the label style will not be commonly modified so create a button/variable for
// the user to click to show more of the Label Styling options

const maxPointRadiusPercent = SETTINGS.style.maxPointRadiusPercent;
const minPointRadiusPercent = SETTINGS.style.minPointRadiusPercent;
//step is 20 from 60 to 200 is 8 steps
const pointRadiusSelectorThumbStrings: Array<string> = [];

//Angle Marker options
const maxAngleMarkerRadiusPercent = SETTINGS.style.maxAngleMarkerRadiusPercent;
const minAngleMarkerRadiusPercent = SETTINGS.style.minAngleMarkerRadiusPercent;
const angleMarkerRadiusSelectorThumbStrings: Array<string> = [];

function setMax(angleMarker: boolean): number {
  if (angleMarker) {
    return SETTINGS.angleMarker.maxGapLengthOrDashLength;
  } else {
    return SETTINGS.style.maxGapLengthOrDashLength;
  }
}
function setStep(angleMarker: boolean): number {
  if (angleMarker) {
    return SETTINGS.angleMarker.sliderStepSize;
  } else {
    return SETTINGS.style.sliderStepSize;
  }
}

onBeforeMount((): void => {
  for (
    let s = SETTINGS.style.minStrokeWidthPercent;
    s <= SETTINGS.style.maxStrokeWidthPercent;
    s += 20
  )
    strokeWidthScaleSelectorThumbStrings.push(s.toFixed(0) + "%");
  for (
    let s = SETTINGS.style.minPointRadiusPercent;
    s <= SETTINGS.style.maxPointRadiusPercent;
    s += 20
  )
    pointRadiusSelectorThumbStrings.push(s.toFixed(0) + "%");

  for (
    let s = SETTINGS.style.minAngleMarkerRadiusPercent;
    s <= SETTINGS.style.maxAngleMarkerRadiusPercent;
    s += 20
  )
    angleMarkerRadiusSelectorThumbStrings.push(s.toFixed(0) + "%");
});

const editModeIsBack = computed((): boolean => {
  return props.panel === StyleCategory.Back;
});
</script>
<style lang="scss" scoped>
@import "@/scss/variables.scss";

.select-an-object-text {
  color: rgb(255, 82, 82);
}

.v-btn__content {
  height: 400px;
  word-wrap: break-word;
}
.checkboxLabel {
  color: blue;
  font-size: 16px;
}
</style>
<i18n lang="json" locale="en">
{
  "front": "Front",
  "back": "Back",
  "angleMarkerArrowHeads": "Arrow Head",
  "angleMarkerDoubleArc": "Double Arc",
  "angleMarkerRadiusPercent": "Angle Marker Radius",
  "angleMarkerTickMark": "Tick Mark",
  "autoBackStyle": "Infer Back Styles from Front Styles",
  "dashArrayReverse": "Swap Dash/Gap",
  "dashPattern": "Use dash pattern",
  "dashPatternCheckBoxToolTip": "Enable or Disable a dash pattern for the selected objects.",
  "dashPatternReverseArrayToolTip": "Switch the dash and gap lengths so that the gap length can be less than the dash length",
  "fillColor": "Fill Color",
  "labelStyleOptionsMultiple": "(Multiple)",
  "pointRadiusPercent": "Point Radius",
  "strokeColor": "Stroke Color",
  "strokeWidthPercent": "Stroke Width",
  "defaultStyles": "Restore Default Styles (ALL)",
  "undoStyles": "Undo Recent Style Changes (ALL)"
}
</i18n>
