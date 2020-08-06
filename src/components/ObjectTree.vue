<template>
  <div>
    <!-- this top level div is required, otherwise the style applied to id="topContainer" does not work -->
    <div id="topContainer">

      <v-card raised
        outlined>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-textarea auto-grow
                  dense
                  full-width
                  outlined
                  clearable
                  rows="3"
                  label="Calculation Expression"
                  placeholder="cos(pi/2)"
                  class="ma-0"
                  v-model="calcExpression"
                  :error-messages="parsingError"
                  @keypress="onKeyPressed"
                  @click:clear="calcResult = 0">
                </v-textarea>

              </v-col>
            </v-row>
            <v-text-field dense
              outlined
              readonly
              label="Result"
              placeholder="0"
              v-model.number="calcResult">
            </v-text-field>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <!--- Disable the FAB when either the expression text is empty or
          there is a syntax error -->
          <v-btn small
            fab
            right
            color="accent"
            :disabled="calcExpression.length === 0 || parsingError.length > 0"
            @click="addExpression">
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </v-card-actions>
      </v-card>

      <div class="ma-2 pa-1"
        id="objectTreeContainer">
        <v-sheet rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="points.length > 0">
          <SENoduleList label="Points"
            :children="points"
            :depth="0"
            show-children="true"></SENoduleList>
        </v-sheet>
        <v-sheet rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="lines.length > 0">
          <SENoduleList label="Lines"
            :children="lines"
            :depth="0"
            show-children="true"></SENoduleList>
        </v-sheet>
        <v-sheet rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="segments.length > 0">
          <SENoduleList label="Line Segments"
            :children="segments"
            :depth="0"
            show-children="true"></SENoduleList>
        </v-sheet>
        <v-sheet rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="circles.length > 0">
          <SENoduleList label="Circles"
            :children="circles"
            :depth="0"
            show-children="true"></SENoduleList>
        </v-sheet>
        <!--v-sheet rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="measurements.length > 0"-->
        <SENoduleList label="Measurements"
          :children="measurements"
          v-on:object-select="onExpressionSelect"
          :depth="0"
          show-children="true"></SENoduleList>
        <!--/v-sheet-->
        <v-sheet rounded
          color="accent"
          :elevation="4"
          class="my-3"
          v-show="calculations.length > 0">
          <SENoduleList label="Calculations"
            :children="calculations"
            @object-select="onExpressionSelect"
            :depth="0"
            show-children="true"></SENoduleList>
        </v-sheet>
        <span class="text-body-2 ma-2"
          v-show="zeroObjects">
          No objects in database
        </span>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { State } from "vuex-class";

import SENoduleList from "@/components/SENoduleList.vue";
import { SENodule } from "@/models/SENodule";
import { ExpressionParser } from "@/expression/ExpressionParser";
import { SEMeasurement } from "@/models/SEMeasurement";
// import { SELength } from '@/models/SELength';
import { SECalculation } from "@/models/SECalculation";
import { AddCalculationCommand } from "@/commands/AddCalculationCommand";
import { AppState } from "@/types";

@Component({ components: { SENoduleList } })
export default class ObjectTree extends Vue {
  // private selectedPoint: SEPoint | null = null;
  // private selectedObject: SENodule | null = null;
  // private selection = [];
  private parser = new ExpressionParser();

  @State((s: AppState) => s.sePoints)
  readonly points!: SENodule[];

  @State((s: AppState) => s.seLines)
  readonly lines!: SENodule[];

  @State((s: AppState) => s.seSegments)
  readonly segments!: SENodule[];

  @State((s: AppState) => s.seCircles)
  readonly circles!: SENodule[];

  @State((s: AppState) => s.seNodules)
  readonly nodules!: SENodule[];

  @State((s: AppState) => s.measurements)
  readonly measurements!: SEMeasurement[];

  @State((s: AppState) => s.calculations)
  readonly calculations!: SECalculation[];

  private calcExpression = "";

  private calcResult = 0;
  private parsingError = "";
  private timerInstance: NodeJS.Timeout | null = null;
  readonly varMap = new Map<string, number>();

  get zeroObjects(): boolean {
    return (
      this.nodules.filter(n => n.exists).length === 0 &&
      this.calculations.length === 0
    );
  }

  calculateExpression(): void {
    this.varMap.clear();
    console.debug("Calc me!");
    // this.measurements.forEach((m: SEMeasurement) => {
    //   console.debug("Measurement", m)
    //   const measurementName = m.name.replace("-", "");
    //   this.varMap.set(measurementName, m.value);
    // });
    // console.debug("Variable map", this.varMap)
    try {
      // no code
      this.calcResult =
        this.calcExpression.length > 0
          ? this.parser.evaluateWithVars(this.calcExpression, this.varMap)
          : 0;
    } catch (err) {
      // no code
      console.debug("Got an error", err);
      this.parsingError = err.message;
    }
  }

  onKeyPressed(): void {
    console.debug("Key press");
    this.parsingError = "";
    if (this.timerInstance) clearTimeout(this.timerInstance);
    this.timerInstance = setTimeout(() => {
      try {
        this.varMap.clear();
        console.debug("Calc me!");
        this.measurements.forEach((m: SEMeasurement) => {
          const measurementName = m.name;
          console.debug("Measurement", m, measurementName);
          this.varMap.set(measurementName.replace(/-.+/, ""), m.value);
        });
        console.debug("Variable map", this.varMap);
        // no code
        this.calcResult =
          this.calcExpression.length > 0
            ? this.parser.evaluateWithVars(this.calcExpression, this.varMap)
            : 0;
      } catch (err) {
        // no code
        // console.debug("Got an error", err);
        this.parsingError = err.message;
      }
    }, 1000);
  }

  addExpression(): void {
    console.debug("Adding experssion", this.calcExpression);
    const calc = new SECalculation(this.calcExpression);
    new AddCalculationCommand(calc).execute();
  }

  onExpressionSelect(x: any): void {
    // console.debug("****Selection", x);
    const pos = this.nodules.findIndex(n => n.id === x.id);
    if (pos >= 0) {
      const pos1 = this.nodules[pos].name.indexOf("-");
      const varName = this.nodules[pos].name.substring(0, pos1);
      this.calcExpression += varName;
      this.onKeyPressed(); // emulate a key prress
    }
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
