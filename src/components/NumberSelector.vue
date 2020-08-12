<template>
  <div>
    <span v-show="editModeIsFront()"
      class="text-subtitle-2">{{ $t(sideFrontKey) }} </span>
    <span v-show="editModeIsBack()"
      class="text-subtitle-2">{{ $t(sideBackKey) }} </span>
    <span class="text-subtitle-2">{{ $t(titleKey) }}</span>
    <br />
    <div v-show="totalyDisableSelector"
      class="select-an-object-text">{{ $t("style.selectAnObject") }}</div>
    <v-tooltip v-if="!styleDataAgreement"
      bottom
      :open-delay="toolTipOpenDelay"
      :close-delay="toolTipCloseDelay"
      max-width="400px">
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
          :disabled="disableUndoButton"
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
import { StyleOptions, Styles, StyleEditMode } from "@/types/Styles";
import { State } from "vuex-class";
import { SENodule } from "@/models/SENodule";
import { AppState } from "@/types";

@Component({})
export default class NumberSelector extends Vue {
  @Prop() readonly mode!: StyleEditMode;
  @Prop() readonly titleKey!: string;
  @Prop() readonly sideFrontKey!: string;
  @Prop() readonly sideBackKey!: string;
  @Prop({ required: true }) readonly styleName!: string;
  @PropSync("data", { type: Number }) styleData?: number | undefined;
  @Prop({ required: true }) readonly minValue!: number;
  @Prop({ required: true }) readonly maxValue!: number;
  @Prop() readonly step?: number;
  @Prop() readonly tempStyleStates!: StyleOptions[];

  @State((s: AppState) => s.selections)
  readonly selections!: SENodule[];

  private disableUndoButton = true;

  readonly toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  readonly toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

  private styleDataAgreement = true;
  private totalyDisableSelector = true;

  mounted(): void {
    this.onSelectionChanged(this.$store.getters.selectedSENodules());
  }
  @Watch("tempStyleStates")
  setTempStyleState(tempStyleStates: StyleOptions[]): void {
    this.setSelectorState(tempStyleStates);
  }

  editModeIsBack(): boolean {
    return this.mode == StyleEditMode.Back;
  }
  editModeIsFront(): boolean {
    return this.mode == StyleEditMode.Front;
  }
  editModeIsLabel(): boolean {
    return this.mode == StyleEditMode.Label;
  }

  beforeUpdate(): void {
    // console.debug("beforeUpdate", this.styleData);
    // Make a copy of the initial state
    // if (this.defaultStyleStates.length !== this.initialStyleStates.length)
    // this.defaultStyleStates = this.initialStyleStates.slice();
  }
  // These methods are linked to the styleData fade-in-card
  onDataChanged(newData: number): void {
    this.disableUndoButton = false;
    this.$store.direct.commit.changeStyle({
      selected: this.$store.getters.selectedSENodules(),
      payload: {
        mode: this.mode,
        [this.styleName]: newData
      }
    });
  }

  resetToDefaults(): void {
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
    this.setSelectorState(defaultStyleStates);
  }
  setSelectorState(styleState: StyleOptions[]): void {
    this.disableUndoButton = true;
    this.styleDataAgreement = true;
    this.totalyDisableSelector = false;

    console.log(
      "Style Name:",
      this.styleName,
      "Before RHS computed:",
      (styleState[0] as any)[this.styleName],
      "Before Style Data",
      this.styleData
    );
    this.styleData =
      this.styleName in styleState[0]
        ? (styleState[0] as any)[this.styleName]
        : undefined;

    console.log(
      "After RHS computed:",
      (styleState[0] as any)[this.styleName],
      "After Style Data",
      this.styleData,
      "These two values should be the same!"
    );
    // screen for undefined - if undefined then this is not a property that is going to be set by the style panel for this selection of objects
    if (this.styleData !== undefined) {
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
  disableSelector(totally: boolean): void {
    this.styleDataAgreement = false;
    this.disableUndoButton = true;
    this.totalyDisableSelector = totally;
  }
  setStyleDataAgreement(): void {
    this.styleDataAgreement = true;
  }
  clearChanges(): void {
    this.disableUndoButton = true;
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
    this.setSelectorState(initialStyleStates);
  }

  incrementDataValue(): void {
    if (
      this.styleData !== undefined &&
      this.styleData + (this.step ?? 1) <= this.maxValue
    ) {
      this.disableUndoButton = false;
      this.styleData += this.step ?? 1;
      this.$store.direct.commit.changeStyle({
        selected: this.$store.getters.selectedSENodules(),
        payload: {
          mode: this.mode,
          [this.styleName]: this.styleData
        }
      });
    }
  }
  decrementDataValue(): void {
    if (
      this.styleData !== undefined &&
      this.styleData - (this.step ?? 1) >= this.minValue
    ) {
      this.disableUndoButton = false;
      this.styleData -= this.step ?? 1;
      this.$store.direct.commit.changeStyle({
        selected: this.$store.getters.selectedSENodules(),
        payload: {
          mode: this.mode,
          [this.styleName]: this.styleData
        }
      });
    }
  }

  @Watch("selections")
  onSelectionChanged(newSelection: SENodule[]): void {
    if (newSelection.length === 0) {
      this.disableSelector(true);
      return;
    }
    this.setSelectorState(this.$store.getters.getInitialStyleState(this.mode));
  }
}
</script>

<style lang="scss" scoped>
@import "@/scss/variables.scss";

.select-an-object-text {
  color: rgb(255, 82, 82);
}
</style>