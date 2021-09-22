<template>
  <div>
    <StyleEditor :panel="panel"
      :nodule-filter-function="objectFilter"
      :nodule-map-function="objectMapper">
      <div
        slot-scope="{angleMarkersSelected, oneDimensionSelected, selectionCount,dataAgreement,forceDataAgreement, hasStyle, styleOptions, conflictingProps}">
        <!--ul>
          <li>Conclict list: {{conflictingProps}}</li>
          <li>Style Opt: {{styleOptions}}</li>
          <li>Enable Back Style edit?
            {{enableBackStyleEdit}}</li>
          <li>Automatic Back Style Common Value
            {{automaticBackStyleCommonValue}}---</li>
          <li>User request automatic back style?
            {{usingAutomaticBackStyle}}</li>
        </ul-->
        <!-- objects(s) not showing overlay ---higher z-index rendered on top -- covers entire panel including the header-->
        <OverlayWithFixButton v-if="!allObjectsShowing"
          z-index="100"
          i18n-title-line="style.objectNotVisible"
          i18n-subtitle-line="style.clickToMakeObjectsVisible"
          i18n-button-label="style.makeObjectsVisible"
          i18n-button-tool-tip="style.objectsNotShowingToolTip"
          @click="toggleAllObjectsVisibility">
        </OverlayWithFixButton>
        <FadeInCard v-if="editModeIsBack">
          <!-- Enable the Dynamic Back Style Overlay -->
          <OverlayWithFixButton
            v-if="!styleOptions.dynamicBackStyle && dataAgreement(/dynamicBackStyle/)"
            z-index="5"
            i18n-title-line="style.dynamicBackStyleHeader"
            i18n-button-label="style.enableDynamicBackStyle"
            i18n-button-tool-tip="style.disableDynamicBackStyleToolTip"
            @click="toggleUsingAutomaticBackStyle(styleOptions)">
          </OverlayWithFixButton>
          <!-- Global contrast slider -->
          <span class="text-subtitle-2"
            style="color:red">{{ $t('style.globalBackStyleContrast')+" " }}</span>
          <span
            class="text-subtitle-2">{{ $t('style.backStyleContrast') }}</span>
          <span>
            {{" ("+ Math.floor(backStyleContrast*100)+"%)" }}
          </span>
          <v-tooltip bottom
            :open-delay="toolTipOpenDelay"
            :close-delay="toolTipCloseDelay"
            max-width="400px">
            <template v-slot:activator="{ on }">
              <span v-on="on">
                <v-slider v-model="backStyleContrast"
                  :min="0"
                  step="0.1"
                  :max="1"
                  type="range"
                  :disabled="!styleOptions.dynamicBackStyle && !dataAgreement(/dynamicBackStyle/)"
                  @change="setBackStyleContrast"
                  dense>
                  <template v-slot:prepend>
                    <v-icon @click="backStyleContrast -= 0.1">
                      mdi-minus
                    </v-icon>
                  </template>
                  <template v-slot:thumb-label="{ value }">
                    {{ backStyleContrastSelectorThumbStrings[Math.floor(value*10)] }}
                  </template>
                  <template v-slot:append>
                    <v-icon @click="backStyleContrast += 0.1">
                      mdi-plus
                    </v-icon>
                  </template>
                </v-slider>
              </span>
            </template>
            <span>{{ $t("style.backStyleContrastToolTip") }}</span>
          </v-tooltip>
        </FadeInCard>
        <v-card>

          <!-- Disable the Dynamic Back Style Overlay -->
          <OverlayWithFixButton v-if="!dataAgreement(/dynamicBackStyle/)"
            z-index="100"
            i18n-title-line="style.backStyleDisagreement"
            i18n-button-label="style.enableCommonStyle"
            i18n-button-tool-tip="style.backStyleDifferentValuesToolTip"
            @click="forceDataAgreement([`dynamicBackStyle`]); styleOptions.dynamicBackStyle=!styleOptions.dynamicBackStyle">
          </OverlayWithFixButton>
          <OverlayWithFixButton
            v-if="editModeIsBack && styleOptions.dynamicBackStyle"
            z-index="50"
            i18n-title-line="style.dynamicBackStyleHeader"
            i18n-button-label="style.disableDynamicBackStyle"
            i18n-button-tool-tip="style.disableDynamicBackStyleToolTip"
            @click="toggleUsingAutomaticBackStyle(styleOptions)">
          </OverlayWithFixButton>
          <InputGroup :numSelected="selectionCount"
            input-selector="strokeColor,strokeWidthPercent,fillColor"
            :panel="panel"
            v-if="hasStyle(/strokeColor|strokeWidthPercent|fillColor/)">
            <OverlayWithFixButton
              v-if="!dataAgreement(/strokeColor|strokeWidthPercent|fillColor/)"
              z-index="1"
              i18n-title-line="style.styleDisagreement"
              i18n-button-label="style.enableCommonStyle"
              i18n-button-tool-tip="style.differentValuesToolTip"
              @click="distinguishConflictingItems(conflictingProps);
                      forceDataAgreement([`strokeColor`,`strokeWidthPercent`,`fillColor`])">
            </OverlayWithFixButton>
            <!-- Front/Back Stroke Color Selector-->
            <SimpleColorSelector class="pa-2"
              :numSelected="selectionCount"
              titleKey="style.strokeColor"
              v-if="hasStyle(/strokeColor/)"
              :conflict="conflictItems.strokeColor"
              v-on:resetColor="conflictItems.strokeColor=false"
              style-name="strokeColor"
              :data.sync="styleOptions.strokeColor" />
            <v-divider></v-divider>
            <SimpleNumberSelector v-if="hasStyle(/strokeWidthPercent/)"
              :numSelected="selectionCount"
              class="pa-2"
              :conflict="conflictItems.strokeWidthPercent"
              v-bind:data.sync="styleOptions.strokeWidthPercent"
              title-key="style.strokeWidthPercent"
              :min="minStrokeWidthPercent"
              :max="maxStrokeWidthPercent"
              :color="conflictItems.strokeWidthPercent?'red':''"
              v-on:resetColor="conflictItems.strokeWidthPercent=false"
              :step="20"
              :thumb-string-values="strokeWidthScaleSelectorThumbStrings" />
            <v-divider></v-divider>
            <SimpleColorSelector title-key="style.fillColor"
              :numSelected="selectionCount"
              class="pa-2"
              :conflict="conflictItems.fillColor"
              v-on:resetColor="conflictItems.fillColor=false"
              v-if="hasStyle(/fillColor/)"
              style-name="fillColor"
              :data.sync="styleOptions.fillColor" />
          </InputGroup>
          <InputGroup input-selector="pointRadiusPercent"
            :panel="panel"
            :numSelected="selectionCount"
            v-if="hasStyle(/pointRadiusPercent/)">
            <OverlayWithFixButton
              v-if="!dataAgreement(/pointRadiusPercent/)"
              z-index="1"
              i18n-title-line="style.styleDisagreement"
              i18n-button-label="style.enableCommonStyle"
              i18n-button-tool-tip="style.differentValuesToolTip"
              @click="distinguishConflictingItems(conflictingProps);
                      forceDataAgreement([`pointRadiusPercent`])">
            </OverlayWithFixButton>
            <!--- Front/Back Point Radius Number Selector -->

            <SimpleNumberSelector class="pa-2"
              :numSelected="selectionCount"
              :data.sync="styleOptions.pointRadiusPercent"
              :color="conflictItems.pointRadiusPercent?'red':''"
              :conflict="conflictItems.pointRadiusPercent"
              v-on:resetColor="conflictItems.pointRadiusPercent=false"
              title-key="style.pointRadiusPercent"
              :min="minPointRadiusPercent"
              :max="maxPointRadiusPercent"
              :step="20"
              :thumb-string-values="pointRadiusSelectorThumbStrings">
            </SimpleNumberSelector>
          </InputGroup>
        </v-card>
        <div v-show="showMoreLabelStyles">

          <InputGroup :numSelected="selectionCount"
            :panel="panel"
            input-selector="angleMarkerRadiusPercent,angleMarkerTickMark,angleMarkerDoubleArc"
            v-if="editModeIsFront && hasStyle(/angleMarker/)">
            <OverlayWithFixButton
              v-if="!dataAgreement(/angleMarkerRadiusPercent|angleMarkerTickMark|angleMarkerDoubleArc/)"
              z-index="1"
              i18n-title-line="style.styleDisagreement"
              i18n-button-label="style.enableCommonStyle"
              i18n-button-tool-tip="style.differentValuesToolTip"
              @click="distinguishConflictingItems(conflictingProps);
                      forceDataAgreement([`angleMarkerRadiusPercent`,`angleMarkerTickMark`,`angleMarkerDoubleArc`])">
            </OverlayWithFixButton>
            <span
              class="text-subtitle-2">{{ $t(`style.angleMarkerOptions`) }}</span>

            <br />
            <v-divider></v-divider>
            <SimpleNumberSelector class="pa-2"
              :numSelected="selectionCount"
              :color="conflictItems.angleMarkerRadiusPercent?'red':''"
              :conflict="conflictItems.angleMarkerRadiusPercent"
              v-on:resetColor="conflictItems.angleMarkerRadiusPercent=false"
              :data.sync="styleOptions.angleMarkerRadiusPercent"
              title-key="style.angleMarkerRadiusPercent"
              :min="minAngleMarkerRadiusPercent"
              :max="maxAngleMarkerRadiusPercent"
              :step="20"
              :thumb-string-values="angleMarkerRadiusSelectorThumbStrings">
            </SimpleNumberSelector>
            <!-- Angle Marker Decoration Selector -->
            <v-row justify="space-around">
              <v-col>
                <v-switch v-model="styleOptions.angleMarkerTickMark"
                  :color="conflictItems.angleMarkerTickMark?'red':''"
                  @change="updateInputGroup('angleMarkerRadiusPercent,angleMarkerTickMark,angleMarkerDoubleArc'); conflictItems.angleMarkerTickMark = false">
                  <template v-slot:label>
                    <span
                      :style="{'color': conflictItems.angleMarkerTickMark?'red':``}">{{ $t('style.angleMarkerTickMark')}}</span>
                  </template>
                </v-switch>
              </v-col>
              <v-col>
                <v-switch v-model="styleOptions.angleMarkerDoubleArc"
                  :color="conflictItems.angleMarkerDoubleArc?'red':''"
                  @change="updateInputGroup('angleMarkerRadiusPercent,angleMarkerTickMark,angleMarkerDoubleArc'),conflictItems.angleMarkerDoubleArc = false">
                  <template v-slot:label>
                    <span
                      :style="{'color': conflictItems.angleMarkerDoubleArc?'red':``}">{{ $t('style.angleMarkerDoubleArc')}}</span>
                  </template>
                </v-switch>
              </v-col>
            </v-row>
          </InputGroup>
          <InputGroup input-selector="dashArray"
            :panel="panel"
            :numSelected="selectionCount"
            v-if="(editModeIsFront && hasStyle(/dashArray/) && ((!angleMarkersSelected && oneDimensionSelected)||(angleMarkersSelected && !oneDimensionSelected)))
                 ||(editModeIsBack && hasStyle(/dashArray/) && !angleMarkersSelected)">
            <OverlayWithFixButton
              v-if="!dataAgreement(/dashArray|reverseDashArray/)"
              z-index="1"
              i18n-title-line="style.styleDisagreement"
              i18n-button-label="style.enableCommonStyle"
              i18n-button-tool-tip="style.differentValuesToolTip"
              @click="distinguishConflictingItems(conflictingProps);
                      forceDataAgreement([`dashArray`,`reverseDashArray`])">
            </OverlayWithFixButton>

            <span v-show="editModeIsFront && !angleMarkersSelected"
              class="text-subtitle-2">{{ $t("style.front") }}</span>
            <span v-show="editModeIsBack && !angleMarkersSelected"
              class="text-subtitle-2">{{ $t("style.back") }}</span>
            <span v-show="editModeIsFront && angleMarkersSelected"
              class="text-subtitle-2">{{ $t("style.frontAndBack") }}</span>
            <span
              class="text-subtitle-2">{{" "+ $t("style.dashPattern") }}</span>
            <span v-if="selectedSENodules.length > 1"
              class="text-subtitle-2"
              style="color:red">{{" "+ $t("style.labelStyleOptionsMultiple") }}</span>
            <span v-show="!emptyDashPattern">
              {{ activeDashPattern(styleOptions) }}
            </span>
            <!-- The dash property slider -->
            <v-range-slider v-model="styleOptions.dashArray"
              :key="dashArrayKey"
              min="0"
              :step="setStep(hasStyle(/angleMarker/))"
              :disabled="emptyDashPattern"
              :max="setMax(hasStyle(/angleMarker/))"
              :color="conflictItems.dashArray?'red':''"
              @change="updateLocalGapDashVariables(styleOptions, styleOptions.dashArray);conflictItems.dashArray = false"
              dense>
              <template v-slot:prepend>
                <v-icon
                  @click="decrementDashPattern(styleOptions,hasStyle(/angleMarker/))">
                  mdi-minus
                </v-icon>
              </template>

              <template v-slot:append>
                <v-icon
                  @click="incrementDashPattern(styleOptions,hasStyle(/angleMarker/))">
                  mdi-plus</v-icon>
              </template>
            </v-range-slider>
            <!-- Dis/enable Dash Pattern, Undo and Reset to Defaults buttons -->
            <v-container class="pa-0 ma-0">
              <v-row justify="space-around"
                no-gutters>
                <v-col>
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
                          :color="conflictItems.dashArray?'red':''"
                          @click="toggleDashPatternSliderAvailbility(styleOptions); conflictItems.dashArray = false"
                          hide-details
                          x-small
                          dense>
                          <template v-slot:label>
                            <span
                              :style="{'color': conflictItems.dashArray?'red':``}">{{ $t('style.dashPattern')}}</span>
                          </template>
                        </v-checkbox>
                      </span>
                    </template>
                    {{$t('style.dashPatternCheckBoxToolTip')}}
                  </v-tooltip>
                </v-col>
                <v-col>
                  <v-tooltip bottom
                    :open-delay="toolTipOpenDelay"
                    :close-delay="toolTipCloseDelay"
                    max-width="400px">
                    <template v-slot:activator="{ on }">
                      <span v-on="on">
                        <v-checkbox v-model="styleOptions.reverseDashArray"
                          :disabled="emptyDashPattern"
                          :color="conflictItems.reverseDashArray? `red`: ''"
                          @click="toggleDashPatternReverse(styleOptions); conflictItems.reverseDashArray = false"
                          hide-details
                          x-small
                          dense>
                          <template v-slot:label>
                            <span
                              :style="{'color': conflictItems.reverseDashArray?'red':``}">{{ $t('style.dashArrayReverse')}}</span>
                          </template>
                        </v-checkbox>
                      </span>
                    </template>
                    {{$t('style.dashPatternReverseArrayToolTip')}}
                  </v-tooltip>
                </v-col>
              </v-row>
            </v-container>
          </InputGroup>
        </div>

      </div>
    </StyleEditor>

    <!-- Scope of the Disable Dynamic Back Style Overlay and the BackStyle Disagreemnt overlay-->
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
import StyleEditor from "@/components/StyleEditor.vue";
import InputGroup from "@/components/InputGroupWithReset.vue";
import FadeInCard from "@/components/FadeInCard.vue";
import { AppState } from "@/types";
import EventBus from "@/eventHandlers/EventBus";
import SimpleNumberSelector from "@/components/SimpleNumberSelector.vue";
import SimpleColorSelector from "@/components/SimpleColorSelector.vue";
import i18n from "../i18n";
import HintButton from "@/components/HintButton.vue";
import OverlayWithFixButton from "@/components/OverlayWithFixButton.vue";
import { SEAngleMarker } from "@/models/SEAngleMarker";
import { SEStore } from "@/store";
const SE = namespace("se");

