<template>
  <v-tooltip
    bottom
    :open-delay="toolTipOpenDelay"
    :close-delay="toolTipCloseDelay"
  >
    <template v-slot:activator="{ on }">
      <v-btn :disabled="disableBtn" color="primary" icon tile @click=$listeners.click v-on="on">
        <v-icon :disabled="disableBtn" color="blue">{{ icon }}</v-icon>
      </v-btn>
    </template>
    <span>{{ $t(labelMsg) }}</span>
  </v-tooltip>
</template>

<script lang="ts">
import Vue from "vue";
import { Prop } from "vue-property-decorator";
import  SETTINGS  from "@/global-settings";
export default class ShortcutIcon extends Vue {
  @Prop() readonly labelMsg!: string;
  @Prop() readonly icon!: object;
  @Prop() readonly iconColor!: string;
  @Prop() readonly btnColor!: string;
  @Prop() readonly disableBtn!: boolean;

  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;
}
</script>

<style></style>
