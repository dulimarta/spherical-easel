<template>
  <span class="text-subtitle-2 red--text">This panel is incomplete</span>
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

@Component({ components: { FadeInCard } })
export default class AdvancedStyle extends Vue {
  // readonly UIModule = getModule(UI, this.$store);

  @State
  readonly selections!: SENodule[];

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
      this.hasStyles(Styles.strokeColor) ||
      this.hasStyles(Styles.fillColorWhite) ||
      this.hasStyles(Styles.fillColorGray)
    );
  }

  get hasStrokeWidth(): boolean {
    return this.hasStyles(Styles.strokeWidthPercent);
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
  }
}
</script>
