<template>

  <!-- These the navigation arrows TODO: I would like these to be in the same row as the
    tabs-->
  <!-- This the not minimized left drawer containing two tabs -->
  <transition name="slide-out"
    mode="out-in">
    <div v-if="!minified"
      key="full">
      <!-- Two tabs set up TODO: fix the behavior of the tabs-->
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
              <v-icon left>mdi-calculator</v-icon>
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
              <v-icon left>mdi-format-list-bulleted</v-icon>
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
              <v-icon left>mdi-database</v-icon>
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
      class="mini-icons"
      key="partial">
      <v-icon>mdi-calculator</v-icon>
      <v-icon>mdi-format-list-bulleted</v-icon>
    </div>
  </transition>

</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import ToolGroups from "@/components/ToolGroups.vue";
import ObjectTree from "@/components/ObjectTree.vue";
import ConstructionLoader from "@/components/ConstructionLoader.vue";
import SETTINGS from "@/global-settings";
import { SEStore } from "@/store";

@Component({ components: { ToolGroups, ObjectTree, ConstructionLoader } })
export default class Toolbox extends Vue {
  @Prop()
  readonly minified!: boolean;

  // ('layers')')
  // private layers!: Two.Group[];

  private leftDrawerMinified = false;
  /* Copy global setting to local variable */
  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;
  private activeLeftDrawerTab = 0;
  // private scene!: Two.Group;

  mounted(): void {
    // this.scene = this.layers[LAYER.midground];
  }

  switchTab(): void {
    // console.log("this.activeLeftDrawerTab", this.activeLeftDrawerTab);
    if (this.activeLeftDrawerTab === 1) {
      // 1 is the index of the object tree tab
      SEStore.setActionMode({
        id: "move",
        name: "MoveDisplayedName"
      });
    }
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
  transition-duration: 250ms;
  transition-timing-function: ease;
}

.slide-out-enter,
.slide-out-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}
</style>
