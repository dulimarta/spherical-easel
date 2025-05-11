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
import { ChangeFillStyleCommand } from "@/commands/ChangeFillStyleCommand";
import { StyleNoduleCommand } from "@/commands/StyleNoduleCommand";
import { Command } from "@/commands/Command";
import { SENodule } from "@/models/SENodule";
import { ChangeBackStyleContrastCommand } from "@/commands/ChangeBackstyleContrastCommand";
import { SEText } from "@/models/SEText";

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
  const { selectedSENodules, seNodules, seLabels, seTexts } =
    storeToRefs(seStore);
  const selectedPlottables: Ref<Map<string, Nodule>> = ref(new Map());
  // Apparently, we can't use a Map for recording the selected labels
  // Otherwise the selectedSENodules watcher will get trapped in an
  // infinite update loop
  const selectedLabels: Ref<Set<string>> = ref(new Set());

  // When multiple objects are selected, their style properties
  // may conflict with each other. Keep them in a set
  const conflictingProperties: Ref<Set<string>> = ref(new Set());
  const commonProperties: Set<string> = new Set();
  // To detect conflict, we use the following map to record the current
  // value of each style property
  const stylePropertyMap: Map<string, StylePropertyValue> = new Map();

  // Maps for recording the styles at the beginning of object selection
  const initialStyleMap: Map<string, StyleOptions> = new Map();
  const defaultStyleMap: Map<string, StyleOptions> = new Map();

  // The user is required to opt in to override conflicting properties
  const forceAgreement = ref(false);
  const measurableSelections = ref(false);

  /** styleOptions is a copy visible to Vue components */
  const styleOptions = ref<StyleOptions>({});
  // The following two vars keep track of before and after style updates
  let updateTargets: Nodule[] = [];
  let preUpdateStyleOptionsArray: StyleOptions[] = [];
  let postUpdateStyleOptions: StyleOptions = {};
  let backStyleContrastCopy: number = NaN;
  let fillStyleCopy: boolean = true;
  let activeStyleGroup: StyleCategory | null = null;
  let styleIndividuallyAltered = false;
  let immediatelyAfterRestoreToButtonClick = false;

  // After style editing is done, we should restore label visibility
  // to their original state before editing
  // const labelShowingState: Map<string, boolean> = new Map();
  const editedLabels: Ref<Set<string>> = ref(new Set());

  const selectedSet: Set<string> = new Set();
  function isSameAsPreviousSet(arr: SENodule[]): boolean {
    let inserted = false;

    arr.forEach(n => {
      if (!selectedSet.has(n.name)) {
        selectedSet.add(n.name);
        inserted = true;
      }
    });
    const toRemove: Array<string> = [];
    selectedSet.forEach(x => {
      if (arr.every(n => n.name !== x)) {
        toRemove.push(x);
      }
    });
    toRemove.forEach(x => {
      selectedSet.delete(x);
    });

    console.debug(`Inserted ${inserted}, removed ${toRemove.length}`);
    return !inserted && toRemove.length === 0;
  }

  watch(
    // This watcher runs when the user changes the object selection
    () => selectedSENodules.value,
    selectionArr => {
      // With deep watching enabled, visual blinking of the selected objects
      // by the SelectionHandler will trigger a watch update. To ignore
      // this visual changes, compare the current selection with a recorded set
      if (isSameAsPreviousSet(selectionArr as any)) return;

      // First check for any objects which were deselected
      // by comparing the selectedLabels/plottables map against the current
      // selection. An object recorded in the map but no longer exists
      // in the current selection array must have been deselected
      Array.from(selectedLabels.value.keys()).forEach(labelName => {
        const pos = selectionArr.findIndex(n => n.ref?.name === labelName);
        if (pos < 0 && selectedLabels.value.has(labelName)) {
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

      // Array.from(selectedTexts.value.keys()).forEach(textName => {
      //   const pos = selectionArr.findIndex(n => n.ref?.name === textName);
      //   if (pos < 0 && selectedTexts.value.has(textName)) {
      //     selectedTexts.value.delete(textName);
      //     initialStyleMap.delete("label:" + textName);
      //     defaultStyleMap.delete("label:" + textName);
      //   }
      // });

      let measurableCount = 0;
      // Among the selected object, check if we have new selection
      selectionArr.forEach(n => {
        const itsPlot = n.ref;
        if (itsPlot) {
          // console.debug(`${n.name} plottable`, itsPlot)
          if (itsPlot instanceof Nodule) {
            console.log("Adding to selected Plottable: ", n.name, itsPlot);
            selectedPlottables.value.set(n.name, itsPlot);
          }
          // Remember the initial and default styles of the selected object
          // These maps are used by the  restoreTo() function below
          if (itsPlot instanceof Text) {
            //Text objects are plottable and store their properties in the label style category
            initialStyleMap.set(
              StyleCategory.Label + ":" + n.name,
              itsPlot.currentStyleState(StyleCategory.Label)
            );
            defaultStyleMap.set(
              StyleCategory.Label + ":" + n.name,
              itsPlot.defaultStyleState(StyleCategory.Label)
            );
          } else {
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
        }
        const itsLabel = n.getLabel();
        if (itsLabel) {
          console.log("Adding to selected Labels: ", n.name, itsLabel);
          // console.debug(`${n.name} label`, itsLabel.ref)
          if (!selectedLabels.value.has(itsLabel.ref.name)) {
            selectedLabels.value.add(itsLabel.ref.name);
            // console.log("Add label to selected Labels ", itsLabel.ref.name);
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
          if (itsLabel.ref.value.length > 0) measurableCount++;
        }

        // if (n instanceof SEText) {
        //   // console.debug(`${n.name} label`, itsLabel.ref)
        //   if (!selectedLabels.value.has(n.ref.name)) {
        //     // console.log("Add text to selected Labels ", n.ref.name);
        //     selectedLabels.value.add(n.ref.name);
        //     // Remember the initial and default styles of the selected object
        //     // These maps are used by the  restoreTo() function below
        //     initialStyleMap.set(
        //       "label:" + n.name,
        //       n.ref.currentStyleState(StyleCategory.Label)
        //     );
        //     defaultStyleMap.set(
        //       "label:" + n.name,
        //       n.ref.defaultStyleState(StyleCategory.Label)
        //     );
        //   }
        // }
      });
      //create an array of the current style state of all selected objects using
      // the

      // The selections are measurable only if ALL of them are measurable
      measurableSelections.value = measurableCount === selectionArr.length;
      editedLabels.value.clear();
      console.log("Initial style map size = ", initialStyleMap.size,initialStyleMap);
      console.log("Default style map size = ", defaultStyleMap.size);

      backStyleContrastCopy = Nodule.getBackStyleContrast();
      fillStyleCopy = Nodule.getGradientFill();
    },
    { deep: true }
  );

  watch(
    () => styleOptions.value,
    (opt: StyleOptions) => {
      // Use the spread operator (...) to guarantee copy by value (not copy by ref)
      // This shouldn't execute if this is immediately after a restore to defaults
      // or a restore to current style click.
      if (immediatelyAfterRestoreToButtonClick) {
        immediatelyAfterRestoreToButtonClick = false;
        return;
      }
      const newOptions: StyleOptions = { ...opt };
      postUpdateStyleOptions = {};
      styleIndividuallyAltered = false;
      stylePropertyMap.forEach((val, key) => {
        const newValue = (newOptions as any)[key];
        // console.log("newValue", newValue);
        const oldValue = stylePropertyMap.get(key);
        // console.log("oldValue", oldValue);
        if (!isPropEqual(oldValue, newValue)) {
          console.log(
            `Property ${key} changes from ${oldValue} to ${newValue}`
          );
          (postUpdateStyleOptions as any)[key] = newValue;
          //stylePropertyMap.set(key, newValue); // if this line is left in, then only the last style change is undoable
          styleIndividuallyAltered = true;
        }
      });
      console.log("postUpdateStyleOptions", postUpdateStyleOptions);
      if (styleIndividuallyAltered) {
        if (activeStyleGroup === StyleCategory.Label) {
          selectedLabels.value.forEach(selectedName => {
            // selected labels contain both labels and texts, so search both
            const label = seLabels.value.find(
              lab => lab.ref.name === selectedName
            );
            if (label) {
              label.ref.updateStyle(
                StyleCategory.Label,
                postUpdateStyleOptions
              );
              // When a label is modified, add it to the set
              editedLabels.value.add(label.name);
            } else {
              const text = seTexts.value.find(
                text => text.ref.name === selectedName
              );
              if (text) {
                text.ref.updateStyle(
                  StyleCategory.Label,
                  postUpdateStyleOptions
                );
                // When a label is modified, add it to the set
                editedLabels.value.add(text.name);
              }
            }
          });
        } else if (
          activeStyleGroup === StyleCategory.Front ||
          activeStyleGroup === StyleCategory.Back
        ) {
          selectedPlottables.value.forEach(plot => {
            plot.updateStyle(activeStyleGroup!!, postUpdateStyleOptions);
            // any property which may depends on Zoom factor, must also be updated
            // by calling adjustSize()
            plot.adjustSize();
          });
        }
      }
    },
    {
      deep: true,
      immediate: true
    }
  );

  watch(
    () => forceAgreement.value,
    overrideDisagreement => {
      if (overrideDisagreement) {
        console.debug("Force disagreement on", conflictingProperties.value);
        if (
          activeStyleGroup === StyleCategory.Label &&
          conflictingProperties.value.has("labelBackFillColor") &&
          conflictingProperties.value.has("labelDynamicBackStyle")
        ) {
          // The user attempts to update label back fill color but the label dynamic back styles disagree
          selectedLabels.value.forEach(selectedName => {
            // selected labels contain both labels and texts, so search both
            const label = seLabels.value.find(
              lab => lab.ref.name === selectedName
            );

            if (label) {
              label.ref.updateStyle(StyleCategory.Label, {
                labelDynamicBackStyle: false
              });
              editedLabels.value.add(label.name);
            } else {
              const text = seTexts.value.find(
                text => text.ref.name === selectedName
              );
              if (text) {
                text.ref.updateStyle(StyleCategory.Label, {
                  labelDynamicBackStyle: false
                });
                editedLabels.value.add(text.name);
              }
            }
            // const label = seLabels.value.find(
            //   lab => lab.ref.name === labelName
            // );
            // if (label) {
            //   label.ref.updateStyle(StyleCategory.Label, {
            //     labelDynamicBackStyle: false
            //   });
            //   editedLabels.value.add(label.name);
            // }
          });
        }

        if (
          (activeStyleGroup === StyleCategory.Front ||
            activeStyleGroup === StyleCategory.Back) &&
          conflictingProperties.value.has("dynamicBackStyle") &&
          (conflictingProperties.value.has("fillColor") ||
            conflictingProperties.value.has("strokeColor"))
        ) {
          // The user attempts to update stroke/fill color but the dynamic back styles disagree
          selectedPlottables.value.forEach(plot => {
            plot.updateStyle(activeStyleGroup!!, { dynamicBackStyle: false });
          });
        }
      }
    }
  );
  function recordGlobalContrast() {
    backStyleContrastCopy = Nodule.getBackStyleContrast();
  }

  function recordFillStyle() {
    fillStyleCopy = Nodule.getGradientFill();
  }

  function recordCurrentStyleProperties(category: StyleCategory) {
    activeStyleGroup = category;
    // This function is called when one of the item groups
    // in the StyleDrawer.vue is selected
    // Check for possible conflict among label properties
    conflictingProperties.value.clear();

    // Use counting trick to identity properties common to
    // all selected plottable
    const propertyOccurrenceCount: Map<string, number> = new Map();

    styleOptions.value = {};
    // plottableStyleOptions.value = {}
    stylePropertyMap.clear();
    selectedLabels.value.forEach(selectedName => {
      console.log("Collecting Label State", selectedName);
      // We are searching for the plottable (hence the seLab.ref.name)
      // selectedLabels are both labels and texts
      const label = seLabels.value.find(
        seLab => seLab.ref.name === selectedName
      );

      var props: StyleOptions | undefined = undefined;
      if (label) {
        props = label.ref.currentStyleState(StyleCategory.Label);
      } else {
        const text = seTexts.value.find(
          seText => seText.ref.name === selectedName
        );
        if (text) {
          props = text.ref.currentStyleState(StyleCategory.Label);
        }
      }
      Object.getOwnPropertyNames(props)
        .filter((propName: string) => {
          // remove property names which may have been inserted by Vue/browser
          // console.debug("Label property", p);
          return !propName.startsWith("__");
        })
        .forEach(propName => {
          const recordedPropValue = stylePropertyMap.get(propName);
          const thisPropValue = (props as any)[propName];
          if (typeof recordedPropValue === "undefined") {
            stylePropertyMap.set(propName, thisPropValue);
            (styleOptions.value as any)[propName] = thisPropValue;
          } else if (!isPropEqual(recordedPropValue, thisPropValue)) {
            conflictingProperties.value.add(propName);
          }
        });
    });
    console.log("selectedPlottables.value", selectedPlottables.value);
    selectedPlottables.value.forEach(plot => {
      console.log("Collecting Plottable State", plot);
      const props = plot.currentStyleState(category);
      Object.getOwnPropertyNames(props).forEach(propName => {
        const recordedPropValue = stylePropertyMap.get(propName);
        const thisPropValue = (props as any)[propName];
        if (typeof recordedPropValue === "undefined") {
          stylePropertyMap.set(propName, thisPropValue);
          (styleOptions.value as any)[propName] = thisPropValue;
        } else if (!isPropEqual(recordedPropValue, thisPropValue)) {
          conflictingProperties.value.add(propName);
        }
        const count = propertyOccurrenceCount.get(propName);
        if (typeof count == "number")
          propertyOccurrenceCount.set(propName, count + 1);
        else propertyOccurrenceCount.set(propName, 1);
      });
    });
    commonProperties.clear();

    // The the number of occurrence matches the number of selected object
    // then the property name is common to all these objects
    propertyOccurrenceCount.forEach((count, propName) => {
      if (count === selectedPlottables.value.size)
        commonProperties.add(propName);
    });
    console.debug("Common properties", commonProperties);
    //preUpdateStyleOptions = JSON.parse(JSON.stringify(styleOptions.value));
  }

  function deselectActiveGroup() {
    persistUpdatedStyleOptions();
    activeStyleGroup = null;
  }

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

  function hasTextObject(): boolean {
    let textObjectFound = false;
    selectedSENodules.value.forEach(n => {
      if (n instanceof SEText) {
        textObjectFound = true;
      }
    });
    // console.log("SETextObject in selection?",textObjectFound,selectedSENodules.value)
    return textObjectFound;
  }

  function hasLabelObject(): boolean {
    let labelObjectFound = false;
    selectedSENodules.value.forEach(n => {
      if (n.getLabel()) {
        labelObjectFound = true;
      }
    });
    // console.log("SETextObject in selection?",labelObjectFound,selectedSENodules.value)
    return labelObjectFound;
  }
  function i18nMessageSelector(): number {
    if (!hasTextObject()) {
      return 0; // only labels
    } else if (!hasLabelObject()) {
      return 1; // only text objects
    } else {
      return 2; // a mix of text and label objects
    }
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
      console.debug("Calling stylize", n.ref?.name);
      n.ref?.stylize(DisplayStyle.ApplyCurrentVariables);
    });
  }

  function changeFillStyle(useGradientFill: boolean): void {
    Nodule.setGradientFill(useGradientFill);
    // update all objects display
    seNodules.value.forEach(n => {
      console.debug("Calling stylize", n.ref?.name);
      n.ref?.stylize(DisplayStyle.ApplyCurrentVariables);
    });
  }

  function setUpdateTargetsAndPreUpdateStyleOptionsArrays(): void {
    // Clear the preUpdateStyleOptions and updateTargets arrays
    updateTargets = [];
    preUpdateStyleOptionsArray = [];

    // if (name.startsWith("label:")) {
    //   const objectName = name.substring(6);
    //   const theLabel = seLabels.value.find(n => {
    //     return n.ref.name === objectName;
    //   });
    //   if (theLabel) 


    if (activeStyleGroup === StyleCategory.Label) {
      updateTargets = Array.from(selectedLabels.value).map(selectedName => {
        const label = seLabels.value.find(
          seLab => seLab.ref.name === selectedName
        );
        if (label) {
          const styleOptions = initialStyleMap.get("label:" + label.ref.name);
          if (styleOptions) {
            preUpdateStyleOptionsArray.push(styleOptions);
          } else {
            console.error("preUpdateStyle NOT found for label ",label.ref.name);
          }
        }
        return label!.ref as unknown as Nodule; // label should always be defined, if not then somehow a label was added to the selectedLabels that doesn't exist
      });
    } else {

    // } else if (name.startsWith(StyleCategory.Front + ":")) {
    //   const plotName = name.substring(2);
    //   const thePlot = selectedPlottables.value.get(plotName);
    //   if (thePlot) {

      updateTargets = Array.from(selectedPlottables.value).map(pair => {
        const styleOptions = initialStyleMap.get(
          activeStyleGroup + ":" + pair[0]
        );
        if (styleOptions) {
          preUpdateStyleOptionsArray.push(styleOptions);
        } else {
          console.error("preUpdateStyle NOT found for plottable", pair);
        }
        return pair[1];
      });
    }
  }

  function persistUpdatedStyleOptions() {
    const cmdGroup = new CommandGroup();
    let subCommandCount = 0;

    // Check if back style contrast was modified
    if (backStyleContrastCopy !== Nodule.getBackStyleContrast()) {
      const contrastCommand = new ChangeBackStyleContrastCommand(
        Nodule.getBackStyleContrast(),
        backStyleContrastCopy
      );
      cmdGroup.addCommand(contrastCommand);
      subCommandCount++;
    }

    // Check if the fill style was modified
    if (fillStyleCopy !== Nodule.getGradientFill()) {
      const fillCommand = new ChangeFillStyleCommand(
        Nodule.getGradientFill(),
        fillStyleCopy
      );
      cmdGroup.addCommand(fillCommand);
      subCommandCount++;
    }

    // Check if any other properties were modified
    const postUpdateKeys = Object.keys(postUpdateStyleOptions);
    console.log("postUpdateKeys", postUpdateKeys);
    console.log("activeStyleGroup", activeStyleGroup);
    console.log("styleIndividuallyAltered", styleIndividuallyAltered);
    if (
      postUpdateKeys.length > 0 &&
      activeStyleGroup !== null &&
      styleIndividuallyAltered // include this flag, to prevent an extra save after restore do default
    ) {
      setUpdateTargetsAndPreUpdateStyleOptionsArrays();
      const styleCommand = new StyleNoduleCommand(
        updateTargets,
        activeStyleGroup,
        // The StyleOptions array must have the same number of
        // items as the updateTargets!!!
        new Array(updateTargets.length).fill(postUpdateStyleOptions),
        preUpdateStyleOptionsArray
      );
      console.log("target", updateTargets);
      console.log("after style", postUpdateStyleOptions);
      console.log("before style", preUpdateStyleOptionsArray);
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
    function mergeStyles(accumulator: StyleOptions, curr: StyleOptions) {
      Object.getOwnPropertyNames(curr).forEach((propName: string) => {
        if (!Object.hasOwn(accumulator, propName)) {
          (accumulator as any)[propName] = (curr as any)[propName];
        }
      });
    }
    // First check if subSetStyles is a subset of superSetStyles.
    //  if no return false
    //  if yes, return true if at least of the styles in subSetStyles
    //   is different than the style in superSetStyles
    function differentStyle(
      subSetStyles: StyleOptions,
      superSetStyles: StyleOptions
    ) {
      console.log("Substyle", subSetStyles);
      console.log("superStyle", superSetStyles);
      let differenceDetected = false;
      let subset = true;
      Object.getOwnPropertyNames(subSetStyles).forEach((propName: string) => {
        console.log(
          "SubPropName: ",
          propName,
          "SuperValue: ",
          (superSetStyles as any)[propName]
        );
        console.log(
          "SubPropName: ",
          propName,
          "SubValue: ",
          (superSetStyles as any)[propName]
        );
        if ((superSetStyles as any)[propName] != undefined) {
          // The propName MUST be in the subSetStyles
          if (
            (superSetStyles as any)[propName] != (subSetStyles as any)[propName]
          ) {
            differenceDetected = true;
          }
        } else {
          subset = false;
        }
      });
      console.log("differenceDetected", differenceDetected);
      console.log("subset", subset);
      return differenceDetected && subset;
    }
    const cmdGroup = new CommandGroup();
    let subCommandCount = 0;
    setUpdateTargetsAndPreUpdateStyleOptionsArrays();

    let combinedStyle: StyleOptions = {};
    styleMap.forEach((style: StyleOptions, name: string) => {
      // console.log("restoreTo", name, style)
      // Do not use a simple assignment, so the initial/default styles are intact
      // styleOptions.value = style /* This WON'T work
      // Must use the following unpack syntax to create a different object
      // So the initial & default maps do not become aliases to the current
      // style option
      mergeStyles(combinedStyle, style);
      console.log("After restore! Name:", name, " Style:", style);
      if (name.startsWith("label:")) {
        const objectName = name.substring(6);
        const theLabel = seLabels.value.find(n => {
          return n.ref.name === objectName;
        });
        console.log("label name",theLabel?.ref.name)
        if (theLabel) {
          //console.log("Restore Found matching label", theLabel, style);
          preUpdateStyleOptionsArray.forEach((preUpdateStyleOptions, index) => {
            if (differentStyle(style, preUpdateStyleOptions)) {
              //create a command so this is undoable
              const styleCommand = new StyleNoduleCommand(
                [updateTargets[index]],
                StyleCategory.Label,
                // The StyleOptions array must have the same number of
                // items as the updateTargets!!!
                [style],
                [preUpdateStyleOptions]
              );
              cmdGroup.addCommand(styleCommand);
              subCommandCount++;
            }
            theLabel.ref?.updateStyle(StyleCategory.Label, style);
          });
        }
      } else if (name.startsWith(StyleCategory.Front + ":")) {
        const plotName = name.substring(2);
        const thePlot = selectedPlottables.value.get(plotName);
        if (thePlot) {
          //See which preUpdateOptions are different and update the corresponding nodule
          preUpdateStyleOptionsArray.forEach((preUpdateStyleOptions, index) => {
            if (differentStyle(style, preUpdateStyleOptions)) {
              //create a command so this is undoable
              const styleCommand = new StyleNoduleCommand(
                [updateTargets[index]],
                StyleCategory.Front,
                [style],
                [preUpdateStyleOptions]
              );
              cmdGroup.addCommand(styleCommand);
              subCommandCount++;
            }
            // if (differentStyle(style, preUpdateStyleOptionsArray)) {
            //   //create a command so this is undoable
            //   const styleCommand = new StyleNoduleCommand(
            //     updateTargets,
            //     StyleCategory.Front,
            //     // The StyleOptions array must have the same number of
            //     // items as the updateTargets!!!
            //     new Array(updateTargets.length).fill(style),
            //     new Array(updateTargets.length).fill(preUpdateStyleOptionsArray)
            //   );
            //   cmdGroup.addCommand(styleCommand);
            //   subCommandCount++;
            // }
            thePlot.updateStyle(StyleCategory.Front, style);
            thePlot.adjustSize();
          });
        }
      } else if (name.startsWith(StyleCategory.Back + ":")) {
        const plotName = name.substring(2);
        const thePlot = selectedPlottables.value.get(plotName);
        if (thePlot) {
          //See which preUpdateOptions are different and update the corresponding nodule
          preUpdateStyleOptionsArray.forEach((preUpdateStyleOptions, index) => {
            if (differentStyle(style, preUpdateStyleOptions)) {
              //create a command so this is undoable
              const styleCommand = new StyleNoduleCommand(
                [updateTargets[index]],
                StyleCategory.Back,
                [style],
                [preUpdateStyleOptions]
              );
              cmdGroup.addCommand(styleCommand);
              subCommandCount++;
            }
            // if (differentStyle(style, preUpdateStyleOptionsArray)) {
            //   //create a command so this is undoable
            //   const styleCommand = new StyleNoduleCommand(
            //     updateTargets,
            //     StyleCategory.Back,
            //     // The StyleOptions array must have the same number of
            //     // items as the updateTargets!!!
            //     new Array(updateTargets.length).fill(style),
            //     new Array(updateTargets.length).fill(preUpdateStyleOptionsArray)
            //   );
            //   cmdGroup.addCommand(styleCommand);
            //   subCommandCount++;
            // }
            thePlot.updateStyle(StyleCategory.Back, style);
            thePlot.adjustSize();
          });
        }
      }
    });
    if (subCommandCount > 0) {
      cmdGroup.push();
      console.log("Style changes recorded in command so they will be undoable");
    } else {
      console.log("Restore to inti/default clicked but no changes detected");
    }
    styleOptions.value = { ...combinedStyle };
    styleIndividuallyAltered = false;
  }

  function restoreDefaultStyles() {
    restoreTo(defaultStyleMap);
    // set a restoreToButtonClick flag
    immediatelyAfterRestoreToButtonClick = true;
  }

  function restoreInitialStyles() {
    restoreTo(initialStyleMap);
    // set a restoreToButtonClick flag
    immediatelyAfterRestoreToButtonClick = true;
  }

  function isCommonProperty(s: string) {
    return commonProperties.has(s);
  }

  function hasSomeProperties(arr: Array<string>) {
    return arr.some(p => commonProperties.has(p));
  }

  return {
    toggleLabelsShowing,
    selectedLabels,
    selectedPlottables,
    styleOptions,
    conflictingProperties,
    forceAgreement,
    hasDisagreement,
    hasTextObject,
    hasLabelObject,
    i18nMessageSelector,
    hasStyle,
    changeBackContrast,
    changeFillStyle,
    recordCurrentStyleProperties,
    recordGlobalContrast,
    recordFillStyle,
    deselectActiveGroup,
    persistUpdatedStyleOptions,
    restoreDefaultStyles,
    restoreInitialStyles,
    editedLabels,
    isCommonProperty,
    hasSomeProperties,
    measurableSelections
    // changeStyle,
    // allLabelsShowing,styleOptions: activeStyleOptions
  };
});
