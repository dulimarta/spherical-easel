<template>
  <div>
    <!-- Back Style Contrast Slider -->
    <fade-in-card :showWhen="editModeIsBack()"
      color="red">
      <v-tooltip bottom
        :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay"
        max-width="400px">
        <template v-slot:activator="{ on }">
          <span v-on="on"
            class="text-subtitle-2">{{ $t("style.backStyleContrast") }}</span>
        </template>
        <span>{{ $t("style.backStyleContrastToolTip") }}</span>
      </v-tooltip>
      <span>
        ({{ $t("style.value") }}:
        {{ this.backStyleContrast }})
      </span>
      <br />
      <HintButton @click="clearRecentDynamicBackStyleChanges"
        :disabled="disableBackStyleContrastUndoButton"
        i18n-label="style.clearChanges"
        i18n-tooltip="style.clearChangesToolTip"></HintButton>

      <HintButton @click="resetDynamicBackStyleToDefaults"
        i18n-label="style.restoreDefaults"
        i18n-tooltip="style.restoreDefaultsToolTip"></HintButton>

      <v-slider v-model.number="backStyleContrast"
        :min="0"
        step="0.1"
        @change="onBackStyleContrastChange"
        :max="1"
        type="range"
        dense>
        <template v-slot:prepend>
          <v-icon @click="decrementBackStyleContrast">mdi-minus</v-icon>
        </template>

        <template v-slot:append>
          <v-icon @click="incrementBackStyleContrast">mdi-plus</v-icon>
        </template>
      </v-slider>
    </fade-in-card>

    <!-- Back Buttons to Enable/Disable Dynamic Back Style -->
    <fade-in-card :showWhen="editModeIsBack() && hasDynamicBackStyle ">
      <span
        class="text-subtitle-2">{{ $t("style.dynamicBackStyle") }}</span>

      <br />
      <span v-show="totallyDisableDynamicBackStyleSelector"
        class="select-an-object-text">{{ $t("style.selectAnObject") }}</span>

      <HintButton v-if="!dynamicBackStyleAgreement"
        color="error"
        v-show="!totallyDisableDynamicBackStyleSelector"
        @click="setCommonDynamicBackStyleAgreement"
        i18n-label="style.differingStylesDetected"
        i18n-tooltip="style.differingStylesDetectedToolTip"
        long-label></HintButton>

      <template v-show="!totallyDisableDynamicBackStyleSelector &&
                dynamicBackStyleAgreement">
        <HintButton v-if="!dynamicBackStyle"
          color="error"
          @click="toggleBackStyleOptionsAvailability"
          i18n-label="style.enableBackStyleContrastSlider"
          long-label
          i18n-tooltip="style.enableBackStyleContrastSliderToolTip">
        </HintButton>
        <HintButton v-else
          color="error"
          @click="toggleBackStyleOptionsAvailability"
          long-label
          i18n-label="style.disableBackStyleContrastSlider"
          i18n-tooltip="style.disableBackStyleContrastSliderToolTip">
        </HintButton>
      </template>
    </fade-in-card>

    <!-- Front/Back Stoke Color Selector-->
    <fade-in-card :showWhen="
        (editModeIsFront() && hasStrokeColor) ||
          (editModeIsBack() && !dynamicBackStyle && hasStrokeColor)
      ">
      <ColorSelector title-key="style.strokeColor"
        panel-front-key="style.front"
        panel-back-key="style.back"
        style-name="strokeColor"
        :data.sync="hslaStrokeColorObject"
        :temp-style-states="tempStyleStates"
        :panel="panel"
        :active-panel="activePanel"></ColorSelector>
    </fade-in-card>

    <!-- Front/Back Fill Color Selector-->
    <fade-in-card :showWhen="
        (editModeIsFront() && hasFillColor) ||
          (editModeIsBack() && !dynamicBackStyle && hasFillColor)
      ">
      <ColorSelector title-key="style.fillColor"
        panel-front-key="style.front"
        panel-back-key="style.back"
        style-name="fillColor"
        :data.sync="hslaFillColorObject"
        :temp-style-states="tempStyleStates"
        :panel="panel"
        :active-panel="activePanel"></ColorSelector>
    </fade-in-card>

    <!-- Front/Back Stokewidth Number Selector -->
    <fade-in-card :showWhen="
        (editModeIsFront() && hasStrokeWidthPercent) ||
          (editModeIsBack() && !dynamicBackStyle && hasStrokeWidthPercent)
      ">
      <NumberSelector id="strokeWidthPercentSlider"
        v-bind:data.sync="strokeWidthPercent"
        style-name="strokeWidthPercent"
        title-key="style.strokeWidthPercent"
        panel-front-key="style.front"
        panel-back-key="style.back"
        v-bind:min-value="minStrokeWidthPercent"
        v-bind:max-value="maxStrokeWidthPercent"
        v-bind:step="10"
        :temp-style-states="tempStyleStates"
        :panel="panel"
        :active-panel="activePanel"></NumberSelector>
    </fade-in-card>

    <!-- Front/Back Point Radius Number Selector -->
    <fade-in-card :showWhen="
        (editModeIsFront() && hasPointRadiusPercent) ||
          (editModeIsBack() && !dynamicBackStyle && hasPointRadiusPercent)
      ">
      <NumberSelector :data.sync="pointRadiusPercent"
        title-key="style.pointRadiusPercent"
        panel-front-key="style.front"
        panel-back-key="style.back"
        style-name="pointRadiusPercent"
        :min-value="minPointRadiusPercent"
        :max-value="maxPointRadiusPercent"
        :temp-style-states="tempStyleStates"
        :panel="panel"
        :active-panel="activePanel"></NumberSelector>
    </fade-in-card>

    <!-- Front/Back Opacity Number Selector -->
    <fade-in-card :showWhen="
        (editModeIsFront() && hasOpacity) ||
          (editModeIsBack() && !dynamicBackStyle && hasOpacity)
      ">
      <NumberSelector title-key="style.opacity"
        panel-front-key="style.front"
        panel-back-key="style.back"
        :data.sync="opacity"
        style-name="opacity"
        :min-value="0"
        :max-value="1"
        :step="0.1"
        :temp-style-states="tempStyleStates"
        :panel="panel"
        :active-panel="activePanel"></NumberSelector>
    </fade-in-card>

    <!-- Front/Back Dash array card is displayed for front and back so long as there is a dash array property common to all selected objects-->
    <fade-in-card
      :showWhen="(hasDashPattern ) && (editModeIsFront() || editModeIsBack())">
      <span v-show="editModeIsFront()"
        class="text-subtitle-2">{{ $t("style.front") }}</span>
      <span v-show="editModeIsBack()"
        class="text-subtitle-2">{{ $t("style.back") }}</span>
      <span class="text-subtitle-2">{{ $t("style.dashPattern") }}</span>
      <span v-show="
          !emptyDashPattern &&
            !totallyDisableDashPatternSelector &&
            dashPatternAgreement
        ">
        ({{$t("style.gapDashPattern")}}: {{ gapLength.toFixed(1) }}/{{
        dashLength.toFixed(1)
        }})
      </span>
      <br />
      <span v-show="totallyDisableDashPatternSelector"
        class="select-an-object-text">{{ $t("style.selectAnObject") }}</span>
      <HintButton v-if="!dashPatternAgreement"
        v-show="!totallyDisableDashPatternSelector"
        @click="setCommonDashPatternAgreement"
        i18n-label="style.differingStylesDetected"
        long-label
        i18n-tooltip="style.differingStylesDetectedToolTip">
      </HintButton>

      <template
        v-show="!totallyDisableDashPatternSelector && dashPatternAgreement">
        <HintButton v-if="emptyDashPattern"
          color="error"
          @click="toggleDashPatternSliderAvailibity"
          i18n-label="style.enableDashPatternSlider"
          i18n-tooltip="style.enableDashPatternSliderToolTip"></HintButton>
        <HintButton v-else
          @click="toggleDashPatternSliderAvailibity"
          i18n-label="style.disableDashPatternSlider"
          i18n-tooltip="style.disableDashPatternSliderToolTip">
        </HintButton>
      </template>

      <HintButton v-show="dashPatternAgreement &&
                !totallyDisableDashPatternSelector &&
                !emptyDashPattern"
        :disabled="disableDashPatternUndoButton"
        @click="clearRecentDashPatternChanges"
        i18n-label="style.clearChanges"
        i18n-tooltip="style.clearChangesToolTip"></HintButton>

      <HintButton v-show="dashPatternAgreement &&
                !totallyDisableDashPatternSelector &&
                !emptyDashPattern"
        @click="resetDashPatternToDefaults"
        i18n-label="style.restoreDefaults"
        i18n-tooltip="style.restoreDefaultsToolTip"></HintButton>

      <v-range-slider v-model="sliderDashArray"
        :min="0"
        step="1"
        :disabled="
          !dashPatternAgreement ||
            totallyDisableDashPatternSelector ||
            emptyDashPattern
        "
        @change="onDashPatternChange"
        :max="maxGapLengthPlusDashLength"
        type="range"
        dense>
        <template v-slot:prepend>
          <v-icon @click="decrementDashPattern">mdi-minus</v-icon>
        </template>

        <template v-slot:append>
          <v-icon @click="incrementDashPattern">mdi-plus</v-icon>
        </template>
      </v-range-slider>
    </fade-in-card>

    <!-- Scope of the Label Not Visible Overlay-->
    <v-card color="grey lighten-2"
      flat>

      <!-- Label(s) not showing overlay-->
      <v-overlay absolute
        z-index="2"
        v-bind:value="editModeIsLabel() && !allLabelsShowing && !totalyDisableStyleDataSelector"
        :opacity="0.8">
        <v-card class="mx-auto"
          max-width="344"
          outlined>
          <v-list-item three-line
            class="pb-0">
            <v-list-item-content class="pb-1">
              <div class="overline mb-2">
                {{$t('style.LABELISSUE')}}
              </div>
              <v-list-item-title class="headline mb-1">
                {{$t('style.labelNotVisible')}}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{$t('style.clickToMakeLabelsVisible')}}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>

          <v-card-actions>
            <v-btn color="info"
              v-on:click="toggleAllLabelsVisibility">
              {{$t('style.makeLabelsVisible')}}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-overlay>

      <!-- Scope of the Label Text Options Overlays-->
      <v-card color="grey lighten-2"
        flat>
        <!-- Differing data styles detected Overlay -->
        <v-overlay absolute
          v-bind:value="editModeIsLabel() && hasLabelStyle && !styleDataAgreement && !totalyDisableStyleDataSelector"
          :opacity="0.8">
          <v-card class="mx-auto"
            max-width="344"
            outlined>
            <v-list-item three-line
              class="pb-0">
              <v-list-item-content class="pb-1">
                <div class="overline mb-2">
                  {{$t('style.DIFFERINGSTYLESDETECTED')}}
                </div>
                <v-list-item-title class="headline mb-1">
                  {{$t('style.styleDisagreement')}}
                </v-list-item-title>
                <v-list-item-subtitle> {{$t('style.differentValues')}}
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>

            <v-card-actions>
              <v-btn color="info"
                v-on:click="setStyleDataAgreement">
                {{$t('style.enableCommonStyle')}}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-overlay>

        <!-- (Not only labels) or (more than one non-label object) are Selected Overlay -->
        <v-overlay absolute
          v-bind:value="editModeIsLabel() && !hasLabelStyle && !totalyDisableStyleDataSelector"
          :opacity="0.8">
          <v-card class="mx-auto"
            max-width="344"
            outlined>
            <v-list-item three-line
              class="pb-0">
              <v-list-item-content class="pb-1">
                <div class="overline mb-2">
                  {{$t('style.LABELSANDNONLABELSSELECTED')}}
                </div>
                <v-list-item-title class="headline mb-1">
                  {{$t('style.objectMixture')}}
                </v-list-item-title>
                <v-list-item-subtitle> {{$t('style.selectOnlyLabels')}}
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>

            <v-card-actions>
              <v-btn color="info"
                v-on:click="changeSelectionToAllLabels">
                {{$t('style.selectAllLabels')}}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-overlay>

        <!--
    <div v-show="editModeIsLabel() && !hasLabelStyle"
      style='padding-top: 10px'>
      <v-tooltip bottom
        :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay"
        max-width="400px">
        <template v-slot:activator="{ on }">
          <v-alert elevation="0"
            v-on="on"
            icon="mdi-alert"
            transition="scale-transition"
            type="error">
            <span>{{ $t("style.multipleLabeledObjects") }}</span>
          </v-alert>
        </template>
        <span>{{ $t("style.editMultipleBasicPropertiesMessage") }}</span>
      </v-tooltip>
    </div>
