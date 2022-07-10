<template>

  <!-- These the navigation arrows TODO: I would like these to be in the same row as the
    tabs-->
  <!-- This the not minimized left drawer containing two tabs -->
  <transition name="slide-out"
    mode="out-in">
    <div v-if="!minified"
      key="full">
      <v-tabs v-model="activeLeftDrawerTab"
        centered
        grow
        @change="switchTab">
        <v-tooltip bottom
          :open-delay="toolTipOpenDelay"
          :close-delay="toolTipCloseDelay">
          <template v-slot:activator="{ on }">
            <v-tab class="mt-3"
              v-on="on">
              <v-icon left>$vuetify.icons.value.toolsTab</v-icon>
            </v-tab>
          </template>
          <span>{{ $t("main.ToolsTabToolTip") }}</span>
        </v-tooltip>

        <v-tooltip bottom
          :open-delay="toolTipOpenDelay"
          :close-delay="toolTipCloseDelay">
          <template v-slot:activator="{ on }">
            <v-tab class="mt-3"
              v-on="on">
              <v-icon left>$vuetify.icons.value.objectsTab</v-icon>
            </v-tab>
          </template>
          <span>{{ $t("main.ObjectsTabToolTip") }}</span>
        </v-tooltip>
        <v-tooltip bottom
          :open-delay="toolTipOpenDelay"
          :close-delay="toolTipCloseDelay">
          <template v-slot:activator="{ on }">
            <v-tab class="mt-3"
              v-on="on">
              <v-icon left>$vuetify.icons.value.constructionsTab</v-icon>
            </v-tab>
          </template>
          <span>{{ $t("main.ConstructionsTabToolTip") }}</span>
        </v-tooltip>

        <v-tab-item>
          <ToolGroups id="toolGroups"></ToolGroups>
        </v-tab-item>
        <v-tab-item>
          <ObjectTree id="objtree">
          </ObjectTree>
        </v-tab-item>
        <v-tab-item>
          <ConstructionLoader id="loader"></ConstructionLoader>
        </v-tab-item>
      </v-tabs>
    </div>

    <div v-else
      v-on:click="$emit('toggle-tool-box-panel')"
      class="mini-icons"
      key="partial">
      <v-spacer />
      <v-icon>$vuetify.icons.value.toolsTab</v-icon>
      <v-spacer />
      <v-icon>$vuetify.icons.value.objectsTab</v-icon>
      <v-spacer />
      <v-icon>$vuetify.icons.value.constructionsTab</v-icon>
      <v-spacer />
    </div>
  </transition>

</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import ToolGroups from "@/components/ToolGroups.vue";

import SETTINGS from "@/global-settings";
import { ActionMode } from "@/types";
import { mapState, mapActions } from "pinia";
import { useSEStore } from "@/stores/se";
import EventBus from "@/eventHandlers/EventBus";

@Component({
  components: {
    ToolGroups,
    // Use dynamic import so subcomponents are loaded on demand
    ObjectTree: () => import("@/components/ObjectTree.vue"),
    ConstructionLoader: () => import("@/components/ConstructionLoader.vue")
  },
  computed: {
    ...mapState(useSEStore, ["actionMode"])
  },
  methods: {
    ...mapActions(useSEStore, ["setActionMode"])
  }
})
export default class Toolbox extends Vue {
  @Prop()
  readonly minified!: boolean;

  // ('layers')')
  readonly setActionMode!: (args: { id: ActionMode; name: string }) => void;
  readonly actionMode!: ActionMode;

  private leftDrawerMinified = false;
  /* Copy global setting to local variable */
  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;
  private activeLeftDrawerTab = 0;

  mounted(): void {
    // this.scene = this.layers[LAYER.midground];
  }

  switchTab(): void {
    // console.log("this.activeLeftDrawerTab", this.activeLeftDrawerTab);
    if (this.activeLeftDrawerTab === 1) {
      // 1 is the index of the object tree tab
      // change to the move mode, but only if we are not using the measured circle tool
      if (
        this.actionMode !== "measuredCircle" &&
        this.actionMode !== "translation" &&
        this.actionMode !== "rotation"
      ) {
        this.setActionMode({
          id: "move",
          name: "MoveDisplayedName"
        });
      }
    }
  }
  setActiveTab(e: { tabNumber: number }): void {
    this.activeLeftDrawerTab = e.tabNumber;
  }
  beforeDestroy(): void {
    EventBus.unlisten("left-panel-set-active-tab");
  }
}
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
