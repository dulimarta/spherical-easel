<template>
  <div>
    <div class="node"
      @mouseenter="glowMe(true)"
      @mouseleave="glowMe(false)"
      @click="selectMe">
      <v-icon v-if="isPoint">mdi-vector-point</v-icon>
      <v-icon v-else-if="isLineSegment">mdi-vector-radius
      </v-icon>
      <v-icon v-else-if="isLine">mdi-vector-line</v-icon>
      <v-icon v-else-if="isCircle">
        mdi-vector-circle-variant
      </v-icon>
      <v-icon v-else-if="isIntersectionPoint">
        mdi-vector-intersection
      </v-icon>
      <v-icon v-else-if="isSlider">mdi-arrow-left-right</v-icon>
      <v-icon v-else-if="isAngle">mdi-angle-acute</v-icon>
      <v-icon v-else-if="isMeasurement">mdi-tape-measure
      </v-icon>
      <v-icon v-else-if="isCalculation">mdi-calculator</v-icon>
      <v-tooltip right>
        <template v-slot:activator="{ on }">
          <div class="contentText ml-1"
            v-on="on"
            :class="showClass">
            {{ node.name }}
          </div>
        </template>
        <span>{{ definitionText }}</span>
      </v-tooltip>
      <div v-show="isPlottable"
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
import SETTINGS from "@/global-settings";
import { Labelable, LabelState } from "@/types";
import { SEAngleMarker } from "@/models/SEAngleMarker";

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

  get isPoint(): boolean {
    return this.node instanceof SEPoint;
  }

  get isHidden(): boolean {
    return !this.node.showing;
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
      this.node instanceof SEAngleMarker
    );
  }

  get showClass(): string {
    return this.node.showing ? "visibleNode" : "invisibleNode";
  }

  get definitionText(): string {
    if (this.node instanceof SEPoint)
      return this.node.name + this.node.locationVector.toFixed(2);
    else if (
      this.node instanceof SELine ||
      this.node instanceof SESegment ||
      this.node instanceof SECircle
    )
      return (
        this.node.name +
        "(" +
        this.node.parents.map(p => p.name).join(",") +
        ")"
      );
    else if (this.node instanceof SEExpression) {
      return this.node.name;
    } else return "n/a";
  }

  get magnificationLevel(): number {
    return this.$store.getters.magnificationLevel() as number;
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