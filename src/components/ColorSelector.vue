<template>
  <div>
    <div>
      <span v-show="mode"
        class="text-subtitle-2">{{ $t(sideFrontKey) }} </span>
      <span v-show="!mode"
        class="text-subtitle-2">{{ $t(sideBackKey) }} </span>
      <span class="text-subtitle-2">{{ $t(titleKey) }}</span>
    </div>
    <span v-show="totallyDisableColorSelector"
      class="select-an-object-text">{{ $t("style.selectAnObject") }}</span>
    <v-tooltip v-if="!colorAgreement"
      bottom
      :open-delay="toolTipOpenDelay"
      :close-delay="toolTipCloseDelay"
      max-width="400px">
      <template v-slot:activator="{ on }">
        <v-btn color="error"
          v-on="on"
          v-show="!totallyDisableColorSelector"
          text
          small
          outlined
          ripple
          @click="setCommonColorArgreement">
          {{ $t("style.differingStylesDetected") }}</v-btn>
      </template>
      <span>{{ $t("style.differingStylesDetectedToolTip") }}</span>
    </v-tooltip>
    <v-tooltip bottom
      v-else
      :open-delay="toolTipOpenDelay"
      :close-delay="toolTipCloseDelay"
      max-width="400px">
      <template v-slot:activator="{ on }">
        <v-btn v-on="on"
          v-show="!totallyDisableColorSelector"
          text
          outlined
          ripple
          small
          @click="showColorPresets">
          {{ $t("style.showColorPresets") }}</v-btn>
      </template>
      <span>{{ $t("style.showColorPresetsToolTip") }}</span>
    </v-tooltip>
    <v-tooltip bottom
      :open-delay="toolTipOpenDelay"
      :close-delay="toolTipCloseDelay"
      max-width="400px">
      <template v-slot:activator="{ on }">
        <v-btn v-on="on"
          v-show="colorAgreement && !totallyDisableColorSelector"
          @click="clearRecentColorChanges"
          :disabled="disableUndoButton"
          text
          outlined
          ripple
          small>
          {{ $t("style.clearChanges") }}</v-btn>
      </template>
      <span>{{ $t("style.clearChangesToolTip") }}</span>
    </v-tooltip>
    <v-tooltip bottom
      :open-delay="toolTipOpenDelay"
      :close-delay="toolTipCloseDelay"
      max-width="400px">
      <template v-slot:activator="{ on }">
        <v-btn v-on="on"
          v-show="colorAgreement && !totallyDisableColorSelector"
          @click="resetColorToDefaults"
          text
          small
          outlined
          ripple>
          {{ $t("style.restoreDefaults") }}</v-btn>
      </template>
      <span>{{ $t("style.restoreDefaultsToolTip") }}</span>
    </v-tooltip>
    <v-color-picker hide-canvas
      mode="hsla"
      :disabled="!colorAgreement || totallyDisableColorSelector || noData"
      show-swatches
      :hide-inputs="!colorAgreement || !showColorOptions"
      hide-mode-switch
      :swatches-max-height="colorSwatchHeight"
      v-model="colorData"
      id="colorPicker"
      @update:color="onColorChange">
    </v-color-picker>
    <v-checkbox v-show="colorAgreement"
      v-model="noData"
      :label="noDataUILabel"
      color="indigo darken-3"
      @change="setNoData"
      hide-details
      x-small
      dense></v-checkbox>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Watch, Prop, PropSync } from "vue-property-decorator";
import SETTINGS from "@/global-settings";
import { State } from "vuex-class";
import { SENodule } from "@/models/SENodule";
import Nodule from "@/plottables/Nodule";
import { hslaColorType } from "@/types";
import { StyleOptions, StyleEditMode } from "@/types/Styles";
import { AppState } from "@/types";
@Component
export default class ColorSelector extends Vue {
  @Prop() readonly titleKey!: string;
  @Prop() readonly sideFrontKey!: string;
  @Prop() readonly sideBackKey!: string;
  @PropSync("data") colorData?: hslaColorType;
  @Prop() readonly defaultStyleStates?: StyleOptions[];
  @Prop() readonly mode!: StyleEditMode;
  @Prop({ required: true }) readonly styleName!: string;
  @Prop() readonly tempStyleStates!: StyleOptions[];

