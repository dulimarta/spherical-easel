
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
const SE = namespace("se");

@Component
export default class extends Vue {
  @Prop({ required: true }) readonly panel!: StyleEditPanels;
  // @Prop({ required: true }) readonly styleData!: StyleOptions | null;
  @Prop({ required: true }) noduleFilterFunction!: (n: SENodule) => boolean;
  @Prop({ required: true }) noduleMapFunction!: (n: SENodule) => Nodule;

  @SE.State((s: AppState) => s.selectedSENodules)
  readonly allSelectedSENodules!: SENodule[];

  @SE.State((s: AppState) => s.initialStyleStatesMap)
  readonly initialStatesMap!: Map<StyleEditPanels, StyleOptions[]>;

  @SE.State((s: AppState) => s.defaultStyleStatesMap)
  readonly defaultStatesMap!: Map<StyleEditPanels, StyleOptions[]>;

  commonStyleProperties: Array<string> = [];
  conflictingPropNames: Array<string> = [];
  selectedSENodules: Array<SENodule> = [];
  selectedNodules: Array<Nodule> = [];
  activeStyleOptions: StyleOptions = {};
  previousStyleOption: StyleOptions = {};
  dataAgreement = true;

  render(): ScopedSlotChildren {
    if (this.$scopedSlots.default)
      return this.$scopedSlots.default({
        agreement: this.dataAgreement,
        styleOptions: this.activeStyleOptions,
        selectionCount: this.selectedNodules.length,
        forceDataAgreement: this.forceDataAgreement
      });
    return {} as ScopedSlotChildren;
    // throw new Error("Default scoped slot is undefined");
  }
  created(): void {
    // const self = this;
    EventBus.listen("style-data-clear", this.undo.bind(this));
    EventBus.listen("style-data-to-default", this.restoreDefault.bind(this));
    EventBus.listen("save-style-state", () => {
      console.error("Missing event listener for save-style-state");
    });
  }
  mounted(): void {
    console.debug(
      "From StyleEditor::mounted. Panel is",
      StyleEditPanels[this.panel]
    );
  }
  beforeDestroy(): void {
    EventBus.unlisten("style-data-clear");
    EventBus.unlisten("style-data-to-default");
  }

  restoreTo(propNames: string[], styleData: StyleOptions[]): void {
    // console.debug("Style data to apply", styleData);
    this.selectedNodules.forEach((n: Nodule, k: number) => {
      const updatePayload: StyleOptions = {};
      propNames.forEach((p: string) => {
        (updatePayload as any)[p] = (styleData[k] as any)[p];
      });
      // console.debug("Updating style of", n, "using", updatePayload);
      n.updateStyle(this.panel, updatePayload);
    });
  }
  undo(ev: { selector: string }): void {
    // console.debug(
    //   StyleEditPanels[this.panel],
    //   `: restore style state ${ev.selector} to start of edit session`
    // );
    const styleData = this.initialStatesMap.get(this.panel);
    if (styleData) {
      const listOfProps = ev.selector.split(",");
      this.restoreTo(listOfProps, styleData);
    }
  }
  restoreDefault(ev: { selector: string }): void {
    // console.debug(
    //   StyleEditPanels[this.panel],
    //   `: restore style state ${ev.selector} to default settings`
    // );
    const styleData = this.defaultStatesMap.get(this.panel);
    if (styleData) {
      const listOfProps = ev.selector.split(",");
      this.restoreTo(listOfProps, styleData);
    }
  }

  @Watch("panel")
  onPanelChanged(): void {
    console.debug("Panel changed?");
  }

