<template>

  <!-- These the navigation arrows TODO: I would like these to be in the same row as the
    tabs-->
  <!-- This the not minimized left drawer containing two tabs -->
  <transition name="slide-out" mode="out-in">
    <div v-if="!minified" key="full">
      <!-- Two tabs set up TODO: fix the behavior of the tabs-->
      <v-tabs v-model="activeLeftDrawerTab" centered grow>
        <v-tooltip bottom :open-delay="toolTipOpenDelay"
          :close-delay="toolTipCloseDelay">
          <template v-slot:activator="{ on }">
            <v-tab class="mt-3" href="#toolListTab" v-on="on">
              <v-icon left>mdi-calculator</v-icon>
            </v-tab>
          </template>
          <span>{{ $t("main.ToolsTabToolTip") }}</span>
        </v-tooltip>

        <v-tooltip bottom :open-delay="toolTipOpenDelay"
          :close-delay="toolTipCloseDelay">
          <template v-slot:activator="{ on }">
            <v-tab class="mt-3" href="#objectListTab" v-on="on">
              <v-icon left>mdi-format-list-bulleted</v-icon>
            </v-tab>
          </template>
          <span>{{ $t("main.ObjectsTabToolTip") }}</span>
        </v-tooltip>

        <v-tab-item value="toolListTab">
          <ToolGroups></ToolGroups>
        </v-tab-item>
        <v-tab-item value="objectListTab">
          <ObjectTree style="width:100%">
          </ObjectTree>
        </v-tab-item>
      </v-tabs>
    </div>

    <div v-else id="mini-icons" key="partial">
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
import SETTINGS from "@/global-settings";

@Component({ components: { ToolGroups, ObjectTree } })
export default class Toolbox extends Vue {
  @Prop()
  readonly minified!: boolean;

  // @State
  // private layers!: Two.Group[];

  private leftDrawerMinified = false;
  /* Copy global setting to local variable */
  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;
  private activeLeftDrawerTab = "toolListTab";
  // private scene!: Two.Group;

  mounted(): void {
    // this.scene = this.layers[LAYER.midground];
  }
}
</script>

<style scoped>
#mini-icons {
  width: 100%;
  height: 80vh;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  justify-content: center; /* Center it vertically */
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
