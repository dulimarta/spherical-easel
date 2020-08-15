<template>
  <div>
    <!-- <span v-for="c in points" :key="c.id">{{c.name}}</span> -->
    <div id="header"
      class="accent">
      <span class="text-subtitle-1">{{label}}</span>
      <v-btn small
        v-show="hasExistingChildren"
        @click="expanded = !expanded">
        <v-icon v-if="!expanded">mdi-chevron-right</v-icon>
        <v-icon v-else>mdi-chevron-down</v-icon>
      </v-btn>
    </div>

    <transition name="slide-right">
      <div v-show="expanded">
        <template v-for="n in existingChildren">
          <!-- content goes here -->
          <SENoduleItem :node="n"
            v-if="!isSlider(n)"
            :key="n.id"></SENoduleItem>
          <SESliderItem v-else
            :node="n"
            :key="`${n.id}-slider`"></SESliderItem>
          <v-divider :key="`${n.id}-divider`"></v-divider>
        </template>
      </div>
    </transition>
  </div>

</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";
import { SENodule } from "../models/SENodule";
import { SEIntersectionPoint } from "../models/SEIntersectionPoint";
import SENoduleItem from "@/components/SENoduleItem.vue";
import SESliderItem from "@/components/SESliderItem.vue";
import { SESlider } from "@/models/SESlider";

@Component({ components: { SENoduleItem, SESliderItem } })
export default class SENoduleTree extends Vue {
  @Prop()
  readonly children!: SENodule[];

  @Prop()
  readonly label!: string; /** Wheen defined, label takes over the node name */

  private expanded = false;

  get hasExistingChildren(): boolean {
    return this.existingChildren.length > 0;
  }

  // name(node: SENodule): string {
  //   return node?.name ?? "None";
  // }

  get existingChildren(): SENodule[] {
    return this.children.filter((n: SENodule) => {
      if (n instanceof SEIntersectionPoint) return n.isUserCreated;
      else return n.exists;
    });
  }

  isSlider(n: SENodule): boolean {
    return n instanceof SESlider;
  }
}
</script>

<style scoped lang="scss">
#header {
  display: flex;
  flex-direction: row;
  align-items: center;

  span {
    margin-left: 0.25em;
    flex-grow: 1;
  }
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: all;
  transition-duration: 250ms;
}

.slide-right-enter,
.slide-right-leave-to {
  // Start position is far left
  transform: translateX(-100%);
}
</style>
