<template>
  <div>

    <!-- Label(s) not showing overlay -- higher z-index rendered on top -- covers entire panel including the header-->
    <OverlayWithFixButton v-if="!allLabelsShowing"
      z-index="100"
      i18n-title-line="style.labelNotVisible"
      i18n-subtitle-line="style.clickToMakeLabelsVisible"
      i18n-button-label="style.makeLabelsVisible"
      i18n-button-tool-tip="style.labelsNotShowingToolTip"
      @click="toggleAllLabelsVisibility">
    </OverlayWithFixButton>
    <v-row no-gutters>
      <v-spacer />
      <!-- Undo and Reset to Defaults buttons -->
      <v-col cols="2"
        class="ma-0 pl-0 pr-0 pt-0 pb-2">
        <HintButton @click="clearStyleData"
          :disabled="disableStyleSelectorUndoButton"
          type="undo"
          i18n-label="style.clearChanges"
          i18n-tooltip="style.clearChangesToolTip">
        </HintButton>
      </v-col>

      <v-col cols="2"
        class="ma-0 pl-0 pr-0 pt-0 pb-2">
        <HintButton @click="resetStyleDataToDefaults"
          type="default"
          i18n-label="style.restoreDefaults"
          i18n-tooltip="style.restoreDefaultsToolTip">
        </HintButton>
      </v-col>
    </v-row>

    <!-- Label Text Options -->
    <FadeInCard>
      <span
        class="text-subtitle-2">{{ $t("style.labelStyleOptions") }}</span>
      <span v-if="selectedSENodules.length > 1"
        class="text-subtitle-2"
        style="color:red">{{" "+ $t("style.labelStyleOptionsMultiple") }}</span>
      <div style="line-height:15%;">
        <br />
      </div>

      <!-- Differing data styles detected Overlay --higher z-index rendered on top-->
      <OverlayWithFixButton v-if="!styleDataAgreement"
        z-index="1"
        i18n-title-line="style.styleDisagreement"
        i18n-button-label="style.enableCommonStyle"
        i18n-button-tool-tip="style.differentValuesToolTip"
        @click="setStyleDataAgreement">
      </OverlayWithFixButton>

      <!-- Label Text Selections -->
      <div v-if="activeStyleOptions">
        <v-text-field v-model.lazy="activeStyleOptions.labelDisplayText"
          v-bind:label="$t('style.labelText')"
          :counter="maxLabelDisplayTextLength"
          filled
          outlined
          dense
          v-bind:error-messages="$t(labelDisplayTextErrorMessageKey, { max: maxLabelDisplayTextLength })"
          :rules="[labelDisplayTextCheck]">
        </v-text-field>

        <!-- Label Diplay Mode Selections -->
        <v-select v-model.lazy="activeStyleOptions.labelDisplayMode"
          :class="showMoreLabelStyles ? '' : 'pa-0'"
          v-bind:label="$t('style.labelDisplayMode')"
          :items="labelDisplayModeValueFilter(labelDisplayModeItems)"
          filled
          outlined
          dense>
        </v-select>

        <!-- Label Text Family Selections (only if more label style selected) -->
        <div v-show="showMoreLabelStyles">
          <!-- Label Caption Selections (only if more label style selected) -->
          <v-text-field
            v-model.lazy="activeStyleOptions.labelDisplayCaption"
            v-bind:label="$t('style.labelCaption')"
            :counter="maxLabelDisplayCaptionLength"
            filled
            outlined
            dense
            v-bind:error-messages="$t(labelDisplayCaptionErrorMessageKey, { max: maxLabelDisplayCaptionLength })"
            :rules="[labelDisplayCaptionCheck]">
          </v-text-field>
          <v-select v-model.lazy="activeStyleOptions.labelTextFamily"
            v-bind:label="$t('style.labelTextFamily')"
            :items="labelTextFamilyItems"
            filled
            outlined
            dense>
          </v-select>

          <!-- Label Text Style Selections (only if more label style selected) -->
          <v-select v-model.lazy="activeStyleOptions.labelTextStyle"
            v-bind:label="$t('style.labelTextStyle')"
            :items="labelTextStyleItems"
            filled
            outlined
            dense>
          </v-select>

          <!-- Label Text Decoration Selections (only if more label style selected) -->
          <v-select v-model.lazy="activeStyleOptions.labelTextDecoration"
            v-bind:label="$t('style.labelTextDecoration')"
            :items="labelTextDecorationItems"
            filled
            outlined
            dense>
          </v-select>
        </div>
      </div>
      <v-container class="pa-0 ma-0">
        <v-row>
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

    </FadeInCard>
    <!-- Label Text Scale Number Selector-->
    <div v-if="activeStyleOptions && showMoreLabelStyles">
      <FadeInCard>
        {{ $t("style.labelTextScalePercent")}} &
        {{$t("style.labelTextRotation")}}
        <NumberSelector
          v-bind:data.sync="activeStyleOptions.labelTextScalePercent"
          title-key="style.labelTextScalePercent"
          v-bind:min="minLabelTextScalePercent"
          v-bind:max="maxLabelTextScalePercent"
          v-bind:step="20"
          :thumb-string-values="textScaleSelectorThumbStrings" />
        <NumberSelector
          v-bind:data.sync="activeStyleOptions.labelTextRotation"
          title-key="style.labelTextRotation"
          v-bind:min="-3.14159"
          v-bind:max="3.14159"
          v-bind:step="0.39269875"
          :thumb-string-values="textRotationSelectorThumbStrings">
        </NumberSelector>
      </FadeInCard>

      <!-- Label Front Fill Color Selector -->
      <FadeInCard>

        <ColorSelector title-key="style.labelFrontFillColor"
          style-name="labelFrontFillColor"
          :data.sync="hslaLabelFrontFillColorObject"
          :temp-style-states="tempStyleStates"></ColorSelector>
      </FadeInCard>

      <!-- Label Back Fill Color Selector : -->
      <FadeInCard>
        <ColorSelector title-key="style.labelBackFillColor"
          style-name="labelBackFillColor"
          :data.sync="hslaLabelBackFillColorObject"
          :temp-style-states="tempStyleStates"></ColorSelector>
      </FadeInCard>
    </div>
    <!-- Show more or less styling options -->

  </div>

