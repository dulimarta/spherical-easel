<template>
  <div>
    <v-card raised variant="outlined">
      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-textarea
                data-testid="input_expr"
                auto-grow
                density="compact"
                full-width
                variant="outlined"
                clearable
                rows="3"
                v-bind:label="t('calculationExpression')"
                placeholder="cos(pi/2)*M1"
                class="ma-0"
                v-model="calcExpression"
                :error-messages="parsingError"
                @keydown="onKeyPressed"
                @click:clear="reset"></v-textarea>
            </v-col>
          </v-row>
          <v-text-field
            data-testid="output_result"
            density="compact"
            variant="outlined"
            readonly
            v-bind:label="t('result')"
            placeholder="0"
            v-model="calcResult"></v-text-field>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <!--- Disable the FAB when either the expression text is empty or
          there is a syntax error -->
        <v-btn
          data-testid="add_expr"
          size="small"
          fab
          right
          color="accent"
          :disabled="calcExpression.length === 0 || parsingError.length > 0"
          @click="addExpression">
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>
<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { SECalculation } from "@/models/SECalculation";
import { AddCalculationCommand } from "@/commands/AddCalculationCommand";
import { ExpressionParser } from "@/expression/ExpressionParser";
import EventBus from "@/eventHandlers/EventBus";
import { useSEStore } from "@/stores/se";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
const seStore = useSEStore();
const { seExpressions } = storeToRefs(seStore);
const { t } = useI18n();
let parser = new ExpressionParser();

const calcExpression = ref("");

const calcResult = ref(0);
const parsingError = ref("");
let timerInstance: ReturnType<typeof setTimeout> | null = null;
const varMap = new Map<string, number>();

onMounted((): void => {
  EventBus.listen("measurement-selected", addVarToExpr);
});

function reset(): void {
  calcExpression.value = "";
  calcResult.value = 0;
}

function addVarToExpr(param: unknown): void {
  calcExpression.value += param;
  onKeyPressed();
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
      calcResult.value =
        calcExpression.value.length > 0
          ? parser.evaluateWithVars(calcExpression.value, varMap)
          : 0;
    } catch (err: unknown) {
      // console.debug("Got an error", err);
      const syntaxErr = err as SyntaxError;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      parsingError.value = t(syntaxErr.message, syntaxErr.cause as any);
    }
  }, 1000);
}

function addExpression(): void {
  console.debug("Adding expression", calcExpression.value);
  const calc = new SECalculation(calcExpression.value);
  new AddCalculationCommand(
    calc,
    calcExpression.value,
    calc.calculationParents
  ).execute();
  calc.markKidsOutOfDate();
  calc.update();
  reset();
  varMap.clear();
  seExpressions.value.forEach(m => {
    const measurementName = m.name;
    // console.debug("Measurement", m, measurementName);
    varMap.set(measurementName, m.value);
  });
}
</script>
<i18n lang="json" locale="en">
{
  "calculationExpression": "Calculation Expression",
  "result": "Result"
}
</i18n>
