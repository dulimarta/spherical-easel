<template>
  <!-- {{ styleOptions }} -->
  <PopOverTabs
    :show-popup="showPopup"
    :name="editModeIsBack ? 'BG' : 'FG'"
    :disabled="selectedPlottables.size === 0">
    <template #tabs>
      <v-tab><v-icon>mdi-palette</v-icon></v-tab>
      <v-tab><v-icon>mdi-format-line-style</v-icon></v-tab>
      <v-tab v-if="hasStyle(/angle/)"><v-icon>mdi-angle-acute</v-icon></v-tab>
    </template>
    <template #pages>
      <v-window-item class="pa-2">
        <!-- FIRST TAB-->
        <div v-if="editModeIsBack">
          <!-- Enable the Dynamic Back Style Overlay -->
          <!-- Global contrast slider -->
          <v-tooltip location="bottom" max-width="400px">
            <template v-slot:activator="{ props }">
              <p v-bind="props">
                <span class="text-subtitle-2" style="color: red">
                  {{ t("globalBackStyleContrast") + " " }}
                </span>
                <span class="text-subtitle-2">
                  {{ t("backStyleContrast") }}
                  {{ " (" + Math.floor(backStyleContrast * 100) + "%)" }}
                </span>
              </p>
            </template>
            <span>{{ t("backStyleContrastToolTip") }}</span>
          </v-tooltip>
          <v-slider
            v-model="backStyleContrast"
            :min="0"
            :step="0.1"
            :max="1"
            :disabled="
              !styleOptions.dynamicBackStyle &&
              hasDisagreement('dynamicBackStyle')
            "
            @change="setBackStyleContrast"
            density="compact">
            <template v-slot:prepend>
              <!-- <v-icon @click="backStyleContrast -= 0.1">mdi-minus</v-icon> -->
            </template>
            <template v-slot:thumb-label="...a">
              {{
                backStyleContrastSelectorThumbStrings[
                  Math.floor((a as any).modelValue * 10)
                ]
              }}
            </template>
            <template v-slot:append>
              <!-- <v-icon @click="backStyleContrast += 0.1">mdi-plus</v-icon> -->
            </template>
          </v-slider>
        </div>
        <SimpleColorSelector
          :numSelected="selectedPlottables.size"
          :title="t('strokeColor')"
          v-if="hasStyle('strokeColor')"
          :conflict="hasDisagreement('strokeColor')"
          style-name="strokeColor"
          v-model="styleOptions.strokeColor" />
        <SimpleColorSelector
          :title="t('fillColor')"
          :numSelected="selectedPlottables.size"
          :conflict="hasDisagreement('fillColor')"
          v-if="hasStyle('fillColor')"
          style-name="fillColor"
          v-model="styleOptions.fillColor" />
      </v-window-item>
      <v-window-item class="pa-2">
        <!-- SECOND TAB-->
        <SimpleNumberSelector
          v-if="hasStyle('strokeWidthPercent')"
          :numSelected="selectedPlottables.size"
          :conflict="hasDisagreement('strokeWidthPercent')"
          v-model="styleOptions.strokeWidthPercent"
          :title="t('strokeWidthPercent')"
          :min="minStrokeWidthPercent"
          :max="maxStrokeWidthPercent"
          :color="conflictItems.strokeWidthPercent ? 'red' : ''"
          :step="20"
          :thumb-string-values="strokeWidthScaleSelectorThumbStrings" />
        <SimpleNumberSelector
          v-if="hasStyle('pointRadiusPercent')"
          :numSelected="selectedPlottables.size"
          v-model="styleOptions.pointRadiusPercent"
          :color="conflictItems.pointRadiusPercent ? 'red' : ''"
          :conflict="hasDisagreement('pointRadiusPercent')"
          :title="t('pointRadiusPercent')"
          :min="minPointRadiusPercent"
          :max="maxPointRadiusPercent"
          :step="20"
          :thumb-string-values="
            pointRadiusSelectorThumbStrings
          "></SimpleNumberSelector>
        <!-- Dis/enable Dash Pattern, Undo and Reset to Defaults buttons -->
        <div
          v-if="hasStyle('dashArray')"
          :style="{ display: 'flex', flexDirection: 'column' }">
          <div :style="{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center', justifyContent: 'space-between'
            }">
            <v-tooltip
              location="bottom"
              max-width="400px"
              activator="#use-dash"
              :text="t('dashPatternCheckBoxToolTip')" />
            <v-switch class="mr-4"
              id="use-dash"
              v-model="useDashPattern"
              density="compact"
              :color="hasDisagreement('dashArray') ? 'red' : ''">
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
              v-model="reverseDashArray"
              :color="conflictItems.reverseDashArray ? `red` : 'secondary'"
              density="compact">
              <template v-slot:label>
                <span
                  :style="{
                    color: conflictItems.reverseDashArray ? 'red' : ``
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
            min="0"
            strict
            :step="setStep(hasStyle('angleMarker'))"
            :disabled="emptyDashPattern"
            :max="setMax(hasStyle('angleMarker'))"
            :color="conflictItems.dashArray ? 'red' : ''"
            density="compact">
            <template #prepend>
              {{ reverseDashArray ? "Dash" : "Gap"}} {{ dashArray[0] }}
            </template>
            <template #append>
              {{ reverseDashArray ? "Gap" : "Dash"}} {{ dashArray[1] }}
            </template>
            <!--template v-slot:prepend>
            <v-icon
              @click="
                decrementDashPattern(styleOptions, hasStyle('angleMarker'))
              ">
              mdi-minus
            </v-icon>
          </!--template>

          <template-- v-slot:append>
            <v-icon
              @click="
                incrementDashPattern(styleOptions, hasStyle('angleMarker'))
              ">
              mdi-plus
            </v-icon>
          </template-->
          </v-range-slider>
        </div>
      </v-window-item>
      <v-window-item class="pa-2" v-if="hasStyle(/angle/)">
        <!-- THIRD TAB-->
        <!-- Angle Marker Decoration Selector -->
        <!--span class="text-subtitle-2">
        {{ $t(`style.angleMarkerOptions`) }}
      </span-->

        <SimpleNumberSelector
          :numSelected="selectedPlottables.size"
          :color="conflictItems.angleMarkerRadiusPercent ? 'red' : ''"
          :conflict="hasDisagreement('angleMarkerRadiusPercent')"
          v-on:resetColor="conflictItems.angleMarkerRadiusPercent = false"
          v-model="angleMarkerRadiusPercentage"
          :title="t('angleMarkerRadiusPercent')"
          :min="minAngleMarkerRadiusPercent"
          :max="maxAngleMarkerRadiusPercent"
          :step="20"
          :thumb-string-values="
            angleMarkerRadiusSelectorThumbStrings
          "></SimpleNumberSelector>
        <v-switch
          v-model="styleOptions.angleMarkerTickMark"
          :color="conflictItems.angleMarkerTickMark ? 'red' : ''"
          @change="
            updateInputGroup(
              'angleMarkerRadiusPercent,angleMarkerTickMark,angleMarkerDoubleArc'
            );
            conflictItems.angleMarkerTickMark = false;
          ">
          <template v-slot:label>
            <span
              :style="{
                color: conflictItems.angleMarkerTickMark ? 'red' : ``
              }">
              {{ t("angleMarkerTickMark") }}
            </span>
          </template>
        </v-switch>
        <v-switch
          v-model="styleOptions.angleMarkerDoubleArc"
          :color="conflictItems.angleMarkerDoubleArc ? 'red' : ''"
          @change="
            updateInputGroup(
              'angleMarkerRadiusPercent,angleMarkerTickMark,angleMarkerDoubleArc,angleMarkerAArrowHeads'
            ),
              (conflictItems.angleMarkerDoubleArc = false)
          ">
          <template v-slot:label>
            <span
              :style="{
                color: conflictItems.angleMarkerDoubleArc ? 'red' : ``
              }">
              {{ t("angleMarkerDoubleArc") }}
            </span>
          </template>
        </v-switch>

        <v-switch
          v-model="styleOptions.angleMarkerArrowHeads"
          :color="conflictItems.angleMarkerArrowHeads ? 'red' : ''"
          @change="
            updateInputGroup(
              'angleMarkerRadiusPercent,angleMarkerTickMark,angleMarkerDoubleArc,angleMarkerArrowHeads'
            ),
              (conflictItems.angleMarkerArrowHeads = false)
          ">
          <template v-slot:label>
            <span
              :style="{
                color: conflictItems.angleMarkerArrowHeads ? 'red' : ``
              }">
              {{ t("angleMarkerArrowHeads") }}
            </span>
          </template>
        </v-switch>
      </v-window-item>
    </template>
  </PopOverTabs>
  <!--ul>
          <li>Conclict list: {{conflictingProps}}</li>
          <li>Style Opt: {{styleOptions}}</li>
        </ul-->
  <!-- objects(s) not showing overlay ---higher z-index rendered on top -- covers entire panel including the header-->
