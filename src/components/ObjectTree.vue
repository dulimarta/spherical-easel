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
          class="my-3"
          v-show="sePoints.length > 0">
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
          <SENoduleList i18LabelKey="objects.parametrics"
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
          <SENoduleList i18LabelKey="objects.measurements"
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
import { computed } from "vue";
import SENoduleList from "@/components/SENoduleList.vue";
import ExpressionForm from "@/components/ExpressionForm.vue";
import ParametricForm from "@/components/ParametricForm.vue";
import SliderForm from "@/components/SliderForm.vue";
import { useSEStore } from "@/stores/se";
import EventBus from "@/eventHandlers/EventBus";
import { storeToRefs } from "pinia";


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

const zeroObjects = computed((): boolean => {
  // console.debug(
  //   `Object Tree: ZeroObjects -- number of objects ${seNodules.length}`
  // );
  return (
    seNodules.value.filter(n => n.exists).length === 0 && expressions.value.length === 0
  );
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
