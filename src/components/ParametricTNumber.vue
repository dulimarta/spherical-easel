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
          :label="label"
          :placeholder="placeholder"
          :error-messages="parsingError"
          @keydown="onKeyPressed"
          variant="outlined"
          clearable @click:clear="reset"></v-text-field>
      </template>
      {{ tooltip }}
    </v-tooltip>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { ExpressionParser } from "@/expression/ExpressionParser";
import EventBus from "@/eventHandlers/EventBus";
import { useI18n } from "vue-i18n";
const {t} = useI18n()
const props = defineProps<{
  tooltip: string;
  label: string;
  placeholder: string;
}>();

let parser = new ExpressionParser();
// const tValueExpression = ref("");
let tValueExpression = defineModel<string>({required: true})
let tValueResult = 0;
const parsingError = ref("");
let timerInstance: number | null = null;
const varMap = new Map<string, number>();

onMounted((): void => {
  EventBus.listen("measurement-selected", addVarToExpr);
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

      EventBus.fire("test-t-value", { val: tValueResult });

      // console.debug("Calculation result is", calcResult);
    } catch (err: any) {
      // no code
      const syntaxErr = err as SyntaxError
      console.debug("Got an error", err);
      parsingError.value = t(syntaxErr.message, syntaxErr.cause as any)
      EventBus.fire("test-t-value", { val: 0 });
    }
  }, 1000);
}
</script>
