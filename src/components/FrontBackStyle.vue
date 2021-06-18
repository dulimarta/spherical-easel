<template>
  <div>
    <!-- objects(s) not showing overlay ---higher z-index rendered on top -- covers entire panel including the header-->
    <OverlayWithFixButton
      v-if="( editModeIsFront() || editModeIsBack() ) && !allObjectsShowing()"
      z-index="100"
      i18n-title-line="style.objectNotVisible"
      i18n-subtitle-line="style.clickToMakeObjectsVisible"
      i18n-button-label="style.makeObjectsVisible"
      i18n-button-tool-tip="style.objectsNotShowingToolTip"
      @click="toggleAllObjectsVisibility">
    </OverlayWithFixButton>

    <!-- Back Style Contrast Slider -->
    <fade-in-card :showWhen="editModeIsBack()"
      color="red">
      <span
        class="text-subtitle-2">{{ $t('style.backStyleContrast') }}</span>
      <span>
        {{" ("+ Math.floor(backStyleContrast*100)+"%)" }}
      </span>
      <br />

      <!-- Enable the Dynamic Back Style Overlay -->
      <OverlayWithFixButton v-if="editModeIsBack() && hasDynamicBackStyle && usingDynamicBackStyleAgreement 
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
      <v-container class="pa-0 ma-0">
        <v-row justify="end"
          no-gutters>

          <v-col cols="2"
            class="ma-0 pl-0 pr-0 pt-0 pb-2">
            <HintButton @click="clearRecentDynamicBackStyleChanges"
              :disabled="disableBackStyleContrastUndoButton"
              i18n-label="style.clearChanges"
              i18n-tooltip="style.clearChangesToolTip"
              type="undo"></HintButton>
          </v-col>

          <v-col cols="2"
            class="ma-0 pl-0 pr-0 pt-0 pb-2">
            <HintButton @click="resetDynamicBackStyleToDefaults"
              i18n-label="style.restoreDefaults"
              i18n-tooltip="style.restoreDefaultsToolTip"
              type="default"></HintButton>
          </v-col>
        </v-row>
      </v-container>
    </fade-in-card>

    <!-- Scope of the Disable Dynamic Back Style Overlay and the BackStyle Disagreemnt overlay-->
    <v-card color="grey lighten-2">

      <!-- Disable the Dynamic Back Style Overlay -->
      <OverlayWithFixButton v-if="editModeIsBack() && hasDynamicBackStyle && usingDynamicBackStyleAgreement &&
        (usingDynamicBackStyle || usingDynamicBackStyleCommonValue)"
        z-index="50"
        i18n-title-line="style.dynamicBackStyleHeader"
        i18n-button-label="style.disableDynamicBackStyle"
        i18n-button-tool-tip="style.disableDynamicBackStyleToolTip"
        @click="toggleBackStyleOptionsAvailability">
      </OverlayWithFixButton>

      <!-- usingDynamicBackStyle disagreemnt  -->
      <OverlayWithFixButton
        v-if="editModeIsBack()&& hasDynamicBackStyle && !usingDynamicBackStyleAgreement"
        z-index="40"
        i18n-title-line="style.backStyleDisagreement"
        i18n-button-label="style.enableCommonStyle"
        i18n-button-tool-tip="style.differentValuesToolTip"
        @click="setCommonDynamicBackStyleAgreement">
      </OverlayWithFixButton>

      <!-- Front/Back Stroke Color Selector-->
      <fade-in-card
        :showWhen="(editModeIsFront() ||editModeIsBack() ) && hasStrokeColor">
        <ColorSelector title-key="style.strokeColor"
          panel-front-key="style.front"
          panel-back-key="style.back"
          style-name="strokeColor"
          :data.sync="hslaStrokeColorObject"
          :temp-style-states="tempStyleStates"
          :panel="panel"
          :active-panel="activePanel"
          :use-dynamic-back-style-from-selector="false">
        </ColorSelector>
      </fade-in-card>

      <!-- Front/Back Fill Color Selector-->
      <fade-in-card
        :showWhen="(editModeIsFront() || editModeIsBack()) && hasFillColor">
        <ColorSelector title-key="style.fillColor"
          panel-front-key="style.front"
          panel-back-key="style.back"
          style-name="fillColor"
          :data.sync="hslaFillColorObject"
          :temp-style-states="tempStyleStates"
          :panel="panel"
          :active-panel="activePanel"
          :use-dynamic-back-style-from-selector="false">
        </ColorSelector>
      </fade-in-card>

      <!-- Front/Back Stokewidth Number Selector -->
      <fade-in-card :showWhen="
        (editModeIsFront() || editModeIsBack()) && hasStrokeWidthPercent && showMoreLabelStyles 
      ">
        <NumberSelector id="strokeWidthPercentSlider"
          v-bind:data.sync="strokeWidthPercent"
          style-name="strokeWidthPercent"
          title-key="style.strokeWidthPercent"
          panel-front-key="style.front"
          panel-back-key="style.back"
          v-bind:min-value="minStrokeWidthPercent"
          v-bind:max-value="maxStrokeWidthPercent"
          v-bind:step="20"
          :temp-style-states="tempStyleStates"
          :panel="panel"
          :active-panel="activePanel"
          :thumb-string-values="strokeWidthScaleSelectorThumbStrings"
          :use-dynamic-back-style-from-selector="false">
        </NumberSelector>
      </fade-in-card>

      <!-- Front/Back Point Radius Number Selector -->
      <fade-in-card :showWhen="
        (editModeIsFront() || editModeIsBack()) && hasPointRadiusPercent && showMoreLabelStyles
      ">
        <NumberSelector :data.sync="pointRadiusPercent"
          title-key="style.pointRadiusPercent"
          panel-front-key="style.front"
          panel-back-key="style.back"
          style-name="pointRadiusPercent"
          :min-value="minPointRadiusPercent"
          :max-value="maxPointRadiusPercent"
          :temp-style-states="tempStyleStates"
          :step="20"
          :panel="panel"
          :active-panel="activePanel"
          :thumb-string-values="pointRadiusSelectorThumbStrings"
          :use-dynamic-back-style-from-selector="false">
        </NumberSelector>
      </fade-in-card>

      <!-- Front/Back Angle Marker Radius Number Selector -->
      <fade-in-card :showWhen="
        editModeIsFront() && hasAngleMarkerRadiusPercent && showMoreLabelStyles
      ">
        <NumberSelector :data.sync="angleMarkerRadiusPercent"
          title-key="style.angleMarkerRadiusPercent"
          panel-front-key="style.front"
          panel-back-key="style.back"
          style-name="angleMarkerRadiusPercent"
          :min-value="minAngleMarkerRadiusPercent"
          :max-value="maxAngleMarkerRadiusPercent"
          :temp-style-states="tempStyleStates"
          :step="20"
          :panel="panel"
          :active-panel="activePanel"
          :thumb-string-values="angleMarkerRadiusSelectorThumbStrings"
          :use-dynamic-back-style-from-selector="false">
        </NumberSelector>
      </fade-in-card>

      <!-- Angle Marker Decoration Selector -->
      <fade-in-card :showWhen="
        editModeIsFront() && hasAngleMarkerDecoration && showMoreLabelStyles
      ">
        <v-select v-model="angleMarkerDecorations"
          v-bind:label="$t('style.angleMarkerDecorations')"
          :items="angleMarkerDecorationItems"
          filled
          outlined
          small-chips
          dense
          multiple
          @blur="setAngleMarkerDecorationChange(); onAngleMarkerDecorationChanged()"
          @change="setAngleMarkerDecorationChange(); onAngleMarkerDecorationChanged()">
        </v-select>

        <!-- Undo and Reset to Defaults buttons -->
        <v-container class="pa-0 ma-0">
          <v-row justify="end"
            no-gutters>
            <v-col cols="2"
              class="ma-0 pl-0 pr-0 pt-0 pb-2">
              <HintButton @click="clearAngleMarkerDecorations"
                :disabled="disableAngleMarkerDecorationsUndoButton"
                type="undo"
                i18n-label="style.clearChanges"
                i18n-tooltip="style.clearChangesToolTip">
              </HintButton>
            </v-col>

            <v-col cols="2"
              class="ma-0 pl-0 pr-0 pt-0 pb-2">
              <HintButton @click="resetAngleMarkerDecorationsToDefaults"
                type="default"
                i18n-label="style.restoreDefaults"
                i18n-tooltip="style.restoreDefaultsToolTip">
              </HintButton>
            </v-col>
          </v-row>
        </v-container>

      </fade-in-card>

      <!-- Front/Back Dash array card is displayed for front and back so long as there is a dash array property common to all selected objects-->
      <fade-in-card
        :showWhen="(hasDashPattern) && (editModeIsFront() || editModeIsBack()) && showMoreLabelStyles">
        <span v-show="editModeIsFront()"
          class="text-subtitle-2">{{ $t("style.front") }}</span>
        <span v-show="editModeIsBack()"
          class="text-subtitle-2">{{ $t("style.back") }}</span>
        <span
          class="text-subtitle-2">{{" "+ $t("style.dashPattern") }}</span>
        <span v-if="selections.length > 1"
          class="text-subtitle-2"
          style="color:red">{{" "+ $t("style.labelStyleOptionsMultiple") }}</span>
        <span v-show="
          !emptyDashPattern &&
            !totallyDisableDashPatternSelector &&
            dashPatternAgreement
        ">
          ({{ gapLength.toFixed(0) }}/{{
        dashLength.toFixed(0)
        }})
        </span>
        <br />

        <!-- Differing data styles detected Overlay --higher z-index rendered on top-->
        <OverlayWithFixButton
          v-if="(editModeIsFront() || editModeIsBack()) && !dashPatternAgreement"
          z-index="1"
          i18n-title-line="style.styleDisagreement"
          i18n-button-label="style.enableCommonStyle"
          i18n-button-tool-tip="style.differentValuesToolTip"
          @click="setCommonDashPatternAgreement">
        </OverlayWithFixButton>

        <!-- The dash property slider -->
        <v-range-slider v-model="sliderDashArray"
          :min="0"
          step="2"
          :disabled="
          !dashPatternAgreement ||
            totallyDisableDashPatternSelector ||
            emptyDashPattern
        "
          @change="onDashPatternChange"
          :max="maxGapLengthPlusDashLength"
          type="range"
          dense>
          <template v-slot:prepend>
            <v-icon @click="decrementDashPattern">mdi-minus</v-icon>
          </template>

          <template v-slot:append>
            <v-icon @click="incrementDashPattern">mdi-plus</v-icon>
          </template>
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

            <v-col cols="2"
              class="ma-0 pl-0 pr-0 pt-0 pb-2">
              <HintButton v-show="dashPatternAgreement &&
                !totallyDisableDashPatternSelector &&
                !emptyDashPattern"
                :disabled="disableDashPatternUndoButton||emptyDashPattern"
                @click="clearRecentDashPatternChanges"
                i18n-label="style.clearChanges"
                i18n-tooltip="style.clearChangesToolTip"
                type="undo"></HintButton>
            </v-col>

            <v-col cols="2"
              class="ma-0 pl-0 pr-0 pt-0 pb-2">
              <HintButton v-show="dashPatternAgreement &&
                !totallyDisableDashPatternSelector &&
                !emptyDashPattern"
                :disabled="emptyDashPattern"
                @click="resetDashPatternToDefaults"
                i18n-label="style.restoreDefaults"
                i18n-tooltip="style.restoreDefaultsToolTip"
                type="default"></HintButton>
            </v-col>
          </v-row>
        </v-container>

      </fade-in-card>
    </v-card>

    <!-- Show more or less styling options -->
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

  </div>

