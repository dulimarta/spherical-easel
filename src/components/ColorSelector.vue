<template>
  <div>
    <div>
      <span class="text-subtitle-2">{{ $t(titleKey) }}</span>
    </div>
    <span v-show="totallyDisableColorSelector"
      class="select-an-object-text">{{ $t("style.selectAnObject") }}</span>
    <v-tooltip v-if="!colorAgreement" bottom :open-delay="toolTipOpenDelay"
      :close-delay="toolTipCloseDelay" max-width="400px">
      <template v-slot:activator="{ on }">
        <v-btn color="error" v-on="on"
          v-show="!totallyDisableColorSelector" text small outlined ripple
          @click="setCommonColorArgreement">
          {{ $t("style.differingStylesDetected") }}</v-btn>
      </template>
      <span>{{ $t("style.differingStylesDetectedToolTip") }}</span>
    </v-tooltip>
    <v-tooltip bottom v-else :open-delay="toolTipOpenDelay"
      :close-delay="toolTipCloseDelay" max-width="400px">
      <template v-slot:activator="{ on }">
        <v-btn v-on="on" v-show="!totallyDisableColorSelector" text
          outlined ripple small @click="showColorPresets">
          {{ $t("style.showColorPresets") }}</v-btn>
      </template>
      <span>{{ $t("style.showColorPresetsToolTip") }}</span>
    </v-tooltip>
    <v-tooltip bottom :open-delay="toolTipOpenDelay"
      :close-delay="toolTipCloseDelay" max-width="400px">
      <template v-slot:activator="{ on }">
        <v-btn v-on="on"
          v-show="colorAgreement && !totallyDisableColorSelector"
          @click="clearRecentColorChanges" text outlined ripple small>
          {{ $t("style.clearChanges") }}</v-btn>
      </template>
      <span>{{ $t("style.clearChangesToolTip") }}</span>
    </v-tooltip>
    <v-tooltip bottom :open-delay="toolTipOpenDelay"
      :close-delay="toolTipCloseDelay" max-width="400px">
      <template v-slot:activator="{ on }">
        <v-btn v-on="on"
          v-show="colorAgreement && !totallyDisableColorSelector"
          @click="resetColorToDefaults" text small outlined ripple>
          {{ $t("style.restoreDefaults") }}</v-btn>
      </template>
      <span>{{ $t("style.restoreDefaultsToolTip") }}</span>
    </v-tooltip>
    <v-color-picker hide-canvas mode="hsla"
      :disabled="!colorAgreement || totallyDisableColorSelector || noData"
      show-swatches :hide-inputs="!colorAgreement || !showColorOptions"
      hide-mode-switch :swatches-max-height="colorSwatchHeight"
      v-model="colorData" id="colorPicker" @update:color="onColorChange">
    </v-color-picker>
    <v-checkbox v-show="colorAgreement" v-model="noData"
      :label="noDataUILabel" color="indigo darken-3" @change="setNoData"
      hide-details x-small dense></v-checkbox>
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
import { StyleOptions } from "@/types/Styles";

@Component
export default class ColorSelector extends Vue {
  @Prop() readonly titleKey!: string;
  @PropSync("data") colorData?: hslaColorType;
  @Prop() readonly frontSide!: boolean;
  @Prop({ required: true }) readonly initialStyleStates!: StyleOptions[];
  @Prop({ required: true }) readonly defaultStyleStates!: StyleOptions[];
  @Prop({ required: true }) readonly styleName!: string;

  @State('selections')
  selections!: SENodule[]

  //private defaultStyleStates: StyleOptions[] = [];

  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

  private totallyDisableColorSelector = false;
  private colorAgreement = true;
  private noData = false;
  private preNoColor: string | undefined = "";

  // For TwoJS
  private colorString: string | undefined = "hsla(0, 0%,0%,0)";
  // For Buetify Color picker
  // private hslaColorObject: hslaColorType = { h: 0, s: 1, l: 1, a: 0 }
  private showColorOptions = false;
  private colorSwatchHeight = 100;
  // colorCanvasHeight is disabled it doesn't work right change hide-canvas to :canvas-height="colorCanvasHeight" to enable
  private colorCanvasHeight = 40;
  private noDataStr = "";
  private noDataUILabel = "";