</template>
<script lang="ts">
import Vue from "vue";
import { Component, Watch, Prop } from "vue-property-decorator";
import { SENodule } from "../models/SENodule";
import Nodule from "../plottables/Nodule";
import { namespace } from "vuex-class";
import { StyleOptions, StyleEditPanels } from "../types/Styles";
import { LabelDisplayMode } from "@/types";
import SETTINGS from "@/global-settings";
import FadeInCard from "@/components/FadeInCard.vue";
import { hslaColorType, AppState, Labelable } from "@/types";
import { StyleNoduleCommand } from "@/commands/StyleNoduleCommand";
import EventBus from "@/eventHandlers/EventBus";
import NumberSelector from "@/components/SimpleNumberSelector.vue";
// import TextInputSelector from "@/components/TextInputSelector.vue";
import ColorSelector from "@/components/SimpleColorSelector.vue";
import i18n from "../i18n";
import HintButton from "@/components/HintButton.vue";
import OverlayWithFixButton from "@/components/OverlayWithFixButton.vue";
import { SEStore } from "@/store";
import { SELabel } from "@/models/SELabel";
import Label from "@/plottables/Label";
const SE = namespace("se");

// import UI from "@/store/ui-styles";
type labelDisplayModeItem = {
  text: any; //typeof VueI18n.TranslateResult
  value: LabelDisplayMode;
  optionRequiresMeasurementValueToExist: boolean;
  optionRequiresCaptionToExist: boolean;
};

