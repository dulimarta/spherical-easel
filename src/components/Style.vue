<template>
  <transition name="slide-out"
    mode="out-in">
    <div v-if="!minified"
      key="full"
      style="height: 100%; overflow:auto">
      <v-expansion-panels :value="selectedPanel">
        <v-expansion-panel v-for="(p, idx) in panels"
          :key="idx">
          <v-expansion-panel-header color="blue lighten-3"
            :key="`header${idx}`"
            @click="saveStyleState"
            class="body-1 font-weight-bold">
            {{ $t(p.i18n_key) }}</v-expansion-panel-header>
          <v-expansion-panel-content :color="panelBackgroundColor(idx)"
            :key="`content${idx}`">
            <component :is="p.component"
              :side="p.side">
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
import FrontAndBackStyle from "@/components/FrontAndBackStyle.vue";
import { Prop } from "vue-property-decorator";
import EventBus from "../eventHandlers/EventBus";
import SETTINGS from "@/global-settings";

@Component({ components: { FrontAndBackStyle } })
export default class Style extends Vue {
  @Prop()
  readonly minified!: boolean;
  private selectedPanel = 0; // Default selection is the Foreground panel
  private readonly panels = [
    {
      i18n_key: "style.backStyle",
      component: () => import("@/components/BasicStyle.vue"),
      side: undefined
    },
    {
      i18n_key: "style.foregroundStyle",
      component: () => import("@/components/FrontAndBackStyle.vue"),
      side: SETTINGS.style.frontSide
    },
    {
      i18n_key: "style.backgroundStyle",
      component: () => import("@/components/FrontAndBackStyle.vue"), // Note: The frontPanel(idx) returns false for this panel - setting the panel to back side
      side: SETTINGS.style.backSide
    },
    {
      i18n_key: "style.advancedStyle",
      component: () => import("@/components/AdvancedStyle.vue"),
      side: undefined
    }
  ];

  //When the user changes panels or click on a panel header, the style state should be saved
  saveStyleState(): void {
    EventBus.fire("save-style-state", {});
  }

  panelBackgroundColor(idx: number): string {
    if (idx == 1) {
      return "grey darken-2";
    } else {
      return "grey";
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
