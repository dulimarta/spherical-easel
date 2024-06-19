<template>
  <div>
    <v-card raised variant="outlined">
      <v-card-text>
        <v-container>
          <v-row v-if="!inProductionMode">
            Keyboard shortcuts:
            <ul>
              <li>Ctrl-Alt-C: Circle</li>
              <li>Ctrl-Alt-S: Spiral</li>
              <li>Ctrl-Alt-T: Trochoid</li>
              <li>Ctrl-Alt-Y: Cycloid with cusp points</li>
              <li>Ctrl-Alt-E: Ellipse (M1 & M2)</li>
              <li>Ctrl-Alt-L: Loxodrome (M1)</li>
              <li>Ctrl-Alt-R: Cardioid (M1)</li>
            </ul>
          </v-row>
          <v-row>
            <v-col cols="12">
              <v-sheet rounded color="accent" :elevation="4" class="my-3">
                <ParametricCoordinates
                  v-model="xyzFormulaInput"
                  :use-t-value="testTValue"
                  :label="t('parametricCoordinates')"
                  :coordinateData="
                    parametricFormulaData
                  "></ParametricCoordinates>
              </v-sheet>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <v-sheet rounded color="accent" :elevation="4" class="my-3">
                <ParametricTracingExpressions
                  v-model="tracingExpressionsInput"
                  :label="t('tExpressionData')"
                  :tExpressionData="
                    tExpressionData
                  "></ParametricTracingExpressions>
              </v-sheet>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12">
              <template v-for="(tVal, idk) in tNumberData" :key="idk">
                <!-- Use const-expr property for "No variables" -->
                <ParametricTExpression
                v-model="tNumbersInput[idk]"
                  :placeholder="tVal.placeholder"
                  :label="tVal.label"
                  const-expr
                  :tooltip="tVal.tooltip"></ParametricTExpression>
              </template>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <ParametricCuspParameterValues
                v-model="cuspInput"
                :label="cusp.label"
                :tooltip="cusp.tooltip"></ParametricCuspParameterValues>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <!--- Disable the FAB when either any expression coordinate  or tMin/tMax text is empty or
          there is a syntax error on any coordinates or tMin/tMax -->
        <v-btn
          size="small"
          fab
          right
          color="accent"
          :disabled="disableAddParametricButton"
          @click="addParametricCurve">
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>
<script lang="ts" setup>
import {
  computed,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from "vue";
import {
  CoordExpression,
  MinMaxExpression,
  MinMaxNumber,
  SEIntersectionReturnType
} from "@/types";
import { SEExpression } from "@/models/SEExpression";
import { ExpressionParser } from "@/expression/ExpressionParser";
import ParametricCoordinates from "@/components/ParametricCoordinates.vue";
import ParametricTracingExpressions from "@/components/ParametricTracingExpressions.vue";
import ParametricTExpression from "@/components/ParametricTExpression.vue";
import ParametricCuspParameterValues from "@/components/ParametricCuspParameterValues.vue";
import EventBus from "@/eventHandlers/EventBus";
import SETTINGS from "@/global-settings";
import { Vector3 } from "three";
import { SELabel } from "@/models/SELabel";
import { SEParametric } from "@/models/SEParametric";
import { CommandGroup } from "@/commands/CommandGroup";
import { AddParametricCommand } from "@/commands/AddParametricCommand";
import { AddParametricEndPointsCommand } from "@/commands/AddParametricEndPointsCommand";
import { AddParametricTracePointCommand } from "@/commands/AddParametricTracePointCommand";
import { SEParametricEndPoint } from "@/models/SEParametricEndPoint";
import { AddIntersectionPointCommand } from "@/commands/AddIntersectionPointCommand";
import { SEParametricTracePoint } from "@/models/SEParametricTracePoint";
import { storeToRefs } from "pinia";
import { useSEStore } from "@/stores/se";
import { AddIntersectionPointOtherParent } from "@/commands/AddIntersectionPointOtherParent";
import { SEPoint } from "@/models/SEPoint";
import { AddAntipodalPointCommand } from "@/commands/AddAntipodalPointCommand";
import { SEAntipodalPoint } from "@/models/SEAntipodalPoint";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
// interface ParametricDataType {
//   tMinNumber?: number;
//   tMaxNumber?: number;
//   tMinExpression?: string;
//   tMaxExpression?: string;
//   xCoord?: string;
//   yCoord?: string;
//   zCoord?: string;
//   cuspParameterValues?: number[];
// }

const seStore = useSEStore();
const { seExpressions, seParametrics } = storeToRefs(seStore);
/**
 * These are string expressions that once set define the Parametric curve
 */
let coordinateExpressions: CoordExpression = { x: "", y: "", z: "" };
let tExpressions: MinMaxExpression = { min: "", max: "" };
let tNumbers: MinMaxNumber = { min: NaN, max: NaN };
let c1DiscontinuityParameterValues: number[] = [];
const testTValue = ref(0)
const xyzFormulaInput = ref(["", "", ""]);
const tNumbersInput = ref(["", ""]);
const tracingExpressionsInput = ref(["", ""]);
const cuspInput = ref("");
let parser = new ExpressionParser();
const varMap = new Map<string, number>();
const tempVector = new Vector3();
const tempVector1 = new Vector3();

const tExpressionData = [
  {
    label: t("tMinExpression"),
    tooltip: t("tMinExpressionTip"),
    placeholder: "0",
    // name: t("tMinExpression")
  },
  {
    label: t("tMaxExpression"),
    tooltip: t("tMaxExpressionTip"),
    placeholder: "2*M1",
    // name: t("tMaxExpression")
  }
];

const tNumberData = [
  {
    label: t("tMinNumber"),
    tooltip: t("tMinNumberTip"),
    placeholder: "0",
    // name: "tMinNumber"
  },
  {
    label: t("tMaxNumber"),
    tooltip: t("tMaxNumberTip"),
    placeholder: "2*pi",
    // name: "tMaxNumber"
  }
];

const parametricFormulaData = [
  {
    label: t("xParametricCoordinate"),
    tooltip: t("xCoordExpressionTip"),
    placeholder: "sin(M1)*cos(t)",
    // name: "xCoord"
  },
  {
    label: t("yParametricCoordinate"),
    tooltip: t("yCoordExpressionTip"),
    placeholder: "sin(M1)*sin(t)",
    // name: "yCoord"
  },
  {
    label: t("zParametricCoordinate"),
    tooltip: t("zCoordExpressionTip"),
    placeholder: "cos(M1)",
    // name: "zCoord"
  }
];

const cusp = {
  label: t("cuspParameterValues"),
  tooltip: t("cuspParameterValuesTip"),
  // name: "cuspParameterValues"
};

onBeforeMount((): void => {
  window.addEventListener("keydown", keyHandler);
});

watch(
  [
    () => xyzFormulaInput.value,
    () => tNumbersInput.value,
    () => tracingExpressionsInput.value,
    () => cuspInput.value
  ],
  ([formulaArray, tValArr, tracingArr, cuspValues]) => {
    coordinateExpressions.x = formulaArray[0];
    coordinateExpressions.y = formulaArray[1];
    coordinateExpressions.z = formulaArray[2];
    tNumbers.min = Number(tValArr[0]);
    tNumbers.max = Number(tValArr[1]);
    tExpressions.min = tracingArr[0];
    tExpressions.max = tracingArr[1];
    c1DiscontinuityParameterValues.push(...cuspValues.split(",").map(Number));
  }
);

const inProductionMode = computed((): boolean => {
  return import.meta.env.MODE === "production";
});
function keyHandler(ev: KeyboardEvent): void {
  if (ev.repeat) return; // Ignore repeated events on the same key
  if (!ev.altKey) return;
  if (!ev.ctrlKey) return;

  c1DiscontinuityParameterValues.splice(0);
  if (ev.code === "KeyC") {
    setCircleExpressions();
    addParametricCurve();
  } else if (ev.code === "KeyE") {
    setEllipseExpressions();
    addParametricCurve();
  } else if (ev.code === "KeyR") {
    setCardioidExpressions();
    addParametricCurve();
  } else if (ev.code === "KeyS") {
    setSpiralExpressions();
    addParametricCurve();
  } else if (ev.code === "KeyL") {
    setLoxodromeExpressions();
    addParametricCurve();
  } else if (ev.code === "KeyY") {
    setCycloidExpressions();
    addParametricCurve();
  } else if (ev.code === "KeyT") {
    setTrochoidExpressions();
    addParametricCurve();
  }
}
function setCircleExpressions(): void {
  tNumbers.min = 0;
  tNumbers.max = 2 * Math.PI;
  coordinateExpressions.x = "sin(pi/4)*cos(t)";
  coordinateExpressions.y = "sin(pi/4)*sin(t)";
  coordinateExpressions.z = "cos(pi/4)";
  // primeCoordinateExpressions.x = "-sin(pi/4)*sin(t)";
  // primeCoordinateExpressions.y = "sin(pi/4)*cos(t)";
  // primeCoordinateExpressions.z = "0";
}
function setEllipseExpressions(): void {
  tNumbers.min = 0;
  tNumbers.max = 2 * Math.PI;
  coordinateExpressions.x = "sin(M1)*cos(t)";
  coordinateExpressions.y = "sin(M2)*sin(t)";
  coordinateExpressions.z = "sqrt(cos(M1)^2 +sin(M1-M2)*sin(M1+M2)*sin(t)^2)";
  // primeCoordinateExpressions.x = "-1*sin(M1)*sin(t)";
  // primeCoordinateExpressions.y = "sin(M2)*cos(t)";
  // primeCoordinateExpressions.z =
  //   "(sin(M1-M2)*sin(M1+M2)*sin(2*t))/(2*sqrt(cos(M1)^2+sin(M1-M2)*sin(M1+M2)*sin(t)^2))";
}
function setCardioidExpressions(): void {
  tNumbers.min = 0;
  tNumbers.max = 2 * Math.PI;
  coordinateExpressions.x = "sin(M1)+2*cos(M1)^2*sin(M1)*(cos(t)-cos(t)^2)";
  coordinateExpressions.y = "2*cos(M1)^2*sin(M1)*sin(t)*(1-cos(t))";
  coordinateExpressions.z = "cos(M1)-2*cos(M1)*sin(M1)^2*(1-cos(t))";
  c1DiscontinuityParameterValues.push(0, 2 * Math.PI);
  // primeCoordinateExpressions.x =
  //   "2*cos(M1)^2*sin(M1)*(-1*sin(t)+2*cos(t)*sin(t))";
  // primeCoordinateExpressions.y =
  //   "2*cos(M1)^2*sin(M1)*cos(t)*(1-cos(t)) + 2*cos(M1)^2*sin(M1)*sin(t)*(sin(t))";
  // primeCoordinateExpressions.z = "-2*cos(M1)*sin(M1)^2*sin(t)";
}
function setSpiralExpressions(): void {
  tNumbers.min = 0;
  tNumbers.max = 0.9;
  coordinateExpressions.x = "sqrt(1-t^2)*cos(4*pi*t)";
  coordinateExpressions.y = "sqrt(1-t^2)*sin(4*pi*t)";
  coordinateExpressions.z = "t";
  // primeCoordinateExpressions.x =
  //   "-1*sqrt(1-t^2)*sin(4*pi*t)*4*pi-t*cos(4*pi*t)/sqrt(1-t^2)";
  // primeCoordinateExpressions.y =
  //   "sqrt(1-t^2)*cos(4*pi*t)*4*pi-t*sin(4*pi*t)/sqrt(1-t^2)";
  // primeCoordinateExpressions.z = "1";
}

function setLoxodromeExpressions(): void {
  tNumbers.min = -6;
  tNumbers.max = 6;
  tExpressions.min = "-1*abs(M1)";
  tExpressions.max = "abs(M1)";
  coordinateExpressions.x = "cos(t)/sqrt(1+4*t^2)";
  coordinateExpressions.y = "sin(t)/sqrt(1+4*t^2)";
  coordinateExpressions.z = "-2*t/sqrt(1+4*t^2)";
  // primeCoordinateExpressions.x =
  //   "-1*((sin(t)+4*t*(cos(t)+t*sin(t)))/(1+4*t^2)^(3/2))";
  // primeCoordinateExpressions.y =
  //   "(cos(t)+4*t^2*cos(t)-4*t*sin(t))/(1+4*t^2)^(3/2)";
  // primeCoordinateExpressions.z = "-1*(2/(1+4*t^2)^(3/2))";
}

function setCycloidExpressions(): void {
  // See https://mathcurve.com/courbes3d.gb/cycloidspheric/cycloidspheric.shtml
  // https://demonstrations.wolfram.com/SphericalCycloid/
  //a =1/Sqrt[       -(( 2 Cot[w] Csc[w])   / q)+Csc[w]^2 + Csc[w]^2/q^2 ]
  // const a =
  //   "1/sqrt(-1*((2/tan(w)*1/sin(w))*1/b)+1/sin(w)^2+1/sin(w)^2*1/b^2)";
  const a = "(-1*((2/tan(w)*1/sin(w))*1/b)+1/sin(w)^2+1/sin(w)^2*1/b^2)^(-1/2)";

  // //hypocycloid
  // const w = "pi/3";
  // const b = "3";
  // tNumbers.min = 0;
  // tNumbers.max = 2 * Math.PI;
  // c1DiscontinuityParameterValues = [
  //   0,
  //   (2 * Math.PI) / 3,
  //   (4 * Math.PI) / 3,
  //    2 * Math.PI
  // ];

  // //epicycloid 1
  // const w = "2*pi/3";
  // const b = "3";
  // tNumbers.min = 0;
  // tNumbers.max = 2 * Math.PI;
  // c1DiscontinuityParameterValues = [
  //   0,
  //   (2 * Math.PI) / 3,
  //   (4 * Math.PI) / 3,
  //   2 * Math.PI
  // ];

  // //spherical helix
  const w = "0.7227342478"; //acos(3/4)
  const b = "0.75";
  tNumbers.min = 0;
  tNumbers.max = 8 * Math.PI;
  c1DiscontinuityParameterValues.push(
    0,
    ((1 * 8) / 6) * Math.PI,
    ((2 * 8) / 6) * Math.PI,
    ((3 * 8) / 6) * Math.PI,
    ((4 * 8) / 6) * Math.PI,
    ((5 * 8) / 6) * Math.PI,
    8 * Math.PI
  );
  // tExpressions.min = "0";
  // tExpressions.max = "M2";

  coordinateExpressions.x =
    "(1/b)*((b-cos(w))*cos(t)+cos(w)*cos(t)*cos(b*t)+sin(t)*sin(b*t))*a"
      .replaceAll(`a`, a)
      .replaceAll(`w`, w)
      .replaceAll(`b`, b);
  coordinateExpressions.y =
    "(1/b)*((b-cos(w))*sin(t)+cos(w)*sin(t)*cos(b*t)-cos(t)*sin(b*t))*a"
      .replaceAll(`a`, a)
      .replaceAll(`w`, w)
      .replaceAll(`b`, b);
  coordinateExpressions.z =
    "(1/b)*sin(w)*(1-cos(b*t))*a-((a/b)-a*cos(w))/sin(w)"
      .replaceAll(`a`, a)
      .replaceAll(`w`, w)
      .replaceAll(`b`, b);
  // primeCoordinateExpressions.x = "(1/b)*(2*(-b+cos(w))*sin(t)*sin((b*t)/2)^2+cos(t)*(1-b*cos(w))*sin(b*t))*a"
  //   .replaceAll(`a`, a)
  //   .replaceAll(`w`, w)
  //   .replaceAll(`b`, b);
  // primeCoordinateExpressions.y = "(1/b)*(2*cos(t)*(b-cos(w))*sin((b*t)/2)^2+(1-b*cos(w))*sin(t)*sin(b*t))*a"
  //   .replaceAll(`a`, a)
  //   .replaceAll(`w`, w)
  //   .replaceAll(`b`, b);
  // primeCoordinateExpressions.z = "sin(b*t)*sin(w)*a"
  //   .replaceAll(`a`, a)
  //   .replaceAll(`w`, w)
  //   .replaceAll(`b`, b);
}

function setTrochoidExpressions(): void {
  // See https://mathcurve.com/courbes3d.gb/cycloidspheric/cycloidspheric.shtml
  // https://demonstrations.wolfram.com/SphericalCycloid/
  // https://mathcurve.com/courbes3d.gb/cycloidspheric/trochoidspheric.shtml
  // c=Sqrt[2]/Sqrt[-4 b^2 q Cot[w]    Csc[w]    +b^2   Csc[w]^2+d^2   Csc[w]^2+2 b^2 q^2   Csc[w]^2+b^2 Cos[2 w]   Csc[w]^2-d^2 Cos[2 w]  Csc[w]^2]
  const e =
    "(2)^(1/2)*(-4*b^2*q*cos(w)/sin(w)*1/sin(w)^2+b^2*1/sin(w)^2+d^2*1/sin(w)^2+2*b^2*q^2*1/sin(w)^2+b^2*cos(2*w)*1/sin(w)^2-d^2*cos(2*w)*1/sin(w)^2)^(-1/2)";

  // //curve 1
  const b = "0.5";
  const d = "1";
  const w = "pi/2";
  const q = "3";
  tNumbers.min = 0;
  tNumbers.max = 2 * Math.PI;
  c1DiscontinuityParameterValues.splice(0);

  // //curve 2 //this doesn't work at the moment, but it works in Mathematica, I don't know what the issue it, but it might have to do to with the parser?
  // const b = "1/2";
  // const d = "2";
  // const w = "pi/3";
  // const q = "8/10";
  // tNumbers.min = 0;
  // tNumbers.max = 10 * Math.PI;
  // c1DiscontinuityParameterValues = [];
  //                              e*((q*b-b*Cos[w]+d*Cos[w]*Cos[q*t])*Cos[t]+d*Sin[t]*Sin[q*t]) Mathematica input
  coordinateExpressions.x =
    "e*((q*b-b*cos(w)+d*cos(w)*cos(q*t))*cos(t)+d*sin(t)*sin(q*t))"
      .replaceAll(`e`, e)
      .replaceAll(`b`, b)
      .replaceAll(`d`, d)
      .replaceAll(`q`, q)
      .replaceAll(`w`, w);
  //                              e*((q*b-b*Cos[w]+d*Cos[w]*Cos[q*t])*Sin[t]-d*Cos[t]*Sin[q*t]), Mathematica input
  coordinateExpressions.y =
    "e*((q*b-b*cos(w)+d*cos(w)*cos(q*t))*sin(t)-d*cos(t)*sin(q*t))"
      .replaceAll(`e`, e)
      .replaceAll(`b`, b)
      .replaceAll(`d`, d)
      .replaceAll(`q`, q)
      .replaceAll(`w`, w);
  //                              e*(Sin[w]*(b-d*Cos[q*t])-(b-b*q*Cos[w])/Sin[w]) Mathematica input
  coordinateExpressions.z = "e*(sin(w)*(b-d*cos(q*t))-(b-b*q*cos(w))/sin(w))"
    .replaceAll(`e`, e)
    .replaceAll(`b`, b)
    .replaceAll(`d`, d)
    .replaceAll(`q`, q)
    .replaceAll(`w`, w);
}

onBeforeUnmount((): void => {
  window.removeEventListener("keydown", keyHandler);
});

const disableAddParametricButton = computed((): boolean => {
  return (
    isNaN(tNumbers.min) ||
    isNaN(tNumbers.max) ||
    coordinateExpressions.x === "" ||
    coordinateExpressions.y === "" ||
    coordinateExpressions.z === ""
  );
});
function addParametricCurve(): void {
  // Do not allow adding the same parametric twice
  let duplicateCurve = false;
  seParametrics.value.forEach(para => {
    const coords = para.coordinateExpressions;
    if (
      coordinateExpressions.x === coords.x &&
      coordinateExpressions.y === coords.y &&
      coordinateExpressions.z === coords.z
    ) {
      duplicateCurve = true;
    }
  });
  if (duplicateCurve) {
    EventBus.fire("show-alert", {
      key: t("duplicateParametricCurve"),
      type: "error"
    });
    return;
  }
  xyzFormulaInput.value[0] = coordinateExpressions.x
  xyzFormulaInput.value[1] = coordinateExpressions.y
  xyzFormulaInput.value[2] = coordinateExpressions.z
  const newlyCreatedSEPoints: SEPoint[] = [];
  // If  tMaxNumber is less than tMinNumber -- error!
  if (tNumbers.min >= tNumbers.max) {
    EventBus.fire("show-alert", {
      key: t("tMinNotLessThantMax"),
      type: "error"
    });
    return;
  }
  tNumbersInput.value[0] = tNumbers.min.toString()
  tNumbersInput.value[1] = tNumbers.max.toString()
  // the cusp parameter values must all be between tMinNumber and tMaxNumber
  if (
    c1DiscontinuityParameterValues.length > 0 &&
    !c1DiscontinuityParameterValues.every(
      num => tNumbers.min <= num && num <= tNumbers.max
    )
  ) {
    EventBus.fire("show-alert", {
      key: t("cuspValuesOutOfBounds"),
      type: "error"
    });
    return;
  }
  cuspInput.value = c1DiscontinuityParameterValues.join(",")
  // tExpressions must either both be empty or both not empty
  if (
    (tExpressions.min.length === 0 && tExpressions.max.length !== 0) ||
    (tExpressions.min.length !== 0 && tExpressions.max.length === 0)
  ) {
    EventBus.fire("show-alert", {
      key: t("exactlyOneEmptyTExpression"),
      type: "error"
    });
    return;
  }

  tracingExpressionsInput.value[0] = tExpressions.min
  tracingExpressionsInput.value[1] = tExpressions.max
  // Create a list of t values to test the expressions at
  const tValues: number[] = [];
  for (let i = 0; i < SETTINGS.parameterization.numberOfTestTValues + 1; i++) {
    tValues.push(
      tNumbers.min +
        (i / SETTINGS.parameterization.numberOfTestTValues) *
          (tNumbers.max - tNumbers.min)
    );
  }

  // set up the map for the parser to evaluate the expressions
  seExpressions.value.forEach(m => {
    const measurementName = m.name;
    varMap.set(measurementName, m.value);
  });

  // verify unit parametric curve
  const notUnitAtThisTValue = parametricCurveIsUnitCheck(tValues);
  if (notUnitAtThisTValue !== null) {
    EventBus.fire("show-alert", {
      key: t("notAUnitParametricCurve", { tVal: notUnitAtThisTValue }),
      type: "error"
    });
    return;
  }

  // verify we can compute P' and P'' using ExpressionParser
  //const notPerpAtThisTValue = curveAndDerivativePerpCheck(tValues);
  try {
    ExpressionParser.differentiate(
      ExpressionParser.parse(coordinateExpressions.x),
      "t"
    );
    ExpressionParser.differentiate(
      ExpressionParser.parse(coordinateExpressions.y),
      "t"
    );
    ExpressionParser.differentiate(
      ExpressionParser.parse(coordinateExpressions.z),
      "t"
    );
    ExpressionParser.differentiate(
      ExpressionParser.differentiate(
        ExpressionParser.parse(coordinateExpressions.x),
        "t"
      ),
      "t"
    );
    ExpressionParser.differentiate(
      ExpressionParser.differentiate(
        ExpressionParser.parse(coordinateExpressions.y),
        "t"
      ),
      "t"
    );
    ExpressionParser.differentiate(
      ExpressionParser.differentiate(
        ExpressionParser.parse(coordinateExpressions.z),
        "t"
      ),
      "t"
    );
  } catch (err) {
    EventBus.fire("show-alert", {
      key: t("unableToComputeTheDerivativeOf", { error: err }),
      type: "error"
    });
    return;
  }

  // Determine if the curve is closed
  varMap.set("t", tNumbers.min);
  tempVector.set(
    parser.evaluateWithVars(coordinateExpressions.x, varMap),
    parser.evaluateWithVars(coordinateExpressions.y, varMap),
    parser.evaluateWithVars(coordinateExpressions.z, varMap)
  );
  varMap.set("t", tNumbers.max);
  tempVector1.set(
    parser.evaluateWithVars(coordinateExpressions.x, varMap),
    parser.evaluateWithVars(coordinateExpressions.y, varMap),
    parser.evaluateWithVars(coordinateExpressions.z, varMap)
  );
  const closed = tempVector
    .sub(tempVector1)
    .isZero(SETTINGS.nearlyAntipodalIdeal);

  const calculationParents: SEExpression[] = [];

  let k: keyof CoordExpression;
  for (k in coordinateExpressions) {
    const exp = coordinateExpressions[k];
    for (const v of exp.matchAll(/[Mm][0-9]+/g)) {
      const pos = seExpressions.value.findIndex(z =>
        z.name.startsWith(`${v[0]}`)
      );
      // add it to the calculationParents if it is not already added
      if (pos > -1) {
        const pos2 = calculationParents.findIndex(
          parent => parent.name === seExpressions.value[pos].name
        );
        if (pos2 < 0) {
          calculationParents.push(seExpressions.value[pos]);
        }
      }
    }
  }

  let l: keyof MinMaxExpression;
  for (l in tExpressions) {
    const exp = tExpressions[l];
    // Match all measurement variables Mxxx
    for (const v of exp.matchAll(/[Mm][0-9]+/g)) {
      const pos = seExpressions.value.findIndex(z =>
        z.name.startsWith(`${v[0]}`)
      );
      // add it to the calculationParents if it is not already added
      if (pos > -1) {
        const pos2 = calculationParents.findIndex(
          parent => parent.name === seExpressions.value[pos].name
        );
        if (pos2 < 0) {
          calculationParents.push(seExpressions.value[pos] as any);
        }
      }
    }
  }

  // Add the last command to the group and then execute it (i.e. add the potentially two points and the circle to the store.)
  // if (tExpressions.min === "")
  //   tExpressions.min = tNumbers.min.toString();
  // if (tExpressions.max === "")
  //   tExpressions.max = tNumbers.max.toString();
  // Create the Parametric in the SEParametric constructor
  // Not here!
  const newSEParametric = new SEParametric(
    coordinateExpressions,
    tExpressions,
    tNumbers,
    c1DiscontinuityParameterValues,
    calculationParents
  );
  // Create the plottable and model label
  const newSELabel = new SELabel("parametric", newSEParametric);
  // Set the initial label location at the start of the curve
  const startVector = newSEParametric.P(tNumbers.min);
  tempVector
    .copy(startVector)
    .add(new Vector3(0, SETTINGS.parametric.initialLabelOffset, 0))
    .normalize();
  newSELabel.locationVector = tempVector;
  // Create a command group to add the parametric to the store
  // This way a single undo click will undo all operations.
  const parametricCommandGroup = new CommandGroup();

  parametricCommandGroup.addCommand(
    new AddParametricCommand(newSEParametric, calculationParents, newSELabel)
  );
  const traceSEPoint = new SEParametricTracePoint(newSEParametric);
  traceSEPoint.locationVector = startVector;
  const traceSELabel = new SELabel("point", traceSEPoint);

  // newSEParametric.tracePoint = traceSEPoint; //moved into SEParametricTracePoint

  // create the parametric endpoints if there are tracing expressions or the curve is not closed
  if (tExpressions.min.length !== 0 || !closed) {
    // we have to create a two points

    // create the endPoints
    const startSEEndPoint = new SEParametricEndPoint(newSEParametric, "min");

    const endSEEndPoint = new SEParametricEndPoint(newSEParametric, "max");

    // Create the plottable labels
    const startSELabel = new SELabel("point", startSEEndPoint);
    const endSELabel = new SELabel("point", endSEEndPoint);

    parametricCommandGroup.addCommand(
      new AddParametricEndPointsCommand(
        newSEParametric,
        startSEEndPoint,
        startSELabel,
        endSEEndPoint,
        endSELabel,
        traceSEPoint,
        traceSELabel
      )
    );
    newSEParametric.endPoints = [startSEEndPoint, endSEEndPoint];
  } else if (closed) {
    parametricCommandGroup.addCommand(
      new AddParametricTracePointCommand(
        newSEParametric,
        traceSEPoint,
        traceSELabel
      )
    );
  }
  // Generate new intersection points. These points must be computed and created
  // in the store. Add the new created points to the parametric command so they can be undone.
  seStore
    .createAllIntersectionsWithParametric(newSEParametric, newlyCreatedSEPoints)
    .forEach((item: SEIntersectionReturnType) => {
      if (item.existingIntersectionPoint) {
        parametricCommandGroup.addCommand(
          new AddIntersectionPointOtherParent(
            item.SEIntersectionPoint,
            item.parent1
          )
        );
      } else {
        // Create the plottable label
        const newSELabel = new SELabel("point", item.SEIntersectionPoint);
        // Set the initial label location
        tempVector
          .copy(item.SEIntersectionPoint.locationVector)
          .add(
            new Vector3(
              2 * SETTINGS.point.initialLabelOffset,
              SETTINGS.point.initialLabelOffset,
              0
            )
          )
          .normalize();
        newSELabel.locationVector = tempVector;

        parametricCommandGroup.addCommand(
          new AddIntersectionPointCommand(
            item.SEIntersectionPoint,
            item.parent1,
            item.parent2,
            newSELabel
          )
        );
        item.SEIntersectionPoint.showing = false; // do not display the automatically created intersection points
        newSELabel.showing = false;
        if (item.createAntipodalPoint) {
          /////////////
          // Create the antipode of the new point, vtx
          ///// WARNING This is duplicate code from the method addCreateAntipodeCommand in Highlighter.ts

          // Create the model object for the new point and link them
          const antipodalVtx = new SEAntipodalPoint(
            item.SEIntersectionPoint,
            false
          );

          // Create a plottable label
          // Create an SELabel and link it to the plottable object

          antipodalVtx.locationVector = item.SEIntersectionPoint.locationVector;
          antipodalVtx.locationVector.multiplyScalar(-1);
          // Set the initial label location
          const newSEAntipodalLabel = antipodalVtx.attachLabelWithOffset(
            new Vector3(
              2 * SETTINGS.point.initialLabelOffset,
              SETTINGS.point.initialLabelOffset,
              0
            )
          );
          // newSEAntipodalLabel.locationVector = tmpVector;
          parametricCommandGroup.addCommand(
            new AddAntipodalPointCommand(
              antipodalVtx,
              item.SEIntersectionPoint,
              newSEAntipodalLabel
            )
          );
          newlyCreatedSEPoints.push(antipodalVtx, item.SEIntersectionPoint);
          ///////////
        }
      }
      // // Create the plottable and model label

      // // Set the initial label location
      // tempVector
      //   .copy(item.SEIntersectionPoint.locationVector)
      //   .add(
      //     new Vector3(
      //       2 * SETTINGS.point.initialLabelOffset,
      //       SETTINGS.point.initialLabelOffset,
      //       0
      //     )
      //   )
      //   .normalize();
      // newSELabel.locationVector = tempVector;

      // parametricCommandGroup.addCommand(
      //   new AddIntersectionPointCommand(
      //     item.SEIntersectionPoint,
      //     item.parent1,
      //     item.parent2,
      //     newSELabel
      //   )
      // );
      // item.SEIntersectionPoint.showing = false; // do not display the automatically created intersection points or label
      // newSELabel.showing = false;
    });

  parametricCommandGroup.execute();

  newSEParametric.markKidsOutOfDate();
  newSEParametric.update();
  console.log("parametric exist?", newSEParametric.exists);
  // }
  //reset for another parametric curve.
  coordinateExpressions = { x: "", y: "", z: "" };
  tExpressions = { min: "", max: "" };
  tNumbers = { min: NaN, max: NaN };
  c1DiscontinuityParameterValues = [];
}

function parametricCurveIsUnitCheck(tValues: number[]): null | number {
  // I'm not using tValues.forEach because once a non-unit vector is found, we return the t value and stop checking.
  for (let i = 0; i < tValues.length; i++) {
    varMap.set("t", tValues[i]);

    tempVector.set(
      parser.evaluateWithVars(coordinateExpressions.x, varMap),
      parser.evaluateWithVars(coordinateExpressions.y, varMap),
      parser.evaluateWithVars(coordinateExpressions.z, varMap)
    );
    // console.log(
    //   "length",
    //   tempVector.length(),
    //   parser.evaluateWithVars(coordinateExpressions.x, varMap),
    //   parser.evaluateWithVars(coordinateExpressions.y, varMap),
    //   parser.evaluateWithVars(coordinateExpressions.z, varMap)
    // );
    if (Math.abs(tempVector.length() - 1) > SETTINGS.nearlyAntipodalIdeal) {
      return tValues[i];
    }
  }
  return null;
}
</script>
<i18n lang="json" locale="en">
{
  "currentTValue": "Current Value: ",
  "cuspParameterValues": "Cusp t values (if any)",
  "cuspParameterValuesTip": "The comma separated list of the t (each must be a number) values of the parameter (if any) where the parametric curve has cusps. If the curve is closed and their is a cusp point at the point of closure, include both the minimum and maximum parameter value.",
  "cuspValuesOutOfBounds": "At least one of the cusp parameter values is not between the minimum and maximum parameter values. Check the cusp parameter values.",
  "duplicateParametricCurve": "Duplicate parametric curves are not allowed.",
  "exactlyOneEmptyTExpression": "Maximum and Minimum Parameter Tracing Expression must either both be empty or both be defined.",
  "notAUnitParametricCurve": "Parametric curves must on the unit sphere; this curve was not unit at a t value of {tVal}. Check the coordinates of the parametric formulas.",
  "parametricCoordinates": "Parametric Formulas",
  "tExpressionData": "Optional Tracing Expressions",
  "tMaxExpression": "Maximum Parameter Tracing Expression",
  "tMaxExpressionTip": "An optional expression (that MUST depend on measurements tokens) that gives the ending t value when tracing the parametric curve. This value is always evaluated to be less than or equal to the maximum parameter value.",
  "tMaxNumber": "Maximum parameter(t) Value",
  "tMaxNumberTip": "A required absolute minimum t (must be a number) value for tracing the parametric curve that is the upper bound for the optional tMax Tracing Expression.",
  "tMinExpression": "Minimum Parameter Tracing Expression",
  "tMinExpressionTip": "An optional expression (that MUST depend on measurements tokens) that gives the starting t value when tracing the parametric curve. This value is always evaluated to be greater than or equal to the minimum parameter value.",
  "tMinNotLessThantMax": "The minimum t value must be less than the maximum t value for at least one set of measurements. Change at least one t value expressions.",
  "tMinNumber": "Minimum parameter(t) Value",
  "tMinNumberTip": "A required absolute minimum t (must be a number) value for tracing the parametric curve that is the lower bound for the optional tMin Tracing Expression.",
  "unableToComputeTheDerivativeOf": "We were unable to compute the derivative of one of the coordinate expressions. Error: {error}",
  "xCoordExpressionTip": "An expression (possibly depending on measurement tokens) for the x coordinate for the parametric curve.",
  "xParametricCoordinate": "X(t) formula",
  "yCoordExpressionTip": "An expression (possibly depending on measurement tokens) for the y coordinate for the parametric curve.",
  "yParametricCoordinate": "Y(t) formula",
  "zCoordExpressionTip": "An expression (possibly depending on measurement tokens) for the z coordinate for the parametric curve.",
  "zParametricCoordinate": "Z(t) formula",
  "xx": "xxx"
}
</i18n>
