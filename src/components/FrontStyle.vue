<template>
  <div>
    <fade-in-card :showWhen="hasStrokeColor || noObjectsSelected">
      <span class="text-subtitle-2">{{$t("style.strokeColor")}}</span>
      <br />
      <span v-show="totallyDisableStrokeColorSelector">{{$t("style.selectAnObject")}}</span>
      <v-tooltip
        v-if="!strokeColorAgreement"
        bottom
        :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay"
      >
        <template v-slot:activator="{ on }">
          <v-btn
            v-on="on"
            v-show="!totallyDisableStrokeColorSelector"
            text
            small
            outlined
            ripple
            @click="setCommonStrokeColor"
          >{{$t("style.differingStylesDetected")}}</v-btn>
        </template>
        <span>{{ $t("style.differingStylesDetectedToolTip") }}</span>
      </v-tooltip>
      <v-tooltip bottom v-else :open-delay="toolTipOpenDelay" :close-delay="toolTipCloseDelay">
        <template v-slot:activator="{ on }">
          <v-btn
            v-on="on"
            v-show="!totallyDisableStrokeColorSelector"
            text
            outlined
            ripple
            small
            @click="setShowStrokeOptions"
          >{{$t("style.showColorPresets")}}</v-btn>
        </template>
        <span>{{ $t("style.showColorPresetsToolTip") }}</span>
      </v-tooltip>

      <v-tooltip bottom :open-delay="toolTipOpenDelay" :close-delay="toolTipCloseDelay">
        <template v-slot:activator="{ on }">
          <v-btn
            v-on="on"
            v-show="strokeColorAgreement && !totallyDisableStrokeColorSelector"
            @click="clearStrokeChanges"
            text
            outlined
            ripple
            small
          >{{$t("style.clearChanges")}}</v-btn>
        </template>
        <span>{{ $t("style.clearChangesToolTip") }}</span>
      </v-tooltip>

      <v-tooltip bottom :open-delay="toolTipOpenDelay" :close-delay="toolTipCloseDelay">
        <template v-slot:activator="{ on }">
          <v-btn
            v-on="on"
            v-show="strokeColorAgreement&& !totallyDisableStrokeColorSelector"
            @click="resetStrokeToDefaults"
            text
            small
            outlined
            ripple
          >{{$t("style.restoreDefaults")}}</v-btn>
        </template>
        <span>{{ $t("style.restoreDefaultsToolTip") }}</span>
      </v-tooltip>

      <v-color-picker
        hide-canvas
        mode="hsla"
        :disabled="!strokeColorAgreement || totallyDisableStrokeColorSelector"
        show-swatches
        :hide-inputs="!strokeColorAgreement || !showStrokeOptions"
        hide-mode-switch
        :swatches-max-height="strokeSwatchHeight"
        v-model="hslaStrokeColorObject"
        id="strokeColorPicker"
        @update:color="onStrokeColorChange"
      ></v-color-picker>
    </fade-in-card>

    <fade-in-card :showWhen="hasFillColor || noObjectsSelected">
      <span class="text-subtitle-2">{{$t("style.fillColor")}}</span>
      <br />
      <span v-show="totallyDisableFillColorSelector">{{$t("style.selectAnObject")}}</span>
      <v-tooltip
        v-if="!fillColorAgreement"
        bottom
        :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay"
      >
        <template v-slot:activator="{ on }">
          <v-btn
            v-on="on"
            v-show="!totallyDisableFillColorSelector"
            text
            small
            outlined
            ripple
            @click="setCommonFillColor"
          >{{$t("style.differingStylesDetected")}}</v-btn>
        </template>
        <span>{{ $t("style.differingStylesDetectedToolTip") }}</span>
      </v-tooltip>
      <v-tooltip bottom v-else :open-delay="toolTipOpenDelay" :close-delay="toolTipCloseDelay">
        <template v-slot:activator="{ on }">
          <v-btn
            v-on="on"
            v-show="!totallyDisableFillColorSelector"
            text
            outlined
            ripple
            small
            @click="setShowFillOptions"
          >{{$t("style.showColorPresets")}}</v-btn>
        </template>
        <span>{{ $t("style.showColorPresetsToolTip") }}</span>
      </v-tooltip>

      <v-tooltip bottom :open-delay="toolTipOpenDelay" :close-delay="toolTipCloseDelay">
        <template v-slot:activator="{ on }">
          <v-btn
            v-on="on"
            v-show="fillColorAgreement && !totallyDisableFillColorSelector"
            @click="clearFillChanges"
            text
            outlined
            ripple
            small
          >{{$t("style.clearChanges")}}</v-btn>
        </template>
        <span>{{ $t("style.clearChangesToolTip") }}</span>
      </v-tooltip>

      <v-tooltip bottom :open-delay="toolTipOpenDelay" :close-delay="toolTipCloseDelay">
        <template v-slot:activator="{ on }">
          <v-btn
            v-on="on"
            v-show="fillColorAgreement&& !totallyDisableFillColorSelector"
            @click="resetFillToDefaults"
            text
            small
            outlined
            ripple
          >{{$t("style.restoreDefaults")}}</v-btn>
        </template>
        <span>{{ $t("style.restoreDefaultsToolTip") }}</span>
      </v-tooltip>

      <v-color-picker
        hide-canvas
        mode="hsla"
        :disabled="!fillColorAgreement || totallyDisableFillColorSelector"
        show-swatches
        :hide-inputs="!fillColorAgreement || !showFillOptions"
        hide-mode-switch
        :swatches-max-height="fillSwatchHeight"
        v-model="hslaFillColorObject"
        id="fillColorPicker"
        @update:color="onFillColorChange"
      ></v-color-picker>
    </fade-in-card>

    <fade-in-card :showWhen="hasStrokeWidth">
      <span>{{$t("style.strokeWidth")}}</span>
      <v-slider
        v-model.number="strokeWidthPercent"
        :min="20"
        thumb-label="always"
        @change="onStrokeWidthPercentChange"
        :max="400"
        type="range"
        class="mt-8"
      >
        <template v-slot:thumb-label="{ value }">{{ value + "%" }}</template>
      </v-slider>
    </fade-in-card>

    <fade-in-card :showWhen="hasPointRadius">
      <span>{{$t("style.pointSize")}}</span>
      <v-slider
        v-model.number="pointRadiusPercent"
        :min="70"
        thumb-label="always"
        @change="onPointRadiusPercentChange"
        :max="500"
        type="range"
        class="mt-8"
      >
        <template v-slot:thumb-label="{ value }">{{ value + "%" }}</template>
      </v-slider>
    </fade-in-card>

    <fade-in-card :showWhen="hasOpacity">
      <span>{{$t("style.opacity")}}</span>
      <v-slider
        v-model.number="opacity"
        :min="0"
        :step="0.1"
        :max="1"
        @change="onOpacityChange"
        type="range"
        class="mt-8"
      >
        <template v-slot:prepend>
          <v-icon @click="decrementOpacity">mdi-minus</v-icon>
        </template>

        <template v-slot:append>
          <v-icon @click="incrementOpacity">mdi-plus</v-icon>
        </template>
      </v-slider>
    </fade-in-card>

    <fade-in-card :showWhen="hasDash">
      <span>{{$t("style.dashPattern")}}({{ dashLength }}/{{ gapLength }})</span>
      <v-slider
        min="5"
        max="15"
        v-model.number="dashLength"
        persistent-hint
        hint="$t('style.dashLength')"
        @change="onDashPatternChange"
      ></v-slider>
      <v-slider
        min="5"
        max="15"
        v-model.number="gapLength"
        hint="$t('style.dashLength')"
        persistent-hint
        @change="onDashPatternChange"
      ></v-slider>
    </fade-in-card>
    <v-snackbar v-model="displayOpacityZeroMessage" bottom center :timeout="1250">
      <span>{{ $t("style.opacityZeroMessage") }}</span>
      <v-btn @click="displayOpacityZeroMessage = false" icon>
        <v-icon color="success">mdi-close</v-icon>
      </v-btn>
    </v-snackbar>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Watch } from "vue-property-decorator";
