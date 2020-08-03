<template>
  <div>
    <fade-in-card :showWhen="isBackFace()" color="red">
      <v-tooltip bottom :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay" max-width="400px">
        <template v-slot:activator="{ on }">
          <span v-on="on" class="text-subtitle-2">
            {{ $t("style.backStyleContrast") }}
          </span>
        </template>
        <span>{{ $t("style.backStyleContrastToolTip") }}</span>
      </v-tooltip>
      <span>(Contrast: {{ this.backStyleContrast }})</span>
      <br />

      <v-tooltip bottom :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay" max-width="400px">
        <template v-slot:activator="{ on }">
          <v-btn v-on="on" @click="resetDynamicBackStyleToDefaults" text
            small outlined ripple>
            <span>{{ $t("style.restoreDefaults") }}</span>
          </v-btn>
        </template>
        <span>{{ $t("style.restoreDefaultsToolTip") }}</span>
      </v-tooltip>

      <v-slider v-model.number="backStyleContrast" :min="0" step="0.1"
        @change="onBackStyleContrastChange" :max="1" type="range"
        class="mt-8">
        <template v-slot:prepend>
          <v-icon @click="decrementBackStyleContrast">mdi-minus</v-icon>
        </template>

        <template v-slot:append>
          <v-icon @click="incrementBackStyleContrast">mdi-plus</v-icon>
        </template>
      </v-slider>
    </fade-in-card>

    <fade-in-card
      :showWhen="isBackFace() && (hasDynamicBackStyle || noObjectsSelected)">
      <span
        class="text-subtitle-2">{{ $t("style.dynamicBackStyle") }}</span>

      <br />
      <span v-show="totallyDisableDynamicBackStyleSelector">
        {{ $t("style.selectAnObject") }}
      </span>
      <v-tooltip v-if="!dynamicBackStyleAgreement" bottom
        :open-delay="toolTipOpenDelay" :close-delay="toolTipCloseDelay"
        max-width="400px">
        <template v-slot:activator="{ on }">
          <v-btn color="error" v-on="on"
            v-show="!totallyDisableDynamicBackStyleSelector" text small
            outlined ripple @click="setCommonDynamicBackStyleAgreement">
            {{ $t("style.differingStylesDetected") }}
          </v-btn>
        </template>
        <span>{{ $t("style.differingStylesDetectedToolTip") }}</span>
      </v-tooltip>

      <v-tooltip v-if="!dynamicBackStyle" bottom
        :open-delay="toolTipOpenDelay" :close-delay="toolTipCloseDelay"
        max-width="400px">
        <template v-slot:activator="{ on }">
          <v-btn v-on="on" v-show="
              !totallyDisableDynamicBackStyleSelector &&
                dynamicBackStyleAgreement
            " text color="error" outlined ripple small
            @click="toggleBackStyleContrastSliderAvailibity">
            {{ $t("style.enableBackStyleContrastSlider") }}
          </v-btn>
        </template>
        <span>{{ $t("style.enableBackStyleContrastSliderToolTip") }}</span>
      </v-tooltip>

      <v-tooltip v-else bottom :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay" max-width="400px">
        <template v-slot:activator="{ on }">
          <v-btn v-on="on" v-show="
              !totallyDisableDynamicBackStyleSelector &&
                dynamicBackStyleAgreement
            " text outlined ripple small
            @click="toggleBackStyleContrastSliderAvailibity">
            {{ $t("style.disableBackStyleContrastSlider") }}
          </v-btn>
        </template>
        <span>{{ $t("style.disableBackStyleContrastSliderToolTip") }}</span>
      </v-tooltip>

      <v-tooltip bottom :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay" max-width="400px">
        <template v-slot:activator="{ on }">
          <v-btn v-on="on" v-show="
              dynamicBackStyleAgreement &&
                !totallyDisableDynamicBackStyleSelector &&
                dynamicBackStyle
            " @click="clearRecentDynamicBackStyleChanges" text outlined
            ripple small>
            {{ $t("style.clearChanges") }}
          </v-btn>
        </template>
        <span>{{ $t("style.clearChangesToolTip") }}</span>
      </v-tooltip>

      <v-tooltip bottom :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay" max-width="400px">
        <template v-slot:activator="{ on }">
          <v-btn v-on="on" v-show="
              dynamicBackStyleAgreement &&
                !totallyDisableDynamicBackStyleSelector &&
                dynamicBackStyle
            " @click="resetDynamicBackStyleToDefaults" text small outlined
            ripple>
            {{ $t("style.restoreDefaults") }}
          </v-btn>
        </template>
        <span>{{ $t("style.restoreDefaultsToolTip") }}</span>
      </v-tooltip>
    </fade-in-card>

    <fade-in-card :showWhen="
        (!isBackFace() && (hasStrokeColor || noObjectsSelected)) ||
          (isBackFace() && !dynamicBackStyle && hasStrokeColor)
      ">
      <span class="text-subtitle-2">{{ $t("style.strokeColor") }}</span>
      <br />
      <span v-show="totallyDisableStrokeColorSelector">
        {{ $t("style.selectAnObject") }}
      </span>
      <v-tooltip v-if="!strokeColorAgreement" bottom
        :open-delay="toolTipOpenDelay" :close-delay="toolTipCloseDelay"
        max-width="400px">
        <template v-slot:activator="{ on }">
          <v-btn color="error" v-on="on"
            v-show="!totallyDisableStrokeColorSelector" text small outlined
            ripple @click="setCommonStrokeColorArgreement">
            {{ $t("style.differingStylesDetected") }}
          </v-btn>
        </template>
        <span>{{ $t("style.differingStylesDetectedToolTip") }}</span>
      </v-tooltip>

      <v-tooltip bottom v-else :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay" max-width="400px">
        <template v-slot:activator="{ on }">
          <v-btn v-on="on" v-show="!totallyDisableStrokeColorSelector" text
            outlined ripple small @click="showStrokeColorOptions">
            {{ $t("style.showColorPresets") }}
          </v-btn>
        </template>
        <span>{{ $t("style.showColorPresetsToolTip") }}</span>
      </v-tooltip>

      <v-tooltip bottom :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay" max-width="400px">
        <template v-slot:activator="{ on }">
          <v-btn v-on="on"
            v-show="strokeColorAgreement && !totallyDisableStrokeColorSelector"
            @click="clearRecentStrokeColorChanges" text outlined ripple
            small>
            {{ $t("style.clearChanges") }}
          </v-btn>
        </template>
        <span>{{ $t("style.clearChangesToolTip") }}</span>
      </v-tooltip>

      <v-tooltip bottom :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay" max-width="400px">
        <template v-slot:activator="{ on }">
          <v-btn v-on="on"
            v-show="strokeColorAgreement && !totallyDisableStrokeColorSelector"
            @click="resetStrokeColorToDefaults" text small outlined ripple>
            {{ $t("style.restoreDefaults") }}
          </v-btn>
        </template>
        <span>{{ $t("style.restoreDefaultsToolTip") }}</span>
      </v-tooltip>

      <v-color-picker hide-canvas mode="hsla" :disabled="
          !strokeColorAgreement || totallyDisableStrokeColorSelector || noStroke
        " show-swatches
        :hide-inputs="!strokeColorAgreement || !showStrokeOptions"
        hide-mode-switch :swatches-max-height="strokeSwatchHeight"
        v-model="hslaStrokeColorObject" id="strokeColorPicker"
        @update:color="onStrokeColorChange"></v-color-picker>
      <v-checkbox v-show="strokeColorAgreement" v-model="noStroke"
        label="No Stroke" color="indigo darken-3" @change="setNoStroke"
        hide-details x-small dense></v-checkbox>
    </fade-in-card>

    <fade-in-card :showWhen="
        (!isBackFace() && (hasFillColor || noObjectsSelected)) ||
          (isBackFace() && !dynamicBackStyle && hasFillColor)
      ">
      <span class="text-subtitle-2">{{ $t("style.fillColor") }}</span>
      <br />
      <span v-show="totallyDisableFillColorSelector">
        {{ $t("style.selectAnObject") }}
      </span>
      <v-tooltip v-if="!fillColorAgreement" bottom
        :open-delay="toolTipOpenDelay" :close-delay="toolTipCloseDelay"
        max-width="400px">
        <template v-slot:activator="{ on }">
          <v-btn v-on="on" color="error"
            v-show="!totallyDisableFillColorSelector" text small outlined
            ripple @click="setCommonFillColorAgreement">
            {{ $t("style.differingStylesDetected") }}
          </v-btn>
        </template>
        <span>{{ $t("style.differingStylesDetectedToolTip") }}</span>
      </v-tooltip>

      <v-tooltip bottom v-else :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay" max-width="400px">
        <template v-slot:activator="{ on }">
          <v-btn v-on="on" v-show="!totallyDisableFillColorSelector" text
            outlined ripple small @click="showFillColorOptions">
            {{ $t("style.showColorPresets") }}
          </v-btn>
        </template>
        <span>{{ $t("style.showColorPresetsToolTip") }}</span>
      </v-tooltip>

      <v-tooltip bottom :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay" max-width="400px">
        <template v-slot:activator="{ on }">
          <v-btn v-on="on"
            v-show="fillColorAgreement && !totallyDisableFillColorSelector"
            @click="clearRecentFillColorChanges" text outlined ripple
            small>
            {{ $t("style.clearChanges") }}
          </v-btn>
        </template>
        <span>{{ $t("style.clearChangesToolTip") }}</span>
      </v-tooltip>

      <v-tooltip bottom :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay" max-width="400px">
        <template v-slot:activator="{ on }">
          <v-btn v-on="on"
            v-show="fillColorAgreement && !totallyDisableFillColorSelector"
            @click="resetFillColorToDefaults" text small outlined ripple>
            {{ $t("style.restoreDefaults") }}
          </v-btn>
        </template>
        <span>{{ $t("style.restoreDefaultsToolTip") }}</span>
      </v-tooltip>

      <v-color-picker hide-canvas mode="hsla" :disabled="
          !fillColorAgreement || totallyDisableFillColorSelector || noFill
        " show-swatches
        :hide-inputs="!fillColorAgreement || !showFillOptions"
        hide-mode-switch :swatches-max-height="fillSwatchHeight"
        v-model="hslaFillColorObject" id="fillColorPicker"
        @update:color="onFillColorChange"></v-color-picker>
      <v-checkbox v-show="fillColorAgreement" v-model="noFill"
        label="No Fill" color="indigo darken-3" @change="setNoFill"
        hide-details x-small dense></v-checkbox>
    </fade-in-card>

    <fade-in-card :showWhen="
        (!isBackFace() && (hasStrokeWidthPercent || noObjectsSelected)) ||
          (isBackFace() && !dynamicBackStyle && hasStrokeWidthPercent)
      ">
      <SliderInput :data.sync="strokeWidthPercent"
        :min-value="minStrokeWidthPercent"
        :max-value="maxStrokeWidthPercent" style-name="strokeWidthPercent"
        :initial-style-states="initialStyleStates" :front-side="true">
        <template v-slot:title>
          <span
            class="text-subtitle-2">{{ $t("style.strokeWidthPercent") }}</span>
          <!--span v-show="
          !totallyDisableStrokeWidthPercentSelector &&
            strokeWidthPercentAgreement
        ">
            (Percent of Default: {{ strokeWidthPercent }}%)
          </span-->
        </template>
      </SliderInput>
    </fade-in-card>

    <fade-in-card :showWhen="
        (!isBackFace() && (hasPointRadiusPercent || noObjectsSelected)) ||
          (isBackFace() && !dynamicBackStyle && hasPointRadiusPercent)
      ">
      <span
        class="text-subtitle-2">{{ $t("style.pointRadiusPercent") }}</span>
      <span v-show="
          !totallyDisablePointRadiusPercentSelector &&
            pointRadiusPercentAgreement
        ">
        (Percent of Default: {{ pointRadiusPercent }}%)
      </span>
      <br />
      <span v-show="totallyDisablePointRadiusPercentSelector">
        {{ $t("style.selectAnObject") }}
      </span>
      <v-tooltip v-if="!pointRadiusPercentAgreement" bottom
        :open-delay="toolTipOpenDelay" :close-delay="toolTipCloseDelay">
        <template v-slot:activator="{ on }">
          <v-btn color="error" v-on="on"
            v-show="!totallyDisablePointRadiusPercentSelector" text small
            outlined ripple @click="setCommonPointRadiusPercentAgreement">
            {{ $t("style.differingStylesDetected") }}
          </v-btn>
        </template>
        <span>{{ $t("style.differingStylesDetectedToolTip") }}</span>
      </v-tooltip>

      <v-tooltip bottom :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay" max-width="400px">
        <template v-slot:activator="{ on }">
          <v-btn v-on="on" v-show="
              pointRadiusPercentAgreement &&
                !totallyDisablePointRadiusPercentSelector
            " @click="clearRecentPointRadiusPercentChanges" text outlined
            ripple small>
            {{ $t("style.clearChanges") }}
          </v-btn>
        </template>
        <span>{{ $t("style.clearChangesToolTip") }}</span>
      </v-tooltip>

      <v-tooltip bottom :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay" max-width="400px">
        <template v-slot:activator="{ on }">
          <v-btn v-on="on" v-show="
              pointRadiusPercentAgreement &&
                !totallyDisablePointRadiusPercentSelector
            " @click="resetPointRadiusPercentToDefaults" text small
            outlined ripple>
            {{ $t("style.restoreDefaults") }}
          </v-btn>
        </template>
        <span>{{ $t("style.restoreDefaultsToolTip") }}</span>
      </v-tooltip>

      <v-slider v-model.number="pointRadiusPercent"
        :min="minPointRadiusPercent" :disabled="
          !pointRadiusPercentAgreement ||
            totallyDisablePointRadiusPercentSelector
        " @change="onPointRadiusPercentChange"
        :max="maxPointRadiusPercent" type="range" class="mt-8">
        <template v-slot:prepend>
          <v-icon @click="decrementPointRadiusPercent">mdi-minus</v-icon>
        </template>

        <template v-slot:append>
          <v-icon @click="incrementPointRadiusPercent">mdi-plus</v-icon>
        </template>
      </v-slider>
    </fade-in-card>

    <fade-in-card :showWhen="
        (!isBackFace() && (hasOpacity || noObjectsSelected)) ||
          (isBackFace() && !dynamicBackStyle)
      ">
      <span class="text-subtitle-2">{{ $t("style.opacity") }}</span>
      <span v-show="!totallyDisableOpacitySelector && opacityAgreement">
        (Value: {{ this.opacity }})
      </span>
      <br />
      <span v-show="totallyDisableOpacitySelector">
        {{ $t("style.selectAnObject") }}
      </span>
      <v-tooltip v-if="!opacityAgreement" bottom
        :open-delay="toolTipOpenDelay" :close-delay="toolTipCloseDelay"
        max-width="400px">
        <template v-slot:activator="{ on }">
          <v-btn color="error" v-on="on"
            v-show="!totallyDisableOpacitySelector" text small outlined
            ripple @click="setCommonOpacityAgreement">
            {{ $t("style.differingStylesDetected") }}
          </v-btn>
        </template>
        <span>{{ $t("style.differingStylesDetectedToolTip") }}</span>
      </v-tooltip>

      <v-tooltip bottom :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay" max-width="400px">
        <template v-slot:activator="{ on }">
          <v-btn v-on="on"
            v-show="opacityAgreement && !totallyDisableOpacitySelector"
            @click="clearRecentOpacityChanges" text outlined ripple small>
            {{ $t("style.clearChanges") }}
          </v-btn>
        </template>
        <span>{{ $t("style.clearChangesToolTip") }}</span>
      </v-tooltip>

      <v-tooltip bottom :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay" max-width="400px">
        <template v-slot:activator="{ on }">
          <v-btn v-on="on"
            v-show="opacityAgreement && !totallyDisableOpacitySelector"
            @click="resetOpacityToDefaults" text small outlined ripple>
            {{ $t("style.restoreDefaults") }}
          </v-btn>
        </template>
        <span>{{ $t("style.restoreDefaultsToolTip") }}</span>
      </v-tooltip>

      <v-slider v-model.number="opacity" :min="0" step="0.1"
        :disabled="!opacityAgreement || totallyDisableOpacitySelector"
        @change="onOpacityChange" :max="1" type="range" class="mt-8">
        <template v-slot:prepend>
          <v-icon @click="decrementOpacity">mdi-minus</v-icon>
        </template>

        <template v-slot:append>
          <v-icon @click="incrementOpacity">mdi-plus</v-icon>
        </template>
      </v-slider>
    </fade-in-card>

    <!-- Dash array card is displayed for front and back so long as there is a dash array property common to all selected objects-->
    <fade-in-card :showWhen="hasDashPattern || noObjectsSelected">
      <span class="text-subtitle-2">{{ $t("style.dashPattern") }}</span>
      <span v-show="
          !emptyDashPattern &&
            !totallyDisableDashPatternSelector &&
            dashPatternAgreement
        ">
        (Gap/Length Pattern: {{ gapLength.toFixed(1) }}/{{
          dashLength.toFixed(1)
        }})
      </span>
      <br />
      <span v-show="totallyDisableDashPatternSelector">
        {{ $t("style.selectAnObject") }}
      </span>
      <v-tooltip v-if="!dashPatternAgreement" bottom
        :open-delay="toolTipOpenDelay" :close-delay="toolTipCloseDelay"
        max-width="400px">
        <template v-slot:activator="{ on }">
          <v-btn color="error" v-on="on"
            v-show="!totallyDisableDashPatternSelector" text small outlined
            ripple @click="setCommonDashPatternAgreement">
            {{ $t("style.differingStylesDetected") }}
          </v-btn>
        </template>
        <span>{{ $t("style.differingStylesDetectedToolTip") }}</span>
      </v-tooltip>

      <v-tooltip v-if="emptyDashPattern" bottom
        :open-delay="toolTipOpenDelay" :close-delay="toolTipCloseDelay"
        max-width="400px">
        <template v-slot:activator="{ on }">
          <v-btn v-on="on"
            v-show="!totallyDisableDashPatternSelector && dashPatternAgreement"
            text color="error" outlined ripple small
            @click="toggleDashPatternSliderAvailibity">
            {{ $t("style.enableDashPatternSlider") }}
          </v-btn>
        </template>
        <span>{{ $t("style.enableDashPatternSliderToolTip") }}</span>
      </v-tooltip>

      <v-tooltip v-else bottom :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay" max-width="400px">
        <template v-slot:activator="{ on }">
          <v-btn v-on="on"
            v-show="!totallyDisableFillColorSelector && dashPatternAgreement"
            text outlined ripple small
            @click="toggleDashPatternSliderAvailibity">
            {{ $t("style.disableDashPatternSlider") }}
          </v-btn>
        </template>
        <span>{{ $t("style.disableDashPatternSliderToolTip") }}</span>
      </v-tooltip>

      <v-tooltip bottom :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay" max-width="400px">
        <template v-slot:activator="{ on }">
          <v-btn v-on="on" v-show="
              dashPatternAgreement &&
                !totallyDisableDashPatternSelector &&
                !emptyDashPattern
            " @click="clearRecentDashPatternChanges" text outlined ripple
            small>
            {{ $t("style.clearChanges") }}
          </v-btn>
        </template>
        <span>{{ $t("style.clearChangesToolTip") }}</span>
      </v-tooltip>

      <v-tooltip bottom :open-delay="toolTipOpenDelay"
        :close-delay="toolTipCloseDelay" max-width="400px">
        <template v-slot:activator="{ on }">
          <v-btn v-on="on" v-show="
              dashPatternAgreement &&
                !totallyDisableDashPatternSelector &&
                !emptyDashPattern
            " @click="resetDashPatternToDefaults" text small outlined
            ripple>
            {{ $t("style.restoreDefaults") }}
          </v-btn>
        </template>
        <span>{{ $t("style.restoreDefaultsToolTip") }}</span>
      </v-tooltip>

      {{ sliderDashArray }}
      <v-range-slider v-model="sliderDashArray" :min="0" step="1"
        :disabled="
          !dashPatternAgreement ||
            totallyDisableDashPatternSelector ||
            emptyDashPattern
        " @change="onDashPatternChange" :max="maxGapLengthPlusDashLength"
        type="range" class="mt-8">
        <template v-slot:prepend>
          <v-icon @click="decrementDashPattern">mdi-minus</v-icon>
        </template>

        <template v-slot:append>
          <v-icon @click="incrementDashPattern">mdi-plus</v-icon>
        </template>
      </v-range-slider>
    </fade-in-card>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Watch, Prop } from "vue-property-decorator";
