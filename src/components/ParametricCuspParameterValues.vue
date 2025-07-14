<template>
  <v-tooltip bottom max-width="400px">
    <template v-slot:activator="{ props }">
      <v-text-field
        data-testid="textfield"
        v-model="tValueExpression"
        v-bind="props"
        density="compact"
        :label="label"
        :error-messages="parsingError"
        @keydown="onKeyPressed"
        variant="outlined"
        clearable
        @click:clear="reset"></v-text-field>
    </template>
    {{ tooltip }}
  </v-tooltip>
</template>
<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { ExpressionParser } from "@/expression/ExpressionParser";
import EventBus from "@/eventHandlers/EventBus";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

const props = defineProps<{
  tooltip: string;
  label: string;
}>();

let parser = new ExpressionParser();
let tValueExpression = defineModel<string>({ required: true });
let tValueResults: number[] = [];
const parsingError = ref("");
let timerInstance: ReturnType<typeof setTimeout> | null = null;

onMounted((): void => {
  EventBus.listen("measurement-selected", addVarToExpr.bind(this));
});

function reset(): void {
  tValueExpression.value = "";
  parsingError.value = "";
}

function addVarToExpr(param: unknown): void {
  console.debug(
    "Variable selected",
    param,
    "Todo:  only add this variable to the text area/ field that is in focus."
  );
  // calcExpression += param;
  onKeyPressed();
}

function onKeyPressed(): void {
  // console.debug("Key press");
  parsingError.value = "";
  if (timerInstance) clearTimeout(timerInstance);
  timerInstance = setTimeout(() => {
    try {
      if (tValueExpression.value.length > 0) {
        tValueResults.splice(0);
        const tValueList = tValueExpression.value.split(",");
        tValueList.forEach(str => {
          tValueResults.push(parser.evaluate(str));
        });
      }
    } catch (err: unknown) {
      // no code
      const syntaxErr = err as SyntaxError;
      // console.debug("Got an error", err);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      parsingError.value = t(syntaxErr.message, syntaxErr.cause as any);
    }
  }, 1000);
}
</script>
