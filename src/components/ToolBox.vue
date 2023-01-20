<template>
  <!-- These the navigation arrows TODO: I would like these to be in the same row as the
    tabs-->
  <!-- This the not minimized left drawer containing two tabs -->
  <transition name="slide-out" mode="out-in">
    <div v-if="!minified" key="full">
      <v-tabs v-model="activeLeftDrawerTab" centered grow @change="switchTab">
        <v-tooltip
          bottom
          :open-delay="toolTipOpenDelay"
          :close-delay="toolTipCloseDelay">
          <template v-slot:activator="{ props }">
            <v-tab class="mt-3" v-bind="props">
              <v-icon left>$toolsTab</v-icon>
            </v-tab>
          </template>
          <span>{{ $t("main.ToolsTabToolTip") }}</span>
        </v-tooltip>

        <v-tooltip
          bottom
          :open-delay="toolTipOpenDelay"
          :close-delay="toolTipCloseDelay">
          <template v-slot:activator="{ props }">
            <v-tab class="mt-3" v-bind="props">
              <v-icon left>$objectsTab</v-icon>
            </v-tab>
          </template>
          <span>{{ $t("main.ObjectsTabToolTip") }}</span>
        </v-tooltip>
        <v-tooltip
          bottom
          :open-delay="toolTipOpenDelay"
          :close-delay="toolTipCloseDelay">
          <template v-slot:activator="{ props }">
            <v-tab class="mt-3" v-bind="props">
              <v-icon left>$constructionsTab</v-icon>
            </v-tab>
          </template>
          <span>{{ $t("main.ConstructionsTabToolTip") }}</span>
        </v-tooltip>
      </v-tabs>
      <v-window v-model="activeLeftDrawerTab">
        <v-window-item>
          <ToolGroups id="toolGroups"></ToolGroups>
        </v-window-item>
        <v-window-item>
          Group 2
          <!--ObjectTree id="objtree"> </ObjectTree-->
        </v-window-item>
        <v-window-item>
          Group 3
          <!--ConstructionLoader id="loader"></ConstructionLoader-->
        </v-window-item>
      </v-window>
    </div>

    <div
      v-else
      v-on:click="$emit('toggle-tool-box-panel')"
      class="mini-icons"
      key="partial">
      <v-spacer />
      <v-icon>$toolsTab</v-icon>
      <v-spacer />
      <v-icon>$objectsTab</v-icon>
      <v-spacer />
      <v-icon>$constructionsTab</v-icon>
      <v-spacer />
    </div>
  </transition>
</template>

<script lang="ts" setup>
import Vue, { onBeforeMount, onBeforeUnmount, onMounted, ref } from "vue";
import ToolGroups from "@/components/ToolGroups.vue";
import ObjectTree from "./ObjectTree.vue";
import ConstructionLoader from "./ConstructionLoader.vue";
import SETTINGS from "@/global-settings";
import { useSEStore } from "@/stores/se";
import EventBus from "@/eventHandlers/EventBus";
import { storeToRefs } from "pinia";

const seStore = useSEStore();
const { actionMode } = storeToRefs(seStore);
const props = defineProps<{ minified: boolean }>();

// ('layers')')

let leftDrawerMinified = false;
/* Copy global setting to local variable */
const toolTipOpenDelay = SETTINGS.toolTip.openDelay;
const toolTipCloseDelay = SETTINGS.toolTip.closeDelay;
const activeLeftDrawerTab = ref(0);

onBeforeMount((): void => {
  EventBus.listen("left-panel-set-active-tab", setActiveTab);
});

// onMounted((): void =>{
// this.scene = this.layers[LAYER.midground];
// })

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
      seStore.setActionMode({
        id: "move",
        name: "MoveDisplayedName"
      });
    }
  }
}
function setActiveTab(e: { tabNumber: number }): void {
  activeLeftDrawerTab.value = e.tabNumber;
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
  justify-content: center; /* Center it vertically */
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
