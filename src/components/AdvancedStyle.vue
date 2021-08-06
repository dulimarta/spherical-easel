<template>
  <span class="text-subtitle-2 red--text">This panel is incomplete</span>
</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Watch } from "vue-property-decorator";
import { SENodule } from "../models/SENodule";
import FadeInCard from "@/components/FadeInCard.vue";
import { AppState } from "@/types";
import { namespace } from "vuex-class";
const SE = namespace("se");
@Component({ components: { FadeInCard } })
export default class AdvancedStyle extends Vue {
  @SE.State((s: AppState) => s.selectedSENodules)
  readonly selectedSENodules!: SENodule[];

  commonStyleProperties: string[] = [];

  constructor() {
    super();
    // this.commonProperties = new Set();
  }

  hasStyles(prop: RegExp): boolean {
    return this.commonStyleProperties.some((x: string) => x.match(prop));
  }

  get hasColor(): boolean {
    return this.hasStyles(/Color/);
  }

  get hasStrokeWidth(): boolean {
    return this.hasStyles(/strokeWidthPercent/);
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
