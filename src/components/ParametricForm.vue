<template>
  <div>
    <v-card raised
      outlined>
      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-sheet rounded
                color="accent"
                :elevation="4"
                class="my-3">
                <ParametricCoordinates
                  i18LabelKey="objectTree.parametricCoordinates"
                  :coordinateData="parametricFormulaData">
                </ParametricCoordinates>
              </v-sheet>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <v-sheet rounded
                color="accent"
                :elevation="4"
                class="my-3">
                <ParametricTracingExpressions
                  i18LabelKey="objectTree.tExpressionData"
                  :tExpressionData="tExpressionData">
                </ParametricTracingExpressions>
              </v-sheet>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12">
              <template v-for="(tVal,idk) in tNumberData">
                <ParametricTNumber :placeholder="tVal.placeholder"
                  :key="idk"
                  :i18nLabelKey="tVal.i18nLabelkey"
                  :i18nToolTip="tVal.i18nToolTip"
                  :name="tVal.name">
                </ParametricTNumber>
              </template>

            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <template>
                <ParametricCuspParameterValues
                  :i18nLabelKey="cusp.i18nLabelKey"
                  :i18nToolTip="cusp.i18nToolTip"
                  :name="cusp.name">
                </ParametricCuspParameterValues>
              </template>

            </v-col>
          </v-row>

        </v-container>

      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <!--- Disable the FAB when either any expression coordinate  or tMin/tMax text is empty or
          there is a syntax error on any coordinates or tMin/tMax -->
        <v-btn small
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
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import {
  AppState,
  CoordExpression,
  MinMaxExpression,
  MinMaxNumber,
  SEIntersectionReturnType
} from "@/types";
import { SEExpression } from "@/models/SEExpression";
import { ExpressionParser } from "@/expression/ExpressionParser";
import ParametricCoordinates from "@/components/ParametricCoordinates.vue";
import ParametricTracingExpressions from "@/components/ParametricTracingExpressions.vue";
import ParametricTNumber from "@/components/ParametricTNumber.vue";
import ParametricCuspParameterValues from "@/components/ParametricCuspParameterValues.vue";
import EventBus from "@/eventHandlers/EventBus";
import { namespace } from "vuex-class";
import SETTINGS from "@/global-settings";
import { Vector3 } from "three";
import Parametric from "@/plottables/Parametric";
import { SEStore } from "@/store";
import { DisplayStyle } from "@/plottables/Nodule";
import Label from "@/plottables/Label";
import { SELabel } from "@/models/SELabel";
import { SEParametric } from "@/models/SEParametric";
import { CommandGroup } from "@/commands/CommandGroup";
import { AddParametricCommand } from "@/commands/AddParametricCommand";
import { AddParametricEndPointsCommand } from "@/commands/AddParametricEndPointsCommand";
import { AddParametricTracePointCommand } from "@/commands/AddParametricTracePointCommand";
import { SEParametricEndPoint } from "@/models/SEParametricEndPoint";
import NonFreePoint from "@/plottables/NonFreePoint";
import { AddIntersectionPointCommand } from "@/commands/AddIntersectionPointCommand";
import { SEParametricTracePoint } from "@/models/SEParametricTracePoint";

const SE = namespace("se");

interface ParametricDataType {
  tMinNumber?: number;
  tMaxNumber?: number;
  tMinExpression?: string;
  tMaxExpression?: string;
  xCoord?: string;
  yCoord?: string;
  zCoord?: string;
  cuspParameterValues?: number[];
}

@Component({
  components: {
    ParametricCoordinates,
    ParametricTNumber,
    ParametricTracingExpressions,
    ParametricCuspParameterValues
  }
})
export default class ParametricForm extends Vue {
  mounted(): void {
    EventBus.listen("parametric-data-update", this.processParameticData);
  }
  @SE.State((s: AppState) => s.expressions)
  readonly expressions!: SEExpression[];

