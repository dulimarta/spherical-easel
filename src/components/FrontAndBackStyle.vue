<template>
  <div>
    <fade-in-card :showWhen="isBackFace()"
      color="red">
      <v-tooltip bottom
        :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay"
        max-width="400px">
        <template v-slot:activator="{ on }">
          <span v-on="on"
            class="text-subtitle-2">{{ $t("style.backStyleContrast") }}</span>
        </template>
        <span>{{ $t("style.backStyleContrastToolTip") }}</span>
      </v-tooltip>
      <span>({{ $t("style.value") }}:
        {{ this.backStyleContrast }})</span>
      <br />
      <v-tooltip bottom
        :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay"
        max-width="400px">
        <template v-slot:activator="{ on }">
          <v-btn v-on="on"
            @click="clearRecentDynamicBackStyleChanges"
            text
            :disabled="disableBackStyleContrastUndoButton"
            outlined
            ripple
            small>{{ $t("style.clearChanges") }}</v-btn>
        </template>
        <span>{{ $t("style.clearChangesToolTip") }}</span>
      </v-tooltip>

      <v-tooltip bottom
        :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay"
        max-width="400px">
        <template v-slot:activator="{ on }">
          <v-btn v-on="on"
            @click="resetDynamicBackStyleToDefaults"
            text
            small
            outlined
            ripple>
            <span>{{ $t("style.restoreDefaults") }}</span>
          </v-btn>
        </template>
        <span>{{ $t("style.restoreDefaultsToolTip") }}</span>
      </v-tooltip>

      <v-slider v-model.number="backStyleContrast"
        :min="0"
        step="0.1"
        @change="onBackStyleContrastChange"
        :max="1"
        type="range"
        dense>
        <template v-slot:prepend>
          <v-icon @click="decrementBackStyleContrast">mdi-minus</v-icon>
        </template>

        <template v-slot:append>
          <v-icon @click="incrementBackStyleContrast">mdi-plus</v-icon>
        </template>
      </v-slider>
    </fade-in-card>

    <fade-in-card
      :showWhen="isBackFace() && (hasDynamicBackStyle || noObjectsSelected)">
      <span
        class="text-subtitle-2">{{ $t("style.dynamicBackStyle") }}</span>

      <br />
      <span v-show="totallyDisableDynamicBackStyleSelector"
        class="select-an-object-text">{{ $t("style.selectAnObject") }}</span>
      <v-tooltip v-if="!dynamicBackStyleAgreement"
        bottom
        :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay"
        max-width="400px">
        <template v-slot:activator="{ on }">
          <v-btn color="error"
            v-on="on"
            v-show="!totallyDisableDynamicBackStyleSelector"
            text
            small
            outlined
            ripple
            @click="setCommonDynamicBackStyleAgreement">
            {{ $t("style.differingStylesDetected") }}</v-btn>
        </template>
        <span>{{ $t("style.differingStylesDetectedToolTip") }}</span>
      </v-tooltip>

      <v-tooltip v-if="!dynamicBackStyle"
        bottom
        :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay"
        max-width="400px">
        <template v-slot:activator="{ on }">
          <v-btn v-on="on"
            v-show="
              !totallyDisableDynamicBackStyleSelector &&
                dynamicBackStyleAgreement
            "
            text
            color="error"
            outlined
            ripple
            small
            block
            @click="toggleBackStyleOptionsAvailability">
            <span style=""
              class="long-text-button">
              {{ $t("style.enableBackStyleContrastSlider") }}</span>
          </v-btn>
        </template>
        <span>{{ $t("style.enableBackStyleContrastSliderToolTip") }}</span>
      </v-tooltip>

      <v-tooltip v-else
        bottom
        :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay"
        max-width="400px">
        <template v-slot:activator="{ on }">
          <v-btn v-on="on"
            v-show="
              !totallyDisableDynamicBackStyleSelector &&
                dynamicBackStyleAgreement
            "
            color="error"
            text
            outlined
            ripple
            small
            block
            @click="toggleBackStyleOptionsAvailability">
            <span style=""
              class="long-text-button">
              {{ $t("style.disableBackStyleContrastSlider") }}</span>
          </v-btn>
        </template>
        <span>{{ $t("style.disableBackStyleContrastSliderToolTip") }}</span>
      </v-tooltip>

      <!-- <v-tooltip
        bottom
        :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay"
        max-width="400px"
      >
        <template v-slot:activator="{ on }">
          <v-btn
            v-on="on"
            v-show="
              dynamicBackStyleAgreement &&
                !totallyDisableDynamicBackStyleSelector &&
                dynamicBackStyle
            "
            @click="clearRecentDynamicBackStyleChanges"
            text
            outlined
            ripple
            small
          >{{ $t("style.clearChanges") }}</v-btn>
        </template>
        <span>{{ $t("style.clearChangesToolTip") }}</span>
      </v-tooltip>-->

      <!-- <v-tooltip
        bottom
        :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay"
        max-width="400px"
      >
        <template v-slot:activator="{ on }">
          <v-btn
            v-on="on"
            v-show="
              dynamicBackStyleAgreement &&
                !totallyDisableDynamicBackStyleSelector &&
                dynamicBackStyle
            "
            @click="resetDynamicBackStyleToDefaults"
            text
            small
            outlined
            ripple
          >{{ $t("style.restoreDefaults") }}</v-btn>
        </template>
        <span>{{ $t("style.restoreDefaultsToolTip") }}</span>
      </v-tooltip>-->
    </fade-in-card>

    <fade-in-card :showWhen="
        (!isBackFace() && (hasStrokeColor || noObjectsSelected)) ||
          (isBackFace() && !dynamicBackStyle && hasStrokeColor)
      ">
      <ColorSelector title-key="style.strokeColor"
        side-front-key="style.front"
        side-back-key="style.back"
        style-name="strokeColor"
        :data.sync="hslaStrokeColorObject"
        :temp-style-states="tempStyleStates"
        :side="side"></ColorSelector>
    </fade-in-card>

    <fade-in-card :showWhen="
        (!isBackFace() && (hasFillColor || noObjectsSelected)) ||
          (isBackFace() && !dynamicBackStyle && hasFillColor)
      ">
      <ColorSelector title-key="style.fillColor"
        side-front-key="style.front"
        side-back-key="style.back"
        style-name="fillColor"
        :data.sync="hslaFillColorObject"
        :temp-style-states="tempStyleStates"
        :side="side"></ColorSelector>
    </fade-in-card>

    <fade-in-card :showWhen="
        (!isBackFace() && (hasStrokeWidthPercent || noObjectsSelected)) ||
          (isBackFace() && !dynamicBackStyle && hasStrokeWidthPercent)
      ">
      <NumberSelector id="strokeWidthPercentSlider"
        v-bind:data.sync="strokeWidthPercent"
        style-name="strokeWidthPercent"
        title-key="style.strokeWidthPercent"
        side-front-key="style.front"
        side-back-key="style.back"
        v-bind:min-value="minStrokeWidthPercent"
        v-bind:max-value="maxStrokeWidthPercent"
        v-bind:step="10"
        :temp-style-states="tempStyleStates"
        :side="side">
        <template v-slot:title>
          <!--span v-show="
          !totallyDisableStrokeWidthPercentSelector &&
            strokeWidthPercentAgreement
        ">
            (Percent of Default: {{ strokeWidthPercent }}%)
          </span-->
        </template>
      </NumberSelector>
    </fade-in-card>

    <fade-in-card :showWhen="
        (!isBackFace() && (hasPointRadiusPercent || noObjectsSelected)) ||
          (isBackFace() && !dynamicBackStyle && hasPointRadiusPercent)
      ">
      <NumberSelector :data.sync="pointRadiusPercent"
        title-key="style.pointRadiusPercent"
        side-front-key="style.front"
        side-back-key="style.back"
        style-name="pointRadiusPercent"
        :min-value="minPointRadiusPercent"
        :max-value="maxPointRadiusPercent"
        :temp-style-states="tempStyleStates"
        :side="side"></NumberSelector>
      <!--span v-show="
          !totallyDisablePointRadiusPercentSelector &&
            pointRadiusPercentAgreement
        ">
        (Percent of Default: {{ pointRadiusPercent }}%)
      </span-->
      <br />
    </fade-in-card>

    <fade-in-card :showWhen="
        (!isBackFace() && (hasOpacity || noObjectsSelected)) ||
          (isBackFace() && !dynamicBackStyle)
      ">
      <NumberSelector title-key="style.opacity"
        side-front-key="style.front"
        side-back-key="style.back"
        :data.sync="opacity"
        style-name="opacity"
        :min-value="0"
        :max-value="1"
        :step="0.1"
        :temp-style-states="tempStyleStates"
        :side="side"></NumberSelector>
    </fade-in-card>

    <!-- Dash array card is displayed for front and back so long as there is a dash array property common to all selected objects-->
    <fade-in-card :showWhen="hasDashPattern || noObjectsSelected">
      <span v-show="side"
        class="text-subtitle-2">{{ $t("style.front") }} </span>
      <span v-show="!side"
        class="text-subtitle-2">{{ $t("style.back") }} </span>
      <span class="text-subtitle-2">{{ $t("style.dashPattern") }}</span>
      <span v-show="
          !emptyDashPattern &&
            !totallyDisableDashPatternSelector &&
            dashPatternAgreement
        ">
        ({{$t("style.gapDashPattern")}}: {{ gapLength.toFixed(1) }}/{{
        dashLength.toFixed(1)
        }})
      </span>
      <br />
      <span v-show="totallyDisableDashPatternSelector"
        class="select-an-object-text">{{ $t("style.selectAnObject") }}</span>
      <v-tooltip v-if="!dashPatternAgreement"
        bottom
        :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay"
        max-width="400px">
        <template v-slot:activator="{ on }">
          <v-btn color="error"
            v-on="on"
            v-show="!totallyDisableDashPatternSelector"
            text
            small
            outlined
            ripple
            @click="setCommonDashPatternAgreement">
            {{ $t("style.differingStylesDetected") }}</v-btn>
        </template>
        <span>{{ $t("style.differingStylesDetectedToolTip") }}</span>
      </v-tooltip>

      <v-tooltip v-if="emptyDashPattern"
        bottom
        :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay"
        max-width="400px">
        <template v-slot:activator="{ on }">
          <v-btn v-on="on"
            v-show="!totallyDisableDashPatternSelector && dashPatternAgreement"
            text
            color="error"
            outlined
            ripple
            small
            @click="toggleDashPatternSliderAvailibity">
            {{ $t("style.enableDashPatternSlider") }}</v-btn>
        </template>
        <span>{{ $t("style.enableDashPatternSliderToolTip") }}</span>
      </v-tooltip>

      <v-tooltip v-else
        bottom
        :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay"
        max-width="400px">
        <template v-slot:activator="{ on }">
          <v-btn v-on="on"
            v-show="!totallyDisableDashPatternSelector && dashPatternAgreement"
            text
            outlined
            ripple
            small
            @click="toggleDashPatternSliderAvailibity">
            {{ $t("style.disableDashPatternSlider") }}</v-btn>
        </template>
        <span>{{ $t("style.disableDashPatternSliderToolTip") }}</span>
      </v-tooltip>

      <v-tooltip bottom
        :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay"
        max-width="400px">
        <template v-slot:activator="{ on }">
          <v-btn v-on="on"
            v-show="
              dashPatternAgreement &&
                !totallyDisableDashPatternSelector &&
                !emptyDashPattern
            "
            :disabled="disableDashPatternUndoButton"
            @click="clearRecentDashPatternChanges"
            text
            outlined
            ripple
            small>{{ $t("style.clearChanges") }}</v-btn>
        </template>
        <span>{{ $t("style.clearChangesToolTip") }}</span>
      </v-tooltip>

      <v-tooltip bottom
        :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay"
        max-width="400px">
        <template v-slot:activator="{ on }">
          <v-btn v-on="on"
            v-show="dashPatternAgreement &&
                !totallyDisableDashPatternSelector &&
                !emptyDashPattern
            "
            @click="resetDashPatternToDefaults"
            text
            small
            outlined
            ripple>{{ $t("style.restoreDefaults") }}</v-btn>
        </template>
        <span>{{ $t("style.restoreDefaultsToolTip") }}</span>
      </v-tooltip>

      <v-range-slider v-model="sliderDashArray"
        :min="0"
        step="1"
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
    </fade-in-card>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Watch, Prop } from "vue-property-decorator";
