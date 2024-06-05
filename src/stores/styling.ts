import { defineStore, storeToRefs } from "pinia";
import { useSEStore } from "./se";
import { ref, watch, Ref } from "vue";
import {
  StyleCategory,
  StyleOptions,
  StylePropertyValue
} from "@/types/Styles";
import Nodule, { DisplayStyle } from "@/plottables/Nodule";
import Label from "@/plottables/Label";
import { CommandGroup } from "@/commands/CommandGroup";
import { ChangeBackStyleContrastCommand } from "@/commands/ChangeBackstyleContrastCommand";
import { StyleNoduleCommand } from "@/commands/StyleNoduleCommand";
import { Command } from "@/commands/Command";
import { SENodule } from "@/models/SENodule";

// type ObjectStyle = { [_: string]: StylePropertyValue };

function isArrayEqual(a: Array<any>, b: Array<any>) {
  if (a.length !== b.length) return false;
  for (let k = 0; k < a.length; k++) {
    if (a[k] !== b[k]) return false;
  }
  return true;
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
    return isArrayEqual(a, b);
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
  const { selectedSENodules, seNodules } = storeToRefs(seStore);
  const selectedPlottables: Ref<Map<string, Nodule>> = ref(new Map());
  const selectedLabels: Ref<Map<string, Label>> = ref(new Map());

  // When multiple objects are selected, their style properties
  // may conflict with each other. Keep them in a set
  const conflictingProperties: Ref<Set<string>> = ref(new Set());
  // To detect conflict, we use the following map to record the current
  // value of each style property
  const stylePropertyMap: Map<string, StylePropertyValue> = new Map();

  // Maps for recording the styles at the beginning of object selection
  const initialStyleMap: Map<string, StyleOptions> = new Map();
  const defaultStyleMap: Map<string, StyleOptions> = new Map();

  // The user is required to opt in to override conflicting properties
  const forceAgreement = ref(false);

  /** styleOptions is a copy visible to Vue components */
  const styleOptions = ref<StyleOptions>({});
  // The following two vars keep track of before and after style updates
  let preUpdateStyleOptions: StyleOptions = {}; //
  let postUpdateStyleOptions: StyleOptions = {};
  let backStyleContrastCopy: number = NaN;
  let activeStyleGroup: StyleCategory | null = null;
  let styleIndividuallyAltered = false;

  // After style editing is done, we should restore label visibility
  // to their original state before editing
  // const labelShowingState: Map<string, boolean> = new Map();
  const editedLabels: Ref<Set<string>> = ref(new Set())

  const selectedSet: Set<string> = new Set()
  function isSameAsPreviousSet(arr: SENodule[]): boolean {
    let inserted = false

    arr.forEach(n => {
      if (!selectedSet.has(n.name)) {
        selectedSet.add(n.name)
        inserted = true
      }
    })
    const toRemove: Array<string> = []
    selectedSet.forEach(x => {
      if (arr.every(n => n.name !== x)) {
        toRemove.push(x)
      }
    })
    toRemove.forEach(x => {
      selectedSet.delete(x)
    })

    console.debug(`Inserted ${inserted}, removed ${toRemove.length}`)
    return !inserted && toRemove.length === 0
  }

  watch(
    // This watcher run when the user changes the object selection
    () => selectedSENodules.value,
    (selectionArr) => {
      // With deep watching enabled, visual blinking of the selected objects
      // by the SelectionHandler will trigger a watch update. To ignore
      // this visual changes, compare the current selection with a recorded set
      if (isSameAsPreviousSet(selectionArr as any)) return

      // First check for any objects which were deselected
      // by comparing the selectedLabels/plottables map against the current
      // selection. An object recorded in the map but no longer exists
      // in the current selection array must have been deselected
      Array.from(selectedLabels.value.keys()).forEach(labelName => {
        const pos = selectionArr.findIndex((n) => n.name === labelName);
        const label = selectedLabels.value.get(labelName);
        if (pos < 0 && label) {
          selectedLabels.value.delete(labelName);
          initialStyleMap.delete("label:" + labelName);
          defaultStyleMap.delete("label:" + labelName);
        }
      });

      Array.from(selectedPlottables.value.keys()).forEach(plotName => {
        const pos = selectionArr.findIndex(n => n.name === plotName);
        const plot = selectedPlottables.value.get(plotName);
        if (pos < 0 && plot) {
          selectedPlottables.value.delete(plotName);
          initialStyleMap.delete(StyleCategory.Front + ":" + plotName);
          initialStyleMap.delete(StyleCategory.Back + ":" + plotName);
          defaultStyleMap.delete(StyleCategory.Front + ":" + plotName);
          defaultStyleMap.delete(StyleCategory.Back + ":" + plotName);
        }
      });

      // Among the selected object, check if we have new selection
      selectionArr.forEach((n) => {
        const itsPlot = n.ref;
        if (itsPlot) {
          // console.debug(`${n.name} plottable`, itsPlot)
          if (itsPlot instanceof Nodule) {
            selectedPlottables.value.set(n.name, itsPlot);
          }

          // Remember the initial and default styles of the selected object
          // These maps are used by the  restoreTo() function below
          initialStyleMap.set(
            StyleCategory.Front + ":" + n.name,
            itsPlot.currentStyleState(StyleCategory.Front)
          );
          initialStyleMap.set(
            StyleCategory.Back + ":" + n.name,
            itsPlot.currentStyleState(StyleCategory.Back)
          );
          defaultStyleMap.set(
            StyleCategory.Front + ":" + n.name,
            itsPlot.defaultStyleState(StyleCategory.Front)
          );
          defaultStyleMap.set(
            StyleCategory.Back + ":" + n.name,
            itsPlot.defaultStyleState(StyleCategory.Back)
          );
        }
        const itsLabel = n.getLabel();
        if (itsLabel) {
          // console.debug(`${n.name} label`, itsLabel.ref)
          if (!selectedLabels.value.has(n.name)) {
            selectedLabels.value.set(n.name, itsLabel.ref);
            // Remember the initial and default styles of the selected object
            // These maps are used by the  restoreTo() function below
            initialStyleMap.set(
              "label:" + n.name,
              itsLabel.ref.currentStyleState(StyleCategory.Label)
            );
            defaultStyleMap.set(
              "label:" + n.name,
              itsLabel.ref.defaultStyleState(StyleCategory.Label)
            );
          }
        }
      });

      editedLabels.value.clear()
      console.debug("Initial style map size = ", initialStyleMap.size);
      console.debug("Default style map size = ", defaultStyleMap.size);

      backStyleContrastCopy = Nodule.getBackStyleContrast();
      console.debug("Compiled props", stylePropertyMap);
    },
    { deep: true }
  );

  watch(
    () => styleOptions.value,
    (opt: StyleOptions) => {
      const newOptions: StyleOptions = { ...opt };
      postUpdateStyleOptions = {};
      styleIndividuallyAltered = false;
      stylePropertyMap.forEach((val, key) => {
        const newValue = (newOptions as any)[key];
        const oldValue = stylePropertyMap.get(key);
        if (!isPropEqual(oldValue, newValue)) {
          // console.debug(
          //   `Property ${key} changes from ${oldValue} to ${newValue}`
          // );
          (postUpdateStyleOptions as any)[key] = newValue;
          stylePropertyMap.set(key, newValue);
          styleIndividuallyAltered = true;
        }
      });
      if (styleIndividuallyAltered) {
        selectedLabels.value.forEach(label => {
          label.updateStyle(StyleCategory.Label, postUpdateStyleOptions);
          // When a label is modified, add it to the set
          editedLabels.value.add(label.name)
        });
        selectedPlottables.value.forEach(plot => {
          plot.updateStyle(activeStyleGroup!!, postUpdateStyleOptions);
          // any property which may depends on Zoom factor, must also be updated
          // by calling adjustSize()
          plot.adjustSize();
        });
      }
    },
    {
      deep: true,
      immediate: true
    }
  );

  function selectActiveGroup(category: StyleCategory) {
    activeStyleGroup = category;
    if (category === undefined) return;
    // Check for possible conflict among label properties
    conflictingProperties.value.clear();
    styleOptions.value = {};
    // plottableStyleOptions.value = {}
    stylePropertyMap.clear();
    selectedLabels.value.forEach(x => {
      const props = x.currentStyleState(StyleCategory.Label);
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
      const props = plot.currentStyleState(category);
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
    preUpdateStyleOptions = JSON.parse(JSON.stringify(styleOptions.value));
  }
  function deselectActiveGroup() {
    persistUpdatedStyleOptions();
    activeStyleGroup = null;
  }

  function toggleLabelsShowing() {
    selectedSENodules.value.forEach((n) => {
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
    } else return Array.from(stylePropertyMap.keys()).some(x => x.match(prop));
  }

  function changeBackContrast(newContrast: number): void {
    Nodule.setBackStyleContrast(newContrast);
    // update all objects display
    seNodules.value.forEach(n => {
      n.ref?.stylize(DisplayStyle.ApplyCurrentVariables);
    });
  }

  function persistUpdatedStyleOptions() {
    const cmdGroup = new CommandGroup();
    let subCommandCount = 0;
    if (
      (activeStyleGroup === StyleCategory.Front ||
        activeStyleGroup === StyleCategory.Back) &&
      backStyleContrastCopy !== Nodule.getBackStyleContrast()
    ) {
      const contrastCommand = new ChangeBackStyleContrastCommand(
        Nodule.getBackStyleContrast(),
        backStyleContrastCopy
      );
      cmdGroup.addCommand(contrastCommand);
      subCommandCount++;
    }
    const postUpdateKeys = Object.keys(postUpdateStyleOptions);

    if (
      postUpdateKeys.length > 0 &&
      activeStyleGroup !== null &&
      styleIndividuallyAltered // include this flag, to prevent an extra save after restore do default
    ) {
      const updateTargets = Array.from(
        activeStyleGroup === StyleCategory.Label
          ? selectedLabels.value.values()
          : selectedPlottables.value.values()
      );
      const styleCommand = new StyleNoduleCommand(
        updateTargets,
        activeStyleGroup,
        // The StyleOptions array must have the same number of
        // items as the updateTargets!!!
        new Array(updateTargets.length).fill(postUpdateStyleOptions),
        new Array(updateTargets.length).fill(preUpdateStyleOptions)
      );
      cmdGroup.addCommand(styleCommand);
      subCommandCount++;
    }
    if (subCommandCount > 0) {
      cmdGroup.push();
      console.info("Style changes persisted as a command");
    } else {
      console.info("No Style changes to persist");
    }
  }

  function restoreTo(styleMap: Map<string, StyleOptions>) {
    styleMap.forEach((style: StyleOptions, name: string) => {
      if (name.startsWith("label:")) {
        const labelName = name.substring(6);
        const theLabel = selectedLabels.value.get(labelName);
        if (theLabel) {
          theLabel.updateStyle(StyleCategory.Label, style);
        }
      } else if (name.startsWith(StyleCategory.Front + ":")) {
        const plotName = name.substring(2);
        const thePlot = selectedPlottables.value.get(plotName);
        if (thePlot) {
          thePlot.updateStyle(StyleCategory.Front, style);
          thePlot.adjustSize();
        }
      } else if (name.startsWith(StyleCategory.Back + ":")) {
        const plotName = name.substring(2);
        const thePlot = selectedPlottables.value.get(plotName);
        if (thePlot) {
          thePlot.updateStyle(StyleCategory.Back, style);
          thePlot.adjustSize();
        }
      }
    });
    styleIndividuallyAltered = false;
  }

  function restoreDefaultStyles() {
    restoreTo(defaultStyleMap);
  }

  function restoreInitialStyles() {
    restoreTo(initialStyleMap);
  }

  return {
    toggleLabelsShowing,
    selectedLabels,
    selectedPlottables,
    styleOptions,
    conflictingProperties,
    forceAgreement,
    hasDisagreement,
    hasStyle,
    changeBackContrast,
    selectActiveGroup,
    deselectActiveGroup,
    persistUpdatedStyleOptions,
    restoreDefaultStyles,
    restoreInitialStyles,
    editedLabels
    // changeStyle,
    // allLabelsShowing,styleOptions: activeStyleOptions
  };
});
