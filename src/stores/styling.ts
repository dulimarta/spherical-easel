import { defineStore, storeToRefs } from "pinia";
import { useSEStore } from "./se";
import { computed, ref, watch, Ref } from "vue";
import { Labelable } from "@/types";
import {
  StyleEditPanels,
  StyleOptions,
  StylePropertyValue
} from "@/types/Styles";
import Nodule from "@/plottables/Nodule";
import Label from "@/plottables/Label";

type ObjectStyle = { [_: string]: StylePropertyValue }

function isPropEqual(
  a: StylePropertyValue | undefined,
  b: StylePropertyValue | undefined
): boolean {
  if (typeof a !== typeof b) return false;
  if (typeof a === "undefined") return true;
  if (typeof a === 'boolean') return a === b;
  if (typeof a === "number" && typeof b === "number")
    return Math.abs(a - b) < 1e-5;
  if (typeof b === "string") return a === b;
  console.debug(`isProp does not yet handle`, typeof a)
  return false;
}
export const useStylingStore = defineStore("style", () => {
  const seStore = useSEStore();
  const { selectedSENodules } = storeToRefs(seStore);
  const selectedPlottables: Ref<Map<string, Nodule>> = ref(new Map());
  const selectedLabels: Ref<Map<string, Label>> = ref(new Map());
  const conflictingProperties: Ref<Set<string>> = ref(new Set());
  const selectionCounter = ref(0);
  const styleOptions = ref<ObjectStyle>({});
  const stylePropertyMap: Map<string, StylePropertyValue> = new Map();

  watch(
    // This watcher run when the user changes the object selection
    () => selectedSENodules.value,
    selectionArr => {
      selectionCounter.value = 0;
      selectedLabels.value.clear();
      selectedPlottables.value.clear();
      selectionArr.forEach(n => {
        const itsPlot = n.ref;
        if (itsPlot && !(n instanceof Label)) {
          // console.debug(`${n.name} plottable`, itsPlot)
          selectedPlottables.value.set(n.name, itsPlot);
          selectionCounter.value++;
        }
        const itsLabel = n.getLabel();
        if (itsLabel) {
          // console.debug(`${n.name} label`, itsLabel.ref)
          selectedLabels.value.set(n.name, itsLabel.ref);
          selectionCounter.value++;
        }
      });

      // Check for possible conflict among label properties
      conflictingProperties.value.clear();
      styleOptions.value = {};
      stylePropertyMap.clear();
      selectedLabels.value.forEach(x => {
        const props = x.currentStyleState(StyleEditPanels.Label);
        Object.getOwnPropertyNames(props)
          .filter((p: string) => {
            // remove property names which may have been inserted by Vue/browser
            // console.debug("Label property", p);
            return !p.startsWith("__");
          })
          .forEach(p => {
            const recordedPropValue = stylePropertyMap.get(p);
            const thisPropValue = (props as any)[p];
            if (typeof recordedPropValue === "undefined") {
              stylePropertyMap.set(p, thisPropValue);
              styleOptions.value[p] = thisPropValue;
            } else if (!isPropEqual(recordedPropValue, thisPropValue)) {
              conflictingProperties.value.add(p);
            }
          });
      });
    },
    { deep: true }
  );

  watch(
    () => styleOptions.value,
    (opt: StyleOptions) => {
      const newOptions: ObjectStyle = { ...opt };
      let updatedOptions: ObjectStyle = {}
      let propChanged = false;
      stylePropertyMap.forEach((val, key) => {
        const newValue = newOptions[key];
        const oldValue = stylePropertyMap.get(key);
        if (!isPropEqual(oldValue, newValue)) {
          console.debug(
            `Property ${key} changes from ${oldValue} to ${newValue}`
          );
          updatedOptions[key] = newValue
          propChanged = true
        }
      });
      if (propChanged) {
        selectedLabels.value.forEach((label) => {
          label.updateStyle(StyleEditPanels.Label, updatedOptions)
        })
      }
    }, {
      deep: true,
      immediate: true
    }
  );
  function toggleLabelsShowing() {
    selectedSENodules.value.forEach(n => {
      const label = n.getLabel();
      if (label) {
        label.showing = true;
      }
    });
  }

  return {
    toggleLabelsShowing,
    selectionCounter,
    selectedLabels,
    styleOptions
    // allLabelsShowing, selectionCount,styleOptions: activeStyleOptions
  };
});
