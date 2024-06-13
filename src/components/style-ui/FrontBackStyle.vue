<template>
  <!-- {{ styleOptions }} -->
  <PopOverTabs
    :show-popup="showPopup"
    :name="editModeIsBack ? 'Back' : 'Front'"
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
        <!-- FIRST TAB-->

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
        <!-- SECOND TAB-->
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
              v-model="useDashPattern"
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
              v-if="useDashPattern"
              v-model="flipDashPattern"
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
            v-if="useDashPattern"
            v-model="dashArray"
            min="1"
            strict
            :step="setStep(hasStyle('angleMarker'))"
            :max="setMax(hasStyle('angleMarker'))"
            :color="hasDisagreement('dashArray') ? 'red' : ''"
            density="compact">
            <template #prepend>
              {{ styleOptions.reverseDashArray ? "Dash" : "Gap" }}
              {{ dashArray[0] }}
            </template>
            <template #append>
              {{ styleOptions.reverseDashArray ? "Gap" : "Dash" }}
              {{ dashArray[1] }}
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
        <!--span class="text-subtitle-2">
        {{ $t(`style.angleMarkerOptions`) }}
      </span-->

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
        <v-switch
          v-model="styleOptions.angleMarkerTickMark"
          :color="hasDisagreement('angleMarkerTickMark') ? 'red' : 'secondary'"
          @change="
            updateInputGroup(
              'angleMarkerRadiusPercent,angleMarkerTickMark,angleMarkerDoubleArc'
            )
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
          :color="hasDisagreement('angleMarkerDoubleArc') ? 'red' : 'secondary'"
          @change="
            updateInputGroup(
              'angleMarkerRadiusPercent,angleMarkerTickMark,angleMarkerDoubleArc,angleMarkerAArrowHeads'
            )
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
          "
          @change="
            updateInputGroup(
              'angleMarkerRadiusPercent,angleMarkerTickMark,angleMarkerDoubleArc,angleMarkerArrowHeads'
            )
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
        <DisagreementOverride
          :style-properties="[
            'angleMarkerRadiusPercent',
            'angleMarkerTickMark',
            'angleMarkerDoubleArc',
            'angleMarkerArrowHeads'
          ]"></DisagreementOverride>
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
import {
  computed,
  ref,
  onMounted,
  onBeforeUnmount,
  useAttrs,
  Ref,
  watch
} from "vue";
import Nodule from "@/plottables/Nodule";
import { StyleCategory, ShapeStyleOptions } from "@/types/Styles";
import SETTINGS from "@/global-settings";
import EventBus from "@/eventHandlers/EventBus";
import StylePropertySlider from "./StylePropertySlider.vue";
import StylePropertyColorPicker from "./StylePropertyColorPicker.vue";
import DisagreementOverride from "./DisagreementOverride.vue";

import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useSEStore } from "@/stores/se";
import { useStylingStore } from "@/stores/styling";
import { onBeforeMount } from "vue";
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
const angleMarkerRadiusPercentage = ref(
  styleOptions.value.angleMarkerRadiusPercent ?? 100
);
// automaticBackState is controlled by user
// automaticBackStyle : FALSE means she wants to customize back style
// automaticBackStyle : TRUE means the program will customize back style
const dashArray: Ref<number[]> = ref([1,5])
const useDashPattern = ref(false);
const flipDashPattern= ref(false);
// const emptyDashPattern = computed(() =>
//   if (dArr.length < 2) return true
//   return dArr[0] !== 0 && dArr[1] !== 0
// });

watch(() => styleOptions.value, opt => {
  if (Object.hasOwn(opt, 'dashArray')) {
    const arr = opt.dashArray!
    if (arr.length < 2) useDashPattern.value = false
    else {
      if (arr[0] !== 0 && arr[1] !== 0) {
        useDashPattern.value = true
        // Copy the predefined pattern
        dashArray.value[0] = arr[0]
        dashArray.value[1] = arr[1]
      } else {
        useDashPattern.value = false
      }
    }
  } else {
    useDashPattern.value = false
  }
  if (Object.hasOwn(opt, 'reverseDashArray')) {
    flipDashPattern.value = opt.reverseDashArray!
  } else {
    flipDashPattern.value = false
  }
})