import { SENodule } from "../models/SENodule";
import Nodule from "../plottables/Nodule";
import { State } from "vuex-class";
import { Styles, StyleOptions } from "../types/Styles";
import SETTINGS from "@/global-settings";
import FadeInCard from "@/components/FadeInCard.vue";
import { hslaColorType } from "@/types";
import { StyleNoduleCommand } from "@/commands/StyleNoduleCommand";
import EventBus from "@/eventHandlers/EventBus";
import SliderInput from "@/components/SliderInput.vue"
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

@Component({ components: { FadeInCard, SliderInput } })
export default class FrontStyle extends Vue {
  @Prop()
  readonly frontSide!: boolean;

  @State
  readonly selections!: SENodule[];
  // The old selection to help with undo/redo commands
  private oldSelection: SENodule[] = [];

  /**
   * When the selected objects are first processed by the style panel their style state is recorded here
   * this is so we can undo the styling changes and have a revert to initial state button
   */
  private initialStyleStates: StyleOptions[] = [];
  /**
   * These are the default style state for the selected objects.
   */
  private defaultStyleStates: StyleOptions[] = [];

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
   * There are 7 style options. In the case that there
   * are more than one object selected, the XXXAgreement boolean indicates if the XXX property is *initially* the
   * same across the selected objects. In the case that they are not initially the same, the cooresponding adjustment tool
   * is display in a different way than the usual default.
   */
  private strokeWidthPercent: number | undefined = 100;
  private maxStrokeWidthPercent = SETTINGS.style.maxStrokeWidthPercent;
  private minStrokeWidthPercent = SETTINGS.style.minStrokeWidthPercent;

