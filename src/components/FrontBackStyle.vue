<template>
  <div>
    <!-- objects(s) not showing overlay ---higher z-index rendered on top -- covers entire panel including the header-->
    <OverlayWithFixButton
      v-if="( editModeIsFront || editModeIsBack ) && !allObjectsShowing()"
      z-index="100"
      i18n-title-line="style.objectNotVisible"
      i18n-subtitle-line="style.clickToMakeObjectsVisible"
      i18n-button-label="style.makeObjectsVisible"
      i18n-button-tool-tip="style.objectsNotShowingToolTip"
      @click="toggleAllObjectsVisibility">
    </OverlayWithFixButton>
    <!-- Back Style Contrast Slider -->
    <fade-in-card :showWhen="editModeIsBack"
      color="red">
      <span
        class="text-subtitle-2">{{ $t('style.backStyleContrast') }}</span>
      <span>
        {{" ("+ Math.floor(backStyleContrast*100)+"%)" }}
      </span>
      <br />

      <!-- Enable the Dynamic Back Style Overlay -->
      <OverlayWithFixButton v-if="editModeIsBack && hasDynamicBackStyle && usingDynamicBackStyleAgreement 
        && !(usingDynamicBackStyle || usingDynamicBackStyleCommonValue)"
        z-index="5"
        i18n-title-line="style.dynamicBackStyleHeader"
        i18n-button-label="style.enableDynamicBackStyle"
        i18n-button-tool-tip="style.disableDynamicBackStyleToolTip"
        @click="toggleBackStyleOptionsAvailability">
      </OverlayWithFixButton>

      <!-- The contrast slider -->
      <v-tooltip bottom
        :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay"
        max-width="400px">
        <template v-slot:activator="{ on }">
          <v-slider v-model.number="backStyleContrast"
            :min="0"
            v-on="on"
            step="0.1"
            @change="onBackStyleContrastChange"
            :max="1"
            type="range"
            :disabled="!usingDynamicBackStyle"
            dense>
            <template v-slot:prepend>
              <v-icon @click="decrementBackStyleContrast">mdi-minus
              </v-icon>
            </template>
            <template v-slot:thumb-label="{ value }">
              {{ backStyleContrastSelectorThumbStrings[Math.floor(value*10)] }}
            </template>
            <template v-slot:append>
              <v-icon @click="incrementBackStyleContrast">mdi-plus
              </v-icon>
            </template>
          </v-slider>
        </template>
        <span>{{ $t("style.backStyleContrastToolTip") }}</span>
      </v-tooltip>

      <!-- Undo and Reset to Defaults buttons -->
      <v-container>
        <v-row justify="end">
          <!-- Undo and Reset to Defaults buttons -->
          <v-col cols="1"
            class="ma-0 pl-0 pr-0 pt-0 pb-2">
            <HintButton @click="clearStyleData('dynamicBackStyle')"
              data-se-props="dynamicBackStyle"
              data-se-flag="dynBackGroup"
              :disabled="disableControl['dynBackGroup']"
              type="undo"
              i18n-label="style.clearChanges"
              i18n-tooltip="style.clearChangesToolTip">
            </HintButton>
          </v-col>

          <v-col cols="2"
            class="ma-0 pl-0 pr-0 pt-0 pb-2">
            <HintButton
              @click="resetStyleDataToDefaults('dynamicBackStyle')"
              type="default"
              i18n-label="style.restoreDefaults"
              i18n-tooltip="style.restoreDefaultsToolTip">
            </HintButton>
          </v-col>
        </v-row>
      </v-container>
    </fade-in-card>

    <!-- Scope of the Disable Dynamic Back Style Overlay and the BackStyle Disagreemnt overlay-->
    <!--v-card color="grey lighten-2"-->

    <!-- Disable the Dynamic Back Style Overlay -->
    <OverlayWithFixButton v-if="editModeIsBack && hasDynamicBackStyle && usingDynamicBackStyleAgreement &&
        (usingDynamicBackStyle || usingDynamicBackStyleCommonValue)"
      z-index="50"
      i18n-title-line="style.dynamicBackStyleHeader"
      i18n-button-label="style.disableDynamicBackStyle"
      i18n-button-tool-tip="style.disableDynamicBackStyleToolTip"
      @click="toggleBackStyleOptionsAvailability">
    </OverlayWithFixButton>

    <!-- usingDynamicBackStyle disagreemnt  -->
    <OverlayWithFixButton
      v-if="editModeIsBack&& hasDynamicBackStyle && !usingDynamicBackStyleAgreement"
      z-index="40"
      i18n-title-line="style.backStyleDisagreement"
      i18n-button-label="style.enableCommonStyle"
      i18n-button-tool-tip="style.differentValuesToolTip"
      @click="setCommonDynamicBackStyleAgreement">
    </OverlayWithFixButton>

    <!-- Front/Back Stroke Color Selector-->
    <fade-in-card
      v-show="hasStrokeColor || hasStrokeWidthPercent || hasFillColor">
      <SimpleColorSelector titleKey="style.strokeColor"
        v-if="hasStrokeColor"
        style-name="strokeColor"
        :data.sync="hslaStrokeColorObject" />

      <SimpleNumberSelector v-if="hasStrokeWidthPercent"
        v-bind:data.sync="activeStyleOptions.strokeWidthPercent"
        title-key="style.strokeWidthPercent"
        v-bind:min-value="minStrokeWidthPercent"
        v-bind:max-value="maxStrokeWidthPercent"
        v-bind:step="20"
        :thumb-string-values="strokeWidthScaleSelectorThumbStrings">
      </SimpleNumberSelector>
      <!-- Front/Back Fill Color Selector-->
      <SimpleColorSelector title-key="style.fillColor"
        v-if="hasFillColor"
        style-name="fillColor"
        :data.sync="hslaFillColorObject" />
      <v-container>
        <v-row justify="end">
          <!-- Undo and Reset to Defaults buttons -->
          <v-col cols="1"
            class="ma-0 pl-0 pr-0 pt-0 pb-2">
            <HintButton
              @click="clearStyleData('strokeColor,strokeWidthPercent,fillColor')"
              data-se-props="strokeColor,strokeWidthPercent,fillColor"
              data-se-flag="colorGroup"
              :disabled="disableControl['colorGroup']"
              type="undo"
              i18n-label="style.clearChanges"
              i18n-tooltip="style.clearChangesToolTip">
            </HintButton>
          </v-col>

          <v-col cols="2"
            class="ma-0 pl-0 pr-0 pt-0 pb-2">
            <HintButton
              @click="resetStyleDataToDefaults('strokeColor,strokeWidthPercent,fillColor', 'two')"
              type="default"
              i18n-label="style.restoreDefaults"
              i18n-tooltip="style.restoreDefaultsToolTip">
            </HintButton>
          </v-col>
        </v-row>
      </v-container>
    </fade-in-card>

    <!-- Front/Back Stokewidth Number Selector -->
    <div v-show="showMoreLabelStyles && activeStyleOptions">
      <!--- Front/Back Point Radius Number Selector -->
      <fade-in-card v-show="hasPointRadiusPercent">
        <SimpleNumberSelector v-if="hasPointRadiusPercent"
          :data.sync="activeStyleOptions.pointRadiusPercent"
          title-key="style.pointRadiusPercent"
          :min-value="minPointRadiusPercent"
          :max-value="maxPointRadiusPercent"
          :step="20"
          :thumb-string-values="pointRadiusSelectorThumbStrings">
        </SimpleNumberSelector>
        <v-container>
          <v-row justify="end">
            <!-- Undo and Reset to Defaults buttons -->
            <v-col cols="1"
              class="ma-0 pl-0 pr-0 pt-0 pb-2">
              <HintButton @click="clearStyleData('pointRadiusPercent')"
                data-se-props="pointRadiusPercent"
                data-se-flag="pointGroup"
                :disabled="disableControl[`pointGroup`]"
                type="undo"
                i18n-label="style.clearChanges"
                i18n-tooltip="style.clearChangesToolTip">
              </HintButton>
            </v-col>

            <v-col cols="2"
              class="ma-0 pl-0 pr-0 pt-0 pb-2">
              <HintButton
                @click="resetStyleDataToDefaults('pointRadiusPercent')"
                type="default"
                i18n-label="style.restoreDefaults"
                i18n-tooltip="style.restoreDefaultsToolTip">
              </HintButton>
            </v-col>
          </v-row>
        </v-container>
      </fade-in-card>
      <!--- Front/Back Angle Marker Radius Number Selector -->
      <fade-in-card
        v-show="hasAngleMarkerRadiusPercent || hasAngleMarkerDecoration">
        <SimpleNumberSelector
          v-if="editModeIsFront && hasAngleMarkerRadiusPercent"
          :data.sync="activeStyleOptions.angleMarkerRadiusPercent"
          title-key="style.angleMarkerRadiusPercent"
          :min-value="minAngleMarkerRadiusPercent"
          :max-value="maxAngleMarkerRadiusPercent"
          :step="20"
          :thumb-string-values="angleMarkerRadiusSelectorThumbStrings">
        </SimpleNumberSelector>
        <!-- Angle Marker Decoration Selector -->

        <v-select v-model="angleMarkerDecorations"
          v-if="hasAngleMarkerDecoration"
          class="my-2"
          v-bind:label="$t('style.angleMarkerDecorations')"
          :items="angleMarkerDecorationItems"
          filled
          outlined
          small-chips
          dense
          multiple>
        </v-select>
        <!-- Undo and Reset to Defaults buttons -->
        <v-container>
          <v-row justify="end">
            <!-- Undo and Reset to Defaults buttons -->
            <v-col cols="1"
              class="ma-0 pl-0 pr-0 pt-0 pb-2">
              <HintButton
                @click="clearStyleData('angleMarkerRadiusPercent,angleMarkerDecoration')"
                data-se-props="angleMarkerRadiusPercent,angleMarkerDecoration"
                data-se-flag="angleMarkerGroup"
                :disabled="disableControl[`angleMarkerGroup`]"
                type="undo"
                i18n-label="style.clearChanges"
                i18n-tooltip="style.clearChangesToolTip">
              </HintButton>
            </v-col>

            <v-col cols="2"
              class="ma-0 pl-0 pr-0 pt-0 pb-2">
              <HintButton
                @click="resetStyleDataToDefaults('angleMarkerRadiusPercent,angleMarkerDecoration')"
                type="default"
                i18n-label="style.restoreDefaults"
                i18n-tooltip="style.restoreDefaultsToolTip">
              </HintButton>
            </v-col>
          </v-row>
        </v-container>
      </fade-in-card>

      <!-- Front/Back Dash array card is displayed for front and back so long as there is a dash array property common to all selected objects-->
      <fade-in-card v-if="hasDashPattern">
        <span v-show="editModeIsFront"
          class="text-subtitle-2">{{ $t("style.front") }}</span>
        <span v-show="editModeIsBack"
          class="text-subtitle-2">{{ $t("style.back") }}</span>

        <span
          class="text-subtitle-2">{{" "+ $t("style.dashPattern") }}</span>
        <span v-if="selectedSENodules.length > 1"
          class="text-subtitle-2"
          style="color:red">{{" "+ $t("style.labelStyleOptionsMultiple") }}</span>
        <span v-show="!emptyDashPattern &&
            !totallyDisableDashPatternSelector &&
            dashPatternAgreement">
          {{ activeDashPattern }}
        </span>

        <!-- The dash property slider -->
        <v-range-slider v-model="activeStyleOptions.dashArray"
          :min="0"
          step="2"
          :disabled="
          !dashPatternAgreement ||
            totallyDisableDashPatternSelector ||
            emptyDashPattern"
          :max="maxGapLengthPlusDashLength"
          type="range"
          dense>
          <!-- Since we are changing two numbers, the icons are confusing to the user -->
          <!--template v-slot:prepend>
            <v-icon @click="decrementDashPattern">mdi-minus</v-icon>
          </template>

          <template v-slot:append>
            <v-icon @click="incrementDashPattern">mdi-plus</v-icon>
          </template-->
        </v-range-slider>

        <!-- Dis/enable Dash Pattern, Undo and Reset to Defaults buttons -->
        <v-container class="pa-0 ma-0">
          <v-row justify="end"
            no-gutters>
            <v-col cols="8">
              <v-tooltip bottom
                :open-delay="toolTipOpenDelay"
                :close-delay="toolTipCloseDelay"
                max-width="400px">
                <template v-slot:activator="{ on }">
                  <span v-on="on">
                    <v-checkbox v-model="emptyDashPattern"
                      :false-value="true"
                      :true-value="false"
                      :label="$t('style.dashPattern')"
                      color="indigo darken-3"
                      @change="toggleDashPatternSliderAvailibity"
                      hide-details
                      x-small
                      dense></v-checkbox>
                  </span>
                </template>
                {{$t('style.dashPatternCheckBoxToolTip')}}
              </v-tooltip>
            </v-col>

            <!-- Undo and Reset to Defaults buttons -->
            <v-col cols="1"
              class="ma-0 pl-0 pr-0 pt-0 pb-2">
              <HintButton @click="clearStyleData('dashArray')"
                data-se-props="dashArray"
                data-se-flag="dashPatternGroup"
                :disabled="disableControl[`dashPatternGroup`]"
                type="undo"
                i18n-label="style.clearChanges"
                i18n-tooltip="style.clearChangesToolTip">
              </HintButton>
            </v-col>

            <v-col cols="2"
              class="ma-0 pl-0 pr-0 pt-0 pb-2">
              <HintButton @click="resetStyleDataToDefaults('dashArray')"
                type="default"
                i18n-label="style.restoreDefaults"
                i18n-tooltip="style.restoreDefaultsToolTip">
              </HintButton>
            </v-col>
          </v-row>
        </v-container>
      </fade-in-card>
    </div>
    <v-container class="pa-0 ma-0">
      <v-row no-gutters>
        <v-col cols="auto">
          <v-tooltip bottom
            :open-delay="toolTipOpenDelay"
            :close-delay="toolTipCloseDelay"
            max-width="400px"
            class="pa-0 pm-0">
            <template v-slot:activator="{on}">
              <v-btn v-on="on"
                @click="toggleShowMoreLabelStyles"
                class="text-subtitle-2"
                text
                plain
                ripple
                x-small>
                <v-icon v-if="showMoreLabelStyles">mdi-chevron-up
                </v-icon>
                <v-icon v-else>mdi-chevron-down </v-icon>
              </v-btn>
            </template>
            {{$t('style.toggleStyleOptionsToolTip')}}
          </v-tooltip>
        </v-col>
      </v-row>
    </v-container>
  </div>

