<template>
  <div>
    <v-text-field v-model="styleData"
      :label="styleName"
      :counter="maxLength"
      :disabled="!styleDataAgreement || totalyDisableSelector"
      filled
      @change="onDataChanged">
    </v-text-field>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import SETTINGS from "@/global-settings";
import { Watch, Prop, PropSync } from "vue-property-decorator";
import { StyleEditPanels } from "@/types/Styles";
import { SEStore } from "@/store";
@Component({})
export default class TextInputSelector extends Vue {
  @Prop() readonly mode!: StyleEditPanels;
  // @Prop() readonly titleKey!: string;
  @Prop({ required: true }) readonly styleName!: string;
  // @PropSync("data") styleData?: string | undefined;
  @Prop({ required: true }) readonly maxLength!: number;
  @Prop() readonly styleDataAgreement!: boolean;
  @Prop() readonly totalyDisableSelector!: boolean;
  @Prop() readonly setDisplay!: string;
  // @Prop() readonly triggerClearChanges!: boolean;
  // @Prop() readonly triggerRestoreDefaults!: boolean;

  // @State((s: AppState) => s.selections)
  // readonly selections!: SENodule[];

  private styleData = "";

  // private disableUndoButton = true;

  readonly toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  readonly toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

  onDataChanged(newData: string): void {
    SEStore.changeStyle({
      selected: this.$store.getters.selectedSENodules(),
      payload: {
        panel: this.mode,
        [this.styleName]: newData
      }
    });
  }

  @Watch("setDisplay")
  setStyleDisplay(val: string): void {
    console.log("styleData before", this.styleData);
    this.styleData = val;
    console.log("styleData after", this.styleData);
  }
}
</script>

<style lang="scss" scoped>
@import "@/scss/variables.scss";

.select-an-object-text {
  color: rgb(255, 82, 82);
}
</style>