</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Watch, Prop } from "vue-property-decorator";
import { SENodule } from "../models/SENodule";
import Nodule from "../plottables/Nodule";
import { State, Getter, Mutation } from "vuex-class";
// import AppStore from "@/store";
import {
  Styles,
  StyleOptions,
  StyleEditPanels,
  LabelDisplayMode
} from "../types/Styles";
import SETTINGS from "@/global-settings";
import FadeInCard from "@/components/FadeInCard.vue";
import { hslaColorType, AppState, Labelable } from "@/types";
import { StyleNoduleCommand } from "@/commands/StyleNoduleCommand";
import EventBus from "@/eventHandlers/EventBus";
import NumberSelector from "@/components/NumberSelector.vue";
// import TextInputSelector from "@/components/TextInputSelector.vue";
import ColorSelector from "@/components/ColorSelector.vue";
//import { TranslateResult } from "vue-i18n";
import i18n from "../i18n";
import TranslateResult from "../i18n";
import { SELabel } from "@/models/SELabel";
import Style from "./Style.vue";
import HintButton from "@/components/HintButton.vue";
import OverlayWithFixButton from "@/components/OverlayWithFixButton.vue";

// import { getModule } from "vuex-module-decorators";
// import UI from "@/store/ui-styles";
type labelDisplayModeItem = {
  text: any; //typeof VueI18n.TranslateResult
  value: LabelDisplayMode;
  optionRequiresMeasurementValueToExist: boolean;
  optionRequiresCaptionToExist: boolean;
};