@Component({
  components: {
    FadeInCard,
    NumberSelector,
    ColorSelector,
    HintButton,
    OverlayWithFixButton
  }
})
export default class LabelStyle extends Vue {
  @Prop()
  readonly panel!: StyleEditPanels;
  @Prop()
  readonly activePanel!: StyleEditPanels;

  @SE.State((s: AppState) => s.selectedSENodules)
  readonly selectedSENodules!: SENodule[];

  @SE.State((s: AppState) => s.oldStyleSelections)
  readonly oldStyleSelection!: SENodule[];

  @SE.State((s: AppState) => s.styleSavedFromPanel)
  readonly styleSavedFromPanel!: StyleEditPanels;

  @SE.State((s: AppState) => s.initialBackStyleContrast)
  readonly initialBackStyleContrast!: number;

  /**
   * These are the temp style state for the selected objects. Used to set the color/number/dash/contrast selectors when the user disables the dynamic back styling.
   */
  private tempStyleStates: StyleOptions[] = [];

  /**
   * These help with redo/redo
   */
  private currentStyleStates: StyleOptions[] = [];
  private selectedLabels: Label[] = [];
  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;
  /**
   * There are many style options. In the case that there
   * are more than one object selected, the XXXAgreement boolean indicates if the XXX property is *initially* the
   * same across the selected objects. In the case that they are not initially the same, the cooresponding adjustment tool
   * is display in a different way than the usual default.
   */

  private maxLabelTextScalePercent = SETTINGS.style.maxLabelTextScalePercent;
  private minLabelTextScalePercent = SETTINGS.style.minLabelTextScalePercent;
  //step is 20 from 60 to 200 is 8 steps
  private textScaleSelectorThumbStrings = [
    "-40%",
    "-20%",
    "0%",
    "20%",
    "40%",
    "60%",
    "80%",
    "100%"
  ];

  private styleDataAgreement = true;
  private disableStyleSelectorUndoButton = true;

  //Many of the label style will not be commonly modified so create a button/variable for
  // the user to click to show more of the Label Styling options
  private showMoreLabelStyles = false;
  private moreOrLessText = i18n.t("style.moreStyleOptions"); // The text for the button to toggle between less/more options

  // Using deep watcher, VueJS does not keep track the old object
  // We have to manage it ourself
  private activeStyleOptions: StyleOptions | null = null;
  private pastStyleOptions: StyleOptions | null = null;
  private maxLabelDisplayTextLength = SETTINGS.label.maxLabelDisplayTextLength;
  private labelDisplayTextErrorMessageKey = "";
  private labelDisplayTestResults = [true, true];

  private maxLabelDisplayCaptionLength =
    SETTINGS.label.maxLabelDisplayCaptionLength;
  private labelDisplayCaptionErrorMessageKey = "";
  private labelDisplayCaptionTestResults = [true, true];

  private labelDisplayModeItems: labelDisplayModeItem[] = [
    {
      text: i18n.t("style.labelDisplayModes.nameOnly"),
      value: LabelDisplayMode.NameOnly,
      optionRequiresMeasurementValueToExist: false,
      optionRequiresCaptionToExist: false
    },
    {
      text: i18n.t("style.labelDisplayModes.captionOnly"),
      value: LabelDisplayMode.CaptionOnly,
      optionRequiresMeasurementValueToExist: false,
      optionRequiresCaptionToExist: true
    },
    {
      text: i18n.t("style.labelDisplayModes.valueOnly"),
      value: LabelDisplayMode.ValueOnly,
      optionRequiresMeasurementValueToExist: true,
      optionRequiresCaptionToExist: false
    },
    {
      text: i18n.t("style.labelDisplayModes.nameAndCaption"),
      value: LabelDisplayMode.NameAndCaption,
      optionRequiresMeasurementValueToExist: false,
      optionRequiresCaptionToExist: true
    },
    {
      text: i18n.t("style.labelDisplayModes.nameAndValue"),
      value: LabelDisplayMode.NameAndValue,
      optionRequiresMeasurementValueToExist: true,
      optionRequiresCaptionToExist: false
    }
  ];