type ConflictItems = {
  angleMarkerRadiusPercent: boolean;
  pointRadiusPercent: boolean;
  angleMarkerTickMark: boolean;
  angleMarkerDoubleArc: boolean;
  strokeColor: boolean;
  fillColor: boolean;
  strokeWidthPercent: boolean;
  dashArray: boolean;
  reverseDashArray: boolean;
};
@Component({
  components: {
    FadeInCard,
    SimpleNumberSelector,
    SimpleColorSelector,
    HintButton,
    OverlayWithFixButton,
    StyleEditor,
    InputGroup
  }
})
export default class FrontBackStyle extends Vue {
  @Prop()
  readonly panel!: StyleEditPanels; // This is a constant in each copy of the BasicFrontBackStyle

  @Prop()
  readonly activePanel!: StyleEditPanels;

  @SE.State((s: AppState) => s.selectedSENodules)
  readonly selectedSENodules!: SENodule[];

  // @SE.State((s: AppState) => s.initialBackStyleContrast)
  // readonly initialBackStyleContrast!: number;

  @SE.State((s: AppState) => s.oldSelections)
  readonly oldStyleSelection!: SENodule[];

  @SE.State((s: AppState) => s.styleSavedFromPanel)
  readonly styleSavedFromPanel!: StyleEditPanels;

