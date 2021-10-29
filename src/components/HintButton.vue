<template>
  <v-tooltip bottom
    :open-delay="toolTipOpenDelay"
    :close-delay="toolTipCloseDelay"
    max-width="400px">
    <template v-slot:activator="{on}">
      <!-- Use v-bind="$attrs" to pass thru incoming attributes to v-btn.
      Be sure NOT to place it as the last attr -->
      <v-btn v-on="on"
        v-bind="$attrs"
        @click="$listeners.click"
        class="text-subtitle-2"
        ripple
        right
        bottom
        fab
        x-small>
        <v-icon v-if="type === 'undo'">mdi-undo</v-icon>
        <v-icon v-else-if="type === 'default'">mdi-backup-restore</v-icon>
        <v-icon v-else-if="type === 'colorInput'">mdi-dots-horizontal
        </v-icon>
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

//{{$t(i18nLabel)}}

@Component({})
export default class HintButton extends Vue {
  readonly toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  readonly toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

  @Prop() readonly i18nTooltip!: string;
  @Prop() readonly i18nLabel!: string;
  @Prop() readonly type?: string; //undo or defaults or show color inputs
  @Prop() readonly longLabel?: boolean;

  private fabOpen = false;

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