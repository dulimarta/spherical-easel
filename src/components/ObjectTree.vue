<template>
  <div>
    <!-- this top level div is required, otherwise the style applied to id="topContainer" does not work -->
    <div id="topContainer">
      <v-expansion-panels>
        <v-expansion-panel>
          <v-expansion-panel-title color="accent">
            {{ $t("objectTree.expression") }}
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <ExpressionForm></ExpressionForm>
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel>
          <v-expansion-panel-title color="accent">
            {{ $t("objectTree.parametricCurves") }}
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <ParametricForm></ParametricForm>
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel>
          <v-expansion-panel-title color="accent">
            {{ $t("objectTree.slider") }}
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <SliderForm></SliderForm>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
      <div class="ma-2 pa-1" id="objectTreeContainer">
        <v-sheet
          rounded
          color="accent"
          :elevation="4"
          :key="pointsKey"
          class="my-3"
          v-show="
            sePoints.filter(n => {
              if (
                n instanceof SEIntersectionPoint ||
                n instanceof SEAntipodalPoint
              ) {
                return n.isUserCreated && n.exists;
              } else {
                return n.exists;
              }
            }).length > 0
          ">
          <SENoduleList
            i18LabelKey="objects.points"
            :children="sePoints"></SENoduleList>
        </v-sheet>
        <v-sheet
          rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="seLines.length > 0">
          <SENoduleList
            i18LabelKey="objects.lines"
            :children="seLines"></SENoduleList>
        </v-sheet>
        <v-sheet
          rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="seSegments.length > 0">
          <SENoduleList
            i18LabelKey="objects.segments"
            :children="seSegments"></SENoduleList>
        </v-sheet>
        <v-sheet
          rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="seCircles.length > 0">
          <SENoduleList
            i18LabelKey="objects.circles"
            :children="seCircles"></SENoduleList>
        </v-sheet>
        <v-sheet
          rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="seEllipses.length > 0">
          <SENoduleList
            i18LabelKey="objects.ellipses"
            :children="seEllipses"></SENoduleList>
        </v-sheet>
        <v-sheet
          rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="seParametrics.length > 0">
          <SENoduleList
            i18LabelKey="objects.parametrics"
            :children="seParametrics"></SENoduleList>
        </v-sheet>
        <v-sheet
          rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="seTransformations.length > 0">
          <SENoduleList
            i18LabelKey="objects.transformations"
            :children="seTransformations"></SENoduleList>
        </v-sheet>
        <v-sheet
          rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="showExpressionSheet">
          <SENoduleList
            i18LabelKey="objects.measurements"
            :children="expressions"></SENoduleList>
        </v-sheet>
        <!--v-sheet rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="calculations.length > 0">
          <SENoduleList i18LabelKey="Calculations"
            :children="calculations"
            @object-select="onExpressionSelect"></SENoduleList>
        </v-sheet-->

        <span class="text-body-2 ma-2" v-show="zeroObjects">
          {{ $t("objectTree.noObjectsInDatabase") }}
        </span>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { computed, onBeforeMount, onBeforeUnmount, ref } from "vue";
import SENoduleList from "@/components/SENoduleList.vue";
import ExpressionForm from "@/components/ExpressionForm.vue";
import ParametricForm from "@/components/ParametricForm.vue";
import SliderForm from "@/components/SliderForm.vue";
import { useSEStore } from "@/stores/se";
import EventBus from "@/eventHandlers/EventBus";
import { storeToRefs } from "pinia";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { SEAntipodalPoint } from "@/models/SEAntipodalPoint";

const seStore = useSEStore();
const {
  sePoints,
  seLines,
  seSegments,
  seCircles,
  seEllipses,
  seParametrics,
  seNodules,
  expressions,
  actionMode,
  seTransformations
} = storeToRefs(seStore);

let displayExpressionSheetAgain = true;
const pointsKey = ref(0);

// const userCreatedPoints = computed(() => {
//   return sePoints.value.filter(
//     pt =>
//       (pt instanceof SEIntersectionPoint || pt instanceof SEAntipodalPoint) &&
//       pt.isUserCreated &&
//       pt.exists
//   );
// });

// watch(
//   userCreatedPoints,
//   (points: SEPoint[]) => {
//     console.log("watched!!!!");
//     if (
//       points.some(
//         pt =>
//           (pt instanceof SEIntersectionPoint ||
//             pt instanceof SEAntipodalPoint) &&
//           pt.isUserCreated &&
//           pt.exists
//       )
//     ) {
//       console.log("key change");
//       templateKey.value = 1 - templateKey.value;
//     }
//   },
//   { deep: true }
// );
const zeroObjects = computed((): boolean => {
  // console.debug(
  //   `Object Tree: ZeroObjects -- number of objects ${seNodules.length}`
  // );
  return (
    seNodules.value.filter(n => n.exists).length === 0 &&
    expressions.value.length === 0
  );
});
onBeforeMount((): void => {
  EventBus.listen("update-points-user-created", updateKey);
});
// If we don't do use this event bus system then we get the following issue:
// 1. Draw two line segments that appear to intersect. (This creates points p1, p2, p3, p4 and segments ls1, ls2)
// 2. Turn on the point tool
// 3. Open the object tree and open the points sheet. You should see  points p1, p2, p3, and p4 listed
// 4. Click on the location of the intersection of the two line segments (with the point tool still active).
//     This creates point p5 which is *not* displayed in the points sheet in the object tree.  You can check
//     that p5 is in the object tree by clicking at a empty location on the sphere — when you do this *two*
//      new entries appear in the points list.
function updateKey(): void {
  //console.log("update");
  pointsKey.value = pointsKey.value - 1;
}
onBeforeUnmount((): void => {
  EventBus.unlisten("update-points-user-created");
});
const showExpressionSheet = computed((): boolean => {
  //This message will appear once each time the number of expressions is zero and the measure circle tool is active
  // console.log("here show expression sheet");
  if (
    (actionMode.value === "measuredCircle" ||
      actionMode.value === "translation" ||
      actionMode.value === "rotation") &&
    expressions.value.length === 0 &&
    displayExpressionSheetAgain
  ) {
    displayExpressionSheetAgain = false;
    switch (actionMode.value) {
      case "measuredCircle":
        EventBus.fire("show-alert", {
          key: "objectTree.createMeasurementForMeasuredCircle",
          type: "info"
        });
        break;
      case "translation":
        EventBus.fire("show-alert", {
          key: "objectTree.createMeasurementForTranslation",
          type: "info"
        });
        break;
      case "rotation":
        EventBus.fire("show-alert", {
          key: "objectTree.createMeasurementForRotation",
          type: "info"
        });
        break;
    }
  }

  if (
    (actionMode.value === "measuredCircle" ||
      actionMode.value === "translation" ||
      actionMode.value === "rotation") &&
    expressions.value.length > 0
  ) {
    displayExpressionSheetAgain = true;
  }
  return expressions.value.length > 0;
});
</script>

<style lang="scss" scoped>
#topContainer {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  height: 100%;
}

#objectTreeContainer {
  overflow: auto;
  flex-grow: 1;
}
</style>
