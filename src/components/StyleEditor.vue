
<script lang="ts">
import { SENodule } from "@/models/SENodule";
import Nodule from "@/plottables/Nodule";
import { AppState } from "@/types";
import { StyleEditPanels, StyleOptions } from "@/types/Styles";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { ScopedSlotChildren } from "vue/types/vnode";
import { namespace } from "vuex-class";
import { SEStore } from "@/store";
import EventBus from "@/eventHandlers/EventBus";
import { StyleNoduleCommand } from "@/commands/StyleNoduleCommand";
import SETTINGS from "@/global-settings";
import { SEAngleMarker } from "@/models/SEAngleMarker";
import { SESegment } from "@/models/SESegment";
import { SECircle } from "@/models/SECircle";
import { SEEllipse } from "@/models/SEEllipse";
import { SEParametric } from "@/models/SEParametric";
import { SELine } from "@/models/SELine";
import { CommandGroup } from "@/commands/CommandGroup";
import { ChangeBackStyleContrastCommand } from "@/commands/ChangeBackstyleContrastCommand";
const SE = namespace("se");
type StyleOptionDiff = {
  prop: string;
  oldValue: string | number | Array<number> | undefined;
  newValue: string | number | Array<number> | undefined;
};
@Component
export default class extends Vue {
  @Prop({ required: true }) readonly panel!: StyleEditPanels;
  // @Prop({ required: true }) readonly styleData!: StyleOptions | null;
  @Prop({ required: true }) noduleFilterFunction!: (n: SENodule) => boolean;
  @Prop({ required: true }) noduleMapFunction!: (n: SENodule) => Nodule;

  // automaticBackState is controlled by user
  // automaticBackStyle : FALSE means she wants to customize back style
  // automaticBackStyle : TRUE means the program will customize back style
  @Prop({ default: true }) automaticBackStyle!: boolean;

  @SE.State((s: AppState) => s.selectedSENodules)
  readonly allSelectedSENodules!: SENodule[];

  @SE.State((s: AppState) => s.initialStyleStatesMap)
  readonly initialStatesMap!: Map<StyleEditPanels, StyleOptions[]>;

  @SE.State((s: AppState) => s.defaultStyleStatesMap)
  readonly defaultStatesMap!: Map<StyleEditPanels, StyleOptions[]>;

  @SE.State((s: AppState) => s.oldSelections)
  readonly oldSelections!: SENodule[];

  // @SE.State((s: AppState) => s.initialBackStyleContrast)
  // readonly initialBackStyleContrast!: number;

  commonStyleProperties: Array<string> = [];
  conflictingPropNames: Array<string> = [];
  selectedSENodules: Array<SENodule> = [];
  selectedNodules: Array<Nodule> = [];
  previousSelectedNodules: Array<Nodule> = [];
  activeStyleOptions: StyleOptions = {};
  previousStyleOptions: StyleOptions = {};
  previousBackstyleContrast = 0.5;

  /*
  When dataAgreement is TRUE
  * propDynamicBackStyleCommonValue is TRUE when all selected objects 
    have the dynamicBackStyle = TRUE
  * propDynamicBackStyleCommonValue is FALSE when all selected objects 
    have the dynamicBackStyle = FALSE
  */
  // dataAgreement = true;
  propDynamicBackStyleCommonValue = false;

  render(): ScopedSlotChildren {
    if (this.$scopedSlots.default)
      return this.$scopedSlots.default({
        agreement: this.dataAgreement,
        styleOptions: this.activeStyleOptions,
        selectionCount: this.selectedNodules.length,
        conflictingProps: this.conflictingPropNames,
        // enableBackStyleEdit: this.enableBackStyleEdit,
        automaticBackStyleCommonValue: this.propDynamicBackStyleCommonValue,
        angleMarkersSelected: this.anAngleMarkerIsSelected,
        oneDimensionSelected: this.oneDimensionalIsSelected,
        forceDataAgreement: this.forceDataAgreement,
        hasStyle: this.hasStyle,
        dataAgreement: this.dataAgreement
      });
    return {} as ScopedSlotChildren;
    // throw new Error("Default scoped slot is undefined");
  }

