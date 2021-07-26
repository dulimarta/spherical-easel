<template>
  <div>
    <StyleEditor :panel="panel"
      :nodule-filter-function="labelFilter"
      :nodule-map-function="labelMapper">
      <div
        slot-scope="{agreement, styleOptions, selectionCount, forceDataAgreement}">
        <ul>
          <li>Data agreement: {{agreement}}</li>
          <li>Style Opt: {{styleOptions}}</li>
        </ul>

        <!-- Label(s) not showing overlay -- higher z-index rendered on top -- covers entire panel including the header-->
        <OverlayWithFixButton v-if="!allLabelsShowing"
          z-index="100"
          i18n-title-line="style.labelNotVisible"
          i18n-subtitle-line="style.clickToMakeLabelsVisible"
          i18n-button-label="style.makeLabelsVisible"
          i18n-button-tool-tip="style.labelsNotShowingToolTip"
          @click="toggleAllLabelsVisibility">
        </OverlayWithFixButton>
        <InputGroup
          input-selector="labelDisplayText,labelDisplayMode,labelDisplayCaption,labelTextFamily,labelTextStyle,labelTextDecoration">
          <!-- Differing data styles detected Overlay --higher z-index rendered on top-->
          <OverlayWithFixButton v-if="!agreement"
            z-index="1"
            i18n-title-line="style.styleDisagreement"
            i18n-button-label="style.enableCommonStyle"
            i18n-button-tool-tip="style.differentValuesToolTip"
            @click="forceDataAgreement">
          </OverlayWithFixButton>
          <!-- Label Text Options -->
          <span
            class="text-subtitle-2">{{ $t("style.labelStyleOptions") }}</span>
          <span v-if="selectedSENodules.length > 1"
            class="text-subtitle-2"
            style="color:red">{{" "+ $t("style.labelStyleOptionsMultiple") }}</span>
          <!-- Label Text Selections -->
          <v-text-field v-model="styleOptions.labelDisplayText"
            v-if="selectionCount === 1"
            v-bind:label="$t('style.labelText')"
            :counter="maxLabelDisplayTextLength"
            filled
            outlined
            dense
            v-bind:error-messages="$t(labelDisplayTextErrorMessageKey, { max: maxLabelDisplayTextLength })"
            :rules="[labelDisplayTextCheck]">
          </v-text-field>
          <!-- Label Diplay Mode Selections -->

          <v-select v-model.lazy="styleOptions.labelDisplayMode"
            :class="showMoreLabelStyles ? '' : 'pa-0'"
            v-bind:label="$t('style.labelDisplayMode')"
            :items="labelDisplayModeValueFilter(labelDisplayModeItems)"
            filled
            outlined
            dense>
          </v-select>
          <div v-show="showMoreLabelStyles">
            <v-text-field v-model.lazy="styleOptions.labelDisplayCaption"
              v-bind:label="$t('style.labelCaption')"
              :counter="maxLabelDisplayCaptionLength"
              filled
              outlined
              dense
              v-bind:error-messages="$t(labelDisplayCaptionErrorMessageKey, { max: maxLabelDisplayCaptionLength })"
              :rules="[labelDisplayCaptionCheck]">
            </v-text-field>
            <!-- Label Text Family Selections -->
            <v-select v-model.lazy="styleOptions.labelTextFamily"
              v-bind:label="$t('style.labelTextFamily')"
              :items="labelTextFamilyItems"
              filled
              outlined
              dense>
            </v-select>
            <v-select v-model.lazy="styleOptions.labelTextStyle"
              v-bind:label="$t('style.labelTextStyle')"
              :items="labelTextStyleItems"
              filled
              outlined
              dense>
            </v-select>
            <v-select v-model.lazy="styleOptions.labelTextDecoration"
              v-bind:label="$t('style.labelTextDecoration')"
              :items="labelTextDecorationItems"
              filled
              outlined
              dense>
            </v-select>

          </div>
        </InputGroup>
        <InputGroup
          input-selector="labelTextScalePercent,labelTextRotation"
          v-if="showMoreLabelStyles">
          {{ $t("style.labelTextScalePercent")}} &
          {{$t("style.labelTextRotation")}}
          <SimpleNumberSelector
            v-bind:data.sync="styleOptions.labelTextScalePercent"
            title-key="style.labelTextScalePercent"
            v-bind:min="minLabelTextScalePercent"
            v-bind:max="maxLabelTextScalePercent"
            v-bind:step="20"
            :thumb-string-values="textScaleSelectorThumbStrings" />
          <SimpleNumberSelector
            v-bind:data.sync="styleOptions.labelTextRotation"
            title-key="style.labelTextRotation"
            v-bind:min="-3.14159"
            v-bind:max="3.14159"
            v-bind:step="0.39269875"
            :thumb-string-values="textRotationSelectorThumbStrings">
          </SimpleNumberSelector>
        </InputGroup>
        <InputGroup input-selector="labelFrontFillColor"
          v-if="showMoreLabelStyles">
          <SimpleColorSelector title-key="style.labelFrontFillColor"
            style-name="labelFrontFillColor"
            :data.sync="styleOptions.labelFrontFillColor">
          </SimpleColorSelector>
        </InputGroup>
        <InputGroup input-selector="labelBackFillColor"
          v-if="showMoreLabelStyles">
          <OverlayWithFixButton i18n-title-line="Automatic Back Style"
            i18n-subtitle-line="Subtitle?"
            i18n-button-label="Go">
          </OverlayWithFixButton>
          <SimpleColorSelector title-key="style.labelBackFillColor"
            style-name="labelBackFillColor"
            :data.sync="styleOptions.labelBackFillColor">
          </SimpleColorSelector>
        </InputGroup>
      </div>
    </StyleEditor>

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
import { Component, Prop } from "vue-property-decorator";
import { SENodule } from "../models/SENodule";
import Nodule from "../plottables/Nodule";
import { namespace } from "vuex-class";
import { StyleOptions, StyleEditPanels } from "../types/Styles";
import { LabelDisplayMode } from "@/types";
import SETTINGS from "@/global-settings";
import FadeInCard from "@/components/FadeInCard.vue";
import InputGroup from "@/components/InputGroupWithReset.vue";
import { AppState, Labelable } from "@/types";
import EventBus from "@/eventHandlers/EventBus";
import SimpleNumberSelector from "@/components/SimpleNumberSelector.vue";
import SimpleColorSelector from "@/components/SimpleColorSelector.vue";
import i18n from "../i18n";
import OverlayWithFixButton from "@/components/OverlayWithFixButton.vue";
import StyleEditor from "@/components/StyleEditor.vue";
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
    SimpleNumberSelector,
    SimpleColorSelector,
    OverlayWithFixButton,
    StyleEditor,
    InputGroup
  }
})
export default class LabelStyle extends Vue {
  @Prop() readonly panel!: StyleEditPanels;

