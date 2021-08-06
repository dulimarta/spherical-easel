<template>
  <div>
    <div>
      <span class="text-subtitle-2">{{ $t(titleKey)+" " }}</span>
      <v-icon :color="internalColor.hexa"
        small>mdi-checkbox-blank</v-icon>
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
    <!-- The color picker -->
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
  // external representation: hsla in CSS
  @PropSync("data") hslaColor!: string;
  @Prop({ required: true }) readonly styleName!: string;

  // Internal representation is an object with multiple color representations
  internalColor: any = {};
  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

  private noData = false; // no data means noFill or noStroke
  private preNoColor: string = NO_HSLA_DATA;

  // For TwoJS
  // private colorString: string | undefined = "hsla(0, 0%,0%,0)";
  private showColorInputs = false;

  private colorSwatches = SETTINGS.style.swatches;
  private noDataStr = "";
  private noDataUILabel = i18n.t("style.noFill");

  // Vue component life cycle hook
  mounted(): void {
    if (this.hslaColor) {
      const parts = this.hslaColor
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
    }
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

  beforeUpdate(): void {
    const col = this.internalColor.hsla;
    //   // console.debug("Color changed to", col);
    const hue = col.h.toFixed(0);
    const sat = (col.s * 100).toFixed(0) + "%";
    const lum = (col.l * 100).toFixed(0) + "%";
    const alpha = col.a.toFixed(3);
    this.hslaColor = `hsla(${hue},${sat},${lum},${alpha})`;
  }

  toggleColorInputs(): void {
    if (!this.noData) {
      this.showColorInputs = !this.showColorInputs;
    } else {
      this.showColorInputs = false;
    }
  }

  @Watch("noData")
  setNoData(): void {
    if (this.noData) {
      this.preNoColor = this.hslaColor;
      this.hslaColor = NO_HSLA_DATA;
      this.showColorInputs = false;
    } else {
      this.hslaColor = this.preNoColor;
      this.showColorInputs = true;
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