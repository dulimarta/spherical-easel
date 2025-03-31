<template>
    <v-text-field
      data-testid="searchInput"
      style="max-height: 3em"
      persistent-hint
      type="text"
      :value="modelValue"
      @input="handleInput"
      variant="outlined"
      density="compact"
      :label="t('searchLabel')"
      :hint="searchResult"
    />
  </template>

  <script lang="ts" setup>
  import { useI18n } from "vue-i18n";
  import { defineProps, defineEmits } from "vue";

  const { t } = useI18n();

  // Define props
  const props = defineProps({
    modelValue: String, // The value passed from the parent component
    searchResult: String
  });

  // Define emits for `update:modelValue` and custom `search` event
  const emit = defineEmits(["update:modelValue", "search"]);

  // Handle input event
  const handleInput = (event: string) => {
    emit('update:modelValue', event); // Update model value
    emit('search', event);            // Emit custom search event
  };
  </script>

  <style scoped>
  /* Add any scoped styles for the search bar */
  </style>
