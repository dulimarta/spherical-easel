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
                <ParametricCoordinates
                  i18LabelKey="objectTree.parametricDerivativeCoordinates"
                  :coordinateData="parametricDerivativeData">
                </ParametricCoordinates>
              </v-sheet>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <template v-for="(tVal,idk) in tValueData">
                <ParametricTValue :placeholder="tVal.placeholder"
                  :key="idk"
                  :i18nLabelKey="tVal.i18nLabelkey"
                  :name="tVal.name">
                </ParametricTValue>
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
import { AppState, UpdateMode } from "@/types";
import { SEExpression } from "@/models/SEExpression";
import { SECalculation } from "@/models/SECalculation";
import { AddCalculationCommand } from "@/commands/AddCalculationCommand";
import { ExpressionParser } from "@/expression/ExpressionParser";
import ParametricCoordinates from "@/components/ParametricCoordinates.vue";
import ParametricTValue from "@/components/ParametricTValue.vue";
import EventBus from "@/eventHandlers/EventBus";
import { namespace } from "vuex-class";
import SETTINGS from "@/global-settings";
import { Vector3 } from "three";

const SE = namespace("se");

interface ParametricDataType {
  tMin?: string;
  tMax?: string;
  xCoord?: string;
  yCoord?: string;
  zCoord?: string;
  xpCoord?: string;
  ypCoord?: string;
  zpCoord?: string;
}

@Component({ components: { ParametricCoordinates, ParametricTValue } })
export default class ParametricForm extends Vue {
  mounted(): void {
    EventBus.listen("parametric-data-update", this.processParameticData);
  }
  @SE.State((s: AppState) => s.expressions)
  readonly expressions!: SEExpression[];

  private tMinExpression = "";
  private tMaxExpression = "";
  private xCoordinateExpression = "";
  private yCoordinateExpression = "";
  private zCoordinateExpression = "";
  private xPrimeCoordinateExpression = "";
  private yPrimeCoordinateExpression = "";
  private zPrimeCoordinateExpression = "";

  private parser = new ExpressionParser();
  readonly varMap = new Map<string, number>();
  private tempVector = new Vector3();
  private tempVector1 = new Vector3();

  private readonly tValueData = [
    {
      i18nLabelkey: "objectTree.minTValue",
      placeholder: "0",
      name: "tMin"
    },
    {
      i18nLabelkey: "objectTree.maxTValue",
      placeholder: "2*M1",
      name: "tMax"
    }
  ];

  private readonly parametricFormulaData = [
    {
      i18n_key: "objectTree.parametricXCoordinate",
      placeholder: "sin(M1)*cos(t)",
      name: "xCoord"
    },
    {
      i18n_key: "objectTree.parametricYCoordinate",
      placeholder: "sin(M1)*sin(t)",
      name: "yCoord"
    },
    {
      i18n_key: "objectTree.parametricZCoordinate",
      placeholder: "cos(M1)",
      name: "zCoord"
    }
  ];

  private readonly parametricDerivativeData = [
    {
      i18n_key: "objectTree.parametricXPCoordinate",
      placeholder: "-sin(M1)*sin(t)",
      name: "xpCoord"
    },
    {
      i18n_key: "objectTree.parametricYPCoordinate",
      placeholder: "sin(M1)cos(t)",
      name: "ypCoord"
    },
    {
      i18n_key: "objectTree.parametricZPCoordinate",
      placeholder: "0",
      name: "zpCoord"
    }
  ];

  processParameticData(obj: ParametricDataType): void {
    if (obj.tMin !== undefined) {
      this.tMinExpression = obj.tMin;
    }
    if (obj.tMax !== undefined) {
      this.tMaxExpression = obj.tMax;
    }
    if (obj.xCoord !== undefined) {
      this.xCoordinateExpression = obj.xCoord;
    }
    if (obj.yCoord !== undefined) {
      this.yCoordinateExpression = obj.yCoord;
    }
    if (obj.zCoord !== undefined) {
      this.zCoordinateExpression = obj.zCoord;
    }
    if (obj.xpCoord !== undefined) {
      this.xPrimeCoordinateExpression = obj.xpCoord;
    }
    if (obj.ypCoord !== undefined) {
      this.yPrimeCoordinateExpression = obj.ypCoord;
    }
    if (obj.zpCoord !== undefined) {
      this.zPrimeCoordinateExpression = obj.zpCoord;
    }
  }

