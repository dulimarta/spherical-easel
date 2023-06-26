<template>
  <!-- Use v-bind="$attrs" to pass thru incoming attributes to v-btn.
      Be sure NOT to place it as the last attr -->
  <v-btn
    v-bind="$attrs"
    class="text-subtitle-2"
    ripple
    right
    bottom
    fab
   size="x-small">
    <v-icon v-if="type === 'undo'">mdi-undo</v-icon>
    <v-icon v-else-if="type === 'default'">mdi-backup-restore</v-icon>
    <v-icon v-else-if="type === 'colorInput'">mdi-dots-horizontal </v-icon>
    <v-tooltip
      bottom
      activator="parent">
      {{ t(i18nTooltip) }}
    </v-tooltip>
  </v-btn>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import {useI18n} from "vue-i18n"
import SETTINGS from "@/global-settings";
const {t} = useI18n()
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
