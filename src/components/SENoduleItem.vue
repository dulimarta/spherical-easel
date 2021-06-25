<template>
  <div>
    <div class="node"
      @mouseenter="glowMe(true)"
      @mouseleave="glowMe(false)">
      <v-icon v-if="isPoint"
        medium>
        $vuetify.icons.value.point</v-icon>
      <v-icon v-else-if="isLineSegment"
        medium>
        $vuetify.icons.value.segment</v-icon>
      <v-icon v-else-if="isLine"
        medium>
        $vuetify.icons.value.line</v-icon>
      <v-icon v-else-if="isCircle"
        medium>
        $vuetify.icons.value.circle
      </v-icon>
      <v-icon v-else-if="isEllipse"
        medium>
        $vuetify.icons.value.ellipse
      </v-icon>
      <v-icon v-else-if="isIntersectionPoint"
        medium>
        $vuetify.icons.value.intersectionPoint
      </v-icon>
      <v-icon v-else-if="isSlider">mdi-arrow-left-right</v-icon>
      <v-icon v-else-if="isAngle"
        medium>
        $vuetify.icons.value.angle</v-icon>
      <v-icon v-else-if="isMeasurement">mdi-tape-measure
      </v-icon>
      <v-icon v-else-if="isCalculation">mdi-calculator</v-icon>
      <v-tooltip right>
        <template v-slot:activator="{ on }">
          <div class="contentText ml-1"
            @click="selectMe"
            v-on="on"
            :class="showClass">
            <span class="text-truncate">{{ shortDisplayText }}</span>
          </div>
        </template>
        <span>{{ definitionText }}</span>
      </v-tooltip>
      <v-tooltip right>
        <template v-slot:activator="{ on }">
          <div v-show="isPlottable"
            v-on="on"
            @click="toggleVisibility"
            class="mr-2">
            <v-icon small
              v-if="isHidden">
              mdi-eye
            </v-icon>
            <v-icon small
              v-else
              style="color:gray">
              mdi-eye-off
            </v-icon>
          </div>
        </template>
        <span>{{ $t(`objectTree.toggleDisplay`) }}</span>
      </v-tooltip>
      <v-tooltip right>
        <template v-slot:activator="{ on }">
          <div v-show="isExpressionAndNotCoordinate"
            v-on="on"
            @click="toggleMultplesOfPi"
            class="mr-2">
            <v-icon small
              style="{color: isMultipleOfPi ? 'black' : 'gray'}">
              mdi-pi
            </v-icon>
          </div>
        </template>
        <span>{{ $t(`objectTree.multipleOfPiToggle`) }}</span>
      </v-tooltip>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Prop, Component } from "vue-property-decorator";
import { SENodule } from "../models/SENodule";
import { SEIntersectionPoint } from "../models/SEIntersectionPoint";
import { SEPoint } from "../models/SEPoint";
import { SELine } from "../models/SELine";
import { SESegment } from "@/models/SESegment";
import { SECircle } from "../models/SECircle";
import { SEMeasurement } from "@/models/SEMeasurement";
import { SESegmentLength } from "@/models/SESegmentLength";
import { SECalculation } from "../models/SECalculation";
import { SEExpression } from "@/models/SEExpression";
import { SESegmentDistance } from "@/models/SESegmentDistance";
import { SESlider } from "@/models/SESlider";
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";
import { SetExpressionMultiplesOfPiCommand } from "@/commands/SetExpressionMultiplesOfPiCommand";
import SETTINGS from "@/global-settings";
import { UpdateMode } from "@/types";
import { SEAngleMarker } from "@/models/SEAngleMarker";
import { SEPointCoordinate } from "@/models/SEPointCoordinate";
import { SEEllipse } from "@/models/SEEllipse";

@Component
export default class SENoduleItem extends Vue {
  @Prop()
  readonly node!: SENodule;

  glowMe(flag: boolean): void {
    if (this.isPlottable) this.node.glowing = flag;
    else if (this.node instanceof SESegmentLength) {
      const target = this.node.parents[0] as SESegment;
      target.glowing = flag;
    } else if (this.node instanceof SESegmentDistance) {
      this.node.parents
        .map(n => n as SEPoint)
        .forEach((p: SEPoint) => {
          p.glowing = flag;
        });
    }
  }

