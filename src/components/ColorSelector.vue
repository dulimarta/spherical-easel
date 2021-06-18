<template>
  <div>
    <div>
      <span v-show="editModeIsFront()"
        class="text-subtitle-2">{{ $t(panelFrontKey) }} </span>
      <span v-show="editModeIsBack()"
        class="text-subtitle-2">{{ $t(panelBackKey) }} </span>
      <span class="text-subtitle-2">{{ $t(titleKey)+" " }}</span>
      <v-icon :color="convertColorToRGBAString(colorData)"
        small>mdi-checkbox-blank</v-icon>
      <span v-if="selections.length > 1"
        class="text-subtitle-2"
        style="color:red">{{" "+ $t("style.labelStyleOptionsMultiple") }}</span>
    </div>
    <!-- Disable the Dynamic Back Style Overlay -->
    <OverlayWithFixButton
      v-if="useDynamicBackStyleFromSelector && !totallyDisableColorSelector && this.usingDynamicBackStyleAgreement && (usingDynamicBackStyle || this.usingDynamicBackStyleCommonValue)"
      z-index="10"
      i18n-title-line="style.dynamicBackStyleHeader"
      i18n-button-label="style.disableDynamicBackStyle"
      i18n-button-tool-tip="style.disableDynamicBackStyleToolTip"
      @click="turnOffUsingDynamicBackStyling">
    </OverlayWithFixButton>

    <!-- Differing data styles detected Overlay -->
    <OverlayWithFixButton v-if="(!colorAgreement || (useDynamicBackStyleFromSelector && !usingDynamicBackStyleAgreement) ) 
      && !totallyDisableColorSelector"
      z-index="5"
      i18n-title-line="style.styleDisagreement"
      i18n-button-label="style.enableCommonStyle"
      i18n-button-tool-tip="style.differentValuesToolTip"
      @click="setCommonDataAgreement">
    </OverlayWithFixButton>

    <!-- The color picker -->
    <v-color-picker @update:color="onColorChange"
      :disabled="totallyDisableColorSelector || noData"
      hide-sliders
      hide-canvas
      show-swatches
      :hide-inputs="!showColorInputs"
      :swatches-max-height="100"
      :swatches="colorSwatches"
      v-model="colorData"
      id="colorPicker">
    </v-color-picker>

    <!-- Show no fill checkbox, color code inputs, Undo and Reset to Defaults buttons -->
    <v-container class="pa-0 ma-0">
      <v-row justify="end"
        no-gutters
        align="center">
        <v-col cols="6">
          <v-tooltip bottom
            :open-delay="toolTipOpenDelay"
            :close-delay="toolTipCloseDelay"
            :disabled="activePanel !== 0"
            max-width="400px">
            <template v-slot:activator="{ on }">
              <span v-on="on">
                <v-checkbox v-show="!totallyDisableColorSelector"
                  v-model="noData"
                  :label="noDataUILabel"
                  color="indigo darken-3"
                  @change="setNoData"
                  hide-details
                  x-small
                  dense></v-checkbox>
              </span>
            </template>
            {{$t('style.noFillLabelTip')}}
          </v-tooltip>
        </v-col>
        <v-col cols="2"
          class="ma-0 pl-0 pr-0 pt-2 pb-2">
          <HintButton v-show="!totallyDisableColorSelector"
            type="colorInput"
            @click="toggleColorInputs"
            i18n-label="style.showColorInputs"
            i18n-tooltip="style.showColorInputsToolTip">
          </HintButton>
        </v-col>
        <v-col cols="2"
          class="ma-0 pl-0 pr-0 pt-2 pb-2">
          <HintButton v-show="!totallyDisableColorSelector"
            type="undo"
            @click="clearRecentColorChanges"
            :disabled="disableUndoButton"
            i18n-label="style.clearChanges"
            i18n-tooltip="style.clearChangesToolTip"></HintButton>
        </v-col>

        <v-col cols="2"
          class="ma-0 pl-0 pr-0 pt-2 pb-2">
          <HintButton v-show="!totallyDisableColorSelector"
            type="default"
            @click="resetColorToDefaults"
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
import { Watch, Prop, PropSync } from "vue-property-decorator";
import SETTINGS from "@/global-settings";
import { State, Getter, Mutation } from "vuex-class";
import { SENodule } from "@/models/SENodule";
import Nodule from "@/plottables/Nodule";
import { hslaColorType, Labelable } from "@/types";
import { StyleOptions, StyleEditPanels } from "@/types/Styles";
import { AppState } from "@/types";
import HintButton from "@/components/HintButton.vue";
import OverlayWithFixButton from "@/components/OverlayWithFixButton.vue";
import i18n from "../i18n";