  private pointRadiusPercent: number | undefined = 100;
  private pointRadiusPercentAgreement = true;
  private totallyDisablePointRadiusPercentSelector = false;
  private maxPointRadiusPercent = SETTINGS.style.maxPointRadiusPercent;
  private minPointRadiusPercent = SETTINGS.style.minPointRadiusPercent;

  private strokeColor: string | undefined = "hsl(0,0%,0%,0)"; //Color recognisable by TwoJs
  private hslaStrokeColorObject: hslaColorType = { h: 0, s: 1, l: 1, a: 0 }; // Color for Vuetify Color picker
  private strokeColorAgreement = true;
  private strokeSwatchHeight = 100;
  // strokeCanvasHeight is disabled it doesn't work right change hide-canvas to :canvas-height="strokeCanvasHeight" to enable
  private strokeCanvasHeight = 40;
  private showStrokeOptions = false;
  private totallyDisableStrokeColorSelector = false;
  private noStroke = false;
  private preNoStrokeColor: string | undefined = "";

  private fillColor: string | undefined = "hsl(0,0%,0%,0)"; //Color recognisable by TwoJs
  private hslaFillColorObject: hslaColorType = { h: 0, s: 1, l: 1, a: 0 }; // Color for Vuetify Color picker
  private fillColorAgreement = true;
  private fillSwatchHeight = 0;
  // strokeCanvasHeight is disabled it doesn't work right change hide-canvas to :canvas-height="fillCanvasHeight" to enable
  private fillCanvasHeight = 40;
  private showFillOptions = false;
  private totallyDisableFillColorSelector = false;
  private noFill = false;
  private preNoFillColor: string | undefined = "";

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
  private opacityAgreement = true;
  private totallyDisableOpacitySelector = false;

