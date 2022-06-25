<template>
  <div>
    <!-- this top level div is required, otherwise the style applied to id="topContainer" does not work -->
    <div id="topContainer">
      <v-expansion-panels>
        <v-expansion-panel>
          <v-expansion-panel-header color="accent">
            {{ $t("objectTree.expression") }}
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <ExpressionForm></ExpressionForm>

          </v-expansion-panel-content>
        </v-expansion-panel>
        <v-expansion-panel>
          <v-expansion-panel-header color="accent">
            {{ $t("objectTree.parametricCurves") }}
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <ParametricForm></ParametricForm>

          </v-expansion-panel-content>
        </v-expansion-panel>
        <v-expansion-panel>
          <v-expansion-panel-header color="accent">
            {{ $t("objectTree.slider") }}
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <SliderForm></SliderForm>

          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
      <div class="ma-2 pa-1"
        id="objectTreeContainer">
        <v-sheet rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="sePoints.length > 0">
          <SENoduleList i18LabelKey="objects.points"
            :children="sePoints"></SENoduleList>
        </v-sheet>
        <v-sheet rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="seLines.length > 0">
          <SENoduleList i18LabelKey="objects.lines"
            :children="seLines"></SENoduleList>
        </v-sheet>
        <v-sheet rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="seSegments.length > 0">
          <SENoduleList i18LabelKey="objects.segments"
            :children="seSegments"></SENoduleList>
        </v-sheet>
        <v-sheet rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="seCircles.length > 0">
          <SENoduleList i18LabelKey="objects.circles"
            :children="seCircles"></SENoduleList>
        </v-sheet>
        <v-sheet rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="seEllipses.length > 0">
          <SENoduleList i18LabelKey="objects.ellipses"
            :children="seEllipses"></SENoduleList>
        </v-sheet>
        <v-sheet rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="seParametrics.length > 0">
          <SENoduleList i18LabelKey="objects.parametrics"
            :children="seParametrics"></SENoduleList>
        </v-sheet>
        <v-sheet rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="seTransformations.length">
          <SENoduleList i18LabelKey="objects.transformations"
            :children="seTransformations"></SENoduleList>
        </v-sheet>
        <v-sheet rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="showExpressionSheet">
          <SENoduleList i18LabelKey="objects.measurements"
            :children="expressions"></SENoduleList>
        </v-sheet>
        <!-- <v-sheet rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="calculations.length > 0">
          <SENoduleList i18LabelKey="Calculations"
            :children="calculations"
            @object-select="onExpressionSelect"></SENoduleList>
        </v-sheet> -->
        <span class="text-body-2 ma-2"
          v-show="zeroObjects">
          {{$t("objectTree.noObjectsInDatabase")}}
        </span>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { ActionMode, plottableType } from "@/types";
import SENoduleList from "@/components/SENoduleList.vue";
import { SENodule } from "@/models/SENodule";
import ExpressionForm from "@/components/ExpressionForm.vue";
import ParametricForm from "@/components/ParametricForm.vue";
import SliderForm from "@/components/SliderForm.vue";
import { SEExpression } from "@/models/SEExpression";
import { mapState } from "pinia";
import { useSEStore } from "@/stores/se";
import EventBus from "@/eventHandlers/EventBus";
import { SETransformation } from "@/models/SETransformation";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { SESegment } from "@/models/SESegment";
import { SECircle } from "@/models/SECircle";
import { SEEllipse } from "@/models/SEEllipse";
import { SEParametric } from "@/models/SEParametric";

@Component({
  components: { SENoduleList, ExpressionForm, ParametricForm, SliderForm },
  computed: {
    ...mapState(useSEStore, [
      "actionMode",
      "sePoints",
      "seLines",
      "seSegments",
      "seCircles",
      "seEllipses",
      "seParametrics",
      "seNodules",
      "expressions",
      "seTransformations"
    ])
  }
})
export default class ObjectTree extends Vue {
  readonly sePoints!: SEPoint[];
  readonly seLines!: SELine[];
  readonly seSegments!: SESegment[];
  readonly seCircles!: SECircle[];
  readonly seEllipses!: SEEllipse[];
  readonly seParametrics!: SEParametric[];
  readonly seNodules!: SENodule[];
  readonly expressions!: SEExpression[];
  readonly actionMode!: ActionMode;
  readonly seTransformations!: SETransformation[];

  private displayExpressionSheetAgain = true;

  get zeroObjects(): boolean {
    return (
      this.seNodules.filter(n => n.exists).length === 0 &&
      this.expressions.length === 0
    );
  }

  get showExpressionSheet(): boolean {
    //This message will appear once each time the number of expressions is zero and the measure circle tool is active
    // console.log("here show expression sheet");
    if (
      (this.actionMode === "measuredCircle" ||
        this.actionMode === "translation" ||
        this.actionMode === "rotation") &&
      this.expressions.length === 0 &&
      this.displayExpressionSheetAgain
    ) {
      this.displayExpressionSheetAgain = false;
      switch (this.actionMode) {
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
      (this.actionMode === "measuredCircle" ||
        this.actionMode === "translation" ||
        this.actionMode === "rotation") &&
      this.expressions.length > 0
    ) {
      this.displayExpressionSheetAgain = true;
    }
    return this.expressions.length > 0;
  }
}
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
