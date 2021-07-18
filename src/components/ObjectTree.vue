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
          v-show="points.length > 0">
          <SENoduleList i18LabelKey="objects.points"
            :children="points"></SENoduleList>
        </v-sheet>
        <v-sheet rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="lines.length > 0">
          <SENoduleList i18LabelKey="objects.lines"
            :children="lines"></SENoduleList>
        </v-sheet>
        <v-sheet rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="segments.length > 0">
          <SENoduleList i18LabelKey="objects.segments"
            :children="segments"></SENoduleList>
        </v-sheet>
        <v-sheet rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="circles.length > 0">
          <SENoduleList i18LabelKey="objects.circles"
            :children="circles"></SENoduleList>
        </v-sheet>
        <v-sheet rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="ellipses.length > 0">
          <SENoduleList i18LabelKey="objects.ellipses"
            :children="ellipses"></SENoduleList>
        </v-sheet>
        <v-sheet rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="parametrics.length > 0">
          <SENoduleList i18LabelKey="objects.parametrics"
            :children="parametrics"></SENoduleList>
        </v-sheet>
        <v-sheet rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="expressions.length > 0">
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

import SENoduleList from "@/components/SENoduleList.vue";
import { SENodule } from "@/models/SENodule";
import ExpressionForm from "@/components/ExpressionForm.vue";
import ParametricForm from "@/components/ParametricForm.vue";
import SliderForm from "@/components/SliderForm.vue";
import { AppState } from "@/types";
import { SEExpression } from "@/models/SEExpression";
import { namespace } from "vuex-class";
const SE = namespace("se");

@Component({
  components: { SENoduleList, ExpressionForm, ParametricForm, SliderForm }
})
export default class ObjectTree extends Vue {
  @SE.State((s: AppState) => s.sePoints)
  readonly points!: SENodule[];

  @SE.State((s: AppState) => s.seLines)
  readonly lines!: SENodule[];

  @SE.State((s: AppState) => s.seSegments)
  readonly segments!: SENodule[];

  @SE.State((s: AppState) => s.seCircles)
  readonly circles!: SENodule[];

  @SE.State((s: AppState) => s.seEllipses)
  readonly ellipses!: SENodule[];

  @SE.State((s: AppState) => s.seParametrics)
  readonly parametrics!: SENodule[];

  @SE.State((s: AppState) => s.seNodules)
  readonly nodules!: SENodule[];

  @SE.State((s: AppState) => s.expressions)
  readonly expressions!: SEExpression[];

  get zeroObjects(): boolean {
    return (
      this.nodules.filter(n => n.exists).length === 0 &&
      this.expressions.length === 0
    );
  }

  // calculateExpression(): void {
  // this.varMap.clear();
  // try {
  //   // no code
  //   this.calcResult =
  //     this.calcExpression.length > 0
  //       ? this.parser.evaluateWithVars(this.calcExpression, this.varMap)
  //       : 0;
  // } catch (err) {
  //   this.parsingError = err.message;
  // }
  // }
  // when the user clicks on an expression, this event is triggered
  // It enables the user to add measurement references to the calculation/expression builder
  // onExpressionSelect(x: any): void {
  //   console.debug("bob");
  //   const pos = this.nodules.findIndex(n => n.id === x.id);
  //   console.debug("****Selection", x, "at", pos);
  //   if (pos >= 0) {
  //     const pos1 = this.nodules[pos].name.indexOf("-");
  //     const varName = this.nodules[pos].name.substring(0, pos1);
  //     EventBus.fire("measurement-selected", varName);
  //     // this.calcExpression += varName;
  //     // this.onKeyPressed(); // emulate a key prress
  //   }
  // }
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
