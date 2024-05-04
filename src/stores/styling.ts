import { defineStore, storeToRefs } from "pinia";
import { useSEStore } from "./se";
import { computed, ref, watch, Ref } from "vue";
import { Labelable } from "@/types";
import { StyleOptions } from "@/types/Styles";

export const useStylingStore = defineStore("style", () => {
  const seStore = useSEStore();
  const { selectedSENodules } = storeToRefs(seStore);

  // const allLabelsShowing = ref(false);
  // watch(
  //   () => selectedSENodules.value,
  //   arr => {
  //     console.debug("Selection changes", arr.length);
  //     allLabelsShowing.value = arr
  //       .filter(n => n.isLabelable)
  //       .every(n => (n as unknown as Labelable).label!.showing);
  //   },
  //   { deep: true }
  // );

  function toggleLabelsShowing() {
    selectedSENodules.value.forEach((n) => {
      if (n.isLabelable()) {
        (n as unknown as Labelable).label!.showing = true
      }
    })
  }

  return {
    toggleLabelsShowing
    // allLabelsShowing, selectionCount,styleOptions: activeStyleOptions
  };
});