  @Watch("selectedSENodules")
  resetAllItemsFromConflict(): void {
    // console.log("here reset input colors");
    const key = Object.keys(this.conflictItems);
    key.forEach(prop => {
      (this.conflictItems as any)[prop] = false;
    });
  }

  // @Watch("selectedSENodules")
  // setAnglemarker(): void {
  //   console.log("set ang mark");
  //   this.isAngleMarker = this.selectedSENodules.every(
  //     seNodule => seNodule instanceof SEAngleMarker
  //   );
  // }
  // change the background color of the input if there is a conflict on that particular input
  private conflictItems: ConflictItems = {
    angleMarkerRadiusPercent: false,
    angleMarkerTickMark: false,
    angleMarkerDoubleArc: false,
    pointRadiusPercent: false,
    strokeColor: false,
    fillColor: false,
    strokeWidthPercent: false,
    dashArray: false,
    reverseDashArray: false
  };

  /* Include only those objects that have a plottable */
  objectFilter(n: SENodule): boolean {
    return n.ref !== undefined;
  }

  /* Map the object to its plottable */
  objectMapper(n: SENodule): Nodule {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return n.ref!;
  }

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
  private strokeWidthScaleSelectorThumbStrings: Array<string> = [];

  //Many of the label style will not be commonly modified so create a button/variable for
  // the user to click to show more of the Label Styling options
  private showMoreLabelStyles = false;
  private moreOrLessText = i18n.t("style.moreStyleOptions"); // The text for the button to toggle between less/more options