  // get enableBackStyleEdit(): boolean {
  //   // Must be in Back panel
  //   if (this.panel !== StyleEditPanels.Back) {
  //     console.debug(
  //       "Enable Back Style Edit? No, becasue the user is NOT editing Back panel"
  //     );
  //     return false;
  //   }
  //   // The user wants automatic back styling
  //   // [The user does NOT want manual back styling/does NOT want to edit]
  //   if (this.automaticBackStyle === false) {
  //     console.debug(
  //       "Enable Back Style Edit? Yes, becasue the user does not want automatic back style"
  //     );
  //     return true;
  //   }
  //   console.debug(
  //     "Enable Back Style Edit? It depend on dynamicBackStyleCommonValue: ",
  //     !this.propDynamicBackStyleCommonValue
  //   );
  //   // We got here when the user requested manual editing of back style
  //   return !this.propDynamicBackStyleCommonValue;
  // }
  get anAngleMarkerIsSelected(): boolean {
    return (
      this.selectedSENodules.filter(seNod => seNod instanceof SEAngleMarker)
        .length > 0
    );
  }
  get oneDimensionalIsSelected(): boolean {
    return (
      this.selectedSENodules.filter(
        seNod =>
          seNod instanceof SELine ||
          seNod instanceof SESegment ||
          seNod instanceof SECircle ||
          seNod instanceof SEEllipse ||
          seNod instanceof SEParametric
      ).length > 0
    );
  }
  hasStyle(prop: RegExp): boolean {
    return this.commonStyleProperties.some((x: string) => x.match(prop));
  }

  dataAgreement(prop: RegExp): boolean {
    return !this.conflictingPropNames.some((x: string) => x.match(prop));
  }

  created(): void {
    // const self = this;
    EventBus.listen("style-data-clear", this.undo.bind(this));
    EventBus.listen("style-data-to-default", this.restoreDefault.bind(this));
    EventBus.listen("save-style-state", this.saveStyleState.bind(this));
  }
  mounted(): void {
    // console.debug(
    //   "From StyleEditor::mounted. Panel is",
    //   StyleEditPanels[this.panel]
    // );
  }
  beforeDestroy(): void {
    EventBus.unlisten("style-data-clear");
    EventBus.unlisten("style-data-to-default");
  }

  restoreTo(propNames: string[], styleData: StyleOptions[]): void {
    console.debug("Style data to apply", styleData);
    this.selectedNodules.forEach((n: Nodule, k: number) => {
      const updatePayload: StyleOptions = {};
      propNames.forEach((p: string) => {
        // if (p === "dashArray") {
        //   console.log("restore dash array to ", (styleData[k] as any)[p]);
        // }
        (updatePayload as any)[p] = (styleData[k] as any)[p];
      });
      // console.debug("Updating style of", n, "using", updatePayload);
      n.updateStyle(this.panel, updatePayload);
    });
    if (styleData.length > 0) {
      propNames.forEach((p: string) => {
        (this.activeStyleOptions as any)[p] = (styleData[0] as any)[p];
      });
    }
  }
  undo(ev: { selector: string; panel: StyleEditPanels }): void {
    const styleData = this.initialStatesMap.get(this.panel);
    if (styleData) {
      const listOfProps = ev.selector.split(",");
      if (ev.selector === "labelBackFillColor") {
        // if the user restores the labelBackFillColor to defaults also restore the automaticBackStyling
        listOfProps.push("labelDynamicBackStyle");
      }
      if (ev.panel !== undefined && ev.panel === StyleEditPanels.Back) {
        // if the user restores the something from the back panel also restore the automaticBackStyling
        listOfProps.push("dynamicBackStyle");
      }
      this.restoreTo(listOfProps, styleData);
    }

    // set the color of the conflicting inputs in the style panel to normal
    EventBus.fire("style-label-conflict-color-reset", {});
  }
  restoreDefault(ev: { selector: string; panel: StyleEditPanels }): void {
    // console.log("ev selector", ev.selector);
    const styleData = this.defaultStatesMap.get(this.panel);
    if (styleData) {
      const listOfProps = ev.selector.split(",");
      if (listOfProps.some(prop => prop === "labelBackFillColor")) {
        // if the user restores the labelBackFillColor to defaults also restore the automaticBackStyling
        listOfProps.push("labelDynamicBackStyle");
      }
      if (ev.panel === StyleEditPanels.Back) {
        // if the user restores the something from the back panel also restore the automaticBackStyling
        listOfProps.push("dynamicBackStyle");
      }

      this.restoreTo(listOfProps, styleData);
    }

    // set the color of the conflicting inputs in the style panel to normal
    EventBus.fire("style-label-conflict-color-reset", {});
  }

