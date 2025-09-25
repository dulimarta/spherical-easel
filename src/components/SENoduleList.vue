<template>
  <!-- <span v-for="c in points" :key="c.id">{{c.name}}</span> -->
  <div id="header" class="accent">
    <span class="text-subtitle-1">
      {{ label }}
    </span>
    <v-btn
      size="small"
      v-show="hasExistingChildren"
      @click="expanded = !expanded">
      <v-icon v-if="!expanded">mdi-chevron-right</v-icon>
      <v-icon v-else>mdi-chevron-down</v-icon>
    </v-btn>
  </div>

  <transition name="slide-right">
    <div v-show="expanded">
      <!-- content goes here -->
      <SENoduleItem
        v-for="(n, childIndex) in existingChildren[0]"
        :key="n.id"
        v-model="existingChildren[0][childIndex]"
        v-on:object-select="onExpressionSelect"></SENoduleItem>

      <SESliderItem
        v-for="(n, childIndex) in existingChildren[1]"
        :key="n.id"
        v-model="existingChildren[1][childIndex]"
        v-on:object-select="onExpressionSelect"></SESliderItem>
      <!-- <v-divider></v-divider-->
    </div>
  </transition>
</template>

<script lang="ts" setup>
import { computed, onBeforeMount, onBeforeUnmount, ref, watch } from "vue";
import { SENodule } from "../models-spherical/SENodule";
import { SEIntersectionPoint } from "../models-spherical/SEIntersectionPoint";
import SENoduleItem from "@/components/SENoduleItem.vue";
import SESliderItem from "./SESliderItem.vue";
import { SESlider } from "@/models-spherical/SESlider";
import EventBus from "@/eventHandlers-spherical/EventBus";
import { useSEStore } from "@/stores/se";
import { SEAntipodalPoint } from "@/models-spherical/SEAntipodalPoint";
import { storeToRefs } from "pinia";
import { SEExpression } from "@/models-spherical/SEExpression";
import { SETransformation } from "@/models-spherical/SETransformation";
import { useI18n } from "vue-i18n";
const props = defineProps<{
  children: SENodule[];
  label: string;
}>(); /** When defined, label takes over the node name */

const seStore = useSEStore();
const { actionMode } = storeToRefs(seStore);
const { t } = useI18n({ useScope: "local" });
const expanded = ref(false);

onBeforeMount((): void => {
  // console.log(
  //   "expand mS mount, childrenAreMeasurement",
  //   childrenAreMeasurement.value
  // );
  if (
    (childrenAreMeasurement.value && actionMode.value == "measuredCircle") ||
    (childrenAreTransformation.value &&
      actionMode.value == "applyTransformation")
  ) {
    expanded.value = true;
  }
  EventBus.listen("expand-measurement-sheet", expandMeasurementSheet);
  EventBus.listen("expand-transformation-sheet", expandTransformationSheet);
});

// const toSlider = (n: SENodule): SESlider => n as SESlider;

const hasExistingChildren = computed((): boolean => {
  existingChildren.value[0].forEach(node => console.debug(node.name));
  existingChildren.value[1].forEach(node => console.debug(node.name));
  return (
    existingChildren.value[0].length + existingChildren.value[1].length > 0
  );
});

const existingChildren = computed((): [SENodule[], SESlider[]] => {
  const [nonSliders, sliders] = props.children
    .filter((n: SENodule) => {
      //return noduleUserCreatedAndExist.value(n);
      if (n instanceof SEIntersectionPoint || n instanceof SEAntipodalPoint) {
        return n.isUserCreated && n.exists;
      } else {
        return n.exists;
      }
    })
    .sort((a, b) => {
      let aLabelString = a.name;
      let bLabelString = b.name;
      const aLabel = a.getLabel();
      const bLabel = b.getLabel();
      if (aLabel && bLabel) {
        aLabelString = aLabel.ref.shortUserName;
        bLabelString = bLabel.ref.shortUserName;
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
    })
    .partition(n => !(n instanceof SESlider));
  return [nonSliders, sliders.map(s => s as SESlider)];
});

const existingSliders = computed((): SESlider[] =>
  existingChildren.value.filter(c => c instanceof SESlider)
);

// const noduleUserCreatedAndExist = computed(() => (n: SENodule): boolean => {
//   if (n instanceof SEIntersectionPoint || n instanceof SEAntipodalPoint) {
//     return n.isUserCreated && n.exists;
//   } else {
//     return n.exists;
//   }
// });
//When the user activates the measured circle tool
// the object tool tab is open and the existing measurements sheet is expanded and the others are closed
const childrenAreMeasurement = computed(() =>
  props.children.every(c => c instanceof SEExpression)
);
const childrenAreTransformation = computed(() =>
  props.children.every(c => c instanceof SETransformation)
);
function expandMeasurementSheet(): void {
  // console.log("here1");
  if (childrenAreMeasurement.value) {
    if (hasExistingChildren.value) {
      expanded.value = true;
      switch (actionMode.value) {
        case "measuredCircle":
          EventBus.fire("show-alert", {
            key: t("selectAMeasurementForMeasuredCircle"),
            type: "info"
          });
          break;
        case "translation":
          EventBus.fire("show-alert", {
            key: t("selectAMeasurementForTranslation"),
            type: "info"
          });
          break;
        case "rotation":
          EventBus.fire("show-alert", {
            key: t("selectAMeasurementForRotation"),
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
  if (childrenAreTransformation.value) {
    if (hasExistingChildren.value) {
      expanded.value = true;
      switch (actionMode.value) {
        case "applyTransformation":
          EventBus.fire("show-alert", {
            key: t("selectATransformation"),
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
function onExpressionSelect(x: SENodule): void {
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
<i18n lang="json" locale="en">
{
  "selectAMeasurementForTranslation": "After selecting an axis (line or line segment) of translation, select a measurement to use as the distance of translation.",
  "selectAMeasurementForRotation": "After selecting a rotation point, select a measurement to use as the angle of rotation.",
  "selectATransformation": "Select a transformation to apply.",
  "selectAMeasurementForMeasuredCircle": "After selecting a center point, select a measurement to use as the radius of a measured circle."
}
</i18n>