  @SE.State((s: AppState) => s.seParametrics)
  readonly oldParametrics!: SEParametric[];

  /**
   * These are string expressions that once set define the Parametric curve
   */
  private coordinateExpressions: CoordExpression = { x: "", y: "", z: "" };
  private tExpressions: MinMaxExpression = { min: "", max: "" };
  private tNumbers: MinMaxNumber = { min: NaN, max: NaN };
  private c1DiscontunityParameterValues: number[] = [];

  private parser = new ExpressionParser();
  readonly varMap = new Map<string, number>();
  private tempVector = new Vector3();
  private tempVector1 = new Vector3();

  private readonly tExpressionData = [
    {
      i18nLabelkey: "objectTree.tMinExpression",
      i18nToolTip: "objectTree.tMinExpressionTip",
      placeholder: "0",
      name: "tMinExpression"
    },
    {
      i18nLabelkey: "objectTree.tMaxExpression",
      i18nToolTip: "objectTree.tMaxExpressionTip",
      placeholder: "2*M1",
      name: "tMaxExpression"
    }
  ];

  private readonly tNumberData = [
    {
      i18nLabelkey: "objectTree.tMinNumber",
      i18nToolTip: "objectTree.tMinNumberTip",
      placeholder: "0",
      name: "tMinNumber"
    },
    {
      i18nLabelkey: "objectTree.tMaxNumber",
      i18nToolTip: "objectTree.tMaxNumberTip",
      placeholder: "2*pi",
      name: "tMaxNumber"
    }
  ];

  private readonly parametricFormulaData = [
    {
      i18n_key: "objectTree.xParametricCoordinate",
      i18nToolTip: "objectTree.xCoordExpressionTip",
      placeholder: "sin(M1)*cos(t)",
      name: "xCoord"
    },
    {
      i18n_key: "objectTree.yParametricCoordinate",
      i18nToolTip: "objectTree.yCoordExpressionTip",
      placeholder: "sin(M1)*sin(t)",
      name: "yCoord"
    },
    {
      i18n_key: "objectTree.zParametricCoordinate",
      i18nToolTip: "objectTree.zCoordExpressionTip",
      placeholder: "cos(M1)",
      name: "zCoord"
    }
  ];

  private readonly cusp = {
    i18nLabelKey: "objectTree.cuspParameterValues",
    i18nToolTip: "objectTree.cuspParameterValuesTip",
    name: "cuspParameterValues"
  };