-->
        <!-- Label Text Options -->
        <fade-in-card :showWhen="editModeIsLabel()">
          <span
            class="text-subtitle-2">{{ $t("style.labelStyleOptions") }}</span>
          <span v-if="selections.length > 1"
            class="text-subtitle-2"
            style="color:error">{{" "+ $t("style.labelStyleOptionsMultiple") }}</span>
          <div style="line-height:15%;">
            <br />
          </div>
          <!--<div v-show="totalyDisableStyleDataSelector"
        class="select-an-object-text">
        {{ $t("style.selectAnObject")}}
      </div>-->
          <!-- These should be displayed if there is style data agreement and it is not totally disabled -->

          <v-text-field v-model="labelDisplayText"
            v-bind:label="$t('style.labelText')"
            :counter="maxLabelDisplayTextLength"
            filled
            outlined
            dense
            v-bind:error-messages="$t(labelDisplayTextErrorMessageKey, { max: maxLabelDisplayTextLength })"
            :rules="[labelDisplayTextCheck]"
            @keyup="setlabelDisplayTextChange(); onStyleDataChanged()"
            @blur="setlabelDisplayTextChange(); onStyleDataChanged()"
            @change="setlabelDisplayTextChange(); onStyleDataChanged()">
          </v-text-field>

          <div v-show="showMoreLabelStyles">
            <v-text-field v-model="labelDisplayCaption"
              v-bind:label="$t('style.labelCaption')"
              :counter="maxLabelDisplayCaptionLength"
              filled
              outlined
              dense
              v-bind:error-messages="$t(labelDisplayCaptionErrorMessageKey, { max: maxLabelDisplayCaptionLength })"
              :rules="[labelDisplayCaptionCheck]"
              @keyup="setlabelDisplayCaptionChange(); onStyleDataChanged()"
              @blur="setlabelDisplayCaptionChange(); onStyleDataChanged()"
              @change="setlabelDisplayCaptionChange(); onStyleDataChanged()">
            </v-text-field>
          </div>

          <v-select v-model="labelDisplayMode"
            v-bind:label="$t('style.labelDisplayMode')"
            :items="labelDisplayModeValueFilter(labelDisplayModeItems)"
            filled
            outlined
            dense
            @blur="setlabelDisplayModeChange(); onStyleDataChanged()"
            @change="setlabelDisplayModeChange(); onStyleDataChanged()">
          </v-select>

          <!-- <v-card outlined
          class="px-4"
          filled>
          <v-chip-group v-model="labelObjectVisibility"
            multiple
            active-class="primary--text">
            <v-chip value="labelHidden"
              filter
              dense
              outlined
              @change="setLabelObjectVisibilityChange(); onStyleDataChanged()">
              {{ $t('style.labelHidden') }}
            </v-chip>
            <v-chip value="objectHidden"
              dense
              filter
              outlined
              @change="setLabelObjectVisibilityChange(); onStyleDataChanged()">
              {{$t('style.objectHidden')}}
            </v-chip>
          </v-chip-group>
        </v-card>-->
          <!-- <v-container fluid
          outlined>
          <p>{{$t('style.labelObjectVisibility')}}
          </p>
          <v-row class="light--text">
            <v-col cols="4">
              <v-checkbox v-model="labelObjectVisibility"
                :label="$t('style.labelHidden')"
                value="labelHidden"
                dense
                @change="setLabelObjectVisibilityChange(); onStyleDataChanged()">
              </v-checkbox>
            </v-col>
            <v-col cols="4">
              <v-checkbox v-model="labelObjectVisibility"
                :label="$t('style.objectHidden')"
                value="objectHidden"
                dense
                @change="setLabelObjectVisibilityChange(); onStyleDataChanged()">
              </v-checkbox>
            </v-col>
          </v-row>
        </v-container>-->
          <!-- <v-select v-model="labelObjectVisibility"
          :label="$t('style.labelObjectVisibility')"
          :items="labelObjectVisibilityItems"
          filled
          outlined
          dense
          multiple
          chips
          small-chips
          deletable-chips
          color="blue"
          :error="!allLabelsShowing"
          :no-data-text="$t('style.selectObjectsToShow')"
          :menu-props="{
                    closeOnClick: false,
                    closeOnContentClick: true,
          }"
          @blur="setLabelObjectVisibilityChange(); onStyleDataChanged()"
          @change="setLabelObjectVisibilityChange(); onStyleDataChanged()">
          <template #selection="{ item }">
            <v-chip outlined
              @click:close="deleteChip(item, labelObjectVisibilityItems)">
              {{item.text}}
            </v-chip>
          </template>
        </v-select>-->

          <!-- These should only be displayed if the user selects more -->
          <div v-show="showMoreLabelStyles">
            <v-select v-model="labelTextFamily"
              v-bind:label="$t('style.labelTextFamily')"
              :items="labelTextFamilyItems"
              filled
              outlined
              dense
              @blur="setlabelTextFamilyChange(); onStyleDataChanged()"
              @change="setlabelTextFamilyChange(); onStyleDataChanged()">
            </v-select>
            <v-select v-model="labelTextStyle"
              v-bind:label="$t('style.labelTextStyle')"
              :items="labelTextStyleItems"
              filled
              outlined
              dense
              @blur="setlabelTextStyleChange(); onStyleDataChanged()"
              @change="setlabelTextStyleChange(); onStyleDataChanged()">
            </v-select>
            <v-select v-model="labelTextDecoration"
              v-bind:label="$t('style.labelTextDecoration')"
              :items="labelTextDecorationItems"
              filled
              outlined
              dense
              @blur="setlabelTextDecorationChange(); onStyleDataChanged()"
              @change="setlabelTextDecorationChange(); onStyleDataChanged()">
            </v-select>
          </div>
          <!--<HintButton v-if="!styleDataAgreement"
        @click="setStyleDataAgreement"
        i18n-label="style.differingStylesDetected"
        long-label
        i18n-tooltip="style.differingStylesDetectedToolTip"
        color="error">
      </HintButton>-->

          <HintButton v-if="styleDataAgreement "
            @click="clearStyleData"
            :disabled="disableStyleSelectorUndoButton || !allLabelsShowing"
            i18n-label="style.clearChanges"
            i18n-tooltip="style.clearChangesToolTip"></HintButton>

          <HintButton v-if="styleDataAgreement "
            @click="resetStyleDataToDefaults"
            i18n-label="style.restoreDefaults"
            i18n-tooltip="style.restoreDefaultsToolTip"
            :disabled="!allLabelsShowing"></HintButton>

        </fade-in-card>
      </v-card>

      <!-- Scope of the Number Selector Overlays-->
      <v-card color="grey lighten-2"
        flat>
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
            :thumb-string-values="textScaleSelectorThumbStrings">
          </NumberSelector>
        </fade-in-card>
      </v-card>

      <!-- Scope of the Number Selector Overlays-->
      <v-card color="grey lighten-2"
        flat>
        <!-- Label Text Rotation Number Selector-->
        <fade-in-card :showWhen="
        (editModeIsLabel() && hasLabelTextRotation && showMoreLabelStyles)
      ">
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
            :thumb-string-values="textRotationSelectorThumbStrings">
          </NumberSelector>
        </fade-in-card>
      </v-card>
    </v-card>
    <HintButton v-if="!showMoreLabelStyles"
      @click="toggleShowMoreLabelStyles"
      i18n-label="style.showMoreStyleOptions"
      i18n-tooltip="style.showMoreLabelStyleOptionsToolTip">
    </HintButton>

    <HintButton v-if="showMoreLabelStyles"
      @click="toggleShowMoreLabelStyles"
      i18n-label="style.showLessStyleOptions"
      i18n-tooltip="style.showLessLabelStyleOptionsToolTip">
    </HintButton>

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
import { SELabel } from "@/models/SELabel";
import Style from "./Style.vue";
import HintButton from "@/components/HintButton.vue";

