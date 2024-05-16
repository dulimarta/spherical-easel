import { defineStore, storeToRefs } from "pinia";
import { useSEStore } from "./se";
import { computed, ref, watch, Ref } from "vue";
import {
  StyleEditPanels,
  StyleOptions,
  StylePropertyValue
} from "@/types/Styles";
import Nodule from "@/plottables/Nodule";
import Label from "@/plottables/Label";

// type ObjectStyle = { [_: string]: StylePropertyValue };

function isArrayEqual(a: Array<any>, b: Array<any>) {
  if (a.length !== b.length) return false
  for (let k = 0; k < a.length; k++) {
    if (a[k] !== b[k]) return false
  }
  return true
}
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
  if (Array.isArray(a) && Array.isArray(b)) {
    return isArrayEqual(a,b)
  }
  console.debug(`isProp does not yet handle`, typeof a);
  return false;
}

// function checkInsertOrDelete(
//   prev: string[],
//   curr: string[]
// ): [Set<string>, Set<string>] {
//   const added = new Set<string>();
//   const removed = new Set<string>();
//   prev.sort((a, b) => a.localeCompare(b));
//   curr.sort((a, b) => a.localeCompare(b));
//   let p = 0,
//     c = 0;
//   while (p < prev.length && c < curr.length) {
//     if (prev[p] == curr[c]) {
//       p++;
//       c++;
//     } else if (curr[c] < prev[p]) {
//       added.add(curr[c]);
//       c++;
//     } else {
//       removed.add(prev[p]);
//       p++;
//     }
//   }
//   while (p < prev.length) {
//     removed.add(prev[p]);
//     p++;
//   }
//   while (c < curr.length) {
//     added.add(curr[c]);
//     c++;
//   }
//   return [added, removed];
// }

export const useStylingStore = defineStore("style", () => {
  const seStore = useSEStore();
  const { selectedSENodules } = storeToRefs(seStore);
  const selectedPlottables: Ref<Map<string, Nodule>> = ref(new Map());
  const selectedLabels: Ref<Map<string, Label>> = ref(new Map());

  // When multiple objects are selected, their style properties
  // may conflict with each other. Keep them in a set
  const conflictingProperties: Ref<Set<string>> = ref(new Set());
  // To detect conflict, we use the following map to record the current
  // value of each style property
  const stylePropertyMap: Map<string, StylePropertyValue> = new Map();

  // The user is required to opt in to override conflicting properties
  const forceAgreement = ref(false);

  const styleOptions = ref<StyleOptions>({});
  // const plottableStyleOptions = ref<ObjectStyle>({})

  // After style editing is done, we should restore label visibility
  // to their original state before editing
  const labelShowingState: Map<string, boolean> = new Map();
  const plottableShowingState: Map<string, boolean> = new Map();

  watch(
    // This watcher run when the user changes the object selection
    () => selectedSENodules.value,
    selectionArr => {
      // First check for any objects which were deselected
      // by comparing the selectedLabels/plottables map against the current
      // selection. An object recorded in the map but no longer exists
      // in the current selection array must have been deselected
      Array.from(selectedLabels.value.keys()).forEach(labelName => {
        const pos = selectionArr.findIndex(n => n.name === labelName);
        const label = selectedLabels.value.get(labelName);
        if (pos < 0 && label) {
          // object was deselected, restore its visibility
          // and remove it from the selected set
          const prevVisibility = labelShowingState.get(labelName);
          label.showing = prevVisibility!;
          // label.updateDisplay()
          selectedLabels.value.delete(labelName);
        }
      });

      Array.from(selectedPlottables.value.keys()).forEach(plotName => {
        const pos = selectionArr.findIndex(n => n.name === plotName);
        const plot = selectedPlottables.value.get(plotName);
        if (pos < 0 && plot) {
          const prevVisibility = plottableShowingState.get(plotName);
          plot.showing = prevVisibility!;
          selectedPlottables.value.delete(plotName);
        }
      });

      // Among the selected object, check if we have new selection
      selectionArr.forEach(n => {
        const itsPlot = n.ref;
        if (itsPlot && !(n instanceof Label)) {
          // console.debug(`${n.name} plottable`, itsPlot)
          selectedPlottables.value.set(n.name, itsPlot);
          plottableShowingState.set(n.name, itsPlot.showing);
        }
        const itsLabel = n.getLabel();
        if (itsLabel) {
          // console.debug(`${n.name} label`, itsLabel.ref)
          if (!selectedLabels.value.has(n.name)) {
            selectedLabels.value.set(n.name, itsLabel.ref);
            labelShowingState.set(n.name, itsLabel.ref.showing);
          }
        }
      });

      // Check for possible conflict among label properties
      conflictingProperties.value.clear();
      styleOptions.value = {};
      // plottableStyleOptions.value = {}
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
              (styleOptions.value as any)[p] = thisPropValue;
            } else if (!isPropEqual(recordedPropValue, thisPropValue)) {
              conflictingProperties.value.add(p);
            }
          });
      });

      selectedPlottables.value.forEach(plot => {
        const props = plot.currentStyleState(StyleEditPanels.Front);
        Object.getOwnPropertyNames(props).forEach(prop => {
          const recordedPropValue = stylePropertyMap.get(prop);
          const thisPropValue = (props as any)[prop];
          if (typeof recordedPropValue === "undefined") {
            stylePropertyMap.set(prop, thisPropValue);
            (styleOptions.value as any)[prop] = thisPropValue;
          } else if (!isPropEqual(recordedPropValue, thisPropValue)) {
            conflictingProperties.value.add(prop);
          }
        });
      });
      console.debug("Compiled props", stylePropertyMap);
    },
    { deep: true }
  );

  watch(
    () => styleOptions.value,
    (opt: StyleOptions) => {
      const newOptions: StyleOptions = { ...opt };
      let updatedOptions: StyleOptions = {};
      let propChanged = false;
      stylePropertyMap.forEach((val, key) => {
        const newValue = (newOptions as any)[key];
        const oldValue = stylePropertyMap.get(key);
        if (!isPropEqual(oldValue, newValue)) {
          // console.debug(
          //   `Property ${key} changes from ${oldValue} to ${newValue}`
          // );
          (updatedOptions as any)[key] = newValue;
          stylePropertyMap.set(key, newValue)
          propChanged = true;
        }
      });
      if (propChanged) {
        selectedLabels.value.forEach(label => {
          label.updateStyle(StyleEditPanels.Label, updatedOptions);
        });
        selectedPlottables.value.forEach(plot => {
          plot.updateStyle(StyleEditPanels.Front, updatedOptions);
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
  function hasStyle(prop: string | RegExp): boolean {
    if (typeof prop === "string") {
      return Array.from(stylePropertyMap.keys()).some(x => {
        // console.debug(`Has style ${prop} <=> ${x}?`);
        return x === prop;
      });
    } else return Array.from(stylePropertyMap.keys()).some(x => x.match(prop))
  }

  return {
    toggleLabelsShowing,
    selectedLabels,
    selectedPlottables,
    styleOptions,
    conflictingProperties,
    forceAgreement,
    hasDisagreement,
    hasStyle
    // allLabelsShowing,styleOptions: activeStyleOptions
  };
});