  created(): void {
    window.addEventListener("keydown", this.keyHandler);
  }
  readonly keyHandler = (ev: KeyboardEvent): void => {
    if (ev.repeat) return; // Ignore repeated events on the same key
    if (!ev.altKey) return;
    if (!ev.ctrlKey) return;

    this.c1DiscontunityParameterValues.splice(0);
    if (ev.code === "KeyC") {
      this.setCircleExpressions();
      this.addParametricCurve();
    } else if (ev.code === "KeyE") {
      this.setEllipseExpressions();
      this.addParametricCurve();
    } else if (ev.code === "KeyR") {
      this.setCardioidExpressions();
      this.addParametricCurve();
    } else if (ev.code === "KeyS") {
      this.setSprialExpressions();
      this.addParametricCurve();
    } else if (ev.code === "KeyL") {
      this.setLoxodromeExpressions();
      this.addParametricCurve();
    } else if (ev.code === "KeyY") {
      this.setCycloidExpressions();
      this.addParametricCurve();
    } else if (ev.code === "KeyT") {
      this.setTrochoidExpressions();
      this.addParametricCurve();
    }
  };
  setCircleExpressions(): void {
    this.tNumbers.min = 0;
    this.tNumbers.max = 2 * Math.PI;
    this.coordinateExpressions.x = "sin(pi/4)*cos(t)";
    this.coordinateExpressions.y = "sin(pi/4)*sin(t)";
    this.coordinateExpressions.z = "cos(pi/4)";
    // this.primeCoordinateExpressions.x = "-sin(pi/4)*sin(t)";
    // this.primeCoordinateExpressions.y = "sin(pi/4)*cos(t)";
    // this.primeCoordinateExpressions.z = "0";
  }
  setEllipseExpressions(): void {
    this.tNumbers.min = 0;
    this.tNumbers.max = 2 * Math.PI;
    this.coordinateExpressions.x = "sin(M1)*cos(t)";
    this.coordinateExpressions.y = "sin(M2)*sin(t)";
    this.coordinateExpressions.z =
      "sqrt(cos(M1)^2 +sin(M1-M2)*sin(M1+M2)*sin(t)^2)";
    // this.primeCoordinateExpressions.x = "-1*sin(M1)*sin(t)";
    // this.primeCoordinateExpressions.y = "sin(M2)*cos(t)";
    // this.primeCoordinateExpressions.z =
    //   "(sin(M1-M2)*sin(M1+M2)*sin(2*t))/(2*sqrt(cos(M1)^2+sin(M1-M2)*sin(M1+M2)*sin(t)^2))";
  }
  setCardioidExpressions(): void {
    this.tNumbers.min = 0;
    this.tNumbers.max = 2 * Math.PI;
    this.coordinateExpressions.x =
      "sin(M1)+2*cos(M1)^2*sin(M1)*(cos(t)-cos(t)^2)";
    this.coordinateExpressions.y = "2*cos(M1)^2*sin(M1)*sin(t)*(1-cos(t))";
    this.coordinateExpressions.z = "cos(M1)-2*cos(M1)*sin(M1)^2*(1-cos(t))";
    this.c1DiscontunityParameterValues.push(0, 2 * Math.PI);
    // this.primeCoordinateExpressions.x =
    //   "2*cos(M1)^2*sin(M1)*(-1*sin(t)+2*cos(t)*sin(t))";
    // this.primeCoordinateExpressions.y =
    //   "2*cos(M1)^2*sin(M1)*cos(t)*(1-cos(t)) + 2*cos(M1)^2*sin(M1)*sin(t)*(sin(t))";
    // this.primeCoordinateExpressions.z = "-2*cos(M1)*sin(M1)^2*sin(t)";
  }
  setSprialExpressions(): void {
    this.tNumbers.min = 0;
    this.tNumbers.max = 0.9;
    this.coordinateExpressions.x = "sqrt(1-t^2)*cos(4*pi*t)";
    this.coordinateExpressions.y = "sqrt(1-t^2)*sin(4*pi*t)";
    this.coordinateExpressions.z = "t";
    // this.primeCoordinateExpressions.x =
    //   "-1*sqrt(1-t^2)*sin(4*pi*t)*4*pi-t*cos(4*pi*t)/sqrt(1-t^2)";
    // this.primeCoordinateExpressions.y =
    //   "sqrt(1-t^2)*cos(4*pi*t)*4*pi-t*sin(4*pi*t)/sqrt(1-t^2)";
    // this.primeCoordinateExpressions.z = "1";
  }

  setLoxodromeExpressions(): void {
    this.tNumbers.min = -6;
    this.tNumbers.max = 6;
    this.tExpressions.min = "-1*abs(M1)";
    this.tExpressions.max = "abs(M1)";
    this.coordinateExpressions.x = "cos(t)/sqrt(1+4*t^2)";
    this.coordinateExpressions.y = "sin(t)/sqrt(1+4*t^2)";
    this.coordinateExpressions.z = "-2*t/sqrt(1+4*t^2)";
    // this.primeCoordinateExpressions.x =
    //   "-1*((sin(t)+4*t*(cos(t)+t*sin(t)))/(1+4*t^2)^(3/2))";
    // this.primeCoordinateExpressions.y =
    //   "(cos(t)+4*t^2*cos(t)-4*t*sin(t))/(1+4*t^2)^(3/2)";
    // this.primeCoordinateExpressions.z = "-1*(2/(1+4*t^2)^(3/2))";
  }