</template>
<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, useAttrs, Ref } from "vue";
import Nodule from "@/plottables/Nodule";
import { StyleOptions, StyleEditPanels } from "@/types/Styles";
import SETTINGS from "@/global-settings";
import EventBus from "@/eventHandlers/EventBus";
import SimpleNumberSelector from "@/components/style-ui/StylePropertySlider.vue";
import SimpleColorSelector from "@/components/style-ui/StylePropertyColorPicker.vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useSEStore } from "@/stores/se";
import { useStylingStore } from "@/stores/styling";
import { onBeforeMount } from "vue";
import PopOverTabs from "./PopOverTabs.vue";
import { watch } from "vue";

type ConflictItems = {
  angleMarkerRadiusPercent: boolean;
  pointRadiusPercent: boolean;
  angleMarkerTickMark: boolean;
  angleMarkerDoubleArc: boolean;
  angleMarkerArrowHeads: boolean;
  strokeColor: boolean;
  fillColor: boolean;
  strokeWidthPercent: boolean;
  dashArray: boolean;
  reverseDashArray: boolean;
};
type ComponentProps = {
  showPopup: boolean;
  panel: StyleEditPanels;
};
const { attrs } = useAttrs();
const props = defineProps<ComponentProps>();
const seStore = useSEStore();
const styleStore = useStylingStore();
const { selectedPlottables, styleOptions } = storeToRefs(styleStore);
const { hasStyle, hasDisagreement } = styleStore;
const { selectedSENodules, oldStyleSelections, styleSavedFromPanel } =
  storeToRefs(seStore);
