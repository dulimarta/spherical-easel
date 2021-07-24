
<script lang="ts">
import { SENodule } from "@/models/SENodule";
import Nodule from "@/plottables/Nodule";
import { AppState } from "@/types";
import { StyleEditPanels, StyleOptions } from "@/types/Styles";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { ScopedSlotChildren } from "vue/types/vnode";
import Style from "./Style.vue";
import { namespace } from "vuex-class";
const SE = namespace("se");

@Component
export default class extends Vue {
  @Prop({ required: true }) readonly panel!: StyleEditPanels;
  @Prop({ required: true }) readonly styleData!: StyleOptions | null;
  @Prop({ required: true }) noduleFilterFunction!: (n: SENodule) => boolean;
  @Prop({ required: true }) noduleMapFunction!: (n: SENodule) => Nodule;

  @SE.State((s: AppState) => s.selectedSENodules)
  readonly allSelectedSENodules!: SENodule[];

  commonStyleProperties: Array<string> = [];
  selectedSENodules: Array<SENodule> = [];
  selectedNodules: Array<Nodule> = [];
  dataAgreement = true;

  render(): ScopedSlotChildren {
    if (this.$scopedSlots.default)
      return this.$scopedSlots.default({
        agree: this.dataAgreement
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

  // @Watch("styleData", { deep: true })
  // changed(z: StyleOptions): void {
  //   console.debug("Inside style editor", z);
  // }
}
</script>

<style scoped>
</style>