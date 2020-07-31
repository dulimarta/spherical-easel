<template>
  <div>
    <v-card raised>
      <v-card-text>
        <v-text-field dense outlined clearable
          label="Calculation Expression" placeholder="cos(pi/2)"
          class="ma-0" v-model="calcExpression"
          :error-messages="parsingError" @keypress="onKeyPressed"
          @click:clear="calcResult = 0"></v-text-field>
        <v-text-field dense outlined readonly label="Result"
          placeholder="0" class="ma-0" v-model.number="calcResult">
        </v-text-field>
      </v-card-text>
      <v-card-actions>
        <!-- <v-spacer></v-spacer> -->
        <!-- <v-btn small fab right><v-icon>mdi-plus</v-icon></v-btn> -->
      </v-card-actions>
    </v-card>
    <div class="pa-0" id="objectTreeContainer">
      <v-sheet rounded color="accent" :elevation="4" class="my-3"
        v-show="points.length > 0">
        <SENoduleTree label="Points" :children="points" :depth="0"
          show-children="true"></SENoduleTree>
      </v-sheet>
      <v-sheet rounded color="accent" :elevation="4" class="my-3"
        v-show="lines.length > 0">
        <SENoduleTree label="Lines" :children="lines" :depth="0"
          show-children="true"></SENoduleTree>
      </v-sheet>
      <v-sheet rounded color="accent" :elevation="4" class="my-3"
        v-show="segments.length > 0">
        <SENoduleTree label="Line Segments" :children="segments" :depth="0"
          show-children="true"></SENoduleTree>
      </v-sheet>
      <v-sheet rounded color="accent" :elevation="4" class="my-3"
        v-show="circles.length > 0">
        <SENoduleTree label="Circles" :children="circles" :depth="0"
          show-children="true"></SENoduleTree>
      </v-sheet>
      <v-sheet rounded color="accent" :elevation="4" class="my-3"
        v-show="measurements.length > 0">
        <SENoduleTree label="Measurements" :children="measurements"
          :depth="0" show-children="true"></SENoduleTree>
      </v-sheet>
      <span class="text-body-2 ma-2" v-show="zeroObjects">
        No objects in database
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { State } from "vuex-class";

import SENoduleTree from "@/components/SENoduleTree.vue";
import { SENodule } from "@/models/SENodule";
import { ExpressionParser } from "@/expression/ExpressionParser";
import { SEMeasurement } from "@/models/SEMeasurement";
import { SELength } from '@/models/SELength';

@Component({ components: { SENoduleTree } })
export default class ObjectTree extends Vue {
  // private selectedPoint: SEPoint | null = null;
  // private selectedObject: SENodule | null = null;
  // private selection = [];
  private parser = new ExpressionParser();

  @State
  readonly points!: SENodule[];

  @State
  readonly lines!: SENodule[];

  @State
  readonly segments!: SENodule[];

  @State
  readonly circles!: SENodule[];

  @State
  readonly nodules!: SENodule[];

  @State
  readonly measurements!: SEMeasurement[];

  private calcExpression = "";

  private calcResult = 0;
  private parsingError = "";
  private timerInstance: NodeJS.Timeout | null = null;
  readonly varMap = new Map<string, number>();
  get zeroObjects(): boolean {
    return this.nodules.filter(n => n.exists).length === 0;
  }

  calculateExpression(): void {
    this.varMap.clear();
    console.debug("Calc me!")
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
    this.parsingError = ""
    if (this.timerInstance) clearTimeout(this.timerInstance);
    this.timerInstance = setTimeout(() => {
      try {
        this.varMap.clear();
        console.debug("Calc me!")
        this.measurements.forEach((m: SEMeasurement) => {
          const measurementName = m.name;
          console.debug("Measurement", m, measurementName)
          this.varMap.set(measurementName.replace(/-.+/, ""), m.value);
        });
        console.debug("Variable map", this.varMap)
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
}
</script>

<style lang="scss">
#objectTreeContainer {
  padding: 0;
  width: 100%;
  max-height: 60vh;
  overflow: scroll;
}
.nodeGroup {
  border: 2px solid red;
}
</style>