/**
 * values is a list of Styles (found in @/types/styles.ts) that are number valued
 */
const values = Object.entries(Styles).filter(e => {
  const [_, b] = e;
  return typeof b === "number";
});

/**
 * keys is a list of the keys to the number valued Styles
 */
const keys = values.map(e => {
  const [a, _] = e;
  return a;
});

@Component({
  components: {
    FadeInCard,
    NumberSelector,
    ColorSelector,
    HintButton,
    OverlayWithFixButton
  }
})
export default class FrontBackStyle extends Vue {
  @Prop()
  readonly panel!: StyleEditPanels; // This is a constant in each copy of the BasicFrontBackStyle

  @Prop()
  readonly activePanel!: StyleEditPanels;

  @State((s: AppState) => s.selections)
  readonly selections!: SENodule[];

  @Getter selectedSENodules!: SENodule[];

  @Getter getInitialStyleState!: (_: StyleEditPanels) => StyleOptions[];

  @Getter getDefaultStyleState!: (_: StyleEditPanels) => StyleOptions[];

  @Getter getInitialBackStyleContrast!: number;

  @Getter getOldStyleSelection!: SENodule[];
  @Getter getSavedFromPanel!: StyleEditPanels;

  @Mutation changeStyle!: (_: any) => void;
  @Mutation setOldStyleSelection!: (_: SENodule[]) => void;
  @Mutation recordStyleState!: (_: any) => void;
  @Mutation setSavedFromPanel!: (_: StyleEditPanels) => void;

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
  private noObjectsSelected = true;

  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;
  /**
   * There are many style options. In the case that there
   * are more than one object selected, the XXXAgreement boolean indicates if the XXX property is *initially* the
   * same across the selected objects. In the case that they are not initially the same, the cooresponding adjustment tool
   * is display in a different way than the usual default.
   */
  private strokeWidthPercent: number | undefined = 100;
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

