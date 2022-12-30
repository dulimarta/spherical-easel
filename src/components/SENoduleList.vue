<template>
  <div>
    <!-- <span v-for="c in points" :key="c.id">{{c.name}}</span> -->
    <div id="header" class="accent">
      <span v-if="children.length === 1" class="text-subtitle-1">{{
        $tc(i18LabelKey, 1)
      }}</span>
      <span v-else class="text-subtitle-1">{{ $tc(i18LabelKey, 0) }}</span>
      <v-btn small v-show="hasExistingChildren" @click="expanded = !expanded">
        <v-icon v-if="!expanded">mdi-chevron-right</v-icon>
        <v-icon v-else>mdi-chevron-down</v-icon>
      </v-btn>
    </div>

    <transition name="slide-right">
      <div v-show="expanded">
        <template v-for="n in existingChildren">
          <!-- content goes here -->
          <SENoduleItem
            :node="n"
            v-if="!isSlider(n)"
            :key="n.id"
            v-on:object-select="onExpressionSelect"></SENoduleItem>
          <SESliderItem
            v-else
            :node="toSlider(n) /* a trick to S type error */"
            :key="`${n.id}-slider`"
            v-on:object-select="onExpressionSelect"></SESliderItem>
          <v-divider :key="`${n.id}-divider`"></v-divider>
        </template>
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeMount, onBeforeUnmount, ref } from "vue";
import { SENodule } from "../models/SENodule";
import { SEIntersectionPoint } from "../models/SEIntersectionPoint";
import SENoduleItem from "@/components/SENoduleItem.vue";
import SESliderItem from "@/components/SESliderItem.vue";
import { SESlider } from "@/models/SESlider";
import EventBus from "@/eventHandlers/EventBus";
import { useSEStore } from "@/stores/se";
import { SEAntipodalPoint } from "@/models/SEAntipodalPoint";
const props = defineProps<{
  children: SENodule[];
  i18LabelKey: string;
}>(); /** When defined, label takes over the node name */

const seStore = useSEStore();
const { actionMode } = seStore;

const expanded = ref(false);
onBeforeMount((): void => {
  EventBus.listen("expand-measurement-sheet", expandMeasurementSheet);
  EventBus.listen("expand-transformation-sheet", expandTransformationSheet);
});

const toSlider = (n: SENodule): SESlider => n as SESlider

const hasExistingChildren = computed((): boolean => {
  // console.debug(" length", this.existingChildren.length);
  //this.existingChildren.forEach(node => console.debug(node.name));
  return existingChildren.value.length > 0;
});

// name(node: SENodule): string {
//   return node?.name ?? "None";
// }

const existingChildren = computed((): SENodule[] => {
  return props.children
    .filter((n: SENodule) => {
      if (n instanceof SEIntersectionPoint || n instanceof SEAntipodalPoint)
        return n.isUserCreated && n.exists;
      else return n.exists;
    })
    .sort((a, b) => {
      let aLabelString = a.name;
      let bLabelString = b.name;
      if (a.isLabelable() && b.isLabelable()) {
        aLabelString = (a as any).label.ref.shortUserName;
        bLabelString = (b as any).label.ref.shortUserName;
      }
      if (aLabelString.length < bLabelString.length) {
        return -1;
      } else if (aLabelString.length > bLabelString.length) {
        return 1;
      } else {
        if (aLabelString < bLabelString) {
          return -1;
        } else {
          return 1;
        }
      }
    });
});
//When the user activates the measured circle tool
// the object tool tab is open and the existing measurements sheet is expanded and the others are closed
function expandMeasurementSheet(): void {
  // console.log("here1");
  if (props.i18LabelKey === "objects.measurements") {
    if (hasExistingChildren) {
      expanded.value = true;
      switch (actionMode) {
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
    expanded.value = false;
  }
  // console.log("------------");
}

// When the user activates the apply transformation tool, the transformation sheet is expanded and the others are closed
function expandTransformationSheet(): void {
  // console.log("here1");
  if (props.i18LabelKey === "objects.transformations") {
    if (hasExistingChildren) {
      expanded.value = true;
      switch (actionMode) {
        case "applyTransformation":
          EventBus.fire("show-alert", {
            key: "objectTree.selectATransformation",
            type: "info"
          });
          break;
      }
    }
  } else {
    expanded.value = false;
  }
  // console.log("------------");
}
//When a user clicks on an expression this sends the token name to the expression builder (ExpressionForm.vue)
function onExpressionSelect(x: any): void {
  const pos = props.children.findIndex(n => n.id === x.id);
  // console.debug("****Selection", x, "at", pos);
  if (pos >= 0) {
    EventBus.fire("measurement-selected", props.children[pos].name);
  }
}
function isSlider(n: SENodule): boolean {
  return n instanceof SESlider;
}
onBeforeUnmount((): void => {
  EventBus.unlisten("expand-measurement-sheet");
  EventBus.unlisten("expand-transformation-sheet");
});
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