  selectMe(): void {
    if (this.node instanceof SEExpression) {
      console.debug("Clicked", this.node.name);
      this.$emit("object-select", { id: this.node.id });
    }
  }

  toggleVisibility(): void {
    new SetNoduleDisplayCommand(this.node, !this.node.showing).execute();
  }

  get isMultipleOfPi(): boolean {
    return (this.node as SEExpression).displayInMultiplesOfPi;
  }
  toggleMultplesOfPi(): void {
    new SetExpressionMultiplesOfPiCommand(
      this.node as SEExpression,
      !(this.node as SEExpression).displayInMultiplesOfPi
    ).execute();
    // update a parent to update the display on the sphere canvas
    this.node.parents[0].update({
      mode: UpdateMode.DisplayOnly,
      stateArray: []
    });
  }
  get isPoint(): boolean {
    return this.node instanceof SEPoint;
  }
  get isHidden(): boolean {
    return !this.node.showing;
  }
  get isExpressionAndNotCoordinate(): boolean {
    return (
      this.node instanceof SEExpression &&
      !(this.node instanceof SEPointCoordinate)
    );
  }
  get isLine(): boolean {
    return this.node instanceof SELine;
  }
  get isLineSegment(): boolean {
    return this.node instanceof SESegment;
  }
  get isCircle(): boolean {
    return this.node instanceof SECircle;
  }
  get isEllipse(): boolean {
    return this.node instanceof SEEllipse;
  }
  get isIntersectionPoint(): boolean {
    return this.node instanceof SEIntersectionPoint;
  }
  get isAngle(): boolean {
    return this.node instanceof SEAngleMarker;
  }
  get isMeasurement(): boolean {
    return this.node instanceof SEMeasurement;
  }
  get isCalculation(): boolean {
    return this.node instanceof SECalculation;
  }
  get isSlider(): boolean {
    return this.node instanceof SESlider;
  }

  get isPlottable(): boolean {
    return (
      this.node instanceof SEPoint ||
      this.node instanceof SELine ||
      this.node instanceof SESegment ||
      this.node instanceof SECircle ||
      this.node instanceof SEEllipse ||
      this.node instanceof SEAngleMarker
    );
  }

  get showClass(): string {
    return this.node.showing ? "visibleNode" : "invisibleNode";
  }

  get shortDisplayText(): string {
    if (
      this.node instanceof SEPoint ||
      this.node instanceof SELine ||
      this.node instanceof SESegment ||
      this.node instanceof SECircle ||
      this.node instanceof SEEllipse
    ) {
      return this.node.label?.ref.shortName ?? "Unknown label";
    } else if (this.node instanceof SEExpression) {
      {
        return this.node.shortName;
      }
    } else {
      return "n/a";
    }
  }
  get definitionText(): string {
    if (this.node instanceof SEPoint) {
      return (
        this.node.label?.ref.shortName +
        this.node.locationVector.toFixed(SETTINGS.decimalPrecision)
      );
    } else if (
      this.node instanceof SELine ||
      this.node instanceof SESegment ||
      this.node instanceof SECircle ||
      this.node instanceof SEEllipse
    ) {
      const nameList = this.node.parents
        .map(p => p.name.toString())
        //.map(p => ((p as unknown) as Labelable).label!.ref.shortName)
        .join(",");
      return this.node.label?.ref.shortName + "(" + nameList + ")";
    } else if (this.node instanceof SEExpression) {
      {
        return this.node.longName;
      }
    } else {
      return "n/a";
    }
  }

  get magnificationLevel(): number {
    return this.magnificationLevel;
  }
}
</script>

<style scoped lang="scss">
.invisibleNode {
  color: gray;
  font-style: italic;
}
.node,
.visibleNode {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 0 0.25em;
  background-color: white;
  .contentText {
    // Expand to fill in the remaining available space
    flex-grow: 1;
  }
  v-icon {
    // Icons should not grow, just fit to content
    flex-grow: 0;
  }

  &:hover {
    /* Change background on mouse hover only for nodes
       i.e. do not change bbackground on labels */
    background-color: var(--v-accent-lighten1);
  }
}
</style>