  private labelTextScalePercent: number | undefined = 100;
  private maxLabelTextScalePercent = SETTINGS.style.maxLabelTextScalePercent;
  private minLabelTextScalePercent = SETTINGS.style.minLabelTextScalePercent;
  //step is 20 from 60 to 200 is 8 steps
  private textScaleSelectorThumbStrings = [
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
  private disableStyleSelectorUndoButton = true;

  //Many of the label style will not be commonly modified so create a button/variable for
  // the user to click to show more of the Label Styling options
  private showMoreLabelStyles = false;
  private moreOrLessText = i18n.t("style.moreStyleOptions"); // The text for the button to toggle between less/more options

  private pointRadiusPercent: number | undefined = 100;
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

  private angleMarkerRadiusPercent: number | undefined = 100;
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
  private angleMarkerDecorationChange = false;
  private angleMarkerDecorationsAgreement = true;
  private disableAngleMarkerDecorationsUndoButton = true;
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

  private disableDashPatternUndoButton = false;
  private disableBackStyleContrastUndoButton = false;

  commonStyleProperties: number[] = [];

  constructor() {
    super();
  }

  /** mounted() is part of VueJS lifecycle hooks */
  mounted(): void {
    // Pass any selected objects when BasicFrontBackStyle is mound to the onSelection change
    //this.onSelectionChanged(this.selectedSENodules);
    //  Mount a save listener
    EventBus.listen("save-style-state", this.saveStyleState);
    // EventBus.listen("set-active-style-panel", this.setActivePanel);
  }
  editModeIsBack(): boolean {
    return this.panel === StyleEditPanels.Back;
  }
  editModeIsFront(): boolean {
    return this.panel === StyleEditPanels.Front;
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

  // These methods are linked to the dashPattern fade-in-card
  onDashPatternChange(): void {
    this.disableDashPatternUndoButton = false;
    this.gapLength = this.sliderDashArray[0];
    this.dashLength = this.sliderDashArray[1] - this.sliderDashArray[0];
    this.changeStyle({
      selected: this.selectedSENodules,
      payload: {
        panel: this.panel,
        dashArray: [this.dashLength, this.gapLength] //correct order!!!!
      }
    });
  }
  setCommonDashPatternAgreement(): void {
    this.dashPatternAgreement = true;
  }
  clearRecentDashPatternChanges(): void {
    this.disableDashPatternUndoButton = true;
    const selected = this.selectedSENodules;
    const initialStyleStates = this.getInitialStyleState(this.panel);
    for (let i = 0; i < selected.length; i++) {
      // Check see if the initialStylesStates[i] exist and has length >0
      if (
        initialStyleStates[i].dashArray &&
        (initialStyleStates[i].dashArray as number[]).length > 0
      ) {
        this.changeStyle({
          selected: [selected[i]],
          payload: {
            panel: this.panel,
            dashArray: [
              (initialStyleStates[i].dashArray as number[])[0],
              (initialStyleStates[i].dashArray as number[])[1]
            ]
          }
        });
      } else if (initialStyleStates[i].dashArray) {
        // The selected [i] exists and the array is empty
        this.changeStyle({
          selected: [selected[i]],
          payload: {
            panel: this.panel,
            dashArray: []
          }
        });
      }
    }
    this.setDashPatternSelectorState(initialStyleStates);
  }
  resetDashPatternToDefaults(): void {
    const selected = this.selectedSENodules;
    const defaultStyleStates = this.getDefaultStyleState(this.panel);
    for (let i = 0; i < selected.length; i++) {
      // Check see if the selected[i] exist and has length >0
      if (
        defaultStyleStates[i].dashArray &&
        (defaultStyleStates[i].dashArray as number[]).length > 0
      ) {
        this.changeStyle({
          selected: [selected[i]],
          payload: {
            panel: this.panel,
            dashArray: [
              (defaultStyleStates[i].dashArray as number[])[0],
              (defaultStyleStates[i].dashArray as number[])[1]
            ]
          }
        });
      } else if (defaultStyleStates[i].dashArray) {
        // The selected [i] exists and the array is empty
        this.changeStyle({
          selected: [selected[i]],
          payload: {
            panel: this.panel,
            dashArray: []
          }
        });
      }
    }
    this.setDashPatternSelectorState(defaultStyleStates);
  }
  toggleDashPatternSliderAvailibity(): void {
    if (!this.emptyDashPattern) {
      this.sliderDashArray.clear();
      this.sliderDashArray.push(this.gapLength as number);
      this.sliderDashArray.push(
        (this.dashLength as number) + (this.gapLength as number)
      );

      this.changeStyle({
        selected: this.selectedSENodules,
        payload: {
          panel: this.panel,
          dashArray: [this.dashLength, this.gapLength]
        }
      });
    } else {
      this.changeStyle({
        selected: this.selectedSENodules,
        payload: {
          panel: this.panel,
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
      this.disableDashPatternUndoButton = false;
      Vue.set(this.sliderDashArray, 1, this.sliderDashArray[1] + 1); // trigger the update
      this.gapLength = this.sliderDashArray[0];
      this.dashLength = this.sliderDashArray[1] - this.sliderDashArray[0];

      this.changeStyle({
        selected: this.selectedSENodules,
        payload: {
          panel: this.panel,
          dashArray: [this.dashLength, this.gapLength]
        }
      });
    }
  }
  decrementDashPattern(): void {
    this.disableDashPatternUndoButton = false;
    // increasing the value of the sliderDashArray[0] decreases the length of the dash
    if (
      this.sliderDashArray[0] + 1 <=
      SETTINGS.style.maxGapLengthPlusDashLength
    ) {
      this.disableDashPatternUndoButton = false;
      Vue.set(this.sliderDashArray, 0, this.sliderDashArray[0] + 1);
      this.gapLength = this.sliderDashArray[0];
      this.dashLength = this.sliderDashArray[1] - this.sliderDashArray[0];

      this.changeStyle({
        selected: this.selectedSENodules,
        payload: {
          panel: this.panel,
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
    this.disableDashPatternUndoButton = true;
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
    this.disableDashPatternUndoButton = true;
    // Set the gap and dash to the default
    this.gapLength = 5;
    this.dashLength = 10;
    this.totallyDisableDashPatternSelector = totally;
  }

  // These methods are linked to the usingDynamicBackStyle fade-in-card
  onBackStyleContrastChange(): void {
    this.disableBackStyleContrastUndoButton = false;
    this.changeStyle({
      selected: this.selectedSENodules,
      payload: {
        panel: this.panel,
        backStyleContrast: this.backStyleContrast
      }
    });
  }
  setCommonDynamicBackStyleAgreement(): void {
    this.usingDynamicBackStyleAgreement = true;
    this.usingDynamicBackStyleCommonValue = true;
  }
  clearRecentDynamicBackStyleChanges(): void {
    this.disableBackStyleContrastUndoButton = true;
    const selected = this.selectedSENodules;
    const initialStyleStates = this.getInitialStyleState(this.panel);
    const initialBackStyleContrast = this.getInitialBackStyleContrast;
    for (let i = 0; i < selected.length; i++) {
      this.changeStyle({
        selected: [selected[i]],
        payload: {
          panel: this.panel,
          backStyleContrast: initialBackStyleContrast
        }
      });
    }
    this.backStyleContrast = initialBackStyleContrast;
    this.setDynamicBackStyleSelectorState(initialStyleStates);
  }
  resetDynamicBackStyleToDefaults(): void {
    const selected = this.selectedSENodules;
    const defaultStyleStates = this.getDefaultStyleState(this.panel);
    for (let i = 0; i < selected.length; i++) {
      this.changeStyle({
        selected: [selected[i]],
        payload: {
          panel: this.panel,
          backStyleContrast: SETTINGS.style.backStyleContrast
        }
      });
    }
    this.backStyleContrast = SETTINGS.style.backStyleContrast;
    this.setDynamicBackStyleSelectorState(defaultStyleStates);
  }
  toggleBackStyleOptionsAvailability(): void {
    this.usingDynamicBackStyle = !this.usingDynamicBackStyle;
    this.usingDynamicBackStyleAgreement = true;
    this.usingDynamicBackStyleCommonValue = this.usingDynamicBackStyle;

    this.changeStyle({
      selected: this.selectedSENodules,
      payload: {
        panel: this.panel,
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
      this.disableBackStyleContrastUndoButton = false;
      this.backStyleContrast += 0.1;
      this.changeStyle({
        selected: this.selectedSENodules,
        payload: {
          panel: this.panel,
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
      this.disableBackStyleContrastUndoButton = false;
      this.backStyleContrast -= 0.1;
      this.changeStyle({
        selected: this.selectedSENodules,
        payload: {
          panel: this.panel,
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
  resetAngleMarkerDecorationsToDefaults(): void {
    const selected = this.selectedSENodules;
    const defaultStyleStates = this.getDefaultStyleState(StyleEditPanels.Front);

    for (let i = 0; i < selected.length; i++) {
      this.changeStyle({
        selected: [selected[i]],
        payload: {
          panel: StyleEditPanels.Front,
          angleMarkerTickMark: defaultStyleStates[i].angleMarkerTickMark,
          angleMarkerDoubleArc: defaultStyleStates[i].angleMarkerDoubleArc
        }
      });
    }
    this.setAngleMarkerDecorationSelectorState(defaultStyleStates);
  }
  clearAngleMarkerDecorations(): void {
    const selected = this.selectedSENodules;

    const initialStyleStates = this.getInitialStyleState(StyleEditPanels.Label);
    for (let i = 0; i < selected.length; i++) {
      this.changeStyle({
        selected: [selected[i]],
        payload: {
          panel: StyleEditPanels.Front,
          angleMarkerTickMark: initialStyleStates[i].angleMarkerTickMark,
          angleMarkerDoubleArc: initialStyleStates[i].angleMarkerDoubleArc
        }
      });
    }
    this.setAngleMarkerDecorationSelectorState(initialStyleStates);
  }
  onAngleMarkerDecorationChanged(): void {
    this.disableAngleMarkerDecorationsUndoButton = false;

    const selected = this.selectedSENodules;

    const angleMarkerDoubleArcDisplay =
      this.angleMarkerDecorations?.findIndex(x => x === "doubleArc") === -1
        ? false
        : true;
    const angleMarkerTickMarkDisplay =
      this.angleMarkerDecorations?.findIndex(x => x === "tickMark") === -1
        ? false
        : true;

    // if there has been some change then change the style
    if (this.angleMarkerDecorationChange) {
      this.changeStyle({
        selected: selected,
        payload: {
          panel: StyleEditPanels.Front,
          angleMarkerTickMark: angleMarkerTickMarkDisplay,
          angleMarkerDoubleArc: angleMarkerDoubleArcDisplay
        }
      });
    }
    this.angleMarkerDecorationChange = false;
  }
  setAngleMarkerDecorationSelectorState(styleState: StyleOptions[]): void {
    this.disableAngleMarkerDecorationsUndoButton = true;
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
    this.disableAngleMarkerDecorationsUndoButton = true;
    this.totalyDisableAngleMarkerDecorationsSelector = totally;
    // Set the angle marker disabled values
    this.angleMarkerDecorations = undefined;
  }
  setAngleMarkerDecorationChange(): void {
    this.angleMarkerDecorationChange = true;
  }
  setStyleDataAgreement(): void {
    this.angleMarkerDecorationsAgreement = true;
  }

  /**
   * Determines if the commonStyleProperties has the given input of type Styles
   * The input is an enum of type Styles
   * This is the key method for the hasXXX() methods which control the display of the XXX fade-in-card
   */
  hasStyle(s: Styles): boolean {
    const sNum = Number(s);
    return (
      this.commonStyleProperties.length > 0 &&
      this.commonStyleProperties.findIndex(x => x === sNum) >= 0
    );
  }
  get hasStrokeColor(): boolean {
    return this.hasStyle(Styles.strokeColor);
  }
  get hasFillColor(): boolean {
    return this.hasStyle(Styles.fillColor);
  }
  get hasStrokeWidthPercent(): boolean {
    return this.hasStyle(Styles.strokeWidthPercent);
  }
  get hasPointRadiusPercent(): boolean {
    return this.hasStyle(Styles.pointRadiusPercent);
  }
  get hasDashPattern(): boolean {
    return this.hasStyle(Styles.dashArray);
  }
  get hasDynamicBackStyle(): boolean {
    return this.hasStyle(Styles.dynamicBackStyle);
  }
  get hasAngleMarkerRadiusPercent(): boolean {
    return this.hasStyle(Styles.angleMarkerRadiusPercent);
  }
  get hasAngleMarkerDecoration(): boolean {
    return (
      this.hasStyle(Styles.angleMarkerTickMark) &&
      this.hasStyle(Styles.angleMarkerDoubleArc)
    );
  }

  @Watch("activePanel")
  private activePanelChange(): void {
    if (this.activePanel !== undefined && this.panel === this.activePanel) {
      // activePanel = undefined means that no edit panel is open
      this.onSelectionChanged(this.selectedSENodules);
    }
  }
  /**
   * This is an example of the two-way binding that is provided by the Vuex store. As this is a Vue component we can Watch variables, and
   * when they change, this method will execute in response to that change.
   */
  @Watch("selections")
  onSelectionChanged(newSelection: SENodule[]): void {
    // Before changing the selections save the state for an undo/redo command (if necessary)
    this.saveStyleState();

    this.commonStyleProperties.clear();
    if (newSelection.length === 0) {
      //totally disable the selectors in this component
      this.disableDashPatternSelector(true);
      this.disableDynamicBackStyleSelector(true);
      this.setOldStyleSelection([]);
      return;
    }

    // record the new selections in the old
    this.setOldStyleSelection([]);
    const oldSelection = this.getOldStyleSelection;
    newSelection.forEach(obj => oldSelection.push(obj));

    // Create a list of the common properties that the objects in the selection have.
    // commonStyleProperties is a number (corresponding to an enum) array
    // The customStyles method returns a list of the styles the are adjustable for that object
    for (let k = 0; k < values.length; k++) {
      if (newSelection.every(s => s.customStyles().has(k))) {
        this.commonStyleProperties.push(k);
      }
    }

    // Get the initial and default style state of the object for undo/redo and buttons to revert to initial style.
    // Put this in the store so that it is availble to *all* panels. Get the front and back information at the same time.

    //#region setStyle
    this.recordStyleState({
      selected: newSelection,
      backContrast: Nodule.getBackStyleContrast()
    });
    //#endregion setStyle

    this.setSavedFromPanel(this.panel);
    //Set the initial state of the fade-in-card/selectors (checking to see if the property is the same across all selected objects)
    this.setDashPatternSelectorState(this.getInitialStyleState(this.panel));
    this.setDynamicBackStyleSelectorState(
      this.getInitialStyleState(this.panel)
    );
  }
  saveStyleState(): void {
    const oldSelection = this.getOldStyleSelection;
    // There must be an old selection in order for there to be a change to save
    if (oldSelection.length > 0) {
      console.log("Attempt style save command");
      //Record the current state of each Nodule
      this.currentStyleStates.splice(0);

      oldSelection.forEach((seNodule: SENodule) => {
        if (seNodule.ref !== undefined)
          this.currentStyleStates.push(
            seNodule.ref.currentStyleState(this.getSavedFromPanel)
          );
      });
      const initialStyleStates = this.getInitialStyleState(
        this.getSavedFromPanel
      );
      const initialBackStyleContrast = this.getInitialBackStyleContrast;
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
          this.getSavedFromPanel,
          this.currentStyleStates,
          initialStyleStates,
          Nodule.getBackStyleContrast(),
          initialBackStyleContrast
        ).push();
      }
      // clear the old selection so that this save style state will not be executed again until changes are made.
      this.setOldStyleSelection([]);
    }
  }

  areEquivalentStyles(
    styleStates1: StyleOptions[],
    styleStates2: StyleOptions[]
  ): boolean {
    if (styleStates1.length !== styleStates2.length) {
      throw "Attempted to compare two different length styles in areEquivalentStyles";
      //return false;
    }
    for (let i = 0; i < styleStates1.length; i++) {
      const a = styleStates1[i];
      const b = styleStates2[i];
      if (
        a.strokeWidthPercent === b.strokeWidthPercent &&
        a.strokeColor === b.strokeColor &&
        a.fillColor === b.fillColor &&
        a.dynamicBackStyle === b.dynamicBackStyle &&
        a.pointRadiusPercent === b.pointRadiusPercent &&
        a.angleMarkerRadiusPercent === b.angleMarkerRadiusPercent
      ) {
        //now check the dash array which can be undefined, an empty array,length one array or a length two array.
        if (a.dashArray === undefined && b.dashArray === undefined) {
          break; // stop checking this pair in the array because we can conclude they are equal.
        }
        if (a.dashArray !== undefined && b.dashArray !== undefined) {
          if (a.dashArray.length === b.dashArray.length) {
            if (a.dashArray.length === 0 && b.dashArray.length === 0) {
              break; // stop checking this pair in the array because we can conclude they are equal.
            } else if (
              a.dashArray.length === 1 &&
              b.dashArray.length === 1 &&
              a.dashArray[0] === b.dashArray[0]
            ) {
              break; // stop checking this pair in the array because we can conclude they are equal.
            } else if (
              a.dashArray.length === 2 &&
              b.dashArray.length === 2 &&
              a.dashArray[0] === b.dashArray[0] &&
              a.dashArray[1] === b.dashArray[1]
            ) {
              break; // stop checking this pair in the array because we can conclude they are equal.
            } else {
              return false;
            }
          } else {
            return false;
          }
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
    // If we reach here the arrays of style states are equal
    return true;
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
