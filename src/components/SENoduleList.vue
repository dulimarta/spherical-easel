<template>
  <div>
    <!-- <span v-for="c in points" :key="c.id">{{c.name}}</span> -->
    <div id="header"
      class="accent">
      <span v-if="children.length===1"
        class="text-subtitle-1">{{$tc(i18LabelKey,1)}}</span>
      <span v-else
        class="text-subtitle-1">{{$tc(i18LabelKey,0)}}</span>
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
            :key="n.id"
            v-on:object-select="onExpressionSelect"></SENoduleItem>
          <SESliderItem v-else
            :node="n"
            :key="`${n.id}-slider`"
            v-on:object-select="onExpressionSelect"></SESliderItem>
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
import EventBus from "@/eventHandlers/EventBus";
import { SEStore } from "@/store";

@Component({ components: { SENoduleItem, SESliderItem } })
export default class SENoduleTree extends Vue {
  @Prop()
  readonly children!: SENodule[];

  @Prop()
  readonly i18LabelKey!: string; /** When defined, label takes over the node name */

  private expanded = false;
  created(): void {
    EventBus.listen("expand-measurement-sheet", this.expandMeasurementSheet);
    EventBus.listen(
      "expand-transformation-sheet",
      this.expandTransformationSheet
    );
  }

  get hasExistingChildren(): boolean {
    return this.existingChildren.length > 0;
  }

  // name(node: SENodule): string {
  //   return node?.name ?? "None";
  // }

  get existingChildren(): SENodule[] {
    return this.children.filter((n: SENodule) => {
      if (n instanceof SEIntersectionPoint) return n.isUserCreated && n.exists;
      else return n.exists;
    });
  }
  //When the user activates the measured circle tool
  // the object tool tab is open and the existing measurements sheet is expanded and the others are closed
  expandMeasurementSheet(): void {
    // console.log("here1");
    if (this.i18LabelKey === "objects.measurements") {
      if (this.hasExistingChildren) {
        this.expanded = true;
        switch (SEStore.actionMode) {
          case "measuredCircle":
            EventBus.fire("show-alert", {
              key: "objectTree.selectAMeasurementForMeasuredCircle",
              type: "info"
            });
            break;
          case "translation":
            EventBus.fire("show-alert", {
              key: "objectTree.selectAMeasurementForTranslation",
              type: "info"
            });
            break;
          case "rotation":
            EventBus.fire("show-alert", {
              key: "objectTree.selectAMeasurementForRotation",
              type: "info"
            });
            break;
        }
      }
    } else {
      this.expanded = false;
    }
    // console.log("------------");
  }

  // When the user activates the apply transformation tool, the transformation sheet is expanded and the others are closed
  expandTransformationSheet(): void {
    // console.log("here1");
    if (this.i18LabelKey === "objects.transformations") {
      if (this.hasExistingChildren) {
        this.expanded = true;
        switch (SEStore.actionMode) {
          case "applyTransformation":
            EventBus.fire("show-alert", {
              key: "objectTree.selectATransformation",
              type: "info"
            });
            break;
        }
      }
    } else {
      this.expanded = false;
    }
    // console.log("------------");
  }
  //When a user clicks on an expression this sends the token name to the expression builder (ExpressionForm.vue)
  onExpressionSelect(x: any): void {
    const pos = this.children.findIndex(n => n.id === x.id);
    // console.debug("****Selection", x, "at", pos);
    if (pos >= 0) {
      EventBus.fire("measurement-selected", this.children[pos].name);
    }
  }
  isSlider(n: SENodule): boolean {
    return n instanceof SESlider;
  }
  beforeDestroy(): void {
    EventBus.unlisten("expand-measurement-sheet");
    EventBus.unlisten("expand-transformation-sheet");
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
