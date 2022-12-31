<template>
  <v-tooltip
    bottom
    :open-delay="toolTipOpenDelay"
    :close-delay="toolTipCloseDelay">
    <template v-slot:activator="{ on }">
      <v-btn
        :disabled="disableBtn"
        :color="btnColor"
        :value="button"
        icon
        tile
        v-on:click="$listeners.click"
        @click="switchButton(button)"
        v-on="on">
        <v-icon :disabled="disableBtn" :color="iconColor">{{ icon }}</v-icon>
      </v-btn>
    </template>
    <span>{{ $t(labelMsg) }}</span>
  </v-tooltip>
</template>

<script lang="ts" setup>
import SETTINGS from "@/global-settings";
import { useSEStore } from "@/stores/se";
import { ToolButtonType } from "@/types";

const seStore = useSEStore();

const props = defineProps<{
  labelMsg: string;
  icon: string;
  iconColor?: string;
  btnColor?: string;
  disableBtn: boolean;
  button?: ToolButtonType;
}>();

const toolTipOpenDelay = SETTINGS.toolTip.openDelay;
const toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

function switchButton(button?: ToolButtonType): void {
  //Set the button selected so it can be tracked
  if (button) {
    seStore.setButton(button);
  }
}
</script>