  private labelTextFamilyItems = [
    {
      text: i18n.t("style.genericSanSerif"),
      value: "sans/-serif"
    },
    {
      text: i18n.t("style.genericSerif"),
      value: "serif"
    },
    {
      text: i18n.t("style.monospace"),
      value: "monospace"
    },
    {
      text: i18n.t("style.cursive"),
      value: "cursive"
    },
    {
      text: i18n.t("style.fantasy"),
      value: "fantasy"
    }
  ];

  private labelTextStyleItems = [
    {
      text: i18n.t("style.normal"),
      value: "normal"
    },
    {
      text: i18n.t("style.italic"),
      value: "italic"
    },
    {
      text: i18n.t("style.bold"),
      value: "bold"
    }
  ];

  private labelTextDecorationItems = [
    {
      text: i18n.t("style.none"),
      value: "none"
    },
    {
      text: i18n.t("style.underline"),
      value: "underline"
    },
    {
      text: i18n.t("style.strikethrough"),
      value: "strikethrough"
    },
    {
      text: i18n.t("style.overline"),
      value: "overline"
    }
  ];

  //step is Pi/8 from -pi to pi is 17 steps
  private textRotationSelectorThumbStrings = [
    "-180" + "\u{00B0}",
    "-157.5" + "\u{00B0}",
    "-135" + "\u{00B0}",
    "-112.5" + "\u{00B0}",
    "-90" + "\u{00B0}",
    "-67.5" + "\u{00B0}",
    "-45" + "\u{00B0}",
    "-22.5" + "\u{00B0}",
    "0" + "\u{00B0}",
    "+22.5" + "\u{00B0}",
    "+45" + "\u{00B0}",
    "+67.5" + "\u{00B0}",
    "+90" + "\u{00B0}",
    "+112.5" + "\u{00B0}",
    "+135" + "\u{00B0}",
    "+157.5" + "\u{00B0}",
    "+180" + "\u{00B0}"
  ];

  // private hslaStrokeColorObject: hslaColorType = { h: 0, s: 1, l: 1, a: 0.001 }; // Color for Vuetify Color picker NOTE: setting a=0 creates the following error:
  // create a circle, open the style panel, select the circle when the basic panel is open, switch to the foreground panel, the selected circle has a displayed opacity of 0 --
  // that is the blinking is between nothing and a red circle glowing circle) The color picker display is correct though... strange!
  // private hslaFillColorObject: hslaColorType = { h: 0, s: 1, l: 1, a: 0.001 }; // Color for Vuetify Color picker
  private hslaLabelFrontFillColorObject: hslaColorType = {
    h: 0,
    s: 1,
    l: 1,
    a: 0.001
  };
  private hslaLabelBackFillColorObject: hslaColorType = {
    h: 0,
    s: 1,
    l: 1,
    a: 0.001
  }; // Color for Vuetify Color picker

  private commonStyleProperties: Array<string> = [];

  constructor() {
    super();
  }

  /** mounted() is part of VueJS lifecycle hooks */
  mounted(): void {
    // Pass any selected objects when Label Panel is mounted to the onSelection change
    this.onSelectionChanged(this.selectedSENodules);
    //  Mount a save listener
    EventBus.listen("save-style-state", this.saveStyleState);
    // EventBus.listen("set-active-style-panel", this.setActivePanel);
  }

  get allLabelsShowing(): boolean {
    return this.selectedSENodules.every(node => {
      if (node.isLabelable()) {
        return ((node as unknown) as Labelable).label!.showing;
      } else {
        return true;
      }
    });
  }

  @Watch("hslaLabelFrontFillColorObject", { deep: true })
  onFrontFillColorChange(x: hslaColorType): void {
    if (this.activeStyleOptions) {
      Vue.set(
        this.activeStyleOptions,
        "labelFrontFillColor",
        Nodule.convertHSLAObjectToString(x)
      );
    }
  }