  setCycloidExpressions(): void {
    // See https://mathcurve.com/courbes3d.gb/cycloidspheric/cycloidspheric.shtml
    // https://demonstrations.wolfram.com/SphericalCycloid/
    //a =1/Sqrt[       -(( 2 Cot[w] Csc[w])   / q)+Csc[w]^2 + Csc[w]^2/q^2 ]
    // const a =
    //   "1/sqrt(-1*((2/tan(w)*1/sin(w))*1/b)+1/sin(w)^2+1/sin(w)^2*1/b^2)";
    const a =
      "(-1*((2/tan(w)*1/sin(w))*1/b)+1/sin(w)^2+1/sin(w)^2*1/b^2)^(-1/2)";

    // //hypocycloid
    // const w = "pi/3";
    // const b = "3";
    // this.tNumbers.min = 0;
    // this.tNumbers.max = 2 * Math.PI;
    // this.c1DiscontunityParameterValues = [
    //   0,
    //   (2 * Math.PI) / 3,
    //   (4 * Math.PI) / 3,
    //    2 * Math.PI
    // ];

    // //epicycloid 1
    // const w = "2*pi/3";
    // const b = "3";
    // this.tNumbers.min = 0;
    // this.tNumbers.max = 2 * Math.PI;
    // this.c1DiscontunityParameterValues = [
    //   0,
    //   (2 * Math.PI) / 3,
    //   (4 * Math.PI) / 3,
    //   2 * Math.PI
    // ];

    // //spherical helix
    const w = "0.7227342478"; //acos(3/4)
    const b = "0.75";
    this.tNumbers.min = 0;
    this.tNumbers.max = 8 * Math.PI;
    this.c1DiscontunityParameterValues.push(
      0,
      ((1 * 8) / 6) * Math.PI,
      ((2 * 8) / 6) * Math.PI,
      ((3 * 8) / 6) * Math.PI,
      ((4 * 8) / 6) * Math.PI,
      ((5 * 8) / 6) * Math.PI,
      8 * Math.PI
    );
    // this.tExpressions.min = "0";
    // this.tExpressions.max = "M2";

    this.coordinateExpressions.x = "(1/b)*((b-cos(w))*cos(t)+cos(w)*cos(t)*cos(b*t)+sin(t)*sin(b*t))*a"
      .replaceAll(`a`, a)
      .replaceAll(`w`, w)
      .replaceAll(`b`, b);
    this.coordinateExpressions.y = "(1/b)*((b-cos(w))*sin(t)+cos(w)*sin(t)*cos(b*t)-cos(t)*sin(b*t))*a"
      .replaceAll(`a`, a)
      .replaceAll(`w`, w)
      .replaceAll(`b`, b);
    this.coordinateExpressions.z = "(1/b)*sin(w)*(1-cos(b*t))*a-((a/b)-a*cos(w))/sin(w)"
      .replaceAll(`a`, a)
      .replaceAll(`w`, w)
      .replaceAll(`b`, b);
    // this.primeCoordinateExpressions.x = "(1/b)*(2*(-b+cos(w))*sin(t)*sin((b*t)/2)^2+cos(t)*(1-b*cos(w))*sin(b*t))*a"
    //   .replaceAll(`a`, a)
    //   .replaceAll(`w`, w)
    //   .replaceAll(`b`, b);
    // this.primeCoordinateExpressions.y = "(1/b)*(2*cos(t)*(b-cos(w))*sin((b*t)/2)^2+(1-b*cos(w))*sin(t)*sin(b*t))*a"
    //   .replaceAll(`a`, a)
    //   .replaceAll(`w`, w)
    //   .replaceAll(`b`, b);
    // this.primeCoordinateExpressions.z = "sin(b*t)*sin(w)*a"
    //   .replaceAll(`a`, a)
    //   .replaceAll(`w`, w)
    //   .replaceAll(`b`, b);
  }