import { SENodule } from "../models/SENodule";
import { State } from "vuex-class";
import { Styles, StyleOptions } from "../types/Styles";
import SETTINGS from "@/global-settings";
import FadeInCard from "@/components/FadeInCard.vue";
import { UnsignedShortType } from "three";
import { hslaColorType } from "@/types";
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

@Component({ components: { FadeInCard } })
export default class FrontStyle extends Vue {
  @State
  readonly selections!: SENodule[];

  readonly minStrokeWidth: number = SETTINGS.line.drawn.strokeWidth.min;
  readonly maxStrokeWidth: number = SETTINGS.line.drawn.strokeWidth.max;

  /**
   * When the selected objects are first processed by the style panel their style state is recorded here
   * this is so we can undo the styling changes and have a revert to initial state button
   */
  private initialStyleStates: StyleOptions[] = [];
  /**
   * These are the default style state for the selected objects.
   */
  private defaultStyleStates: StyleOptions[] = [];

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
  private strokeWidthAgreement = true;

  private pointRadiusPercent: number | undefined = 100;
  private pointRadiusAgreement = true;

  private strokeColor: string | undefined = "hsl(0,0%,0%,0)"; //Color recognisable by TwoJs
  private hslaStrokeColorObject: hslaColorType = { h: 0, s: 0, l: 0, a: 1 }; // Color for Vuetify Color picker
  private strokeColorAgreement = true;
  private strokeSwatchHeight = 0;
  private showStrokeOptions = false;
  private totallyDisableStrokeColorSelector = false;