  private dynamicBackStyle: boolean | undefined = true;
  private dynamicBackStyleAgreement = true;
  private totallyDisableDynamicBackStyleSelector = false;
  private backStyleContrast = Nodule.getBackStyleContrast();
  private initialBackStyleContrast = SETTINGS.style.backStyleContrast;

  /**
 * Common style properties are the enum with values of 
  //   strokeWidthPercent,
  //   strokeColor,
  //   fillColor,
  //   dashArray,
  //   opacity,
  //   dynamicBackStyle,
  //   pointRadiusPercent
 */
  commonStyleProperties: number[] = [];

  constructor() {
    super();
  }

  /** mounted() is part of VueJS lifecycle hooks */
  mounted(): void {
    //If there are already objects selected set the style panel to edit them (OK to pass empty string because that will set the defaults)
    this.onSelectionChanged(this.$store.getters.selectedSENodules());
    EventBus.listen("save-style-state", this.saveStyleState);
  }

  isBackFace(): boolean {
    return this.frontSide === false;
  }



  // These methods are linked to the the stroke color of the elements in the selected objects
  onStrokeColorChange(): void {
    this.strokeColor = Nodule.convertHSLAObjectToString(
      this.hslaStrokeColorObject
    );
    this.$store.commit("changeStyle", {
      selected: this.$store.getters.selectedSENodules(),
      front: this.frontSide,
      strokeColor: this.strokeColor
    });
  }
  setCommonStrokeColorArgreement(): void {
    this.strokeColorAgreement = true;
  }
  showStrokeColorOptions(): void {
    if (!this.noStroke) {
      this.showStrokeOptions = !this.showStrokeOptions;
      if (this.showStrokeOptions) {
        this.strokeSwatchHeight = 100;
        // this.strokeCanvasHeight = 30;
      } else {
        this.strokeSwatchHeight = 0;
        // this.strokeCanvasHeight = 0;
      }
    } else {
      this.strokeSwatchHeight = 0;
      // this.strokeCanvasHeight = 0;
      this.showStrokeOptions = false;
    }
  }
  clearRecentStrokeColorChanges(): void {
    const selected = this.$store.getters.selectedSENodules();
    for (let i = 0; i < selected.length; i++) {
      this.$store.commit("changeStyle", {
        selected: [selected[i]],
        front: this.frontSide,
        strokeColor: this.initialStyleStates[i].strokeColor
      });
    }
    this.preNoStrokeColor = this.strokeColor;
    this.setStrokeColorSelectorState(this.initialStyleStates);
  }
  resetStrokeColorToDefaults(): void {
    const selected = this.$store.getters.selectedSENodules();
    for (let i = 0; i < selected.length; i++) {
      this.$store.commit("changeStyle", {
        selected: [selected[i]],
        front: this.frontSide,
        strokeColor: this.defaultStyleStates[i].strokeColor
      });
    }
    this.setStrokeColorSelectorState(this.defaultStyleStates);
  }
  setStrokeColorSelectorState(styleState: StyleOptions[]): void {
    this.strokeColorAgreement = true;
    this.totallyDisableStrokeColorSelector = false;
    this.strokeColor = styleState[0].strokeColor;
    if (this.strokeColor == "noStroke") {
      this.hslaStrokeColorObject = Nodule.convertStringToHSLAObject(
        "hsla(0,0%,0%,0.001)"
      );
      this.strokeSwatchHeight = 0;
      this.strokeCanvasHeight = 0;
      this.showStrokeOptions = false;
      this.noStroke = true;
    } else {
      this.hslaStrokeColorObject = Nodule.convertStringToHSLAObject(
        this.strokeColor
      );
      this.strokeCanvasHeight = 50;
      this.noStroke = false;
    }

    // screen for undefined - if undefined then this is not a property that is going to be set by the style panel for this selection of objects
    if (this.strokeColor) {
      if (
        !styleState.every(
          styleObject => styleObject.strokeColor == this.strokeColor
        )
      ) {
        // The strokeColor property exists on the selected objects but the stroke color doesn't agree (so don't totally disable the selector)
        this.disableStrokeColorSelector(false);
      }
    } else {
      // The strokeColor property doesn't exists on the selected objects so totally disable the selector
      this.disableStrokeColorSelector(true);
    }
  }
  disableStrokeColorSelector(totally: boolean): void {
    this.strokeColorAgreement = false;
    this.strokeColor = "hsla(0,100%,100%,0)";
    this.hslaStrokeColorObject = Nodule.convertStringToHSLAObject(
      this.strokeColor
    );
    this.strokeSwatchHeight = 0;
    this.strokeCanvasHeight = 0;
    this.showStrokeOptions = false;
    this.totallyDisableStrokeColorSelector = totally;
  }
  setNoStroke(): void {
    if (this.noStroke) {
      this.preNoStrokeColor = this.strokeColor;
      this.strokeColor = "noStroke";
      this.hslaStrokeColorObject = Nodule.convertStringToHSLAObject(
        "hsla(0,100%,100%,0)"
      );
      this.strokeSwatchHeight = 0;
      this.strokeCanvasHeight = 0;
      this.showStrokeOptions = false;
    } else {
      this.strokeCanvasHeight = 50;
      this.strokeColor = this.preNoStrokeColor;
      this.hslaStrokeColorObject = Nodule.convertStringToHSLAObject(
        this.strokeColor
      );
    }
    this.$store.commit("changeStyle", {
      selected: this.$store.getters.selectedSENodules(),
      front: this.frontSide,
      strokeColor: this.strokeColor
    });
  }

