<template>
  <div>
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
                v-bind:label="$t('objectTree.calculationExpression')"
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
            v-bind:label="$t('objectTree.result')"
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
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import { State } from "vuex-class";
import Component from "vue-class-component";
import { AppState } from "@/types";
import { SEMeasurement } from "@/models/SEMeasurement";
import { SECalculation } from "@/models/SECalculation";
import { AddExpressionCommand } from "@/commands/AddExpressionCommand";
import { ExpressionParser } from "@/expression/ExpressionParser";
import EventBus from "@/eventHandlers/EventBus";

@Component({})
export default class ExpressionForm extends Vue {
  @State((s: AppState) => s.expressions)
  readonly expressions!: SEMeasurement[];

  private parser = new ExpressionParser();

  private calcExpression = "";

  private calcResult = 0;
  private parsingError = "";
  private timerInstance: NodeJS.Timeout | null = null;
  readonly varMap = new Map<string, number>();

  mounted(): void {
    console.debug("Setting up listener for measuremeent-selected");
    EventBus.listen("measurement-selected", this.addVarToExpr.bind(this));
  }

  addVarToExpr(param: any): void {
    console.debug("Variable selected", param);
    this.calcExpression += param;
  }
  onKeyPressed(): void {
    console.debug("Key press");
    this.parsingError = "";
    if (this.timerInstance) clearTimeout(this.timerInstance);
    this.timerInstance = setTimeout(() => {
      try {
        this.varMap.clear();
        console.debug("Calc me!");
        this.expressions.forEach((m: SEMeasurement) => {
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
    console.debug("Adding expression", this.calcExpression);
    const calc = new SECalculation(this.calcExpression);
    new AddExpressionCommand(calc).execute();
  }
}
</script>