// import { getModule } from "vuex-module-decorators";
// import UI from "@/store/ui-styles";

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
  components: { FadeInCard, NumberSelector, ColorSelector, HintButton }
})
export default class BasicFrontBackStyle extends Vue {
  @Prop()
  readonly panel!: StyleEditPanels; // This is a constant in each copy of the BasicFrontBackStyle
  static savedFromThisPanel: StyleEditPanels = StyleEditPanels.Label;

  @Prop()
  readonly activePanel!: StyleEditPanels;

  @State((s: AppState) => s.selections)
  readonly selections!: SENodule[];

  // The old selection to help with undo/redo commands
  static oldSelection: SENodule[] = [];

  readonly store = this.$store.direct;

  /**
   * These are the temp style state for the selected objects. Used to set the color/number/dash/contrast selectors when the user disables the dynamic back styling.
   */
  private tempStyleStates: StyleOptions[] = [];

  /**
   * These help with redo/redo
   */
  private currentStyleStates: StyleOptions[] = [];

  /**
   * Help to display all the availble styling choices when nothing is selected
   */
  private noObjectsSelected = true;

  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;
  /**
   * There are many style options. In the case that there
   * are more than one object selected, the XXXAgreement boolean indicates if the XXX property is *initially* the
   * same across the selected objects. In the case that they are not initially the same, the cooresponding adjustment tool
   * is display in a different way than the usual default.
   */
  private strokeWidthPercent: number | undefined = 100;
  private maxStrokeWidthPercent = SETTINGS.style.maxStrokeWidthPercent;
  private minStrokeWidthPercent = SETTINGS.style.minStrokeWidthPercent;

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

