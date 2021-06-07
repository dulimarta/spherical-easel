<template>
  <div>

    <!-- Label(s) not showing overlay -- higher z-index rendered on top -- covers entire panel including the header-->
    <OverlayWithFixButton v-if="editModeIsLabel() && !allLabelsShowing()"
      z-index="100"
      i18n-title-line="style.labelNotVisible"
      i18n-subtitle-line="style.clickToMakeLabelsVisible"
      i18n-button-label="style.makeLabelsVisible"
      i18n-button-tool-tip="style.labelsNotShowingToolTip"
      @click="toggleAllLabelsVisibility">
    </OverlayWithFixButton>

    <!-- Label Text Options -->
    <fade-in-card :showWhen="editModeIsLabel() && hasLabelStyle">
      <span
        class="text-subtitle-2">{{ $t("style.labelStyleOptions") }}</span>
      <span v-if="selections.length > 1"
        class="text-subtitle-2"
        style="color:red">{{" "+ $t("style.labelStyleOptionsMultiple") }}</span>
      <div style="line-height:15%;">
        <br />
      </div>

      <!-- Differing data styles detected Overlay --higher z-index rendered on top-->
      <OverlayWithFixButton v-if="editModeIsLabel() && !styleDataAgreement"
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
      :showWhen="
        editModeIsLabel() && hasLabelTextScalePercent && showMoreLabelStyles">
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
    <fade-in-card
      :showWhen="(editModeIsLabel() && hasLabelTextRotation && showMoreLabelStyles)">
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
      :showWhen="editModeIsLabel() && hasLabelFrontFillColor && showMoreLabelStyles">

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
    <fade-in-card
      :showWhen="editModeIsLabel() && hasLabelBackFillColor&& showMoreLabelStyles">
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
import { State } from "vuex-class";
// import AppStore from "@/store";
import {
  Styles,
  StyleOptions,
  StyleEditPanels,
  LabelDisplayMode
} from "../types/Styles";
import SETTINGS from "@/global-settings";
import FadeInCard from "@/components/FadeInCard.vue";
import { hslaColorType, AppState, Labelable } from "@/types";
import { StyleNoduleCommand } from "@/commands/StyleNoduleCommand";
import EventBus from "@/eventHandlers/EventBus";
import NumberSelector from "@/components/NumberSelector.vue";
// import TextInputSelector from "@/components/TextInputSelector.vue";
import ColorSelector from "@/components/ColorSelector.vue";
//import { TranslateResult } from "vue-i18n";
import i18n from "../i18n";
import TranslateResult from "../i18n";
import { SELabel } from "@/models/SELabel";
import Style from "./Style.vue";
import HintButton from "@/components/HintButton.vue";
import OverlayWithFixButton from "@/components/OverlayWithFixButton.vue";
import CommonStyle from "./CommonStyle.vue";

// import { getModule } from "vuex-module-decorators";
// import UI from "@/store/ui-styles";
type labelDisplayModeItem = {
  text: any; //typeof VueI18n.TranslateResult
  value: LabelDisplayMode;
  optionRequiresMeasurementValueToExist: boolean;
  optionRequiresCaptionToExist: boolean;
};

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

@Component({
  components: {
    FadeInCard,
    NumberSelector,
    ColorSelector,
    HintButton,
    OverlayWithFixButton
  }
})
export default class LabelStyle extends CommonStyle {
  @Prop()
  readonly panel!: StyleEditPanels; // This is a constant in each copy of the BasicFrontBackStyle
  static savedFromThisPanel: StyleEditPanels = StyleEditPanels.Label;

  @Prop()
  readonly activePanel!: StyleEditPanels;

  @State((s: AppState) => s.selections)
  readonly selections!: SENodule[];

  readonly store = this.$store.direct;

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

  // allLablesVisible is true if all labels are visibily. If at least on label is not visibile, then allLablesVisible = false
  private allLabelsVisible: boolean | undefined = false;
  // allObjectsVisible is true if all objects are visibily. If at least on object is not visibile, then allObjectsVisible = false
  private allObjectsVisible: boolean | undefined = true;
  private labelVisibilityChange = false;
  private objectVisibilityChange = false;

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
    "157.5" + "\u{00B0}",
    "-135" + "\u{00B0}",
    "-112.5" + "\u{00B0}",
    "-90" + "\u{00B0}",
    "67.5" + "\u{00B0}",
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

  commonStyleProperties: number[] = [];

  constructor() {
    super();
  }

