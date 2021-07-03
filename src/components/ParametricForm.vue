<template>
  <div>
    <v-card raised
      outlined>
      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-sheet rounded
                color="accent"
                :elevation="4"
                class="my-3">
                <ParametricCoordinates
                  i18LabelKey="objectTree.parametricCoordinates"
                  :coordinates="parametricFormula">
                </ParametricCoordinates>
              </v-sheet>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <v-sheet rounded
                color="accent"
                :elevation="4"
                class="my-3">
                <ParametricCoordinates
                  i18LabelKey="objectTree.parametricDerivativeCoordinates"
                  :coordinates="parametricDerivative">
                </ParametricCoordinates>
              </v-sheet>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              Collect tMin and tMax
            </v-col>
          </v-row>
        </v-container>

      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <!--- Disable the FAB when either any expression coordinate text is empty or
          there is a syntax error on any coordinates or no tMin/tMax -->
        <v-btn small
          fab
          right
          color="accent"
          :disabled="calcExpression.length === 0 || parsingError.length > 0"
          @click="addParametricCurve">
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { AppState, UpdateMode } from "@/types";
import { SEExpression } from "@/models/SEExpression";
import { SECalculation } from "@/models/SECalculation";
import { AddCalculationCommand } from "@/commands/AddCalculationCommand";
import { ExpressionParser } from "@/expression/ExpressionParser";
import ParametricCoordinates from "@/components/ParametricCoordinates.vue";
import EventBus from "@/eventHandlers/EventBus";
import { namespace } from "vuex-class";
const SE = namespace("se");

@Component({ ParametricCoordinates })
export default class ParametricForm extends Vue {
  @SE.State((s: AppState) => s.expressions)
  readonly expressions!: SEExpression[];

  private readonly parametricDerivative = [
    {
      i18n_key: "objectTree.parametricXPCoordinate",
      coordinate: "x"
    },
    {
      i18n_key: "objectTree.parametricYPCoordinate",
      coordinate: "y"
    },
    {
      i18n_key: "objectTree.parametricZPCoordinate",
      coordinate: "z"
    }
  ];

  private readonly parametricFormula = [
    {
      i18n_key: "objectTree.parametricXCoordinate",
      coordinate: "x"
    },
    {
      i18n_key: "objectTree.parametricYCoordinate",
      coordinate: "y"
    },
    {
      i18n_key: "objectTree.parametricZCoordinate",
      coordinate: "z"
    }
  ];

  addParametricCurve(): void {
    // console.debug("Adding expression", this.calcExpression);
    // verify unit parametric curve
    // verify P and P' are perpendicular
    // check closed P(tMin)=P(tMax)
    // sample for max number of perpendiculars from any point on the sphere
    // sample for number of tangents from any point on the sphere
    // sample for number of front/back plottable pieces needed

    const para = new SEParametric(this.calcExpression);
    new AddParametricCommand(
      calc,
      this.calcExpression,
      calc.calculationParents
    ).execute();
    para.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
  }
}
</script>