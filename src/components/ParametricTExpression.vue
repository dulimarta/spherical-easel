<template>
    <v-tooltip bottom max-width="400px">
      <template v-slot:activator="{ props }">
        <v-text-field
          id="__test_textfield"
          v-model="tValueExpression"
          v-bind="props"
          :label="label"
          :placeholder="placeholder"
          :error-messages="parsingError"
          :hint="currentValueString"
          persistent-hint
          density="compact"
          variant="outlined"
          clearable
          @keydown="onKeyPressed"
          @click:clear="reset"></v-text-field>
      </template>
      {{ tooltip }}
    </v-tooltip>
</template>
<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { ExpressionParser } from "@/expression/ExpressionParser";
import EventBus from "@/eventHandlers/EventBus";
import SETTINGS from "@/global-settings";
import { storeToRefs } from "pinia";
import { useSEStore } from "@/stores/se";
import { useI18n } from "vue-i18n";
const seStore = useSEStore();
const { seExpressions } = storeToRefs(seStore);
const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    tooltip: string;
    label: string;
    placeholder: string;
    // expression should contain only constansts, no variables allowed
    constExpr?: boolean;
  }>(),
  { constExpr: false }
);

let parser = new ExpressionParser();
let tValueExpression = defineModel<string>({ required: true, default: "0" });
let tValueResult = 0;
const currentValueString = ref("");
const parsingError = ref("");
let timerInstance: ReturnType<typeof setTimeout> | null = null;
const varMap = new Map<string, number>();

onMounted((): void => {
  EventBus.listen("measurement-selected", addVarToExpr);
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
      if (props.constExpr) {
        tValueResult =
          tValueExpression.value.length > 0
            ? parser.evaluate(tValueExpression.value)
            : 0;
      } else {
        seExpressions.value.forEach(m => {
          const measurementName = m.name;
          // console.debug("Measurement", m, measurementName);
          varMap.set(measurementName, m.value);
        });
        tValueResult =
          tValueExpression.value.length > 0
            ? parser.evaluateWithVars(tValueExpression.value, varMap)
            : 0;
      }
      // console.debug(
      //   "Calc ",
      //   this.calcExpression,
      //   "using parser",
      //   this.parser,
      //   "var map",
      //   this.varMap
      // );
      currentValueString.value =
        t(`currentTValue`) + tValueResult.toFixed(SETTINGS.decimalPrecision);

      // console.debug("Calculation result is", this.calcResult);
    } catch (err: any) {
      // no code
      const syntaxErr = err as SyntaxError;
      parsingError.value = t(syntaxErr.message, syntaxErr.cause as any);
      EventBus.fire("test-t-value", { val: 0 });
    }
  }, 1000);
}
</script>