  // These methods are linked to the fill color of the elements in the selected objects
  onFillColorChange(): void {
    this.fillColor = Nodule.convertHSLAObjectToString(this.hslaFillColorObject);
    this.$store.commit("changeStyle", {
      selected: this.$store.getters.selectedSENodules(),
      front: this.frontSide,
      fillColor: this.fillColor
    });
  }
  setCommonFillColorAgreement(): void {
    this.fillColorAgreement = true;
  }
  showFillColorOptions(): void {
    if (!this.noFill) {
      this.showFillOptions = !this.showFillOptions;
      if (this.showFillOptions) {
        this.fillSwatchHeight = 100;
      } else {
        this.fillSwatchHeight = 0;
      }
    } else {
      this.fillSwatchHeight = 0;
      this.showFillOptions = false;
    }
  }
  clearRecentFillColorChanges(): void {
    const selected = this.$store.getters.selectedSENodules();
    for (let i = 0; i < selected.length; i++) {
      this.$store.commit("changeStyle", {
        selected: [selected[i]],
        front: this.frontSide,
        fillColor: this.initialStyleStates[i].fillColor
      });
    }
    this.preNoFillColor = this.fillColor;
    this.setFillColorSelectorState(this.initialStyleStates);
  }
  resetFillColorToDefaults(): void {
    const selected = this.$store.getters.selectedSENodules();
    for (let i = 0; i < selected.length; i++) {
      this.$store.commit("changeStyle", {
        selected: [selected[i]],
        front: this.frontSide,
        fillColor: this.defaultStyleStates[i].fillColor
      });
    }
    this.setFillColorSelectorState(this.defaultStyleStates);
  }
  setFillColorSelectorState(styleState: StyleOptions[]): void {
    this.fillColorAgreement = true;
    this.totallyDisableFillColorSelector = false;
    this.fillColor = styleState[0].fillColor;

    if (this.fillColor == "noFill") {
      this.hslaFillColorObject = Nodule.convertStringToHSLAObject(
        "hsla(0,0%,0%,0.001)"
      );
      this.fillSwatchHeight = 0;
      this.fillCanvasHeight = 0;
      this.showFillOptions = false;
      this.noFill = true;
    } else {
      this.fillCanvasHeight = 50;
      this.hslaFillColorObject = Nodule.convertStringToHSLAObject(
        this.fillColor
      );
      this.noFill = false;
    }
    // screen for undefined - if undefined then this is not a property that is going to be set by the style panel for this selection of objects
    if (this.fillColor) {
      if (
        !styleState.every(
          styleObject => styleObject.fillColor == this.fillColor
        )
      ) {
        // The fillColor property exists on the selected objects but the fill color doesn't agree (so don't totally disable the selector)
        this.disableFillColorSelector(false);
      }
    } else {
      // The fillColor property doesn't exists on the selected objects so totally disable the selector
      this.disableFillColorSelector(true);
    }
  }
  disableFillColorSelector(totally: boolean): void {
    this.fillColorAgreement = false;
    this.fillColor = "hsla(0,100%,100%,0)";
    this.hslaFillColorObject = Nodule.convertStringToHSLAObject(this.fillColor);
    this.fillSwatchHeight = 0;
    this.fillCanvasHeight = 0;
    this.showFillOptions = false;
    this.totallyDisableFillColorSelector = totally;
  }
  setNoFill(): void {
    if (this.noFill) {
      this.preNoFillColor = this.fillColor;
      this.fillColor = "noFill";
      this.hslaFillColorObject = Nodule.convertStringToHSLAObject(
        "hsla(0,100%,100%,0)"
      );
      this.fillSwatchHeight = 0;
      this.fillCanvasHeight = 0;
      this.showFillOptions = false;
    } else {
      this.fillCanvasHeight = 50;
      this.fillColor = this.preNoFillColor;
      this.hslaFillColorObject = Nodule.convertStringToHSLAObject(
        this.fillColor
      );
    }
    this.$store.commit("changeStyle", {
      selected: this.$store.getters.selectedSENodules(),
      front: this.frontSide,
      fillColor: this.fillColor
    });
  }
  // These methods are linked to the pointRadiusPercent fade-in-card
  onPointRadiusPercentChange(): void {
    this.$store.commit("changeStyle", {
      selected: this.$store.getters.selectedSENodules(),
      front: this.frontSide,
      pointRadiusPercent: this.pointRadiusPercent
    });
  }
  setCommonPointRadiusPercentAgreement(): void {
    this.pointRadiusPercentAgreement = true;
  }
  clearRecentPointRadiusPercentChanges(): void {
    const selected = this.$store.getters.selectedSENodules();
    for (let i = 0; i < selected.length; i++) {
      this.$store.commit("changeStyle", {
        selected: [selected[i]],
        front: this.frontSide,
        pointRadiusPercent: this.initialStyleStates[i].pointRadiusPercent
      });
    }
    this.setPointRadiusPercentSelectorState(this.initialStyleStates);
  }
  resetPointRadiusPercentToDefaults(): void {
    const selected = this.$store.getters.selectedSENodules();
    for (let i = 0; i < selected.length; i++) {
      this.$store.commit("changeStyle", {
        selected: [selected[i]],
        front: this.frontSide,
        pointRadiusPercent: this.defaultStyleStates[i].pointRadiusPercent
      });
    }
    this.setPointRadiusPercentSelectorState(this.defaultStyleStates);
  }
  incrementPointRadiusPercent(): void {
    if (
      this.pointRadiusPercent != undefined &&
      this.pointRadiusPercent + 10 <= SETTINGS.style.maxPointRadiusPercent
    ) {
      this.pointRadiusPercent += 10;
      this.$store.commit("changeStyle", {
        selected: this.$store.getters.selectedSENodules(),
        front: this.frontSide,
        pointRadiusPercent: this.pointRadiusPercent
      });
    }
  }
  decrementPointRadiusPercent(): void {
    if (
      this.pointRadiusPercent != undefined &&
      this.pointRadiusPercent - 10 >= SETTINGS.style.minPointRadiusPercent
    ) {
      this.pointRadiusPercent -= 10;
      this.$store.commit("changeStyle", {
        selected: this.$store.getters.selectedSENodules(),
        front: this.frontSide,
        pointRadiusPercent: this.pointRadiusPercent
      });
    }
  }
  setPointRadiusPercentSelectorState(styleState: StyleOptions[]): void {
    this.pointRadiusPercentAgreement = true;
    this.totallyDisablePointRadiusPercentSelector = false;
    this.pointRadiusPercent = styleState[0].pointRadiusPercent;
    // screen for undefined - if undefined then this is not a property that is going to be set by the style panel for this selection of objects
    if (this.pointRadiusPercent) {
      if (
        !styleState.every(
          styleObject =>
            styleObject.pointRadiusPercent == this.pointRadiusPercent
        )
      ) {
        // The strokeColor property exists on the selected objects but the point radius percent doesn't agree (so don't totally disable the selector)
        this.disablePointRadiusPercentSelector(false);
      }
    } else {
      // The point radius percent property doesn't exists on the selected objects so totally disable the selector
      this.disablePointRadiusPercentSelector(true);
    }
  }
  disablePointRadiusPercentSelector(totally: boolean): void {
    this.pointRadiusPercentAgreement = false;
    this.pointRadiusPercent = 100;
    this.totallyDisablePointRadiusPercentSelector = totally;
  }

