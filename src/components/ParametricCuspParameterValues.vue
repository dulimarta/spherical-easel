<template>
  <div>
    <v-tooltip
      bottom
      :open-delay="toolTipOpenDelay"
      :close-delay="toolTipCloseDelay"
      max-width="400px">
      <template v-slot:activator="{ props }">
        <v-text-field
          :model-value="tValueExpression"
          v-bind="props"
          dense
          :label="$t(i18nLabelKey)"
          :error-messages="parsingError"
          @keydown="onKeyPressed"
          outlined
          clearable></v-text-field>
      </template>
      {{ $t(i18nToolTip) }}
    </v-tooltip>
  </div>
</template>
<script lang="ts" setup>
import Vue, { onMounted, ref } from "vue";
import { ExpressionParser } from "@/expression/ExpressionParser";
import EventBus from "@/eventHandlers/EventBus";
import SETTINGS from "@/global-settings";

const toolTipOpenDelay = SETTINGS.toolTip.openDelay;
const toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

const props = defineProps<{
  i18nToolTip: string;

  i18nLabelKey: string;

  name: string;
}>();

let parser = new ExpressionParser();
const tValueExpression = ref("");
let tValueResults: number[] = [];
const parsingError = ref("");
let timerInstance: ReturnType<typeof setTimeout> | null = null;

onMounted((): void => {
  EventBus.listen("measurement-selected", addVarToExpr.bind(this));
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
  timerInstance = setTimeout(() => {
    try {
      if (tValueExpression.value.length > 0) {
        tValueResults.splice(0);
        const tValueList = tValueExpression.value.split(",");
        tValueList.forEach((str, ind) => {
          tValueResults[ind] = parser.evaluate(str);
        });
      }
      EventBus.fire("parametric-data-update", {
        name: tValueResults
      });
    } catch (err: any) {
      // no code
      console.debug("Got an error", err);
      parsingError.value = err.message;
    }
  }, 1000);
}
</script>
