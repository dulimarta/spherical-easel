<template>
  <FadeInCard>
    <slot></slot>
    <v-container class="pa-0 ma-0">
      <v-row no-gutters
        justify="end">
        <v-col cols="2"
          class="ma-0 px-0 pb-2">
          <HintButton @click="doClear"
            type="undo"
            :disabled="resetDisabled"
            i18n-label="style.clearChanges"
            i18n-tooltip="style.clearChangesToolTip">
          </HintButton>
        </v-col>
        <v-col cols="2"
          class="ma-0 px-0 pb-2">
          <HintButton @click="doReset"
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

@Component({ components: { FadeInCard, HintButton } })
export default class InputGroup extends Vue {
  @Prop({ required: true }) readonly inputSelector!: string;

  resetDisabled = true;

  mounted(): void {
    EventBus.listen("style-option-change", (ev: { prop: string }): void => {
      const selectors = this.inputSelector.split(",");
      console.debug(
        "Requested property is",
        ev.prop,
        "my selector is",
        selectors
      );
      const pos = selectors.findIndex((s: string) => {
        console.debug(`Checking match ${s} vs. ${ev.prop}`);
        return s === ev.prop;
      });
      console.debug("Matching tag at", pos);
      if (pos >= 0) this.resetDisabled = false;
    });
  }

  doClear(): void {
    this.$emit("input-clear");
    this.resetDisabled = true;
  }

  doReset(): void {
    this.$emit("input-to-default");
  }
}
</script>

<style scoped>
</style>