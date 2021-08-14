<template>
  <div>
    <StyleEditor :panel="panel"
      :nodule-filter-function="labelFilter"
      :nodule-map-function="labelMapper">
      <div
        slot-scope="{styleOptions, selectionCount, forceDataAgreement, conflictingProps}">
        <!-- For debugging -->
        <!--ul>
          <li>Style Opt: {{styleOptions}}</li>
        </ul-->

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
          <OverlayWithFixButton
            v-if="dataAgreement(conflictingProps,[`labelDisplayMode`,`labelDisplayCaption`,`labelTextFamily`,`labelTextStyle`,`labelTextDecoration`])"
            z-index="1"
            i18n-title-line="style.styleDisagreement"
            i18n-button-label="style.enableCommonStyle"
            i18n-button-tool-tip="style.differentValuesToolTip"
            @click="shakeConflictingItems(conflictingProps);
            forceDataAgreement([`labelDisplayMode`,`labelDisplayCaption`,`labelTextFamily`,`labelTextStyle`,`labelTextDecoration`])">
          </OverlayWithFixButton>
          <!-- Label Text Options -->
          <span
            class="text-subtitle-2">{{ $t("style.labelStyleOptions") }}</span>
          <span v-if="selectedSENodules.length > 1"
            class="text-subtitle-2"
            style="color:red">{{" "+ $t("style.labelStyleOptionsMultiple") }}</span>
          <!-- Label Text Selections -->
          <v-tooltip bottom
            :open-delay="toolTipOpenDelay"
            :close-delay="toolTipCloseDelay"
            max-width="400px">
            <template v-slot:activator="{ on }">
              <span v-on="on">
                <v-text-field v-model="styleOptions.labelDisplayText"
                  :disabled="selectionCount !== 1"
                  v-bind:label="$t('style.labelText')"
                  :counter="maxLabelDisplayTextLength"
                  ref="labelDisplayText"
                  :class="{'shake' : animatedInput.labelDisplayText}"
                  filled
                  outlined
                  dense
                  :placeholder="placeHolderText(selectionCount, false)"
                  v-bind:error-messages="$t(labelDisplayTextErrorMessageKey, { max: maxLabelDisplayTextLength })"
                  :rules="[labelDisplayTextCheck,labelDisplayTextTruncate(styleOptions)]">
                </v-text-field>
              </span>
            </template>
            {{selectionCount>1 ? $t('style.multiLabelTextToolTip'):$t('style.singleLabelTextToolTip')}}
          </v-tooltip>
          <!-- Label Diplay Mode Selections -->

          <v-select v-model.lazy="styleOptions.labelDisplayMode"
            :class="[showMoreLabelStyles ? '': 'pa-0', {'shake' : animatedInput.labelDisplayMode}]"
            :disabled="labelDisplayModeValueFilter(styleOptions).length < 2"
            ref="labelDisplayMode"
            v-bind:label="$t('style.labelDisplayMode')"
            :items="labelDisplayModeValueFilter(styleOptions)"
            filled
            outlined
            dense>
          </v-select>
          <div v-show="showMoreLabelStyles">
            <v-text-field v-model.lazy="styleOptions.labelDisplayCaption"
              v-bind:label="$t('style.labelCaption')"
              :counter="maxLabelDisplayCaptionLength"
              :placeholder="placeHolderText(selectionCount, true)"
              ref="labelDisplayCaption"
              :class="{'shake' : animatedInput.labelDisplayCaption}"
              filled
              outlined
              dense
              v-bind:error-messages="$t(labelDisplayCaptionErrorMessageKey, { max: maxLabelDisplayCaptionLength })"
              :rules="[labelDisplayCaptionCheck,labelDisplayCaptionTruncate(styleOptions)]">
            </v-text-field>
            <!-- Label Text Family Selections -->
            <v-select v-model.lazy="styleOptions.labelTextFamily"
              v-bind:label="$t('style.labelTextFamily')"
              :items="labelTextFamilyItems"
              ref="labelTextFamily"
              :class="{'shake' : animatedInput.labelTextFamily}"
              filled
              outlined
              dense>
            </v-select>
            <v-select v-model.lazy="styleOptions.labelTextStyle"
              v-bind:label="$t('style.labelTextStyle')"
              :items="labelTextStyleItems"
              ref="labelTextStyle"
              :class="{'shake' : animatedInput.labelTextStyle}"
              filled
              outlined
              dense>
            </v-select>
            <v-select v-model.lazy="styleOptions.labelTextDecoration"
              v-bind:label="$t('style.labelTextDecoration')"
              :items="labelTextDecorationItems"
              ref="labelTextDecorations"
              :class="{'shake' : animatedInput.labelTextDecoration}"
              filled
              outlined
              dense>
            </v-select>

          </div>
        </InputGroup>
        <InputGroup
          input-selector="labelTextScalePercent,labelTextRotation"
          v-if="showMoreLabelStyles">
          <OverlayWithFixButton
            v-if="dataAgreement(conflictingProps,[`labelTextScalePercent`,`labelTextRotation`])"
            z-index="1"
            i18n-title-line="style.styleDisagreement"
            i18n-button-label="style.enableCommonStyle"
            i18n-button-tool-tip="style.differentValuesToolTip"
            @click="shakeConflictingItems(conflictingProps);
            forceDataAgreement([`labelTextScalePercent`,`labelTextRotation`])">
          </OverlayWithFixButton>
          {{ $t("style.labelTextScalePercent")}} &
          {{$t("style.labelTextRotation")}}
          <SimpleNumberSelector
            v-bind:data.sync="styleOptions.labelTextScalePercent"
            title-key="style.labelTextScalePercent"
            ref="labelTextScalePercent"
            :class="{'shake' : animatedInput.labelTextScalePercent}"
            :min="minLabelTextScalePercent"
            :max="maxLabelTextScalePercent"
            :step="20"
            :thumb-string-values="textScaleSelectorThumbStrings" />
          <SimpleNumberSelector
            v-bind:data.sync="styleOptions.labelTextRotation"
            ref="labelTextRotation"
            :class="{'shake' : animatedInput.labelTextRotation}"
            title-key="style.labelTextRotation"
            :min="-3.14159"
            :max="3.14159"
            :step="0.39269875"
            :thumb-string-values="textRotationSelectorThumbStrings">
          </SimpleNumberSelector>
        </InputGroup>
        <InputGroup input-selector="labelFrontFillColor"
          v-if="showMoreLabelStyles">
          <OverlayWithFixButton
            v-if="dataAgreement(conflictingProps,[`labelFrontFillColor`])"
            z-index="1"
            i18n-title-line="style.styleDisagreement"
            i18n-button-label="style.enableCommonStyle"
            i18n-button-tool-tip="style.differentValuesToolTip"
            @click="shakeConflictingItems(conflictingProps);
            forceDataAgreement([`labelFrontFillColor`])">
          </OverlayWithFixButton>
          <SimpleColorSelector title-key="style.labelFrontFillColor"
            ref="labelFrontFillColor"
            style-name="labelFrontFillColor"
            :data.sync="styleOptions.labelFrontFillColor">
          </SimpleColorSelector>
        </InputGroup>
        <InputGroup input-selector="labelBackFillColor"
          v-if="showMoreLabelStyles">
          <OverlayWithFixButton
            v-if="dataAgreement(conflictingProps,[`labelBackFillColor`])"
            z-index="1"
            i18n-title-line="style.styleDisagreement"
            i18n-button-label="style.enableCommonStyle"
            i18n-button-tool-tip="style.differentValuesToolTip"
            @click="shakeConflictingItems(conflictingProps);
            forceDataAgreement([`labelBackFillColor`])">
          </OverlayWithFixButton>
          <OverlayWithFixButton v-if="styleOptions.labelDynamicBackStyle"
            z-index="10"
            i18n-title-line="style.dynamicBackStyleHeader"
            i18n-button-label="style.disableDynamicBackStyle"
            i18n-button-tool-tip="style.disableDynamicBackStyleToolTip"
            @click="styleOptions.labelDynamicBackStyle =!styleOptions.labelDynamicBackStyle">
          </OverlayWithFixButton>
          <SimpleColorSelector title-key="style.labelBackFillColor"
            ref="labelBackFillColor"
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
import { StyleEditPanels, StyleOptions } from "../types/Styles";
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
import Label from "@/plottables/Label";
import { SELabel } from "@/models/SELabel";
const SE = namespace("se");