  setTrochoidExpressions(): void {
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
    this.tNumbers.min = 0;
    this.tNumbers.max = 2 * Math.PI;
    this.c1DiscontunityParameterValues = [];

    // //curve 2 //this doesn't work at the moment, but it works in Mathematica, I don't know what the issue it, but it might have to do to with the parser?
    // const b = "1/2";
    // const d = "2";
    // const w = "pi/3";
    // const q = "8/10";
    // this.tNumbers.min = 0;
    // this.tNumbers.max = 10 * Math.PI;
    // this.c1DiscontunityParameterValues = [];
    //                              e*((q*b-b*Cos[w]+d*Cos[w]*Cos[q*t])*Cos[t]+d*Sin[t]*Sin[q*t]) Mathematica input
    this.coordinateExpressions.x = "e*((q*b-b*cos(w)+d*cos(w)*cos(q*t))*cos(t)+d*sin(t)*sin(q*t))"
      .replaceAll(`e`, e)
      .replaceAll(`b`, b)
      .replaceAll(`d`, d)
      .replaceAll(`q`, q)
      .replaceAll(`w`, w);
    //                              e*((q*b-b*Cos[w]+d*Cos[w]*Cos[q*t])*Sin[t]-d*Cos[t]*Sin[q*t]), Mathematica input
    this.coordinateExpressions.y = "e*((q*b-b*cos(w)+d*cos(w)*cos(q*t))*sin(t)-d*cos(t)*sin(q*t))"
      .replaceAll(`e`, e)
      .replaceAll(`b`, b)
      .replaceAll(`d`, d)
      .replaceAll(`q`, q)
      .replaceAll(`w`, w);
    //                              e*(Sin[w]*(b-d*Cos[q*t])-(b-b*q*Cos[w])/Sin[w]) Mathematica input
    this.coordinateExpressions.z = "e*(sin(w)*(b-d*cos(q*t))-(b-b*q*cos(w))/sin(w))"
      .replaceAll(`e`, e)
      .replaceAll(`b`, b)
      .replaceAll(`d`, d)
      .replaceAll(`q`, q)
      .replaceAll(`w`, w);
  }

  beforeDestroy(): void {
    window.removeEventListener("keydown", this.keyHandler);
  }

  processParameticData(obj: ParametricDataType): void {
    if (obj.tMinNumber !== undefined) {
      this.tNumbers.min = obj.tMinNumber;
    }
    if (obj.tMaxNumber !== undefined) {
      this.tNumbers.max = obj.tMaxNumber;
    }
    if (obj.tMinExpression !== undefined) {
      this.tExpressions.min = obj.tMinExpression;
    }
    if (obj.tMaxExpression !== undefined) {
      this.tExpressions.max = obj.tMaxExpression;
    }
    if (obj.xCoord !== undefined) {
      this.coordinateExpressions.x = obj.xCoord;
    }
    if (obj.yCoord !== undefined) {
      this.coordinateExpressions.y = obj.yCoord;
    }
    if (obj.zCoord !== undefined) {
      this.coordinateExpressions.z = obj.zCoord;
    }
    if (obj.cuspParameterValues !== undefined) {
      // this.c1DiscontunityParameterValues.splice(0);
      this.c1DiscontunityParameterValues.push(...obj.cuspParameterValues);
      console.log("cusp", this.c1DiscontunityParameterValues);
    }
  }

