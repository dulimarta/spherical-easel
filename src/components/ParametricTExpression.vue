<template>
  <div>
    <v-card raised variant="outlined">
      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-tooltip
                bottom
                max-width="400px">
                <template v-slot:activator="{ props }">
                  <v-text-field
                    v-model="tValueExpression"
                    v-bind="props"
                    density="compact"
                    :label="label"
                    :placeholder="placeholder"
                    :error-messages="parsingError"
                    @keydown="onKeyPressed"
                    variant="outlined"
                    clearable
                    :hint="currentValueString"
                    persistent-hint></v-text-field>
                </template>
                {{ tooltip }}
              </v-tooltip>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
    </v-card>
  </div>
</template>
<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { ExpressionParser } from "@/expression/ExpressionParser";
import EventBus from "@/eventHandlers/EventBus";
import SETTINGS from "@/global-settings";
// import i18n from "@/i18n";
import { storeToRefs } from "pinia";
import { useSEStore } from "@/stores/se";
import { useI18n } from "vue-i18n";
const seStore = useSEStore();
const { seExpressions } = storeToRefs(seStore);
const {t} = useI18n()

const props = defineProps<{
  tooltip: string;
  label: string;
  placeholder: string;
  name: string;
}>();

let parser = new ExpressionParser();
const tValueExpression = ref("");
let tValueResult = 0;
const currentValueString = ref("");
const parsingError = ref("");
let timerInstance: ReturnType<typeof setTimeout> | null = null;
const varMap = new Map<string, number>();

onMounted((): void => {
  EventBus.listen("measurement-selected", addVarToExpr);
  EventBus.listen("parametric-clear-data", reset);
});

function reset(): void {
  tValueExpression.value = "";
  currentValueString.value = "";
  parsingError.value = "";
}

function addVarToExpr(param: any): void {
  console.debug(
    "Variable selected",
    param,
    "Todo:  only add this variable to the text area/ field that is in focus."
  );
  // this.calcExpression += param;
  onKeyPressed();
}

function onKeyPressed(): void {
  // console.debug("Key press");
  parsingError.value = "";
  if (timerInstance) clearTimeout(timerInstance);
  timerInstance = setTimeout(() => {
    try {
      seExpressions.value.forEach((m) => {
        const measurementName = m.name;
        // console.debug("Measurement", m, measurementName);
        varMap.set(measurementName, m.value);
      });
      // console.debug(
      //   "Calc ",
      //   this.calcExpression,
      //   "using parser",
      //   this.parser,
      //   "var map",
      //   this.varMap
      // );
      tValueResult =
        tValueExpression.value.length > 0
          ? parser.evaluateWithVars(tValueExpression.value, varMap)
          : 0;
      currentValueString.value =
        t(`currentTValue`) +
        tValueResult.toFixed(SETTINGS.decimalPrecision);

      EventBus.fire("parametric-data-update", {
        [props.name]: tValueExpression.value
      });

      // console.debug("Calculation result is", this.calcResult);
    } catch (err: any) {
      // no code
      console.debug("Got an error", err);
      parsingError.value = err.message;
      EventBus.fire("parametric-data-update", {
        [props.name]: ""
      });
      EventBus.fire("test-t-value", { val: 0 });
    }
  }, 1000);
}
</script>