@Component({ components: { HintButton, OverlayWithFixButton } })
export default class ColorSelector extends Vue {
  @Prop() readonly titleKey!: string;
  @Prop() readonly panelFrontKey!: string;
  @Prop() readonly panelBackKey!: string;
  @PropSync("data") colorData?: hslaColorType;
  @Prop() readonly defaultStyleStates?: StyleOptions[];
  @Prop() readonly panel!: StyleEditPanels;
  @Prop() readonly activePanel!: StyleEditPanels;
  @Prop({ required: true }) readonly styleName!: string;
  @Prop() readonly tempStyleStates!: StyleOptions[];
  @Prop() readonly useDynamicBackStyleFromSelector!: boolean;

  @State((s: AppState) => s.selections)
  readonly selections!: SENodule[];

  @Getter selectedSENodules!: SENodule[];
  @Getter getInitialStyleState!: (_: StyleEditPanels) => StyleOptions[];
  @Getter getDefaultStyleState!: (_: StyleEditPanels) => StyleOptions[];

  @Mutation
  changeStyle!: (_: any) => void;

  //private defaultStyleStates: StyleOptions[] = [];

  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

  private totallyDisableColorSelector = false;
  private colorAgreement = true;
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

  private noData = false; // no data means noFill or noStroke
  private preNoColor: string | undefined = "";

  private disableUndoButton = true;

  // For TwoJS
  private colorString: string | undefined = "hsla(0, 0%,0%,0)";
  private showColorInputs = false;

  private colorSwatches = SETTINGS.style.swatches;
  private noDataStr = "";
  private noDataUILabel = i18n.t("style.noFill");

  // Vue component life cycle hook
  mounted(): void {
    // If these commands are in the beforeUpdate() method they are executed over and over but
    // they only need to be executed once.
    const propName = this.styleName.replace("Color", "");
    const firstLetter = this.styleName.charAt(0);
    const inTitleCase = firstLetter.toUpperCase() + propName.substring(1);
    this.noDataStr = `no${inTitleCase}`;
    var re = /fill/gi;
    this.noDataUILabel =
      this.styleName.search(re) === -1
        ? i18n.t("style.noStroke")
        : i18n.t("style.noFill"); // the noStroke/noFill option
    //this.noDataUILabel = `No ${inTitleCase}`;
    // console.log("style name", this.styleName);
    // console.log("noStrData", this.noDataStr);
  }

  @Watch("tempStyleStates")
  setTempStyleState(tempStyleStates: StyleOptions[]): void {
    this.setColorSelectorState(tempStyleStates);
  }

