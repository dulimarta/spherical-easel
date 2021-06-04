<template>
  <div>
    <span v-show="editModeIsFront()"
      class="text-subtitle-2">{{ $t(panelFrontKey) }} </span>
    <span v-show="editModeIsBack()"
      class="text-subtitle-2">{{ $t(panelBackKey) }} </span>
    <span
      class="text-subtitle-2">{{ $t(titleKey) + " ("+thumbMap(styleData)+")" }}</span>
    <span v-if="selections.length > 1"
      class="text-subtitle-2"
      style="color:red">{{" "+ $t("style.labelStyleOptionsMultiple") }}</span>
    <br />
    <!-- Disable the Dynamic Back Style Overlay -->
    <v-overlay absolute
      v-if="useDynamicBackStyleFromSelector && !totalyDisableSelector && this.usingDynamicBackStyleAgreement"
      v-bind:value="usingDynamicBackStyle || this.usingDynamicBackStyleCommonValue"
      :opacity="0.8"
      z-index="5">
      <v-card max-width="344"
        outlined>
        <v-list-item single-line
          class="pb-0">
          <v-list-item-content class="justify-center">
            <v-list-item-title class="mb-1">
              {{$t('style.dynamicBackStyleHeader')}}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-card-actions class="justify-center">

          <v-tooltip bottom
            :open-delay="toolTipOpenDelay"
            :close-delay="toolTipCloseDelay"
            max-width="400px">
            <template v-slot:activator="{ on }">
              <v-btn color="info"
                v-on="on"
                v-on:click="turnOffUsingDynamicBackStyling">
                {{$t('style.disableDynamicBackStyle')}}
              </v-btn>
            </template>
            {{$t('style.disableDynamicBackStyleToolTip')}}
          </v-tooltip>

        </v-card-actions>
      </v-card>
    </v-overlay>

    <!-- Differing data styles detected Overlay -->
    <v-overlay absolute
      v-bind:value="!styleDataAgreement && !totalyDisableSelector"
      :opacity="0.8">
      <v-card class="mx-auto"
        max-width="344"
        outlined>
        <v-list-item single-line
          class="pb-0">
          <v-list-item-content>
            <v-list-item-title class="mb-1">
              {{$t('style.styleDisagreement')}}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-card-actions>

          <v-tooltip bottom
            :open-delay="toolTipOpenDelay"
            :close-delay="toolTipCloseDelay"
            max-width="400px">
            <template v-slot:activator="{ on }">
              <v-btn color="info"
                v-on="on"
                v-on:click="setStyleDataAgreement">
                {{$t('style.enableCommonStyle')}}
              </v-btn>
            </template>
            {{$t('style.differentValuesToolTip')}}
          </v-tooltip>

        </v-card-actions>
      </v-card>
    </v-overlay>

    <!-- The number selector slider -->
    <v-slider v-model.number="styleData"
      :min="minValue"
      @change="onDataChanged"
      :max="maxValue"
      :step="step"
      :disabled="disabledValue"
      type="range"
      class="mb-n4 pa-n4">
      <template v-slot:prepend>
        <v-icon @click="decrementDataValue">mdi-minus</v-icon>
      </template>
      <template v-slot:thumb-label="{ value }">
        {{ thumbMap(value) }}
      </template>
      <template v-slot:append>
        <v-icon @click="incrementDataValue">mdi-plus</v-icon>
      </template>
    </v-slider>

    <!-- Undo and Reset to Defaults buttons -->
    <v-container class="pa-0 ma-0">
      <v-row justify="end"
        no-gutters>
        <v-col cols="2"
          class="ma-0 pl-0 pr-0 pt-0 pb-2">
          <HintButton @click="clearChanges"
            :disabled="disableUndoButton || disabledValue"
            type="undo"
            i18n-label="style.clearChanges"
            i18n-tooltip="style.clearChangesToolTip"></HintButton>
        </v-col>

        <v-col cols="2"
          class="ma-0 pl-0 pr-0 pt-0 pb-2">
          <HintButton @click="resetToDefaults"
            :disabled="disabledValue"
            type="default"
            i18n-label="style.restoreDefaults"
            i18n-tooltip="style.restoreDefaultsToolTip"></HintButton>
        </v-col>
      </v-row>
    </v-container>
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
import { AppState, Labelable, UpdateMode } from "@/types";
import HintButton from "@/components/HintButton.vue";
import Style from "./Style.vue";