  @Watch("panel")
  onPanelChanged(): void {
    console.debug("Panel changed?");
  }

  @Watch("automaticBackStyle")
  onAutomaticBackStyleChanged(newVal: boolean): void {
    if (this.panel === StyleEditPanels.Back) {
      this.propDynamicBackStyleCommonValue = newVal;
    }
  }

  @Watch("allSelectedSENodules", { immediate: true })
  onSelectionChanged(newSelection: SENodule[]): void {
    // console.debug("StyleEditor: object selection changed", newSelection.length);

    this.saveStyleState();
    this.commonStyleProperties.splice(0);
    // this.dataAgreement = true;
    if (newSelection.length === 0) {
      return;
    }
    this.activeStyleOptions = {};

    // console.debug("***********************");
    this.selectedSENodules = newSelection.filter(this.noduleFilterFunction);
    this.selectedNodules = this.selectedSENodules.map(this.noduleMapFunction);
    // console.debug("Selected SENodules", this.selectedSENodules);
    // console.debug("Selected plottables", this.selectedNodules);
    SEStore.setOldSelection(this.selectedSENodules);

    // Save current state so we can reset to this state if needed to
    const styleOptionsOfSelected = this.selectedNodules.map((n: Nodule) => {
      // console.debug("current style state", n.currentStyleState(this.panel));
      return n.currentStyleState(this.panel);
    });
    // console.log(
    //   "styleOptionsOfSelected",
    //   styleOptionsOfSelected[0]
    // );
    SEStore.recordStyleState({
      panel: this.panel,
      selected: this.selectedNodules
    });

    // Use the style of the first selected object as the initial value
    this.activeStyleOptions = { ...styleOptionsOfSelected[0] };
    // console.log(
    //   "active style options",
    //   this.activeStyleOptions
    // );
    // Use flatmap (1-to-many mapping) to compile all the styling properties
    // of all the selected objects
    const unionOfAllProps = styleOptionsOfSelected.flatMap(
      (opt: StyleOptions) =>
        Object.getOwnPropertyNames(opt).filter(
          (s: string) => !s.startsWith("__")
        )
    );

    const unDuplicatedUnionOfAllProps = new Set(unionOfAllProps); // Convert to set to remove duplicates
    // console.log("undup", unDuplicatedUnionOfAllProps);

    const listOfAllProps = styleOptionsOfSelected.map((opt: StyleOptions) =>
      Object.getOwnPropertyNames(opt).filter((s: string) => !s.startsWith("__"))
    );
    // console.log("list of common props", listOfAllProps);

    unDuplicatedUnionOfAllProps.forEach(prop => {
      // make sure that prop is on every list of properties, if so it is a common prop (i.e. in the intersection)
      if (listOfAllProps.every(list => list.indexOf(prop) > -1)) {
        this.commonStyleProperties.push(prop);
      }
    });

    // console.log("common props", this.commonStyleProperties);

    // Use destructuring (...) to convert back from set to array
    //this.commonStyleProperties.push(...uniqueProps);

    if (this.selectedNodules.length > 1) {
      this.propDynamicBackStyleCommonValue = false;
      // When multiple plottables are selected, check for possible conflict
      this.conflictingPropNames = this.commonStyleProperties.filter(
        (propName: string) => {
          // Confirm that the values of common style property are the same accross
          // all selected plottables
          const refStyleOption = this.selectedNodules[0].currentStyleState(
            this.panel
          );
          const refValue = (refStyleOption as any)[propName];
          if (propName === "dynamicBackStyle")
            this.propDynamicBackStyleCommonValue = refValue;
          else if (propName === "dashArray") {
            // Replace missing values in dash array with zeroes
            if (Array.isArray(refValue) && refValue.length === 0)
              refValue.push(0, 0);
          }

          // Style data is in agreement if all the selected object shared
          // the same value for all the common style properties
          const agreement = this.selectedNodules.every((obj: Nodule) => {
            const thisStyleOption = obj.currentStyleState(this.panel);
            const thisValue = (thisStyleOption as any)[propName];
            // console.log("prop & name", propName, propName.search(/Color/), obj);
            // console.log("ref value", refValue);
            // console.log("this value", thisValue);

            if (Array.isArray(thisValue) || Array.isArray(refValue)) {
              if (thisValue.length === 0) {
                thisValue.push(0, 0);
              }
              return this.dashArrayCompare(thisValue, refValue);
            } else if (propName.search(/Color/) > -1) {
              // Without this the comparasion was saying that "hsla(0, 0%, 0%, 0.1)" was different than "hsla(0,0%,0%,0.100)"
              return this.hslaCompare(thisValue, refValue);
            } else return thisValue === refValue;
          });
          // If values do not agree, include its property name into the conflict array
          return !agreement;
        }
      );
      if (this.conflictingPropNames.length > 0) {
        this.conflictingPropNames.forEach(prop => {
          console.error("Disagreement in property value", prop);
        });
      }
      //update the conflicting properties
      const newConflictProps: string[] = [];
      this.conflictingPropNames.forEach(name => newConflictProps.push(name));
      EventBus.fire("style-update-conflicting-props", {
        propNames: newConflictProps
      });
      // this.dataAgreement = false;
    } else {
      // If we reach this point we have EXACTLY ONE object selected
      this.conflictingPropNames.splice(0);
      const opt = this.selectedNodules[0].currentStyleState(this.panel);
      if (opt.dashArray && opt.dashArray.length === 0) opt.dashArray.push(0, 0);
      this.propDynamicBackStyleCommonValue =
        (opt as any)["dynamicBackStyle"] ?? false;
      console.debug("Only one object is selected");

      //update the conflicting properties
      const newConflictProps: string[] = [];
      this.conflictingPropNames.forEach(name => newConflictProps.push(name));
      EventBus.fire("style-update-conflicting-props", {
        propNames: newConflictProps
      });
    }

    this.previousBackstyleContrast = Nodule.getBackStyleContrast();
    // console.log("record previous contrast", this.previousBackstyleContrast);
    this.previousSelectedNodules.splice(0);
    this.previousSelectedNodules.push(...this.selectedNodules);
  }

