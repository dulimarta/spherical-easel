<template>
  <span class="text-subtitle-2 red--text">This panel is incomplete</span>
</template>
<script lang="ts">
import Vue from "vue";
import { SENodule } from "@/models-spherical/SENodule";
import { mapState } from "pinia";
import { useSEStore } from "@/stores/se";
import { useStylingStore } from "@/stores/styling";
const styleStore = useStylingStore();
const { hasStyle } = styleStore;
export default class AdvancedStyle extends Vue {
  // You are not allow to style labels directly so remove them from the selection and warn the user
  // readonly selectedSENodules!: SENodule[];

  commonStyleProperties: string[] = [];

  constructor() {
    super();
    // this.commonProperties = new Set();
  }

  // hasStyles(prop: RegExp): boolean {
  //   return this.commonStyleProperties.some((x: string) => x.match(prop));
  // }

  get hasColor(): boolean {
    return hasStyle(/Color/);
  }

  get hasStrokeWidth(): boolean {
    return hasStyle(/strokeWidthPercent/);
  }

  // @Watch("selectedSENodules")
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