  @Watch("hslaLabelBackFillColorObject", { deep: true })
  onBackFillColorChange(x: hslaColorType): void {
    if (this.activeStyleOptions) {
      Vue.set(
        this.activeStyleOptions,
        "labelBackFillColor",
        Nodule.convertHSLAObjectToString(x)
      );
    }
  }
  toggleShowMoreLabelStyles(): void {
    this.showMoreLabelStyles = !this.showMoreLabelStyles;
    if (!this.showMoreLabelStyles) {
      this.moreOrLessText = i18n.t("style.moreStyleOptions");
    } else {
      this.moreOrLessText = i18n.t("style.lessStyleOptions");
    }
  }
  toggleAllLabelsVisibility(): void {
    EventBus.fire("toggle-label-visibility", { fromPanel: true });
  }

  // These methods are linked to the Style Data fade-in-card
  labelDisplayTextCheck(): boolean {
    return true;
    // this.labelDisplayTestResults[0] = this.labelDisplayTestResults[1];
    // this.labelDisplayTestResults[1] =
    //   this.labelDisplayText !== undefined &&
    //   (this.labelDisplayText.length === 0 ||
    //     this.labelDisplayText.length <=
    //       SETTINGS.label.maxLabelDisplayTextLength);
    // // const translation = i18n.t("style.maxMinLabelDisplayTextLengthWarning", {
    // //   max: SETTINGS.label.maxLabelDisplayTextLength
    // // });
    // if (!this.labelDisplayTestResults[0]) {
    //   this.labelDisplayTextErrorMessageKey =
    //     "style.maxMinLabelDisplayTextLengthWarning";
    // } else {
    //   this.labelDisplayTextErrorMessageKey = "";
    // }
    // // set the label text to the first 6 characters
    // this.labelDisplayText =
    //   this.labelDisplayText !== undefined
    //     ? this.labelDisplayText.slice(
    //         0,
    //         SETTINGS.label.maxLabelDisplayTextLength
    //       )
    //     : "";
    // return this.labelDisplayTestResults[1]; // || translation;
  }
  labelDisplayCaptionCheck(): boolean {
    // this.labelDisplayCaptionTestResults[0] = this.labelDisplayCaptionTestResults[1];
    // this.labelDisplayCaptionTestResults[1] =
    //   this.labelDisplayCaption !== undefined &&
    //   this.labelDisplayCaption.length <=
    //     SETTINGS.label.maxLabelDisplayCaptionLength;
    // // display the error message
    // if (!this.labelDisplayCaptionTestResults[0]) {
    //   this.labelDisplayCaptionErrorMessageKey =
    //     "style.maxMinLabelDisplayCaptionLengthWarning";
    // } else {
    //   this.labelDisplayCaptionErrorMessageKey = "";
    // }
    // // const translation = i18n.t("style.maxMinLabelDisplayCaptionLengthWarning", {
    // //   max: SETTINGS.label.maxLabelDisplayCaptionLength
    // // });
    // this.labelDisplayCaption =
    //   this.labelDisplayCaption !== undefined
    //     ? this.labelDisplayCaption.slice(
    //         0,
    //         SETTINGS.label.maxLabelDisplayCaptionLength
    //       )
    //     : "";
    // return this.labelDisplayCaptionTestResults[1];
    return true;
  }
  resetStyleDataToDefaults(): void {
    const selected: SENodule[] = [];

    this.selectedSENodules.forEach(node => {
      selected.push(((node as unknown) as Labelable).label!);
    });

    const defaultStyleStates = SEStore.getDefaultStyleState(
      StyleEditPanels.Label
    );

    for (let i = 0; i < selected.length; i++) {
      SEStore.changeStyle({
        selected: [selected[i]],
        panel: StyleEditPanels.Label,
        payload: {
          ...defaultStyleStates[i]
        }
      });
    }
    this.setStyleDataSelectorState(defaultStyleStates);
  }
  clearStyleData(): void {
    const selected: SENodule[] = [];
    this.selectedSENodules.forEach(node => {
      selected.push(((node as unknown) as Labelable).label!);
    });

    const initialStyleStates = SEStore.getInitialStyleState(
      StyleEditPanels.Label
    );
    for (let i = 0; i < selected.length; i++) {
      SEStore.changeStyle({
        selected: [selected[i]],
        panel: StyleEditPanels.Label,
        payload: {
          ...initialStyleStates[i]
        }
      });
    }
    this.setStyleDataSelectorState(initialStyleStates);
  }