import { SENodule } from "../models/SENodule";
import Nodule from "../plottables/Nodule";
import { State } from "vuex-class";
import { Styles, StyleOptions } from "../types/Styles";
import SETTINGS from "@/global-settings";
import FadeInCard from "@/components/FadeInCard.vue";
import { hslaColorType } from "@/types";
import { StyleNoduleCommand } from "@/commands/StyleNoduleCommand";
import EventBus from "@/eventHandlers/EventBus";
import NumberSelector from "@/components/NumberSelector.vue";
import ColorSelector from "@/components/ColorSelector.vue";
// import { getModule } from "vuex-module-decorators";
// import UI from "@/store/ui-styles";

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

@Component({ components: { FadeInCard, NumberSelector, ColorSelector } })
export default class FrontAndBackStyle extends Vue {
  @Prop()
  readonly side!: boolean;

  @State('selections')
  readonly selections!: SENodule[];

  // The old selection to help with undo/redo commands
  private oldSelection: SENodule[] = [];

  readonly store = this.$store.direct;

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
   * There are 7 style options. In the case that there
   * are more than one object selected, the XXXAgreement boolean indicates if the XXX property is *initially* the
   * same across the selected objects. In the case that they are not initially the same, the cooresponding adjustment tool
   * is display in a different way than the usual default.
   */
  private strokeWidthPercent: number | undefined = 100;
  private maxStrokeWidthPercent = SETTINGS.style.maxStrokeWidthPercent;
  private minStrokeWidthPercent = SETTINGS.style.minStrokeWidthPercent;

