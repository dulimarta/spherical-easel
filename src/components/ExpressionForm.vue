<template>
  <div>
    <v-card raised
      outlined>
      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-textarea id="_test_input_expr"
                auto-grow
                dense
                full-width
                outlined
                clearable
                rows="3"
                v-bind:label="$t('objectTree.calculationExpression')"
                placeholder="cos(pi/2)*M1"
                class="ma-0"
                v-model="calcExpression"
                :error-messages="parsingError"
                @keydown="onKeyPressed"
                @click:clear="reset">
              </v-textarea>

            </v-col>
          </v-row>
          <v-text-field id="_test_output_result"
            dense
            outlined
            readonly
            v-bind:label="$t('objectTree.result')"
            placeholder="0"
            v-model="calcResult">
          </v-text-field>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <!--- Disable the FAB when either the expression text is empty or
          there is a syntax error -->
        <v-btn id="_test_add_expr"
          small
          fab
          right
          color="accent"
          :disabled="calcExpression.length === 0 || parsingError.length > 0"
          @click="addExpression">
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { AppState } from "@/types";
import { SEExpression } from "@/models/SEExpression";
import { SECalculation } from "@/models/SECalculation";
import { AddCalculationCommand } from "@/commands/AddCalculationCommand";
import { ExpressionParser } from "@/expression/ExpressionParser";
import EventBus from "@/eventHandlers/EventBus";
import { namespace } from "vuex-class";
const SE = namespace("se");

@Component({})
export default class ExpressionForm extends Vue {
  @SE.State((s: AppState) => s.expressions)
  readonly expressions!: SEExpression[];

  private parser = new ExpressionParser();

  private calcExpression = "";

  private calcResult = 0;
  private parsingError = "";
  private timerInstance: NodeJS.Timeout | null = null;
  readonly varMap = new Map<string, number>();

  mounted(): void {
    EventBus.listen("measurement-selected", this.addVarToExpr.bind(this));
  }

  reset(): void {
    this.calcExpression = "";
    this.calcResult = 0;
  }

  addVarToExpr(param: any): void {
    console.debug("Variable selected", param);
    this.calcExpression += param;
    this.onKeyPressed();
  }

  onKeyPressed(): void {
    // console.debug("Key press");
    this.parsingError = "";
    if (this.timerInstance) clearTimeout(this.timerInstance);
    this.timerInstance = setTimeout(() => {
      try {
        this.expressions.forEach((m: SEExpression) => {
          const measurementName = m.name;
          // console.debug("Measurement", m, measurementName);
          this.varMap.set(measurementName, m.value);
        });
        // console.debug(
        //   "Calc ",
        //   this.calcExpression,
        //   "using parser",
        //   this.parser,
        //   "var map",
        //   this.varMap
        // );
        this.calcResult =
          this.calcExpression.length > 0
            ? this.parser.evaluateWithVars(this.calcExpression, this.varMap)
            : 0;
        // console.debug("Calculation result is", this.calcResult);
      } catch (err) {
        // no code
        // console.debug("Got an error", err);
        this.parsingError = err.message;
      }
    }, 1000);
  }

  addExpression(): void {
    // console.debug("Adding expression", this.calcExpression);
    const calc = new SECalculation(this.calcExpression);
    new AddCalculationCommand(
      calc,
      this.calcExpression,
      calc.calculationParents
    ).execute();
    calc.markKidsOutOfDate();
    calc.update();
    this.reset();
    this.varMap.clear();
    this.expressions.forEach((m: SEExpression) => {
      const measurementName = m.name;
      // console.debug("Measurement", m, measurementName);
      this.varMap.set(measurementName, m.value);
    });
  }
}
</script>