  setStyleDataSelectorState(styleState: StyleOptions[]): void {
    this.disableStyleSelectorUndoButton = true;
    this.styleDataAgreement = true;
    // Make sure that across the selected objects all their properties agree
    //   If one property on one selected is undefined, then set styleDataAgreement=false
    //   If all properties are defined,but one property doesn't agree across all selected then set styleDataAgreement=false
    // start at 1 because the first styleState always agrees with itself -- in the case of only one object selected, this shouldn't execute
    if (styleState.length > 1) {
      this.styleDataAgreement = this.commonStyleProperties.every(
        (style: string) => {
          // Record the value of the style on the first style state
          let value = (styleState[0] as any)[style];
          // screen for undefined - if undefined then this is not a property that is going to be set by the style panel for this selection of objects

          return !styleState.every(
            styleObject => (styleObject as any)[style] === value
          );
        }
      );
    }
  }

  disableStyleDataSelector(totally: boolean): void {
    this.styleDataAgreement = false;
    this.disableStyleSelectorUndoButton = true;
  }

  setStyleDataAgreement(): void {
    this.styleDataAgreement = true;
  }

  /**
   * Determines if the commonStyleProperties has the given input of type Styles
   * The input is an enum of type Styles
   * This is the key method for the hasXXX() methods which control the display of the XXX fade-in-card
   */
  hasStyle(property: RegExp): boolean {
    return this.commonStyleProperties.some((z: string) => z.match(property));
  }

  //This controls if the labelDisplayModeItems include ValueOnly and NameAndValue (When no value in the Label)\
  // and if the caption is empty, NameAndCaption and Caption Only are not options
  labelDisplayModeValueFilter(
    items: labelDisplayModeItem[]
  ): labelDisplayModeItem[] {
    const returnItems: labelDisplayModeItem[] = [];
    if (
      this.selectedSENodules.every(node => {
        if (node.isLabelable()) {
          return ((node as unknown) as Labelable).label!.ref.value.length !== 0;
        } else {
          return true;
        }
      })
    ) {
      // value is present in all labels so pass long all options in labelDisplayModeItems
      returnItems.push(...items);
    } else {
      // value is not present in all labels so pass long all options in labelDisplayModeItems that don't have value in them
      returnItems.push(
        ...items.filter(itm => !itm.optionRequiresMeasurementValueToExist)
      );
    }

    if (
      (this.selectedSENodules as SENodule[]).every(node => {
        if (node.isLabelable()) {
          return (
            ((node as unknown) as Labelable).label!.ref.caption.trim()
              .length !== 0
          );
        } else {
          return true;
        }
      })
    ) {
      // caption is present in all labels
      return returnItems;
    } else {
      // caption is not present in all labels so pass long all options in labelDisplayModeItems that don't have caption in them
      return returnItems.filter(itm => !itm.optionRequiresCaptionToExist);
    }
  }