  private pointRadiusPercent: number | undefined = 100;
  private maxPointRadiusPercent = SETTINGS.style.maxPointRadiusPercent;
  private minPointRadiusPercent = SETTINGS.style.minPointRadiusPercent;

  private hslaStrokeColorObject: hslaColorType = { h: 0, s: 1, l: 1, a: 0 }; // Color for Vuetify Color picker

  private hslaFillColorObject: hslaColorType = { h: 0, s: 1, l: 1, a: 0 }; // Color for Vuetify Color picker

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

  private opacity: number | undefined = 1;

  private dynamicBackStyle: boolean | undefined = true;
  private dynamicBackStyleAgreement = true;
  private totallyDisableDynamicBackStyleSelector = false;
  private backStyleContrast = Nodule.getBackStyleContrast();

  private disableDashPatternUndoButton = false;
  private disableBackStyleContrastUndoButton = false;

  /**
 * Common style properties are the enum with values of 
  //   strokeWidthPercent,
  //   strokeColor,
  //   fillColor,
  //   dashArray,
  //   opacity,
  //   dynamicBackStyle,
  //   pointRadiusPercent
 */
  commonStyleProperties: number[] = [];

  constructor() {
    super();
  }

  /** mounted() is part of VueJS lifecycle hooks */
  mounted (): void {
    //If there are no initial style state, then onSelection with non-empty selections has not been
    // executed, so if there are already objects selected set the style panel to edit them 
    // (OK to pass empty string because that will set the defaults)
    //  initialStyleStates is *only* set in the FrontAndBackStyle.vue onSelectionChangedn method
    //  initialStyleStates is *only* cleared after a save command. 
    // if (this.initialStyleStates.length === 0) {
    this.onSelectionChanged(this.$store.getters.selectedSENodules());
    // }
    EventBus.listen("save-style-state", this.saveStyleState);
  }

