<template>
  <div>
    <div>
      <span class="text-subtitle-2"
        :style="{'color' : conflict?'red':''}">{{ $t(titleKey)+" " }}</span>
      <v-icon :color="conflict !== 'red' ? internalColor.hexa : `#ffffff`"
        small>mdi-checkbox-blank</v-icon>
      <span v-if="numSelected > 1"
        class="text-subtitle-2"
        style="color:red">{{" "+ $t("style.labelStyleOptionsMultiple") }}</span>
    </div>

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
                  hide-details
                  x-small
                  dense
                  @click="changeEvent"></v-checkbox>
              </span>
            </template>
            {{isOnLabelPanel? $t('style.noFillLabelTip'): $t('style.noFillTip')}}
          </v-tooltip>
        </v-col>
        <v-spacer />
        <v-col cols="auto"
          class="ma-0 pl-0 pr-0 pt-2 pb-2">
          <HintButton type="colorInput"
            @click="toggleColorInputs"
            :disabled="noData"
            i18n-label="style.showColorInputs"
            i18n-tooltip="style.showColorInputsToolTip">
          </HintButton>
        </v-col>

      </v-row>
    </v-container>
    <!-- The color picker -->
    <div @click="changeEvent">
      <v-color-picker :disabled="noData"
        hide-sliders
        hide-canvas
        show-swatches
        :hide-inputs="!showColorInputs"
        :swatches-max-height="100"
        :swatches="colorSwatches"
        v-model="internalColor"
        mode="hsla"
        id="colorPicker">
      </v-color-picker>
    </div>
  </div>
</template>



<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, PropSync, Watch } from "vue-property-decorator";
import SETTINGS from "@/global-settings";
// import Nodule from "@/plottables/Nodule";
import { hslaColorType } from "@/types";
import HintButton from "@/components/HintButton.vue";
import OverlayWithFixButton from "@/components/OverlayWithFixButton.vue";
import i18n from "../i18n";

const NO_HSLA_DATA = "hsla(0, 0%,0%,0)";
@Component({ components: { HintButton, OverlayWithFixButton } })
export default class SimpleColorSelector extends Vue {
  @Prop() readonly titleKey!: string;
  @Prop() conflict!: boolean;
  // external representation: hsla in CSS
  @PropSync("data") hslaColor!: string;
  @Prop({ required: true }) readonly styleName!: string;
  @Prop() readonly numSelected!: number;

  // Internal representation is an object with multiple color representations
  internalColor: any = {};
  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

  private noData = false; // no data means noFill or noStroke
  private preNoColor: string = NO_HSLA_DATA;

  private isOnLabelPanel = false;

  // private boxSampleColor: string = "";

  // For TwoJS
  // private colorString: string | undefined = "hsla(0, 0%,0%,0)";
  private showColorInputs = false;

  private colorSwatches = SETTINGS.style.swatches;
  private noDataStr = "";
  private noDataUILabel = i18n.t("style.noFill");

  changeEvent(): void {
    // console.log("emit!");
    this.$emit("resetColor");
  }
  // Vue component life cycle hook
  mounted(): void {
    // console.log("mounting!", this.hslaColor);
    if (this.hslaColor !== undefined && this.hslaColor !== null) {
      this.calculateInternalColorFrom(this.hslaColor);
      // set the noData flag
      if (
        this.internalColor.hsla.h === 0 &&
        this.internalColor.hsla.s === 0 &&
        this.internalColor.hsla.l === 0 &&
        this.internalColor.hsla.a === 0
      ) {
        this.noData = true;
      }
    }
    // this.boxSampleColor = this.internalColor.hexa;
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

    var re2 = /label/gi;
    this.isOnLabelPanel = this.titleKey.search(re2) !== -1;
    //this.noDataUILabel = `No ${inTitleCase}`;
    // console.log("style name", this.styleName);
    // console.log("noStrData", this.noDataStr);
  }

  beforeUpdate(): void {
    // console.log("before update Simple color selector");
    const col = this.internalColor.hsla;
    //   // console.debug("Color changed to", col);
    const hue = col.h.toFixed(0);
    const sat = (col.s * 100).toFixed(0) + "%";
    const lum = (col.l * 100).toFixed(0) + "%";
    const alpha = col.a.toFixed(3);
    this.hslaColor = `hsla(${hue},${sat},${lum},${alpha})`;
  }

  toggleColorInputs(): void {
    // if (!this.noData) {
    this.showColorInputs = !this.showColorInputs;
    // } else {
    //   this.showColorInputs = false;
    // }
  }

  convertColorToRGBAString(colorObject: hslaColorType): string {
    // THANK YOU INTERNET!
    const hue = colorObject.h;
    const sat = colorObject.s * 100;
    const lum = colorObject.l;
    const a = (sat * Math.min(lum, 1 - lum)) / 100;
    const f = (n: number): string => {
      const k = (n + hue / 30) % 12;
      const color = lum - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, "00");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  @Watch("hslaColor")
  calculateInternalColorFrom(hslaString: string): void {
    // console.debug("HSLA string changed", hslaString);
    const parts = hslaString
      .trim()
      .replace(/hsla *\(/, "")
      .replace(")", "")
      .split(",");
    this.internalColor.hsla = {
      h: Number(parts[0]),
      s: Number(parts[1].replace("%", "")) / 100,
      l: Number(parts[2].replace("%", "")) / 100,
      a: Number(parts[3])
    };

    if (this.noData) {
      this.internalColor.hexa = this.convertColorToRGBAString({
        h: 0,
        s: 1,
        l: 1,
        a: 0
      });
    } else {
      this.internalColor.hexa = this.convertColorToRGBAString(
        this.internalColor.hsla
      );
    }
  }

  @Watch("noData")
  setNoData(): void {
    // console.debug(
    //   "Saved HSLA",
    //   this.preNoColor,
    //   "current HSLA",
    //   this.hslaColor
    // );
    if (this.noData) {
      if (
        this.internalColor.hsla.h !== 0 ||
        this.internalColor.hsla.s !== 0 ||
        this.internalColor.hsla.l !== 0 ||
        this.internalColor.hsla.a !== 0
      ) {
        this.preNoColor = this.hslaColor;
      }
      //this.preNoColor = this.hslaColor;
      this.hslaColor = NO_HSLA_DATA;
      this.showColorInputs = false;
      this.colorSwatches = SETTINGS.style.greyedOutSwatches;
    } else {
      this.hslaColor = this.preNoColor;
      this.colorSwatches = SETTINGS.style.swatches;
      // this.showColorInputs = true;
      //   // this.colorData = Nodule.convertStringToHSLAObject(this.colorString);
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