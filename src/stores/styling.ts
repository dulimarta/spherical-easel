import { defineStore, storeToRefs } from "pinia";
import { useSEStore } from "./se";
import { ref, watch, Ref } from "vue";
import {
  StyleCategory,
  StyleOptions,
  StylePropertyValue
} from "@/types/Styles";
import Nodule, { DisplayStyle } from "@/plottables-spherical/Nodule";
import Label from "@/plottables-spherical/Label";
import { CommandGroup } from "@/commands-spherical/CommandGroup";
import { ChangeFillStyleCommand } from "@/commands-spherical/ChangeFillStyleCommand";
import { StyleNoduleCommand } from "@/commands-spherical/StyleNoduleCommand";
import { SENodule } from "@/models-spherical/SENodule";
import { ChangeBackStyleContrastCommand } from "@/commands-spherical/ChangeBackstyleContrastCommand";
import { SEText } from "@/models-spherical/SEText";
import EventBus from "@/eventHandlers-spherical/EventBus";
import { FillStyle } from "@/types";
import SETTINGS from "@/global-settings-spherical";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export const useStylingStore = defineStore("style", () => {
  const seStore = useSEStore();
  const { selectedSENodules, seNodules, seLabels, seTexts } =
    storeToRefs(seStore);

  // These are the selectedPlottables, but *not* SEText objects.  SEText objects
  // are plottables, but they are treated like labels, because we want to use
  // all the label styling options on them
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
  // value of each style property.  This should be a map from a style propName
  // to the value in the displayed Label/Front/Back/Global panel
  const currentStyleChoicesMap: Map<string, StylePropertyValue> = new Map();

  // Maps for recording the styles at the beginning of object selection
  // These are map of *all* objects with *all* (Front/Back/Label) options with
  // a value of the complete set of styles for that object and option.
  // defaultStyleMap is set once when the selectionNodules change
  // initialStyleMap is set each time the user changes panels (Label/Front/Back/Global)
  // This is used to issue a style command
  const initialStyleMap: Map<string, StyleOptions> = new Map();
  const defaultStyleMap: Map<string, StyleOptions> = new Map();

  // The user is required to opt in to override conflicting properties
  const forceAgreement = ref(false);
  const measurableSelections = ref(false);

  /**
   * styleOptions is a copy visible to Vue components
   * styleOptions.<propName> are the model objects for all the property
   * selectors on the Label/Front/Back/Global panels
   */
  const styleOptions = ref<StyleOptions>({});

  // The following variables keep track of before and after style updates
  // There are used when issuing a style command
  let updateTargets: Nodule[] = [];
  let preUpdateStyleOptionsArray: StyleOptions[] = [];
  let postUpdateStyleOptions: StyleOptions = {};
  let backStyleContrastCopy = ref(NaN);
  let fillStyleCopy = ref(FillStyle.NoFill);

  // This variable is used to direct a function to modify only those
  // style options are that are on the Label/Front/Back/Global panel
  // this should match the name of the open panel that the user has
  // open or just closed
  let activeStyleGroup: StyleCategory | null = null;

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

    // console.debug(`Inserted ${inserted}, removed ${toRemove.length}`);
    return !inserted && toRemove.length === 0;
  }

  watch(
    // This watcher runs when the user changes the object selection
    () => selectedSENodules.value,
    selectionArr => {
      //if there is no selection stop the blinking in selectionHandler
      // The selected nodules are clear when styling and you click another tool (like undo)
      if (selectedSENodules.value.length == 0) {
        EventBus.fire("stop-blinking-nodules", {});
      }
      // With deep watching enabled, visual blinking of the selected objects
      // by the SelectionHandler will trigger a watch update. To ignore
      // this visual changes, compare the current selection with a recorded set
      if (isSameAsPreviousSet(selectionArr)) return;

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
      resetInitialAndDefaultStyleMaps(); // no arguments to this method mean that the defaultStyleMap will be (re)created and the selected labels and plottables will be (re)created. This is the *ONLY* time this method is called with no arguments
    },
    { deep: true }
  );

  watch(
    () => styleOptions.value,
    (opt: StyleOptions) => {
      // Use the spread operator (...) to guarantee copy by value (not copy by ref)
      const newOptions: StyleOptions = { ...opt };
      currentStyleChoicesMap.forEach((oldValue, key) => {
        const newValue = newOptions[key];
        // console.log("key", key, "new", newValue, "old", oldValue);
        if (!isPropEqual(oldValue, newValue)) {
          console.log(
            `Property ${key} CHANGES from ${oldValue} to ${newValue}`
          );
          postUpdateStyleOptions[key] = newValue;
          currentStyleChoicesMap.set(key, newValue);
        }
      });
      //now apply the changes so that they are visible in the sphere canvas
      if (activeStyleGroup === StyleCategory.Label) {
        selectedLabels.value.forEach(selectedName => {
          // selected labels contain both labels and texts, so search both
          const label = seLabels.value.find(
            lab => lab.ref.name === selectedName
          );
          if (label) {
            label.ref.updateStyle(StyleCategory.Label, postUpdateStyleOptions);
          } else {
            const text = seTexts.value.find(
              text => text.ref.name === selectedName
            );
            if (text) {
              text.ref.updateStyle(StyleCategory.Label, postUpdateStyleOptions);
            }
          }
        });
      } else if (
        activeStyleGroup === StyleCategory.Front ||
        activeStyleGroup === StyleCategory.Back
      ) {
        selectedPlottables.value.forEach(plot => {
          plot.updateStyle(activeStyleGroup!, postUpdateStyleOptions);
          // any property which may depends on Zoom factor, must also be updated
          // by calling adjustSize()
          plot.updateDisplay();
          plot.adjustSize();
        });
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
            }
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
            plot.updateStyle(activeStyleGroup!, { dynamicBackStyle: false });
          });
        }

        if (
          (activeStyleGroup === StyleCategory.Front ||
            activeStyleGroup === StyleCategory.Back) &&
          conflictingProperties.value.has("dynamicBackStyle") &&
          conflictingProperties.value.has("fillColor") &&
          selectionContainsAFillable() &&
          fillStyleCopy.value != FillStyle.NoFill
        ) {
          // The user attempts to update fill color but the dynamic back styles disagree AND at least one of the selected is a fillable SENodule (a SECircle, SEEllipse or SEPolygon) turn on the fill
          changeFillStyle(FillStyle.ShadeFill);
        }
      }
    }
  );

  // each time a front/back/label style menu/popUp is closed/hidden reset the initialStyleMap and the backStyleContrast and fillStyle. This records the state of the selected items after such a much is closed. If the tempActiveStyleGroup is null, rebuild the selectedPlottables and the selectedLabels, and build the defaultStyleMap
  function resetInitialAndDefaultStyleMaps(
    tempActiveStyleGroup: StyleCategory | null = null
  ) {
    const selectionArr = selectedSENodules.value;
    let measurableCount = 0;
    // Among the selected object, check if we have new selection
    selectionArr.forEach(n => {
      const itsPlot = n.ref;
      if (itsPlot && !(n instanceof SEText)) {
        console.debug(`${n.name} plottable`, itsPlot);
        if (tempActiveStyleGroup == null) {
          selectedPlottables.value.set(n.name, itsPlot);
          defaultStyleMap.set(
            StyleCategory.Front + ":" + n.name,
            itsPlot.defaultStyleState(StyleCategory.Front)
          );
          defaultStyleMap.set(
            StyleCategory.Back + ":" + n.name,
            itsPlot.defaultStyleState(StyleCategory.Back)
          );
        }
        // Remember the initial and default styles of the selected object
        // These maps are used by the  restoreTo() function below
        if (
          tempActiveStyleGroup == StyleCategory.Front ||
          tempActiveStyleGroup == null
        ) {
          initialStyleMap.set(
            StyleCategory.Front + ":" + n.name,
            itsPlot.currentStyleState(StyleCategory.Front)
          );
        }

        if (
          tempActiveStyleGroup == StyleCategory.Back ||
          tempActiveStyleGroup == null
        ) {
          initialStyleMap.set(
            StyleCategory.Back + ":" + n.name,
            itsPlot.currentStyleState(StyleCategory.Back)
          );
        }
      }
      const itsLabel = n.getLabel();
      if (itsLabel) {
        if (tempActiveStyleGroup == null) {
          selectedLabels.value.add(itsLabel.ref.name);
          defaultStyleMap.set(
            "label:" + n.name,
            itsLabel.ref.defaultStyleState(StyleCategory.Label)
          );
        }
        // Remember the initial and default styles of the selected object
        // These maps are used by the  restoreTo() function below
        if (
          tempActiveStyleGroup == StyleCategory.Label ||
          tempActiveStyleGroup == null
        ) {
          initialStyleMap.set(
            "label:" + n.name,
            itsLabel.ref.currentStyleState(StyleCategory.Label)
          );
        }
        // }
        if (itsLabel.ref.value.length > 0) measurableCount++;
      }

      if (n instanceof SEText) {
        //Text objects are plottable and store their properties in the label style category so put them in selectedLabels
        if (tempActiveStyleGroup == null) {
          selectedLabels.value.add(n.ref.name);
          defaultStyleMap.set(
            "label:" + n.name,
            n.ref.defaultStyleState(StyleCategory.Label)
          );
        }
        if (
          tempActiveStyleGroup == StyleCategory.Label ||
          tempActiveStyleGroup == null
        ) {
          initialStyleMap.set(
            "label:" + n.name,
            n.ref.currentStyleState(StyleCategory.Label)
          );
        }
      }
    });

    //create an array of the current style state of all selected objects using
    // the

    // The selections are measurable only if ALL of them are measurable
    measurableSelections.value = measurableCount === selectionArr.length;
    // console.log(
    //   "Initial style map size = ",
    //   initialStyleMap.size,
    //   initialStyleMap
    // );
    // console.log("Default style map size = ", defaultStyleMap.size);

    backStyleContrastCopy.value = Nodule.getBackStyleContrast();
    fillStyleCopy.value = Nodule.getFillStyle();
  }

  function recordGlobalContrast() {
    backStyleContrastCopy.value = Nodule.getBackStyleContrast();
  }

  function recordFillStyle() {
    fillStyleCopy.value = Nodule.getFillStyle();
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
    currentStyleChoicesMap.clear();
    selectedLabels.value.forEach(selectedName => {
      // console.log("Collecting Label State", selectedName);
      // We are searching for the plottable (hence the seLab.ref.name)
      // selectedLabels are both labels and texts
      const label = seLabels.value.find(
        seLab => seLab.ref.name === selectedName
      );

      let props: StyleOptions | undefined = undefined;
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
          const recordedPropValue = currentStyleChoicesMap.get(propName);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const thisPropValue = (props as any)[propName];
          if (typeof recordedPropValue === "undefined") {
            currentStyleChoicesMap.set(propName, thisPropValue);
            styleOptions.value[propName] = thisPropValue;
          } else if (!isPropEqual(recordedPropValue, thisPropValue)) {
            conflictingProperties.value.add(propName);
          }
        });
    });
    // console.log("selectedPlottables.value", selectedPlottables.value);
    selectedPlottables.value.forEach(plot => {
      // console.log("Collecting Plottable State", plot);
      const props = plot.currentStyleState(category);
      Object.getOwnPropertyNames(props).forEach(propName => {
        const recordedPropValue = currentStyleChoicesMap.get(propName);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const thisPropValue = (props as any)[propName];
        if (typeof recordedPropValue === "undefined") {
          currentStyleChoicesMap.set(propName, thisPropValue);
          styleOptions.value[propName] = thisPropValue;
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
    // record the contrast and fill style in the case that the
    // user goes directly from the global panel to the label/front/back
    // this prevents the change in these values from being recorded twice
    recordGlobalContrast();
    recordFillStyle();
    // console.log("Common properties", commonProperties);
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
      return Array.from(currentStyleChoicesMap.keys()).some(x => {
        // console.debug(`Has style ${prop} <=> ${x}?`);
        return x === prop;
      });
    } else
      return Array.from(currentStyleChoicesMap.keys()).some(x => x.match(prop));
  }

  function changeBackContrast(newContrast: number): void {
    Nodule.setBackStyleContrast(newContrast);
    // update all objects display
    seNodules.value.forEach(n => {
      n.ref?.stylize(DisplayStyle.ApplyCurrentVariables);
    });
  }

  function changeFillStyle(newFillStyle: FillStyle): void {
    Nodule.setFillStyle(newFillStyle);
    // update all objects display
    seNodules.value.forEach(n => {
      // The fillable types must be recomputed in order to display the change
      if (n.isFillable()) {
        n.ref?.updateDisplay();
      }
      n.ref?.stylize(DisplayStyle.ApplyCurrentVariables);
    });
  }

  function selectionContainsAFillable(): boolean {
    let containsFillableSENodule = false;
    selectedSENodules.value.forEach(element => {
      if (element.isFillable()) {
        containsFillableSENodule = true;
      }
    });
    return containsFillableSENodule;
  }
  function setUpdateTargetsAndPreUpdateStyleOptionsArrays(
    tempActiveStyleGroup: StyleCategory | null = null
  ): void {
    // Clear the preUpdateStyleOptions and updateTargets arrays
    updateTargets = [];
    preUpdateStyleOptionsArray = [];
    // if tempActiveStyleGroup is null, then get the activeStyleGroup (This allows us to force a check on the style values from a particular styleCategory)
    if (tempActiveStyleGroup == null) {
      tempActiveStyleGroup = activeStyleGroup;
    }

    console.log("target group", tempActiveStyleGroup);

    if (tempActiveStyleGroup === StyleCategory.Label) {
      updateTargets = Array.from(selectedLabels.value).map(selectedName => {
        const label = seLabels.value.find(
          seLab => seLab.ref.name === selectedName
        );
        if (label) {
          const styleOptions = initialStyleMap.get("label:" + label.ref.name);
          if (styleOptions) {
            preUpdateStyleOptionsArray.push(styleOptions);
          } else {
            console.error(
              "preUpdateStyle NOT found for label ",
              label.ref.name
            );
          }
          return label.ref as unknown as Nodule; // label should always be defined, if not then somehow a label was added to the selectedLabels that doesn't exist
        } else {
          // there is a text object in the selectedLabels.values array
          const text = seTexts.value.find(
            seText => seText.ref.name === selectedName
          );
          if (text) {
            const styleOptions = initialStyleMap.get("label:" + text.ref.name);
            if (styleOptions) {
              preUpdateStyleOptionsArray.push(styleOptions);
            } else {
              console.error(
                "preUpdateStyle NOT found for text ",
                text.ref.name
              );
            }
            return text.ref as unknown as Nodule; // label should always be defined, if not then somehow a label was added to the selectedLabels that doesn't exist
          }
        }
        console.error("No label or text was found for update target");
        return new Label("This Should Never Happen", "point"); //Dummy label to make the linter happy
      });
    } else if (
      tempActiveStyleGroup === StyleCategory.Front ||
      tempActiveStyleGroup === StyleCategory.Back
    ) {
      updateTargets = Array.from(selectedPlottables.value).map(pair => {
        const styleOptions = initialStyleMap.get(
          tempActiveStyleGroup + ":" + pair[0]
        );
        if (styleOptions) {
          preUpdateStyleOptionsArray.push(styleOptions);
        } else {
          console.error("preUpdateStyle NOT found for plottable", pair);
        }
        return pair[1];
      });
    }
    // console.log(
    //   "set targets and pre style",
    //   tempActiveStyleGroup,
    //   updateTargets,
    //   preUpdateStyleOptionsArray
    // );
  }

  function persistUpdatedStyleOptions(
    tempActiveStyleGroup: StyleCategory | null = null
  ) {
    const cmdGroup = new CommandGroup();
    let subCommandCount = 0;

    // Check if back style contrast was modified (the first time through backStyleContrast is a NaN)
    if (
      !Number.isNaN(backStyleContrastCopy.value) &&
      backStyleContrastCopy.value !== Nodule.getBackStyleContrast()
    ) {
      // console.log("after contrast", Nodule.getBackStyleContrast());
      // console.log("before contrast", backStyleContrastCopy.value);
      const contrastCommand = new ChangeBackStyleContrastCommand(
        Nodule.getBackStyleContrast(),
        backStyleContrastCopy.value
      );
      cmdGroup.addCommand(contrastCommand);
      subCommandCount++;
    }

    // Check if the fill style was modified
    if (fillStyleCopy.value !== Nodule.getFillStyle()) {
      // console.log("after fillstyle", Nodule.getFillStyle());
      // console.log("before fillstyle", fillStyleCopy.value);
      const fillCommand = new ChangeFillStyleCommand(
        Nodule.getFillStyle(),
        fillStyleCopy.value
      );
      cmdGroup.addCommand(fillCommand);
      subCommandCount++;
    }

    // Check if any other properties were modified
    const postUpdateKeys = Object.keys(postUpdateStyleOptions);
    // console.log("persist postUpdateKeys", postUpdateKeys);
    // console.log("persist activeStyleGroup", activeStyleGroup);
    // Check to see if any of the postUpdateStyleOptions are new this is
    // useful because a user can change a value and then change it back to
    // the original value. This needs to be detected in order to update
    // the screen, but doesn't need to be recorded in a style command.

    // if tempActiveStyleGroup is null, then get the activeStyleGroup (This allows us to force a check on the style values from a particular styleCategory)
    if (tempActiveStyleGroup == null) {
      tempActiveStyleGroup = activeStyleGroup;
    }

    setUpdateTargetsAndPreUpdateStyleOptionsArrays(tempActiveStyleGroup);

    let styleChangeDetected = false;
    preUpdateStyleOptionsArray.forEach(opt => {
      if (differentStyle(postUpdateStyleOptions, opt)) {
        //order of arguments is important! opt is the larger complete set of styleOptions and postUpdateStyleOptions is only those that have been changed by the user (which is different than the ones that the user has manipulated because a user can change a value and then change it back to its original value which is exactly what would happen for a user exploring an toggle switch and then don't like the change they observe )
        styleChangeDetected = true;
      }
    });
    if (
      styleChangeDetected &&
      postUpdateKeys.length > 0 &&
      tempActiveStyleGroup !== null
    ) {
      const styleCommand = new StyleNoduleCommand(
        updateTargets,
        tempActiveStyleGroup,
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
    postUpdateStyleOptions = {};
  }

  // return true if at least of the styles in subSetStyles
  //   is different than the style in superSetStyles, order matters
  function differentStyle(
    subSetStyles: StyleOptions,
    superSetStyles: StyleOptions
  ) {
    let differenceDetected = false;
    Object.getOwnPropertyNames(subSetStyles).forEach((propName: string) => {
      // console.log(
      //   "SubPropName: ",
      //   propName,
      //   "SuperValue: ",
      //   (superSetStyles as any)[propName],
      //   "SubValue: ",
      //   (subSetStyles as any)[propName]
      // );
      const supVal = superSetStyles[propName];
      const subVal = subSetStyles[propName];

      if (!isPropEqual(supVal, subVal)) {
        differenceDetected = true;
        // console.log(
        //   "style difference: Prop ",
        //   propName,
        //   "sub ",
        //   subVal,
        //   "sup",
        //   supVal
        // );
      }
    });
    return differenceDetected;
  }

  function restoreTo(styleMap: Map<string, StyleOptions>) {
    function mergeStyles(accumulator: StyleOptions, curr: StyleOptions) {
      Object.getOwnPropertyNames(curr).forEach((propName: string) => {
        if (!Object.hasOwn(accumulator, propName)) {
          accumulator[propName] = curr[propName];
        }
      });
    }

    let combinedStyle: StyleOptions = {};
    styleMap.forEach((style: StyleOptions, name: string) => {
      // Do not use a simple assignment, so the initial/default styles are intact
      // styleOptions.value = style /* This WON'T work
      // Must use the following unpack syntax to create a different object
      // So the initial & default maps do not become aliases to the current
      // style option
      mergeStyles(combinedStyle, style);
      if (
        name.startsWith("label:") &&
        activeStyleGroup == StyleCategory.Label
      ) {
        const objectName = name.substring(6);
        const theLabel = seLabels.value.find(n => {
          return n.ref.name === objectName;
        });
        if (theLabel) {
          theLabel.ref?.updateStyle(StyleCategory.Label, style);
        } else {
          const theText = seTexts.value.find(n => {
            return n.ref.name === objectName;
          });
          if (theText) {
            theText.ref?.updateStyle(StyleCategory.Label, style);
          }
        }
      } else if (
        name.startsWith(StyleCategory.Front + ":") &&
        activeStyleGroup == StyleCategory.Front
      ) {
        const plotName = name.substring(2);
        const thePlot = selectedPlottables.value.get(plotName);
        if (thePlot) {
          thePlot.updateStyle(StyleCategory.Front, style);
          thePlot.adjustSize();
        }
      } else if (
        name.startsWith(StyleCategory.Back + ":") &&
        activeStyleGroup == StyleCategory.Back
      ) {
        const plotName = name.substring(2);
        const thePlot = selectedPlottables.value.get(plotName);
        if (thePlot) {
          thePlot.updateStyle(StyleCategory.Back, style);
          thePlot.adjustSize();
        }
      }
    });
    styleOptions.value = { ...combinedStyle };
  }

  function restoreDefaultStyles() {
    restoreTo(defaultStyleMap);
  }

  function restoreInitialStyles() {
    restoreTo(initialStyleMap);
  }

  function isCommonProperty(s: string) {
    return commonProperties.has(s);
  }

  function hasSomeProperties(arr: Array<string>) {
    return arr.some(p => commonProperties.has(p));
  }

  function showFillColorPickerForFillable() {
    // If there are no fillables (SECircle,SEEllipse,SEPolygon) in the selection
    if (!selectionContainsAFillable()) {
      return true; // This allows SEPoints, SEAngleMarkers that have a fill but are not fillable to be edited as usual
    }
    // If every SENodule in the selection is fillable
    if (selectedSENodules.value.every(node => node.isFillable())) {
      return Nodule.getFillStyle() != FillStyle.NoFill; // allows the display of the fill color select when all selected are fillable AND the fill style is not noFill
    }

    // There is a mix of fillable and not fillable in the selection
    // Either the fills of them disagree (in which case the picker is not displayed because hasDisagreement('fillColor') is true) or they agree.
    // if they agree then only display the picker when the fill style is
    // not noFill, so that a user will not become frustrated when they
    // pick a fill and it is not display (because the fill style is noFill)

    return Nodule.getFillStyle() != FillStyle.NoFill;
  }

  return {
    selectedLabels,
    selectedPlottables,
    styleOptions,
    conflictingProperties,
    forceAgreement,
    backStyleContrastCopy,
    fillStyleCopy,
    showFillColorPickerForFillable,
    hasDisagreement,
    hasLabelObject,
    hasTextObject,
    i18nMessageSelector,
    hasStyle,
    changeBackContrast,
    changeFillStyle,
    recordCurrentStyleProperties,
    recordGlobalContrast,
    recordFillStyle,
    restoreDefaultStyles,
    restoreInitialStyles,
    resetInitialAndDefaultStyleMaps,
    isCommonProperty,
    hasSomeProperties,
    persistUpdatedStyleOptions,
    measurableSelections
  };
});
