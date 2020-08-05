<template>
  <div>
    <!-- <span v-for="c in points" :key="c.id">{{c.name}}</span> -->
    <div id="topContainer"
      :style="indent">
      <div id="nodeContent"
        :class="nodeOrLabel"
        @mouseenter="glowMe(true)"
        @mouseleave="glowMe(false)"
        @click="selectMe">
        <v-icon v-if="isPoint">mdi-vector-point</v-icon>
        <v-icon v-else-if="isLineSegment">mdi-vector-radius</v-icon>
        <v-icon v-else-if="isLine">mdi-vector-line</v-icon>
        <v-icon v-else-if="isCircle">
          mdi-vector-circle-variant
        </v-icon>
        <v-icon v-else-if="isIntersectionPoint">
          mdi-vector-intersection
        </v-icon>
        <v-icon v-else-if="isMeasurement">mdi-tape-measure</v-icon>
        <v-icon v-else-if="isCalculation">mdi-calculator</v-icon>
        <span class="contentText"
          v-if="label && label.length > 0">
          {{ label }}
        </span>
        <v-tooltip v-else
          right>
          <template v-slot:activator="{ on }">
            <div class="contentText ml-1"
              v-on="on"
              :class="showClass">
              {{ prettyName }}
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
        <v-btn small
          v-show="hasExistingChildren"
          @click="expanded = !expanded">
          <v-icon v-if="!expanded">mdi-chevron-right</v-icon>
          <v-icon v-else>mdi-chevron-down</v-icon>
        </v-btn>
      </div>
      <v-divider></v-divider>
      <transition name="slide-right">
        <div v-show="expanded">
          <!-- Recursive component here, the event "object-select" must be passed on to parent component (recursively -->
          <SENoduleTree v-for="(n, pos) in existingChildren"
            :key="pos"
            :children="n.kids"
            :depth="depth + 1"
            :node="n"
            @object-select="$emit('object-select', $event)"></SENoduleTree>
        </div>
      </transition>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";
import { SENodule } from "../models/SENodule";
import { SEIntersectionPoint } from "../models/SEIntersectionPoint";
import { SEPoint } from "../models/SEPoint";
import { SELine } from "../models/SELine";
import { SESegment } from "@/models/SESegment";
import { SECircle } from "../models/SECircle";
import { SEMeasurement } from "@/models/SEMeasurement";
import { SELength } from "@/models/SELength";
import { SECalculation } from '../models/SECalculation';
import { SEExpression } from '@/models/SEExpression';

@Component({})
export default class SENoduleTree extends Vue {
  @Prop()
  readonly children!: SENodule[];

  @Prop()
  readonly node?: SENodule;

  @Prop()
  readonly label?: string; /** Wheen defined, label takes over the node name */

  @Prop()
  private showChildren!: boolean;

  @Prop()
  readonly depth!: number; /** The depth value controls the indentation level */

  private expanded = false;

  mounted(): void {
    if (this.children)
      this.expanded = this.showChildren && this.children.length > 0;
    else this.expanded = false;
  }

  toggleVisibility(): void {
    if (this.node) {
      this.node.showing = !this.node.showing;
    }
  }

  glowMe(flag: boolean): void {
    if (this.node) {
      if (this.isPlottable) this.node.glowing = flag;
      else if (this.node instanceof SELength) {
        const target = this.node?.parents[0] as SESegment;
        target.glowing = flag;
      }
    }
  }

  selectMe(): void {
    if (this.node instanceof SEExpression) {
      console.debug("Clicked", this.node.name);
      this.$emit("object-select", { id: this.node.id });
    }
  }
  get nodeOrLabel(): string {
    return this.node ? "node" : "label";
  }
  get hasExistingChildren(): boolean {
    return this.existingChildren.length > 0;
  }

  get isHidden(): boolean {
    return this.node ? !this.node.showing : false;
  }

  get isPoint(): boolean {
    return this.node instanceof SEPoint;
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

  get isMeasurement(): boolean {
    return this.node instanceof SEMeasurement;
  }
  get isCalculation(): boolean {
    return this.node instanceof SECalculation;
  }

  get isPlottable(): boolean {
    return (
      this.node instanceof SEPoint ||
      this.node instanceof SELine ||
      this.node instanceof SESegment ||
      this.node instanceof SECircle
    );
  }
  get prettyName(): string {
    return this.label ?? this.name;
  }

  get name(): string {
    return this.node?.name ?? "None";
  }

  get showClass(): string {
    return this.label || this.node?.showing ? "visibleNode" : "invisibleNode";
  }

  get existingChildren(): SENodule[] {
    return this.children.filter((n: SENodule) => {
      if (n instanceof SEIntersectionPoint) return n.isUserCreated;
      else return n.exists;
    });
  }

  get indent(): any {
    return { marginLeft: `${this.depth * 8}px` };
  }

  get definitionText(): string {
    if (this.node instanceof SEPoint)
      return this.node?.name + this.node.locationVector.toFixed(2);
    else if (
      this.node instanceof SELine ||
      this.node instanceof SESegment ||
      this.node instanceof SECircle
    )
      return (
        this.node?.name +
        "(" +
        this.node.parents.map(p => p.name).join(",") +
        ")"
      );
    else if (this.node instanceof SEExpression) {
      // const targetSegment = this.node?.parents[0] as SESegment;
      // const len = `${(this.node.value / Math.PI).toFixed(2)} \u{1D7B9}`;
      return this.node.name;
    } else return "n/a";
  }
}
</script>

<style scoped lang="scss">
#topContainer {
  margin: 0.25em 0;
}

.visibleNode {
}

.invisibleNode {
  color: gray;
  font-style: italic;
}
#nodeContent {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 0 0.25em;
  .contentText {
    // Expand to fill in the remaining available space
    flex-grow: 1;
  }
  v-icon {
    // Icons should not grow, just fit to content
    flex-grow: 0;
  }

  &.node:hover {
    /* Change background on mouse hver only for nodes
       i.e. do not change bbackground on labels */
    background-color: var(--v-accent-lighten1);
  }
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: all;
  transition-duration: 250ms;
}

.slide-right-enter,
.slide-right-leave-to {
  // Start position is far left
  transform: translateX(-100%);
}
</style>
