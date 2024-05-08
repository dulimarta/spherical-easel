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

type ObjectStyle = { [_: string]: StylePropertyValue };

function isPropEqual(
  a: StylePropertyValue | undefined,
  b: StylePropertyValue | undefined
): boolean {
  if (typeof a !== typeof b) return false;
  if (typeof a === "undefined") return true;
  if (typeof a === "boolean") return a === b;
  if (typeof a === "number" && typeof b === "number")
    return Math.abs(a - b) < 1e-5;
  if (typeof b === "string") return a === b;
  console.debug(`isProp does not yet handle`, typeof a);
  return false;
}

function checkInsertOrDelete(
  prev: string[],
  curr: string[]
): [Set<string>, Set<string>] {
  const added = new Set<string>();
  const removed = new Set<string>();
  prev.sort((a, b) => a.localeCompare(b));
  curr.sort((a, b) => a.localeCompare(b));
  let p = 0,
    c = 0;
  while (p < prev.length && c < curr.length) {
    if (prev[p] == curr[c]) {
      p++;
      c++;
    } else if (curr[c] < prev[p]) {
      added.add(curr[c]);
      c++;
    } else {
      removed.add(prev[p]);
      p++;
    }
  }
  while (p < prev.length) {
    removed.add(prev[p]);
    p++;
  }
  while (c < curr.length) {
    added.add(curr[c]);
    c++;
  }
  return [added, removed];
}

export const useStylingStore = defineStore("style", () => {
  const seStore = useSEStore();
  const { selectedSENodules } = storeToRefs(seStore);
  const selectedPlottables: Ref<Map<string, Nodule>> = ref(new Map());
  const selectedLabels: Ref<Map<string, Label>> = ref(new Map());
  const selectionCounter = ref(0);

  // When multiple objects are selected, their style properties
  // may conflict with each other. Keep them in a set
  const conflictingProperties: Ref<Set<string>> = ref(new Set());
  // To detect conflict, we use the following map to record the current
  // value of each style property
  const stylePropertyMap: Map<string, StylePropertyValue> = new Map();

  // The user is required to opt in to override conflicting properties
  const forceAgreement = ref(false);

  const styleOptions = ref<ObjectStyle>({});


  // After style editing is done, we should restore label visibility
  // to their original state before editing
  const labelsVisibilityState: Ref<Map<string, boolean>> = ref(new Map());

  watch(
    // This watcher run when the user changes the object selection
    () => selectedSENodules.value,
    selectionArr => {

      // First check for any objects which were deselected
      // by comparing the selectedLabels against the current selection
      // a label recorded in selectedLabels but no longer exists
      // in the current selection array must have been removed
      Array.from(selectedLabels.value.keys()).forEach(s => {
        const pos = selectionArr.findIndex((n => n.name === s))
        if (pos < 0) {
          // object was deselected, restore its visibility
          // and remove it from the selected set
          const label = selectedLabels.value.get(s)!
          const prevVisibility = labelsVisibilityState.value.get(s)
          label.showing = prevVisibility!
          // label.updateDisplay()
          selectedLabels.value.delete(s)
          selectionCounter.value--
        }
      })

      // Among the selected object, check if we have new selection
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
          if (!selectedLabels.value.has(n.name)) {
            selectedLabels.value.set(n.name, itsLabel.ref);
            selectionCounter.value++;
            labelsVisibilityState.value.set(n.name, itsLabel.ref.showing);
          }
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
      let updatedOptions: ObjectStyle = {};
      let propChanged = false;
      stylePropertyMap.forEach((val, key) => {
        const newValue = newOptions[key];
        const oldValue = stylePropertyMap.get(key);
        if (!isPropEqual(oldValue, newValue)) {
          console.debug(
            `Property ${key} changes from ${oldValue} to ${newValue}`
          );
          updatedOptions[key] = newValue;
          propChanged = true;
        }
      });
      if (propChanged) {
        selectedLabels.value.forEach(label => {
          label.updateStyle(StyleEditPanels.Label, updatedOptions);
        });
      }
    },
    {
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

  function hasDisagreement(prop: string) {
    return conflictingProperties.value.has(prop) && !forceAgreement.value;
  }
  return {
    toggleLabelsShowing,
    selectionCounter,
    selectedLabels,
    styleOptions,
    conflictingProperties,
    forceAgreement,
    hasDisagreement
    // allLabelsShowing, selectionCount,styleOptions: activeStyleOptions
  };
});
