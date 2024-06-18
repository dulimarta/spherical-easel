<template>
  <v-sheet border="md" radius="xl" class="pa-2">
    <v-tooltip bottom max-width="400px">
      <template v-slot:activator="{ props }">
        <v-textarea
          id="__test_textarea"
          v-bind:label="label"
          v-bind="props"
          auto-growdensity="compact"
          variant="outlined"
          clearable
          rows="2"
          :placeholder="placeholder"
          class="ma-0"
          v-model="coordinateExpression"
          :error-messages="parsingError"
          @keydown="onKeyPressed"
          @click:clear="reset"></v-textarea>
      </template>
      {{ tooltip }}
    </v-tooltip>
  </v-sheet>
</template>
<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { ExpressionParser } from "@/expression/ExpressionParser";
import EventBus from "@/eventHandlers/EventBus";
import { storeToRefs } from "pinia";
import { useSEStore } from "@/stores/se";
import { useI18n } from "vue-i18n";
interface TestTValueType {
  val: number;
}
const seStore = useSEStore();
const { seExpressions } = storeToRefs(seStore);
const { t } = useI18n();
const props = defineProps<{
  tooltip: string;
  label: string;
  placeholder: string;
}>();

//v-bind:label="$t(i18nKey,{coord:$tc(i18nKeyOption1,i18nKeyOption2)})"

let parser = new ExpressionParser();

let coordinateExpression = defineModel({ type: String, required: true });
let coordinateResult = 0;

let testTValue = 0;

const parsingError = ref("");
let timerInstance: ReturnType<typeof setTimeout> | null = null;
const varMap = new Map<string, number>();

onMounted((): void => {
  EventBus.listen("measurement-selected", addVarToExpr.bind(this));
  EventBus.listen("test-t-value", setTestTValue);
});
function setTestTValue(obj: TestTValueType): void {
  testTValue = obj.val;
}
function reset(): void {
  coordinateExpression.value = "";
  parsingError.value = "";
}

function addVarToExpr(param: any): void {
  console.debug(
    "Variable selected",
    param,
    "Todo:  only add this variable to the text area/ field that is in focus."
  );
}

function onKeyPressed(): void {
  parsingError.value = "";
  if (timerInstance) clearTimeout(timerInstance);
  timerInstance = setTimeout(() => {
    try {
      seExpressions.value.forEach(m => {
        const measurementName = m.name;
        // console.debug("Measurement", m, measurementName);
        varMap.set(measurementName, m.value);
      });
      // get the tMin value if there is one so that t can be assigned a value otherwise pick t=0 to substitute into the expression
      varMap.set("t", testTValue);
      coordinateResult =
        coordinateExpression.value.length > 0
          ? parser.evaluateWithVars(coordinateExpression.value, varMap)
          : 0;
      // console.debug("Calculation result is", calcResult);
    } catch (err: any) {
      // no code
      // console.debug("Got an error", err);
      const syntaxErr = err as SyntaxError;
      parsingError.value = t(syntaxErr.message, syntaxErr.cause as any);
    }
  }, 1000);
}
</script>