  @Watch("activePanel")
  private activePanelChange(): void {
    if (
      this.activePanel !== undefined &&
      StyleEditPanels.Label === this.activePanel
    ) {
      this.onSelectionChanged(this.selectedSENodules);
    }
  }
  /**
   * This is an example of the two-way binding that is provided by the Vuex store. As this is a Vue component we can Watch variables, and
   * when they change, this method will execute in response to that change.
   */
  @Watch("selectedSENodules")
  onSelectionChanged(newSelection: SENodule[]): void {
    console.log(
      "LabelStyle: onSelectionChanged",
      newSelection.length,
      " object selected"
    );

    // Before changing the selections save the state for an undo/redo command (if necessary)
    // this.saveStyleState();

    this.commonStyleProperties.splice(0);
    this.activeStyleOptions = null;
    if (newSelection.length === 0) {
      //totally disable the selectors in this component
      this.disableStyleDataSelector(true);
      SEStore.setOldStyleSelection([]);
      return;
    }

    // record the new selections in the old
    SEStore.setOldStyleSelection([]);
    // We are on the label panel so push the labels onto the oldSelections

    const oldSelection: SENodule[] = [];
    newSelection.forEach((obj: SENodule) =>
      oldSelection.push(((obj as unknown) as Labelable).label!)
    );
    this.selectedLabels.splice(0);
    this.selectedLabels.push(
      ...(oldSelection as SELabel[]).map((s: SELabel) => s.ref)
    );
    SEStore.setOldStyleSelection(oldSelection);

    // Create a list of the common properties of the selected objects.
    // commonStyleProperties is a number (corresponding to an enum) array
    // The customStyles method returns a list of the styles the are adjustable for that object
    this.commonStyleProperties.splice(0);

    const styleOptionsOfSelected = oldSelection
      .map((obj: SENodule) => obj as SELabel)
      .map((obj: SELabel) => {
        return obj.ref.currentStyleState(this.panel);
      });

    this.activeStyleOptions = { ...styleOptionsOfSelected[0] }; // Create a clone
    console.debug("Saved as active style options", {
      ...this.activeStyleOptions
    });

    // Use flatmap (1-to-many) to compile all the style properties of
    // of the selected objects
    const commonProps = styleOptionsOfSelected.flatMap((opt: StyleOptions) =>
      Object.getOwnPropertyNames(opt).filter((s: string) => !s.startsWith("__"))
    );
    const uniqueProps = new Set(commonProps);
    this.commonStyleProperties.push(...uniqueProps);

    // Get the initial and default style state of the object for undo/redo and buttons to revert to initial style.
    // Put this in the store so that it is availble to *all* panels. Get the front and back information at the same time.

    SEStore.recordStyleState({
      selected: newSelection.map(obj => ((obj as unknown) as Labelable).label!),
      backContrast: Nodule.getBackStyleContrast()
    });

    SEStore.setSavedFromPanel(StyleEditPanels.Label);
    //Set the initial state of the fade-in-card/selectors (checking to see if the property is the same across all selected objects)
    this.setStyleDataSelectorState(
      // SEStore.getInitialStyleState(StyleEditPanels.Label)
      styleOptionsOfSelected
    );
  }

  // Use a deep wather because we are observing an object!
  @Watch("activeStyleOptions", { deep: true, immediate: true })
  onActiveStyleOptionsChanged(newVal: StyleOptions | null): void {
    if (newVal === null) return;
    const oldProps: Set<string> = new Set(
      this.pastStyleOptions
        ? Object.getOwnPropertyNames(this.pastStyleOptions).filter(
            (s: string) => !s.startsWith("__")
          )
        : []
    );
    const newProps: Set<string> = new Set(
      newVal
        ? Object.getOwnPropertyNames(newVal).filter(
            (s: string) => !s.startsWith("__")
          )
        : []
    );
    const removedProps = [...oldProps].filter((p: string) => !newProps.has(p));
    if (removedProps.length > 0 && this.selectedLabels.length > 0)
      throw new Error(
        "Removing style options from selections is not currently supported"
      );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const addedProps = [...newProps].filter((p: string) => !oldProps.has(p));
    if (addedProps.length > 0)
      console.debug("Adding some new props", addedProps);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const updatedProps = [...newProps].filter((p: string) => oldProps.has(p));
    const updatePayload: StyleOptions = { ...newVal };
    [...updatedProps].forEach((p: string) => {
      const a = (this.pastStyleOptions as any)[p];
      const b = (newVal as any)[p];

      // Exclude the property from the payload if they do not change
      if (a === b) {
        // console.debug(`Excluding ${p} from payload`);
        delete (updatePayload as any)[p];
      } else console.debug(`Property ${p} is update from ${a} to ${b}`);
    });

    /* If multiple labels are selected, do not update the name */
    if (this.selectedLabels.length > 1) delete updatePayload.labelDisplayText;

    this.selectedLabels.forEach((z: Label) => {
      z.updateStyle(this.panel, { ...updatePayload });
    });
    this.pastStyleOptions = { ...newVal };
  }

