<template>
  <v-tooltip bottom
    :open-delay="toolTipOpenDelay"
    :close-delay="toolTipCloseDelay"
    max-width="400px">
    <template v-slot:activator="{on}">
      <v-btn v-on="on"
        @click="$listeners.click"
        :disabled="disabled"
        :color="color"
        class="text-subtitle-2"
        text
        outlined
        ripple
        small>{{$t(i18nLabel)}}
      </v-btn>
    </template>
    <span v-t="i18nTooltip"
      :style="labelStyle"></span>
  </v-tooltip>
</template>

<script lang="ts">
import Vue from "vue";
import SETTINGS from "@/global-settings";
import { Prop, Component } from "vue-property-decorator";

@Component({})
export default class HintButton extends Vue {
  readonly toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  readonly toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

  @Prop() readonly i18nTooltip!: string;
  @Prop() readonly i18nLabel!: string;
  @Prop() readonly disabled?: boolean;
  @Prop() readonly color?: string;
  @Prop() readonly longLabel?: boolean;

  get labelStyle(): any {
    return this.longLabel
      ? {
          maxWidth: "250px",
          wordWrap: "break-word",
          display: "inline-block",
          height: "1em",
          whiteSpace: "pre-line"
        }
      : {};
  }
  //   mounted(): void {
  //     for (const z in this.$listeners) {
  //       console.debug("Listener ", z);
  //     }
  //   }
}
</script>

<style>
</style>