  private fillColor: string | undefined = "hsl(0,0%,0%,0)"; //Color recognisable by TwoJs
  private hslaFillColorObject: hslaColorType = { h: 0, s: 0, l: 0, a: 1 }; // Color for Vuetify Color picker
  private fillColorAgreement = true;
  private fillSwatchHeight = 0;
  private showFillOptions = false;
  private totallyDisableFillColorSelector = false;

  private dashLength: number | undefined = 10;
  private gapLength: number | undefined = 5;
  private dashAgreement = true;

  private opacity: number | undefined = 1;
  private opacityAgreement = true;
  private displayOpacityZeroMessage = false;

  private dynamicBackStyle: boolean | undefined = true;
  private dynamicBackStyleAgreement = true;

  /**
 * Common style properties are the enum with values of 
  //   strokeWidthPercentage,
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
  mounted(): void {
    //If there are already objects selected set the style panel to edit them (OK to pass empty string becaue that will set the defaults)
    //if (this.$store.getters.selectedSENodules().length > 0) {
    this.onSelectionChanged(this.$store.getters.selectedSENodules());
    //}
  }

  // Changes the stroke width of the elements in the *selection* array in the store
  // This method is linked to the strokeWidthPercent fade-in-card
  onStrokeWidthPercentChange(): void {
    this.$store.commit("changeStyle", {
      selected: this.$store.getters.selectedSENodules(),
      front: true,
      strokeWidthPercent: this.strokeWidthPercent
    });
  }

  // Changes the stroke color of the elements in the selected objects
  onStrokeColorChange(): void {
    this.$store.commit("changeStyle", {
      selected: this.$store.getters.selectedSENodules(),
      front: true,
      strokeColor: this.convertHSLAObjectToString(this.hslaStrokeColorObject)
    });
  }

  setCommonStrokeColor(): void {
    this.strokeColorAgreement = true;
  }
  setShowStrokeOptions(): void {
    this.showStrokeOptions = !this.showStrokeOptions;
    if (this.showStrokeOptions) {
      this.strokeSwatchHeight = 100;
    } else {
      this.strokeSwatchHeight = 0;
    }
  }
  clearStrokeChanges(): void {
    const selected = this.$store.getters.selectedSENodules();
    for (let i = 0; i < selected.length; i++) {
      this.$store.commit("changeStyle", {
        selected: [selected[i]],
        front: true,
        strokeColor: this.initialStyleStates[i].strokeColor
      });
    }
    this.setStrokeSelectorState(this.initialStyleStates);
  }
  resetStrokeToDefaults(): void {
    const selected = this.$store.getters.selectedSENodules();
    for (let i = 0; i < selected.length; i++) {
      this.$store.commit("changeStyle", {
        selected: [selected[i]],
        front: true,
        strokeColor: this.defaultStyleStates[i].strokeColor
      });
    }
    this.setStrokeSelectorState(this.defaultStyleStates);
  }

  setStrokeSelectorState(styleState: StyleOptions[]): void {
    this.strokeColorAgreement = true;
    this.totallyDisableStrokeColorSelector = false;
    this.strokeColor = styleState[0].strokeColor;
    this.hslaStrokeColorObject = this.convertStringToHSLAObject(
      this.strokeColor
    );
    // screen for undefined - if undefined then this is not a property that is going to be set by the style panel for this selection of objects
    if (this.strokeColor) {
      if (
        !styleState.every(
          styleObject => styleObject.strokeColor == this.strokeColor
        )
      ) {
        // The strokeColor property exists on the selected objects but the stroke color doesn't agree (so don't totally disable the selector)
        this.disableStrokeColorSelector(false);
      }
    } else {
      // The strokeColor property doesn't exists on the selected objects so totally disable the selector
      this.disableStrokeColorSelector(true);
    }
  }

  disableStrokeColorSelector(totally: boolean): void {
    this.strokeColorAgreement = false;
    this.strokeColor = "hsla(0,0%,0%,0)";
    this.hslaStrokeColorObject = this.convertStringToHSLAObject(
      this.strokeColor
    );
    this.strokeSwatchHeight = 0;
    this.showStrokeOptions = false;
    this.totallyDisableStrokeColorSelector = totally;
  }

  // Changes the fill color of the elements in the selected objects
  onFillColorChange(): void {
    this.$store.commit("changeStyle", {
      selected: this.$store.getters.selectedSENodules(),
      front: true,
      fillColor: this.convertHSLAObjectToString(this.hslaFillColorObject)
    });
  }

  setCommonFillColor(): void {
    this.fillColorAgreement = true;
  }
  setShowFillOptions(): void {
    this.showFillOptions = !this.showFillOptions;
    if (this.showFillOptions) {
      this.fillSwatchHeight = 100;
    } else {
      this.fillSwatchHeight = 0;
    }
  }
  clearFillChanges(): void {
    const selected = this.$store.getters.selectedSENodules();
    for (let i = 0; i < selected.length; i++) {
      this.$store.commit("changeStyle", {
        selected: [selected[i]],
        front: true,
        fillColor: this.initialStyleStates[i].fillColor
      });
    }
    this.setFillSelectorState(this.initialStyleStates);
  }
  resetFillToDefaults(): void {
    const selected = this.$store.getters.selectedSENodules();
    for (let i = 0; i < selected.length; i++) {
      this.$store.commit("changeStyle", {
        selected: [selected[i]],
        front: true,
        fillColor: this.defaultStyleStates[i].fillColor
      });
    }
    this.setFillSelectorState(this.defaultStyleStates);
  }

  setFillSelectorState(styleState: StyleOptions[]): void {
    this.fillColorAgreement = true;
    this.totallyDisableFillColorSelector = false;
    this.fillColor = styleState[0].fillColor;
    this.hslaFillColorObject = this.convertStringToHSLAObject(this.fillColor);
    // screen for undefined - if undefined then this is not a property that is going to be set by the style panel for this selection of objects
    if (this.fillColor) {
      if (
        !styleState.every(
          styleObject => styleObject.fillColor == this.fillColor
        )
      ) {
        // The fillColor property exists on the selected objects but the fill color doesn't agree (so don't totally disable the selector)
        this.disableFillColorSelector(false);
      }
    } else {
      // The fillColor property doesn't exists on the selected objects so totally disable the selector
      this.disableFillColorSelector(true);
    }
  }

  disableFillColorSelector(totally: boolean): void {
    this.fillColorAgreement = false;
    this.fillColor = "hsla(0,0%,0%,0)";
    this.hslaFillColorObject = this.convertStringToHSLAObject(this.fillColor);
    this.fillSwatchHeight = 0;
    this.showFillOptions = false;
    this.totallyDisableFillColorSelector = totally;
  }

  onDashPatternChange(): void {
    this.$store.commit("changeStyle", {
      selected: this.$store.getters.selectedSENodules(),
      front: true,
      dashArray: [this.dashLength, this.gapLength]
    });
  }

  onOpacityChange(): void {
    if (this.opacity == 0) {
      this.displayOpacityZeroMessage = true;
    }
    this.$store.commit("changeStyle", {
      selected: this.$store.getters.selectedSENodules(),
      front: true,
      opacity: this.opacity
    });
  }
  incrementOpacity(): void {
    if (this.opacity != undefined && this.opacity + 0.1 <= 1) {
      this.opacity += 0.1;
      this.$store.commit("changeStyle", {
        selected: this.$store.getters.selectedSENodules(),
        front: true,
        opacity: this.opacity
      });
    }
  }
  decrementOpacity(): void {
    if (this.opacity != undefined && this.opacity - 0.1 >= 0) {
      this.opacity -= 0.1;
      this.$store.commit("changeStyle", {
        selected: this.$store.getters.selectedSENodules(),
        front: true,
        opacity: this.opacity
      });
      if (this.opacity == 0) {
        this.displayOpacityZeroMessage = true;
      }
    }
  }

  onPointRadiusPercentChange(): void {
    this.$store.commit("changeStyle", {
      selected: this.$store.getters.selectedSENodules(),
      front: true,
      pointRadiusPercent: this.pointRadiusPercent
    });
  }

  /**
   * Determines if the commonStyleProperties has the given input of type Styles
   * The input is an enum of type Styles
   */
  hasStyle(s: Styles): boolean {
    const sNum = Number(s);
    return (
      this.commonStyleProperties.length > 0 &&
      this.commonStyleProperties.findIndex(x => x === sNum) >= 0
    );
  }