  // These methods are linked to the opacity fade-in-card
  onOpacityChange(): void {
    this.$store.commit("changeStyle", {
      selected: this.$store.getters.selectedSENodules(),
      front: this.frontSide,
      opacity: this.opacity
    });
  }
  setCommonOpacityAgreement(): void {
    this.opacityAgreement = true;
  }
  clearRecentOpacityChanges(): void {
    const selected = this.$store.getters.selectedSENodules();
    for (let i = 0; i < selected.length; i++) {
      this.$store.commit("changeStyle", {
        selected: [selected[i]],
        front: this.frontSide,
        opacity: this.initialStyleStates[i].opacity
      });
    }
    this.setOpacitySelectorState(this.initialStyleStates);
  }
  resetOpacityToDefaults(): void {
    const selected = this.$store.getters.selectedSENodules();
    for (let i = 0; i < selected.length; i++) {
      this.$store.commit("changeStyle", {
        selected: [selected[i]],
        front: this.frontSide,
        opacity: this.defaultStyleStates[i].opacity
      });
    }
    this.setOpacitySelectorState(this.defaultStyleStates);
  }
  incrementOpacity(): void {
    if (this.opacity != undefined && this.opacity + 0.1 <= 1) {
      this.opacity += 0.1;
      this.$store.commit("changeStyle", {
        selected: this.$store.getters.selectedSENodules(),
        front: this.frontSide,
        opacity: this.opacity
      });
    }
  }
  decrementOpacity(): void {
    if (this.opacity != undefined && this.opacity - 0.1 >= 0) {
      this.opacity -= 0.1;
      this.$store.commit("changeStyle", {
        selected: this.$store.getters.selectedSENodules(),
        front: this.frontSide,
        opacity: this.opacity
      });
    }
  }
  setOpacitySelectorState(styleState: StyleOptions[]): void {
    this.opacityAgreement = true;
    this.totallyDisableOpacitySelector = false;
    this.opacity = styleState[0].opacity;
    // screen for undefined - if undefined then this is not a property that is going to be set by the style panel for this selection of objects
    if (this.opacity) {
      if (
        !styleState.every(styleObject => styleObject.opacity == this.opacity)
      ) {
        // The strokeColor property exists on the selected objects but the opacity doesn't agree (so don't totally disable the selector)
        this.disableOpacitySelector(false);
      }
    } else {
      // The opacity property doesn't exists on the selected objects so totally disable the selector
      this.disableOpacitySelector(true);
    }
  }
  disableOpacitySelector(totally: boolean): void {
    this.opacityAgreement = false;
    this.opacity = 100;
    this.totallyDisableOpacitySelector = totally;
  }

  // These methods are linked to the dashPattern fade-in-card
  onDashPatternChange(): void {
    this.gapLength = this.sliderDashArray[0];
    this.dashLength = this.sliderDashArray[1] - this.sliderDashArray[0];
    this.$store.commit("changeStyle", {
      selected: this.$store.getters.selectedSENodules(),
      front: this.frontSide,
      dashArray: [this.dashLength, this.gapLength] //correct order!!!!
    });
  }
  setCommonDashPatternAgreement(): void {
    this.dashPatternAgreement = true;
  }
  clearRecentDashPatternChanges(): void {
    const selected = this.$store.getters.selectedSENodules();
    for (let i = 0; i < selected.length; i++) {
      // Check see if the initialStylesStates[i] exist and has length >0
      if (
        this.initialStyleStates[i].dashArray &&
        (this.initialStyleStates[i].dashArray as number[]).length > 0
      ) {
        this.$store.commit("changeStyle", {
          selected: [selected[i]],
          front: this.frontSide,
          dashArray: [
            (this.initialStyleStates[i].dashArray as number[])[0],
            (this.initialStyleStates[i].dashArray as number[])[1]
          ]
        });
      } else if (this.initialStyleStates[i].dashArray) {
        // The selected [i] exists and the array is empty
        this.$store.commit("changeStyle", {
          selected: [selected[i]],
          front: this.frontSide,
          dashArray: []
        });
      }
    }
    this.setDashPatternSelectorState(this.initialStyleStates);
  }
  resetDashPatternToDefaults(): void {
    const selected = this.$store.getters.selectedSENodules();
    for (let i = 0; i < selected.length; i++) {
      // Check see if the selected[i] exist and has length >0
      if (
        this.defaultStyleStates[i].dashArray &&
        (this.defaultStyleStates[i].dashArray as number[]).length > 0
      ) {
        this.$store.commit("changeStyle", {
          selected: [selected[i]],
          front: this.frontSide,
          dashArray: [
            (this.defaultStyleStates[i].dashArray as number[])[0],
            (this.defaultStyleStates[i].dashArray as number[])[1]
          ]
        });
      } else if (this.defaultStyleStates[i].dashArray) {
        // The selected [i] exists and the array is empty
        this.$store.commit("changeStyle", {
          selected: [selected[i]],
          front: this.frontSide,
          dashArray: []
        });
      }
    }
    this.setDashPatternSelectorState(this.defaultStyleStates);
  }