  private maxPointRadiusPercent = SETTINGS.style.maxPointRadiusPercent;
  private minPointRadiusPercent = SETTINGS.style.minPointRadiusPercent;
  //step is 20 from 60 to 200 is 8 steps
  private pointRadiusSelectorThumbStrings: Array<string> = [];

  //Angle Marker options
  private maxAngleMarkerRadiusPercent =
    SETTINGS.style.maxAngleMarkerRadiusPercent;
  private minAngleMarkerRadiusPercent =
    SETTINGS.style.minAngleMarkerRadiusPercent;
  private angleMarkerRadiusSelectorThumbStrings: Array<string> = [];

  //Dash pattern Options
  private dashArrayKey = 0;
  private dashPanelKey = 0;
  /** gapLength = sliderArray[1] */
  private gapLength = 0;
  private oldGapLength = 0;
  /** dashLength= sliderArray[0] */
  private dashLength = 0;
  private oldDashLength = 0;
  private emptyDashPattern = true;
  private alreadySet = false;
  //private reverseDashArray = true;

  setMax(angleMarker: boolean): number {
    if (angleMarker) {
      return SETTINGS.angleMarker.maxGapLengthOrDashLength;
    } else {
      return SETTINGS.style.maxGapLengthOrDashLength;
    }
  }
  setStep(angleMarker: boolean): number {
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
  toggleUsingAutomaticBackStyle(opt: StyleOptions): void {
    // console.log(opt);
    if (opt.dynamicBackStyle !== undefined) {
      // console.log(
      //   "dynamic style before",
      //   opt.dynamicBackStyle
      //   // this.usingAutomaticBackStyle
      // );
      opt.dynamicBackStyle = !opt.dynamicBackStyle;
      // this.usingAutomaticBackStyle = !this.usingAutomaticBackStyle;
      // console.log(
      //   "dynamic style after",
      //   opt.dynamicBackStyle
      //   // this.usingAutomaticBackStyle
      // );
    }
  }

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
  setBackStyleContrast(): void {
    SEStore.changeBackContrast(this.backStyleContrast);
  }

  private conflictingPropNames: string[] = []; // this should always be identical to conflictingProps in the template above.

  created(): void {
    for (
      let s = SETTINGS.style.minStrokeWidthPercent;
      s <= SETTINGS.style.maxStrokeWidthPercent;
      s += 20
    )
      this.strokeWidthScaleSelectorThumbStrings.push(s.toFixed(0) + "%");
    for (
      let s = SETTINGS.style.minPointRadiusPercent;
      s <= SETTINGS.style.maxPointRadiusPercent;
      s += 20
    )
      this.pointRadiusSelectorThumbStrings.push(s.toFixed(0) + "%");

    for (
      let s = SETTINGS.style.minAngleMarkerRadiusPercent;
      s < SETTINGS.style.maxAngleMarkerRadiusPercent;
      s += 20
    )
      this.angleMarkerRadiusSelectorThumbStrings.push(s.toFixed(0) + "%");
  }

  /** mounted() is part of VueJS lifecycle hooks */
  mounted(): void {
    // Pass any selected objects when FrontBackStyle Panel is mounted to the onSelection change
    //  Mount a save listener
    // EventBus.listen("set-active-style-panel", this.setActivePanel);

    // Enable use automatic back styling only when we are mounted as a BackStyle
    // this.usingAutomaticBackStyle = this.panel === StyleEditPanels.Back;

    // this.setAnglemarker();
    EventBus.listen(
      "style-label-conflict-color-reset",
      this.resetAndRestoreConflictColors
    );
    EventBus.listen(
      "style-update-conflicting-props",
      (names: { propNames: string[] }): void => {
        // this.conflictingPropNames.forEach(name =>
        //   console.log("old prop", name)
        // );
        this.conflictingPropNames.splice(0);
        names.propNames.forEach(name => this.conflictingPropNames.push(name));
        // this.conflictingPropNames.forEach(name =>
        //   console.log("new prop", name)
        // );
      }
    );
  }
  resetAndRestoreConflictColors(): void {
    this.alreadySet = false;
    this.resetAllItemsFromConflict();
    this.distinguishConflictingItems(this.conflictingPropNames);
  }
  beforeDestroy(): void {
    EventBus.unlisten("style-label-conflict-color-reset");
    EventBus.unlisten("style-update-conflicting-props");
  }
  get editModeIsBack(): boolean {
    return this.panel === StyleEditPanels.Back;
  }

  get editModeIsFront(): boolean {
    return this.panel === StyleEditPanels.Front;
  }

  get allObjectsShowing(): boolean {
    return this.selectedSENodules.every(node => node.showing);
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

  activeDashPattern(opt: StyleOptions): string {
    if (opt.dashArray) {
      // console.log(
      //   "dash array in active dash pattern",
      //   opt.dashArray[0], //dash length
      //   opt.dashArray[1], // gap length
      //   opt.reverseDashArray
      // );
      // Set the value of empty Dash array if not already set (only run on initialize and reset)
      if (!this.alreadySet) {
        this.alreadySet = true;
        if (opt.dashArray[0] === 0 && opt.dashArray[1] === 0) {
          this.emptyDashPattern = true;
        } else {
          this.emptyDashPattern = false;
        }
        this.oldDashLength = opt.dashArray[0];
        this.dashLength = opt.dashArray[0];

        this.oldGapLength = opt.dashArray[1];
        this.gapLength = opt.dashArray[1];

        // this.reverseDashArray = opt.reverseDashArray;
      }
      const string1 = `(Dash:${opt.dashArray[1].toFixed(
        1
      )}/Gap:${opt.dashArray[0].toFixed(1)})`;
      const string2 = `(Dash:${opt.dashArray[0].toFixed(
        1
      )}/Gap:${opt.dashArray[1].toFixed(1)})`;
      return opt.reverseDashArray ? string1 : string2;
    } else return "";
  }

  // Every change in the  dash pattern slider is recorded in opt.dashArray *and* in the local dashLength, dashGap
  updateLocalGapDashVariables(opt: StyleOptions, num: number[]): void {
    // this.sliderDashArray.splice(0);
    // console.log("num array", num[0], num[1]);
    if (opt.dashArray) {
      //store the gap/dash in the old gap/dash lengths
      this.oldDashLength = this.dashLength;
      this.dashLength = opt.dashArray[0];

      this.oldGapLength = this.gapLength;
      this.gapLength = opt.dashArray[1];
      // console.log("old dash/gap", this.oldDashLength, this.oldGapLength);
      // console.log("current dash/gap", this.dashLength, this.gapLength);
    }
  }
  toggleDashPatternReverse(opt: StyleOptions): void {
    // if (opt.reverseDashArray) {
    //   this.reverseDashArray = opt.reverseDashArray;
    // }
    Vue.set(opt, "dashArray", [this.dashLength, this.gapLength]); // trigger an update by updateing the dashArray with its current values
    // update the panel
    EventBus.fire("update-input-group-with-selector", {
      inputSelector: "dashArray"
    });
  }

  updateInputGroup(inputSelector: string): void {
    EventBus.fire("update-input-group-with-selector", {
      inputSelector: inputSelector
    });
  }

  toggleDashPatternSliderAvailbility(opt: StyleOptions): void {
    // this.emptyDashPattern = !this.emptyDashPattern; //NO NEED FOR THIS BEBCAUSE THE CHECK BOX HAS ALREADY TOGGLED IT!
    if (!this.emptyDashPattern && opt.dashArray) {
      // console.log(
      //   "old gap/dash in toogle",
      //   this.oldGapLength,
      //   this.oldDashLength
      // );
      this.gapLength = this.oldGapLength;
      this.dashLength = this.oldDashLength;
      Vue.set(opt, "dashArray", [this.oldDashLength, this.oldGapLength]); // trigger an update
    } else if (opt.dashArray) {
      //update the old gap/dash lengths
      this.oldGapLength = this.gapLength;
      this.oldDashLength = this.dashLength;
      // console.log("set the dash array to [0,0]");
      // set the dashArray to the no dash pattern array of [0,0]
      Vue.set(opt, "dashArray", [0, 0]); // trigger an update
    }
    // Force an update of UI slider.
    this.dashArrayKey += 1;
    // update the panel
    EventBus.fire("update-input-group-with-selector", {
      inputSelector: "dashArray"
    });
  }

  incrementDashPattern(opt: StyleOptions, angleMarker: boolean): void {
    // increases the length of the dash and the gap by a step
    /** gapLength = sliderArray[0] */
    /** dashLength= sliderArray[1] - sliderArray[0] */
    const step = angleMarker
      ? SETTINGS.angleMarker.sliderStepSize
      : SETTINGS.style.sliderStepSize;
    const max = angleMarker
      ? SETTINGS.angleMarker.maxGapLengthOrDashLength
      : SETTINGS.style.maxGapLengthOrDashLength;

    if (this.gapLength + step <= max && this.dashLength + step <= max) {
      //this.sliderDashArray[1] + 2 * step <= max) {
      // Vue.set(
      //   this.sliderDashArray,
      //   this.sliderDashArray[0] + step,
      //   this.sliderDashArray[1] + 2 * step
      // );

      // const val1 = this.sliderDashArray[0] + step;
      // const val2 = this.sliderDashArray[1] + 2 * step;
      // this.sliderDashArray.splice(0);
      // this.sliderDashArray.push(val1, val2);
      this.oldGapLength = this.gapLength;
      this.oldDashLength = this.dashLength;
      this.gapLength += step;
      this.dashLength += step;
      if (opt.dashArray) {
        // console.debug(
        //   "Updating styleoption dash array + step",
        //   this.gapLength,
        //   this.gapLength + this.dashLength
        // );
        Vue.set(opt, "dashArray", [this.dashLength, this.gapLength]); // trigger the update
      }
    }
  }

  decrementDashPattern(opt: StyleOptions, angleMarker: boolean): void {
    // decreases the length of the dash and the gap by a step
    /** gapLength = sliderArray[0] */
    /** dashLength= sliderArray[1] - sliderArray[0] */
    const step = angleMarker
      ? SETTINGS.angleMarker.sliderStepSize
      : SETTINGS.style.sliderStepSize;
    const min = 0;

    if (this.gapLength - step >= min && this.dashLength - step >= min) {
      // Vue.set(
      //   this.sliderDashArray,
      //   this.sliderDashArray[0] - 2 * step,
      //   this.sliderDashArray[1] - step
      // );
      this.oldGapLength = this.gapLength;
      this.oldDashLength = this.dashLength;
      this.gapLength -= step;
      this.dashLength -= step;
      if (opt.dashArray) {
        // console.debug(
        //   "Updating styleoption dash array - step",
        //   this.gapLength,
        //   this.gapLength + this.dashLength
        // );
        Vue.set(opt, "dashArray", [this.dashLength, this.gapLength]); // trigger the update
      }
    }
  }

  distinguishConflictingItems(conflictingProps: string[]): void {
    conflictingProps.forEach(conflictPropName => {
      (this.conflictItems as any)[conflictPropName] = true;
    });
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
.checkboxLabel {
  color: blue;
  font-size: 16px;
}
</style>