  //If all labels in the selection are showing in the selection then this is true
  private allSelectedLabelsShowing = false;
  //If all labels in the selction have a defined value this is true -- this controls if the
  // labelDisplayModeItems include ValueOnly and NameAndValue
  private allSelectedLabelsHaveValue = false;

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
  private labelDisplayModeItems = [
    {
      text: i18n.t("style.labelDisplayModes.nameOnly"),
      value: LabelDisplayMode.NameOnly,
      optionRequiresMeasurementValueToExist: false
    },
    {
      text: i18n.t("style.labelDisplayModes.captionOnly"),
      value: LabelDisplayMode.CaptionOnly,
      optionRequiresMeasurementValueToExist: false
    },
    {
      text: i18n.t("style.labelDisplayModes.valueOnly"),
      value: LabelDisplayMode.ValueOnly,
      optionRequiresMeasurementValueToExist: true
    },
    {
      text: i18n.t("style.labelDisplayModes.nameAndCaption"),
      value: LabelDisplayMode.NameAndCaption,
      optionRequiresMeasurementValueToExist: false
    },
    {
      text: i18n.t("style.labelDisplayModes.nameAndValue"),
      value: LabelDisplayMode.NameAndValue,
      optionRequiresMeasurementValueToExist: true
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

  private labelObjectVisibility: string[] | undefined = [];
  private labelObjectVisibilityItems = [
    { header: i18n.t("style.labelObjectVisibility"), divider: true },
    {
      text: i18n.t("style.labelVisible"),
      value: "labelVisible"
    },
    {
      text: i18n.t("style.objectVisible"),
      value: "objectVisible"
    }
  ];
  private labelVisibilityChange = false;
  private objectVisibilityChange = false;

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

  private pointRadiusPercent: number | undefined = 100;
  private maxPointRadiusPercent = SETTINGS.style.maxPointRadiusPercent;
  private minPointRadiusPercent = SETTINGS.style.minPointRadiusPercent;

  private hslaStrokeColorObject: hslaColorType = { h: 0, s: 1, l: 1, a: 0.001 }; // Color for Vuetify Color picker NOTE: setting a=0 creates the following error:
  // create a circle, open the style panel, select the circle when the basic panel is open, switch to the foreground panel, the selected circle has a displayed opacity of 0 --
  // that is the blinking is between nothing and a red circle glowing circle) The color picker display is correct though... strange!
  private hslaFillColorObject: hslaColorType = { h: 0, s: 1, l: 1, a: 0.001 }; // Color for Vuetify Color picker

  /** gapLength = sliderArray[0] */
  private gapLength = 5;
  /** dashLength= sliderArray[1] - sliderArray[0] */
  private dashLength = 10;
  /** gap then dash in DashPattern when passed to object*/
  private dashPatternAgreement = true;
  private totallyDisableDashPatternSelector = false;
  /** sliderDashArray[1]- sliderDashArray[0] is always positive or zero and equals dashLength */
  private sliderDashArray: number[] = [5, 15];
  private emptyDashPattern = false;
  private maxGapLengthPlusDashLength =
    SETTINGS.style.maxGapLengthPlusDashLength;

  private opacity: number | undefined = 1;

  private dynamicBackStyle: boolean | undefined = true;
  private dynamicBackStyleAgreement = true;
  private totallyDisableDynamicBackStyleSelector = false;
  private backStyleContrast = Nodule.getBackStyleContrast();

  private disableDashPatternUndoButton = false;
  private disableBackStyleContrastUndoButton = false;

  commonStyleProperties: number[] = [];

  constructor() {
    super();
  }

  // deleteChip(itemNeedToRemove, array): void {
  //   for (let i = 0; i < array.length; i += 1) {
  //     if (array[i] === itemNeedToRemove) {
  //       array.splice(i, 1);
  //     }
  //   }
  // }
  /** mounted() is part of VueJS lifecycle hooks */
  mounted(): void {
    // Pass any selected objects when BasicFrontBackStyle is mound to the onSelection change
    //this.onSelectionChanged(this.$store.getters.selectedSENodules());
    //  Mount a save listener
    EventBus.listen("save-style-state", this.saveStyleState);

    EventBus.listen("toggle-label-visibility", this.toggleAllLabelsVisibility);
    EventBus.listen(
      "toggle-object-visibility",
      this.toggleAllObjectsVisibility
    );
    // EventBus.listen("set-active-style-panel", this.setActivePanel);
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
  // These methods are linked to the Style Data fade-in-card
  labelDisplayTextCheck() {
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
  labelDisplayCaptionCheck() {
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
  toggleAllLabelsVisibility(): void {
    console.log("toggle All Labels Visbility from panel", this.panel);
    //only execute this if the panel is the label panel (only methods from the label panel should call this method)
    //if (this.panel !== StyleEditPanels.Label) return;

    let labelVisiblility: boolean | undefined =
      this.labelObjectVisibility !== undefined
        ? this.labelObjectVisibility.indexOf("labelVisible") > -1
        : undefined;

    //if there is a mix of objects selected and the user has triggered this method, convert selection to all labels?
    if (!this.hasLabelStyle) {
      this.changeSelectionToAllLabels();
      EventBus.fire("show-alert", {
        key: `style.convertSelectionToLabels`,
        keyOptions: {},
        type: "warning"
      });
      labelVisiblility = true;
      return;
    }

    if (!labelVisiblility) {
      this.labelObjectVisibility!.push("labelVisible");
    } else {
      const pos = this.labelObjectVisibility!.indexOf("labelVisible");
      if (pos > -1) {
        this.labelObjectVisibility?.splice(pos, 1);
      }
    }
    this.setLabelVisibilityChange();
    this.onStyleDataChanged();

    //finally update the labels in the style.vue component
    EventBus.fire("update-all-labels-showing", {});
    EventBus.fire("update-all-objects-showing", {});
  }
  toggleAllObjectsVisibility(): void {
    console.log("toggle All Objects Visbility from panel", this.panel);
    //only execute this if the panel is the label panel (only methods from the label panel should call this method)
    //if (this.panel !== StyleEditPanels.Label) return;

    const objectVisiblility: boolean | undefined =
      this.labelObjectVisibility !== undefined
        ? this.labelObjectVisibility.indexOf("objectVisible") > -1
        : undefined;
    if (!objectVisiblility) {
      this.labelObjectVisibility!.push("objectVisible");
    } else {
      const pos = this.labelObjectVisibility!.indexOf("objectVisible");
      if (pos > -1) {
        this.labelObjectVisibility?.splice(pos, 1);
      }
    }
    this.setObjectVisibilityChange();
    this.onStyleDataChanged();

    //finally update the style.vue component
    EventBus.fire("update-all-labels-showing", {});
    EventBus.fire("update-all-objects-showing", {});
  }

  //Convert the current selection to the labels of all the current objects in the current selections and set them to shwoing
  changeSelectionToAllLabels(): void {
    // watch out for case of object and its own label being selected!
    const newSelection: SENodule[] = [];
    this.selections.forEach(node => {
      if (node.isLabel()) {
        // make sure that the node is not in newSelection before adding it
        if (newSelection.findIndex(n => node === n) === -1) {
          newSelection.push(node);
        }
      } else if (node.isLabelable()) {
        const label = ((node as unknown) as Labelable).label;
        // make sure that the node is not in newSelection before adding it
        if (newSelection.findIndex(n => label === n) === -1) {
          newSelection.push(label!);
        }
      }
      //reset the glowing and selection of the old selection
      node.glowing = false;
      node.selected = false;
    });
    this.store.commit.setSelectedSENodules(newSelection);
    // set all objects in the new selection to showing
    newSelection.forEach(node => (node.showing = true));

    //finally update the label in the style.vue component
    EventBus.fire("update-all-labels-showing", {});
    EventBus.fire("update-all-objects-showing", {});

    // now make the new selection blink
    EventBus.fire("blinking-nodes", { objects: newSelection });
  }
  enableCommonStyle(): void {
    console.log("moo3");
  }
  resetStyleDataToDefaults(): void {
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
      "labelTextDecoration",
      "labelVisibility",
      "objectVisibility"
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
    // Now set the displays of the text field (labelDisplayName), text area(labelDisplayCaption), checkboxes (label visible, object visible),
    //  and combo-boxes (font, family, style, decoration)
    if (!this.totalyDisableStyleDataSelector && this.styleDataAgreement) {
      this.labelDisplayText = (styleState[0] as StyleOptions).labelDisplayText;
      this.labelDisplayCaption = (styleState[0] as StyleOptions).labelDisplayCaption;
      this.labelDisplayMode = (styleState[0] as StyleOptions).labelDisplayMode;
      this.labelTextFamily = (styleState[0] as StyleOptions).labelTextFamily;
      this.labelTextStyle = (styleState[0] as StyleOptions).labelTextStyle;
      this.labelTextDecoration = (styleState[0] as StyleOptions).labelTextDecoration;
      this.labelObjectVisibility?.splice(0, this.labelObjectVisibility.length); // the splice() method is wrapped in a vue wrapper so this will effect the vueitfy object (unlike clear())
      if ((styleState[0] as StyleOptions).labelVisibility) {
        if (this.labelObjectVisibility !== undefined) {
          Vue.set(this.labelObjectVisibility, 0, "labelVisible"); // Set this using the Vue.set() method because the usual way will no effect the vueitfy object
        }
      }
      if ((styleState[0] as StyleOptions).objectVisibility) {
        if (this.labelObjectVisibility !== undefined) {
          Vue.set(
            // Set this using the Vue.set() method because the usual way will no effect the vueitfy object
            this.labelObjectVisibility,
            this.labelObjectVisibility.length,
            "objectVisible"
          );
        }
      }
    }
    // Vue.set(this.labelObjectVisibility, 1, this.sliderDashArray[1] + 1);
    console.log(
      "post set label and ob vis",
      this.labelObjectVisibility?.toString()
    );
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
    if (this.labelObjectVisibility !== undefined) {
      this.labelObjectVisibility.splice(0, this.labelObjectVisibility.length); // the splice() method is wrapped in a vue wrapper so this will effect the vueitfy object (unlike clear())
    }
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
  onStyleDataChanged(): void {
    this.disableStyleSelectorUndoButton = false;

    const selected = [];
    selected.push(...this.$store.getters.selectedSENodules());
    if (this.$store.getters.getUseLabelMode()) {
      const label = ((selected[0] as unknown) as Labelable).label;
      selected.clear();
      selected.push(label);
    }
    // If the label text is empty sring or all spaces it to the default
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
    const labelVisible: boolean | undefined =
      this.labelObjectVisibility !== undefined
        ? this.labelObjectVisibility.indexOf("labelVisible") > -1
        : undefined;
    const objectVisible: boolean | undefined =
      this.labelObjectVisibility !== undefined
        ? this.labelObjectVisibility.indexOf("objectVisible") > -1
        : undefined;

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
        labelVisibility: this.labelVisibilityChange ? labelVisible : undefined,
        objectVisibility: this.objectVisibilityChange
          ? objectVisible
          : undefined
      }
    });
    this.labelDisplayTextChange = false;
    this.labelDisplayCaptionChange = false;
    this.labelDisplayModeChange = false;
    this.labelTextFamilyChange = false;
    this.labelTextStyleChange = false;
    this.labelTextDecorationChange = false;
    this.labelVisibilityChange = false;
    this.objectVisibilityChange = false;
  }
  setStyleDataAgreement(): void {
    this.styleDataAgreement = true;
  }
  toggleShowMoreLabelStyles(): void {
    this.showMoreLabelStyles = !this.showMoreLabelStyles;
  }

  // These methods are linked to the dashPattern fade-in-card
  onDashPatternChange(): void {
    this.disableDashPatternUndoButton = false;
    this.gapLength = this.sliderDashArray[0];
    this.dashLength = this.sliderDashArray[1] - this.sliderDashArray[0];
    this.$store.direct.commit.changeStyle({
      selected: this.$store.getters.selectedSENodules(),
      payload: {
        panel: this.panel,
        dashArray: [this.dashLength, this.gapLength] //correct order!!!!
      }
    });
  }
  setCommonDashPatternAgreement(): void {
    this.dashPatternAgreement = true;
  }
  clearRecentDashPatternChanges(): void {
    this.disableDashPatternUndoButton = true;
    const selected = this.$store.getters.selectedSENodules();
    const initialStyleStates = this.$store.getters.getInitialStyleState(
      this.panel
    );
    for (let i = 0; i < selected.length; i++) {
      // Check see if the initialStylesStates[i] exist and has length >0
      if (
        initialStyleStates[i].dashArray &&
        (initialStyleStates[i].dashArray as number[]).length > 0
      ) {
        this.$store.direct.commit.changeStyle({
          selected: [selected[i]],
          payload: {
            panel: this.panel,
            dashArray: [
              (initialStyleStates[i].dashArray as number[])[0],
              (initialStyleStates[i].dashArray as number[])[1]
            ]
          }
        });
      } else if (initialStyleStates[i].dashArray) {
        // The selected [i] exists and the array is empty
        this.$store.direct.commit.changeStyle({
          selected: [selected[i]],
          payload: {
            panel: this.panel,
            dashArray: []
          }
        });
      }
    }
    this.setDashPatternSelectorState(initialStyleStates);
  }
  resetDashPatternToDefaults(): void {
    const selected = this.$store.getters.selectedSENodules();
    const defaultStyleStates = this.$store.getters.getDefaultStyleState(
      this.panel
    );
    for (let i = 0; i < selected.length; i++) {
      // Check see if the selected[i] exist and has length >0
      if (
        defaultStyleStates[i].dashArray &&
        (defaultStyleStates[i].dashArray as number[]).length > 0
      ) {
        this.$store.direct.commit.changeStyle({
          selected: [selected[i]],
          payload: {
            panel: this.panel,
            dashArray: [
              (defaultStyleStates[i].dashArray as number[])[0],
              (defaultStyleStates[i].dashArray as number[])[1]
            ]
          }
        });
      } else if (defaultStyleStates[i].dashArray) {
        // The selected [i] exists and the array is empty
        this.$store.direct.commit.changeStyle({
          selected: [selected[i]],
          payload: {
            panel: this.panel,
            dashArray: []
          }
        });
      }
    }
    this.setDashPatternSelectorState(defaultStyleStates);
  }
  toggleDashPatternSliderAvailibity(): void {
    if (this.emptyDashPattern) {
      this.sliderDashArray.clear();
      this.sliderDashArray.push(this.gapLength as number);
      this.sliderDashArray.push(
        (this.dashLength as number) + (this.gapLength as number)
      );

      this.$store.direct.commit.changeStyle({
        selected: this.$store.getters.selectedSENodules(),
        payload: {
          panel: this.panel,
          dashArray: [this.dashLength, this.gapLength]
        }
      });
    } else {
      this.$store.direct.commit.changeStyle({
        selected: this.$store.getters.selectedSENodules(),
        payload: {
          panel: this.panel,
          dashArray: []
        }
      });
      this.sliderDashArray.clear();
      this.sliderDashArray.push(5);
      this.sliderDashArray.push(15);
    }
    this.emptyDashPattern = !this.emptyDashPattern;
  }
  incrementDashPattern(): void {
    // increasing the value of the sliderDashArray[1] increases the length of the dash
    if (
      this.sliderDashArray[1] + 1 <=
      SETTINGS.style.maxGapLengthPlusDashLength
    ) {
      this.disableDashPatternUndoButton = false;
      Vue.set(this.sliderDashArray, 1, this.sliderDashArray[1] + 1); // trigger the update
      this.gapLength = this.sliderDashArray[0];
      this.dashLength = this.sliderDashArray[1] - this.sliderDashArray[0];

      this.$store.direct.commit.changeStyle({
        selected: this.$store.getters.selectedSENodules(),
        payload: {
          panel: this.panel,
          dashArray: [this.dashLength, this.gapLength]
        }
      });
    }
  }
  decrementDashPattern(): void {
    this.disableDashPatternUndoButton = false;
    // increasing the value of the sliderDashArray[0] decreases the length of the dash
    if (
      this.sliderDashArray[0] + 1 <=
      SETTINGS.style.maxGapLengthPlusDashLength
    ) {
      this.disableDashPatternUndoButton = false;
      Vue.set(this.sliderDashArray, 0, this.sliderDashArray[0] + 1);
      this.gapLength = this.sliderDashArray[0];
      this.dashLength = this.sliderDashArray[1] - this.sliderDashArray[0];

      this.$store.direct.commit.changeStyle({
        selected: this.$store.getters.selectedSENodules(),
        payload: {
          panel: this.panel,
          dashArray: [this.dashLength, this.gapLength]
        }
      });
    }
    /** TODO:
     * The actual dots on the slider are not moveing when I click the plus (-) sign and trigger this decrementDashPattern method
     * How do I trigger an event that will cause the actual dots on the slider to move?
     */
  }
  setDashPatternSelectorState(styleState: StyleOptions[]): void {
    this.disableDashPatternUndoButton = true;
    // reset to the default which are overwritten as necessary
    this.emptyDashPattern = true;
    this.dashPatternAgreement = true;
    this.gapLength = 5;
    this.dashLength = 10;
    this.totallyDisableDashPatternSelector = false;
    if (styleState[0].dashArray !== undefined) {
      if (styleState[0].dashArray.length > 0) {
        // all selected nodules should have length>0 and the same gap and dash length
        this.dashLength = styleState[0].dashArray[0];
        this.gapLength = styleState[0].dashArray[1];
        this.emptyDashPattern = false;
        if (
          !styleState.every(styleObject => {
            if (styleObject.dashArray) {
              return (
                styleObject.dashArray.length > 0 &&
                styleObject.dashArray[0] == this.dashLength &&
                styleObject.dashArray[1] == this.gapLength
              );
            } else {
              return false;
            }
          })
        ) {
          // The dashPattern property exists on the selected objects but the dash array doesn't agree (so don't totally disable the selector)
          this.disableDashPatternSelector(false);
        }
      } else {
        // make sure that all selected objects have zero length dash array
        if (
          !styleState.every(styleObject => {
            if (styleObject.dashArray) {
              return styleObject.dashArray.length === 0;
            } else {
              return false;
            }
          })
        ) {
          // The dashPattern property exists on the selected objects but the dash array doesn't agree (so don't totally disable the selector)
          this.disableDashPatternSelector(false);
        }
      }
    } else {
      // The dashPattern property doesn't exists on the selected objects so totally disable the selector
      this.disableDashPatternSelector(true);
    }
    // Set the slider dash array values
    this.sliderDashArray.clear();
    this.sliderDashArray.push(this.gapLength);
    this.sliderDashArray.push(this.gapLength + this.dashLength);
  }
  disableDashPatternSelector(totally: boolean): void {
    this.dashPatternAgreement = false;
    this.disableDashPatternUndoButton = true;
    // Set the gap and dash to the default
    this.gapLength = 5;
    this.dashLength = 10;
    this.totallyDisableDashPatternSelector = totally;
  }

  // These methods are linked to the dynamicBackStyle fade-in-card
  onBackStyleContrastChange(): void {
    this.disableBackStyleContrastUndoButton = false;
    this.$store.direct.commit.changeStyle({
      selected: this.$store.getters.selectedSENodules(),
      payload: {
        panel: this.panel,
        backStyleContrast: this.backStyleContrast
      }
    });
  }
  setCommonDynamicBackStyleAgreement(): void {
    this.dynamicBackStyleAgreement = true;
  }
  clearRecentDynamicBackStyleChanges(): void {
    this.disableBackStyleContrastUndoButton = true;
    const selected = this.$store.getters.selectedSENodules();
    const initialStyleStates = this.$store.getters.getInitialStyleState(
      this.panel
    );
    const initialBackStyleContrast = this.$store.getters.getInitialBackStyleContrast();
    for (let i = 0; i < selected.length; i++) {
      this.$store.direct.commit.changeStyle({
        selected: [selected[i]],
        payload: {
          panel: this.panel,
          backStyleContrast: initialBackStyleContrast
        }
      });
    }
    this.backStyleContrast = initialBackStyleContrast;
    this.setDynamicBackStyleSelectorState(initialStyleStates);
  }
  resetDynamicBackStyleToDefaults(): void {
    const selected = this.$store.getters.selectedSENodules();
    const defaultStyleStates = this.$store.getters.getDefaultStyleState(
      this.panel
    );
    for (let i = 0; i < selected.length; i++) {
      this.$store.direct.commit.changeStyle({
        selected: [selected[i]],
        payload: {
          panel: this.panel,
          backStyleContrast: SETTINGS.style.backStyleContrast
        }
      });
    }
    this.backStyleContrast = SETTINGS.style.backStyleContrast;
    this.setDynamicBackStyleSelectorState(defaultStyleStates);
  }
  toggleBackStyleOptionsAvailability(): void {
    this.dynamicBackStyle = !this.dynamicBackStyle;

    this.$store.direct.commit.changeStyle({
      selected: this.$store.getters.selectedSENodules(),
      payload: {
        panel: this.panel,
        dynamicBackStyle: this.dynamicBackStyle
      }
    });

    if (!this.dynamicBackStyle) {
      const selectedSENodules = this.$store.getters.selectedSENodules() as SENodule[];
      this.tempStyleStates.clear();
      selectedSENodules.forEach(seNodule => {
        if (seNodule.ref)
          this.tempStyleStates.push(seNodule.ref.currentStyleState(this.panel));
      });
      this.setDashPatternSelectorState(this.tempStyleStates);
    }
  }
  incrementBackStyleContrast(): void {
    if (
      this.dynamicBackStyle !== undefined &&
      this.backStyleContrast + 0.1 <= 1
    ) {
      this.disableBackStyleContrastUndoButton = false;
      this.backStyleContrast += 0.1;
      this.$store.direct.commit.changeStyle({
        selected: this.$store.getters.selectedSENodules(),
        payload: {
          panel: this.panel,
          backStyleContrast: this.backStyleContrast
        }
      });
    }
  }
  decrementBackStyleContrast(): void {
    if (
      this.dynamicBackStyle !== undefined &&
      this.backStyleContrast - 0.1 >= 0
    ) {
      this.disableBackStyleContrastUndoButton = false;
      this.backStyleContrast -= 0.1;
      this.$store.direct.commit.changeStyle({
        selected: this.$store.getters.selectedSENodules(),
        payload: {
          panel: this.panel,
          backStyleContrast: this.backStyleContrast
        }
      });
    }
  }
  setDynamicBackStyleSelectorState(styleState: StyleOptions[]): void {
    this.dynamicBackStyleAgreement = true;
    this.totallyDisableDynamicBackStyleSelector = false;
    this.dynamicBackStyle = styleState[0].dynamicBackStyle;
    // screen for undefined - if undefined then this is not a property that is going to be set by the style panel for this selection of objects
    if (this.dynamicBackStyle !== undefined) {
      if (
        !styleState.every(
          styleObject => styleObject.dynamicBackStyle == this.dynamicBackStyle
        )
      ) {
        // The dynamic backstyle property exists on the selected objects but the dynamicBackStyle doesn't agree (so don't totally disable the selector)
        this.disableDynamicBackStyleSelector(false);
      }
    } else {
      // The dynamicBackStyle property doesn't exists on the selected objects so totally disable the selector
      this.disableDynamicBackStyleSelector(true);
    }
  }
  disableDynamicBackStyleSelector(totally: boolean): void {
    this.dynamicBackStyleAgreement = false;
    this.dynamicBackStyle = true;
    this.totallyDisableDynamicBackStyleSelector = totally;
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
  get hasPointRadiusPercent(): boolean {
    return this.hasStyle(Styles.pointRadiusPercent);
  }
  get hasOpacity(): boolean {
    return this.hasStyle(Styles.opacity);
  }
  get hasDashPattern(): boolean {
    return this.hasStyle(Styles.dashArray);
  }
  get hasDynamicBackStyle(): boolean {
    return this.hasStyle(Styles.dynamicBackStyle);
  }
  get hasLabelStyle(): boolean {
    return (
      this.hasStyle(Styles.labelDisplayText) &&
      this.hasStyle(Styles.labelDisplayCaption) &&
      this.hasStyle(Styles.labelTextStyle) &&
      this.hasStyle(Styles.labelTextFamily) &&
      this.hasStyle(Styles.labelTextDecoration) &&
      this.hasStyle(Styles.labelDisplayMode) // &&
      // this.hasStyle(Styles.labelVisibility) &&
      // this.hasStyle(Styles.objectVisibility)
    );
  }
  get hasLabelTextRotation(): boolean {
    return this.hasStyle(Styles.labelTextRotation);
  }
  get hasLabelTextScalePercent(): boolean {
    return this.hasStyle(Styles.labelTextScalePercent);
  }
  //check the label visiblity and values of the labels
  // If all object's labels in the selection have a defined value this is true
  get allLabelsShowing(): boolean {
    return (this.$store.getters.selectedSENodules() as SENodule[]).every(
      node => {
        if (node.isLabel()) {
          return node.showing;
        } else if (node.isLabelable()) {
          return ((node as unknown) as Labelable).label!.showing;
        } else {
          return true;
        }
      }
    );
  }
  //This controls if the labelDisplayModeItems include ValueOnly and NameAndValue
  @Watch("selections")
  labelDisplayModeValueFilter(labelDisplayModeItems: []): [] {
    // console.log(
    //   "filter display mode values",
    //   ((this.selections[0] as unknown) as Labelable).label!.ref,
    //   this.selections.every(node => {
    //     if (node.isLabel()) {
    //       return ((node as unknown) as SELabel).ref.value.length !== 0;
    //     } else if (node.isLabelable()) {
    //       return ((node as unknown) as Labelable).label!.ref.value.length !== 0;
    //     } else {
    //       return true;
    //     }
    //   })
    // );
    if (
      (this.$store.getters.selectedSENodules() as SENodule[]).every(node => {
        if (node.isLabel()) {
          return ((node as unknown) as SELabel).ref.value.length !== 0;
        } else if (node.isLabelable()) {
          return ((node as unknown) as Labelable).label!.ref.value.length !== 0;
        } else {
          return true;
        }
      })
    ) {
      // value is present in all labels so pass long all options in labelDisplayModeItems
      return labelDisplayModeItems;
    } else {
      // value is not present in all labels so pass long all options in labelDisplayModeItems that don't have value in them
      return (labelDisplayModeItems as any).filter(
        itm => !(itm as any).optionRequiresMeasurementValueToExist
      );
    }
  }
  @Watch("activePanel")
  private activePanelChange(): void {
    if (this.activePanel !== undefined && this.panel === this.activePanel) {
      // activePanel = undefined means that no edit panel is open
      this.onSelectionChanged(this.$store.getters.selectedSENodules());
      // // Warn the user if there are hidden labels and they open the label edit panel
      // if (
      //   this.activePanel === StyleEditPanels.Label &&
      //   !this.allLabelsShowing
      // ) {
      //   EventBus.fire("show-alert", {
      //     key: `style.notAllLabelsShowing`,
      //     keyOptions: {},
      //     type: "warning"
      //   });
      // }
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
      this.disableDashPatternSelector(true);
      this.disableDynamicBackStyleSelector(true);
      this.disableStyleDataSelector(true);
      this.noObjectsSelected = true;
      BasicFrontBackStyle.oldSelection.clear();
      this.store.commit.setUseLabelMode(false);
      return;
    }
    //check the label visiblity and values of the labels
    // If all object's labels in the selection have a defined value this is true
    this.allSelectedLabelsShowing = newSelection.every(node => {
      if (node.isLabel()) {
        return node.showing;
      } else if (node.isLabelable()) {
        return ((node as unknown) as Labelable).label!.showing;
      } else {
        return true;
      }
    });
    //If all object's labels in the selection have a defined value this is true -- this controls if the
    // labelDisplayModeItems include ValueOnly and NameAndValue
    this.allSelectedLabelsHaveValue = newSelection.every(node => {
      if (node.isLabel()) {
        return ((node as unknown) as SELabel).ref.value !== undefined;
      } else if (node.isLabelable()) {
        return ((node as unknown) as Labelable).label!.ref.value !== undefined;
      } else {
        return true;
      }
    });

    // there is at least one object selected
    this.noObjectsSelected = false;

    // Turn off the useLableMode if the panel is not Label or there is more than one object selected
    if (this.activePanel !== StyleEditPanels.Label || newSelection.length > 1) {
      this.store.commit.setUseLabelMode(false);
    }
    // If only one non-label object is selected and the panel is label and the active panel is label, use the label instead of the object so turn on useLabelMode
    if (
      newSelection.length === 1 &&
      !(newSelection[0] instanceof SELabel) &&
      this.activePanel === StyleEditPanels.Label &&
      this.panel === StyleEditPanels.Label
    ) {
      this.store.commit.setUseLabelMode(true);
    }

    // record the new selections in the old
    BasicFrontBackStyle.oldSelection.clear();
    // If we are in the useLabelMode, push that one Label onto the oldSelections
    if (this.$store.getters.getUseLabelMode()) {
      const label = ((newSelection[0] as unknown) as Labelable).label;
      if (label !== undefined) {
        BasicFrontBackStyle.oldSelection.push(label);
      }
    } else {
      newSelection.forEach(obj => BasicFrontBackStyle.oldSelection.push(obj));
    }

    // Create a list of the common properties that the objects in the selection have.
    // commonStyleProperties is a number (corresponding to an enum) array
    // The customStyles method returns a list of the styles the are adjustable for that object

    // Grab the label of the first selected object (used only if the useLabelMode is on and only one object is selected)
    const label = ((newSelection[0] as unknown) as Labelable).label;
    for (let k = 0; k < values.length; k++) {
      if (this.$store.getters.getUseLabelMode()) {
        if (label != undefined && label.customStyles().has(k)) {
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
    if (this.$store.getters.getUseLabelMode()) {
      const label = ((newSelection[0] as unknown) as Labelable).label;
      if (label !== undefined) {
        this.$store.direct.commit.recordStyleState({
          selected: [label],
          backContrast: Nodule.getBackStyleContrast()
        });
      }
    } else {
      //#region setStyle
      this.$store.direct.commit.recordStyleState({
        selected: newSelection,
        backContrast: Nodule.getBackStyleContrast()
      });
      //#endregion setStyle
    }
    BasicFrontBackStyle.savedFromThisPanel = this.panel;
    //Set the initial state of the fade-in-card/selectors (checking to see if the property is the same across all selected objects)
    this.setDashPatternSelectorState(
      this.$store.getters.getInitialStyleState(this.panel)
    );
    this.setDynamicBackStyleSelectorState(
      this.$store.getters.getInitialStyleState(this.panel)
    );
    this.setStyleDataSelectorState(
      this.$store.getters.getInitialStyleState(this.panel)
    );
    // // Warn the user if there are hidden labels and they open the label edit panel
    // if (this.activePanel === StyleEditPanels.Label && !this.allLabelsShowing) {
    //   EventBus.fire("show-alert", {
    //     key: `style.notAllLabelsShowing`,
    //     keyOptions: {},
    //     type: "warning"
    //   });
    // }
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
        a.opacity === b.opacity &&
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
        a.labelVisibility === b.labelVisibility &&
        a.objectVisibility === b.objectVisibility
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
        // console.log(
        //   "save swp",
        //   a.strokeWidthPercent,
        //   b.strokeWidthPercent,
        //   a.strokeWidthPercent === b.strokeWidthPercent,
        //   "\n",
        //   "sc",
        //   a.strokeColor,
        //   b.strokeColor,
        //   a.strokeColor === b.strokeColor,
        //   "\n",
        //   "fc",
        //   a.fillColor,
        //   b.fillColor,
        //   a.fillColor === b.fillColor,
        //   "\n",
        //   "o",
        //   a.opacity,
        //   b.opacity,
        //   a.opacity === b.opacity,
        //   "\n",
        //   "dbs",
        //   a.dynamicBackStyle,
        //   b.dynamicBackStyle,
        //   a.dynamicBackStyle === b.dynamicBackStyle,
        //   "\n",
        //   "prp",
        //   a.pointRadiusPercent,
        //   b.pointRadiusPercent,
        //   a.pointRadiusPercent === b.pointRadiusPercent,
        //   "\n",
        //   "ldt",
        //   a.labelDisplayText,
        //   b.labelDisplayText,
        //   a.labelDisplayText === b.labelDisplayText,
        //   "\n",
        //   "ldc",
        //   a.labelDisplayCaption,
        //   b.labelDisplayCaption,
        //   a.labelDisplayCaption === b.labelDisplayCaption,
        //   "\n",
        //   "lts",
        //   a.labelTextStyle,
        //   b.labelTextStyle,
        //   a.labelTextStyle === b.labelTextStyle,
        //   "\n",
        //   "ltf",
        //   a.labelTextFamily,
        //   b.labelTextFamily,
        //   a.labelTextFamily === b.labelTextFamily,
        //   "\n",
        //   "ltd",
        //   a.labelTextDecoration,
        //   b.labelTextDecoration,
        //   a.labelTextDecoration === b.labelTextDecoration,
        //   "\n",
        //   "ltr",
        //   a.labelTextRotation,
        //   b.labelTextRotation,
        //   a.labelTextRotation === b.labelTextRotation,
        //   "\n",
        //   "ltsp",
        //   a.labelTextScalePercent,
        //   b.labelTextScalePercent,
        //   a.labelTextScalePercent === b.labelTextScalePercent,
        //   "\n",
        //   "ldm",
        //   a.labelDisplayMode,
        //   b.labelDisplayMode,
        //   a.labelDisplayMode === b.labelDisplayMode,
        //   "\n",
        //   "lv",
        //   a.labelVisibility,
        //   b.labelVisibility,
        //   a.labelVisibility === b.labelVisibility,
        //   "\n",
        //   "ov",
        //   a.objectVisibility,
        //   b.objectVisibility,
        //   a.objectVisibility === b.objectVisibility,
        //   "\n"
        // );
        return false;
      }
    }
    // If we reach here the arrays of style states are equal
    return true;
  }

  saveStyleState(): void {
    // There must be an old selection in order for there to be a change to save
    if (BasicFrontBackStyle.oldSelection.length > 0) {
      //Record the current state of each Nodule
      this.currentStyleStates.clear();

      BasicFrontBackStyle.oldSelection.forEach(seNodule => {
        if (seNodule.ref !== undefined)
          this.currentStyleStates.push(
            seNodule.ref.currentStyleState(
              BasicFrontBackStyle.savedFromThisPanel
            )
          );
      });
      const initialStyleStates = this.$store.getters.getInitialStyleState(
        BasicFrontBackStyle.savedFromThisPanel
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
          BasicFrontBackStyle.oldSelection,
          BasicFrontBackStyle.savedFromThisPanel,
          this.currentStyleStates,
          initialStyleStates,
          Nodule.getBackStyleContrast(),
          initialBackStyleContrast
        ).push();
      }
      // clear the old selection so that this save style state will not be executed again until changes are made.
      BasicFrontBackStyle.oldSelection.clear();
      //break; // only one panel can have made changes
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