watch(
  () => useDashPattern.value,
  useDash => {
    if (useDash) {
      if (flipDashPattern.value) styleOptions.value.dashArray = dashArray.value.slice(0);
      else styleOptions.value.dashArray = dashArray.value.toReversed()
    } else {
      delete styleOptions.value.dashArray;
    }
  }
);
watch(
  () => dashArray.value,
  (dArr, oldArr) => {
    if (!useDashPattern.value) return
    // TwoJS interpretation: dashes[0] = gap length; dashes[1] = dash length
    if (flipDashPattern.value) styleOptions.value.dashArray = dArr.slice(0);
    else styleOptions.value.dashArray = dArr.toReversed();
  },
  { deep: true, immediate: true }
);

watch(
  () => flipDashPattern.value,
  flip => {
    if (typeof flip === "undefined") return;
    if (!useDashPattern.value) return
    styleOptions.value.reverseDashArray = flip;
    if (flip) {
      styleOptions.value.dashArray = dashArray.value.slice(0);
    } else {
      styleOptions.value.dashArray = dashArray.value.toReversed();
    }
  }
);

// change the background color of the input if there is a conflict on that particular input

/**
 * There are many style options. In the case that there
 * are more than one object selected, the XXXAgreement boolean indicates if the XXX property is *initially* the
 * same across the selected objects. In the case that they are not initially the same, the cooresponding adjustment tool
 * is display in a different way than the usual default.
 */

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

//Dash pattern Options
/** gapLength = sliderArray[1] */
let gapLength = 0;
let oldGapLength = 0;
/** dashLength= sliderArray[0] */
let dashLength = 0;
let oldDashLength = 0;
let alreadySet = false;

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

// usingAutomaticBackStyle = false means that the user is setting the color for the back on their own and is
// *not* using the contrast (i.e. not using the dynamic back styling)
// usingAutomaticBackStyle = true means the program is setting the style of the back objects

// dbAgreement and udbCommonValue are computed by the program
// useDB is set by user

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
    s < SETTINGS.style.maxAngleMarkerRadiusPercent;
    s += 20
  )
    angleMarkerRadiusSelectorThumbStrings.push(s.toFixed(0) + "%");
});

const editModeIsBack = computed((): boolean => {
  return props.panel === StyleCategory.Back;
});

// const editModeIsFront = computed((): boolean => {
//   return props.panel === StyleCategory.Front;
// });

// const allObjectsShowing = computed((): boolean => {
//   return selectedSENodules.value.every(node => node.showing);
// });

// function activeDashPattern(opt: StyleOptions): string {
//   if (dashArray.value) {
//     // console.log(
//     //   "dash array in active dash pattern",
//     //   opt.dashArray[0], //dash length
//     //   opt.dashArray[1], // gap length
//     //   opt.reverseDashArray
//     // );
//     // Set the value of empty Dash array if not already set (only run on initialize and reset)
//     // if (!alreadySet) {
//     //   alreadySet = true;
//     //   oldDashLength = opt.dashArray[0];
//     //   dashLength = opt.dashArray[0];

//     //   oldGapLength = opt.dashArray[1];
//     //   gapLength = opt.dashArray[1];

//     //   // reverseDashArray = opt.reverseDashArray;
//     // }

//     let dStr, gStr: string;
//     // If not flipped: [gap, dash]
//     // If flipped [dash,gap]
//     if (reverseDashArray.value) {
//       dStr = "Dash:" + dashArray.value[0].toFixed(0);
//       gStr = "Gap:" + dashArray.value[1].toFixed(0);
//       return `${dStr}/${gStr}`;
//     } else {
//       dStr = "Dash:" + dashArray.value[1].toFixed(0);
//       gStr = "Gap:" + dashArray.value[0].toFixed(0);
//       return `${gStr}/${dStr}`;
//     }
//   } else return "";
// }

function updateInputGroup(inputSelector: string): void {
  EventBus.fire("update-input-group-with-selector", {
    inputSelector: inputSelector
  });
}
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
  "defaultStyles": "Restore Default Styles",
  "undoStyles": "Undo Style Changes"
}
</i18n>
