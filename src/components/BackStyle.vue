<template>
  <div>
    <span v-show="commonStyleProperties.length === 0" class="text-body-2">
      Please select object(s) to style
    </span>

    <fade-in-card :showWhen="hasDash">
      <span>Dash Pattern ({{ dashLength }}/{{ gapLength }})</span>
      <v-slider min="5" max="15" v-model.number="dashLength"
        persistent-hint hint="Dash length" @change="onDashPatternChanged">
      </v-slider>
      <v-slider min="5" max="15" v-model.number="gapLength" persistent-hint
        hint="Gap length" @change="onDashPatternChanged"></v-slider>
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

  private dashLength = 3;
  private gapLength = 2;
  commonStyleProperties: number[] = [];

  // private commonProperties: Set<Styles>;

  constructor() {
    super();
    // this.commonProperties = new Set();
  }

  onDashPatternChanged(): void {
    this.$store.commit("changeDashPattern", [this.dashLength, this.gapLength]);
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

  get hasDash(): boolean {
    return this.hasStyles(Styles.dashPattern);
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
  }
}
</script>
