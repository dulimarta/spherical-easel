<template>
  <div>
    <span
      v-show="commonStyleProperties.length === 0"
      class="text-body-2"
    >Please select object(s) to style</span>
    <fade-in-card :showWhen="hasStrokeColor">
      <span class="text-subtitle-2">Stroke Color</span>
      <v-color-picker v-model="strokeColor" @update:color="onLineColorChanged"></v-color-picker>
    </fade-in-card>
    <fade-in-card :showWhen="hasStrokeWidth">
      <span>Stroke Width</span>
      <v-slider
        v-model.number="strokeWidth"
        :min="minStrokeWidth"
        @change="onLineWidthChanged"
        :max="maxStrokeWidth"
        type="range"
      ></v-slider>
    </fade-in-card>
    <fade-in-card :showWhen="hasFillColor">
      <span class="text-subtitle-2">Fill Color</span>
      <v-color-picker v-modeel="fillColor" @update:color="onFillColorChanged"></v-color-picker>
    </fade-in-card>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Watch } from "vue-property-decorator";
import { SENodule } from "../models/SENodule";
import { State } from "vuex-class";
import { Styles } from "../types/Styles";
import SETTINGS from "@/global-settings";
import FadeInCard from "@/components/FadeInCard.vue";
// import { getModule } from "vuex-module-decorators";
// import UI from "@/store/ui-styles";

const values = Object.entries(Styles).filter(e => {
  const [_, b] = e;
  return typeof b === "number";
});

const keys = values.map(e => {
  const [a, _] = e;
  return a;
});

@Component({ components: { FadeInCard } })
export default class FrontStyle extends Vue {
  // readonly UIModule = getModule(UI, this.$store);

  @State
  readonly selections!: SENodule[];

  readonly minStrokeWidth = SETTINGS.line.drawn.strokeWidth.min;
  readonly maxStrokeWidth = SETTINGS.line.drawn.strokeWidth.max;

  // TODO: handlle background as well
  private strokeWidth = SETTINGS.line.drawn.strokeWidth.front;
  private strokeColor = SETTINGS.line.drawn.strokeColor.front;
  private fillColor = SETTINGS.circle.drawn.fillColor.front;
  commonStyleProperties: number[] = [];

  // private commonProperties: Set<Styles>;

  constructor() {
    super();
    // this.commonProperties = new Set();
  }

  onLineWidthChanged(): void {
    this.$store.commit("changeStrokeWidth", this.strokeWidth);
    // this.UIModule.changeStrokeColor("red");
  }
  onLineColorChanged(): void {
    this.$store.commit("changeStrokeColor", this.strokeColor);
  }

  onFillColorChanged(): void {
    this.$store.commit("changeFillColor", this.fillColor);
  }
  hasStyles(s: Styles): boolean {
    const sNum = Number(s);
    return (
      this.commonStyleProperties.length > 0 &&
      this.commonStyleProperties.findIndex(x => x === sNum) >= 0
    );
  }

  get hasStrokeColor(): boolean {
    return this.hasStyles(Styles.StrokeColor);
  }

  get hasStrokeWidth(): boolean {
    return this.hasStyles(Styles.StrokeWidth);
  }

  get hasFillColor(): boolean {
    return (
      this.hasStyles(Styles.FillWhiteTint) ||
      this.hasStyles(Styles.FillGrayTint)
    );
  }
  @Watch("selections", { deep: true })
  onSelectionChanged(newSelection: SENodule[]): void {
    // newSelection.forEach(s => {
    // console.debug("Set ", s.customStyles());
    // })
    this.commonStyleProperties.splice(0);
    if (newSelection.length === 0) {
      // console.debug("No Common props: ");
      return;
    }
    for (let k = 0; k < values.length; k++) {
      if (newSelection.every(s => s.customStyles().has(k)))
        this.commonStyleProperties.push(k);
    }
    const propNames = this.commonStyleProperties.map(n => keys[n]).join(", ");
    // console.debug("Common props: ", propNames);
  }
}
</script>