  @State((s: AppState) => s.selections)
  selections!: SENodule[];

  //private defaultStyleStates: StyleOptions[] = [];

  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

  private totallyDisableColorSelector = false;
  private colorAgreement = true;
  private noData = false; // no data means noFill or noStroke
  private preNoColor: string | undefined = "";

  private disableUndoButton = true;

  // For TwoJS
  private colorString: string | undefined = "hsla(0, 0%,0%,0)";
  // For Buetify Color picker
  // private hslaColorObject: hslaColorType = { h: 0, s: 1, l: 1, a: 0 }
  private showColorOptions = false;
  private colorSwatchHeight = 100;
  // colorCanvasHeight is disabled it doesn't work right change hide-canvas to :canvas-height="colorCanvasHeight" to enable
  // private colorCanvasHeight = 40;
  private noDataStr = "";
  private noDataUILabel = "";

  // Vue component life cycle hook
  mounted(): void {
    //If there are already objects selected set the style panel to edit them (OK to pass empty string because that will set the defaults)
    // console.log(
    //   "mounted initialStyleStates before",
    //   JSON.stringify(this.initialStyleStates[0]));

    this.onSelectionChanged(this.$store.getters.selectedSENodules());

    // If these commands are in the beforeUpdate() method they are executed over and over but
    // they only need to be executed once.
    const propName = this.styleName.replace("Color", "");
    const firstLetter = this.styleName.charAt(0);
    const inTitleCase = firstLetter.toUpperCase() + propName.substring(1);
    this.noDataStr = `no${inTitleCase}`; // the noStroke/noFill option
    this.noDataUILabel = `No ${inTitleCase}`;
  }
  // Vue component life cycle hook
  beforeUpdate(): void {
    // console.log("before update");
    // const propName = this.styleName.replace("Color", "");
    // const firstLetter = this.styleName.charAt(0);
    // const inTitleCase = firstLetter.toUpperCase() + propName.substring(1);
    // this.noDataStr = `no${inTitleCase}`; // the noStroke/noFill option
    // this.noDataUILabel = `No ${inTitleCase}`;
  }

  @Watch("tempStyleStates")
  setTempStyleState(tempStyleStates: StyleOptions[]): void {
    this.setColorSelectorState(tempStyleStates);
  }

