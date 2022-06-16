<template>
  <transition name="slide-out"
    mode="out-in">
    <div v-if="!minified"
      key="full">

      <v-tabs v-model="activeLeftDrawerTab"
        left
        @change="switchTab">
        <v-tabs-slider color="primary"></v-tabs-slider>
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
        <v-btn icon
          @click="minifyToolbox">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>

      </v-tabs>
      <v-tabs-items v-model="activeLeftDrawerTab">
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
      </v-tabs-items>

    </div>

    <div v-else
      class="mini-icons"
      key="partial">
      <v-spacer />
      <v-btn icon
        v-on:click="$emit('toggle-toolbox-panel')">
        <v-icon>mdi-arrow-right</v-icon>
      </v-btn>
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
import { mapActions } from "pinia";
import { useSEStore } from "@/stores/se";

@Component({
  components: {
    ToolGroups,
    // Use dynamic import so subcomponents are loaded on deman
    ObjectTree: () => import("@/components/ObjectTree.vue"),
    ConstructionLoader: () => import("@/components/ConstructionLoader.vue")
  },
  methods: {
    ...mapActions(useSEStore, ["setActionMode"])
  }
})
export default class Toolbox extends Vue {
  @Prop()
  readonly minified!: boolean;

  // ('layers')')
  // private layers!: Two.Group[];
  readonly setActionMode!: (args: { id: ActionMode; name: string }) => void;

  private leftDrawerMinified = false;
  /* Copy global setting to local variable */
  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;
  private activeLeftDrawerTab = 0;
  toolboxMinified = false;

  // private scene!: Two.Group;

  mounted(): void {
    // this.scene = this.layers[LAYER.midground];
  }

  switchTab(): void {
    console.log("this.activeLeftDrawerTab", this.activeLeftDrawerTab);
    if (this.activeLeftDrawerTab === 1) {
      // 1 is the index of the object tree tab
      this.setActionMode({
        id: "move",
        name: "MoveDisplayedName"
      });
    }
  }
  minifyToolbox(): void {
    this.toolboxMinified = !this.toolboxMinified;
    this.$emit("toggle-toolbox-panel");
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
