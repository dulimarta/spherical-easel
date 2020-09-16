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
    <HintButton v-show="!totalyDisableSelector"
      @click="setStyleDataAgreement"
      long-label
      i18n-label="style.differingStylesDetected"
      i18n-tooltip="style.differingStylesDetectedToolTip"></HintButton>
    <HintButton v-show="styleDataAgreement && !totalyDisableSelector"
      @click="clearChanges"
      :disabled="disableUndoButton"
      i18n-label="style.clearChanges"
      i18n-tooltip="style.clearChangesToolTip"></HintButton>
    <HintButton v-show="styleDataAgreement && !totalyDisableSelector"
      @click="resetToDefaults"
      i18n-label="style.restoreDefaults"
      i18n-tooltip="style.restoreDefaultsToolTip"></HintButton>

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
import { StyleOptions, Styles, StyleEditPanels } from "@/types/Styles";
import { State } from "vuex-class";
import { SENodule } from "@/models/SENodule";
import { AppState, Labelable } from "@/types";
import HintButton from "@/components/HintButton.vue";

@Component({ components: { HintButton } })
export default class NumberSelector extends Vue {
  @Prop() readonly panel!: StyleEditPanels;
  @Prop() readonly activePanel!: StyleEditPanels;
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
    // this.onSelectionChanged(this.$store.getters.selectedSENodules());
  }
  @Watch("tempStyleStates")
  setTempStyleState(tempStyleStates: StyleOptions[]): void {
    this.setSelectorState(tempStyleStates);
  }

  editModeIsBack(): boolean {
    return this.panel === StyleEditPanels.Back;
  }
  editModeIsFront(): boolean {
    return this.panel === StyleEditPanels.Front;
  }
  editModeIsLabel(): boolean {
    return this.panel === StyleEditPanels.Basic;
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
    const selected = [];
    selected.push(...this.$store.getters.selectedSENodules());
    if (this.$store.getters.getUseLabelMode()) {
      const label = ((selected[0] as unknown) as Labelable).label;
      selected.clear();
      selected.push(label);
    }
    this.$store.direct.commit.changeStyle({
      selected: selected,
      payload: {
        panel: this.panel,
        [this.styleName]: newData
      }
    });
  }

  resetToDefaults(): void {
    const selected = [];
    selected.push(...this.$store.getters.selectedSENodules());
    if (this.$store.getters.getUseLabelMode()) {
      const label = ((selected[0] as unknown) as Labelable).label;
      selected.clear();
      selected.push(label);
    }
    const defaultStyleStates = this.$store.getters.getDefaultStyleState(
      this.panel
    );
    for (let i = 0; i < selected.length; i++) {
      this.$store.direct.commit.changeStyle({
        selected: [selected[i]],
        payload: {
          panel: this.panel,
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

    // console.log(
    //   "Style Name:",
    //   this.styleName,
    //   "Before RHS computed:",
    //   (styleState[0] as any)[this.styleName],
    //   "Before Style Data",
    //   this.styleData
    // );
    this.styleData =
      this.styleName in styleState[0]
        ? (styleState[0] as any)[this.styleName]
        : undefined;

    // console.log(
    //   "After RHS computed:",
    //   (styleState[0] as any)[this.styleName],
    //   "After Style Data",
    //   this.styleData,
    //   "These two values should be the same!"
    // );
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
    const selected = [];
    selected.push(...this.$store.getters.selectedSENodules());
    if (this.$store.getters.getUseLabelMode()) {
      const label = ((selected[0] as unknown) as Labelable).label;
      selected.clear();
      selected.push(label);
    }
    const initialStyleStates = this.$store.getters.getInitialStyleState(
      this.panel
    );
    for (let i = 0; i < selected.length; i++) {
      this.$store.direct.commit.changeStyle({
        selected: [selected[i]],
        payload: {
          panel: this.panel,
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
          panel: this.panel,
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
          panel: this.panel,
          [this.styleName]: this.styleData
        }
      });
    }
  }
  @Watch("activePanel")
  private activePanelChange(): void {
    if (this.activePanel !== undefined && this.panel === this.activePanel) {
      // activePanel = undefined means that no edit panel is open
      this.onSelectionChanged(this.$store.getters.selectedSENodules());
    }
  }

  @Watch("selections")
  onSelectionChanged(newSelection: SENodule[]): void {
    if (newSelection.length === 0) {
      this.disableSelector(true);
      return;
    }
    this.setSelectorState(this.$store.getters.getInitialStyleState(this.panel));
  }
}
</script>

<style lang="scss" scoped>
@import "@/scss/variables.scss";

.select-an-object-text {
  color: rgb(255, 82, 82);
}
</style>