  showColorPresets(): void {
    if (!this.noData) {
      this.showColorOptions = !this.showColorOptions;
      if (this.showColorOptions) {
        this.colorSwatchHeight = 100;
        // this.colorCanvasHeight = 30;
      } else {
        this.colorSwatchHeight = 0;
        // this.colorCanvasHeight = 0;
      }
    } else {
      this.colorSwatchHeight = 0;
      // this.colorCanvasHeight = 0;
      this.showColorOptions = false;
    }
  }
  onColorChange(newColor: any): void {
    // console.log("color Data", this.colorData);
    this.disableUndoButton = false;
    this.colorString = Nodule.convertHSLAObjectToString(
      newColor.hsla ?? { h: 0, s: 0, l: 1, a: 1 }
    );
    this.$store.direct.commit.changeStyle({
      selected: this.$store.getters.selectedSENodules(),
      payload: {
        mode: this.mode,
        [this.styleName]: this.colorString
      }
    });
  }
  setCommonColorArgreement(): void {
    this.colorAgreement = true;
  }
  clearRecentColorChanges(): void {
    const selected = this.$store.getters.selectedSENodules();
    const initialStyleStates = this.$store.getters.getInitialStyleState(
      this.mode
    );
    for (let i = 0; i < selected.length; i++) {
      this.$store.direct.commit.changeStyle({
        selected: [selected[i]],
        payload: {
          mode: this.mode,
          [this.styleName]: (initialStyleStates[i] as any)[this.styleName]
        }
      });
    }
    this.disableUndoButton = true;
    this.preNoColor = this.colorString;
    this.setColorSelectorState(initialStyleStates);
  }
  resetColorToDefaults(): void {
    const selected = this.$store.getters.selectedSENodules();
    const defaultStyleStates = this.$store.getters.getDefaultStyleState(
      this.mode
    );
    for (let i = 0; i < selected.length; i++) {
      this.$store.direct.commit.changeStyle({
        selected: [selected[i]],
        payload: {
          mode: this.mode,
          [this.styleName]: (defaultStyleStates[i] as any)[this.styleName]
        }
      });
    }
    this.setColorSelectorState(defaultStyleStates);
  }
  setColorSelectorState(styleState: StyleOptions[]): void {
    this.colorAgreement = true;
    this.totallyDisableColorSelector = false;
    this.colorSwatchHeight = 0;

    // console.log("color style State", this.styleName);
    // console.log(styleState[0].fillColor);
    this.colorString =
      this.styleName in styleState[0]
        ? (styleState[0] as any)[this.styleName]
        : undefined;
    // console.log("color string", this.colorString);
    if (this.colorString == this.noDataStr) {
      this.colorData = Nodule.convertStringToHSLAObject("hsla(0,0%,0%,0.001)");
      this.colorSwatchHeight = 0;
      // this.colorCanvasHeight = 0;
      this.showColorOptions = false;
      this.noData = true;
    } else {
      this.colorData = Nodule.convertStringToHSLAObject(this.colorString);
      // this.colorCanvasHeight = 50;
      this.noData = false;
    }
    this.disableUndoButton = true;
    // screen for undefined - if undefined then this is not a property that is going to be set by the style panel for this selection of objects
    if (this.colorString !== undefined) {
      if (
        !styleState.every(
          styleObject =>
            (styleObject as any)[this.styleName] == this.colorString
        )
      ) {
        // The color property exists on the selected objects but the
        // color doesn't agree (so don't totally disable the selector)
        this.disableColorSelector(false);
      }
    } else {
      // The color property doesn't exists on the selected objects so totally disable the selector
      this.disableColorSelector(true);
    }
  }
  disableColorSelector(totally: boolean): void {
    this.disableUndoButton = true;
    this.colorAgreement = false;
    this.colorString = "hsla(0,100%,100%,0)";
    this.colorData = Nodule.convertStringToHSLAObject(this.colorString);
    this.colorSwatchHeight = 0;
    // this.colorCanvasHeight = 0;
    this.showColorOptions = false;
    this.totallyDisableColorSelector = totally;
  }
  //No Data means noFill or noStroke
  setNoData(): void {
    this.disableUndoButton = false;
    if (this.noData) {
      this.preNoColor = this.colorString;
      this.colorString = this.noDataStr;
      this.colorData = Nodule.convertStringToHSLAObject("hsla(0,100%,100%,0)");
      this.colorSwatchHeight = 0;
      // this.colorCanvasHeight = 0;
      this.showColorOptions = false;
    } else {
      // this.colorCanvasHeight = 50;
      this.colorString = this.preNoColor;
      this.colorData = Nodule.convertStringToHSLAObject(this.colorString);
    }
    this.$store.direct.commit.changeStyle({
      selected: this.$store.getters.selectedSENodules(),
      payload: {
        mode: this.mode,
        [this.styleName]: this.colorString
      }
    });
  }

  @Watch("selections")
  onSelectionChanged(newSelection: SENodule[]): void {
    if (newSelection.length === 0) {
      //totally disable the selectors
      this.disableColorSelector(true);
      return;
    }
    this.setColorSelectorState(
      this.$store.getters.getInitialStyleState(this.mode)
    );
  }
}
</script>

<style lang="scss" scoped>
@import "@/scss/variables.scss";

.select-an-object-text {
  color: rgb(255, 82, 82);
}
</style>