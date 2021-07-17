<template>
  <div>

    <!-- Label(s) not showing overlay -- higher z-index rendered on top -- covers entire panel including the header-->
    <OverlayWithFixButton v-if="!allLabelsShowing()"
      z-index="100"
      i18n-title-line="style.labelNotVisible"
      i18n-subtitle-line="style.clickToMakeLabelsVisible"
      i18n-button-label="style.makeLabelsVisible"
      i18n-button-tool-tip="style.labelsNotShowingToolTip"
      @click="toggleAllLabelsVisibility">
    </OverlayWithFixButton>

    <!-- Label Text Options -->
    <fade-in-card :showWhen="hasLabelStyle">
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
      <v-text-field v-model="labelDisplayText"
        v-bind:label="$t('style.labelText')"
        :counter="maxLabelDisplayTextLength"
        filled
        outlined
        dense
        v-bind:error-messages="$t(labelDisplayTextErrorMessageKey, { max: maxLabelDisplayTextLength })"
        :rules="[labelDisplayTextCheck]"
        @keyup="setlabelDisplayTextChange(); onLabelStyleDataChanged()"
        @blur="setlabelDisplayTextChange(); onLabelStyleDataChanged()"
        @change="setlabelDisplayTextChange(); onLabelStyleDataChanged()">
      </v-text-field>

      <!-- Label Caption Selections (only if more label style selected) -->
      <div v-show="showMoreLabelStyles">
        <v-text-field v-model="labelDisplayCaption"
          v-bind:label="$t('style.labelCaption')"
          :counter="maxLabelDisplayCaptionLength"
          filled
          outlined
          dense
          v-bind:error-messages="$t(labelDisplayCaptionErrorMessageKey, { max: maxLabelDisplayCaptionLength })"
          :rules="[labelDisplayCaptionCheck]"
          @keyup="setlabelDisplayCaptionChange(); onLabelStyleDataChanged()"
          @blur="setlabelDisplayCaptionChange(); onLabelStyleDataChanged()"
          @change="setlabelDisplayCaptionChange(); onLabelStyleDataChanged()">
        </v-text-field>
      </div>

      <!-- Label Diplay Mode Selections -->
      <v-select v-model="labelDisplayMode"
        :class="showMoreLabelStyles ? '' : 'pa-0'"
        v-bind:label="$t('style.labelDisplayMode')"
        :items="labelDisplayModeValueFilter(labelDisplayModeItems)"
        filled
        outlined
        dense
        @blur="setlabelDisplayModeChange(); onLabelStyleDataChanged()"
        @change="setlabelDisplayModeChange(); onLabelStyleDataChanged()">
      </v-select>

      <!-- Label Text Family Selections (only if more label style selected) -->
      <div v-show="showMoreLabelStyles">
        <v-select v-model="labelTextFamily"
          v-bind:label="$t('style.labelTextFamily')"
          :items="labelTextFamilyItems"
          filled
          outlined
          dense
          @blur="setlabelTextFamilyChange(); onLabelStyleDataChanged()"
          @change="setlabelTextFamilyChange(); onLabelStyleDataChanged()">
        </v-select>
      </div>

      <!-- Label Text Style Selections (only if more label style selected) -->
      <div v-show="showMoreLabelStyles">
        <v-select v-model="labelTextStyle"
          v-bind:label="$t('style.labelTextStyle')"
          :items="labelTextStyleItems"
          filled
          outlined
          dense
          @blur="setlabelTextStyleChange(); onLabelStyleDataChanged()"
          @change="setlabelTextStyleChange(); onLabelStyleDataChanged()">
        </v-select>
      </div>

      <!-- Label Text Decoration Selections (only if more label style selected) -->
      <div v-show="showMoreLabelStyles">
        <v-select v-model="labelTextDecoration"
          v-bind:label="$t('style.labelTextDecoration')"
          :items="labelTextDecorationItems"
          filled
          outlined
          dense
          @blur="setlabelTextDecorationChange(); onLabelStyleDataChanged()"
          @change="setlabelTextDecorationChange(); onLabelStyleDataChanged()">
        </v-select>
      </div>

      <!-- Undo and Reset to Defaults buttons -->
      <v-container class="pa-0 ma-0">
        <v-row justify="end"
          no-gutters>
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
      </v-container>

    </fade-in-card>

    <!-- Label Text Scale Number Selector-->
    <fade-in-card
      :showWhen="hasLabelTextScalePercent && showMoreLabelStyles">
      <NumberSelector id="textScalePercentSlider"
        v-bind:data.sync="labelTextScalePercent"
        style-name="labelTextScalePercent"
        title-key="style.labelTextScalePercent"
        panel-front-key="style.front"
        panel-back-key="style.back"
        v-bind:min-value="minLabelTextScalePercent"
        v-bind:max-value="maxLabelTextScalePercent"
        v-bind:step="20"
        :temp-style-states="tempStyleStates"
        :panel="panel"
        :active-panel="activePanel"
        :thumb-string-values="textScaleSelectorThumbStrings"
        :use-dynamic-back-style-from-selector="false">
      </NumberSelector>
    </fade-in-card>

    <!-- Label Text Rotation Number Selector-->
    <fade-in-card :showWhen="hasLabelTextRotation && showMoreLabelStyles">
      <NumberSelector id="labelTextRotationSlider"
        v-bind:data.sync="labelTextRotation"
        style-name="labelTextRotation"
        title-key="style.labelTextRotation"
        v-bind:min-value="-3.14159"
        v-bind:max-value="3.14159"
        v-bind:step="0.39269875"
        :temp-style-states="tempStyleStates"
        :panel="panel"
        :active-panel="activePanel"
        :thumb-string-values="textRotationSelectorThumbStrings"
        :use-dynamic-back-style-from-selector="false">
      </NumberSelector>
    </fade-in-card>

    <!-- Label Front Fill Color Selector -->
    <fade-in-card
      :showWhen="hasLabelFrontFillColor && showMoreLabelStyles">

      <ColorSelector title-key="style.labelFrontFillColor"
        panel-front-key=""
        panel-back-key=""
        style-name="labelFrontFillColor"
        :data.sync="hslaLabelFrontFillColorObject"
        :temp-style-states="tempStyleStates"
        :panel="panel"
        :active-panel="activePanel"
        :use-dynamic-back-style-from-selector="false"></ColorSelector>
    </fade-in-card>

    <!-- Label Back Fill Color Selector : -->
    <fade-in-card :showWhen="hasLabelBackFillColor&& showMoreLabelStyles">
      <ColorSelector title-key="style.labelBackFillColor"
        panel-front-key="style.front"
        panel-back-key="style.back"
        style-name="labelBackFillColor"
        :data.sync="hslaLabelBackFillColorObject"
        :temp-style-states="tempStyleStates"
        :panel="panel"
        :active-panel="activePanel"
        :use-dynamic-back-style-from-selector="true"></ColorSelector>
    </fade-in-card>

    <!-- Show more or less styling options -->
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

  </div>