  @SE.State((s: AppState) => s.selectedSENodules)
  readonly selectedSENodules!: SENodule[];

  labelFilter(n: SENodule): boolean {
    console.debug("Label Filter is called");
    return n.isLabelable();
  }

  labelMapper(n: SENodule): Nodule {
    console.debug("Label mapper is called");
    return ((n as unknown) as Labelable).label!.ref!;
  }

  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

  private maxLabelTextScalePercent = SETTINGS.style.maxLabelTextScalePercent;
  private minLabelTextScalePercent = SETTINGS.style.minLabelTextScalePercent;
  //step is 20 from 60 to 200 is 8 steps
  private textScaleSelectorThumbStrings: Array<string> = [];

  //Many of the label style will not be commonly modified so create a button/variable for
  // the user to click to show more of the Label Styling options
  private showMoreLabelStyles = false;
  private moreOrLessText = i18n.t("style.moreStyleOptions"); // The text for the button to toggle between less/more options

  // Using deep watcher, VueJS does not keep track the old object
  // We have to manage it ourself
  private activeStyleOptions: StyleOptions | null = null;
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
  private textRotationSelectorThumbStrings: Array<string> = [];

  created(): void {
    for (
      let s = SETTINGS.style.minLabelTextScalePercent;
      s <= SETTINGS.style.maxLabelTextScalePercent;
      s += 20
    )
      this.textScaleSelectorThumbStrings.push(s.toFixed(0) + "%");
    for (let angle = -180; angle <= 180; angle += 22.5) {
      this.textRotationSelectorThumbStrings.push(
        angle.toFixed(1).replace(/\.0$/, "") + "\u{00B0}"
      );
    }
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
  labelDisplayTextCheck(txt: string | undefined): boolean | string {
    if (txt && txt.length > SETTINGS.label.maxLabelDisplayTextLength) {
      setTimeout(() => {
        if (this.activeStyleOptions)
          this.activeStyleOptions.labelDisplayText = txt.substr(
            0,
            SETTINGS.label.maxLabelDisplayTextLength
          );
      }, 3000);
      return this.$t("style.maxMinLabelDisplayTextLengthWarning", {
        max: SETTINGS.label.maxLabelDisplayTextLength
      }) as string;
    }
    return true;
  }
  labelDisplayCaptionCheck(txt: string | undefined): boolean | string {
    if (txt && txt.length > SETTINGS.label.maxLabelDisplayCaptionLength) {
      setTimeout(() => {
        if (this.activeStyleOptions)
          this.activeStyleOptions.labelDisplayCaption = txt.substr(
            0,
            SETTINGS.label.maxLabelDisplayCaptionLength
          );
      }, 3000);
      return this.$t("style.maxMinLabelDisplayTextLengthWarning", {
        max: SETTINGS.label.maxLabelDisplayTextLength
      }) as string;
    }
    return true;
  }

  setStyleDataAgreement(): void {
    console.debug("What goes here???");
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