const { t } = useI18n({ useScope: "local" });
const angleMarkerRadiusPercentage = ref(
  styleOptions.value.angleMarkerRadiusPercent ?? 100
);
const dashArray: Ref<number[]> = ref(
  styleOptions.value.dashArray
    ? styleOptions.value.dashArray.slice(0)
    : [1, 5] /* be sure to use slice() to create a copy */
);
const useDashPattern = ref(true);
const reverseDashArray = ref<boolean>(
  styleOptions.value.reverseDashArray ?? false
);
const emptyDashPattern = computed(() => {
  if (!styleOptions.value.dashArray) return true;
  const dArr = styleOptions.value.dashArray;
  return dArr.length == 0;
});

watch(
  () => dashArray.value,
  dArr => {
    // TwoJS interpretation: dashes[0] = gap length; dashes[1] = dash length
    if (typeof styleOptions.value.dashArray === "undefined")
      styleOptions.value.dashArray = [0, 0];
    styleOptions.value.dashArray = [dArr[1], dArr[0]];
  },
  { deep: true, immediate: true }
);

watch(
  () => reverseDashArray.value,
  flip => {
    styleOptions.value.reverseDashArray = flip;
  },
  { immediate: true }
);

function resetAllItemsFromConflict(): void {
  // console.log("here reset input colors");
  const key = Object.keys(conflictItems);
  key.forEach(prop => {
    (conflictItems as any)[prop] = false;
  });
}
// @Watch("selectedSENodules")
// dashArrayUIUpdate(): void {
//   // update the emptyDashPattern boolean

