<template>
  <div>
    <StyleEditor :panel="panel"
      :nodule-filter-function="objectFilter"
      :nodule-map-function="objectMapper"
      :automatic-back-style="usingAutomaticBackStyle">
      <div
        slot-scope="{forceDataAgreement, hasStyle, styleOptions, conflictingProps, enableBackStyleEdit/*, automaticBackStyleCommonValue*/}">
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
        <InputGroup input-selector="backStyleContrast"
          v-if="editModeIsBack">
          <!-- Enable the Dynamic Back Style Overlay -->
          <OverlayWithFixButton v-if="!usingAutomaticBackStyle"
            z-index="5"
            i18n-title-line="style.dynamicBackStyleHeader"
            i18n-button-label="style.enableDynamicBackStyle"
            i18n-button-tool-tip="style.disableDynamicBackStyleToolTip"
            @click="toggleBackStyleOptionsAvailability">
            Enable auto back styling?
          </OverlayWithFixButton>
          <!-- Blobal contrast slider -->
          <span
            class="text-subtitle-2">{{ $t('style.backStyleContrast') }}</span>
          <span>
            {{" ("+ Math.floor(styleOptions.backStyleContrast*100)+"%)" }}
          </span>
          <v-tooltip bottom
            :open-delay="toolTipOpenDelay"
            :close-delay="toolTipCloseDelay"
            max-width="400px">
            <template v-slot:activator="{ on }">
              <v-slider v-model.number="styleOptions.backStyleContrast"
                :min="0"
                v-on="on"
                step="0.1"
                :max="1"
                type="range"
                :disabled="!usingAutomaticBackStyle"
                dense>
                <template v-slot:prepend>
                  <v-icon @click="styleOptions.backStyleContrast -= 0.1">
                    mdi-minus
                  </v-icon>
                </template>
                <template v-slot:thumb-label="{ value }">
                  {{ backStyleContrastSelectorThumbStrings[Math.floor(value*10)] }}
                </template>
                <template v-slot:append>
                  <v-icon @click="styleOptions.backStyleContrast += 0.1">
                    mdi-plus
                  </v-icon>
                </template>
              </v-slider>
            </template>
            <span>{{ $t("style.backStyleContrastToolTip") }}</span>
          </v-tooltip>
        </InputGroup>
        <v-card>

          <OverlayWithFixButton v-if="conflictingProps.length > 0"
            z-index="1"
            i18n-title-line="style.styleDisagreement"
            i18n-button-label="style.enableCommonStyle"
            i18n-button-tool-tip="style.differentValuesToolTip"
            :i18n-list-items="conflictingProps"
            @click="forceDataAgreement">
          </OverlayWithFixButton>
          <!-- Disable the Dynamic Back Style Overlay -->
          <OverlayWithFixButton
            v-if="editModeIsBack && !enableBackStyleEdit"
            z-index="50"
            i18n-title-line="style.dynamicBackStyleHeader"
            i18n-subtitle-line="To allow style customization, automatic back styling must be disabled"
            i18n-button-label="style.disableDynamicBackStyle"
            i18n-button-tool-tip="style.disableDynamicBackStyleToolTip"
            @click="toggleBackStyleOptionsAvailability">
            Disable auto back styling?
          </OverlayWithFixButton>
          <InputGroup
            input-selector="strokeColor,strokePercentWidth,fillColor"
            v-if="hasStyle(/strokeColor|strokeWidthPercent|fillColor/)">
            <!-- Front/Back Stroke Color Selector-->
            <SimpleColorSelector titleKey="style.strokeColor"
              v-if="hasStyle(/strokeColor/)"
              style-name="strokeColor"
              :data.sync="styleOptions.strokeColor" />

            <SimpleNumberSelector v-if="hasStyle(/strokeWidthPercent/)"
              v-bind:data.sync="styleOptions.strokeWidthPercent"
              title-key="style.strokeWidthPercent"
              v-bind:min-value="minStrokeWidthPercent"
              v-bind:max-value="maxStrokeWidthPercent"
              v-bind:step="20"
              :thumb-string-values="strokeWidthScaleSelectorThumbStrings" />
            <SimpleColorSelector title-key="style.fillColor"
              v-if="hasStyle(/fillColor/)"
              style-name="fillColor"
              :data.sync="styleOptions.fillColor" />
          </InputGroup>
        </v-card>
        <div v-show="showMoreLabelStyles">
          <InputGroup input-selector="pointRadiusPercent"
            v-if="hasStyle(/pointRadiusPercent/)">
            <!--- Front/Back Point Radius Number Selector -->

            <SimpleNumberSelector
              :data.sync="styleOptions.pointRadiusPercent"
              title-key="style.pointRadiusPercent"
              :min-value="minPointRadiusPercent"
              :max-value="maxPointRadiusPercent"
              :step="20"
              :thumb-string-values="pointRadiusSelectorThumbStrings">
            </SimpleNumberSelector>
          </InputGroup>
          <InputGroup
            input-selector="angleMarkerRadiusPercent,angleMarkerTickMark,angleMarkerDoubleArc"
            v-if="editModeIsFront && hasStyle(/angleMarker/)">
            Angle marker group here
            <SimpleNumberSelector
              :data.sync="styleOptions.angleMarkerRadiusPercent"
              title-key="style.angleMarkerRadiusPercent"
              :min-value="minAngleMarkerRadiusPercent"
              :max-value="maxAngleMarkerRadiusPercent"
              :step="20"
              :thumb-string-values="angleMarkerRadiusSelectorThumbStrings">
            </SimpleNumberSelector>
            <!-- Angle Marker Decoration Selector -->
            <v-row justify="space-around">
              <v-col>
                <v-switch v-model="styleOptions.angleMarkerTickMark"
                  :label="$t('style.angleMarkerTickMark')"></v-switch>
              </v-col>
              <v-col>
                <v-switch v-model="styleOptions.angleMarkerDoubleArc"
                  :label="$t('style.angleMarkerDoubleArc')"></v-switch>
              </v-col>
            </v-row>
          </InputGroup>
          <InputGroup input-selector="dashArray">
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
              {{ activeDashPattern(styleOptions) }}
            </span>
            <!-- The dash property slider -->
            <v-range-slider v-model="styleOptions.dashArray"
              :min="0"
              step="2"
              :disabled="emptyDashPattern"
              :max="maxGapLengthPlusDashLength"
              type="range"
              dense>
              <template v-slot:prepend>
                <v-icon @click="decrementDashPattern(styleOptions)">
                  mdi-minus
                </v-icon>
              </template>

              <template v-slot:append>
                <v-icon @click="incrementDashPattern(styleOptions)">
                  mdi-plus</v-icon>
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
                          @change="toggleDashPatternSliderAvailibity(styleOptions)"
                          hide-details
                          x-small
                          dense></v-checkbox>
                      </span>
                    </template>
                    {{$t('style.dashPatternCheckBoxToolTip')}}
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
const SE = namespace("se");

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

  @SE.State((s: AppState) => s.initialBackStyleContrast)
  readonly initialBackStyleContrast!: number;

  @SE.State((s: AppState) => s.oldStyleSelections)
  readonly oldStyleSelection!: SENodule[];

  @SE.State((s: AppState) => s.styleSavedFromPanel)
  readonly styleSavedFromPanel!: StyleEditPanels;

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

  private maxAngleMarkerRadiusPercent =
    SETTINGS.style.maxAngleMarkerRadiusPercent;
  private minAngleMarkerRadiusPercent =
    SETTINGS.style.minAngleMarkerRadiusPercent;

  private angleMarkerRadiusSelectorThumbStrings: Array<string> = [];

  // create a circle, open the style panel, select the circle when the basic panel is open, switch to the foreground panel, the selected circle has a displayed opacity of 0 --
  // that is the blinking is between nothing and a red circle glowing circle) The color picker display is correct though... strange!

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

  // usingAutomaticBackStyle = false means that the user is setting the color for the back on their own and is
  // *not* using the contrast (i.e. not using the dynamic back styling)
  // usingAutomaticBackStyle = true means the program is setting the style of the back objects
  private usingAutomaticBackStyle = true;

  // dbAgreement and udbCommonValue are computed by the program
  // useDB is set by user
  // private backStyleContrast = Nodule.getBackStyleContrast();
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
    this.usingAutomaticBackStyle = this.panel === StyleEditPanels.Back;
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
  activeDashPattern(opt: StyleOptions): string {
    if (opt.dashArray) {
      const dashLength = opt.dashArray[0];
      const gapLength = opt.dashArray[1];
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

  toggleDashPatternSliderAvailibity(opt: StyleOptions): void {
    this.sliderDashArray.splice(0);
    if (!this.emptyDashPattern) {
      this.sliderDashArray.push(this.gapLength as number);
      this.sliderDashArray.push(
        (this.dashLength as number) + (this.gapLength as number)
      );

      if (opt.dashArray) opt.dashArray = [this.dashLength, this.gapLength];
    } else {
      this.sliderDashArray.push(4);
      this.sliderDashArray.push(16);
      if (opt.dashArray) opt.dashArray = [0, 0];
    }
  }
  incrementDashPattern(opt: StyleOptions): void {
    // increasing the value of the sliderDashArray[1] increases the length of the dash
    if (
      this.sliderDashArray[1] + 1 <=
      SETTINGS.style.maxGapLengthPlusDashLength
    ) {
      Vue.set(this.sliderDashArray, 1, this.sliderDashArray[1] + 1); // trigger the update
      this.gapLength = this.sliderDashArray[0];
      this.dashLength = this.sliderDashArray[1] - this.sliderDashArray[0];
      if (opt.dashArray) {
        console.debug(
          "Updating styleoption dash array +1",
          this.sliderDashArray
        );

        Vue.set(opt, "dashArray", [this.dashLength, this.gapLength]);
      }
    }
  }
  decrementDashPattern(opt: StyleOptions): void {
    // increasing the value of the sliderDashArray[0] decreases the length of the dash
    if (
      this.sliderDashArray[0] + 1 <=
      SETTINGS.style.maxGapLengthPlusDashLength
    ) {
      console.debug("Updating slider dash array -1", this.sliderDashArray);
      Vue.set(this.sliderDashArray, 0, this.sliderDashArray[0] + 1);
      this.gapLength = this.sliderDashArray[0];
      this.dashLength = this.sliderDashArray[1] - this.sliderDashArray[0];
      if (opt.dashArray) {
        console.debug(
          "Updating styleoption dash array -1",
          this.sliderDashArray
        );
        Vue.set(opt, "dashArray", [this.dashLength, this.gapLength]);
      }
    }
    /** TODO:
     * The actual dots on the slider are not moveing when I click the plus (-) sign and trigger this decrementDashPattern method
     * How do I trigger an event that will cause the actual dots on the slider to move?
     */
  }

  toggleBackStyleOptionsAvailability(): void {
    this.usingAutomaticBackStyle = !this.usingAutomaticBackStyle;
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
