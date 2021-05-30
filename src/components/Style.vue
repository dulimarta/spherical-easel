<template>
  <transition name="slide-out"
    mode="out-in">
    <div v-if="!minified"
      key="full"
      style="height: 100%; overflow:auto">
      <v-expansion-panels v-model="activePanel">
        <v-expansion-panel v-for="(p, idx) in panels"
          :key="idx">
          <v-expansion-panel-header color="blue lighten-3"
            :key="`header${idx}`"
            class="body-1 font-weight-bold">
            {{ $t(p.i18n_key) }}</v-expansion-panel-header>
          <v-expansion-panel-content :color="panelBackgroundColor(idx)"
            :key="`content${idx}`">
            <component :is="p.component"
              :panel="p.panel"
              :active-panel="activePanel">
            </component>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
    <div v-else
      id="mini-icons"
      key="partial">
      <v-icon>mdi-palette</v-icon>
    </div>
  </transition>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import BasicFrontBackStyle from "@/components/BasicFrontBackStyle.vue";
import { Watch, Prop } from "vue-property-decorator";
import EventBus from "../eventHandlers/EventBus";
import SETTINGS from "@/global-settings";
import { StyleEditPanels } from "@/types/Styles";

@Component({ components: { BasicFrontBackStyle } })
export default class Style extends Vue {
  @Prop()
  readonly minified!: boolean;

  private activePanel: number | undefined = 0; // Default selection is the Label panel

  @Watch("minified")
  closeAllPanels(): void {
    console.log("minified");
    this.activePanel = undefined;
    // If the user has been styling objects and then, without selecting new objects, or deactivating selection the style state should be saved.
    EventBus.fire("save-style-state", {});
  }

  // The order of these panels *must* match the order of the StyleEditPanels in Style.ts
  private readonly panels = [
    {
      i18n_key: "style.labelStyle",
      component: () => import("@/components/BasicFrontBackStyle.vue"),
      panel: StyleEditPanels.Label
    },
    {
      i18n_key: "style.foregroundStyle",
      component: () => import("@/components/BasicFrontBackStyle.vue"),
      panel: StyleEditPanels.Front
    },
    {
      i18n_key: "style.backgroundStyle",
      component: () => import("@/components/BasicFrontBackStyle.vue"),
      panel: StyleEditPanels.Back
    },
    {
      i18n_key: "style.advancedStyle",
      component: () => import("@/components/AdvancedStyle.vue"),
      panel: StyleEditPanels.Advanced
    }
  ];

  panelBackgroundColor(idx: number): string {
    if (idx === 1) {
      return "grey lighten-2";
    } else {
      return "grey lighten-2";
    }
  }
}
</script>

<style scoped>
#mini-icons {
  display: flex;
  flex-direction: column;
  height: 80vh;
  align-items: center;
  justify-content: center;
}

.slide-out-enter-active,
.slide-out-leave-active {
  transition-property: all;
  transition-duration: 250ms;
  transition-timing-function: ease;
}

.slide-out-enter,
.slide-out-leave-to {
  transform: translateX(200%);
}
</style>