  toggleDashPatternSliderAvailibity(): void {
    if (this.emptyDashPattern) {
      this.sliderDashArray.clear();
      this.sliderDashArray.push(this.gapLength as number);
      this.sliderDashArray.push(
        (this.dashLength as number) + (this.gapLength as number)
      );
      this.$store.commit("changeStyle", {
        selected: this.$store.getters.selectedSENodules(),
        front: this.frontSide,
        dashArray: [this.dashLength, this.gapLength]
      });
    } else {
      this.$store.commit("changeStyle", {
        selected: this.$store.getters.selectedSENodules(),
        front: this.frontSide,
        dashArray: []
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
      Vue.set(this.sliderDashArray, 1, this.sliderDashArray[1] + 1);
      this.gapLength = this.sliderDashArray[0];
      this.dashLength = this.sliderDashArray[1] - this.sliderDashArray[0];
      this.$store.commit("changeStyle", {
        selected: this.$store.getters.selectedSENodules(),
        front: this.frontSide,
        dashArray: [this.dashLength, this.gapLength]
      });
      /** TODO:
       * The actual dots on the slider are not moveing when I click the plus (+) sign and trigger this incrementDashPattern method
       * How do I trigger an event that will cause the actual dots on the slider to move?
       */
    }
  }

  decrementDashPattern(): void {
    // increasing the value of the sliderDashArray[0] decreases the length of the dash
    if (
      this.sliderDashArray[0] + 1 <=
      SETTINGS.style.maxGapLengthPlusDashLength
    ) {
      Vue.set(this.sliderDashArray, 0, this.sliderDashArray[0] + 1);
      this.gapLength = this.sliderDashArray[0];
      this.dashLength = this.sliderDashArray[1] - this.sliderDashArray[0];

      this.$store.commit("changeStyle", {
        selected: this.$store.getters.selectedSENodules(),
        front: this.frontSide,
        dashArray: [this.dashLength, this.gapLength]
      });
    }
    /** TODO:
     * The actual dots on the slider are not moveing when I click the plus (-) sign and trigger this decrementDashPattern method
     * How do I trigger an event that will cause the actual dots on the slider to move?
     */
  }

  setDashPatternSelectorState(styleState: StyleOptions[]): void {
    // reset to the default which are overwritten as necessary
    this.emptyDashPattern = true;
    this.dashPatternAgreement = true;
    this.gapLength = 5;
    this.dashLength = 10;
    this.totallyDisableDashPatternSelector = false;
    if (styleState[0].dashArray) {
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
          // The strokeColor property exists on the selected objects but the dash array doesn't agree (so don't totally disable the selector)
          this.disableDashPatternSelector(false);
        }
      } else {
        // make sure that all selected objects have zero length dash array
        if (
          !styleState.every(styleObject => {
            if (styleObject.dashArray) {
              return styleObject.dashArray.length == 0;
            } else {
              return false;
            }
          })
        ) {
          // The strokeColor property exists on the selected objects but the dash array doesn't agree (so don't totally disable the selector)
          this.disableDashPatternSelector(false);
        }
      }
    } else {
      // The strokeColor property doesn't exists on the selected objects so totally disable the selector
      this.disableDashPatternSelector(true);
    }
    // Set the slider dash array values
    this.sliderDashArray.clear();
    this.sliderDashArray.push(this.gapLength);
    this.sliderDashArray.push(this.gapLength + this.dashLength);
  }

  disableDashPatternSelector(totally: boolean): void {
    this.dashPatternAgreement = false;
    // Set the gap and dash to the default
    this.gapLength = 5;
    this.dashLength = 10;
    this.totallyDisableDashPatternSelector = totally;
  }

  // These methods are linked to the dynamicBackStyle fade-in-card
  onBackStyleContrastChange(): void {
    this.$store.commit("changeStyle", {
      selected: this.$store.getters.selectedSENodules(),
      front: this.frontSide,
      backStyleContrast: this.backStyleContrast
    });
  }
  setCommonDynamicBackStyleAgreement(): void {
    this.dynamicBackStyleAgreement = true;
  }
  clearRecentDynamicBackStyleChanges(): void {
    const selected = this.$store.getters.selectedSENodules();
    for (let i = 0; i < selected.length; i++) {
      this.$store.commit("changeStyle", {
        selected: [selected[i]],
        front: this.frontSide,
        backStyleContrast: this.initialBackStyleContrast
      });
    }
    this.backStyleContrast = this.initialBackStyleContrast;
    this.setDynamicBackStyleSelectorState(this.initialStyleStates);
  }
  resetDynamicBackStyleToDefaults(): void {
    const selected = this.$store.getters.selectedSENodules();
    for (let i = 0; i < selected.length; i++) {
      this.$store.commit("changeStyle", {
        selected: [selected[i]],
        front: this.frontSide,
        backStyleContrast: SETTINGS.style.backStyleContrast
      });
    }
    this.backStyleContrast = SETTINGS.style.backStyleContrast;
    this.setDynamicBackStyleSelectorState(this.defaultStyleStates);
  }

  toggleBackStyleContrastSliderAvailibity(): void {
    this.dynamicBackStyle = !this.dynamicBackStyle;
    this.$store.commit("changeStyle", {
      selected: this.$store.getters.selectedSENodules(),
      front: this.frontSide,
      dynamicBackStyle: this.dynamicBackStyle
    });
  }
  incrementBackStyleContrast(): void {
    if (
      this.dynamicBackStyle != undefined &&
      this.backStyleContrast + 0.1 <= 1
    ) {
      this.backStyleContrast += 0.1;
      this.$store.commit("changeStyle", {
        selected: this.$store.getters.selectedSENodules(),
        front: this.frontSide,
        backStyleContrast: this.backStyleContrast
      });
    }
  }
  decrementBackStyleContrast(): void {
    if (
      this.dynamicBackStyle != undefined &&
      this.backStyleContrast - 0.1 >= 0
    ) {
      this.backStyleContrast -= 0.1;
      this.$store.commit("changeStyle", {
        selected: this.$store.getters.selectedSENodules(),
        front: this.frontSide,
        backStyleContrast: this.backStyleContrast
      });
    }
  }

