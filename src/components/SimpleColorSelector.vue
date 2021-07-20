<template>
  <div>
    <div>
      <span class="text-subtitle-2">{{ $t(titleKey)+" " }}</span>
      <v-icon :color="convertColorToRGBAString(colorData)"
        small>mdi-checkbox-blank</v-icon>
    </div>

    <!-- The color picker -->
    <v-color-picker @update:color="onColorChange"
      :disabled="noData"
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
        <v-col cols="auto">
          <v-tooltip bottom
            :open-delay="toolTipOpenDelay"
            :close-delay="toolTipCloseDelay"
            max-width="400px">
            <template v-slot:activator="{ on }">
              <span v-on="on">
                <v-checkbox v-model="noData"
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
        <v-spacer />
        <v-col cols="auto"
          class="ma-0 pl-0 pr-0 pt-2 pb-2">
          <HintButton type="colorInput"
            @click="toggleColorInputs"
            i18n-label="style.showColorInputs"
            i18n-tooltip="style.showColorInputsToolTip">
          </HintButton>
        </v-col>

      </v-row>
    </v-container>
  </div>
</template>



<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, PropSync } from "vue-property-decorator";
import SETTINGS from "@/global-settings";
import Nodule from "@/plottables/Nodule";
import { hslaColorType } from "@/types";
import HintButton from "@/components/HintButton.vue";
import OverlayWithFixButton from "@/components/OverlayWithFixButton.vue";
import i18n from "../i18n";

@Component({ components: { HintButton, OverlayWithFixButton } })
export default class ColorSelector extends Vue {
  @Prop() readonly titleKey!: string;
  @PropSync("data") colorData?: hslaColorType;
  @Prop({ required: true }) readonly styleName!: string;

  //private defaultStyleStates: StyleOptions[] = [];

  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

  private noData = false; // no data means noFill or noStroke
  private preNoColor: string | undefined = "";

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

  toggleColorInputs(): void {
    if (!this.noData) {
      this.showColorInputs = !this.showColorInputs;
    } else {
      this.showColorInputs = false;
    }
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

  onColorChange(newColor: any): void {
    // console.log("color Data", this.colorData);

    this.colorString = Nodule.convertHSLAObjectToString(
      newColor.hsla ?? { h: 0, s: 0, l: 1, a: 1 }
    );
  }

  //No Data means noFill or noStroke
  setNoData(): void {
    if (this.noData) {
      this.preNoColor = this.colorString;
      this.colorString = this.noDataStr;
      this.colorData = Nodule.convertStringToHSLAObject("hsla(0,100%,100%,0)");
      this.showColorInputs = false;
    } else {
      this.colorString = this.preNoColor;
      this.colorData = Nodule.convertStringToHSLAObject(this.colorString);
    }
    // If this color selector is on the label panel, then all changes are directed at the label(s).
  }
}
</script>

<style lang="scss" scoped>
@import "@/scss/variables.scss";

.select-an-object-text {
  color: rgb(255, 82, 82);
}
</style>