<template>
  <v-tooltip
    bottom
    :open-delay="toolTipOpenDelay"
    :close-delay="toolTipCloseDelay"
    max-width="400px">
    <template v-slot:activator="{ on }">
      <!-- Use v-bind="$attrs" to pass thru incoming attributes to v-btn.
      Be sure NOT to place it as the last attr -->
      <v-btn
        v-on="on"
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
        <v-icon v-else-if="type === 'colorInput'">mdi-dots-horizontal </v-icon>
      </v-btn>
    </template>
    <span v-t="i18nTooltip" :style="labelStyle"></span>
  </v-tooltip>
</template>

<script lang="ts" setup>
import Vue, { computed } from "vue";
import SETTINGS from "@/global-settings";
const toolTipOpenDelay = SETTINGS.toolTip.openDelay;
const toolTipCloseDelay = SETTINGS.toolTip.closeDelay;
const props = defineProps<{
  i18nTooltip: string;
  i18nLabel: string;
  type?: string; //undo or defaults or show color inputs
  longLabel?: boolean;
}>();

const labelStyle = computed((): any => {
  return props.longLabel
    ? {
        maxWidth: "250px",
        wordWrap: "break-word",
        display: "inline-block",
        height: "1em",
        whiteSpace: "pre-line"
      }
    : {};
});

//   mounted(): void {
//     for (const z in this.$listeners) {
//       console.debug("Listener ", z);
//     }
//   }
</script>

<style></style>