  mounted(): void {
    //If there are already objects selected set the style panel to edit them (OK to pass empty string because that will set the defaults)
    this.onSelectionChanged(this.$store.getters.selectedSENodules());
    console.log("mounted initialStyleStates", this.initialStyleStates);
  }

  beforeUpdate(): void {
    const propName = this.styleName.replace("Color", "");
    const firstLetter = this.styleName.charAt(0);
    const inTitleCase = firstLetter.toUpperCase() + propName.substring(1);
    this.noDataStr = `no${inTitleCase}`;
    this.noDataUILabel = `No ${inTitleCase}`;
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
  onColorChange(): void {
    this.colorString = Nodule.convertHSLAObjectToString(
      this.colorData ?? { h: 0, s: 0, l: 0, a: 1 }
    );
    this.$store.commit("changeStyle", {
      selected: this.$store.getters.selectedSENodules(),
      front: this.frontSide,
      [this.styleName]: this.colorString
    });
  }
  setCommonColorArgreement(): void {
    this.colorAgreement = true;
  }
  clearRecentColorChanges(): void {
    const selected = this.$store.getters.selectedSENodules();
    for (let i = 0; i < selected.length; i++) {
      this.$store.commit("changeStyle", {
        selected: [selected[i]],
        front: this.frontSide,
        [this.styleName]: (this.initialStyleStates[i] as any)[this.styleName]
      });
    }
    this.preNoColor = this.colorString;
    this.setColorSelectorState(this.initialStyleStates);
  }
  resetColorToDefaults(): void {
    const selected = this.$store.getters.selectedSENodules();
    for (let i = 0; i < selected.length; i++) {
      this.$store.commit("changeStyle", {
        selected: [selected[i]],
        front: this.frontSide,
        [this.styleName]: (this.defaultStyleStates[i] as any)[this.styleName]
      });
    }
    this.setColorSelectorState(this.defaultStyleStates);
  }
  setColorSelectorState(styleState: StyleOptions[]): void {
    this.colorAgreement = true;
    this.totallyDisableColorSelector = false;

    console.log("color style State", this.styleName, styleState[0]);
    this.colorString =
      this.styleName in styleState[0]
        ? (styleState[0] as any)[this.styleName]
        : undefined;
    console.log("color string", this.colorString);
    if (
      this.colorString == this.noDataStr ||
      typeof this.colorString === undefined
    ) {
      this.colorData = Nodule.convertStringToHSLAObject("hsla(0,0%,0%,0.001)");
      this.colorSwatchHeight = 0;
      this.colorCanvasHeight = 0;
      this.showColorOptions = false;
      this.noData = true;
    } else {
      this.colorData = Nodule.convertStringToHSLAObject(this.colorString);
      this.colorCanvasHeight = 50;
      this.noData = false;
    }

    // screen for undefined - if undefined then this is not a property that is going to be set by the style panel for this selection of objects
    if (this.colorString) {
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
    this.colorAgreement = false;
    this.colorString = "hsla(0,100%,100%,0)";
    this.colorData = Nodule.convertStringToHSLAObject(this.colorString);
    this.colorSwatchHeight = 0;
    this.colorCanvasHeight = 0;
    this.showColorOptions = false;
    this.totallyDisableColorSelector = totally;
  }
  setNoData(): void {
    if (this.noData) {
      this.preNoColor = this.colorString;
      this.colorString = this.noDataStr;
      this.colorData = Nodule.convertStringToHSLAObject("hsla(0,100%,100%,0)");
      this.colorSwatchHeight = 0;
      this.colorCanvasHeight = 0;
      this.showColorOptions = false;
    } else {
      this.colorCanvasHeight = 50;
      this.colorString = this.preNoColor;
      this.colorData = Nodule.convertStringToHSLAObject(this.colorString);
    }
    this.$store.commit("changeStyle", {
      selected: this.$store.getters.selectedSENodules(),
      front: this.frontSide,
      [this.styleName]: this.colorString
    });
  }

  @Watch("selections")
  onSelectionChanged(newSelection: SENodule[]): void {
    // no code yet
    if (newSelection.length === 0) {
      //totally disable the selectors
      this.disableColorSelector(true);
      return;
    }
    this.setColorSelectorState(this.initialStyleStates);
  }
}
</script>

<style lang="scss" scoped>
@import "@/scss/variables.scss";

.select-an-object-text {
  color: rgb(255, 82, 82);
}
</style>