  saveStyleState(): void {
    // There must be an old selection in order for there to be a change to save
    const oldSelection = this.oldStyleSelection;
    if (oldSelection.length > 0) {
      //Record the current state of each Nodule
      this.currentStyleStates.splice(0);

      oldSelection.forEach((seNodule: SENodule) => {
        if (seNodule.ref !== undefined)
          this.currentStyleStates.push(
            seNodule.ref.currentStyleState(this.styleSavedFromPanel)
          );
      });
      const initialStyleStates = SEStore.getInitialStyleState(
        this.styleSavedFromPanel
      );
      const initialBackStyleContrast = this.initialBackStyleContrast;
      if (
        !this.areEquivalentStyles(
          this.currentStyleStates,
          initialStyleStates
        ) ||
        initialBackStyleContrast != Nodule.getBackStyleContrast()
      ) {
        console.log("Issued style save command");
        // Add the label of the
        new StyleNoduleCommand(
          oldSelection,
          this.styleSavedFromPanel,
          this.currentStyleStates,
          initialStyleStates,
          Nodule.getBackStyleContrast(),
          initialBackStyleContrast
        ).push();
      }
      // clear the old selection so that this save style state will not be executed again until changes are made.
      SEStore.setOldStyleSelection([]);
    }
  }

  areEquivalentStyleOptions(
    opt1: StyleOptions | undefined,
    opt2: StyleOptions | undefined
  ): boolean {
    function arrayEquivalentArray(
      arr1: Array<string | number>,
      arr2: Array<string | number>
    ): boolean {
      return false;
    }

    const aProps = opt1
      ? Object.getOwnPropertyNames(opt1).filter(
          (s: string) => !s.startsWith("__")
        )
      : []; // Set to an empty array of the arg is undefined or null
    const bProps = opt2
      ? Object.getOwnPropertyNames(opt2).filter(
          (s: string) => !s.startsWith("__")
        )
      : []; // Set to an empty array of the arg is undefined or null
    if (aProps.length !== bProps.length)
      throw new Error(
        "Attempted to compare two different length StyleOptions in areEquivalentStyles"
      );

    // Verify equivalence of all the style properties
    return [...aProps].every((p: string) => {
      const aVal = (aProps as any)[p];
      const bVal = (bProps as any)[p];
      if (typeof aVal !== typeof bVal) return false;
      if (typeof aVal == "number") return Math.abs(aVal - bVal) < 1e-8;
      else if (Array.isArray(aVal) && Array.isArray(bVal))
        return arrayEquivalentArray(aVal, bVal);
      else if (typeof aVal === "object")
        throw new Error("Object comparison is not currently supported");
      else return aVal === bVal;
    });
  }

  areEquivalentStyles(
    styleStates1: StyleOptions[],
    styleStates2: StyleOptions[]
  ): boolean {
    console.debug("areEquivalentStyle");
    if (styleStates1.length !== styleStates2.length) {
      throw new Error(
        "Attempted to compare two different length styles in areEquivalentStyles"
      );
    }

    // The outer every runs on the two input arguments
    return styleStates1.every((a: StyleOptions, i: number) =>
      this.areEquivalentStyleOptions(a, styleStates2[i])
    );
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