</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Watch, Prop } from "vue-property-decorator";
import { SENodule } from "../models/SENodule";
import Nodule from "../plottables/Nodule";
import { namespace } from "vuex-class";
import { StyleOptions, StyleEditPanels } from "../types/Styles";
import SETTINGS from "@/global-settings";
import FadeInCard from "@/components/FadeInCard.vue";
import { hslaColorType, AppState, LabelDisplayMode } from "@/types";
import { StyleNoduleCommand } from "@/commands/StyleNoduleCommand";
import EventBus from "@/eventHandlers/EventBus";
import NumberSelector from "@/components/NumberSelector.vue";
import SimpleNumberSelector from "@/components/SimpleNumberSelector.vue";
import SimpleColorSelector from "@/components/SimpleColorSelector.vue";
import ColorSelector from "@/components/ColorSelector.vue";
import i18n from "../i18n";
import HintButton from "@/components/HintButton.vue";
import OverlayWithFixButton from "@/components/OverlayWithFixButton.vue";
import { SEStore } from "@/store";
const SE = namespace("se");

// import { getModule } from "vuex-module-decorators";
// import UI from "@/store/ui-styles";
type labelDisplayModeItem = {
  text: any; //typeof VueI18n.TranslateResult
  value: LabelDisplayMode;
  optionRequiresMeasurementValueToExist: boolean;
  optionRequiresCaptionToExist: boolean;
};