//   console.log("hert", emptyDashPattern);
//   // hasStyle(/dashArray/);
//   // if (
//   //   styleOptions.dashArray[0] === 0 &&
//   //   styleOptions.dashArray[1] === 0
//   // ) {
//   //   emptyDashPattern = true;
//   // } else {
//   //   emptyDashPattern = false;
//   // }
//   //Force an update of UI slider.
//   const temp = emptyDashPattern;
//   emptyDashPattern = !emptyDashPattern;
//   dashArrayKey += 1;
//   dashPanelKey += 1;
//   activeDashPatternKey += 1;
//   activeReverseDashPatternKey += 1;
//   // update the panel
//   EventBus.fire("update-input-group-with-selector", {
//     inputSelector: "dashArray"
//   });
//   emptyDashPattern = temp;
// }
// @Watch("selectedSENodules")
// setAnglemarker(): void {
//   console.log("set ang mark");
//   isAngleMarker = selectedSENodules.every(
//     seNodule => seNodule instanceof SEAngleMarker
//   );
// }
// change the background color of the input if there is a conflict on that particular input
let conflictItems: ConflictItems = {
  angleMarkerRadiusPercent: false,
  angleMarkerTickMark: false,
  angleMarkerDoubleArc: false,
  angleMarkerArrowHeads: false,
  pointRadiusPercent: false,
  strokeColor: false,
  fillColor: false,
  strokeWidthPercent: false,
  dashArray: false,
  reverseDashArray: false
};

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
const dashArrayKey = ref(0);
const dashPanelKey = ref(0);
/** gapLength = sliderArray[1] */
let gapLength = 0;
let oldGapLength = 0;
/** dashLength= sliderArray[0] */
let dashLength = 0;
let oldDashLength = 0;
let alreadySet = false;
//private reverseDashArray = true;

const tooltipText = computed(() =>
  editModeIsBack.value
    ? selectedPlottables.value.size > 0
      ? t("backgroundStyle")
      : t("backgroundStyleDisabled")
    : selectedPlottables.value.size > 0
    ? t("foregroundStyle")
    : t("foregroundStyleDisabled")
);

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
// private usingAutomaticBackStyle = true;
function toggleUsingAutomaticBackStyle(opt: StyleOptions): void {
  // console.log(opt);
  if (opt.dynamicBackStyle !== undefined) {
    // console.log(
    //   "dynamic style before",
    //   opt.dynamicBackStyle
    //   // usingAutomaticBackStyle
    // );
    opt.dynamicBackStyle = !opt.dynamicBackStyle;
    // usingAutomaticBackStyle = !usingAutomaticBackStyle;
    // console.log(
    //   "dynamic style after",
    //   opt.dynamicBackStyle
    //   // usingAutomaticBackStyle
    // );
  }
}

// dbAgreement and udbCommonValue are computed by the program
// useDB is set by user
const backStyleContrast = ref(Nodule.getBackStyleContrast());
const backStyleContrastSelectorThumbStrings = [
  "Min",
  "10%",
  "20%",
  "30%",
  "40%",
  "50%",
  "60%",
  "70%",
  "80%",
  "90%",
  "Same"
];
function setBackStyleContrast(): void {
  seStore.changeBackContrast(backStyleContrast.value);
}

const conflictingPropNames: string[] = []; // this should always be identical to conflictingProps in the template above.

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

/** mounted() is part of VueJS lifecycle hooks */
onMounted((): void => {
  // Pass any selected objects when FrontBackStyle Panel is mounted to the onSelection change
  //  Mount a save listener
  // EventBus.listen("set-active-style-panel", setActivePanel);

  // Enable use automatic back styling only when we are mounted as a BackStyle
  // usingAutomaticBackStyle = props.panel === StyleEditPanels.Back;

  // setAnglemarker();
  EventBus.listen(
    "style-label-conflict-color-reset",
    resetAndRestoreConflictColors
  );
  EventBus.listen(
    "style-update-conflicting-props",
    (names: { propNames: string[] }): void => {
      // conflictingPropNames.forEach(name =>
      //   console.log("old prop", name)
      // );
      conflictingPropNames.splice(0);
      names.propNames.forEach(name => conflictingPropNames.push(name));
      // conflictingPropNames.forEach(name =>
      //   console.log("new prop", name)
      // );
    }
  );
  EventBus.listen(
    "update-empty-dash-array",
    (load: { emptyDashArray: boolean }): void => {
      console.log("set empty dash pattern");
      // emptyDashPattern.value = load.emptyDashArray;
    }
  );
});

