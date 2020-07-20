<template>
  <div>
    <span v-show="commonStyleProperties.length === 0" class="text-body-2">
      Please select object(s) to style
    </span>
    <fade-in-card :showWhen="hasColor">
      <span class="text-subtitle-2">Color</span>
      <v-color-picker
        hide-inputs
        v-model="selectedColor"
        @update:color="onColorChanged"
      ></v-color-picker>
      <span>Apply to:</span>
      <div>
        <v-checkbox
          v-model="colorApplyTo"
          dense
          v-for="(z, pos) in colorKeys"
          :key="pos"
          :label="z.label"
          :value="z.value"
        ></v-checkbox>
      </div>
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

  readonly minStrokeWidth: number = SETTINGS.line.drawn.strokeWidth.min;
  readonly maxStrokeWidth: number = SETTINGS.line.drawn.strokeWidth.max;

  // TODO: handlle background as well
  private strokeWidth: number = SETTINGS.line.drawn.strokeWidth.front;
  private selectedColor: string = SETTINGS.line.drawn.strokeColor.front;
  private colorApplyTo: string[] = [];
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
  onColorChanged(): void {
    this.$store.commit("changeColor", {
      color: this.selectedColor,
      props: this.colorApplyTo.map(
        (s: string) => s.replace(/ /g, "") // Remove all blanks
      )
    });
  }

  hasStyles(s: Styles): boolean {
    const sNum = Number(s);
    return (
      this.commonStyleProperties.length > 0 &&
      this.commonStyleProperties.findIndex(x => x === sNum) >= 0
    );
  }

  get hasColor(): boolean {
    return (
      this.hasStyles(Styles.strokeColor) ||
      this.hasStyles(Styles.fillColorWhite) ||
      this.hasStyles(Styles.fillColorGray)
    );
  }

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

  get hasStrokeWidth(): boolean {
    return this.hasStyles(Styles.strokeWidth);
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
    for (let k = this.colorApplyTo.length - 1; k >= 0; k--) {
      const idx = this.commonStyleProperties.findIndex(
        s => keys[s] === this.colorApplyTo[k]
      );
      if (idx < 0) {
        this.colorApplyTo.splice(k, 1);
      }
    }
    // const propNames = this.commonStyleProperties.map(n => keys[n]).join(", ");
    // console.debug("Common props: ", propNames);
  }
}
</script>