  isBackFace (): boolean {
    return this.side === false;
  }

  // These methods are linked to the dashPattern fade-in-card
  onDashPatternChange (): void {
    this.disableDashPatternUndoButton = false;
    this.gapLength = this.sliderDashArray[0];
    this.dashLength = this.sliderDashArray[1] - this.sliderDashArray[0];
    this.$store.direct.commit.changeStyle({
      selected: this.$store.getters.selectedSENodules(),
      payload: {
        front: this.side,
        dashArray: [this.dashLength, this.gapLength] //correct order!!!!
      }
    }
    );
  }
  setCommonDashPatternAgreement (): void {
    this.dashPatternAgreement = true;
  }
  clearRecentDashPatternChanges (): void {
    this.disableDashPatternUndoButton = true;
    const selected = this.$store.getters.selectedSENodules();
    const initialStyleStates = this.$store.getters.getInitialStyleState(this.side);
    for (let i = 0; i < selected.length; i++) {
      // Check see if the initialStylesStates[i] exist and has length >0
      if (
        initialStyleStates[i].dashArray &&
        (initialStyleStates[i].dashArray as number[]).length > 0
      ) {

        this.$store.direct.commit.changeStyle({
          selected: [selected[i]],
          payload: {
            front: this.side,
            dashArray: [
              (initialStyleStates[i].dashArray as number[])[0],
              (initialStyleStates[i].dashArray as number[])[1]
            ]
          }
        });
      } else if (initialStyleStates[i].dashArray) {
        // The selected [i] exists and the array is empty
        this.$store.direct.commit.changeStyle({
          selected: [selected[i]],
          payload: {
            front: this.side,
            dashArray: []
          }
        });
      }
    }
    this.setDashPatternSelectorState(initialStyleStates);
  }
  resetDashPatternToDefaults (): void {
    const selected = this.$store.getters.selectedSENodules();
    const defaultStyleStates = this.$store.getters.getDefaultStyleState(this.side);
    for (let i = 0; i < selected.length; i++) {
      // Check see if the selected[i] exist and has length >0
      if (
        defaultStyleStates[i].dashArray &&
        (defaultStyleStates[i].dashArray as number[]).length > 0
      ) {

        this.$store.direct.commit.changeStyle({
          selected: [selected[i]],
          payload: {
            front: this.side,
            dashArray: [
              (defaultStyleStates[i].dashArray as number[])[0],
              (defaultStyleStates[i].dashArray as number[])[1]
            ]
          }
        });
      } else if (defaultStyleStates[i].dashArray) {
        // The selected [i] exists and the array is empty
        this.$store.direct.commit.changeStyle({
          selected: [selected[i]],
          payload: {
            front: this.side,
            dashArray: []
          }
        });
      }
    }
    this.setDashPatternSelectorState(defaultStyleStates);
  }