@Component({
  components: {
    FadeInCard,
    NumberSelector,
    SimpleNumberSelector,
    ColorSelector,
    SimpleColorSelector,
    HintButton,
    OverlayWithFixButton
  }
})
export default class FrontBackStyle extends Vue {
  @Prop()
  readonly panel!: StyleEditPanels; // This is a constant in each copy of the BasicFrontBackStyle

  @Prop()
  readonly activePanel!: StyleEditPanels;

  @SE.State((s: AppState) => s.selectedSENodules)
  readonly selectedSENodules!: SENodule[];

  @SE.State((s: AppState) => s.initialBackStyleContrast)
  readonly initialBackStyleContrast!: number;

  @SE.State((s: AppState) => s.oldStyleSelections)
  readonly oldStyleSelection!: SENodule[];

  @SE.State((s: AppState) => s.styleSavedFromPanel)
  readonly styleSavedFromPanel!: StyleEditPanels;

  // The following object should match all the data-se-flag attributes
  // found in the <template>
  disableControl = {
    colorGroup: true,
    pointGroup: true,
    angleMarkerGroup: true,
    dashPatternGroup: true,
    dynBackGroup: true
  };
  /**
   * These are the temp style state for the selected objects. Used to set the color/number/dash/contrast selectors when the user disables the dynamic back styling.
   */
  private tempStyleStates: StyleOptions[] = [];

  /**
   * These help with redo/redo
   */
  private currentStyleStates: StyleOptions[] = [];

  /**
   * Help to display all the availble styling choices when nothing is selected
   */
  // private noObjectsSelected = true;

  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;
  /**
   * There are many style options. In the case that there
   * are more than one object selected, the XXXAgreement boolean indicates if the XXX property is *initially* the
   * same across the selected objects. In the case that they are not initially the same, the cooresponding adjustment tool
   * is display in a different way than the usual default.
   */

  private maxStrokeWidthPercent = SETTINGS.style.maxStrokeWidthPercent;
  private minStrokeWidthPercent = SETTINGS.style.minStrokeWidthPercent;
  //step is 20 from 60 to 200 is 8 steps
  private strokeWidthScaleSelectorThumbStrings = [
    "-40%",
    "-20%",
    "0%",
    "20%",
    "40%",
    "60%",
    "80%",
    "100%"
  ];

  private styleDataAgreement = true;
  private totalyDisableStyleDataSelector = false;

  //Many of the label style will not be commonly modified so create a button/variable for
  // the user to click to show more of the Label Styling options
  private showMoreLabelStyles = false;
  private moreOrLessText = i18n.t("style.moreStyleOptions"); // The text for the button to toggle between less/more options