function resetAndRestoreConflictColors(): void {
  alreadySet = false;
  resetAllItemsFromConflict();
  distinguishConflictingItems(conflictingPropNames);
}

onBeforeUnmount((): void => {
  EventBus.unlisten("style-label-conflict-color-reset");
  EventBus.unlisten("style-update-conflicting-props");
  EventBus.unlisten("update-empty-dash-array");
});
const editModeIsBack = computed((): boolean => {
  return props.panel === StyleEditPanels.Back;
});

const editModeIsFront = computed((): boolean => {
  return props.panel === StyleEditPanels.Front;
});

const allObjectsShowing = computed((): boolean => {
  return selectedSENodules.value.every(node => node.showing);
});

function toggleAllObjectsVisibility(): void {
  EventBus.fire("toggle-object-visibility", { fromPanel: true });
}

function activeDashPattern(opt: StyleOptions): string {
  if (dashArray.value) {
    // console.log(
    //   "dash array in active dash pattern",
    //   opt.dashArray[0], //dash length
    //   opt.dashArray[1], // gap length
    //   opt.reverseDashArray
    // );
    // Set the value of empty Dash array if not already set (only run on initialize and reset)
    // if (!alreadySet) {
    //   alreadySet = true;
    //   oldDashLength = opt.dashArray[0];
    //   dashLength = opt.dashArray[0];

    //   oldGapLength = opt.dashArray[1];
    //   gapLength = opt.dashArray[1];

    //   // reverseDashArray = opt.reverseDashArray;
    // }

    let dStr, gStr: string;
    // If not flipped: [gap, dash]
    // If flipped [dash,gap]
    if (reverseDashArray.value) {
      dStr = "Dash:" + dashArray.value[0].toFixed(0);
      gStr = "Gap:" + dashArray.value[1].toFixed(0);
      return `${dStr}/${gStr}`;
    } else {
      dStr = "Dash:" + dashArray.value[1].toFixed(0);
      gStr = "Gap:" + dashArray.value[0].toFixed(0);
      return `${gStr}/${dStr}`;
    }
  } else return "";
}

// Every change in the  dash pattern slider is recorded in opt.dashArray *and* in the local dashLength, dashGap
function updateLocalGapDashVariables(opt: StyleOptions, num: number[]): void {
  // sliderDashArray.splice(0);
  // console.log("num array", num[0], num[1]);
  if (opt.dashArray) {
    //store the gap/dash in the old gap/dash lengths
    oldDashLength = dashLength;
    dashLength = opt.dashArray[0];

    oldGapLength = gapLength;
    gapLength = opt.dashArray[1];
    // console.log("old dash/gap", oldDashLength, oldGapLength);
    // console.log("current dash/gap", dashLength, gapLength);
  }
}
function toggleDashPatternReverse(opt: StyleOptions): void {
  // if (opt.reverseDashArray) {
  //   reverseDashArray = opt.reverseDashArray;
  // }
  opt.dashArray?.splice(0);
  opt.dashArray?.push(dashLength, gapLength); // trigger an update by updateing the dashArray with its current values
  // update the panel
  EventBus.fire("update-input-group-with-selector", {
    inputSelector: "dashArray"
  });
}

function updateInputGroup(inputSelector: string): void {
  EventBus.fire("update-input-group-with-selector", {
    inputSelector: inputSelector
  });
}

function toggleDashPatternSliderAvailbility(opt: StyleOptions): void {
  // emptyDashPattern = !emptyDashPattern; //NO NEED FOR THIS BEBCAUSE THE CHECK BOX HAS ALREADY TOGGLED IT!
  if (!emptyDashPattern && opt.dashArray) {
    // console.log(
    //   "old gap/dash in toogle",
    //   oldGapLength,
    //   oldDashLength
    // );
    gapLength = oldGapLength;
    dashLength = oldDashLength;
    opt.dashArray?.splice(0);
    opt.dashArray?.push(oldDashLength, oldGapLength); // trigger an update
  } else if (opt.dashArray) {
    //update the old gap/dash lengths
    oldGapLength = gapLength;
    oldDashLength = dashLength;
    // console.log("set the dash array to [0,0]");
    // set the dashArray to the no dash pattern array of [0,0]
    opt.dashArray?.splice(0);
    opt.dashArray?.push(0, 0);
  }
  // Force an update of UI slider.
  dashArrayKey.value += 1;
  dashPanelKey.value += 1;
  // update the panel
  EventBus.fire("update-input-group-with-selector", {
    inputSelector: "dashArray"
  });
}