  /**
   * In the following function: undefined, [], [0,0] are equivalent
   */
  dashArrayCompare(
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

  hslaCompare(colorString1: string, colorString2: string): boolean {
    if (colorString1 === undefined && colorString2 === undefined) {
      return true;
    }
    if (colorString1 === undefined || colorString2 === undefined) {
      return false;
    }
    if (
      colorString1.search(/hsla/) === -1 ||
      colorString2.search(/hsla/) === -1
    ) {
      throw new Error(
        `Style editor in hslaCompare: at least one of the strings is not a color string: ${colorString1},${colorString2}`
      );
    }
    const hlsaObject1 = Nodule.convertStringToHSLAObject(colorString1);
    const hlsaObject2 = Nodule.convertStringToHSLAObject(colorString2);
    // console.log("hsla objects", hlsaObject1.h, hlsaObject2.h);
    if (
      Math.abs(hlsaObject1.h - hlsaObject2.h) < SETTINGS.tolerance &&
      Math.abs(hlsaObject1.s - hlsaObject2.s) < SETTINGS.tolerance &&
      Math.abs(hlsaObject1.l - hlsaObject2.l) < SETTINGS.tolerance &&
      Math.abs(hlsaObject1.a - hlsaObject2.a) < SETTINGS.tolerance
    ) {
      return true;
    }
    return false;
  }

  @Watch("activeStyleOptions", { deep: true, immediate: true })
  onStyleOptionsChanged(z: StyleOptions): void {
    // console.log(
    //   "onStyleOpCha in styleEditor",
    //   z
    // );
    const newOptions = { ...z };
    // console.debug("Inside style editor active style options", newOptions);
    const oldProps = new Set(
      Object.getOwnPropertyNames(this.previousStyleOptions).filter(
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
      const a = (this.previousStyleOptions as any)[p];
      const b = (newOptions as any)[p];

      let aEqualsb = true;
      if (Array.isArray(b) || Array.isArray(a)) {
        if (b.length === 0) {
          b.push(0, 0);
        }
        aEqualsb = this.dashArrayCompare(b, a);
      } else if (p.search(/Color/) > -1) {
        // Without this the comparasion was saying that "hsla(0, 0%, 0%, 0.1)" was different than "hsla(0,0%,0%,0.100)"
        aEqualsb = this.hslaCompare(b, a);
      } else aEqualsb = b === a;

      // Exclude the property from payload if it did not change
      if (aEqualsb) delete (updatePayload as any)[p];
      else {
        // console.debug(`Property ${p} changed from ${a} to ${b}`);
        EventBus.fire("style-option-change", { prop: p });
      }
    });

    /* If multiple objects are selected do not update the label text */
    if (this.selectedNodules.length > 1) delete updatePayload.labelDisplayText;

    // if (this.panel == StyleEditPanels.Back) {
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
      this.selectedNodules.forEach((n: Nodule) => {
        // console.debug(
        //   "Updating style of",
        //   n,
        //   "payload",
        //   updatePayload
        // );
        n.updateStyle(this.panel, updatePayload);
      });
    }
    this.previousStyleOptions = { ...z };
    // console.log(
    //   "previous label mode ssstyle opts end of onStylOptChange",
    //   this.previousStyleOptions
    // );
  }

