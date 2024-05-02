<template>
  <!-- Use v-bind="$attrs" to pass thru incoming attributes to v-btn.
      Be sure NOT to place it as the last attr -->
  <v-btn v-bind="$attrs" ripple icon size="x-small">
    <v-icon><slot name="icon"></slot></v-icon>
    <slot name="default"></slot>
    <v-tooltip location="bottom" activator="parent">
      <span>
        {{ tooltip }}
      </span>
    </v-tooltip>
  </v-btn>
</template>

<script lang="ts" setup>
import { computed, useAttrs } from "vue";
import { useI18n } from "vue-i18n";
const { attr } = useAttrs();
const props = defineProps<{
  tooltip: string;
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
