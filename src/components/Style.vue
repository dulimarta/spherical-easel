<template>
  <transition name="slide-out" mode="out-in">
    <div v-if="!minified" key="full">
      <v-expansion-panels :value="selectedPanel">
        <v-expansion-panel v-for="(p, idx) in panels" :key="idx">
          <v-expansion-panel-header :key="`header${idx}`">
            {{ p.name }}
          </v-expansion-panel-header>
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

@Component({ components: { FrontStyle } })
export default class Style extends Vue {
  @Prop()
  readonly minified!: boolean;
  private selectedPanel = 0;
  private readonly panels = [
    {
      name: "Basic Style",
      component: () => import("@/components/BasicStyle.vue")
    },
    {
      name: "Foreground Style",
      component: () => import("@/components/FrontStyle.vue")
    },
    {
      name: "Background Style",
      component: () => import("@/components/BackStyle.vue")
    },
    {
      name: "Advanced Style",
      component: () => import("@/components/AdvancedStyle.vue")
    }
  ];
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