  forceDataAgreement(props: string[]): void {
    // console.debug("User overrides data disagreement");
    // this.dataAgreement = true;
    // console.log("num props before", this.conflictingPropNames.length);
    props.forEach(prop => {
      const ind = this.conflictingPropNames.findIndex(
        conflictProp => conflictProp === prop
      );
      // console.log("porp", prop, ind);
      if (ind > -1) {
        this.conflictingPropNames.splice(ind, 1);
      }
    });
    //update the conflicting properties
    const newConflictProps: string[] = [];
    this.conflictingPropNames.forEach(name => newConflictProps.push(name));
    // console.log("num props sent", newConflictProps.length);
    EventBus.fire("style-update-conflicting-props", {
      propNames: newConflictProps
    });
    if (this.panel === StyleEditPanels.Back)
      this.propDynamicBackStyleCommonValue = true;
  }

  compute_diff(
    opt1: StyleOptions | undefined,
    opt2: StyleOptions | undefined
  ): Array<StyleOptionDiff> {
    if (!opt1 && !opt2) return [];
    const diffOut: Array<StyleOptionDiff> = [];
    if (!opt1) {
      for (const p in opt2) {
        diffOut.push({
          prop: p,
          oldValue: undefined,
          newValue: (opt2 as any)[p]
        });
      }
      return diffOut;
    }
    if (!opt2) {
      for (const p in opt1) {
        diffOut.push({
          prop: p,
          oldValue: (opt2 as any)[p],
          newValue: undefined
        });
      }
      return diffOut;
    }
    const nameArr: Array<string> = [
      ...Object.getOwnPropertyNames(opt1),
      ...Object.getOwnPropertyNames(opt2)
    ].filter((s: string) => !s.startsWith("__"));

    const allPropNames = new Set(nameArr);

    // Verify equivalence of all the style properties
    [...allPropNames].forEach((p: string) => {
      const aVal = (opt1 as any)[p];
      const bVal = (opt2 as any)[p];
      if (Array.isArray(aVal) && Array.isArray(bVal)) {
        if (!this.dashArrayCompare(aVal, bVal)) {
          diffOut.push({ prop: p, oldValue: aVal, newValue: bVal });
        }
      } else if (p.search(/Color/) > -1) {
        // Without this the comparasion was saying that "hsla(0, 0%, 0%, 0.1)" was different than "hsla(0,0%,0%,0.100)"
        if (!this.hslaCompare(bVal, aVal)) {
          diffOut.push({ prop: p, oldValue: aVal, newValue: bVal });
        }
      } else if (aVal != bVal)
        diffOut.push({ prop: p, oldValue: aVal, newValue: bVal });
    });
    return diffOut;
  }