function incrementDashPattern(opt: StyleOptions, angleMarker: boolean): void {
  // increases the length of the dash and the gap by a step
  /** gapLength = sliderArray[0] */
  /** dashLength= sliderArray[1] - sliderArray[0] */
  const step = angleMarker
    ? SETTINGS.angleMarker.sliderStepSize
    : SETTINGS.style.sliderStepSize;
  const max = angleMarker
    ? SETTINGS.angleMarker.maxGapLengthOrDashLength
    : SETTINGS.style.maxGapLengthOrDashLength;

  if (gapLength + step <= max && dashLength + step <= max) {
    //sliderDashArray[1] + 2 * step <= max) {
    // Vue.set(
    //   sliderDashArray,
    //   sliderDashArray[0] + step,
    //   sliderDashArray[1] + 2 * step
    // );

    // const val1 = sliderDashArray[0] + step;
    // const val2 = sliderDashArray[1] + 2 * step;
    // sliderDashArray.splice(0);
    // sliderDashArray.push(val1, val2);
    oldGapLength = gapLength;
    oldDashLength = dashLength;
    gapLength += step;
    dashLength += step;
    if (opt.dashArray) {
      // console.debug(
      //   "Updating styleoption dash array + step",
      //   gapLength,
      //   gapLength + dashLength
      // );
      opt.dashArray?.splice(0);
      opt.dashArray?.push(dashLength, gapLength); // trigger the update
    }
  }
}

function decrementDashPattern(opt: StyleOptions, angleMarker: boolean): void {
  // decreases the length of the dash and the gap by a step
  /** gapLength = sliderArray[0] */
  /** dashLength= sliderArray[1] - sliderArray[0] */
  const step = angleMarker
    ? SETTINGS.angleMarker.sliderStepSize
    : SETTINGS.style.sliderStepSize;
  const min = 0;

  if (gapLength - step >= min && dashLength - step >= min) {
    // Vue.set(
    //   sliderDashArray,
    //   sliderDashArray[0] - 2 * step,
    //   sliderDashArray[1] - step
    // );
    oldGapLength = gapLength;
    oldDashLength = dashLength;
    gapLength -= step;
    dashLength -= step;
    if (opt.dashArray) {
      // console.debug(
      //   "Updating styleoption dash array - step",
      //   gapLength,
      //   gapLength + dashLength
      // );
      opt.dashArray?.splice(0);
      opt.dashArray?.push(dashLength, gapLength); // trigger the update
    }
  }
}

function distinguishConflictingItems(conflictingProps: string[]): void {
  conflictingProps.forEach(conflictPropName => {
    (conflictItems as any)[conflictPropName] = true;
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
  "backStyleContrast": "Back Style Contrast",
  "backStyleContrastToolTip": "By default the back side display style of an object is determined by the front style of that object and the value of Global Back Style Contrast. A Back Style Contrast of 100% means there is no color or size difference between front and back styling. A Back Style Contrast of 0% means that the object is invisible and its size reduction is maximized.",
  "dashArrayReverse": "Swap Dash/Gap",
  "dashPattern": "Use dash pattern",
  "dashPatternCheckBoxToolTip": "Enable or Disable a dash pattern for the selected objects.",
  "dashPatternReverseArrayToolTip": "Switch the dash and gap lengths so that the gap length can be less than the dash length",
  "fillColor": "Fill Color",
  "globalBackStyleContrast": "Global Back Style Contrast",
  "labelStyleOptionsMultiple": "(Multiple)",
  "pointRadiusPercent": "Point Radius (%)",
  "strokeColor": "Stroke Color",
  "strokeWidthPercent": "Stroke Width (%)"
}
</i18n>
@/composables/StyleEditor
