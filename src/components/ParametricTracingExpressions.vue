<template>
  <div>
    <!-- <span v-for="c in points" :key="c.id">{{c.name}}</span> -->
    <div id="header"
      class="accent">
      <span class="text-subtitle-1">{{$t(i18LabelKey)}}</span>
      <v-btn smalls
        @click="expanded = !expanded">
        <v-icon v-if="!expanded">mdi-chevron-right</v-icon>
        <v-icon v-else>mdi-chevron-down</v-icon>
      </v-btn>
    </div>

    <transition name="slide-right">
      <div v-show="expanded">
        <template v-for="(tVal,idk) in tExpressionData">
          <!-- content goes here -->
          <ParametricTExpression :placeholder="tVal.placeholder"
            :key="idk+2"
            :i18nLabelKey="tVal.i18nLabelkey"
            :i18nToolTip="tVal.i18nToolTip"
            :name="tVal.name">
          </ParametricTExpression>
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
import EventBus from "@/eventHandlers/EventBus";
import ParametricTExpression from "@/components/ParametricTExpression.vue";

@Component({ components: { ParametricTExpression } })
export default class SENoduleTree extends Vue {
  @Prop()
  readonly tExpressionData!: [];

  @Prop()
  readonly i18LabelKey!: string;

  private expanded = false;

  // get hasExistingChildren(): boolean {
  //   return this.existingChildren.length > 0;
  // }

  // name(node: SENodule): string {
  //   return node?.name ?? "None";
  // }

  // get existingChildren(): SENodule[] {
  //   return this.children.filter((n: SENodule) => {
  //     if (n instanceof SEIntersectionPoint) return n.isUserCreated;
  //     else return n.exists;
  //   });
  // }

  //When a user clicks on an expression this sends the token name to the expression builder (ExpressionForm.vue)
  onExpressionSelect(x: any): void {
    // const pos = this.children.findIndex(n => n.id === x.id);
    // // console.debug("****Selection", x, "at", pos);
    // if (pos >= 0) {
    //   EventBus.fire(
    //     "measurement-selected",
    //     this.children[pos].name
    //   );
    // }
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
