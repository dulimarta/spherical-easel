<template>
  <!-- These the navigation arrows TODO: I would like these to be in the same row as the
    tabs-->
  <!-- This the not minimized left drawer containing two tabs -->
  <!-- <CurrentToolSelection/> -->
  <transition name="slide-out" mode="out-in">
    <div v-if="!minified" key="full">
      <v-container>
        <v-row align="center">
          <v-btn icon size="x-small">
            <v-icon @click="toggleMinify">mdi-arrow-left</v-icon>
          </v-btn>
          <CurrentToolSelection />
        </v-row>
      </v-container>
      <v-tabs v-model="activeLeftDrawerTab" centered grow @change="switchTab">
        <v-tooltip location="bottom" :open-delay="toolTipOpenDelay">
          <template v-slot:activator="{ props }">
            <v-tab class="mt-3" v-bind="props">
              <v-icon>$toolsTab</v-icon>
            </v-tab>
          </template>
          <span>{{ $t("main.ToolsTabToolTip") }}</span>
        </v-tooltip>

        <v-tooltip location="bottom" :open-delay="toolTipOpenDelay">
          <template v-slot:activator="{ props }">
            <v-tab class="mt-3" v-bind="props">
              <v-icon>$objectsTab</v-icon>
            </v-tab>
          </template>
          <span>{{ $t("main.ObjectsTabToolTip") }}</span>
        </v-tooltip>
        <v-tooltip location="bottom" :open-delay="toolTipOpenDelay">
          <template v-slot:activator="{ props }">
            <v-tab class="mt-3" v-bind="props">
              <v-icon>$constructionsTab</v-icon>
            </v-tab>
          </template>
          <span>{{ $t("main.ConstructionsTabToolTip") }}</span>
        </v-tooltip>
      </v-tabs>
      <v-window v-model="activeLeftDrawerTab">
        <v-window-item>
          <ToolGroups />
        </v-window-item>
        <v-window-item>
          <ObjectTree id="objtree"> </ObjectTree>
        </v-window-item>
        <v-window-item>
          <ConstructionLoader id="loader"></ConstructionLoader>
        </v-window-item>
      </v-window>
    </div>

    <div
      v-else
      class="mini-icons"
      key="partial">
      <v-btn icon size="x-small">
        <v-icon @click="toggleMinify">mdi-arrow-right</v-icon>
      </v-btn>
      <div class="mini-icons px-3">
      <v-icon>$toolsTab</v-icon>
      <v-icon>$objectsTab</v-icon>
      <v-icon>$constructionsTab</v-icon>
      </div>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import Vue, { onBeforeMount, onBeforeUnmount, onMounted, ref } from "vue";
import ToolGroups from "@/components/ToolGroups.vue";
import EventBus from "@/eventHandlers/EventBus";
import ObjectTree from "./ObjectTree.vue";
import ConstructionLoader from "./ConstructionLoader.vue";
import CurrentToolSelection from "@/components/CurrentToolSelection.vue";

import SETTINGS from "@/global-settings";
import { useSEStore } from "@/stores/se";
import { storeToRefs } from "pinia";
import { useLayout } from "vuetify";
import { useDisplay } from "vuetify";
const seStore = useSEStore();
const { actionMode } = storeToRefs(seStore);
// const props = defineProps<{ minified: boolean }>();

// ('layers')')

const minified = ref(false);
const emit = defineEmits(['minifyToggled'])
/* Copy global setting to local variable */
const toolTipOpenDelay = SETTINGS.toolTip.openDelay;
const toolTipCloseDelay = SETTINGS.toolTip.closeDelay;
const activeLeftDrawerTab = ref(0);

onBeforeMount((): void => {
  EventBus.listen("left-panel-set-active-tab", setActiveTab);
});

onMounted((): void => {
  const { mainRect } = useLayout();
  const { height, width, name } = useDisplay();
  console.debug("Layout details", mainRect.value);
  console.debug("Display details", height.value, width.value, name.value);
  // this.scene = this.layers[LAYER.midground];
});

function switchTab(): void {
  // console.log("this.activeLeftDrawerTab", this.activeLeftDrawerTab);
  if (activeLeftDrawerTab.value === 1) {
    // 1 is the index of the object tree tab
    // change to the move mode, but only if we are not using the measured circle tool
    if (
      actionMode.value !== "measuredCircle" &&
      actionMode.value !== "translation" &&
      actionMode.value !== "rotation"
    ) {
      seStore.setActionMode("move");
    }
  }
}
function setActiveTab(e: { tabNumber: number }): void {
  activeLeftDrawerTab.value = e.tabNumber;
}

function toggleMinify() {
  minified.value = !minified.value
  emit("minifyToggled", minified.value)
}
onBeforeUnmount((): void => {
  EventBus.unlisten("left-panel-set-active-tab");
});
</script>

<style lang="scss" scoped>
.mini-icons {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  justify-content: space-evenly; /* Center it vertically */
}

#objtree,
#toolGroups,
#loader {
  /* It is important to set the height otherwise the "overflow' option in <ObjectTree> won't work correctly */
  height: calc(100vh - 200px);
  max-width: 360px;
  overflow: auto;
}
.slide-out-enter-active,
.slide-out-leave-active {
  transition-property: all;
  transition-duration: 150ms;
  transition-timing-function: ease;
}

.slide-out-enter,
.slide-out-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}
</style>