</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Watch, Prop } from "vue-property-decorator";
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
import NumberSelector from "@/components/NumberSelector.vue";
// import TextInputSelector from "@/components/TextInputSelector.vue";
import ColorSelector from "@/components/ColorSelector.vue";
import i18n from "../i18n";
import HintButton from "@/components/HintButton.vue";
import OverlayWithFixButton from "@/components/OverlayWithFixButton.vue";
import { SEStore } from "@/store";
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

  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;
  /**
   * There are many style options. In the case that there
   * are more than one object selected, the XXXAgreement boolean indicates if the XXX property is *initially* the
   * same across the selected objects. In the case that they are not initially the same, the cooresponding adjustment tool
   * is display in a different way than the usual default.
   */

  private labelTextScalePercent: number | undefined = 100;
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
  private totalyDisableStyleDataSelector = false;
  private disableStyleSelectorUndoButton = true;

  //Many of the label style will not be commonly modified so create a button/variable for
  // the user to click to show more of the Label Styling options
  private showMoreLabelStyles = false;
  private moreOrLessText = i18n.t("style.moreStyleOptions"); // The text for the button to toggle between less/more options

  private labelDisplayText: string | undefined = "";
  private labelDisplayTextChange = false;
  private maxLabelDisplayTextLength = SETTINGS.label.maxLabelDisplayTextLength;
  private labelDisplayTextErrorMessageKey = "";
  private labelDisplayTestResults = [true, true];

  private labelDisplayCaption: string | undefined = "";
  private labelDisplayCaptionChange = false;
  private maxLabelDisplayCaptionLength =
    SETTINGS.label.maxLabelDisplayCaptionLength;
  private labelDisplayCaptionErrorMessageKey = "";
  private labelDisplayCaptionTestResults = [true, true];

  private labelDisplayMode: LabelDisplayMode | undefined =
    LabelDisplayMode.NameOnly;
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
  private labelDisplayModeChange = false;

  private labelTextFamily: string | undefined = "";
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
  private labelTextFamilyChange = false;

  private labelTextStyle: string | undefined = "";
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
  private labelTextStyleChange = false;

  private labelTextDecoration: string | undefined = "";
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
  private labelTextDecorationChange = false;

  private labelTextRotation: number | undefined = 0;
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

  private hslaStrokeColorObject: hslaColorType = { h: 0, s: 1, l: 1, a: 0.001 }; // Color for Vuetify Color picker NOTE: setting a=0 creates the following error:
  // create a circle, open the style panel, select the circle when the basic panel is open, switch to the foreground panel, the selected circle has a displayed opacity of 0 --
  // that is the blinking is between nothing and a red circle glowing circle) The color picker display is correct though... strange!
  private hslaFillColorObject: hslaColorType = { h: 0, s: 1, l: 1, a: 0.001 }; // Color for Vuetify Color picker
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

  commonStyleProperties: Array<string> = [];

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
  toggleShowMoreLabelStyles(): void {
    this.showMoreLabelStyles = !this.showMoreLabelStyles;
    if (!this.showMoreLabelStyles) {
      this.moreOrLessText = i18n.t("style.moreStyleOptions");
    } else {
      this.moreOrLessText = i18n.t("style.lessStyleOptions");
    }
  }
  allLabelsShowing(): boolean {
    return this.selectedSENodules.every(node => {
      if (node.isLabelable()) {
        return ((node as unknown) as Labelable).label!.showing;
      } else {
        return true;
      }
    });
  }
  toggleAllLabelsVisibility(): void {
    EventBus.fire("toggle-label-visibility", { fromPanel: true });
  }

  // These methods are linked to the Style Data fade-in-card
  labelDisplayTextCheck(): boolean {
    this.labelDisplayTestResults[0] = this.labelDisplayTestResults[1];
    this.labelDisplayTestResults[1] =
      this.labelDisplayText !== undefined &&
      (this.labelDisplayText.length === 0 ||
        this.labelDisplayText.length <=
          SETTINGS.label.maxLabelDisplayTextLength);
    // const translation = i18n.t("style.maxMinLabelDisplayTextLengthWarning", {
    //   max: SETTINGS.label.maxLabelDisplayTextLength
    // });
    if (!this.labelDisplayTestResults[0]) {
      this.labelDisplayTextErrorMessageKey =
        "style.maxMinLabelDisplayTextLengthWarning";
    } else {
      this.labelDisplayTextErrorMessageKey = "";
    }
    // set the label text to the first 6 characters
    this.labelDisplayText =
      this.labelDisplayText !== undefined
        ? this.labelDisplayText.slice(
            0,
            SETTINGS.label.maxLabelDisplayTextLength
          )
        : "";
    return this.labelDisplayTestResults[1]; // || translation;
  }
  labelDisplayCaptionCheck(): boolean {
    this.labelDisplayCaptionTestResults[0] = this.labelDisplayCaptionTestResults[1];
    this.labelDisplayCaptionTestResults[1] =
      this.labelDisplayCaption !== undefined &&
      this.labelDisplayCaption.length <=
        SETTINGS.label.maxLabelDisplayCaptionLength;
    // display the error message
    if (!this.labelDisplayCaptionTestResults[0]) {
      this.labelDisplayCaptionErrorMessageKey =
        "style.maxMinLabelDisplayCaptionLengthWarning";
    } else {
      this.labelDisplayCaptionErrorMessageKey = "";
    }
    // const translation = i18n.t("style.maxMinLabelDisplayCaptionLengthWarning", {
    //   max: SETTINGS.label.maxLabelDisplayCaptionLength
    // });
    this.labelDisplayCaption =
      this.labelDisplayCaption !== undefined
        ? this.labelDisplayCaption.slice(
            0,
            SETTINGS.label.maxLabelDisplayCaptionLength
          )
        : "";
    return this.labelDisplayCaptionTestResults[1];
  }
  resetStyleDataToDefaults(): void {
    const selected: SENodule[] = [];
    // This number selector is on the label panel, so all changes are directed at the label(s).

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
    // This number selector is on the label panel, so all changes are directed at the label(s).

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
  onLabelStyleDataChanged(): void {
    this.disableStyleSelectorUndoButton = false;

    const selected: SENodule[] = [];
    // This is always directed at labels!
    this.selectedSENodules.forEach(node => {
      selected.push(((node as unknown) as Labelable).label!);
    });

    if (
      this.labelDisplayText !== undefined &&
      this.labelDisplayText.trim().length === 0
    ) {
      const defaultStyleStates = SEStore.getDefaultStyleState(
        StyleEditPanels.Label
      );
      const translation = i18n.t("style.renameLabels") as string;
      this.labelDisplayText =
        selected.length <= 1
          ? defaultStyleStates[0].labelDisplayText
          : translation;
      for (let i = 0; i < selected.length; i++) {
        SEStore.changeStyle({
          selected: [selected[i]],
          panel: StyleEditPanels.Label,
          payload: {
            labelDisplayText: defaultStyleStates[i].labelDisplayText
          }
        });
      }
    }

    // if there has been some change then change the style
    if (
      this.labelDisplayTextChange ||
      this.labelDisplayCaptionChange ||
      this.labelDisplayModeChange ||
      this.labelTextFamilyChange ||
      this.labelTextStyleChange ||
      this.labelTextDecorationChange
    ) {
      SEStore.changeStyle({
        selected: selected,
        panel: StyleEditPanels.Label,
        payload: {
          labelTextStyle: this.labelTextStyleChange
            ? this.labelTextStyle
            : undefined,
          labelTextFamily: this.labelTextFamilyChange
            ? this.labelTextFamily
            : undefined,
          labelTextDecoration: this.labelTextDecorationChange
            ? this.labelTextDecoration
            : undefined,
          labelDisplayText: this.labelDisplayTextChange
            ? this.labelDisplayText
            : undefined,
          labelDisplayCaption: this.labelDisplayCaptionChange
            ? this.labelDisplayCaption
            : undefined,
          labelDisplayMode: this.labelDisplayModeChange
            ? this.labelDisplayMode
            : undefined
        }
      });
    }
    this.labelDisplayTextChange = false;
    this.labelDisplayCaptionChange = false;
    this.labelDisplayModeChange = false;
    this.labelTextFamilyChange = false;
    this.labelTextStyleChange = false;
    this.labelTextDecorationChange = false;
  }
  setStyleDataSelectorState(styleState: StyleOptions[]): void {
    this.disableStyleSelectorUndoButton = true;
    this.styleDataAgreement = true;
    this.totalyDisableStyleDataSelector = false;
    // Make sure that across the selected objects all 8 properties are defined and agree
    //   If one property on one selected is undefined, then set styleDataAgreement=false, and totalyDisableStyleDataSelector = true
    //   If all properties are defined,but one property doesn't agree across all selected then set styleDataAgreement=false, and totalyDisableStyleDataSelector = false
    // start at 1 because the first styleState always agress with itself -- in the case of only one object selected, this shouldn't execute
    for (var style of [
      "labelDisplayText",
      "labelDisplayCaption",
      "labelDisplayMode",
      "labelTextFamily",
      "labelTextStyle",
      "labelTextDecoration"
    ]) {
      // Record the value of the style on the first style state
      let value = (styleState[0] as any)[style];
      // screen for undefined - if undefined then this is not a property that is going to be set by the style panel for this selection of objects
      if (value !== undefined) {
        if (
          styleState.length > 1 &&
          !styleState.every(
            styleObject => (styleObject as any)[style] === value
          )
        ) {
          // The style property exists on the selected objects but value
          // doesn't agree (so don't totally disable the selector)
          this.disableStyleDataSelector(false);
          break;
        }
        // If the execution reaches here, the style exists on all style states and is the same in all style states
      } else {
        // The style property doesn't exists on the selected objects so totally disable the selector
        this.disableStyleDataSelector(true);
        break;
      }
    }
    // Now set the displays of the text field (labelDisplayName), text area(labelDisplayCaption),
    //  and combo-boxes (font, family, style, decoration)
    if (!this.totalyDisableStyleDataSelector && this.styleDataAgreement) {
      this.labelDisplayText = (styleState[0] as StyleOptions).labelDisplayText;
      this.labelDisplayCaption = (styleState[0] as StyleOptions).labelDisplayCaption;
      this.labelDisplayMode = (styleState[0] as StyleOptions).labelDisplayMode;
      this.labelTextFamily = (styleState[0] as StyleOptions).labelTextFamily;
      this.labelTextStyle = (styleState[0] as StyleOptions).labelTextStyle;
      this.labelTextDecoration = (styleState[0] as StyleOptions).labelTextDecoration;
    }
  }
  disableStyleDataSelector(totally: boolean): void {
    this.styleDataAgreement = false;
    this.disableStyleSelectorUndoButton = true;
    this.totalyDisableStyleDataSelector = totally;
    // Set the display disabled values
    this.labelDisplayText = "";
    this.labelDisplayCaption = "";
    this.labelDisplayMode = undefined;
    this.labelTextFamily = "";
    this.labelTextStyle = "";
    this.labelTextDecoration = "";
  }
  setlabelDisplayTextChange(): void {
    this.labelDisplayTextChange = true;
  }
  setlabelDisplayCaptionChange(): void {
    this.labelDisplayCaptionChange = true;
  }
  setlabelDisplayModeChange(): void {
    this.labelDisplayModeChange = true;
  }
  setlabelTextFamilyChange(): void {
    this.labelTextFamilyChange = true;
  }
  setlabelTextStyleChange(): void {
    this.labelTextStyleChange = true;
  }
  setlabelTextDecorationChange(): void {
    this.labelTextDecorationChange = true;
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

  get hasStrokeColor(): boolean {
    return this.hasStyle(/strokeColor/i);
  }
  get hasFillColor(): boolean {
    return this.hasStyle(/fillColor/i);
  }

  get hasStrokeWidthPercent(): boolean {
    return this.hasStyle(/strokeWidthPercent/i);
  }
  get hasLabelStyle(): boolean {
    return this.hasStyle(/^label/);
  }
  get hasLabelTextRotation(): boolean {
    return this.hasStyle(/labelTextRotation/i);
  }
  get hasLabelTextScalePercent(): boolean {
    return this.hasStyle(/labelTextScalePercent/i);
  }
  get hasLabelFrontFillColor(): boolean {
    return this.hasStyle(/labelFrontFillColor/i);
  }
  get hasLabelBackFillColor(): boolean {
    return this.hasStyle(/labelBackFillColor/i);
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
    console.log("LabelStyle: onSelectionChanged");

    // Before changing the selections save the state for an undo/redo command (if necessary)
    this.saveStyleState();

    this.commonStyleProperties.clear();
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
    SEStore.setOldStyleSelection(oldSelection);

    // Create a list of the common properties that the objects in the selection have.
    // commonStyleProperties is a number (corresponding to an enum) array
    // The customStyles method returns a list of the styles the are adjustable for that object
    this.commonStyleProperties.splice(0);

    // Use Typescript utility type Required<T> to change to label from an optional
    // property to a required one
    const labeledSelections: Array<Required<
      Labelable
    >> = newSelection
      .filter((n: SENodule) => n.isLabelable())
      .map((n: SENodule) => (n as unknown) as Required<Labelable>);

    if (labeledSelections.length > 0) {
      // We do have objects with labels
      const initialSet = labeledSelections[0].label.customStyles();

      // Use Array::reduce to the set intersection of all the label style props
      const commonProp = labeledSelections.reduce((
        acc: Set<string>,
        curr: Required<Labelable> /*, pos: number*/
      ) => {
        // console.debug("LabelStyle at index", pos, acc);
        const arr = [...curr.label.customStyles()].filter((prop: string) =>
          acc.has(prop)
        );
        return new Set(arr);
      }, initialSet);
      this.commonStyleProperties.push(...commonProp);
    }
    // for (let k = 0; k < values.length; k++) {
    //   if (
    //     newSelection.every((s:SENodule) =>
    //       ((s as unknown) as Labelable).label!.customStyles().has(k)
    //     )
    //   ) {
    //     this.commonStyleProperties.push(k);
    //   }
    // }

    // Get the initial and default style state of the object for undo/redo and buttons to revert to initial style.
    // Put this in the store so that it is availble to *all* panels. Get the front and back information at the same time.

    SEStore.recordStyleState({
      selected: newSelection.map(obj => ((obj as unknown) as Labelable).label!),
      backContrast: Nodule.getBackStyleContrast()
    });

    SEStore.setSavedFromPanel(StyleEditPanels.Label);
    //Set the initial state of the fade-in-card/selectors (checking to see if the property is the same across all selected objects)
    this.setStyleDataSelectorState(
      SEStore.getInitialStyleState(StyleEditPanels.Label)
    );
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

  areEquivalentStyles(
    styleStates1: StyleOptions[],
    styleStates2: StyleOptions[]
  ): boolean {
    if (styleStates1.length !== styleStates2.length) {
      throw "Attempted to compare two different length styles in areEquivalentStyles";
      //return false;
    }
    for (let i = 0; i < styleStates1.length; i++) {
      const a = styleStates1[i];
      const b = styleStates2[i];
      if (
        a.strokeWidthPercent === b.strokeWidthPercent &&
        a.strokeColor === b.strokeColor &&
        a.fillColor === b.fillColor &&
        a.dynamicBackStyle === b.dynamicBackStyle &&
        a.pointRadiusPercent === b.pointRadiusPercent &&
        a.labelDisplayText === b.labelDisplayText &&
        a.labelDisplayCaption === b.labelDisplayCaption &&
        a.labelTextStyle === b.labelTextStyle &&
        a.labelTextFamily === b.labelTextFamily &&
        a.labelTextDecoration === b.labelTextDecoration &&
        a.labelTextRotation === b.labelTextRotation &&
        a.labelTextScalePercent === b.labelTextScalePercent &&
        a.labelDisplayMode === b.labelDisplayMode &&
        a.labelFrontFillColor === b.labelFrontFillColor &&
        a.labelBackFillColor === b.labelBackFillColor
      ) {
        //now check the dash array which can be undefined, an empty array,length one array or a length two array.
        if (a.dashArray === undefined && b.dashArray === undefined) {
          break; // stop checking this pair in the array because we can conclude they are equal.
        }
        if (a.dashArray !== undefined && b.dashArray !== undefined) {
          if (a.dashArray.length === b.dashArray.length) {
            if (a.dashArray.length === 0 && b.dashArray.length === 0) {
              break; // stop checking this pair in the array because we can conclude they are equal.
            } else if (
              a.dashArray.length === 1 &&
              b.dashArray.length === 1 &&
              a.dashArray[0] === b.dashArray[0]
            ) {
              break; // stop checking this pair in the array because we can conclude they are equal.
            } else if (
              a.dashArray.length === 2 &&
              b.dashArray.length === 2 &&
              a.dashArray[0] === b.dashArray[0] &&
              a.dashArray[1] === b.dashArray[1]
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