@Component({ components: { HintButton } })
export default class NumberSelector extends Vue {
  @Prop() readonly panel!: StyleEditPanels;
  @Prop() readonly activePanel!: StyleEditPanels;
  @Prop() readonly titleKey!: string;
  @Prop() readonly panelFrontKey!: string;
  @Prop() readonly panelBackKey!: string;
  @Prop({ required: true }) readonly styleName!: string;
  @PropSync("data", { type: Number }) styleData?: number | undefined;
  @Prop({ required: true }) readonly minValue!: number;
  @Prop({ required: true }) readonly maxValue!: number;
  @Prop() readonly step?: number;
  @Prop() readonly tempStyleStates!: StyleOptions[];
  @Prop() readonly thumbStringValues?: string[];
  @Prop() readonly disabledValue?: boolean;
  @Prop() readonly useDynamicBackStyleFromSelector!: boolean;

  @State((s: AppState) => s.selections)
  readonly selections!: SENodule[];

  readonly toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  readonly toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

  private disableUndoButton = true;
  private styleDataAgreement = true;
  private totalyDisableSelector = false;

  // usingDynamicBackStyleAgreement indicates if all the dynamicBackStyle booleans are the same (either T or F)
  private usingDynamicBackStyleAgreement = true;
  // usingDynamicBackStyleCommonValue = true indicates ( when usingDynamicBackStyleAgreement = true ) that
  // all selected objects have the dynamicBackstyle = true
  // usingDynamicBackStyleCommonValue = false indicates ( when usingDynamicBackStyleAgreement = true ) that
  // all selected objects have the dynamicBackstyle = false
  // if usingDynamicBackStyleAgreement = false then usingDynamicBackStyleCommonValue is meaningless
  // if usingDynamicBackStyleAgreement = true and usingDynamicBackStyleCommonValue is undefined, then something went horribly wrong!
  private usingDynamicBackStyleCommonValue: boolean | undefined = true;
  // usingDynamicBackStyle = false means that the user is setting the color for the back on their own and is
  // *not* using the contrast (i.e. not using the dynamic back styling)
  // usingDynamicBackStyle = true means the program is setting the style of the back objects
  private usingDynamicBackStyle = true;

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
    return this.panel === StyleEditPanels.Label;
  }

  //converts the value of the slider to the text message displayed in the thumb marker
  thumbMap(val: number): string {
    if (this.thumbStringValues === undefined) {
      return String(val);
    } else {
      return this.thumbStringValues[
        Math.floor((val - this.minValue) / this.step!)
      ];
    }
  }
  beforeUpdate(): void {
    // Make a copy of the initial state
    // if (this.defaultStyleStates.length !== this.initialStyleStates.length)
    // this.defaultStyleStates = this.initialStyleStates.slice();
  }
  // These methods are linked to the styleData fade-in-card
  onDataChanged(newData: number): void {
    this.disableUndoButton = false;
    const selected: SENodule[] = [];
    // If this number selector is on the label panel, then all changes are directed at the label(s).
    if (this.panel === StyleEditPanels.Label) {
      (this.$store.getters.selectedSENodules() as SENodule[]).forEach(node => {
        selected.push(((node as unknown) as Labelable).label!);
      });
    } else {
      selected.push(...this.$store.getters.selectedSENodules());
    }

    if (!this.usingDynamicBackStyle && this.useDynamicBackStyleFromSelector) {
      this.$store.direct.commit.changeStyle({
        selected: selected,
        payload: {
          panel: this.panel,
          dynamicBackStyle: false
        }
      });
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
    const selected: SENodule[] = [];
    // If this number selector is on the label panel, then all changes are directed at the label(s).
    if (this.panel === StyleEditPanels.Label) {
      (this.$store.getters.selectedSENodules() as SENodule[]).forEach(node => {
        selected.push(((node as unknown) as Labelable).label!);
      });
    } else {
      selected.push(...this.$store.getters.selectedSENodules());
    }
    const defaultStyleStates = this.$store.getters.getDefaultStyleState(
      this.panel
    );
    for (let i = 0; i < selected.length; i++) {
      this.$store.direct.commit.changeStyle({
        selected: [selected[i]],
        payload: {
          panel: this.panel,
          [this.styleName]: (defaultStyleStates[i] as any)[this.styleName],
          dynamicBackStyle: (defaultStyleStates[i] as any)["dynamicBackStyle"]
        }
      });
    }
    this.setSelectorState(defaultStyleStates);
  }
  setSelectorState(styleState: StyleOptions[]): void {
    this.disableUndoButton = true;
    this.styleDataAgreement = true;
    this.totalyDisableSelector = false;

    this.styleData =
      this.styleName in styleState[0]
        ? (styleState[0] as any)[this.styleName]
        : undefined;

    // check for undefined - if undefined then this is not a property that is going to be set by the style panel for this selection of objects
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

    // Set the usingDynamicBackStyleAgreement and usingDynamicBackStyleCommonValue varaibles
    if (this.useDynamicBackStyleFromSelector) {
      this.usingDynamicBackStyleAgreement = true;

      this.usingDynamicBackStyleCommonValue =
        "dynamicBackStyle" in styleState[0]
          ? (styleState[0] as any).dynamicBackStyle
          : undefined;

      this.disableUndoButton = true;
      // screen for undefined - if undefined then this is not a property that is going to be set by the style panel for this selection of objects
      if (
        this.usingDynamicBackStyleCommonValue === undefined ||
        !styleState.every(
          styleObject =>
            (styleObject as any).dynamicBackStyle ==
            this.usingDynamicBackStyleCommonValue
        )
      ) {
        // The dynamicBackStyle exists on the selected objects but the
        // doesn't agree
        this.usingDynamicBackStyleAgreement = false;
      }

      if (
        this.usingDynamicBackStyleAgreement &&
        !this.usingDynamicBackStyleCommonValue
      ) {
        this.usingDynamicBackStyle = false;
      }

      // console.log("useDBS from user input", this.usingDynamicBackStyle);
      // console.log("DBS Agree", this.usingDynamicBackStyleAgreement);
      // console.log("DBS common Value", this.usingDynamicBackStyleCommonValue);
      // console.log(
      //   "logic useDBS from user input || (DBS Agre && ! DBS common Value)",
      //   this.usingDynamicBackStyle ||
      //     (this.usingDynamicBackStyleAgreement &&
      //       (this.usingDynamicBackStyleAgreement === true
      //         ? !this.usingDynamicBackStyleCommonValue
      //         : true))
      // );
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
    const selected: SENodule[] = [];
    // If this number selector is on the label panel, then all changes are directed at the label(s).
    if (this.panel === StyleEditPanels.Label) {
      (this.$store.getters.selectedSENodules() as SENodule[]).forEach(node => {
        selected.push(((node as unknown) as Labelable).label!);
      });
    } else {
      selected.push(...this.$store.getters.selectedSENodules());
    }
    const initialStyleStates = this.$store.getters.getInitialStyleState(
      this.panel
    );
    for (let i = 0; i < selected.length; i++) {
      this.$store.direct.commit.changeStyle({
        selected: [selected[i]],
        payload: {
          panel: this.panel,
          [this.styleName]: (initialStyleStates[i] as any)[this.styleName],
          dynamicBackStyle: (initialStyleStates[i] as any)["dynamicBackStyle"]
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
      this.styleData += this.step ?? 1;
      this.onDataChanged(this.styleData);
    }
  }
  decrementDataValue(): void {
    if (
      this.styleData !== undefined &&
      this.styleData - (this.step ?? 1) >= this.minValue
    ) {
      this.styleData -= this.step ?? 1;
      this.onDataChanged(this.styleData);
    }
  }

  turnOffUsingDynamicBackStyling(): void {
    this.usingDynamicBackStyle = false;
    this.usingDynamicBackStyleAgreement = true;
    this.usingDynamicBackStyleCommonValue = false;

    //Write this to the objects
    const selected: SENodule[] = [];
    // If this color selector is on the label panel, then all changes are directed at the label(s).
    if (this.panel === StyleEditPanels.Label) {
      (this.$store.getters.selectedSENodules() as SENodule[]).forEach(node => {
        selected.push(((node as unknown) as Labelable).label!);
      });
    } else {
      selected.push(...this.$store.getters.selectedSENodules());
    }
    this.$store.direct.commit.changeStyle({
      selected: selected,
      payload: {
        panel: this.panel,
        dynamicBackStyle: false
      }
    });
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