<template>
  <v-btn
    v-bind="$attrs"
    :color="btnColor ?? undefined"
    :value="button"
    icon
    tile
    @click="switchButton(button)">
    <v-icon v-bind="$attrs" :color="iconColor">{{ icon }}</v-icon>
    <v-tooltip
      activator="parent"
      bottom
      :open-delay="toolTipOpenDelay"
      :close-delay="toolTipCloseDelay">
      {{ $t(labelMsg) }}
    </v-tooltip>
  </v-btn>
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
  btnColor?: string | null;
  // disableBtn: boolean;
  button?: ToolButtonType | null;
}>();

const toolTipOpenDelay = SETTINGS.toolTip.openDelay;
const toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

function switchButton(button?: ToolButtonType | null): void {
  //Set the button selected so it can be tracked
  if (button) {
    seStore.setButton(button);
  }
}
</script>