  get disableAddParametricButton(): boolean {
    return (
      isNaN(this.tNumbers.min) ||
      isNaN(this.tNumbers.max) ||
      this.coordinateExpressions.x === "" ||
      this.coordinateExpressions.y === "" ||
      this.coordinateExpressions.z === ""
    );
  }
  addParametricCurve(): void {
    // Do not allow adding the same parametric twice
    let duplicateCurve = false;
    this.oldParametrics.forEach(para => {
      const coords = para.coordinateExpressions;
      if (
        this.coordinateExpressions.x === coords.x &&
        this.coordinateExpressions.y === coords.y &&
        this.coordinateExpressions.z === coords.z
      ) {
        duplicateCurve = true;
      }
    });
    if (duplicateCurve) {
      EventBus.fire("show-alert", {
        key: "objectTree.duplicateParametricCurve",
        type: "error"
      });
      return;
    }
    // If  tMaxNumber is less than tMinNumber -- error!
    if (this.tNumbers.min >= this.tNumbers.max) {
      EventBus.fire("show-alert", {
        key: "objectTree.tMinNotLessThantMax",
        type: "error"
      });
      return;
    }
    // the cusp parameter values must all be between tMinNumber and tMaxNumber
    if (
      this.c1DiscontunityParameterValues.length > 0 &&
      !this.c1DiscontunityParameterValues.every(
        num => this.tNumbers.min <= num && num <= this.tNumbers.max
      )
    ) {
      EventBus.fire("show-alert", {
        key: "objectTree.cuspValuesOutOfBounds",
        type: "error"
      });
      return;
    }
    // tExpressions must either both be empty or both not empty
    if (
      (this.tExpressions.min.length === 0 &&
        this.tExpressions.max.length !== 0) ||
      (this.tExpressions.min.length !== 0 && this.tExpressions.max.length === 0)
    ) {
      EventBus.fire("show-alert", {
        key: "objectTree.exactlyOneEmptyTExpression",
        type: "error"
      });
      return;
    }

    // Create a list of t values to test the expressions at
    const tValues: number[] = [];
    for (
      let i = 0;
      i < SETTINGS.parameterization.numberOfTestTValues + 1;
      i++
    ) {
      tValues.push(
        this.tNumbers.min +
          (i / SETTINGS.parameterization.numberOfTestTValues) *
            (this.tNumbers.max - this.tNumbers.min)
      );
    }

    // set up the map for the parser to evaluate the expressions
    this.expressions.forEach((m: SEExpression) => {
      const measurementName = m.name;
      this.varMap.set(measurementName, m.value);
    });

    // verify unit parametric curve
    const notUnitAtThisTValue = this.parametricCurveIsUnitCheck(tValues);
    if (notUnitAtThisTValue !== null) {
      EventBus.fire("show-alert", {
        key: "objectTree.notAUnitParametricCurve",
        keyOptions: { tVal: notUnitAtThisTValue },
        type: "error"
      });
      return;
    }

    // verify we can compute P' and P'' using ExpressionParser
    //const notPerpAtThisTValue = this.curveAndDerivativePerpCheck(tValues);
    try {
      ExpressionParser.differentiate(
        ExpressionParser.parse(this.coordinateExpressions.x),
        "t"
      );
      ExpressionParser.differentiate(
        ExpressionParser.parse(this.coordinateExpressions.y),
        "t"
      );
      ExpressionParser.differentiate(
        ExpressionParser.parse(this.coordinateExpressions.z),
        "t"
      );
      ExpressionParser.differentiate(
        ExpressionParser.differentiate(
          ExpressionParser.parse(this.coordinateExpressions.x),
          "t"
        ),
        "t"
      );
      ExpressionParser.differentiate(
        ExpressionParser.differentiate(
          ExpressionParser.parse(this.coordinateExpressions.y),
          "t"
        ),
        "t"
      );
      ExpressionParser.differentiate(
        ExpressionParser.differentiate(
          ExpressionParser.parse(this.coordinateExpressions.z),
          "t"
        ),
        "t"
      );
    } catch (err) {
      EventBus.fire("show-alert", {
        key: "objectTree.unableToComputeTheDerivativeOf",
        keyOptions: { error: err },
        type: "error"
      });
      return;
    }

    // Determine if the curve is closed
    this.varMap.set("t", this.tNumbers.min);
    this.tempVector.set(
      this.parser.evaluateWithVars(this.coordinateExpressions.x, this.varMap),
      this.parser.evaluateWithVars(this.coordinateExpressions.y, this.varMap),
      this.parser.evaluateWithVars(this.coordinateExpressions.z, this.varMap)
    );
    this.varMap.set("t", this.tNumbers.max);
    this.tempVector1.set(
      this.parser.evaluateWithVars(this.coordinateExpressions.x, this.varMap),
      this.parser.evaluateWithVars(this.coordinateExpressions.y, this.varMap),
      this.parser.evaluateWithVars(this.coordinateExpressions.z, this.varMap)
    );
    const closed = this.tempVector
      .sub(this.tempVector1)
      .isZero(SETTINGS.nearlyAntipodalIdeal);

    const calculationParents: SEExpression[] = [];

    let k: keyof CoordExpression;
    for (k in this.coordinateExpressions) {
      const exp = this.coordinateExpressions[k];
      for (const v of exp.matchAll(/[Mm][0-9]+/g)) {
        const pos = SEStore.expressions.findIndex(z =>
          z.name.startsWith(`${v[0]}`)
        );
        // add it to the calculationParents if it is not already added
        if (pos > -1) {
          const pos2 = calculationParents.findIndex(
            parent => parent.name === SEStore.expressions[pos].name
          );
          if (pos2 < 0) {
            calculationParents.push(SEStore.expressions[pos]);
          }
        }
      }
    }

    let l: keyof MinMaxExpression;
    for (l in this.tExpressions) {
      const exp = this.tExpressions[l];
      for (const v of exp.matchAll(/[Mm][0-9]+/g)) {
        const pos = SEStore.expressions.findIndex(z =>
          z.name.startsWith(`${v[0]}`)
        );
        // add it to the calculationParents if it is not already added
        if (pos > -1) {
          const pos2 = calculationParents.findIndex(
            parent => parent.name === SEStore.expressions[pos].name
          );
          if (pos2 < 0) {
            calculationParents.push(SEStore.expressions[pos]);
          }
        }
      }
    }

    // TODO: Use multiple parametric if we have discontinuity
    const parametric = new Parametric(
      this.tNumbers.min, // global min-max
      this.tNumbers.max,
      this.tNumbers.min, // part min-max
      this.tNumbers.max,
      closed
    );
    // Set the display to the default values
    parametric.stylize(DisplayStyle.ApplyCurrentVariables);
    // Adjust the stroke width to the current zoom magnification factor
    parametric.adjustSize();

    // Add the last command to the group and then execute it (i.e. add the potentially two points and the circle to the store.)
    // if (this.tExpressions.min === "")
    //   this.tExpressions.min = this.tNumbers.min.toString();
    // if (this.tExpressions.max === "")
    //   this.tExpressions.max = this.tNumbers.max.toString();
    const newSEParametric = new SEParametric(
      parametric,
      this.coordinateExpressions,
      this.tExpressions,
      this.tNumbers,
      this.c1DiscontunityParameterValues,
      calculationParents
    );

    // Create the plottable and model label
    const newLabel = new Label();
    const newSELabel = new SELabel(newLabel, newSEParametric);
    // Set the initial label location at the start of the curve
    this.tempVector
      .copy(parametric.P(this.tNumbers.min))
      .add(new Vector3(0, SETTINGS.parametric.initialLabelOffset, 0))
      .normalize();
    newSELabel.locationVector = this.tempVector;
    // Create a command group to add the parametric to the store
    // This way a single undo click will undo all operations.
    const parametricCommandGroup = new CommandGroup();

    parametricCommandGroup.addCommand(
      new AddParametricCommand(newSEParametric, calculationParents, newSELabel)
    );
    const tracePoint = new NonFreePoint();
    tracePoint.stylize(DisplayStyle.ApplyCurrentVariables);
    tracePoint.adjustSize();
    const traceSEPoint = new SEParametricTracePoint(
      tracePoint,
      newSEParametric
    );
    const traceLabel = new Label();
    const traceSELabel = new SELabel(traceLabel, traceSEPoint);

    // newSEParametric.tracePoint = traceSEPoint; //moved into SEParametricTracePoint

    // create the parametric endpoints if there are tracing expressions or the curve is not closed
    if (this.tExpressions.min.length !== 0 || !closed) {
      // we have to create a two points
      const startPoint = new NonFreePoint();
      const endPoint = new NonFreePoint();
      // Set the display to the default values
      startPoint.stylize(DisplayStyle.ApplyCurrentVariables);
      endPoint.stylize(DisplayStyle.ApplyCurrentVariables);
      // Adjust the size of the point to the current zoom magnification factor
      startPoint.adjustSize();
      endPoint.adjustSize();

      // create the endPoints
      const startSEEndPoint = new SEParametricEndPoint(
        startPoint,
        newSEParametric,
        "min"
      );

      const endSEEndPoint = new SEParametricEndPoint(
        endPoint,
        newSEParametric,
        "max"
      );

      // Create the plottable labels
      const startLabel = new Label();
      const endLabel = new Label();
      const startSELabel = new SELabel(startLabel, startSEEndPoint);
      const endSELabel = new SELabel(endLabel, endSEEndPoint);

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
    SEStore.createAllIntersectionsWithParametric(newSEParametric).forEach(
      (item: SEIntersectionReturnType) => {
        // Create the plottable and model label
        const newLabel = new Label();
        const newSELabel = new SELabel(newLabel, item.SEIntersectionPoint);

        // Set the initial label location
        this.tempVector
          .copy(item.SEIntersectionPoint.locationVector)
          .add(
            new Vector3(
              2 * SETTINGS.point.initialLabelOffset,
              SETTINGS.point.initialLabelOffset,
              0
            )
          )
          .normalize();
        newSELabel.locationVector = this.tempVector;

        parametricCommandGroup.addCommand(
          new AddIntersectionPointCommand(
            item.SEIntersectionPoint,
            item.parent1,
            item.parent2,
            newSELabel
          )
        );
        item.SEIntersectionPoint.showing = false; // do not display the automatically created intersection points or label
        newSELabel.showing = false;
      }
    );

    parametricCommandGroup.execute();

    newSEParametric.markKidsOutOfDate();
    newSEParametric.update();
    console.log("add Parametric comands");
    //reset for another parametric curve.
    this.coordinateExpressions = { x: "", y: "", z: "" };
    this.tExpressions = { min: "", max: "" };
    this.tNumbers = { min: NaN, max: NaN };
    this.c1DiscontunityParameterValues = [];
    // clear the entries in the components
    EventBus.fire("parametric-clear-data", {});
  }

  parametricCurveIsUnitCheck(tValues: number[]): null | number {
    // I'm not using tValues.forEach because once a non-unit vector is found, we return the t value and stop checking.
    for (let i = 0; i < tValues.length; i++) {
      this.varMap.set("t", tValues[i]);

      this.tempVector.set(
        this.parser.evaluateWithVars(this.coordinateExpressions.x, this.varMap),
        this.parser.evaluateWithVars(this.coordinateExpressions.y, this.varMap),
        this.parser.evaluateWithVars(this.coordinateExpressions.z, this.varMap)
      );
      // console.log(
      //   "length",
      //   this.tempVector.length(),
      //   this.parser.evaluateWithVars(this.coordinateExpressions.x, this.varMap),
      //   this.parser.evaluateWithVars(this.coordinateExpressions.y, this.varMap),
      //   this.parser.evaluateWithVars(this.coordinateExpressions.z, this.varMap)
      // );
      if (
        Math.abs(this.tempVector.length() - 1) > SETTINGS.nearlyAntipodalIdeal
      ) {
        return tValues[i];
      }
    }
    return null;
  }
}
</script>