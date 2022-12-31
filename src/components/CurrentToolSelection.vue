<template>
  <div>
    <!-- Displays the current tool in the left panel by the collapsible arorw -->
    <div v-if="!toolboxMinified">
      <div class="pa-4" v-if="activeToolName">
        <v-row>
          <v-icon class="mr-2" :key="Math.random()"
            >$vuetify.icons.values.{{ actionMode }}
          </v-icon>
          <!-- Checks if ApplyTransformation is selected and changes the display accordingly. -->
          <h3 v-if="activeToolName != 'ApplyTransformationDisplayedName'">
            {{ $t(`buttons.${activeToolName}`, {}).toString() }}
          </h3>
          <template v-else>
            <h3>
              {{ $t(`buttons.${activeToolName}`, {}).toString() }}
              <br />
              <h4 class="ap" :key="Math.random()">
                {{ applyTransformationText }}
              </h4>
            </h3>
          </template>
        </v-row>
      </div>
      <div v-else>
        <h2>{{ $t(`buttons.NoToolSelected`, {}).toString() }}</h2>
      </div>
    </div>
    <!-- Displays the icon and arrow if toolbox is minified -->
    <div v-else>
      <div class="pa-4" v-if="activeToolName">
        <v-row>
          <v-icon class="mr-3" :key="Math.random()"
            >$vuetify.icons.values.{{ actionMode }}
          </v-icon>
        </v-row>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onBeforeMount, onBeforeUnmount, onMounted } from "vue";
import { useSEStore } from "@/stores/se";
import i18n from "@/i18n";
import EventBus from "@/eventHandlers/EventBus";
import { storeToRefs } from "pinia";

const props = defineProps<{
  toolboxMinified?: boolean;
}>();
const seStore = useSEStore();
const { activeToolName, actionMode } = storeToRefs(seStore);
const applyTransformationText = ref("")
applyTransformationText.value = i18n.t(`objects.selectTransformation`).toString();

//The next 3 functions are for the text for the applied transformation.
onBeforeMount((): void => {
  console.debug("CurrentToolSelection: setting up event bus listener")
  EventBus.listen("set-apply-transformation-footer-text", additionalFooterText);
});

function additionalFooterText(e: { text: string }): void {
  console.debug("apply transform", e.text);
  applyTransformationText.value = e.text;
}

onBeforeUnmount((): void => {
  // EventBus.unlisten("set-apply-transformation-footer-text");
});
</script>

<style></style>