  toggleDashPatternSliderAvailibity (): void {
    if (this.emptyDashPattern) {
      this.sliderDashArray.clear();
      this.sliderDashArray.push(this.gapLength as number);
      this.sliderDashArray.push(
        (this.dashLength as number) + (this.gapLength as number)
      );

      this.$store.direct.commit.changeStyle({
        selected: this.$store.getters.selectedSENodules(),
        payload: {
          front: this.side,
          dashArray: [this.dashLength, this.gapLength]
        }
      });

    } else {
      this.$store.direct.commit.changeStyle({
        selected: this.$store.getters.selectedSENodules(),
        payload: {
          front: this.side,
          dashArray: []
        }
      });
      this.sliderDashArray.clear();
      this.sliderDashArray.push(5);
      this.sliderDashArray.push(15);
    }
    this.emptyDashPattern = !this.emptyDashPattern;
  }

  incrementDashPattern (): void {

    // increasing the value of the sliderDashArray[1] increases the length of the dash
    if (
      this.sliderDashArray[1] + 1 <=
      SETTINGS.style.maxGapLengthPlusDashLength
    ) {
      this.disableDashPatternUndoButton = false;
      Vue.set(this.sliderDashArray, 1, this.sliderDashArray[1] + 1); // trigger the update
      this.gapLength = this.sliderDashArray[0];
      this.dashLength = this.sliderDashArray[1] - this.sliderDashArray[0];

      this.$store.direct.commit.changeStyle({
        selected: this.$store.getters.selectedSENodules(),
        payload: {
          front: this.side,
          dashArray: [this.dashLength, this.gapLength]
        }
      });
    }
  }

