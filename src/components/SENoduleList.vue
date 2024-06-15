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
        <template v-for="n in existingChildren" :key="n.id">
          <!-- content goes here -->
          <SENoduleItem
            :node="n"
            v-if="!isSlider(n)"
            v-on:object-select="onExpressionSelect"></SENoduleItem>
          <!--SESliderItem
            v-else
            :node="toSlider(n) /* a trick to S type error */"
            v-on:object-select="onExpressionSelect"></SESliderItem>
          <v-divider></v-divider-->
        </template>
      </div>
    </transition>
</template>

<script lang="ts" setup>
import { computed, onBeforeMount, onBeforeUnmount, ref, watch } from "vue";
import { SENodule } from "../models/SENodule";
import { SEIntersectionPoint } from "../models/SEIntersectionPoint";
import SENoduleItem from "@/components/SENoduleItem.vue";
import SESliderItem from "@/components/SESliderItem.vue";
import { SESlider } from "@/models/SESlider";
import EventBus from "@/eventHandlers/EventBus";
import { useSEStore } from "@/stores/se";
import { SEAntipodalPoint } from "@/models/SEAntipodalPoint";
import { storeToRefs } from "pinia";
import { SEExpression } from "@/models/SEExpression";
import { SETransformation } from "@/models/SETransformation";
import { useI18n } from "vue-i18n";
const props = defineProps<{
  children: SENodule[];
  label: string;
}>(); /** When defined, label takes over the node name */

const seStore = useSEStore();
const { actionMode } = storeToRefs(seStore);
const {t} = useI18n()
const expanded = ref(false);

onBeforeMount((): void => {
  EventBus.listen("expand-measurement-sheet", expandMeasurementSheet);
  EventBus.listen("expand-transformation-sheet", expandTransformationSheet);
});

const toSlider = (n: SENodule): SESlider => n as SESlider;

const hasExistingChildren = computed((): boolean => {
  existingChildren.value.forEach(node => console.debug(node.name));
  return existingChildren.value.length > 0;
});

const existingChildren = computed((): SENodule[] => {
  return props.children
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
      const aLabel = a.getLabel()
      const bLabel = b.getLabel()
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
    });
});
// const noduleUserCreatedAndExist = computed(() => (n: SENodule): boolean => {
//   if (n instanceof SEIntersectionPoint || n instanceof SEAntipodalPoint) {
//     return n.isUserCreated && n.exists;
//   } else {
//     return n.exists;
//   }
// });
//When the user activates the measured circle tool
// the object tool tab is open and the existing measurements sheet is expanded and the others are closed
const childrenAreMeasurement = computed(() => props.children.every(c => c instanceof SEExpression))
const childrenAreTransformation = computed(() => props.children.every(c => c instanceof SETransformation))
function expandMeasurementSheet(): void {
  // console.log("here1");
  if (childrenAreMeasurement) {
    if (hasExistingChildren) {
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
  if (childrenAreTransformation) {
    if (hasExistingChildren) {
      expanded.value = true;
      switch (actionMode.value) {
        case "applyTransformation":
          EventBus.fire("show-alert", {
            key:t("selectATransformation"),
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
<i18n lang="json" locale="en">
  {
    "selectAMeasurementForTranslation": "After selecting an axis (line or line segment) of translation, select a measurement to use as the distance of translation.",
    "selectAMeasurementForRotation": "After selecting a rotation point, select a measurement to use as the angle of rotation.",
    "selectATransformation": "Select a transformation to apply.",
    "selectAMeasurementForMeasuredCircle": "After selecting a center point, select a measurement to use as the radius of a measured circle.",
    "sdfdf": "sdfsdf"
  }
</i18n>