  private maxPointRadiusPercent = SETTINGS.style.maxPointRadiusPercent;
  private minPointRadiusPercent = SETTINGS.style.minPointRadiusPercent;
  //step is 20 from 60 to 200 is 8 steps
  private pointRadiusSelectorThumbStrings = [
    "-40%",
    "-20%",
    "0%",
    "20%",
    "40%",
    "60%",
    "80%",
    "100%"
  ];

  private maxAngleMarkerRadiusPercent =
    SETTINGS.style.maxAngleMarkerRadiusPercent;
  private minAngleMarkerRadiusPercent =
    SETTINGS.style.minAngleMarkerRadiusPercent;
  //step is 20 from 60 to 200 is 8 steps
  private angleMarkerRadiusSelectorThumbStrings = [
    "-40%",
    "-20%",
    "0%",
    "20%",
    "40%",
    "60%",
    "80%",
    "100%"
  ];

  private angleMarkerDecorations: string[] | undefined = [];
  private angleMarkerDecorationItems = [
    {
      text: i18n.t("style.angleMarkerTickMark"),
      value: "tickMark"
    },
    {
      text: i18n.t("style.angleMarkerDoubleArc"),
      value: "doubleArc"
    }
  ];
  private angleMarkerDecorationsAgreement = true;
  private totalyDisableAngleMarkerDecorationsSelector = false;

  private hslaStrokeColorObject: hslaColorType = { h: 0, s: 1, l: 1, a: 0.001 }; // Color for Vuetify Color picker NOTE: setting a=0 creates the following error:
  // create a circle, open the style panel, select the circle when the basic panel is open, switch to the foreground panel, the selected circle has a displayed opacity of 0 --
  // that is the blinking is between nothing and a red circle glowing circle) The color picker display is correct though... strange!
  private hslaFillColorObject: hslaColorType = { h: 0, s: 1, l: 1, a: 0.001 }; // Color for Vuetify Color picker
  private hslaLabelFrontFillColorObject: hslaColorType = {
    h: 0,
    s: 1,
    l: 1,
    a: 0.001
  };
  private hslaLabelBackFillColorObject: hslaColorType = {
    h: 0,
    s: 1,
    l: 1,
    a: 0.001
  }; // Color for Vuetify Color picker

  /** gapLength = sliderArray[0] */
  private gapLength = 5;
  /** dashLength= sliderArray[1] - sliderArray[0] */
  private dashLength = 10;
  /** gap then dash in DashPattern when passed to object*/
  private dashPatternAgreement = true;
  private totallyDisableDashPatternSelector = false;
  /** sliderDashArray[1]- sliderDashArray[0] is always positive or zero and equals dashLength */
  private sliderDashArray: number[] = [5, 15];
  private emptyDashPattern = false;
  private maxGapLengthPlusDashLength =
    SETTINGS.style.maxGapLengthPlusDashLength;

  private totallyDisableDynamicBackStyleSelector = false;
  // usingDynamicBackStyleAgreement indicates if all the usingDynamicBackStyle booleans are the same (either T or F)
  private usingDynamicBackStyleAgreement = true;
  // usingDynamicBackStyleCommonValue = true indicates ( when usingDynamicBackStyleAgreement = true ) that
  // all selected objects have the dynamicBackstyle = true
  // usingDynamicBackStyleCommonValue = false indicates ( when usingDynamicBackStyleAgreement = true ) that
  // all selected objects have the dynamicBackstyle = false
  // if usingDynamicBackStyleAgreement = false then usingDynamicBackStyleCommonValue is meaningless
  // if usingDynamicBackStyleAgreement = true and usingDynamicBackStyleCommonValue is undefined, then something went horribly wrong!
  private usingDynamicBackStyleCommonValue: boolean | undefined = true;
  // usingDynamicBackStyle = false means that the user is setting the color for the back on their own and is
  // *not* using the contrast (i.e. not using the dynamic back styling)
  // usingDynamicBackStyle = true means the program is setting the style of the back objects
  private usingDynamicBackStyle: boolean | undefined = true;