  decrementDashPattern (): void {
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

      this.$store.direct.commit.changeStyle({
        selected: this.$store.getters.selectedSENodules(),
        payload: {
          front: this.side,
          dashArray: [this.dashLength, this.gapLength]
        }
      });
    }
    /** TODO:
     * The actual dots on the slider are not moveing when I click the plus (-) sign and trigger this decrementDashPattern method
     * How do I trigger an event that will cause the actual dots on the slider to move?
     */
  }

  setDashPatternSelectorState (styleState: StyleOptions[]): void {
    this.disableDashPatternUndoButton = true;
    // reset to the default which are overwritten as necessary
    this.emptyDashPattern = true;
    this.dashPatternAgreement = true;
    this.gapLength = 5;
    this.dashLength = 10;
    this.totallyDisableDashPatternSelector = false;
    if (styleState[0].dashArray) {
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
              return styleObject.dashArray.length == 0;
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

  disableDashPatternSelector (totally: boolean): void {
    this.dashPatternAgreement = false;
    this.disableDashPatternUndoButton = true;
    // Set the gap and dash to the default
    this.gapLength = 5;
    this.dashLength = 10;
    this.totallyDisableDashPatternSelector = totally;
  }

  // These methods are linked to the dynamicBackStyle fade-in-card
  onBackStyleContrastChange (): void {
    this.disableBackStyleContrastUndoButton = false;
    this.$store.direct.commit.changeStyle({
      selected: this.$store.getters.selectedSENodules(),
      payload: {
        front: this.side,
        backStyleContrast: this.backStyleContrast
      }
    });
  }
  setCommonDynamicBackStyleAgreement (): void {
    this.dynamicBackStyleAgreement = true;
  }
  clearRecentDynamicBackStyleChanges (): void {
    this.disableBackStyleContrastUndoButton = true;
    const selected = this.$store.getters.selectedSENodules();
    const initialStyleStates = this.$store.getters.getInitialStyleState(this.side);
    const initialBackStyleContrast = this.$store.getters.getInitialBackStyleContrast();
    for (let i = 0; i < selected.length; i++) {
      this.$store.direct.commit.changeStyle({
        selected: [selected[i]],
        payload: {
          front: this.side,
          backStyleContrast: initialBackStyleContrast
        }
      });
    }
    this.backStyleContrast = initialBackStyleContrast;
    this.setDynamicBackStyleSelectorState(initialStyleStates);
  }
  resetDynamicBackStyleToDefaults (): void {
    const selected = this.$store.getters.selectedSENodules();
    const defaultStyleStates = this.$store.getters.getDefaultStyleState(this.side);
    for (let i = 0; i < selected.length; i++) {
      this.$store.direct.commit.changeStyle({
        selected: [selected[i]],
        payload: {
          front: this.side,
          backStyleContrast: SETTINGS.style.backStyleContrast
        }
      });
    }
    this.backStyleContrast = SETTINGS.style.backStyleContrast;
    this.setDynamicBackStyleSelectorState(defaultStyleStates);
  }
  toggleBackStyleOptionsAvailability (): void {
    this.dynamicBackStyle = !this.dynamicBackStyle;

    this.$store.direct.commit.changeStyle({
      selected: this.$store.getters.selectedSENodules(),
      payload: {
        front: this.side,
        dynamicBackStyle: this.dynamicBackStyle
      }
    });

    if (!this.dynamicBackStyle) {
      console.log("attempt set");
      const selectedSENodules = this.$store.getters.selectedSENodules() as SENodule[];
      this.tempStyleStates.clear();
      selectedSENodules.forEach(seNodule => {
        if (seNodule.ref)
          this.tempStyleStates.push(seNodule.ref.currentStyleState(this.side));
      });
      this.setDashPatternSelectorState(this.tempStyleStates);

      // tempStyleStates is watch by NumberSelector and ColorSelector and calls each of there setColorSelector and setSelector
      // this.setFillColorSelectorState(tempStyleState);
      // this.setStrokeColorSelectorState(tempStyleState);
      // this.setOpacitySelectorState(tempStyleState);
      // this.setStrokeWidthPercentSelectorState(tempStyleState);
    }
  }

  incrementBackStyleContrast (): void {
    if (
      this.dynamicBackStyle != undefined &&
      this.backStyleContrast + 0.1 <= 1
    ) {
      this.disableBackStyleContrastUndoButton = false;
      this.backStyleContrast += 0.1;
      this.$store.direct.commit.changeStyle({
        selected: this.$store.getters.selectedSENodules(),
        payload: {
          front: this.side,
          backStyleContrast: this.backStyleContrast
        }
      });
    }
  }
  decrementBackStyleContrast (): void {
    if (
      this.dynamicBackStyle != undefined &&
      this.backStyleContrast - 0.1 >= 0
    ) {
      this.disableBackStyleContrastUndoButton = false;
      this.backStyleContrast -= 0.1;
      this.$store.direct.commit.changeStyle({
        selected: this.$store.getters.selectedSENodules(),
        payload: {
          front: this.side,
          backStyleContrast: this.backStyleContrast
        }
      });
    }
  }

  setDynamicBackStyleSelectorState (styleState: StyleOptions[]): void {
    this.dynamicBackStyleAgreement = true;
    this.totallyDisableDynamicBackStyleSelector = false;
    this.dynamicBackStyle = styleState[0].dynamicBackStyle;
    // screen for undefined - if undefined then this is not a property that is going to be set by the style panel for this selection of objects
    if (this.dynamicBackStyle != undefined) {
      if (
        !styleState.every(
          styleObject => styleObject.dynamicBackStyle == this.dynamicBackStyle
        )
      ) {
        // The dynamic backstyle property exists on the selected objects but the dynamicBackStyle doesn't agree (so don't totally disable the selector)
        this.disableDynamicBackStyleSelector(false);
      }
    } else {
      // The dynamicBackStyle property doesn't exists on the selected objects so totally disable the selector
      this.disableDynamicBackStyleSelector(true);
    }
  }

  disableDynamicBackStyleSelector (totally: boolean): void {
    this.dynamicBackStyleAgreement = false;
    this.dynamicBackStyle = true;
    this.totallyDisableDynamicBackStyleSelector = totally;
  }

  /**
   * Determines if the commonStyleProperties has the given input of type Styles
   * The input is an enum of type Styles
   */
  hasStyle (s: Styles): boolean {
    const sNum = Number(s);
    return (
      this.commonStyleProperties.length > 0 &&
      this.commonStyleProperties.findIndex(x => x === sNum) >= 0
    );
  }

  /**
   * Used to determine which objects the color picker should control (i.e. the check boxes under the color picker)
   */
  get colorKeys (): any[] {
    return this.commonStyleProperties
      .map((id: number) => ({
        // Convert camelCase to title format
        // i.e. "justASimpleText" becomes "Just A Simple Text"
        label: keys[id]
          .replace(
            /([a-z])([A-Z])/g, // global regex
            (_, lowLetter, upLetter) => `${lowLetter} ${upLetter}`
          )
          .replace(/^([a-z])/, (_, firstLetter: string) =>
            firstLetter.toUpperCase()
          ),
        value: keys[id]
      }))
      .filter((e: any) => {
        const { label, _ } = e;
        return label.toLowerCase().indexOf("color") >= 0; // Select entry with "Color" in its label
      });
  }

  /**
   * Used to determine if the color picker Vue component (i.e. fade-in-card) should be displayed
   */
  get hasStrokeColor (): boolean {
    return this.hasStyle(Styles.strokeColor);
  }

  /**
   * Used to determine if the color picker Vue component (i.e. fade-in-card) should be displayed
   */
  get hasFillColor (): boolean {
    return this.hasStyle(Styles.fillColor);
  }
  /**
   * Used to determine if the stroke width slider (i.e. fade-in-card containing the slider) should be displayed
   */
  get hasStrokeWidthPercent (): boolean {
    return this.hasStyle(Styles.strokeWidthPercent);
  }

  get hasPointRadiusPercent (): boolean {
    return this.hasStyle(Styles.pointRadiusPercent);
  }

  get hasOpacity (): boolean {
    return this.hasStyle(Styles.opacity);
  }
  /**
   * Used to determine if the dash gap and dash length  (i.e. fade-in-card containing the sliders) should be displayed
   */
  get hasDashPattern (): boolean {
    return this.hasStyle(Styles.dashArray);
  }
  get hasDynamicBackStyle (): boolean {
    return this.hasStyle(Styles.dynamicBackStyle);
  }

  /**
   * This is an example of the two-way binding that is provided by the Vuex store. As this is a Vue component we can Watch variables, and
   * when they change, this method wil execute in response to that change.
   */
  @Watch("selections")
  onSelectionChanged (newSelection: SENodule[]): void {
    // Before changing the selections save the state for an undo/redo command (if necessary)
    this.saveStyleState();

    this.commonStyleProperties.clear();
    if (newSelection.length === 0) {
      //totally disable the selectors
      this.disableDashPatternSelector(true);
      this.disableDynamicBackStyleSelector(true);
      this.noObjectsSelected = true;
      this.oldSelection.clear();
      return;
    }

    // record the new selections in the old
    this.oldSelection.clear();
    newSelection.forEach(obj => this.oldSelection.push(obj));

    this.noObjectsSelected = false;
    // Create a list of the common properties that the objects in the selection have.
    // commonStyleProperties is a number (corresponding to an enum) array
    // The customStyles method returns a list of the styles the are adjustable for that object
    for (let k = 0; k < values.length; k++) {
      if (newSelection.every(s => s.customStyles().has(k)))
        this.commonStyleProperties.push(k);
    }

    // Get the initial and default style state of the object for undo/redo and buttons to revert to initial style. 
    // Put this in the store so that it is availble to *all* panels. Get the front and back information at the same time.
    console.log("set initial style");
    //#region setStyle
    this.$store.direct.commit.setStyleState(
      {
        selected: newSelection,
        backContrast: Nodule.getBackStyleContrast()
      });
    //#endregion
    //Set the initial state of the fade-in-card/selectors (checking to see if the property is the same across all selected objects)
    this.setDashPatternSelectorState(this.$store.getters.getInitialStyleState(this.side));
    this.setDynamicBackStyleSelectorState(this.$store.getters.getInitialStyleState(this.side));
  }

  areEquivalentStyles (
    styleStates1: StyleOptions[],
    styleStates2: StyleOptions[]
  ): boolean {
    if (styleStates1.length !== styleStates2.length) {
      return false;
    }
    for (let i = 0; i < styleStates1.length; i++) {
      const a = styleStates1[i];
      const b = styleStates2[i];
      if (
        a.strokeWidthPercent == b.strokeWidthPercent &&
        a.strokeColor == b.strokeColor &&
        a.fillColor == b.fillColor &&
        a.opacity == b.opacity &&
        a.dynamicBackStyle == b.dynamicBackStyle &&
        a.pointRadiusPercent == b.pointRadiusPercent
      ) {
        //noe check the dash array which can be undefined, an empty array,length one array or a length two array.
        if (a.dashArray == undefined && b.dashArray == undefined) {
          break; // stop checking this pair in the array because we can conclude they are equal.
        }
        if (a.dashArray != undefined && b.dashArray != undefined) {
          if (a.dashArray.length == b.dashArray.length) {
            if (a.dashArray.length == 0 && b.dashArray.length == 0) {
              break; // stop checking this pair in the array because we can conclude they are equal.
            } else if (
              a.dashArray.length == 1 &&
              b.dashArray.length == 1 &&
              a.dashArray[0] == b.dashArray[0]
            ) {
              break; // stop checking this pair in the array because we can conclude they are equal.
            } else if (
              a.dashArray.length == 2 &&
              b.dashArray.length == 2 &&
              a.dashArray[0] == b.dashArray[0] &&
              a.dashArray[1] == b.dashArray[1]
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

  saveStyleState (): void {
    console.log("Tried to save style state");
    if (this.oldSelection.length > 0) {
      // Check to see if there have been any difference between the current and initial
      //Record the current state of each Nodule
      this.currentStyleStates.clear();
      this.oldSelection.forEach(seNodule => {
        if (seNodule.ref)
          this.currentStyleStates.push(seNodule.ref.currentStyleState(this.side));
      });
      const initialStyleStates = this.$store.getters.getInitialStyleState(this.side);
      const initialBackStyleContrast = this.$store.getters.getInitialBackStyleContrast();
      if (
        !this.areEquivalentStyles(
          this.currentStyleStates,
          initialStyleStates
        ) ||
        initialBackStyleContrast != Nodule.getBackStyleContrast()
      ) {
        console.log("Issued new style save command");
        new StyleNoduleCommand(
          this.oldSelection,
          this.side,
          this.currentStyleStates,
          initialStyleStates,
          Nodule.getBackStyleContrast(),
          initialBackStyleContrast
        ).push();
      }
      // clear the old selection so that this save style state will not be executed again until changes are made.
      this.oldSelection.clear();
    }
  }
}
</script>
<style lang="scss" scoped>
@import "@/scss/variables.scss";

.select-an-object-text {
  color: rgb(255, 82, 82);
}
.long-text-button {
  max-width: 250px;
  word-wrap: break-word;
  max-height: 200px;
  white-space: normal;
}
</style>
