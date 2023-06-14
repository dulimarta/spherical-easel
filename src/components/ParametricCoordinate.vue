<template>
  <div>
    <v-card raised variant="outlined">
      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-tooltip
                bottom
                :open-delay="toolTipOpenDelay"
                :close-delay="toolTipCloseDelay"
                max-width="400px">
                <template v-slot:activator="{ props }">
                  <v-textarea
                    v-bind:label="$t(i18nKey)"
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
                    @click:clear="reset">
                  </v-textarea>
                </template>
                {{ $t(i18nToolTip) }}
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
import { SEExpression } from "@/models/SEExpression";
import { ExpressionParser } from "@/expression/ExpressionParser";
import EventBus from "@/eventHandlers/EventBus";
import SETTINGS from "@/global-settings";
import { storeToRefs } from "pinia";
import { useSEStore } from "@/stores/se";

interface TestTValueType {
  val: number;
}

const seStore = useSEStore();
const { expressions } = storeToRefs(seStore);
const props = defineProps<{
  i18nToolTip: string;
  i18nKey: string;
  placeholder: string;
  name: string;
}>();

//v-bind:label="$t(i18nKey,{coord:$tc(i18nKeyOption1,i18nKeyOption2)})"
const toolTipOpenDelay = SETTINGS.toolTip.openDelay;
const toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

let parser = new ExpressionParser();

const coordinateExpression = ref("");
let coordinateResult = 0;

let testTValue = 0;

const parsingError = ref("");
let timerInstance: ReturnType<typeof setTimeout> | null = null;
const varMap = new Map<string, number>();

onMounted((): void => {
  EventBus.listen("measurement-selected", addVarToExpr.bind(this));
  EventBus.listen("test-t-value", setTestTValue);
  EventBus.listen("parametric-clear-data", reset);
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
  // console.debug("Key press");
  parsingError.value = "";
  if (timerInstance) clearTimeout(timerInstance);
  timerInstance = setTimeout(() => {
    try {
      expressions.value.forEach((m: SEExpression) => {
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
      EventBus.fire("parametric-data-update", {
        name: coordinateExpression.value
      });
      // console.debug("Calculation result is", calcResult);
    } catch (err: any) {
      // no code
      // console.debug("Got an error", err);
      parsingError.value = err.message;
      EventBus.fire("parametric-data-update", {
        name: ""
      });
    }
  }, 1000);
}
</script>