  @Watch("allSelectedSENodules", { immediate: true })
  onSelectionChanged(newSelection: SENodule[]): void {
    console.debug("StyleEditor: object selection changed", newSelection.length);
    this.commonStyleProperties.splice(0);
    this.dataAgreement = true;
    this.activeStyleOptions = {};
    if (newSelection.length === 0) {
      return;
    }

    console.debug("***********************");
    this.selectedSENodules = newSelection.filter(this.noduleFilterFunction);
    console.debug("Selected SENodules", this.selectedNodules);
    this.selectedNodules = this.selectedSENodules.map(this.noduleMapFunction);
    console.debug("Selected plottables", this.selectedNodules);
    // Save current state so we can reset to this state if needed to

    const styleOptionsOfSelected = this.selectedNodules.map((n: Nodule) => {
      console.debug("Filtered object", n);
      return n.currentStyleState(this.panel);
    });
    SEStore.recordStyleStateByPanel({
      panel: this.panel,
      selected: this.selectedNodules
    });
    this.activeStyleOptions = { ...styleOptionsOfSelected[0] };
    const commonProps = styleOptionsOfSelected.flatMap((opt: StyleOptions) =>
      Object.getOwnPropertyNames(opt).filter((s: string) => !s.startsWith("__"))
    );
    const uniqueProps = new Set(commonProps);
    this.commonStyleProperties.push(...uniqueProps);

    let propDynamicBackstyleCommonValue: boolean;
    if (this.selectedNodules.length > 1) {
      propDynamicBackstyleCommonValue = false;
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
            propDynamicBackstyleCommonValue = refValue;
          const agreement = this.selectedNodules.every((obj: Nodule) => {
            const thisStyleOption = obj.currentStyleState(this.panel);
            const thisValue = (thisStyleOption as any)[propName];
            if (Array.isArray(thisValue) || Array.isArray(refValue)) {
              // TODO: Compare dash array
              return false;
            } else return thisValue === refValue;
          });
          return !agreement;
        }
      );
      if (this.conflictingPropNames.length > 0) {
        console.error(
          "Disagreement in property value",
          this.conflictingPropNames
        );
        this.dataAgreement = false;
      }
    } else {
      // If we reach this point we have EXACTLY ONE object selected
      const opt = this.selectedNodules[0].currentStyleState(this.panel);
      propDynamicBackstyleCommonValue =
        (opt as any)["dynamicBackStyle"] ?? false;
      console.debug("Only one object is selected");
    }
  }

  @Watch("activeStyleOptions", { deep: true, immediate: true })
  onStyleOptionsChanged(z: StyleOptions): void {
    const newOptions = { ...z };
    // console.debug("Inside style editor active style options", newOptions);
    const oldProps = new Set(
      Object.getOwnPropertyNames(this.previousStyleOption).filter(
        (s: string) => !s.startsWith("__")
      )
    );
    const newProps = new Set(
      Object.getOwnPropertyNames(newOptions).filter(
        (s: string) => !s.startsWith("__")
      )
    );
    // console.debug("Old props", oldProps);
    console.debug("New props", newProps);
    const updatedProps = [...newProps].filter((p: string) => oldProps.has(p));
    const updatePayload: StyleOptions = { ...newOptions };

    console.debug("updated props", updatedProps);
    // Build the update payload by including only changed values
    [...updatedProps].forEach((p: string) => {
      const a = (this.previousStyleOption as any)[p];
      const b = (newOptions as any)[p];
      // Exclude the property from payload if it did not change
      if (a === b) delete (updatePayload as any)[p];
      else {
        console.debug(`Property ${p} changed from ${a} to ${b}`);
        // this.$emit("style-option-change", { prop: p });
        EventBus.fire("style-option-change", { prop: p });
      }
    });

    /* If multiple objects are selected do not update the label text */
    if (this.selectedNodules.length > 1) delete updatePayload.labelDisplayText;
    // console.debug(
    //   "About to update selected objects using payload",
    //   updatePayload
    // );
    if (updatedProps.length > 1) {
      this.selectedNodules.forEach((n: Nodule) => {
        // console.debug("Updating style of", n);
        n.updateStyle(this.panel, updatePayload);
      });
    }
    this.previousStyleOption = { ...newOptions };
  }

  forceDataAgreement(): void {
    console.debug("User overrides data disagreement");
  }
  areEquivalentStyleOptions(
    opt1: StyleOptions | undefined,
    opt2: StyleOptions | undefined
  ): boolean {
    function arrayEquivalentArray(
      arr1: Array<string | number>,
      arr2: Array<string | number>
    ): boolean {
      return false;
    }

    const aProps = opt1
      ? Object.getOwnPropertyNames(opt1).filter(
          (s: string) => !s.startsWith("__")
        )
      : []; // Set to an empty array of the arg is undefined or null
    const bProps = opt2
      ? Object.getOwnPropertyNames(opt2).filter(
          (s: string) => !s.startsWith("__")
        )
      : []; // Set to an empty array of the arg is undefined or null
    if (aProps.length !== bProps.length)
      throw new Error(
        "Attempted to compare two different length StyleOptions in areEquivalentStyles"
      );

    // Verify equivalence of all the style properties
    return [...aProps].every((p: string) => {
      const aVal = (aProps as any)[p];
      const bVal = (bProps as any)[p];
      if (typeof aVal !== typeof bVal) return false;
      if (typeof aVal == "number") return Math.abs(aVal - bVal) < 1e-8;
      else if (Array.isArray(aVal) && Array.isArray(bVal))
        return arrayEquivalentArray(aVal, bVal);
      else if (typeof aVal === "object")
        throw new Error("Object comparison is not currently supported");
      else return aVal === bVal;
    });
  }

  areEquivalentStyles(
    styleStates1: StyleOptions[],
    styleStates2: StyleOptions[]
  ): boolean {
    if (styleStates1.length !== styleStates2.length) {
      return false;
    }

    // The outer every runs on the two input arguments
    const compare = styleStates1.every((a: StyleOptions, i: number) =>
      this.areEquivalentStyleOptions(a, styleStates2[i])
    );
    console.debug("areEquivalentStyles?", compare);
    return compare;
  }
}
</script>

<style scoped>
</style>