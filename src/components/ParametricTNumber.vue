<template>
  <div>
    <v-tooltip bottom
      :open-delay="toolTipOpenDelay"
      :close-delay="toolTipCloseDelay"
      max-width="400px">
      <template v-slot:activator="{on}">
        <v-text-field v-model="tValueExpression"
          v-on="on"
          dense
          :label="$t(i18nLabelKey)"
          :placeholder="placeholder"
          :error-messages="parsingError"
          @keydown="onKeyPressed"
          outlined
          clearable></v-text-field>
      </template>
      {{$t(i18nToolTip)}}
    </v-tooltip>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { AppState } from "@/types";
import { Prop } from "vue-property-decorator";
import { ExpressionParser } from "@/expression/ExpressionParser";
import EventBus from "@/eventHandlers/EventBus";
import SETTINGS from "@/global-settings";
import { namespace } from "vuex-class";
import i18n from "@/i18n";
const SE = namespace("se");

@Component({})
export default class ParametricTNumber extends Vue {
  // @SE.State((s: AppState) => s.expressions)
  // readonly expressions!: SEExpression[];

  readonly toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  readonly toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

  @Prop()
  readonly i18nToolTip!: string;

  @Prop()
  readonly i18nLabelKey!: string;

  @Prop()
  readonly placeholder!: string;

  @Prop()
  readonly name!: string;

  private parser = new ExpressionParser();
  private tValueExpression = "";
  private tValueResult = 0;
  private parsingError = "";
  private timerInstance: NodeJS.Timeout | null = null;
  readonly varMap = new Map<string, number>();

  mounted(): void {
    EventBus.listen("measurement-selected", this.addVarToExpr.bind(this));
    EventBus.listen("parametric-clear-data", this.reset);
  }

  reset(): void {
    this.tValueExpression = "";
    this.parsingError = "";
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
        this.tValueResult =
          this.tValueExpression.length > 0
            ? this.parser.evaluate(this.tValueExpression)
            : 0;

        EventBus.fire("parametric-data-update", {
          [this.name]: this.tValueResult
        });

        EventBus.fire("test-t-value", { val: this.tValueResult });

        // console.debug("Calculation result is", this.calcResult);
      } catch (err) {
        // no code
        console.debug("Got an error", err);
        this.parsingError = err.message;
        EventBus.fire("parametric-data-update", {
          [this.name]: NaN
        });
        EventBus.fire("test-t-value", { val: 0 });
      }
    }, 1000);
  }
}
</script>