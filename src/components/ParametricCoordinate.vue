<template>
  <div>
    <v-card raised
      outlined>
      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-tooltip bottom
                :open-delay="toolTipOpenDelay"
                :close-delay="toolTipCloseDelay"
                max-width="400px">
                <template v-slot:activator="{on}">
                  <v-textarea v-bind:label="$t(i18nKey)"
                    v-on="on"
                    auto-growdense
                    outlined
                    clearable
                    rows="2"
                    :placeholder="placeholder"
                    class="ma-0"
                    v-model="coordinateExpression"
                    :error-messages="parsingError"
                    @keydown="onKeyPressed"
                    @click:clear="reset">
                  </v-textarea>
                </template>
                {{ $t(i18nToolTip)}}
              </v-tooltip>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
    </v-card>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { AppState } from "@/types";
import { Prop } from "vue-property-decorator";
import { SEExpression } from "@/models/SEExpression";
import { ExpressionParser } from "@/expression/ExpressionParser";
import EventBus from "@/eventHandlers/EventBus";
import { namespace } from "vuex-class";
import SETTINGS from "@/global-settings";
const SE = namespace("se");

interface TestTValueType {
  val: number;
}

@Component({})
export default class ParametricCoordinate extends Vue {
  //v-bind:label="$t(i18nKey,{coord:$tc(i18nKeyOption1,i18nKeyOption2)})"

  @SE.State((s: AppState) => s.expressions)
  readonly expressions!: SEExpression[];

  @Prop()
  readonly i18nToolTip!: string;

  @Prop()
  readonly i18nKey!: string;

  @Prop()
  readonly placeholder!: string;

  @Prop()
  readonly name!: string;

  readonly toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  readonly toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

  private parser = new ExpressionParser();

  private coordinateExpression = "";
  private coordinateResult = 0;

  private testTValue = 0;

  private parsingError = "";
  private timerInstance: NodeJS.Timeout | null = null;
  readonly varMap = new Map<string, number>();

  mounted(): void {
    EventBus.listen("measurement-selected", this.addVarToExpr.bind(this));
    EventBus.listen("test-t-value", this.setTestTValue);
    EventBus.listen("parametric-clear-data", this.reset);
  }
  setTestTValue(obj: TestTValueType): void {
    this.testTValue = obj.val;
  }
  reset(): void {
    this.coordinateExpression = "";
    this.parsingError = "";
  }

  addVarToExpr(param: any): void {
    console.debug(
      "Variable selected",
      param,
      "Todo:  only add this varaible to the text area/ field that is in focus."
    );
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
        // get the tMin value if there is one so that t can be assigned a value otherwise pick t=0 to substitute into the expression
        this.varMap.set("t", this.testTValue);
        this.coordinateResult =
          this.coordinateExpression.length > 0
            ? this.parser.evaluateWithVars(
                this.coordinateExpression,
                this.varMap
              )
            : 0;
        EventBus.fire("parametric-data-update", {
          [this.name]: this.coordinateExpression
        });
        // console.debug("Calculation result is", this.calcResult);
      } catch (err) {
        // no code
        // console.debug("Got an error", err);
        this.parsingError = err.message;
        EventBus.fire("parametric-data-update", {
          [this.name]: ""
        });
      }
    }, 1000);
  }
}
</script>