// import UI from "@/store/ui-styles";
type labelDisplayModeItem = {
  text: any; //typeof VueI18n.TranslateResult
  value: LabelDisplayMode;
  optionRequiresMeasurementValueToExist: boolean;
  optionRequiresCaptionToExist: boolean;
};

type Animatable = {
  labelDisplayText: boolean;
  labelDisplayMode: boolean;
  labelDisplayCaption: boolean;
  labelTextFamily: boolean;
  labelTextStyle: boolean;
  labelTextDecoration: boolean;
  labelTextScalePercent: boolean;
  labelTextRotation: boolean;
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

  // Include only those objects that have SELabel
  labelFilter(n: SENodule): boolean {
    return n.isLabelable();
  }

  // Map each object to its plotabble label
  labelMapper(n: SENodule): Nodule {
    return ((n as unknown) as Labelable).label!.ref!;
  }

  // usingAutomaticBackStyle = false means that the user is setting the color for the back on their own and is
  // *not* using the contrast (i.e. not using the dynamic back styling)
  // usingAutomaticBackStyle = true means the program is setting the style of the back objects
  // private usingAutomaticBackStyle = true;

  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

  // shakes the input a bit if there is a conflict on that particular input
  private animatedInput: Animatable = {
    labelDisplayText: false,
    labelDisplayMode: false,
    labelDisplayCaption: false,
    labelTextFamily: false,
    labelTextStyle: false,
    labelTextDecoration: false,
    labelTextScalePercent: false,
    labelTextRotation: false
  };

  private maxLabelTextScalePercent = SETTINGS.style.maxLabelTextScalePercent;
  private minLabelTextScalePercent = SETTINGS.style.minLabelTextScalePercent;
  //step is 20 from 60 to 200 is 8 steps
  private textScaleSelectorThumbStrings: Array<string> = [];

  //Many of the label style will not be commonly modified so create a button/variable for
  // the user to click to show more of the Label Styling options
  private showMoreLabelStyles = false;
  private moreOrLessText = i18n.t("style.moreStyleOptions"); // The text for the button to toggle between less/more options

  private maxLabelDisplayTextLength = SETTINGS.label.maxLabelDisplayTextLength;
  private labelDisplayTextErrorMessageKey = "";
  private labelDisplayTestResults = [true, true];
  private lastValidDisplayText = "";

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
    // console.log(
    //   "rotation angle thumb labels",
    //   this.textRotationSelectorThumbStrings
    // );
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
    if (txt !== undefined && txt !== null) {
      if (txt.length > SETTINGS.label.maxLabelDisplayTextLength) {
        return this.$t("style.maxLabelDisplayTextLengthWarning", {
          max: SETTINGS.label.maxLabelDisplayTextLength
        }) as string;
      } else if (txt.length === 0) {
        console.log("here");
        return this.$t("style.minLabelDisplayTextLengthWarning", {}) as string;
      }
    }
    return true;
  }

  labelDisplayTextTruncate(opt: StyleOptions): boolean {
    if (opt.labelDisplayText !== undefined && opt.labelDisplayText !== null) {
      if (
        opt.labelDisplayText.length > SETTINGS.label.maxLabelDisplayTextLength
      ) {
        const txt = opt.labelDisplayText;
        opt.labelDisplayText = txt.slice(
          0,
          SETTINGS.label.maxLabelDisplayTextLength
        );
      } else if (opt.labelDisplayText.length === 0) {
        opt.labelDisplayText = this.lastValidDisplayText;
      } else {
        this.lastValidDisplayText = opt.labelDisplayText;
      }
    }
    return true;
  }

  labelDisplayCaptionCheck(txt: string | undefined): boolean | string {
    if (txt && txt.length > SETTINGS.label.maxLabelDisplayCaptionLength) {
      return this.$t("style.maxLabelDisplayCaptionLengthWarning", {
        max: SETTINGS.label.maxLabelDisplayCaptionLength
      }) as string;
    }
    return true;
  }
  labelDisplayCaptionTruncate(opt: StyleOptions): boolean {
    if (opt.labelDisplayCaption !== undefined) {
      if (
        opt.labelDisplayCaption.length >
        SETTINGS.label.maxLabelDisplayCaptionLength
      ) {
        const txt = opt.labelDisplayCaption;
        opt.labelDisplayCaption = txt.slice(
          0,
          SETTINGS.label.maxLabelDisplayCaptionLength
        );
      } else if (opt.labelDisplayCaption.length === 0) {
        // the label mode should be set to name only
        opt.labelDisplayMode = LabelDisplayMode.NameOnly;
      }
    }
    return true;
  }

  //This controls if the labelDisplayModeItems include ValueOnly and NameAndValue (When no value in the Label)\
  // and if the caption is empty, NameAndCaption and Caption Only are not options
  labelDisplayModeValueFilter(
    opt: StyleOptions
    // items: labelDisplayModeItem[]
  ): labelDisplayModeItem[] {
    const returnItems: labelDisplayModeItem[] = [];
    const allLabels = this.selectedSENodules
      .filter(this.labelFilter)
      .map(this.labelMapper)
      .map((n: Nodule) => n as Label);
    if (allLabels.every((lab: Label) => lab.value.length !== 0)) {
      // value is present in all labels so pass long all options in labelDisplayModeItems
      returnItems.push(...this.labelDisplayModeItems);
    } else {
      // value is not present in all labels so pass long all options in labelDisplayModeItems that don't have value in them
      returnItems.push(
        ...this.labelDisplayModeItems.filter(
          item => !item.optionRequiresMeasurementValueToExist
        )
      );
    }

    if (opt.labelDisplayCaption && opt.labelDisplayCaption.length > 0) {
      // caption is present in all labels
      return returnItems;
    } else {
      // caption is not present in all labels so pass long all options in labelDisplayModeItems that don't have caption in them
      return returnItems.filter(itm => !itm.optionRequiresCaptionToExist);
    }
  }
  dataAgreement(conflictingPropNames: string[], checkProps: string[]): boolean {
    return checkProps.some(
      prop =>
        conflictingPropNames.findIndex(
          conflictProp => conflictProp === prop
        ) !== -1
    );
  }

  placeHolderText(numSelected: number, caption: boolean): string {
    if (numSelected > 1) {
      if (caption) {
        return "Common Caption Text";
      } else {
        return "Common Label Text";
      }
    } else {
      if (caption) {
        return "Caption Text";
      } else {
        return "Label Text";
      }
    }
  }

  shakeConflictingItems(conflictingProps: string[]): void {
    conflictingProps.forEach(conflictPropName => {
      switch (conflictPropName) {
        case "labelDisplayText":
          // clear the display of the labels
          if (this.$refs.labelDisplayText !== undefined) {
            (this.$refs.labelDisplayText as any).$el.getElementsByTagName(
              "input"
            )[0].value = "";
          }
          break;
        case "labelDisplayCaption":
          // clear the display of the captions
          if (this.$refs.labelDisplayCaption !== undefined) {
            (this.$refs.labelDisplayCaption as any).$el.getElementsByTagName(
              "input"
            )[0].value = "";
          }
          break;
      }

      (this.animatedInput as any)[conflictPropName] = true;
      setTimeout(() => {
        (this.animatedInput as any)[conflictPropName] = false;
      }, 1000);
    });
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
.shake {
  animation: shake 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  transform: translate3d(0, 0, 0);
}
@keyframes shake {
  10%,
  90% {
    transform: translate3d(-1px, 0, 0);
  }
  20%,
  80% {
    transform: translate3d(2px, 0, 0);
  }
  30%,
  50%,
  70% {
    transform: translate3d(-4px, 0, 0);
  }
  40%,
  60% {
    transform: translate3d(4px, 0, 0);
  }
}
</style>