  private backStyleContrast = Nodule.getBackStyleContrast();
  private backStyleContrastSelectorThumbStrings = [
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

  private activeStyleOptions: StyleOptions | null = null;
  private pastStyleOptions: StyleOptions | null = null;
  commonStyleProperties: string[] = [];

  constructor() {
    super();
  }

  /** mounted() is part of VueJS lifecycle hooks */
  mounted(): void {
    // Pass any selected objects when FrontBackStyle Panel is mounted to the onSelection change
    this.onSelectionChanged(this.selectedSENodules);
    //  Mount a save listener
    EventBus.listen("save-style-state", this.saveStyleState);
    // EventBus.listen("set-active-style-panel", this.setActivePanel);
    console.debug("In mounted()", this.$el);

    // const elems = this.$el.querySelectorAll("[data-se-props]");
    // for (let k = 0; k < elems.length; k++) {
    //   const z = elems.item(k);
    //   // console.debug("Marked element is", z);
    // }
  }
  get editModeIsBack(): boolean {
    return this.panel === StyleEditPanels.Back;
  }

  get editModeIsFront(): boolean {
    return this.panel === StyleEditPanels.Front;
  }
  get activeDashPattern(): string {
    if (this.activeStyleOptions && this.activeStyleOptions.dashArray) {
      const dashLength = this.activeStyleOptions.dashArray[0];
      const gapLength = this.activeStyleOptions.dashArray[1];
      return `(${dashLength}/${gapLength})`;
    } else return "";
  }

  toggleShowMoreLabelStyles(): void {
    this.showMoreLabelStyles = !this.showMoreLabelStyles;
    if (!this.showMoreLabelStyles) {
      this.moreOrLessText = i18n.t("style.moreStyleOptions");
    } else {
      this.moreOrLessText = i18n.t("style.lessStyleOptions");
    }
  }
  toggleAllObjectsVisibility(): void {
    EventBus.fire("toggle-object-visibility", { fromPanel: true });
  }
  allObjectsShowing(): boolean {
    return this.selectedSENodules.every(node => node.showing);
  }

  clearStyleData(props: string): void {
    const listOfProps = props.split(",");
    console.debug("Reset to start of edit session", listOfProps);

    const initialStyleStates = SEStore.getInitialStyleState(this.panel);
    this.selectedSENodules.forEach((n: SENodule, k: number) => {
      // Start with an empty update bundle
      const payload: StyleOptions = {};

      // Include only the properties we want to clear
      listOfProps.forEach((p: string) => {
        (payload as any)[p] = (initialStyleStates[k] as any)[p];
      });

      SEStore.changeStyle({
        selected: [n],
        panel: this.panel,
        payload
      });
    });
  }
  resetStyleDataToDefaults(props: string, flag: string): void {
    const listOfProps = props.split(",");
    console.debug("Reset to default properties", listOfProps);

    const defaultState = SEStore.getDefaultStyleState(this.panel);
    this.selectedSENodules.forEach((n: SENodule, k: number) => {
      // Start with an empty update bundle
      const payload: StyleOptions = {};

      // Include only the properties we want to restore to default
      listOfProps.forEach((p: string) => {
        (payload as any)[p] = (defaultState[k] as any)[p];
      });

      SEStore.changeStyle({
        selected: [n],
        panel: this.panel,
        payload
      });
    });
  }

  // These methods are linked to the dashPattern fade-in-card
  setCommonDashPatternAgreement(): void {
    this.dashPatternAgreement = true;
  }
  clearRecentDashPatternChanges(): void {
    const selected = this.selectedSENodules;
    const initialStyleStates = SEStore.getInitialStyleState(this.panel);
    for (let i = 0; i < selected.length; i++) {
      // Check see if the initialStylesStates[i] exist and has length >0
      if (
        initialStyleStates[i].dashArray &&
        (initialStyleStates[i].dashArray as number[]).length > 0
      ) {
        SEStore.changeStyle({
          selected: [selected[i]],
          panel: this.panel,
          payload: {
            dashArray: [
              (initialStyleStates[i].dashArray as number[])[0],
              (initialStyleStates[i].dashArray as number[])[1]
            ]
          }
        });
      } else if (initialStyleStates[i].dashArray) {
        // The selected [i] exists and the array is empty
        SEStore.changeStyle({
          selected: [selected[i]],
          panel: this.panel,
          payload: {
            dashArray: []
          }
        });
      }
    }
    this.setDashPatternSelectorState(initialStyleStates);
  }

  toggleDashPatternSliderAvailibity(): void {
    if (!this.emptyDashPattern) {
      this.sliderDashArray.clear();
      this.sliderDashArray.push(this.gapLength as number);
      this.sliderDashArray.push(
        (this.dashLength as number) + (this.gapLength as number)
      );

      SEStore.changeStyle({
        selected: this.selectedSENodules,
        panel: this.panel,
        payload: {
          dashArray: [this.dashLength, this.gapLength]
        }
      });
    } else {
      SEStore.changeStyle({
        selected: this.selectedSENodules,
        panel: this.panel,
        payload: {
          dashArray: []
        }
      });
      this.sliderDashArray.clear();
      this.sliderDashArray.push(4);
      this.sliderDashArray.push(16);
    }
    // this.emptyDashPattern = !this.emptyDashPattern;
  }
  incrementDashPattern(): void {
    // increasing the value of the sliderDashArray[1] increases the length of the dash
    if (
      this.sliderDashArray[1] + 1 <=
      SETTINGS.style.maxGapLengthPlusDashLength
    ) {
      Vue.set(this.sliderDashArray, 1, this.sliderDashArray[1] + 1); // trigger the update
      this.gapLength = this.sliderDashArray[0];
      this.dashLength = this.sliderDashArray[1] - this.sliderDashArray[0];

      SEStore.changeStyle({
        selected: this.selectedSENodules,
        panel: this.panel,
        payload: {
          dashArray: [this.dashLength, this.gapLength]
        }
      });
    }
  }
  decrementDashPattern(): void {
    // increasing the value of the sliderDashArray[0] decreases the length of the dash
    if (
      this.sliderDashArray[0] + 1 <=
      SETTINGS.style.maxGapLengthPlusDashLength
    ) {
      Vue.set(this.sliderDashArray, 0, this.sliderDashArray[0] + 1);
      this.gapLength = this.sliderDashArray[0];
      this.dashLength = this.sliderDashArray[1] - this.sliderDashArray[0];

      SEStore.changeStyle({
        selected: this.selectedSENodules,
        panel: this.panel,
        payload: {
          dashArray: [this.dashLength, this.gapLength]
        }
      });
    }
    /** TODO:
     * The actual dots on the slider are not moveing when I click the plus (-) sign and trigger this decrementDashPattern method
     * How do I trigger an event that will cause the actual dots on the slider to move?
     */
  }
  setDashPatternSelectorState(styleState: StyleOptions[]): void {
    // reset to the default which are overwritten as necessary
    this.emptyDashPattern = true;
    this.dashPatternAgreement = true;
    this.gapLength = 4;
    this.dashLength = 12;
    this.totallyDisableDashPatternSelector = false;
    if (styleState[0].dashArray !== undefined) {
      if (styleState[0].dashArray.length > 0) {
        // all selected nodules should have length>0 and the same gap and dash length
        this.dashLength = styleState[0].dashArray[0];
        this.gapLength = styleState[0].dashArray[1];
        this.emptyDashPattern = false;
        if (
          !styleState.every(styleObject => {
            if (styleObject.dashArray) {
              return (
                styleObject.dashArray.length > 0 &&
                styleObject.dashArray[0] == this.dashLength &&
                styleObject.dashArray[1] == this.gapLength
              );
            } else {
              return false;
            }
          })
        ) {
          // The dashPattern property exists on the selected objects but the dash array doesn't agree (so don't totally disable the selector)
          this.disableDashPatternSelector(false);
        }
      } else {
        // make sure that all selected objects have zero length dash array
        if (
          !styleState.every(styleObject => {
            if (styleObject.dashArray) {
              return styleObject.dashArray.length === 0;
            } else {
              return false;
            }
          })
        ) {
          // The dashPattern property exists on the selected objects but the dash array doesn't agree (so don't totally disable the selector)
          this.disableDashPatternSelector(false);
        }
      }
    } else {
      // The dashPattern property doesn't exists on the selected objects so totally disable the selector
      this.disableDashPatternSelector(true);
    }
    // Set the slider dash array values
    this.sliderDashArray.clear();
    this.sliderDashArray.push(this.gapLength);
    this.sliderDashArray.push(this.gapLength + this.dashLength);
  }
  disableDashPatternSelector(totally: boolean): void {
    this.dashPatternAgreement = false;
    // Set the gap and dash to the default
    this.gapLength = 5;
    this.dashLength = 10;
    this.totallyDisableDashPatternSelector = totally;
  }

  // These methods are linked to the usingDynamicBackStyle fade-in-card
  onBackStyleContrastChange(): void {
    SEStore.changeStyle({
      selected: this.selectedSENodules,
      panel: this.panel,
      payload: {
        backStyleContrast: this.backStyleContrast
      }
    });
  }
  setCommonDynamicBackStyleAgreement(): void {
    this.usingDynamicBackStyleAgreement = true;
    this.usingDynamicBackStyleCommonValue = true;
  }
  clearRecentDynamicBackStyleChanges(): void {
    const selected = this.selectedSENodules;
    const initialStyleStates = SEStore.getInitialStyleState(this.panel);
    const initialBackStyleContrast = this.initialBackStyleContrast;
    for (let i = 0; i < selected.length; i++) {
      SEStore.changeStyle({
        selected: [selected[i]],
        panel: this.panel,
        payload: {
          backStyleContrast: initialBackStyleContrast
        }
      });
    }
    this.backStyleContrast = initialBackStyleContrast;
    this.setDynamicBackStyleSelectorState(initialStyleStates);
  }

  toggleBackStyleOptionsAvailability(): void {
    this.usingDynamicBackStyle = !this.usingDynamicBackStyle;
    this.usingDynamicBackStyleAgreement = true;
    this.usingDynamicBackStyleCommonValue = this.usingDynamicBackStyle;

    SEStore.changeStyle({
      selected: this.selectedSENodules,
      panel: this.panel,
      payload: {
        dynamicBackStyle: this.usingDynamicBackStyle
      }
    });

    if (!this.usingDynamicBackStyle) {
      const selectedSENodules = this.selectedSENodules;
      this.tempStyleStates.clear();
      selectedSENodules.forEach(seNodule => {
        if (seNodule.ref)
          this.tempStyleStates.push(seNodule.ref.currentStyleState(this.panel));
      });
      this.setDashPatternSelectorState(this.tempStyleStates);
    }
  }
  incrementBackStyleContrast(): void {
    if (
      this.usingDynamicBackStyle !== undefined &&
      this.backStyleContrast + 0.1 <= 1
    ) {
      this.backStyleContrast += 0.1;
      SEStore.changeStyle({
        selected: this.selectedSENodules,
        panel: this.panel,
        payload: {
          backStyleContrast: this.backStyleContrast
        }
      });
    }
  }
  decrementBackStyleContrast(): void {
    if (
      this.usingDynamicBackStyle !== undefined &&
      this.backStyleContrast - 0.1 >= 0
    ) {
      this.backStyleContrast -= 0.1;
      SEStore.changeStyle({
        selected: this.selectedSENodules,
        panel: this.panel,
        payload: {
          backStyleContrast: this.backStyleContrast
        }
      });
    }
  }
  setDynamicBackStyleSelectorState(styleState: StyleOptions[]): void {
    this.usingDynamicBackStyleAgreement = true;
    this.totallyDisableDynamicBackStyleSelector = false;

    this.usingDynamicBackStyle = styleState[0].dynamicBackStyle;
    this.usingDynamicBackStyleCommonValue =
      "dynamicBackStyle" in styleState[0]
        ? (styleState[0] as any).dynamicBackStyle
        : undefined;

    // screen for undefined - if undefined then this is not a property that is going to be set by the style panel for this selection of objects
    if (
      this.usingDynamicBackStyleCommonValue === undefined ||
      !styleState.every(
        styleObject =>
          (styleObject as any).dynamicBackStyle ==
          this.usingDynamicBackStyleCommonValue
      )
    ) {
      // The dynamicBackStyle exists on the selected objects but the
      // doesn't agree
      this.usingDynamicBackStyleAgreement = false;
    }

    if (
      this.usingDynamicBackStyleAgreement &&
      !this.usingDynamicBackStyleCommonValue
    ) {
      this.usingDynamicBackStyle = false;
    }
  }
  disableDynamicBackStyleSelector(totally: boolean): void {
    this.usingDynamicBackStyleAgreement = false;
    this.usingDynamicBackStyle = true;
    this.totallyDisableDynamicBackStyleSelector = totally;
  }

  // These methods are linked to the angle marker decoration fade-in-card
  clearAngleMarkerDecorations(): void {
    const selected = this.selectedSENodules;

    const initialStyleStates = SEStore.getInitialStyleState(
      StyleEditPanels.Label
    );
    for (let i = 0; i < selected.length; i++) {
      SEStore.changeStyle({
        selected: [selected[i]],
        panel: StyleEditPanels.Front,
        payload: {
          angleMarkerTickMark: initialStyleStates[i].angleMarkerTickMark,
          angleMarkerDoubleArc: initialStyleStates[i].angleMarkerDoubleArc
        }
      });
    }
    this.setAngleMarkerDecorationSelectorState(initialStyleStates);
  }

  @Watch("angleMarkerDecorations")
  onAngleMarkerDecorationChanged(): void {
    // const selected = this.selectedSENodules;

    const angleMarkerDoubleArcDisplay =
      this.angleMarkerDecorations?.findIndex(x => x === "doubleArc") === -1
        ? false
        : true;
    const angleMarkerTickMarkDisplay =
      this.angleMarkerDecorations?.findIndex(x => x === "tickMark") === -1
        ? false
        : true;
    if (this.activeStyleOptions) {
      this.activeStyleOptions.angleMarkerTickMark = angleMarkerTickMarkDisplay;
      this.activeStyleOptions.angleMarkerDoubleArc = angleMarkerDoubleArcDisplay;
    }
  }
  setAngleMarkerDecorationSelectorState(styleState: StyleOptions[]): void {
    this.angleMarkerDecorationsAgreement = true;
    this.totalyDisableAngleMarkerDecorationsSelector = false;
    // Make sure that across the selected objects all 8 properties are defined and agree
    //   If one property on one selected is undefined, then set styleDataAgreement=false, and totalyDisableStyleDataSelector = true
    //   If all properties are defined,but one property doesn't agree across all selected then set styleDataAgreement=false, and totalyDisableStyleDataSelector = false
    // start at 1 because the first styleState always agress with itself -- in the case of only one object selected, this shouldn't execute
    for (var style of ["angleMarkerTickMark", "angleMarkerDoubleArc"]) {
      // Record the value of the style on the first style state
      let value = (styleState[0] as any)[style];
      // screen for undefined - if undefined then this is not a property that is going to be set by the style panel for this selection of objects
      if (value !== undefined) {
        if (
          styleState.length > 1 &&
          !styleState.every(
            styleObject => (styleObject as any)[style] === value
          )
        ) {
          // The style property exists on the selected objects but value
          // doesn't agree (so don't totally disable the selector)
          this.disableAnglerMarkerDecorationsSelector(false);
          break;
        }
        // If the execution reaches here, the style exists on all style states and is the same in all style states
      } else {
        // The style property doesn't exists on the selected objects so totally disable the selector
        this.disableAnglerMarkerDecorationsSelector(true);
        break;
      }
    }
    // Now set the displays of the angle Marker Decorations array)
    if (
      !this.totalyDisableAngleMarkerDecorationsSelector &&
      this.angleMarkerDecorationsAgreement
    ) {
      if ((styleState[0] as StyleOptions).angleMarkerTickMark) {
        this.angleMarkerDecorations!.push("tickMark");
      }
      if ((styleState[0] as StyleOptions).angleMarkerDoubleArc) {
        this.angleMarkerDecorations!.push("doubleArc");
      }
    }
  }
  disableAnglerMarkerDecorationsSelector(totally: boolean): void {
    this.angleMarkerDecorationsAgreement = false;
    this.totalyDisableAngleMarkerDecorationsSelector = totally;
    // Set the angle marker disabled values
    this.angleMarkerDecorations = undefined;
  }

  setStyleDataAgreement(): void {
    this.angleMarkerDecorationsAgreement = true;
  }

  /**
   * Determines if the commonStyleProperties has the given input of type Styles
   * The input is an enum of type Styles
   * This is the key method for the hasXXX() methods which control the display of the XXX fade-in-card
   */
  hasStyle(prop: RegExp): boolean {
    return this.commonStyleProperties.some((x: string) => x.match(prop));
  }
  get hasStrokeColor(): boolean {
    return this.hasStyle(/strokeColor/);
  }
  get hasFillColor(): boolean {
    return this.hasStyle(/fillColor/);
  }
  get hasStrokeWidthPercent(): boolean {
    return this.hasStyle(/strokeWidthPercent/);
  }
  get hasPointRadiusPercent(): boolean {
    return this.hasStyle(/pointRadiusPercent/);
  }
  get hasDashPattern(): boolean {
    return this.hasStyle(/dashArray/);
  }
  get hasDynamicBackStyle(): boolean {
    return this.hasStyle(/dynamicBackStyle/);
  }
  get hasAngleMarkerRadiusPercent(): boolean {
    return this.hasStyle(/angleMarkerRadiusPercent/);
  }
  get hasAngleMarkerDecoration(): boolean {
    return (
      this.hasStyle(/angleMarkerTickMark/) &&
      this.hasStyle(/angleMarkerDoubleArc/)
    );
  }

  @Watch("activePanel")
  private activePanelChange(): void {
    console.log("before here");
    if (this.activePanel !== undefined && this.panel === this.activePanel) {
      console.log("before after");
      // activePanel = undefined means that no edit panel is open
      this.onSelectionChanged(this.selectedSENodules);
    }
  }
  @Watch("hslaStrokeColorObject", { deep: true })
  onStrokeColorChanged(newVal: hslaColorType): void {
    console.debug("New stroke color", newVal);
    if (this.activeStyleOptions) {
      Vue.set(
        this.activeStyleOptions,
        "strokeColor",
        Nodule.convertHSLAObjectToString(newVal)
      );
    }
  }
  @Watch("hslaFillColorObject", { deep: true })
  onFillColorChanged(newVal: hslaColorType): void {
    console.debug("New fill color", newVal);
    if (this.activeStyleOptions) {
      Vue.set(
        this.activeStyleOptions,
        "fillColor",
        Nodule.convertHSLAObjectToString(newVal)
      );
    }
  }
  /**
   * This is an example of the two-way binding that is provided by the Vuex store. As this is a Vue component we can Watch variables, and
   * when they change, this method will execute in response to that change.
   */
  @Watch("selectedSENodules")
  onSelectionChanged(newSelection: SENodule[]): void {
    console.log("FrontBackStyle: onSelectionChanged");

    // Before changing the selections save the state for an undo/redo command (if necessary)
    this.saveStyleState();

    this.commonStyleProperties.splice(0);
    if (newSelection.length === 0) {
      //totally disable the selectors in this component
      this.disableDashPatternSelector(true);
      this.disableDynamicBackStyleSelector(true);
      SEStore.setOldStyleSelection([]);
      return;
    }

    // record the new selections in the old
    SEStore.setOldStyleSelection([]);
    const oldSelection: SENodule[] = [];
    newSelection.forEach(obj => oldSelection.push(obj));

    // Create a list of the common properties among the selected objects.
    // Use the Array.reduce function to find the intersection of all the props
    this.commonStyleProperties.splice(0);
    const styleOptionsOfSelected = oldSelection
      .filter((obj: SENodule) => obj.ref)
      .map((obj: SENodule) => obj.ref!.currentStyleState(this.panel));

    this.activeStyleOptions = { ...styleOptionsOfSelected[0] };
    if (this.activeStyleOptions.dashArray) {
      console.debug("Selected objects include dash pattern");
      if (this.activeStyleOptions.dashArray.length === 0) {
        this.activeStyleOptions.dashArray.push(0, 0);
      }
    }
    const commonProps = styleOptionsOfSelected.flatMap((opt: StyleOptions) =>
      // Exclude internal JS property like __ob__
      Object.getOwnPropertyNames(opt).filter((s: string) => !s.startsWith("__"))
    );
    const uniqueProps = new Set(commonProps);
    // this.activeStyleOptions = {...styleOptionsOfSelected};
    this.commonStyleProperties.push(...uniqueProps);

    // Get the initial and default style state of the object for undo/redo and buttons to revert to initial style.
    // Put this in the store so that it is availble to *all* panels. Get the front and back information at the same time.

    //#region setStyle
    SEStore.recordStyleState({
      selected: newSelection,
      backContrast: Nodule.getBackStyleContrast()
    });
    //#endregion setStyle

    SEStore.setSavedFromPanel(this.panel);
    //Set the initial state of the fade-in-card/selectors (checking to see if the property is the same across all selected objects)
    this.setDashPatternSelectorState(SEStore.getInitialStyleState(this.panel));
    this.setDynamicBackStyleSelectorState(
      SEStore.getInitialStyleState(this.panel)
    );
  }

  enableResetButton(prop: string): void {
    // Find all the buttons that have the "data-se-props" attribute
    const candidates = this.$el.querySelectorAll("[data-se-props]");
    candidates.forEach((el: Element) => {
      const propList = el.getAttribute("data-se-props")?.split(",");

      // Find which one matche the property name we are looking for
      if (propList?.find((s: string) => s === prop)) {
        // Find the flag name needed to (re) enabled the button
        const flagName = el.getAttribute("data-se-flag") as string;

        // Set the boolean flag controlling its disable behavior
        (this.disableControl as any)[flagName] = false;
      }
    });
  }

  @Watch("activeStyleOptions", { deep: true, immediate: true })
  onActiveStyleOptionsChanged(newVal: StyleOptions | null): void {
    if (newVal === null) return;
    console.debug("active style options changed", newVal);
    if (newVal === null) return;
    const oldProps: Set<string> = new Set(
      this.pastStyleOptions
        ? Object.getOwnPropertyNames(this.pastStyleOptions).filter(
            (s: string) => !s.startsWith("__")
          )
        : []
    );
    const newProps: Set<string> = new Set(
      newVal
        ? Object.getOwnPropertyNames(newVal).filter(
            (s: string) => !s.startsWith("__")
          )
        : []
    );
    const removedProps = [...oldProps].filter((p: string) => !newProps.has(p));
    if (removedProps.length > 0 && this.selectedSENodules.length > 0)
      throw new Error(
        "Removing style options from selections is not currently supported"
      );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const addedProps = [...newProps].filter((p: string) => !oldProps.has(p));
    if (addedProps.length > 0)
      console.debug("Adding some new props", addedProps);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const updatedProps = [...newProps].filter((p: string) => oldProps.has(p));
    const updatePayload: StyleOptions = { ...newVal };
    [...updatedProps].forEach((p: string) => {
      const a = (this.pastStyleOptions as any)[p];
      const b = (newVal as any)[p];

      // Exclude the property from the payload if they do not change
      if (a === b) {
        // console.debug(`Excluding ${p} from payload`);
        delete (updatePayload as any)[p];
      } else {
        console.debug(`Property ${p} is updated from ${a} to ${b}`);
        this.enableResetButton(p);
      }
    });

    /* If multiple labels are selected, do not update the name */
    if (this.selectedSENodules.length > 1)
      delete updatePayload.labelDisplayText;

    this.selectedSENodules
      .filter((obj: SENodule) => obj.ref)
      .map((obj: SENodule): Required<SENodule> => obj as Required<SENodule>)
      .forEach((obj: Required<SENodule>) => {
        obj.ref.updateStyle(this.panel, { ...updatePayload });
      });
    this.pastStyleOptions = { ...newVal };
  }

  saveStyleState(): void {
    const oldSelection = this.oldStyleSelection;
    // There must be an old selection in order for there to be a change to save
    if (oldSelection.length > 0) {
      console.log("Attempt style save command");
      //Record the current state of each Nodule
      this.currentStyleStates.splice(0);

      oldSelection.forEach((seNodule: SENodule) => {
        if (seNodule.ref !== undefined)
          this.currentStyleStates.push(
            seNodule.ref.currentStyleState(this.styleSavedFromPanel)
          );
      });
      const initialStyleStates = SEStore.getInitialStyleState(
        this.styleSavedFromPanel
      );
      const initialBackStyleContrast = this.initialBackStyleContrast;
      if (
        !this.areEquivalentStyles(
          this.currentStyleStates,
          initialStyleStates
        ) ||
        initialBackStyleContrast != Nodule.getBackStyleContrast()
      ) {
        console.log("Issued style save command");
        // Add the label of the
        new StyleNoduleCommand(
          oldSelection,
          this.styleSavedFromPanel,
          this.currentStyleStates,
          initialStyleStates,
          Nodule.getBackStyleContrast(),
          initialBackStyleContrast
        ).push();
      }
      // clear the old selection so that this save style state will not be executed again until changes are made.
      SEStore.setOldStyleSelection([]);
    }
  }

  areEquivalentStyleOptions(
    opt1: StyleOptions | undefined,
    opt2: StyleOptions | undefined
  ): boolean {
    function arrayEquivalentArray(
      arr1: Array<string | number>,
      arr2: Array<string | number>
    ): boolean {
      return false;
    }

    const aProps = opt1
      ? Object.getOwnPropertyNames(opt1).filter(
          (s: string) => !s.startsWith("__")
        )
      : []; // Set to an empty array of the arg is undefined or null
    const bProps = opt2
      ? Object.getOwnPropertyNames(opt2).filter(
          (s: string) => !s.startsWith("__")
        )
      : []; // Set to an empty array of the arg is undefined or null
    if (aProps.length !== bProps.length)
      throw new Error(
        "Attempted to compare two different length StyleOptions in areEquivalentStyles"
      );

    // Verify equivalence of all the style properties
    return [...aProps].every((p: string) => {
      const aVal = (aProps as any)[p];
      const bVal = (bProps as any)[p];
      if (typeof aVal !== typeof bVal) return false;
      if (typeof aVal == "number") return Math.abs(aVal - bVal) < 1e-8;
      else if (Array.isArray(aVal) && Array.isArray(bVal))
        return arrayEquivalentArray(aVal, bVal);
      else if (typeof aVal === "object")
        throw new Error("Object comparison is not currently supported");
      else return aVal === bVal;
    });
  }

  areEquivalentStyles(
    styleStates1: StyleOptions[],
    styleStates2: StyleOptions[]
  ): boolean {
    console.debug("areEquivalentStyle");
    if (styleStates1.length !== styleStates2.length) {
      throw new Error(
        "Attempted to compare two different length styles in areEquivalentStyles"
      );
    }

    // The outer every runs on the two input arguments
    return styleStates1.every((a: StyleOptions, i: number) =>
      this.areEquivalentStyleOptions(a, styleStates2[i])
    );
  }
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
</style>
