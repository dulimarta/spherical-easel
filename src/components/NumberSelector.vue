<template>
  <div>
    <div class="text-subtitle-2">{{ $t(titleKey) }}</div>
    <div v-show="totalyDisableSelector"
      class="select-an-object-text">{{ $t("style.selectAnObject") }}</div>
    <v-tooltip v-if="!styleDataAgreement"
      bottom
      :open-delay="toolTipOpenDelay"
      :close-delay="toolTipCloseDelay"
      max-width="400px">
      k
      <template v-slot:activator="{ on }">
        <v-btn color="error"
          v-on="on"
          v-show="!totalyDisableSelector"
          text
          small
          outlined
          ripple
          @click="setStyleDataAgreement">
          {{ $t("style.differingStylesDetected") }}</v-btn>
      </template>
      <span>{{ $t("style.differingStylesDetectedToolTip") }}</span>
    </v-tooltip>

    <v-tooltip bottom
      :open-delay="toolTipOpenDelay"
      :close-delay="toolTipCloseDelay"
      max-width="400px">
      <template v-slot:activator="{ on }">
        <v-btn v-on="on"
          v-show="styleDataAgreement && !totalyDisableSelector
            "
          @click="clearChanges"
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
          v-show="styleDataAgreement && !totalyDisableSelector
            "
          @click="resetToDefaults"
          text
          small
          outlined
          ripple>{{ $t("style.restoreDefaults") }}</v-btn>
      </template>
      <span>{{ $t("style.restoreDefaultsToolTip") }}</span>
    </v-tooltip>
    <br />

    <v-slider v-model.number="styleData"
      :min="minValue"
      :disabled="!styleDataAgreement ||totalyDisableSelector"
      @change="onDataChanged"
      :max="maxValue"
      :step="step"
      type="range">
      <template v-slot:prepend>
        <v-icon @click="decrementDataValue">mdi-minus</v-icon>
      </template>

      <template v-slot:append>
        <v-icon @click="incrementDataValue">mdi-plus</v-icon>
      </template>
    </v-slider>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import SETTINGS from "@/global-settings";
import { Watch, Prop, PropSync } from "vue-property-decorator";
import { StyleOptions, Styles } from "@/types/Styles";
import { State } from "vuex-class";
import { SENodule } from "@/models/SENodule";

@Component({})
export default class NumberSelector extends Vue {
  @Prop() readonly side!: boolean;
  @Prop() readonly titleKey!: string;
  @Prop({ required: true }) readonly initialStyleStates!: StyleOptions[];
  @Prop({ required: true }) readonly defaultStyleStates!: StyleOptions[];
  @Prop({ required: true }) readonly styleName!: string;
  @PropSync("data", { type: Number }) styleData?: number | undefined;
  @Prop({ required: true }) readonly minValue!: number;
  @Prop({ required: true }) readonly maxValue!: number;
  @Prop() readonly step?: number;

  @State
  readonly selections!: SENodule[];
  /**
   * When the selected objects are first processed by the style panel their style state is recorded here
   * this is so we can undo the styling changes and have a revert to initial state button
   */
  // private initialStyleStates: StyleOptions[] = [];
  /**
   * These are the default style state for the selected objects.
   */
  // private styleName!: string;
  //private defaultStyleStates: StyleOptions[] = [];

  readonly toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  readonly toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

  private styleDataAgreement = true;
  private totalyDisableSelector = true;

  mounted (): void {
    // No code here
    // this.styleName = propNames[this.styleOption];
  }

  beforeUpdate (): void {
    // console.debug("beforeUpdate", this.styleData);
    // Make a copy of the initial state
    // if (this.defaultStyleStates.length !== this.initialStyleStates.length)
    // this.defaultStyleStates = this.initialStyleStates.slice();
  }
  // These methods are linked to the styleData fade-in-card
  onDataChanged (): void {
    this.$store.direct.commit.changeStyle({
      selected: this.$store.getters.selectedSENodules(),
      payload: {
        front: this.side,
        [this.styleName]: this.styleData
      }
    });
  }

  resetToDefaults (): void {
    const selected = this.$store.getters.selectedSENodules();
    for (let i = 0; i < selected.length; i++) {
      this.$store.direct.commit.changeStyle({
        selected: [selected[i]],
        payload: {
          front: this.side,
          [this.styleName]: (this.defaultStyleStates[i] as any)[this.styleName]
        }
      });
    }
    this.setSelectorState(this.defaultStyleStates);
  }
  setSelectorState (styleState: StyleOptions[]): void {
    this.styleDataAgreement = true;
    this.totalyDisableSelector = false;

    this.styleData =
      this.styleName in styleState[0]
        ? (styleState[0] as any)[this.styleName]
        : undefined;
    // screen for undefined - if undefined then this is not a property that is going to be set by the style panel for this selection of objects
    if (this.styleData) {
      if (
        styleState.length > 1 &&
        !styleState.every(
          styleObject => (styleObject as any)[this.styleName] === this.styleData
        )
      ) {
        // The style property exists on the selected objects but value
        // doesn't agree (so don't totally disable the selector)
        this.disableSelector(false);
      }
    } else {
      // The style property doesn't exists on the selected objects so totally disable the selector
      this.disableSelector(true);
    }
  }
  disableSelector (totally: boolean): void {
    this.styleDataAgreement = false;
    // TODO: which value to use below?
    // this.styleData = 100;
    this.totalyDisableSelector = totally;
  }
  setStyleDataAgreement (): void {
    this.styleDataAgreement = true;
  }
  clearChanges (): void {
    const selected = this.$store.getters.selectedSENodules();
    for (let i = 0; i < selected.length; i++) {
      this.$store.direct.commit.changeStyle({
        selected: [selected[i]],
        payload: {
          front: this.side,
          [this.styleName]: (this.initialStyleStates[i] as any)[this.styleName]
        }
      });
    }
    this.setSelectorState(this.initialStyleStates);
  }

  incrementDataValue (): void {
    if (
      this.styleData != undefined &&
      this.styleData + (this.step ?? 1) <= this.maxValue
    ) {
      this.styleData += this.step ?? 1;
      this.$store.direct.commit.changeStyle({
        selected: this.$store.getters.selectedSENodules(),
        payload: {
          front: this.side,
          [this.styleName]: this.styleData
        }
      });
    }
  }
  decrementDataValue (): void {
    if (
      this.styleData != undefined &&
      this.styleData - (this.step ?? 1) >= this.minValue
    ) {
      this.styleData -= this.step ?? 1;
      this.$store.direct.commit.changeStyle({
        selected: this.$store.getters.selectedSENodules(),
        payload: {
          front: this.side,
          [this.styleName]: this.styleData
        }
      });
    }
  }

  @Watch("selections")
  onSelectionChanged (newSelection: SENodule[]): void {
    if (newSelection.length === 0) {
      this.disableSelector(true);
      return;
    }

    this.setSelectorState(this.initialStyleStates);
  }
}
</script>

<style lang="scss" scoped>
@import "@/scss/variables.scss";

.select-an-object-text {
  color: rgb(255, 82, 82);
}
</style>