  get disableAddParametricButton(): boolean {
    return (
      this.tMinExpression === "" ||
      this.tMaxExpression === "" ||
      this.xCoordinateExpression === "" ||
      this.yCoordinateExpression === "" ||
      this.zCoordinateExpression === "" ||
      this.xPrimeCoordinateExpression === "" ||
      this.yPrimeCoordinateExpression === "" ||
      this.zPrimeCoordinateExpression === ""
    );
  }
  addParametricCurve(): void {
    // set up the map for the parser to evaluate the expressions
    this.expressions.forEach((m: SEExpression) => {
      const measurementName = m.name;
      // console.debug("Measurement", m, measurementName);
      this.varMap.set(measurementName, m.value);
    });

    let addANewParametricCurve = true;
    // vertify that currently tMin is less than tMax for at least one set of the measurements by creating an array of test values
    const tValues = this.generateTestTValues();
    // If tValue is empty then tMax is less than tMin -- error!
    if (tValues.length === 0) {
      EventBus.fire("show-alert", {
        key: "objectTree.tMinNotLessThantMax",
        type: "error"
      });
      addANewParametricCurve = false;
    }
    if (addANewParametricCurve) {
      // verify unit parametric curve
      const notUnitAtThisTValue = this.parametricCurveIsUnitCheck(tValues);
      if (notUnitAtThisTValue !== null) {
        EventBus.fire("show-alert", {
          key: "objectTree.notAUnitParametricCurve",
          keyOptions: { tVal: notUnitAtThisTValue },
          type: "error"
        });
        addANewParametricCurve = false;
      }
    }
    if (addANewParametricCurve) {
      // verify P and P' are perpendicular
      const notPerpAtThisTValue = this.curveAndDerivativePerpCheck(tValues);
      if (notPerpAtThisTValue !== null) {
        EventBus.fire("show-alert", {
          key: "objectTree.notPerpCurveAndDerivative",
          keyOptions: { tVal: notPerpAtThisTValue },
          type: "error"
        });
        addANewParametricCurve = false;
      }
    }
    if (addANewParametricCurve) {
      // Determine if the curve is closed
      this.varMap.set("t", tValues[0]);
      this.tempVector.set(
        this.parser.evaluateWithVars(this.xCoordinateExpression, this.varMap),
        this.parser.evaluateWithVars(this.yCoordinateExpression, this.varMap),
        this.parser.evaluateWithVars(this.zCoordinateExpression, this.varMap)
      );
      this.varMap.set("t", tValues[tValues.length - 1]);
      this.tempVector1.set(
        this.parser.evaluateWithVars(this.xCoordinateExpression, this.varMap),
        this.parser.evaluateWithVars(this.yCoordinateExpression, this.varMap),
        this.parser.evaluateWithVars(this.zCoordinateExpression, this.varMap)
      );
      const closed = this.tempVector
        .sub(this.tempVector1)
        .isZero(SETTINGS.nearlyAntipodalIdeal);

      console.log("add Parametric comands");
    }
    // check closed P(tMin)=P(tMax)
    // sample for max number of perpendiculars from any point on the sphere
    // sample for number of tangents from any point on the sphere
    // sample for number of front/back plottable pieces needed

    // create the new SEObject and add it with a command
    // const para = new SEParametric(this.calcExpression);
    // new AddParametricCommand(
    //   calc,
    //   this.calcExpression,
    //   calc.calculationParents
    // ).execute();
    // para.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
  }

  generateTestTValues(): number[] {
    const tMin = this.parser.evaluateWithVars(this.tMinExpression, this.varMap);
    const tMax = this.parser.evaluateWithVars(this.tMaxExpression, this.varMap);
    const list: number[] = [];
    if (tMax <= tMin) {
      return list;
    } else {
      for (
        let i = 0;
        i < SETTINGS.parameterization.numberOfTestTValues + 1;
        i++
      ) {
        list.push(
          tMin +
            (i / SETTINGS.parameterization.numberOfTestTValues) * (tMax - tMin)
        );
      }
    }
    return list;
  }
  parametricCurveIsUnitCheck(tValues: number[]): null | number {
    // I'm not using tValues.forEach because once a non-unit vector is found, we return the t value and stop checking.
    for (let i = 0; i < tValues.length; i++) {
      this.varMap.set("t", tValues[i]);
      this.tempVector.set(
        this.parser.evaluateWithVars(this.xCoordinateExpression, this.varMap),
        this.parser.evaluateWithVars(this.yCoordinateExpression, this.varMap),
        this.parser.evaluateWithVars(this.zCoordinateExpression, this.varMap)
      );
      console.log("unit?", Math.abs(this.tempVector.length() - 1));
      if (
        Math.abs(this.tempVector.length() - 1) > SETTINGS.nearlyAntipodalIdeal
      ) {
        return tValues[i];
      }
    }
    return null;
  }
  curveAndDerivativePerpCheck(tValues: number[]): null | number {
    // I'm not using tValues.forEach because once a non-unit vector is found, we return the t value and stop checking.
    for (let i = 0; i < tValues.length; i++) {
      this.varMap.set("t", tValues[i]);
      this.tempVector.set(
        this.parser.evaluateWithVars(this.xCoordinateExpression, this.varMap),
        this.parser.evaluateWithVars(this.yCoordinateExpression, this.varMap),
        this.parser.evaluateWithVars(this.zCoordinateExpression, this.varMap)
      );
      this.tempVector1.set(
        this.parser.evaluateWithVars(
          this.xPrimeCoordinateExpression,
          this.varMap
        ),
        this.parser.evaluateWithVars(
          this.yPrimeCoordinateExpression,
          this.varMap
        ),
        this.parser.evaluateWithVars(
          this.zPrimeCoordinateExpression,
          this.varMap
        )
      );
      console.log("perp?", Math.abs(this.tempVector.dot(this.tempVector1)));
      if (
        Math.abs(this.tempVector.dot(this.tempVector1)) >
        SETTINGS.nearlyAntipodalIdeal
      ) {
        return tValues[i];
      }
    }
    return null;
  }
}
</script>