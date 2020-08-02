<template>
  <transition name="slide-out" mode="out-in">
    <div v-if="!minified" key="full">
      <v-expansion-panels :value="selectedPanel">
        <v-expansion-panel v-for="(p, idx) in panels" :key="idx" @click="saveStyleState">
          <v-expansion-panel-header :key="`header${idx}`">{{ p.name }}</v-expansion-panel-header>
          <v-expansion-panel-content :key="`content${idx}`">
            <component :is="p.component"></component>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
    <div v-else id="mini-icons" key="partial">
      <v-icon>mdi-palette</v-icon>
    </div>
  </transition>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import FrontStyle from "@/components/FrontStyle.vue";
import { Prop } from "vue-property-decorator";
import EventBus from "../eventHandlers/EventBus";
//import SETTINGS from "@/global-settings";

@Component({ components: { FrontStyle } })
export default class Style extends Vue {
  @Prop()
  readonly minified!: boolean;
  private selectedPanel = 0; // Default selection is the Foreground panel
  private readonly panels = [
    {
      name: "{{$t(`style.foregroundStyle`)}}",
      component: () => import("@/components/FrontStyle.vue")
    },
    {
      name: "$t(`style.backgroundStyle`)",
      component: () => import("@/components/BackStyle.vue")
    },
    {
      name: "$t(`style.advancedStyle`)",
      component: () => import("@/components/AdvancedStyle.vue")
    }
  ];

  //When the user changes panels or click on a panel, the style state should be saved
  saveStyleState(): void {
    EventBus.fire("save-style-state", {});
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
