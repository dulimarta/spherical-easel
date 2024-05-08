<template>
  <div id="conflict-props" v-if="conflictingProperties.size > 0"
    class="text-caption font-italic">
    <span>Conflicting properties: {{ z }}</span>
    <v-switch
      style="align-self: flex-end"
      v-model="forceAgreement"
      color="warning">
      <template #label>
        <span class="text-caption">
        {{ forceAgreement ?
          t('forceAgreement'): t('dontForceAgreement') }}
      </span>
      </template>
    </v-switch>
  </div>
</template>
<style>
#conflict-props {
  margin: 0 0.5em;
  display: flex;
  flex-direction: column;
}
</style>
<script lang="ts" setup>
import { useStylingStore } from "@/stores/styling";
import { storeToRefs } from "pinia";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
const styleStore = useStylingStore();
const { conflictingProperties, forceAgreement } = storeToRefs(styleStore);
const { t } = useI18n();
// const applyToAll = ref(forceAgreement.value;
const z = computed(() =>
  Array.from(conflictingProperties.value.values())
    .map(s => t(s))
    .join(",")
);
</script>
<i18n lang="json" locale="en">
{
  "labelDisplayText": "Label Text",
  "forceAgreement": "Apply edit to all selections",
  "dontForceAgreement": "Do not apply edit to all selections"
}
</i18n>
