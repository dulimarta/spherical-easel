<template>
  <FadeInCard :key="componentKey">
    <slot></slot>
    <v-container class="pa-0 ma-0">
      <v-row no-gutters
        justify="end">
        <v-col cols="2"
          class="ma-0 px-0 pb-2">
          <HintButton @click="doClear"
            type="undo"
            :disabled="resetDisabled || numSelected>1"
            i18n-label="style.clearChanges"
            i18n-tooltip="style.clearChangesToolTip">
          </HintButton>
        </v-col>
        <v-col cols="2"
          class="ma-0 px-0 pb-2">
          <HintButton @click="doReset"
            :disabled="numSelected>1"
            type="default"
            i18n-label="style.restoreDefaults"
            i18n-tooltip="style.restoreDefaultsToolTip">
          </HintButton>
        </v-col>
      </v-row>
    </v-container>
  </FadeInCard>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import FadeInCard from "@/components/FadeInCard.vue";
import HintButton from "@/components/HintButton.vue";
import EventBus from "@/eventHandlers/EventBus";
import { StyleEditPanels } from "@/types/Styles";

@Component({ components: { FadeInCard, HintButton } })
export default class InputGroup extends Vue {
  @Prop({ required: true }) readonly inputSelector!: string;
  @Prop() readonly numSelected!: number;
  @Prop() readonly panel!: StyleEditPanels;

  private resetDisabled = true;
  // add this so that when you click the undo button or the clear button the fadeInCard updates and the selections made by style-data-clear and style-data-to-default are made in the card
  private componentKey = 0;

  mounted(): void {
    EventBus.listen("style-option-change", (ev: { prop: string }): void => {
      const selectors = this.inputSelector.split(",");
      // console.debug(
      //   "Requested property is",
      //   ev.prop,
      //   "my selector is",
      //   selectors
      // );
      const pos = selectors.findIndex((s: string) => {
        // console.debug(`Checking match ${s} vs. ${ev.prop}`);
        return s === ev.prop;
      });
      // console.debug("Matching tag at", pos);
      if (pos >= 0) this.resetDisabled = false;
    });
    EventBus.listen(
      "update-input-group-with-selector",
      (ev: { inputSelector: string }): void => {
        console.log("key", this.inputSelector, this.componentKey);
        if (this.inputSelector === ev.inputSelector) {
          this.componentKey += 1;
        }
      }
    );
  }

  doClear(): void {
    EventBus.fire("style-data-clear", {
      selector: this.inputSelector,
      panel: this.panel
    });
    this.resetDisabled = false;
    this.componentKey += 1; //forces update of the contents of the slot
  }

  doReset(): void {
    // console.debug("Emitting event style-data-to-default");
    EventBus.fire("style-data-to-default", {
      selector: this.inputSelector,
      panel: this.panel
    });
    this.componentKey += 1; //forces update of the contents of the slot
  }
  beforeDestory(): void {
    EventBus.unlisten("update-input-group");
    EventBus.unlisten("style-option-change");
  }
}
</script>

<style scoped>
</style>