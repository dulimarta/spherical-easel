<template>
  <div>
    <!-- this top level div is required, otherwise the style applied to id="topContainer" does not work -->
    <div id="topContainer">
      <v-expansion-panels style="gap: 10px;padding-right: 8px;">
      <v-expansion-panels>
        <v-expansion-panel style="border-radius: 8px;">
          <v-expansion-panel-title color="accent">
            <h3 class="body-1 font-weight-bold button-group-heading">
            {{ t("expression") }}
            </h3>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <ExpressionForm></ExpressionForm>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
      <v-expansion-panels>
        <v-expansion-panel style="border-radius: 8px;">
          <v-expansion-panel-title color="accent">
            <h3 class="body-1 font-weight-bold button-group-heading">
            {{ t("parametricCurves") }}
          </h3>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <ParametricForm></ParametricForm>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
      <v-expansion-panels>
        <v-expansion-panel style="border-radius: 8px;padding-right: 8px;">
          <v-expansion-panel-title color="accent">
            <h3 class="body-1 font-weight-bold button-group-heading">
            {{ t("slider") }}
          </h3>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <SliderForm></SliderForm>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>



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
            :label="t('points', sePoints.length)"
            :children="sePoints"></SENoduleList>
        </v-sheet>
        <v-sheet
          rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="seLines.length > 0">
          <SENoduleList
            :label="t('lines', seLines.length)"
            :children="seLines"></SENoduleList>
        </v-sheet>
        <v-sheet
          rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="seSegments.length > 0">
          <SENoduleList
            :label="t('segments', seSegments.length)"
            :children="seSegments"></SENoduleList>
        </v-sheet>
        <v-sheet
          rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="seCircles.length > 0">
          <SENoduleList
            :label="t('circles', seCircles.length)"
            :children="seCircles"></SENoduleList>
        </v-sheet>
        <v-sheet
          rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="seEllipses.length > 0">
          <SENoduleList
            :label="t('ellipses', seEllipses.length)"
            :children="seEllipses"></SENoduleList>
        </v-sheet>
        <v-sheet
          rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="seParametrics.length > 0">
          <SENoduleList
            :label="t('parametrics', seParametrics.length)"
            :children="seParametrics"></SENoduleList>
        </v-sheet>
        <v-sheet
          rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="seTransformations.length > 0">
          <SENoduleList
            :label="t('transformations', seTransformations.length)"
            :children="seTransformations"></SENoduleList>
        </v-sheet>
        <v-sheet
          rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="showExpressionSheet">
          <SENoduleList
            :label="t('measurements', seExpressions.length)"
            :children="seExpressions"></SENoduleList>
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
          {{ t("noObjectsInDatabase") }}
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
import { useI18n } from "vue-i18n";
const seStore = useSEStore();
const {
  sePoints,
  seLines,
  seSegments,
  seCircles,
  seEllipses,
  seParametrics,
  seNodules,
  seExpressions,
  actionMode,
  seTransformations
} = storeToRefs(seStore);
const {t} = useI18n()
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
    seExpressions.value.length === 0
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
    seExpressions.value.length === 0 &&
    displayExpressionSheetAgain
  ) {
    displayExpressionSheetAgain = false;
    switch (actionMode.value) {
      case "measuredCircle":
        EventBus.fire("show-alert", {
          key: t("createMeasurementForMeasuredCircle"),
          type: "info"
        });
        break;
      case "translation":
        EventBus.fire("show-alert", {
          key: t("createMeasurementForTranslation"),
          type: "info"
        });
        break;
      case "rotation":
        EventBus.fire("show-alert", {
          key: t("createMeasurementForRotation"),
          type: "info"
        });
        break;
    }
  }

  if (
    (actionMode.value === "measuredCircle" ||
      actionMode.value === "translation" ||
      actionMode.value === "rotation") &&
    seExpressions.value.length > 0
  ) {
    displayExpressionSheetAgain = true;
  }
  return seExpressions.value.length > 0;
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
<i18n lang="json" locale="en">
{
  "calculations": "Calculations | Calculation | Calculations | calculations",
  "circles": "Circles | Circle| Circles | circles",
  "createMeasurementForMeasuredCircle": "Create a measurement to use as the radius of a measured circle.",
    "createMeasurementForTranslation": "Create a measurement to use as the translation distance.",
    "createMeasurementForRotation": "Create a measurement to use as the angle of rotation.",
  "ellipses": "Ellipses | Ellipse | Ellipses | ellipses",
  "expression": "Expression",
  "lines": "Lines | Line | Lines | lines",
  "measurements": "Measurements | Measurement | Measurements | measurements",
  "noObjectsInDatabase": "No objects in database",
  "parametricCurves": "Parametric Curves",
  "parametrics": "Parametrics | Parametric | Parametrics | parametrics",
  "points": "Points | Point | Points | points",
  "segments": "Line Segments | Line Segment | Line segments | line segments",
  "slider": "Slider",
  "transformations": "Transformations | Transformation | Transformations | transformations"
}
</i18n>