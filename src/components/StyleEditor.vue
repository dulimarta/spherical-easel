
<script lang="ts">
import { SENodule } from "@/models/SENodule";
import Nodule from "@/plottables/Nodule";
import { AppState } from "@/types";
import { StyleEditPanels, StyleOptions } from "@/types/Styles";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { ScopedSlotChildren } from "vue/types/vnode";
import Style from "./Style.vue";
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

  commonStyleProperties: Array<string> = [];
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
        selectionCount: this.selectedNodules.length
      });
    return {} as ScopedSlotChildren;
    // throw new Error("Default scoped slot is undefined");
  }
  mounted(): void {
    console.debug(
      "From StyleEditor::mounted. Panel is",
      StyleEditPanels[this.panel]
    );
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
    // }

    // what(): void {
    const styleOptionsOfSelected = this.selectedNodules.map((n: Nodule) => {
      console.debug("Filtered object", n);
      return n.currentStyleState(this.panel);
    });
    this.activeStyleOptions = { ...styleOptionsOfSelected[0] };
    const commonProps = styleOptionsOfSelected.flatMap((opt: StyleOptions) =>
      Object.getOwnPropertyNames(opt).filter((s: string) => !s.startsWith("__"))
    );
    const uniqueProps = new Set(commonProps);
    this.commonStyleProperties.push(...uniqueProps);
    let propDynamicBackstyleCommonValue = false;
    if (this.selectedNodules.length > 1) {
      // When multiple plottables are selected, check for possible conflict
      const conflictingPropNames = this.commonStyleProperties.filter(
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
      if (conflictingPropNames.length > 0) {
        console.error("Disagreement in property value", conflictingPropNames);
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
    console.debug("Inside style editor active style options", newOptions);
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
    console.debug("Old props", oldProps);
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
}
</script>

<style scoped>
</style>