  areEquivalentStyles(
    styleStates1: StyleOptions[],
    styleStates2: StyleOptions[]
  ): boolean {
    if (styleStates1.length !== styleStates2.length) {
      return false;
    }

    // The outer every runs on the two input arguments
    const compare = styleStates1.every(
      (a: StyleOptions, i: number) =>
        this.compute_diff(a, styleStates2[i]).length === 0
    );
    // console.debug("areEquivalentStyles?", compare);
    return compare;
  }

  saveStyleState(): void {
    const cmdGroup = new CommandGroup();
    let subCommandCount = 0;
    if (this.previousBackstyleContrast !== Nodule.getBackStyleContrast()) {
      // console.log(
      //   this.previousBackstyleContrast,
      //   "ISSUED COMMAND: The back style constant changed to ",
      //   Nodule.getBackStyleContrast()
      // );
      const constrastCommand = new ChangeBackStyleContrastCommand(
        Nodule.getBackStyleContrast(),
        this.previousBackstyleContrast
      );
      // update the previous value
      this.previousBackstyleContrast = Nodule.getBackStyleContrast();
      cmdGroup.addCommand(constrastCommand);
      subCommandCount++;
    }
    if (this.oldSelections.length > 0) {
      // console.debug(
      //   "Number of previously selected object? ",
      //   this.previousSelectedNodules.length
      // );
      // console.debug(
      //   "Number of currently selected object? ",
      //   this.selectedNodules.length
      // );
      const prev = this.initialStatesMap.get(this.panel) ?? [];
      const curr = this.selectedNodules.map((n: Nodule) =>
        n.currentStyleState(this.panel)
      );
      if (!this.areEquivalentStyles(prev, curr)) {
        console.debug("ISSUE StyleNoduleCommand");
        console.debug("Previous style", prev);
        console.debug("Next style", curr);
        const styleCommand = new StyleNoduleCommand(
          this.selectedNodules,
          this.panel,
          curr,
          prev
        );
        cmdGroup.addCommand(styleCommand);
        subCommandCount++;
      }
      // else {
      //   console.debug("Eveything stayed unchanged");
      // }
      SEStore.setOldSelection([]);
    }
    // else {
    //   // console.debug("No dirty selection");
    // }
    if (subCommandCount > 0) cmdGroup.push();
  }
}
</script>

<style scoped>
</style>