  convertColorToRGBAString(colorObject: any): string {
    // THANK YOU INTERNET!
    const h = colorObject.h;
    const s = colorObject.s * 100;
    let l = colorObject.l * 100;
    // console.log("h ", h, " s ", s, " l ", l);
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, "0"); // convert to Hex and prefix "0" if needed
    };
    // console.log(`#${f(0)}${f(8)}${f(4)}`);
    return `#${f(0)}${f(8)}${f(4)}`;
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

  toggleColorInputs(): void {
    if (!this.noData) {
      this.showColorInputs = !this.showColorInputs;
    } else {
      this.showColorInputs = false;
    }
  }
  onColorChange(newColor: any): void {
    // console.log("color Data", this.colorData);
    this.disableUndoButton = false;
    this.colorString = Nodule.convertHSLAObjectToString(
      newColor.hsla ?? { h: 0, s: 0, l: 1, a: 1 }
    );
    const selected: SENodule[] = [];
    // If this color selector is on the label panel, then all changes are directed at the label(s).
    if (this.panel === StyleEditPanels.Label) {
      this.selectedSENodules.forEach(node => {
        selected.push(((node as unknown) as Labelable).label!);
      });
    } else {
      selected.push(...this.selectedSENodules);
    }

    if (!this.usingDynamicBackStyle && this.useDynamicBackStyleFromSelector) {
      this.changeStyle({
        selected: selected,
        payload: {
          panel: this.panel,
          dynamicBackStyle: false
        }
      });
    }
    this.changeStyle({
      selected: selected,
      payload: {
        panel: this.panel,
        [this.styleName]: this.colorString
      }
    });
  }
  setCommonDataAgreement(): void {
    this.colorAgreement = true;
    this.usingDynamicBackStyleAgreement = true;
    this.usingDynamicBackStyleCommonValue = true;
  }
  turnOffUsingDynamicBackStyling(): void {
    this.usingDynamicBackStyle = false;
    this.usingDynamicBackStyleAgreement = true;
    this.usingDynamicBackStyleCommonValue = false;

    //Write this to the objects
    const selected: SENodule[] = [];
    // If this color selector is on the label panel, then all changes are directed at the label(s).
    if (this.panel === StyleEditPanels.Label) {
      this.selectedSENodules.forEach(node => {
        selected.push(((node as unknown) as Labelable).label!);
      });
    } else {
      selected.push(...this.selectedSENodules);
    }
    this.changeStyle({
      selected: selected,
      payload: {
        panel: this.panel,
        dynamicBackStyle: false
      }
    });
  }
  clearRecentColorChanges(): void {
    const selected: SENodule[] = [];
    // If this color selector is on the label panel, then all changes are directed at the label(s).
    if (this.panel === StyleEditPanels.Label) {
      this.selectedSENodules.forEach(node => {
        selected.push(((node as unknown) as Labelable).label!);
      });
    } else {
      selected.push(...this.selectedSENodules);
    }
    const initialStyleStates = this.getInitialStyleState(this.panel);
    for (let i = 0; i < selected.length; i++) {
      this.changeStyle({
        selected: [selected[i]],
        payload: {
          panel: this.panel,
          [this.styleName]: (initialStyleStates[i] as any)[this.styleName],
          dynamicBackStyle: (initialStyleStates[i] as any)["dynamicBackStyle"]
        }
      });
    }

    this.disableUndoButton = true;
    this.preNoColor = this.colorString;
    this.setColorSelectorState(initialStyleStates);
  }
  resetColorToDefaults(): void {
    const selected: SENodule[] = [];
    // If this color selector is on the label panel, then all changes are directed at the label(s).
    if (this.panel === StyleEditPanels.Label) {
      this.selectedSENodules.forEach(node => {
        selected.push(((node as unknown) as Labelable).label!);
      });
    } else {
      selected.push(...this.selectedSENodules);
    }
    const defaultStyleStates = this.getDefaultStyleState(this.panel);
    for (let i = 0; i < selected.length; i++) {
      this.changeStyle({
        selected: [selected[i]],
        payload: {
          panel: this.panel,
          [this.styleName]: (defaultStyleStates[i] as any)[this.styleName],
          dynamicBackStyle: (defaultStyleStates[i] as any)["dynamicBackStyle"]
        }
      });
    }

    this.setColorSelectorState(defaultStyleStates);
  }
  setColorSelectorState(styleState: StyleOptions[]): void {
    this.colorAgreement = true;
    this.totallyDisableColorSelector = false;
    this.usingDynamicBackStyle = true;

    // This is the value of this.styleName style in the first stylestate
    this.colorString =
      this.styleName in styleState[0]
        ? (styleState[0] as any)[this.styleName]
        : undefined;

    if (this.colorString === this.noDataStr) {
      this.colorData = Nodule.convertStringToHSLAObject("hsla(0,0%,0%,0.001)");
      this.showColorInputs = false;
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
  disableColorSelector(totally: boolean): void {
    this.disableUndoButton = true;
    this.colorAgreement = false;
    this.colorString = "hsla(0,100%,100%,0)";
    this.colorData = Nodule.convertStringToHSLAObject(this.colorString);
    this.showColorInputs = false;
    this.totallyDisableColorSelector = totally;
  }
  //No Data means noFill or noStroke
  setNoData(): void {
    this.disableUndoButton = false;
    if (this.noData) {
      this.preNoColor = this.colorString;
      this.colorString = this.noDataStr;
      this.colorData = Nodule.convertStringToHSLAObject("hsla(0,100%,100%,0)");
      this.showColorInputs = false;
    } else {
      this.colorString = this.preNoColor;
      this.colorData = Nodule.convertStringToHSLAObject(this.colorString);
    }
    const selected: SENodule[] = [];
    // If this color selector is on the label panel, then all changes are directed at the label(s).
    if (this.panel === StyleEditPanels.Label) {
      this.selectedSENodules.forEach(node => {
        selected.push(((node as unknown) as Labelable).label!);
      });
    } else {
      selected.push(...this.selectedSENodules);
    }

    this.changeStyle({
      selected: selected,
      payload: {
        panel: this.panel,
        [this.styleName]: this.colorString
      }
    });
  }

  @Watch("activePanel")
  private activePanelChange(): void {
    if (this.activePanel !== undefined && this.panel === this.activePanel) {
      // activePanel = undefined means that no edit panel is open
      this.onSelectionChanged(this.selectedSENodules);
    }
  }

  @Watch("selections")
  onSelectionChanged(newSelection: SENodule[]): void {
    if (newSelection.length === 0) {
      //totally disable the selectors
      this.disableColorSelector(true);
      return;
    }
    this.setColorSelectorState(this.getInitialStyleState(this.panel));
  }
}
</script>

<style lang="scss" scoped>
@import "@/scss/variables.scss";

.select-an-object-text {
  color: rgb(255, 82, 82);
}
</style>