  setDynamicBackStyleSelectorState(styleState: StyleOptions[]): void {
    this.dynamicBackStyleAgreement = true;
    this.totallyDisableDynamicBackStyleSelector = false;
    this.dynamicBackStyle = styleState[0].dynamicBackStyle;
    // screen for undefined - if undefined then this is not a property that is going to be set by the style panel for this selection of objects
    if (this.dynamicBackStyle != undefined) {
      if (
        !styleState.every(
          styleObject => styleObject.dynamicBackStyle == this.dynamicBackStyle
        )
      ) {
        // The strokeColor property exists on the selected objects but the dynamicBackStyle doesn't agree (so don't totally disable the selector)
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
   */
  hasStyle(s: Styles): boolean {
    const sNum = Number(s);
    return (
      this.commonStyleProperties.length > 0 &&
      this.commonStyleProperties.findIndex(x => x === sNum) >= 0
    );
  }

  /**
   * Used to determine which objects the color picker should control (i.e. the check boxes under the color picker)
   */
  get colorKeys(): any[] {
    return this.commonStyleProperties
      .map((id: number) => ({
        // Convert camelCase to title format
        // i.e. "justASimpleText" becomes "Just A Simple Text"
        label: keys[id]
          .replace(
            /([a-z])([A-Z])/g, // global regex
            (_, lowLetter, upLetter) => `${lowLetter} ${upLetter}`
          )
          .replace(/^([a-z])/, (_, firstLetter: string) =>
            firstLetter.toUpperCase()
          ),
        value: keys[id]
      }))
      .filter((e: any) => {
        const { label, _ } = e;
        return label.toLowerCase().indexOf("color") >= 0; // Select entry with "Color" in its label
      });
  }

  /**
   * Used to determine if the color picker Vue component (i.e. fade-in-card) should be displayed
   */
  get hasStrokeColor(): boolean {
    return this.hasStyle(Styles.strokeColor);
  }

  /**
   * Used to determine if the color picker Vue component (i.e. fade-in-card) should be displayed
   */
  get hasFillColor(): boolean {
    return this.hasStyle(Styles.fillColor);
  }
  /**
   * Used to determine if the stroke width slider (i.e. fade-in-card containing the slider) should be displayed
   */
  get hasStrokeWidthPercent(): boolean {
    return this.hasStyle(Styles.strokeWidthPercent);
  }

  get hasPointRadiusPercent(): boolean {
    return this.hasStyle(Styles.pointRadiusPercent);
  }

  get hasOpacity(): boolean {
    return this.hasStyle(Styles.opacity);
  }
  /**
   * Used to determine if the dash gap and dash length  (i.e. fade-in-card containing the sliders) should be displayed
   */
  get hasDashPattern(): boolean {
    return this.hasStyle(Styles.dashArray);
  }
  get hasDynamicBackStyle(): boolean {
    return this.hasStyle(Styles.dynamicBackStyle);
  }

  /**
   * This is an example of the two-way binding that is provided by the Vuex store. As this is a Vue component we can Watch variables, and
   * when they change, this method wil execute in response to that change.
   */
  @Watch("selections")
  onSelectionChanged(newSelection: SENodule[]): void {
    // Before changing the selections save the state for an undo/redo command (if necessary)
    this.saveStyleState();

    this.commonStyleProperties.clear();
    if (newSelection.length === 0) {
      //totally disable the selectors
      // TODO this.disableStrokeWidthPercentSelector(true);
      this.disableStrokeColorSelector(true);
      this.disableFillColorSelector(true);
      this.disablePointRadiusPercentSelector(true);
      this.disableOpacitySelector(true);
      this.disableDashPatternSelector(true);
      this.disableDynamicBackStyleSelector(true);
      this.noObjectsSelected = true;
      this.oldSelection.clear();
      return;
    }
    console.log("newSelection", newSelection.length, newSelection[0].name);
    // record the new selections in the old
    this.oldSelection.clear();
    newSelection.forEach(obj => this.oldSelection.push(obj));

    this.noObjectsSelected = false;
    // Create a list of the common properties that the objects in the selection have.
    // commonStyleProperties is a number (corresponding to an enum) array
    // The customStyles method returns a list of the styles the are adjustable for that object
    for (let k = 0; k < values.length; k++) {
      if (newSelection.every(s => s.customStyles().has(k)))
        this.commonStyleProperties.push(k);
    }

    // Get the initial and default style state of the object for undo/redo and buttons to revert to initial style
    this.initialStyleStates.clear();
    this.defaultStyleStates.clear();
    newSelection.forEach(seNodule => {
      this.initialStyleStates.push(
        seNodule.ref.currentStyleState(this.frontSide)
      );
      this.defaultStyleStates.push(
        seNodule.ref.defaultStyleState(this.frontSide)
      );
    });
    this.initialBackStyleContrast = Nodule.getBackStyleContrast();

    //Set the initial state of the fade-in-card/selectors (checking to see if the property is the same across all selected objects)
    // TODO this.setStrokeWidthPercentSelectorState(this.initialStyleStates);
    this.setStrokeColorSelectorState(this.initialStyleStates);
    this.setFillColorSelectorState(this.initialStyleStates);
    this.setPointRadiusPercentSelectorState(this.initialStyleStates);
    this.setOpacitySelectorState(this.initialStyleStates);
    this.setDashPatternSelectorState(this.initialStyleStates);
    this.setDynamicBackStyleSelectorState(this.initialStyleStates);
  }

  areEquivalentStyles(
    styleStates1: StyleOptions[],
    styleStates2: StyleOptions[]
  ): boolean {
    if (styleStates1.length !== styleStates2.length) {
      return false;
    }
    for (let i = 0; i < styleStates1.length; i++) {
      const a = styleStates1[i];
      const b = styleStates2[i];
      if (
        a.strokeWidthPercent == b.strokeWidthPercent &&
        a.strokeColor == b.strokeColor &&
        a.fillColor == b.fillColor &&
        a.opacity == b.opacity &&
        a.dynamicBackStyle == b.dynamicBackStyle &&
        a.pointRadiusPercent == b.pointRadiusPercent
      ) {
        //noe check the dash array which can be undefined, an empty array,length one array or a length two array.
        if (a.dashArray == undefined && b.dashArray == undefined) {
          break; // stop checking this pair in the array because we can conclude they are equal.
        }
        if (a.dashArray != undefined && b.dashArray != undefined) {
          if (a.dashArray.length == b.dashArray.length) {
            if (a.dashArray.length == 0 && b.dashArray.length == 0) {
              break; // stop checking this pair in the array because we can conclude they are equal.
            } else if (
              a.dashArray.length == 1 &&
              b.dashArray.length == 1 &&
              a.dashArray[0] == b.dashArray[0]
            ) {
              break; // stop checking this pair in the array because we can conclude they are equal.
            } else if (
              a.dashArray.length == 2 &&
              b.dashArray.length == 2 &&
              a.dashArray[0] == b.dashArray[0] &&
              a.dashArray[1] == b.dashArray[1]
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

  saveStyleState(): void {
    if (this.oldSelection.length > 0) {
      console.log("save style state");
      // Check to see if there have been any difference between the current and initial
      //Record the current state of each Nodule
      this.currentStyleStates.clear();
      this.oldSelection.forEach(seNodule => {
        this.currentStyleStates.push(
          seNodule.ref.currentStyleState(this.frontSide)
        );
      });
      if (
        !this.areEquivalentStyles(
          this.currentStyleStates,
          this.initialStyleStates
        ) ||
        this.initialBackStyleContrast != Nodule.getBackStyleContrast()
      ) {
        console.log("Issued new style save command");
        new StyleNoduleCommand(
          this.oldSelection,
          this.frontSide,
          this.currentStyleStates,
          this.initialStyleStates,
          this.initialBackStyleContrast,
          Nodule.getBackStyleContrast()
        ).push();
      }
      // clear the old selection so that this save style state will not be executed again until changes are made.
      this.oldSelection.clear();
    }
  }
}
</script>
<style lang="scss" scoped>
#strokeColorPicker {
  background: "red";
}
/* I wish I knew how to use the SASS options for the vuetify objects! But I don't and I can't find any examples on the web*/
/* $color-picker-controls-padding: 1000px; */
// $color-picker-edit-margin-top: 10px;
</style>