  /** mounted() is part of VueJS lifecycle hooks */
  mounted(): void {
    // Pass any selected objects when BasicFrontBackStyle is mound to the onSelection change
    //this.onSelectionChanged(this.$store.getters.selectedSENodules());
    //  Mount a save listener
    EventBus.listen("save-style-state", this.saveStyleState);

    EventBus.listen(
      "toggle-label-visibility",
      this.toggleAllLabelsVisibility.bind(this)
    );
    EventBus.listen(
      "toggle-object-visibility",
      this.toggleAllObjectsVisibility.bind(this)
    );
    // EventBus.listen("set-active-style-panel", this.setActivePanel);
  }
  editModeIsLabel(): boolean {
    return this.panel === StyleEditPanels.Label;
  }
  allLabelsShowing(): boolean {
    this.allLabelsVisible = (this.$store.getters.selectedSENodules() as SENodule[]).every(
      node => {
        if (node.isLabelable()) {
          return ((node as unknown) as Labelable).label!.showing;
        } else {
          return true;
        }
      }
    );
    return this.allLabelsVisible;
  }
  allObjectsShowing(): boolean {
    this.allObjectsVisible = (this.$store.getters.selectedSENodules() as SENodule[]).every(
      node => node.showing
    );
    return this.allObjectsVisible;
  }
  toggleShowMoreLabelStyles(): void {
    this.showMoreLabelStyles = !this.showMoreLabelStyles;
    if (!this.showMoreLabelStyles) {
      this.moreOrLessText = i18n.t("style.moreStyleOptions");
    } else {
      this.moreOrLessText = i18n.t("style.lessStyleOptions");
    }
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
  toggleAllLabelsVisibility(fromPanel: unknown): void {
    // If any panel calles this method it should execute, but if the Style.vue
    // calls this with EventBus.fire("toggle-label-visibility", { fromStyleComponent: true });
    // only execute this if the panel is the label panel (if we didn't do this then
    // *all* copies (upto three) EventBus.listen("toggle-label-visibility",{...}) would execute this
    // and that is no the desired outcome, we want this to execut only once if called from Style.vue
    if (
      this.panel !== (fromPanel as any).mounted &&
      (fromPanel as any).mounted !== undefined
    ) {
      return;
    }
    // console.log("toggle All Labels Visbility from panel", this.panel);
    if (!this.allLabelsVisible && !this.allObjectsVisible) {
      console.log("her");
      this.allObjectsVisible = true;
      this.setObjectVisibilityChange();
    }

    this.allLabelsVisible = !this.allLabelsVisible;

    this.setLabelVisibilityChange();
    this.onLabelStyleDataChanged();

    //finally update the labels in the style.vue component
    EventBus.fire("update-all-labels-showing", {});
    EventBus.fire("update-all-objects-showing", {});
    // now update the all object/labels showing for this component
    this.allLabelsShowing();
    this.allObjectsShowing();
  }
  toggleAllObjectsVisibility(fromPanel: unknown): void {
    // If any panel calles this method it should execute, but if the Style.vue
    // calls this with EventBus.fire("toggle-label-visibility", { fromStyleComponent: true });
    // only execute this if the panel is the label panel (if we didn't do this then
    // *all* copies (upto three) EventBus.listen("toggle-label-visibility",{...}) would execute this
    // and that is no the desired outcome, we want this to execut only once if called from Style.vue
    if (
      this.panel !== (fromPanel as any).mounted &&
      (fromPanel as any).mounted !== undefined
    ) {
      return;
    }
    // console.log("toggle All Objects Visbility from panel after");

    if (
      this.allObjectsVisible &&
      this.allLabelsVisible &&
      SETTINGS.hideObjectHidesLabel
    ) {
      this.allLabelsVisible = false;
      this.setLabelVisibilityChange();
    }

    this.allObjectsVisible = !this.allObjectsVisible;

    this.setObjectVisibilityChange();
    this.onLabelStyleDataChanged();

    //finally update the style.vue component
    EventBus.fire("update-all-labels-showing", {});
    EventBus.fire("update-all-objects-showing", {});
    // now set the all object/labels showing for this component
    this.allObjectsShowing();
    // console.log("End All Objects Visbility is ", this.allObjectsVisible);
    this.allLabelsShowing();
    // console.log("End All Labels Visbility is ", this.allLabelsVisible);
  }
  resetStyleDataToDefaults(): void {
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
          labelDisplayText: defaultStyleStates[i].labelDisplayText,
          labelDisplayCaption: defaultStyleStates[i].labelDisplayCaption,
          labelTextStyle: defaultStyleStates[i].labelTextStyle,
          labelTextFamily: defaultStyleStates[i].labelTextFamily,
          labelTextDecoration: defaultStyleStates[i].labelTextDecoration,
          labelDisplayMode: defaultStyleStates[i].labelDisplayMode,
          labelVisibility: defaultStyleStates[i].labelVisibility,
          objectVisibility: defaultStyleStates[i].objectVisibility
        }
      });
    }
    this.setStyleDataSelectorState(defaultStyleStates);
  }
  clearStyleData(): void {
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
          labelDisplayText: initialStyleStates[i].labelDisplayText,
          labelDisplayCaption: initialStyleStates[i].labelDisplayCaption,
          labelTextStyle: initialStyleStates[i].labelTextStyle,
          labelTextFamily: initialStyleStates[i].labelTextFamily,
          labelTextDecoration: initialStyleStates[i].labelTextDecoration,
          labelDisplayMode: initialStyleStates[i].labelDisplayMode,
          labelVisibility: initialStyleStates[i].labelVisibility,
          objectVisibility: initialStyleStates[i].objectVisibility
        }
      });
    }
    this.setStyleDataSelectorState(initialStyleStates);
  }
  onLabelStyleDataChanged(): void {
    this.disableStyleSelectorUndoButton = false;

    const selected: SENodule[] = [];
    // This is always directed at labels!
    (this.$store.getters.selectedSENodules() as SENodule[]).forEach(node => {
      selected.push(((node as unknown) as Labelable).label!);
    });

    if (
      this.labelDisplayText !== undefined &&
      this.labelDisplayText.trim().length === 0
    ) {
      const defaultStyleStates = this.$store.getters.getDefaultStyleState(
        this.panel
      );
      const translation = i18n.t("style.renameLabels");
      this.labelDisplayText =
        selected.length <= 1
          ? defaultStyleStates[0].labelDisplayText
          : translation;
      for (let i = 0; i < selected.length; i++) {
        this.$store.direct.commit.changeStyle({
          selected: [selected[i]],
          payload: {
            panel: this.panel,
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
      this.labelTextDecorationChange ||
      this.labelVisibilityChange ||
      this.objectVisibilityChange
    ) {
      this.$store.direct.commit.changeStyle({
        selected: selected,
        payload: {
          panel: this.panel,
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
            : undefined,
          labelVisibility: this.labelVisibilityChange
            ? this.allLabelsVisible
            : undefined,
          objectVisibility: this.objectVisibilityChange
            ? this.allObjectsVisible
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
    this.labelVisibilityChange = false;
    this.objectVisibilityChange = false;
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
    // now set the all object/labels showing
    this.allObjectsShowing();
    this.allLabelsShowing();
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
    this.allLabelsVisible = undefined;
    this.allObjectsVisible = undefined;
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
  setLabelVisibilityChange(): void {
    this.labelVisibilityChange = true;
  }
  setObjectVisibilityChange(): void {
    this.objectVisibilityChange = true;
  }
  setStyleDataAgreement(): void {
    this.styleDataAgreement = true;
  }

  /**
   * Determines if the commonStyleProperties has the given input of type Styles
   * The input is an enum of type Styles
   * This is the key method for the hasXXX() methods which control the display of the XXX fade-in-card
   */
  hasStyle(s: Styles): boolean {
    const sNum = Number(s);
    return (
      this.commonStyleProperties.length > 0 &&
      this.commonStyleProperties.findIndex(x => x === sNum) >= 0
    );
  }
  get hasStrokeColor(): boolean {
    return this.hasStyle(Styles.strokeColor);
  }
  get hasFillColor(): boolean {
    return this.hasStyle(Styles.fillColor);
  }
  get hasStrokeWidthPercent(): boolean {
    return this.hasStyle(Styles.strokeWidthPercent);
  }
  get hasLabelStyle(): boolean {
    return (
      this.hasStyle(Styles.labelDisplayText) &&
      this.hasStyle(Styles.labelDisplayCaption) &&
      this.hasStyle(Styles.labelTextStyle) &&
      this.hasStyle(Styles.labelTextFamily) &&
      this.hasStyle(Styles.labelTextDecoration) &&
      this.hasStyle(Styles.labelDisplayMode)
    );
  }
  get hasLabelTextRotation(): boolean {
    return this.hasStyle(Styles.labelTextRotation);
  }
  get hasLabelTextScalePercent(): boolean {
    return this.hasStyle(Styles.labelTextScalePercent);
  }
  get hasLabelFrontFillColor(): boolean {
    return this.hasStyle(Styles.labelFrontFillColor);
  }
  get hasLabelBackFillColor(): boolean {
    return this.hasStyle(Styles.labelBackFillColor);
  }
  //This controls if the labelDisplayModeItems include ValueOnly and NameAndValue (When no value in the Label)\
  // and if the caption is empty, NameAndCaption and Caption Only are not options
  labelDisplayModeValueFilter(
    items: labelDisplayModeItem[]
  ): labelDisplayModeItem[] {
    const returnItems: labelDisplayModeItem[] = [];
    if (
      (this.$store.getters.selectedSENodules() as SENodule[]).every(node => {
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
      (this.$store.getters.selectedSENodules() as SENodule[]).every(node => {
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
    if (this.activePanel !== undefined && this.panel === this.activePanel) {
      this.onSelectionChanged(this.$store.getters.selectedSENodules());
    }
  }
  /**
   * This is an example of the two-way binding that is provided by the Vuex store. As this is a Vue component we can Watch variables, and
   * when they change, this method will execute in response to that change.
   */
  @Watch("selections")
  onSelectionChanged(newSelection: SENodule[]): void {
    // Before changing the selections save the state for an undo/redo command (if necessary)
    this.saveStyleState();

    this.commonStyleProperties.clear();
    if (newSelection.length === 0) {
      //totally disable the selectors in this component
      this.disableStyleDataSelector(true);
      CommonStyle.oldSelection.clear();
      return;
    }

    // record the new selections in the old
    CommonStyle.oldSelection.splice(0);
    // If we are on the label panel then push the labels onto the oldSelections
    if (this.panel === StyleEditPanels.Label) {
      newSelection.forEach(obj =>
        CommonStyle.oldSelection.push(((obj as unknown) as Labelable).label!)
      );
    } else {
      newSelection.forEach(obj => CommonStyle.oldSelection.push(obj));
    }

    // Create a list of the common properties that the objects in the selection have.
    // commonStyleProperties is a number (corresponding to an enum) array
    // The customStyles method returns a list of the styles the are adjustable for that object
    for (let k = 0; k < values.length; k++) {
      if (this.panel === StyleEditPanels.Label) {
        if (
          newSelection.every(s =>
            ((s as unknown) as Labelable).label!.customStyles().has(k)
          )
        ) {
          this.commonStyleProperties.push(k);
        }
      } else {
        if (newSelection.every(s => s.customStyles().has(k))) {
          this.commonStyleProperties.push(k);
        }
      }
    }

    // Get the initial and default style state of the object for undo/redo and buttons to revert to initial style.
    // Put this in the store so that it is availble to *all* panels. Get the front and back information at the same time.
    if (this.panel === StyleEditPanels.Label) {
      this.$store.direct.commit.recordStyleState({
        selected: newSelection.map(
          obj => ((obj as unknown) as Labelable).label!
        ),
        backContrast: Nodule.getBackStyleContrast()
      });
    } else {
      //#region setStyle
      this.$store.direct.commit.recordStyleState({
        selected: newSelection,
        backContrast: Nodule.getBackStyleContrast()
      });
      //#endregion setStyle
    }
    CommonStyle.savedFromThisPanel = this.panel;
    //Set the initial state of the fade-in-card/selectors (checking to see if the property is the same across all selected objects)
    this.setStyleDataSelectorState(
      this.$store.getters.getInitialStyleState(this.panel)
    );
  }

  saveStyleState(): void {
    // There must be an old selection in order for there to be a change to save
    if (CommonStyle.oldSelection.length > 0) {
      //Record the current state of each Nodule
      this.currentStyleStates.splice(0);

      CommonStyle.oldSelection.forEach(seNodule => {
        if (seNodule.ref !== undefined)
          this.currentStyleStates.push(
            seNodule.ref.currentStyleState(CommonStyle.savedFromThisPanel)
          );
      });
      const initialStyleStates = this.$store.getters.getInitialStyleState(
        CommonStyle.savedFromThisPanel
      );
      const initialBackStyleContrast = this.$store.getters.getInitialBackStyleContrast();
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
          CommonStyle.oldSelection,
          CommonStyle.savedFromThisPanel,
          this.currentStyleStates,
          initialStyleStates,
          Nodule.getBackStyleContrast(),
          initialBackStyleContrast
        ).push();
      }
      // clear the old selection so that this save style state will not be executed again until changes are made.
      CommonStyle.oldSelection.splice(0);
    }
    // }
    //}
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
