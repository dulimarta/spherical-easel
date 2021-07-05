<template>
  <div>
    <v-text-field v-model="tValueExpression"
      dense
      :label="$t(i18nLabelKey)"
      :placeholder="placeholder"
      :error-messages="parsingError"
      @keydown="onKeyPressed"
      outlined
      clearable
      :hint="currentValueString"
      persistent-hint></v-text-field>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { AppState, UpdateMode } from "@/types";
import { Prop } from "vue-property-decorator";
import { SEExpression } from "@/models/SEExpression";
import { SECalculation } from "@/models/SECalculation";
import { AddCalculationCommand } from "@/commands/AddCalculationCommand";
import { ExpressionParser } from "@/expression/ExpressionParser";
import EventBus from "@/eventHandlers/EventBus";
import SETTINGS from "@/global-settings";
import { namespace } from "vuex-class";
import i18n from "@/i18n";
const SE = namespace("se");

@Component({})
export default class ParametricTValue extends Vue {
  @SE.State((s: AppState) => s.expressions)
  readonly expressions!: SEExpression[];

  @Prop()
  readonly i18nLabelKey!: string;

  @Prop()
  readonly placeholder!: string;

  @Prop()
  readonly name!: string;

  private parser = new ExpressionParser();
  private tValueExpression = "";
  private tValueResult = 0;
  private currentValueString = "";
  private parsingError = "";
  private timerInstance: NodeJS.Timeout | null = null;
  readonly varMap = new Map<string, number>();

  mounted(): void {
    EventBus.listen("measurement-selected", this.addVarToExpr.bind(this));
  }

  reset(): void {
    this.tValueExpression = "";
  }

  addVarToExpr(param: any): void {
    console.debug(
      "Variable selected",
      param,
      "Todo:  only add this varaible to the text area/ field that is in focus."
    );
    // this.calcExpression += param;
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
        this.tValueResult =
          this.tValueExpression.length > 0
            ? this.parser.evaluateWithVars(this.tValueExpression, this.varMap)
            : 0;
        this.currentValueString =
          i18n.t(`objectTree.currentTValue`) +
          this.tValueResult.toFixed(SETTINGS.decimalPrecision);

        EventBus.fire("parametric-data-update", {
          [this.name]: this.tValueExpression
        });
        EventBus.fire("test-t-value", { val: this.tValueResult });

        // console.debug("Calculation result is", this.calcResult);
      } catch (err) {
        // no code
        console.debug("Got an error", err);
        this.parsingError = err.message;
        EventBus.fire("parametric-data-update", {
          [this.name]: ""
        });
        EventBus.fire("test-t-value", { val: 0 });
      }
    }, 1000);
  }
}
</script>