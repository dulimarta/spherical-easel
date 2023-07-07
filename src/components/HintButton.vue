<template>
  <!-- Use v-bind="$attrs" to pass thru incoming attributes to v-btn.
      Be sure NOT to place it as the last attr -->
  <v-btn
    v-bind="attr"
    class="text-subtitle-2"
    ripple
    icon
   size="x-small">
    <!--v-icon v-if="type === 'undo'">mdi-undo</!--v-icon>
    <v-icon v-else-if="type === 'default'">mdi-backup-restore</v-icon>
    <v-icon-- v-else-if="type === 'colorInput'">mdi-dots-horizontal </v-icon-->
    <v-icon><slot name="icon"/></v-icon>
    <v-tooltip
      location="bottom"
      activator="parent">
      <span>
      {{tooltip}}
      </span>
    </v-tooltip>
  </v-btn>
</template>

<script lang="ts" setup>
import { computed, useAttrs } from "vue";
import {useI18n} from "vue-i18n"
const {attr} = useAttrs()
const props = defineProps<{
  tooltip: string
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
