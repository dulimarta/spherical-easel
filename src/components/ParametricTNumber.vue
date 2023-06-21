<template>
  <div>
    <v-tooltip
      bottom
      max-width="400px">
      <template v-slot:activator="{ props }">
        <v-text-field
          v-model="tValueExpression"
          v-bind="props"
          density="compact"
          :label="$t(i18nLabelKey)"
          :placeholder="placeholder"
          :error-messages="parsingError"
          @keydown="onKeyPressed"
          variant="outlined"
          clearable></v-text-field>
      </template>
      {{ $t(i18nToolTip) }}
    </v-tooltip>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { ExpressionParser } from "@/expression/ExpressionParser";
import EventBus from "@/eventHandlers/EventBus";
import SETTINGS from "@/global-settings";

const props = defineProps<{
  i18nToolTip: string;
  i18nLabelKey: string;
  placeholder: string;
  name: string;
}>();

let parser = new ExpressionParser();
const tValueExpression = ref("");
let tValueResult = 0;
const parsingError = ref("");
let timerInstance: number | null = null;
const varMap = new Map<string, number>();

onMounted((): void => {
  EventBus.listen("measurement-selected", addVarToExpr);
  EventBus.listen("parametric-clear-data", reset);
});

function reset(): void {
  tValueExpression.value = "";
  parsingError.value = "";
}

function addVarToExpr(param: any): void {
  console.debug(
    "Variable selected",
    param,
    "Todo:  only add this varaible to the text area/ field that is in focus."
  );
  // calcExpression += param;
  onKeyPressed();
}

function onKeyPressed(): void {
  // console.debug("Key press");
  parsingError.value = "";
  if (timerInstance) clearTimeout(timerInstance);
  timerInstance = window.setTimeout(() => {
    try {
      tValueResult =
        tValueExpression.value.length > 0
          ? parser.evaluate(tValueExpression.value)
          : 0;

      EventBus.fire("parametric-data-update", {
        [props.name]: tValueResult
      });

      EventBus.fire("test-t-value", { val: tValueResult });

      // console.debug("Calculation result is", calcResult);
    } catch (err: any) {
      // no code
      console.debug("Got an error", err);
      parsingError.value = err.message;
      EventBus.fire("parametric-data-update", {
        [props.name]: NaN
      });
      EventBus.fire("test-t-value", { val: 0 });
    }
  }, 1000);
}
</script>
