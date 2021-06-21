<template>
  <span class="text-subtitle-2 red--text">This panel is incomplete</span>
</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Watch } from "vue-property-decorator";
import { SENodule } from "../models/SENodule";
import { Styles } from "../types/Styles";
import FadeInCard from "@/components/FadeInCard.vue";
import { AppState } from "@/types";
import { namespace } from "vuex-class";
const SE = namespace("se");
@Component({ components: { FadeInCard } })
export default class AdvancedStyle extends Vue {
  @SE.State((s: AppState) => s.selectedSENodules)
  readonly selectedSENodules!: SENodule[];

  commonStyleProperties: number[] = [];

  constructor() {
    super();
    // this.commonProperties = new Set();
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
      this.hasStyles(Styles.strokeColor) || this.hasStyles(Styles.fillColor)
    );
  }

  get hasStrokeWidth(): boolean {
    return this.hasStyles(Styles.strokeWidthPercent);
  }

  @Watch("selectedSENodules")
  onSelectionChanged(newSelection: SENodule[]): void {
    // newSelection.forEach(s => {
    // console.debug("Set ", s.customStyles());
    // })
    this.commonStyleProperties.splice(0);
    if (newSelection.length === 0) {
      // console.debug("No Common props: ");
      return;
    }
  }
}
</script>