  /**
   * Used to determine which objects the color picker should control (i.e. the check boxes under the color picker)
   */
  get colorKeys(): any[] {
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
  get hasStrokeColor(): boolean {
    return this.hasStyle(Styles.strokeColor);
  }

  /**
   * Used to determine if the color picker Vue component (i.e. fade-in-card) should be displayed
   */
  get hasFillColor(): boolean {
    return this.hasStyle(Styles.fillColor);
  }
  /**
   * Used to determine if the stroke width slider (i.e. fade-in-card containing the slider) should be displayed
   */
  get hasStrokeWidth(): boolean {
    return this.hasStyle(Styles.strokeWidthPercentage);
  }

  get hasPointRadius(): boolean {
    return this.hasStyle(Styles.pointRadiusPercent);
  }

  get hasOpacity(): boolean {
    return this.hasStyle(Styles.opacity);
  }
  /**
   * Used to determine if the dash gap and dash length  (i.e. fade-in-card containing the sliders) should be displayed
   */
  get hasDash(): boolean {
    return this.hasStyle(Styles.dashArray);
  }

  /**
   * This is an example of the two-way binding that is provided by the Vuex store. As this is a Vue component we can Watch variables, and
   * when they change, this method wil execute in response to that change.
   */
  @Watch("selections")
  onSelectionChanged(newSelection: SENodule[]): void {
    this.commonStyleProperties.clear();
    if (newSelection.length === 0) {
      // Set all the option selectors to totally disabaled mode
      this.strokeWidthAgreement = false;
      this.pointRadiusAgreement = false;
      //totally disabale the stroke color selector
      this.disableStrokeColorSelector(true);
      this.disableFillColorSelector(true);
      this.dashAgreement = false;
      this.opacityAgreement = false;
      this.dynamicBackStyleAgreement = false;
      this.noObjectsSelected = true;
      return;
    }
    this.noObjectsSelected = false;
    // Create a list of the common properties that the objects in the selection have.
    // commonStyleProperties is a number (corresponding to an enum) array
    // The customStyles method returns a list of the styles the are adjustable for that object
    for (let k = 0; k < values.length; k++) {
      if (newSelection.every(s => s.customStyles().has(k)))
        this.commonStyleProperties.push(k);
    }

    // Get the initial and default style state of the object for undo/redo and buttons to revert to initial style
    this.initialStyleStates.clear();
    this.defaultStyleStates.clear();
    newSelection.forEach(seNodule => {
      this.initialStyleStates.push(seNodule.ref.currentStyleState(true));
      this.defaultStyleStates.push(seNodule.ref.defaultStyleState(true));
    });

    console.log("init style state 0 ", this.initialStyleStates[0]);
    //Set the initial values of the styles (checking to see if the property is the same across all selected objects)
    //   strokeWidthPercentage,
    this.strokeWidthAgreement = true;
    this.strokeWidthPercent = this.initialStyleStates[0].strokeWidthPercent;
    // screen for undefined - if undefined then this is not a property that is going to be set by the style panel for this selection of objects
    if (this.strokeWidthPercent) {
      if (
        !this.initialStyleStates.every(
          styleObject =>
            styleObject.strokeWidthPercent == this.strokeWidthPercent
        )
      ) {
        this.strokeWidthPercent = 100;
        this.strokeWidthAgreement = false;
      }
    } else {
      this.strokeWidthAgreement = false;
    }
    // console.log(
    //   "str width percent",
    //   this.strokeWidthPercent,
    //   this.strokeWidthAgreement
    // );

    //   pointRadiusPercent
    this.pointRadiusAgreement = true;
    this.pointRadiusPercent = this.initialStyleStates[0].pointRadiusPercent;
    // screen for undefined - if undefined then this is not a property that is going to be set by the style panel for this selection of objects
    if (this.pointRadiusPercent) {
      if (
        !this.initialStyleStates.every(
          styleObject =>
            styleObject.pointRadiusPercent == this.pointRadiusPercent
        )
      ) {
        this.pointRadiusPercent = 100;
        this.pointRadiusAgreement = false;
      }
    } else {
      this.pointRadiusAgreement = false;
    }

    //   strokeColor
    this.setStrokeSelectorState(this.initialStyleStates);

    //   fillColor
    this.setFillSelectorState(this.initialStyleStates);

    //   dashLength, dashGap,
    this.dashAgreement = true;
    if (
      this.initialStyleStates[0].dashArray &&
      this.initialStyleStates[0].dashArray.length > 0
    ) {
      this.gapLength = this.initialStyleStates[0].dashArray[0];
      this.dashLength = this.initialStyleStates[0].dashArray[1];
    }
    // screen for undefined - if undefined then this is not a property that is going to be set by the style panel for this selection of objects
    if (
      this.initialStyleStates[0].dashArray &&
      this.initialStyleStates[0].dashArray.length > 0
    ) {
      if (
        !this.initialStyleStates.every(styleObject => {
          if (styleObject.dashArray) {
            return (
              styleObject.dashArray[0] == this.gapLength &&
              styleObject.dashArray[1] == this.dashLength
            );
          } else {
            return false;
          }
        })
      ) {
        this.gapLength = 10;
        this.dashLength = 5;
        this.dashAgreement = false;
      }
    } else {
      this.dashAgreement = false;
    }
    // console.log(
    //   "dash array gap/length",
    //   this.gapLength,
    //   this.dashLength,
    //   this.dashAgreement
    // );
    //   opacity,
    this.opacityAgreement = true;
    this.opacity = this.initialStyleStates[0].opacity;
    // screen for undefined - if undefined then this is not a property that is going to be set by the style panel for this selection of objects
    if (this.opacity) {
      if (
        !this.initialStyleStates.every(
          styleObject => styleObject.opacity == this.opacity
        )
      ) {
        this.opacity = 0.5;
        this.opacityAgreement = false;
      }
    } else {
      this.opacityAgreement = false;
    }
    // console.log("opacity", this.opacity, this.opacityAgreement);

    //   dynamicBackStyle,
    this.dynamicBackStyleAgreement = true;
    this.dynamicBackStyle = this.initialStyleStates[0].dynamicBackStyle;
    // screen for undefined - if undefined then this is not a property that is going to be set by the style panel for this selection of objects
    if (this.dynamicBackStyle) {
      if (
        !this.initialStyleStates.every(
          styleObject => styleObject.dynamicBackStyle == this.dynamicBackStyle
        )
      ) {
        this.dynamicBackStyle = false;
        this.dynamicBackStyleAgreement = false;
      }
    } else {
      this.dynamicBackStyleAgreement = false;
    }
    // console.log(
    //   "dyn back style",
    //   this.dynamicBackStyle,
    //   this.dynamicBackStyleAgreement
    // );

    // console.log("commmonStyle", this.commonStyleProperties);
    // console.log("colorApplyTo", this.colorApplyTo);
    // console.log("styles", Styles);
    // console.log("values", values);
  }

  convertStringToHSLAObject(colorStringOld: string | undefined): hslaColorType {
    if (colorStringOld) {
      //remove the first 5 and last character of the string
      let colorString = colorStringOld.slice(5, -1);
      const numberArray = colorString
        .split(",")
        .map(x => x.replace("%", "").trim()); //remove the percent symbols
      if (Number(numberArray[3]) <= 0) {
        // If the alpha/opacity value is zero the color picker slider for alpha/opacity disappears and can't be returned
        numberArray[3] = "0.001";
      }
      return {
        h: Number(numberArray[0]),
        s: Number(numberArray[1]) / 100,
        l: Number(numberArray[2]) / 100,
        a: Number(numberArray[3])
      };
    } else {
      // This should never happen
      return {
        h: 0,
        s: 0,
        l: 0,
        a: 0
      };
    }
  }
  convertHSLAObjectToString(colorObject: hslaColorType): string {
    if (colorObject.a == undefined || colorObject.a == 0) {
      // If the alpha/opacity value is zero the color picker slider for alpha/opacity disappears and can't be returned
      colorObject.a = 0.001;
      //this.displayOpacityZeroMessage = true;
    }
    return (
      "hsla(" +
      colorObject.h +
      ", " +
      colorObject.s * 100 +
      "%, " +
      colorObject.l * 100 +
      "%, " +
      colorObject.a +
      ")"
    );
  }
}
</script>
<style scoped>
#strokeColorPicker {
  background: "red";
}
/* I wish I knew how to use the SASS options for the vuetify objects! But I don't and I can't find any examples on the web*/
$color-picker-controls-padding: 1000px;
$color-picker-edit-margin-top: 1000px;
</style>