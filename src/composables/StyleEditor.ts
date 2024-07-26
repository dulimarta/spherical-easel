import { SENodule } from "@/models/SENodule";
import Nodule from "@/plottables/Nodule";
import { StyleCategory, StyleOptions } from "@/types/Styles";
import EventBus from "@/eventHandlers/EventBus";
import SETTINGS from "@/global-settings";
import { SEAngleMarker } from "@/models/SEAngleMarker";
import { SESegment } from "@/models/SESegment";
import { SECircle } from "@/models/SECircle";
import { SEEllipse } from "@/models/SEEllipse";
import { SEParametric } from "@/models/SEParametric";
import { SELine } from "@/models/SELine";
import { storeToRefs } from "pinia";
import { useSEStore } from "@/stores/se";
import { computed, ref, Ref, watch } from "vue";

type StyleOptionDiff = {
  prop: string;
  oldValue: string | number | Array<number> | undefined;
  newValue: string | number | Array<number> | undefined;
};
export function useStyleEditor(
  panel: StyleCategory,
  noduleFilterFunction: (n: SENodule) => boolean,
  noduleMapFunction: (n: SENodule) => Nodule,

  // automaticBackState is controlled by user
  // automaticBackStyle : FALSE means she wants to customize back style
  // automaticBackStyle : TRUE means the program will customize back style
  automaticBackStyle: boolean = true
) {
  // You are not allow to style labels directly so remove them from the selection and warn the user
  const seStore = useSEStore();
  const {
    selectedSENodules
    // oldStyleSelections,
    // initialStyleStatesMap,
    // defaultStyleStatesMap
  } = storeToRefs(seStore);

  const commonStyleProperties: Array<string> = [];
  let conflictingPropNames = ref<Array<string>>([]);
  const filteredNodules: Ref<Array<Nodule>> = ref([]);
  const previousSelectedNodules: Array<Nodule> = [];
  const activeStyleOptions = ref<StyleOptions>({});
  let previousStyleOptions: StyleOptions = {};
  let previousBackstyleContrast = 0.5;

  /*
  When dataAgreement is TRUE
  * propDynamicBackStyleCommonValue is TRUE when all selected objects
    have the dynamicBackStyle = TRUE
  * propDynamicBackStyleCommonValue is FALSE when all selected objects
    have the dynamicBackStyle = FALSE
  */
  // dataAgreement = true;
  const propDynamicBackStyleCommonValue = ref(false);

  const anAngleMarkerIsSelected = computed((): boolean => {
    return (
      selectedSENodules.value.filter(seNod => seNod instanceof SEAngleMarker)
        .length > 0
    );
  });
  const oneDimensionalIsSelected = computed((): boolean => {
    return (
      selectedSENodules.value.filter(
        seNod =>
          seNod instanceof SELine ||
          seNod instanceof SESegment ||
          seNod instanceof SECircle ||
          seNod instanceof SEEllipse ||
          seNod instanceof SEParametric
      ).length > 0
    );
  });
  function hasStyle(prop: RegExp): boolean {
    return commonStyleProperties.some((x: string) => x.match(prop));
  }

  function dataAgreement(prop: RegExp): boolean {
    return !conflictingPropNames.value.some((x: string) => x.match(prop));
  }

  watch(
    () => automaticBackStyle,
    (newVal: boolean): void => {
      if (panel === StyleCategory.Back) {
        propDynamicBackStyleCommonValue.value = newVal;
      }
    }
  );

  // watch(
  //   () => selectedSENodules.value,
  //   (newSelection): void => {
  //     // console.debug(
  //     //   "StyleEditor: object selection changed",
  //     //   newSelection.length
  //     // );

  //     // saveStyleState();
  //     commonStyleProperties.splice(0);
  //     // this.dataAgreement = true;
  //     if (newSelection.length === 0) {
  //       return;
  //     }
  //     activeStyleOptions.value = {};

  //     // console.debug("***********************");
  //     seStore.updateSelectedSENodules(newSelection.filter(noduleFilterFunction));
  //     filteredNodules.value.splice(0);
  //     filteredNodules.value.push(
  //       ...selectedSENodules.value.map(noduleMapFunction)
  //     );
  //     // console.debug("Selected SENodules", this.selectedSENodules);
  //     // console.debug("Selected plottables", this.selectedNodules);
  //     seStore.setOldSelection(selectedSENodules.value);

  //     // Save current state so we can reset to this state if needed to
  //     const styleOptionsOfSelected = filteredNodules.value.map((n: Nodule) => {
  //       // console.debug("current style state", n.currentStyleState(this.panel));
  //       return n.currentStyleState(panel);
  //     });
  //     // console.log(
  //     //   "styleOptionsOfSelected",
  //     //   styleOptionsOfSelected[0]
  //     // );
  //     // seStore.recordStyleState({
  //     //   panel: panel,
  //     //   selected: filteredNodules.value
  //     // });

  //     // Use the style of the first selected object as the initial value
  //     activeStyleOptions.value = { ...styleOptionsOfSelected[0] };
  //     // console.log(
  //     //   "active style options",
  //     //   this.activeStyleOptions
  //     // );
  //     // Use flatmap (1-to-many mapping) to compile all the styling properties
  //     // of all the selected objects
  //     const unionOfAllProps = styleOptionsOfSelected.flatMap(
  //       (opt: StyleOptions) =>
  //         Object.getOwnPropertyNames(opt).filter(
  //           (s: string) => !s.startsWith("__")
  //         )
  //     );

  //     const unDuplicatedUnionOfAllProps = new Set(unionOfAllProps); // Convert to set to remove duplicates
  //     // console.log("undup", unDuplicatedUnionOfAllProps);

  //     const listOfAllProps = styleOptionsOfSelected.map((opt: StyleOptions) =>
  //       Object.getOwnPropertyNames(opt).filter(
  //         (s: string) => !s.startsWith("__")
  //       )
  //     );
  //     // console.log("list of common props", listOfAllProps);

  //     unDuplicatedUnionOfAllProps.forEach(prop => {
  //       // make sure that prop is on every list of properties, if so it is a common prop (i.e. in the intersection)
  //       if (listOfAllProps.every(list => list.indexOf(prop) > -1)) {
  //         commonStyleProperties.push(prop);
  //       }
  //     });

  //     // console.log("common props", this.commonStyleProperties);

  //     // Use destructuring (...) to convert back from set to array
  //     //this.commonStyleProperties.push(...uniqueProps);

  //     if (filteredNodules.value.length > 1) {
  //       propDynamicBackStyleCommonValue.value = false;
  //       // When multiple plottables are selected, check for possible conflict
  //       conflictingPropNames.value = commonStyleProperties.filter(
  //         (propName: string) => {
  //           // Confirm that the values of common style property are the same accross
  //           // all selected plottables
  //           const refStyleOption =
  //             filteredNodules.value[0].currentStyleState(panel);
  //           const refValue = (refStyleOption as any)[propName];
  //           if (propName === "dynamicBackStyle")
  //             propDynamicBackStyleCommonValue.value = refValue;
  //           else if (propName === "dashArray") {
  //             // Replace missing values in dash array with zeroes
  //             if (Array.isArray(refValue) && refValue.length === 0)
  //               refValue.push(0, 0);
  //           }

  //           // Style data is in agreement if all the selected object shared
  //           // the same value for all the common style properties
  //           const agreement = filteredNodules.value.every((obj: Nodule) => {
  //             const thisStyleOption = obj.currentStyleState(panel);
  //             const thisValue = (thisStyleOption as any)[propName];
  //             // console.log("prop & name", propName, propName.search(/Color/), obj);
  //             // console.log("ref value", refValue);
  //             // console.log("this value", thisValue);

  //             if (Array.isArray(thisValue) || Array.isArray(refValue)) {
  //               if (thisValue.length === 0) {
  //                 thisValue.push(0, 0);
  //               }
  //               return dashArrayCompare(thisValue, refValue);
  //             } else if (propName.search(/Color/) > -1) {
  //               // Without this the comparasion was saying that "hsla(0, 0%, 0%, 0.1)" was different than "hsla(0,0%,0%,0.100)"
  //               return hslaCompare(thisValue, refValue);
  //             } else return thisValue === refValue;
  //           });
  //           // If values do not agree, include its property name into the conflict array
  //           return !agreement;
  //         }
  //       );
  //       if (conflictingPropNames.value.length > 0) {
  //         conflictingPropNames.value.forEach(prop => {
  //           console.error("Disagreement in property value", prop);
  //         });
  //       }
  //       //update the conflicting properties
  //       const newConflictProps: string[] = [];
  //       conflictingPropNames.value.forEach(name => newConflictProps.push(name));
  //       // this.dataAgreement = false;
  //     } else {
  //       // If we reach this point we have EXACTLY ONE object selected
  //       conflictingPropNames.value.splice(0);
  //       const opt = filteredNodules.value[0].currentStyleState(panel);
  //       if (opt.dashArray && opt.dashArray.length === 0)
  //         opt.dashArray.push(0, 0);
  //       propDynamicBackStyleCommonValue.value =
  //         (opt as any)["dynamicBackStyle"] ?? false;
  //       console.debug("Only one object is selected");

  //       //update the conflicting properties
  //       const newConflictProps: string[] = [];
  //       conflictingPropNames.value.forEach(name => newConflictProps.push(name));
  //     }

  //     previousBackstyleContrast = Nodule.getBackStyleContrast();
  //     // console.log("record previous contrast", this.previousBackstyleContrast);
  //     previousSelectedNodules.splice(0);
  //     previousSelectedNodules.push(...filteredNodules.value);

  //     if (hasStyle(/dashArray/)) {
  //       let value: boolean;
  //       if (activeStyleOptions.value.dashArray) {
  //         if (
  //           activeStyleOptions.value.dashArray[0] === 0 &&
  //           activeStyleOptions.value.dashArray[1] === 0
  //         ) {
  //           value = true;
  //         } else {
  //           value = false;
  //         }
  //         // EventBus.fire("update-empty-dash-array", { emptyDashArray: value });
  //       }
  //     }
  //   },
  //   { immediate: true }
  // );

  /**
   * In the following function: undefined, [], [0,0] are equivalent
   */
  function dashArrayCompare(
    arr1: Array<number> | undefined,
    arr2: Array<number> | undefined
  ): boolean {
    const a = arr1 || []; // turn undefined into zero-length array
    const b = arr2 || []; // turn undefined into zero length array
    if (a.length == 0 && b.length === 0) return true;
    if (a.length == 0) return b.every((val: number) => val === 0);
    if (b.length == 0) return a.every((val: number) => val === 0);
    return a.every((val: number, k: number) => val === b[k]);
  }

  function rgbaCompare(colorString1: string, colorString2: string): boolean {
    if (colorString1 === undefined && colorString2 === undefined) {
      return true;
    }
    if (colorString1 === undefined || colorString2 === undefined) {
      return false;
    }
    if (colorString1.search(/#/) === -1 || colorString2.search(/#/) === -1) {
      throw new Error(
        `Style editor in rgbaCompare: at least one of the strings is not a hex color string: ${colorString1},${colorString2}`
      );
    }
    if (colorString1 == colorString2) {
      return true;
    }
    return false;
  }
  // function hslaCompare(colorString1: string, colorString2: string): boolean {
  //   if (colorString1 === undefined && colorString2 === undefined) {
  //     return true;
  //   }
  //   if (colorString1 === undefined || colorString2 === undefined) {
  //     return false;
  //   }
  //   if (
  //     colorString1.search(/hsla/) === -1 ||
  //     colorString2.search(/hsla/) === -1
  //   ) {
  //     throw new Error(
  //       `Style editor in hslaCompare: at least one of the strings is not a color string: ${colorString1},${colorString2}`
  //     );
  //   }
  //   const hlsaObject1 = Nodule.convertStringToHSLAObject(colorString1);
  //   const hlsaObject2 = Nodule.convertStringToHSLAObject(colorString2);
  //   // console.log("hsla objects", hlsaObject1.h, hlsaObject2.h);
  //   if (
  //     Math.abs(hlsaObject1.h - hlsaObject2.h) < SETTINGS.tolerance &&
  //     Math.abs(hlsaObject1.s - hlsaObject2.s) < SETTINGS.tolerance &&
  //     Math.abs(hlsaObject1.l - hlsaObject2.l) < SETTINGS.tolerance &&
  //     Math.abs(hlsaObject1.a - hlsaObject2.a) < SETTINGS.tolerance
  //   ) {
  //     return true;
  //   }
  //   return false;
  // }

  watch(() => activeStyleOptions.value, onStyleOptionsChanged, {
    deep: true,
    immediate: true
  });
  function onStyleOptionsChanged(z: StyleOptions): void {
    // console.log(
    //   "onStyleOptionsChanged in styleEditor",
    //   z
    // );
    const newOptions = { ...z };
    // console.debug("Inside style editor active style options", newOptions);
    const oldProps = new Set(
      Object.getOwnPropertyNames(previousStyleOptions).filter(
        (s: string) => !s.startsWith("__")
      )
    );
    const newProps = new Set(
      Object.getOwnPropertyNames(newOptions).filter(
        (s: string) => !s.startsWith("__")
      )
    );
    // console.debug("Old props", oldProps);
    // console.debug("New props", newProps);
    const updatedProps = [...newProps].filter((p: string) => oldProps.has(p));
    const updatePayload: StyleOptions = { ...newOptions };

    // console.debug("updated props", updatedProps);
    // Build the update payload by including only changed values
    [...updatedProps].forEach((p: string) => {
      const a = (previousStyleOptions as any)[p];
      const b = (newOptions as any)[p];

      let aEqualsb = true;
      if (Array.isArray(b) || Array.isArray(a)) {
        if (b.length === 0) {
          b.push(0, 0);
        }
        aEqualsb = dashArrayCompare(b, a);
      } else if (p.search(/Color/) > -1) {
        // Without this the comparasion was saying that "hsla(0, 0%, 0%, 0.1)" was different than "hsla(0,0%,0%,0.100)"
        aEqualsb = rgbaCompare(b, a); // hslaCompare(b, a);
      } else aEqualsb = b === a;

      // Exclude the property from payload if it did not change
      if (aEqualsb) delete (updatePayload as any)[p];
      else {
        // console.debug(`Property ${p} changed from ${a} to ${b}`);
        EventBus.fire("style-option-change", { prop: p });
      }
    });

    /* If multiple objects are selected do not update the label text */
    // if (filteredNodules.value.length > 1) delete updatePayload.labelDisplayText;

    // if (this.panel == StyleCategory.Back) {
    //   // if (!this.automaticBackStyle)
    //   //   updatePayload.dynamicBackStyle = !this.propDynamicBackStyleCommonValue;
    //   console.debug(
    //     "About to update backstyle of selected objects using payload",
    //     updatePayload
    //   );
    // }
    if (updatedProps.length > 0) {
      // if (updatePayload.backStyleContrast) {
      //   Nodule.setBackStyleContrast(updatePayload.backStyleContrast);
      //   this.selectedNodules.forEach((n: Nodule) => {
      //     n.stylize(DisplayStyle.ApplyCurrentVariables);
      //   });
      //   delete updatePayload.backStyleContrast;
      // }
      filteredNodules.value.forEach((n: Nodule) => {
        // console.debug("Updating style of", n, "payload", updatePayload);
        n.updateStyle(panel, updatePayload);
      });
    }
    previousStyleOptions = { ...z };
    // console.log(
    //   "previous label mode ssstyle opts end of onStylOptChange",
    //   this.previousStyleOptions
    // );
  }

  function forceDataAgreement(props: string[]): void {
    // console.debug("User overrides data disagreement");
    // this.dataAgreement = true;
    // console.log("num props before", this.conflictingPropNames.length);
    props.forEach(prop => {
      const ind = conflictingPropNames.value.findIndex(
        conflictProp => conflictProp === prop
      );
      // console.log("porp", prop, ind);
      if (ind > -1) {
        conflictingPropNames.value.splice(ind, 1);
      }
    });
    //update the conflicting properties
    const newConflictProps: string[] = [];
    conflictingPropNames.value.forEach(name => newConflictProps.push(name));
    // console.log("num props sent", newConflictProps.length);
    // EventBus.fire("style-update-conflicting-props", {
    //   propNames: newConflictProps
    // });
    if (panel === StyleCategory.Back)
      propDynamicBackStyleCommonValue.value = true;
  }

  // function compute_diff(
  //   opt1: StyleOptions | undefined,
  //   opt2: StyleOptions | undefined
  // ): Array<StyleOptionDiff> {
  //   if (!opt1 && !opt2) return [];
  //   const diffOut: Array<StyleOptionDiff> = [];
  //   if (!opt1) {
  //     for (const p in opt2) {
  //       diffOut.push({
  //         prop: p,
  //         oldValue: undefined,
  //         newValue: (opt2 as any)[p]
  //       });
  //     }
  //     return diffOut;
  //   }
  //   if (!opt2) {
  //     for (const p in opt1) {
  //       diffOut.push({
  //         prop: p,
  //         oldValue: (opt2 as any)[p],
  //         newValue: undefined
  //       });
  //     }
  //     return diffOut;
  //   }
  //   const nameArr: Array<string> = [
  //     ...Object.getOwnPropertyNames(opt1),
  //     ...Object.getOwnPropertyNames(opt2)
  //   ].filter((s: string) => !s.startsWith("__"));

  //   const allPropNames = new Set(nameArr);

  //   // Verify equivalence of all the style properties
  //   [...allPropNames].forEach((p: string) => {
  //     const aVal = (opt1 as any)[p];
  //     const bVal = (opt2 as any)[p];
  //     if (Array.isArray(aVal) && Array.isArray(bVal)) {
  //       if (!dashArrayCompare(aVal, bVal)) {
  //         diffOut.push({ prop: p, oldValue: aVal, newValue: bVal });
  //       }
  //     } else if (p.search(/Color/) > -1) {
  //       // Without this the comparasion was saying that "hsla(0, 0%, 0%, 0.1)" was different than "hsla(0,0%,0%,0.100)"
  //       if (!hslaCompare(bVal, aVal)) {
  //         diffOut.push({ prop: p, oldValue: aVal, newValue: bVal });
  //       }
  //     } else if (aVal != bVal)
  //       diffOut.push({ prop: p, oldValue: aVal, newValue: bVal });
  //   });
  //   return diffOut;
  // }

  // function areEquivalentStyles(
  //   styleStates1: StyleOptions[],
  //   styleStates2: StyleOptions[]
  // ): boolean {
  //   if (styleStates1.length !== styleStates2.length) {
  //     return false;
  //   }

  //   // The outer every runs on the two input arguments
  //   const compare = styleStates1.every(
  //     (a: StyleOptions, i: number) =>
  //       compute_diff(a, styleStates2[i]).length === 0
  //   );
  //   // console.debug("areEquivalentStyles?", compare);
  //   return compare;
  // }

  const selectionCount = computed(() => filteredNodules.value.length);

  return {
    agreement: dataAgreement,
    styleOptions: activeStyleOptions,
    selectionCount,
    conflictingProps: conflictingPropNames,
    //       // enableBackStyleEdit: this.enableBackStyleEdit,
    automaticBackStyleCommonValue: propDynamicBackStyleCommonValue,
    angleMarkersSelected: anAngleMarkerIsSelected,
    oneDimensionSelected: oneDimensionalIsSelected,
    forceDataAgreement,
    hasStyle,
    dataAgreement
  };
}
