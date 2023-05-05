<template>
  <!-- Displays the current tool in the left panel by the collapsible arorw -->
  <span v-if="activeToolName">
    <v-container>
      <v-row align="center">
        <!-- Vuetify custom icons require a '$' prefix -->
        <v-icon class="mx-3" :icon="'$' + actionMode"></v-icon>
        <!-- Checks if ApplyTransformation is selected and changes the display accordingly. -->
        <span
          class="text-body-1 ml-1"
          v-if="activeToolName != 'ApplyTransformationDisplayedName'">
          {{ $t(`buttons.${activeToolName}`, {}).toString() }}
        </span>
        <template v-else>
          <h3>
            {{ $t(`buttons.${activeToolName}`, {}).toString() }}
            <br />
            <h4 :key="Math.random()">
              {{ t("objects.selectTransformation") }}
            </h4>
          </h3>
        </template>
      </v-row>
    </v-container>
  </span>
  <span class="text-body-2" v-else>
    {{ $t(`buttons.NoToolSelected`, {}).toString() }}
  </span>
</template>

<script lang="ts" setup>
import { ref, onBeforeMount, onBeforeUnmount, onMounted } from "vue";
import { useSEStore } from "@/stores/se";
import { useI18n } from "vue-i18n";
// import EventBus from "@/eventHandlers/EventBus";
import { storeToRefs } from "pinia";

const seStore = useSEStore();
const { activeToolName, actionMode } = storeToRefs(seStore);
const { t } = useI18n();
const applyTransformationText = ref("");
// applyTransformationText.value = i18n
//   .t(`objects.selectTransformation`)
//   .toString();

//The next 3 functions are for the text for the applied transformation.
onBeforeMount((): void => {
  console.debug("CurrentToolSelection: setting up event bus listener");
  // EventBus.listen("set-apply-transformation-footer-text", additionalFooterText);
});

// function additionalFooterText(e: { text: string }): void {
//   console.debug("apply transform", e.text);
//   applyTransformationText.value = e.text;
// }
</script>

<style></style>
