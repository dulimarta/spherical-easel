<template>
  <div>
    <!-- objects(s) not showing overlay ---higher z-index rendered on top -- covers entire panel including the header-->
    <OverlayWithFixButton v-if="!allObjectsShowing"
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
            :disabled="!usingAutomaticBackStyle"
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
          <v-col>Reset/Undo: inoperable</v-col>
          <v-col cols="1"
            class="ma-0 pl-0 pr-0 pt-0 pb-2">
            <HintButton @click="clearStyleData('backStyleContrast')"
              data-se-props="backStyleContrast"
              data-se-flag="backContrastGroup"
              :disabled="disableControl['backContrastGroup']"
              type="undo"
              i18n-label="style.clearChanges"
              i18n-tooltip="style.clearChangesToolTip">
            </HintButton>
          </v-col>

          <v-col cols="2"
            class="ma-0 pl-0 pr-0 pt-0 pb-2">
            <HintButton
              @click="resetStyleDataToDefaults('backStyleContrast')"
              type="default"
              i18n-label="style.restoreDefaults"
              i18n-tooltip="style.restoreDefaultsToolTip">
            </HintButton>
          </v-col>
        </v-row>
      </v-container>
      <OverlayWithFixButton v-if="enableBackStyleEditing"
        z-index="5"
        i18n-title-line="style.dynamicBackStyleHeader"
        i18n-button-label="style.enableDynamicBackStyle"
        i18n-button-tool-tip="style.disableDynamicBackStyleToolTip"
        @click="toggleBackStyleOptionsAvailability">
        Enable auto back styling?
      </OverlayWithFixButton>
    </fade-in-card>

    <!-- Scope of the Disable Dynamic Back Style Overlay and the BackStyle Disagreemnt overlay-->
    <v-card color="grey lighten-2">
      <OverlayWithFixButton v-if="stylePropsConflictList.length > 0"
        z-index="1"
        i18n-title-line="style.styleDisagreement"
        i18n-button-label="style.enableCommonStyle"
        i18n-button-tool-tip="style.differentValuesToolTip"
        :i18n-list-items="stylePropsConflictList"
        @click="setStyleDataAgreement">

      </OverlayWithFixButton>
      <!-- Enable the Dynamic Back Style Overlay -->

      <!-- Disable the Dynamic Back Style Overlay -->
      <OverlayWithFixButton
        v-if="editModeIsBack && !enableBackStyleEditing"
        z-index="50"
        i18n-title-line="style.dynamicBackStyleHeader"
        i18n-subtitle-line="To allow style customization, back styling must be disabled"
        i18n-button-label="style.disableDynamicBackStyle"
        i18n-button-tool-tip="style.disableDynamicBackStyleToolTip"
        @click="toggleBackStyleOptionsAvailability">
        Disable auto back styling?
        <ul>
          <li>Apply Dynamic Back Stlye? {{usingAutomaticBackStyle}}
          </li>
          <li>Common Value {{propDynamicBackStyleCommonValue}}</li>
        </ul>
      </OverlayWithFixButton>

      <!-- usingAutomaticBackStyle disagreemnt  -->
      <!--OverlayWithFixButton
        v-if="enableBackStyleEditing && !styleDataAgreement"
        z-index="40"
        i18n-title-line="style.backStyleDisagreement"
        i18n-button-label="style.enableCommonStyle"
        i18n-button-tool-tip="style.differentValuesToolTip"
        @click="setCommonDynamicBackStyleAgreement">
        Which three
        <ul>
          <li>Apply Dynamic Back Stlye? {{usingAutomaticBackStyle}}
          </li>
          <li>Common Value {{propDynamicBackStyleCommonValue}}</li>
        </ul>

      </OverlayWithFixButton-->

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
                @click="resetStyleDataToDefaults('strokeColor,strokeWidthPercent,fillColor')"
                type="default"
                i18n-label="style.restoreDefaults"
                i18n-tooltip="style.restoreDefaultsToolTip">
              </HintButton>
            </v-col>
          </v-row>
        </v-container>
      </fade-in-card>
    </v-card>
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
        <span v-show="!emptyDashPattern">
          {{ activeDashPattern }}
        </span>

        <!-- The dash property slider -->
        <v-range-slider v-model="activeStyleOptions.dashArray"
          :min="0"
          step="2"
          :disabled="emptyDashPattern"
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
import Nodule, { DisplayStyle } from "../plottables/Nodule";
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
    backContrastGroup: true
  };
  /**
   * These are the temp style state for the selected objects. Used to set the color/number/dash/contrast selectors when the user disables the dynamic back styling.
   */
  private tempStyleStates: StyleOptions[] = [];

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

  private stylePropsConflictList: Array<string> = [];

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

  private hslaStrokeColorObject: hslaColorType = { h: 0, s: 1, l: 1, a: 0.001 }; // Color for Vuetify Color picker NOTE: setting a=0 creates the following error:
  // create a circle, open the style panel, select the circle when the basic panel is open, switch to the foreground panel, the selected circle has a displayed opacity of 0 --
  // that is the blinking is between nothing and a red circle glowing circle) The color picker display is correct though... strange!
  private hslaFillColorObject: hslaColorType = { h: 0, s: 1, l: 1, a: 0.001 }; // Color for Vuetify Color picker

  /** gapLength = sliderArray[0] */
  private gapLength = 5;
  /** dashLength= sliderArray[1] - sliderArray[0] */
  private dashLength = 10;
  /** gap then dash in DashPattern when passed to object*/
  /** sliderDashArray[1]- sliderDashArray[0] is always positive or zero and equals dashLength */
  private sliderDashArray: number[] = [5, 15];
  private emptyDashPattern = false;
  private maxGapLengthPlusDashLength =
    SETTINGS.style.maxGapLengthPlusDashLength;

  // propDynamicBackStyleCommonValue = true indicates ( when styleDataAgreement = true ) that
  // all selected objects have the dynamicBackstyle = true
  // propDynamicBackStyleCommonValue = false indicates ( when styleDataAgreement = true ) that
  // all selected objects have the dynamicBackstyle = false
  // if styleDataAgreement = false then propDynamicBackStyleCommonValue is meaningless
  // if styleDataAgreement = true and propDynamicBackStyleCommonValue is undefined, then something went horribly wrong!
  private propDynamicBackStyleCommonValue = true;
  // usingAutomaticBackStyle = false means that the user is setting the color for the back on their own and is
  // *not* using the contrast (i.e. not using the dynamic back styling)
  // usingAutomaticBackStyle = true means the program is setting the style of the back objects
  private usingAutomaticBackStyle = true;

  // dbAgreement and udbCommonValue are computed by the program
  // useDB is set by user
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

    // Enable use automatic back styling only when we are mounted as a BackStyle
    this.usingAutomaticBackStyle = this.panel === StyleEditPanels.Back;
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

  get allObjectsShowing(): boolean {
    return this.selectedSENodules.every(node => node.showing);
  }

  get enableBackStyleEditing(): boolean {
    // Must be in  Back panel
    if (this.panel !== StyleEditPanels.Back) return false;
    // The user wants automatic back styling
    // [The user does NOT manual back styling]
    if (this.usingAutomaticBackStyle === true) return false;
    // We got here when the user requested manual editing of back style
    return !this.propDynamicBackStyleCommonValue;
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

  clearStyleData(props: string): void {
    if (props !== "backStyleContrast") {
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
    } else if (this.editModeIsBack) {
      Nodule.setBackStyleContrast(this.initialBackStyleContrast);
      console.debug("Changing Global backstyle contrast");
      this.selectedSENodules.forEach((n: SENodule) => {
        n.ref?.stylize(DisplayStyle.ApplyCurrentVariables);
      });
    }
  }

  resetStyleDataToDefaults(props: string): void {
    if (props !== "backStyleContrast") {
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
    } else if (this.editModeIsBack) {
      Nodule.setBackStyleContrast(SETTINGS.style.backStyleContrast);
      console.debug("Changing Global backstyle contrast");
      this.selectedSENodules.forEach((n: SENodule) => {
        n.ref?.stylize(DisplayStyle.ApplyCurrentVariables);
      });
    }
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
      if (this.activeStyleOptions && this.activeStyleOptions.dashArray)
        this.activeStyleOptions.dashArray = [this.dashLength, this.gapLength];
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
      if (this.activeStyleOptions && this.activeStyleOptions.dashArray)
        delete this.activeStyleOptions.dashArray;
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
      if (this.activeStyleOptions && this.activeStyleOptions.dashArray) {
        console.debug(
          "Updating styleoption dash array +1",
          this.sliderDashArray
        );

        Vue.set(this.activeStyleOptions, "dashArray", [
          this.dashLength,
          this.gapLength
        ]);
      }
    }
  }
  decrementDashPattern(): void {
    // increasing the value of the sliderDashArray[0] decreases the length of the dash
    if (
      this.sliderDashArray[0] + 1 <=
      SETTINGS.style.maxGapLengthPlusDashLength
    ) {
      console.debug("Updating slider dash array -1", this.sliderDashArray);
      Vue.set(this.sliderDashArray, 0, this.sliderDashArray[0] + 1);
      this.gapLength = this.sliderDashArray[0];
      this.dashLength = this.sliderDashArray[1] - this.sliderDashArray[0];
      if (this.activeStyleOptions && this.activeStyleOptions.dashArray) {
        console.debug(
          "Updating styleoption dash array -1",
          this.sliderDashArray
        );
        Vue.set(this.activeStyleOptions, "dashArray", [
          this.dashLength,
          this.gapLength
        ]);
      }
    }
    /** TODO:
     * The actual dots on the slider are not moveing when I click the plus (-) sign and trigger this decrementDashPattern method
     * How do I trigger an event that will cause the actual dots on the slider to move?
     */
  }

  // These methods are linked to the usingAutomaticBackStyle fade-in-card
  @Watch("backStyleContrast")
  onBackStyleContrastChange(): void {
    console.debug("Background contrast updated to", this.backStyleContrast);
    Nodule.setBackStyleContrast(this.backStyleContrast);
    console.debug("Changing Global backstyle contrast");
    this.selectedSENodules.forEach((n: SENodule) => {
      n.ref?.stylize(DisplayStyle.ApplyCurrentVariables);
    });
  }

  toggleBackStyleOptionsAvailability(): void {
    this.usingAutomaticBackStyle = !this.usingAutomaticBackStyle;
    this.propDynamicBackStyleCommonValue = this.usingAutomaticBackStyle;

    SEStore.changeStyle({
      selected: this.selectedSENodules,
      panel: this.panel,
      payload: {
        dynamicBackStyle: this.usingAutomaticBackStyle
      }
    });
  }
  incrementBackStyleContrast(): void {
    if (this.usingAutomaticBackStyle && this.backStyleContrast + 0.1 <= 1) {
      this.backStyleContrast += 0.1;
    }
  }
  decrementBackStyleContrast(): void {
    if (this.usingAutomaticBackStyle && this.backStyleContrast - 0.1 >= 0) {
      this.backStyleContrast -= 0.1;
    }
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

  setStyleDataAgreement(): void {
    this.stylePropsConflictList.splice(0);
    if (this.editModeIsBack) this.propDynamicBackStyleCommonValue = true;
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
    // Before changing the selections save the state for an undo/redo command (if necessary)
    this.saveStyleState();

    this.commonStyleProperties.splice(0);
    if (newSelection.length === 0) {
      //totally disable the selectors in this component
      if (this.editModeIsBack) this.usingAutomaticBackStyle = true;

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
    const plottables = newSelection
      .filter((n: SENodule) => n.ref !== null)
      .map((n: SENodule) => n.ref!);

    if (plottables.length > 1) {
      // When multiple objects are selected, check for possible conflict
      this.propDynamicBackStyleCommonValue = false;

      // Select property names which have conflicting values
      const disagreePropNames = this.commonStyleProperties.filter(
        (propName: string) => {
          // Confirm that the values of common style property are the same
          // across all selected objects
          // Use the first object as reference
          const referenceSO = plottables[0].currentStyleState(this.panel);
          const referenceValue = (referenceSO as any)[propName];
          if (propName === "dynamicBackStyle")
            this.propDynamicBackStyleCommonValue = referenceValue;

          // Verify that the re
          const agreement = plottables.every((p: Nodule) => {
            const thisSO = p.currentStyleState(this.panel);
            const thisValue = (thisSO as any)[propName];
            console.debug(
              `Comparing ${propName}: ${thisValue} vs ${referenceValue}`
            );
            if (Array.isArray(thisValue) || Array.isArray(referenceValue))
              return this.dashArrayCompare(thisValue, referenceValue);
            return thisValue === referenceValue;
          });
          console.debug(`Property ${propName} agreement`, agreement);
          return !agreement;
        }
      );
      this.stylePropsConflictList.splice(0);
      if (disagreePropNames.length > 0) {
        this.stylePropsConflictList.push(...disagreePropNames);
        console.error("Disagreement in property values");
        console.debug("List of disagreement", disagreePropNames);
      }
    } else {
      // If we reach this point we have EXACTLY ONE object selected
      const opt = plottables[0].currentStyleState(this.panel);
      this.propDynamicBackStyleCommonValue =
        (opt as any)["dynamicBackStyle"] ?? false;
      console.debug("Only one object is selected with style options", opt);
    }
  }

  @Watch("activeStyleOptions", { deep: true, immediate: true })
  onActiveStyleOptionsChanged(newVal: StyleOptions | null): void {
    // If no active style, do nothing
    if (newVal === null) return;
    console.debug("active style options changed", newVal);
    // Extract property names from the previous active style options
    const oldProps: Set<string> = new Set(
      this.pastStyleOptions
        ? Object.getOwnPropertyNames(this.pastStyleOptions).filter(
            (s: string) => !s.startsWith("__")
          )
        : []
    );
    // Extract property names from the current active style options
    const newProps: Set<string> = new Set(
      newVal
        ? Object.getOwnPropertyNames(newVal).filter(
            (s: string) => !s.startsWith("__")
          )
        : []
    );
    // Check for removed property names
    const removedProps = [...oldProps].filter((p: string) => !newProps.has(p));
    if (removedProps.length > 0 && this.selectedSENodules.length > 0) {
      console.debug("Attempt to remove", removedProps);
      throw new Error(
        "Removing style options from selections is not currently supported"
      );
    }

    // Check for new property names
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const addedProps = [...newProps].filter((p: string) => !oldProps.has(p));
    if (addedProps.length > 0)
      console.debug("Adding some new props", addedProps);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const updatedProps = [...newProps].filter((p: string) => oldProps.has(p));

    const updatePayload: StyleOptions = { ...newVal }; // Make a clone

    // Remove properties which did not change value
    [...updatedProps].forEach((p: string) => {
      const a = (this.pastStyleOptions as any)[p];
      const b = (newVal as any)[p];

      // Exclude the property from the payload if they do not change
      if (a === b) {
        // console.debug(`Excluding ${p} from payload`);
        delete (updatePayload as any)[p];
      } else {
        console.debug(`Property ${p} is updated from ${a} to ${b}`);
      }
    });

    /* If multiple labels are selected, do not update the name */
    if (this.selectedSENodules.length > 1)
      delete updatePayload.labelDisplayText;

    // Apply the style
    this.selectedSENodules
      .filter((obj: SENodule) => obj.ref)
      .map((obj: SENodule): Required<SENodule> => obj as Required<SENodule>)
      .forEach((obj: Required<SENodule>) => {
        obj.ref.updateStyle(this.panel, { ...updatePayload });
      });
    this.pastStyleOptions = { ...newVal };
  }

  saveStyleState(): void {
    // TODO: oldStyleSelection is always empty???
    const oldSelection = this.oldStyleSelection;
    // There must be an old selection in order for there to be a change to save
    if (oldSelection.length > 0) {
      console.log("Attempt style save command");
      //Record the current state of each Nodule
      const currentStyleStates: Array<StyleOptions> = [];

      oldSelection.forEach((seNodule: SENodule) => {
        if (seNodule.ref !== undefined)
          currentStyleStates.push(
            seNodule.ref.currentStyleState(this.styleSavedFromPanel)
          );
      });
      const initialStyleStates = SEStore.getInitialStyleState(
        this.styleSavedFromPanel
      );
      const initialBackStyleContrast = this.initialBackStyleContrast;
      if (
        !this.areEquivalentStyles(currentStyleStates, initialStyleStates) ||
        initialBackStyleContrast != Nodule.getBackStyleContrast()
      ) {
        console.log("Issued style save command");
        // Add the label of the
        new StyleNoduleCommand(
          oldSelection,
          this.styleSavedFromPanel,
          currentStyleStates,
          initialStyleStates,
          Nodule.getBackStyleContrast(),
          initialBackStyleContrast
        ).push();
      }
      // clear the old selection so that this save style state will not be executed again until changes are made.
      SEStore.setOldStyleSelection([]);
    }
  }

  /**
   * In the following function: undefined, [], [0,0] are equivalent
   */
  dashArrayCompare(
    arr1: Array<number> | undefined,
    arr2: Array<number> | undefined
  ): boolean {
    const a = arr1 || []; // turn undefined into zero-length array
    const b = arr2 || []; // turn undefined into zero length array
    if (a.length == 0 && b.length === 0) return true;
    if (a.length == 0) return b.every((val: number) => val === 0);
    if (b.length == 0) return a.every((val: number) => val === 0);
    return a.every((val: number, k: number) => val === b[k]);
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
