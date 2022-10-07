<template>
  <v-tooltip
    bottom
    :open-delay="toolTipOpenDelay"
    :close-delay="toolTipCloseDelay"
  >
    <template v-slot:activator="{ on }">
      <v-btn
        :disabled="disableBtn"
        :color="btnColor"
        icon
        tile
        @click="$listeners.click"
        v-on="on"
      >
        <v-icon :disabled="disableBtn" :color="iconColor">{{ icon }}</v-icon>
      </v-btn>
    </template>
    <span>{{ $t(labelMsg) }}</span>
  </v-tooltip>
</template>

<script lang="ts">
import Vue from "vue";
import { Prop, Component } from "vue-property-decorator";
import SETTINGS from "@/global-settings";

@Component({})
export default class ShortcutIcon extends Vue {
  @Prop() readonly labelMsg!: string;
  @Prop() readonly icon!: string;
  @Prop() readonly iconColor!: string;
  @Prop() readonly btnColor!: string;
  @Prop() readonly disableBtn!: boolean;

  toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  toolTipCloseDelay = SETTINGS.toolTip.closeDelay;
}

</script>

<style></style>
