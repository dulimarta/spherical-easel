<template>
  <div>
    <!-- <span v-for="c in points" :key="c.id">{{c.name}}</span> -->
    <div id="header">
      <span>{{label}}</span>
      <v-btn small
        v-show="hasExistingChildren"
        @click="expanded = !expanded">
        <v-icon v-if="!expanded">mdi-chevron-right</v-icon>
        <v-icon v-else>mdi-chevron-down</v-icon>
      </v-btn>
    </div>

    <div v-show="expanded">
      <template v-for="node in children">

        <div id="nodeContent"
          :key="node.id"
          class="node"
          @mouseenter="glowMe(node, true)"
          @mouseleave="glowMe(node, false)"
          @click="selectMe(node)">
          <v-icon v-if="isPoint(node)">mdi-vector-point</v-icon>
          <v-icon v-else-if="isLineSegment(node)">mdi-vector-radius
          </v-icon>
          <v-icon v-else-if="isLine(node)">mdi-vector-line</v-icon>
          <v-icon v-else-if="isCircle(node)">
            mdi-vector-circle-variant
          </v-icon>
          <v-icon v-else-if="isIntersectionPoint(node)">
            mdi-vector-intersection
          </v-icon>
          <v-icon v-else-if="isMeasurement(node)">mdi-tape-measure</v-icon>
          <v-icon v-else-if="isCalculation(node)">mdi-calculator</v-icon>
          <span class="contentText"
            v-if="label && label.length > 0">
            {{ node.name }}
          </span>
          <v-tooltip v-else
            right>
            <template v-slot:activator="{ on }">
              <div class="contentText ml-1"
                v-on="on"
                :class="showClass">
                {{ node.name }}
              </div>
            </template>
            <span>{{ definitionText }}</span>
          </v-tooltip>
          <div v-show="isPlottable(node)"
            @click="toggleVisibility(node)"
            class="mr-2">
            <v-icon small
              v-if="isHidden(node)">
              mdi-eye
            </v-icon>
            <v-icon small
              v-else
              style="color:gray">
              mdi-eye-off
            </v-icon>
          </div>
        </div>
        <v-divider :key="node.id"></v-divider>
      </template>
    </div>
    <transition name="slide-right">
      <div v-show="expanded">
        <!-- Recursive component here, the event "object-select" must be passed on to parent component (recursively -->
        <!--SENoduleTree v-for="(n, pos) in existingChildren"
            :key="pos"
            :children="n.kids"
            :depth="depth + 1"
            :node="n"
            @object-select="$emit('object-select', $event)"></SENoduleTree-->
      </div>
    </transition>
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
import { SECalculation } from "../models/SECalculation";
import { SEExpression } from "@/models/SEExpression";

@Component({})
export default class SENoduleTree extends Vue {
  @Prop()
  readonly children!: SENodule[];

  @Prop()
  readonly label!: string; /** Wheen defined, label takes over the node name */

  private expanded = false;

  mounted(): void {
    // if (this.children)
    //   this.expanded = this.show && this.children.length > 0;
    // else this.expanded = false;
  }

  toggleVisibility(node: SENodule): void {
    node.showing = !node.showing;
  }

  glowMe(node: SENodule, flag: boolean): void {
    if (this.isPlottable(node)) node.glowing = flag;
    else if (node instanceof SELength) {
      const target = node.parents[0] as SESegment;
      target.glowing = flag;
    }
  }

  selectMe(node: SENodule): void {
    if (node instanceof SEExpression) {
      console.debug("Clicked", node.name);
      this.$emit("object-select", { id: node.id });
    }
  }
  get hasExistingChildren(): boolean {
    return this.existingChildren.length > 0;
  }

  isHidden(node: SENodule): boolean {
    return node ? !node.showing : false;
  }

  isPoint(node: SENodule): boolean {
    return node instanceof SEPoint;
  }

  isLine(node: SENodule): boolean {
    return node instanceof SELine;
  }
  isLineSegment(node: SENodule): boolean {
    return node instanceof SESegment;
  }
  isCircle(node: SENodule): boolean {
    return node instanceof SECircle;
  }

  isIntersectionPoint(node: SENodule): boolean {
    return node instanceof SEIntersectionPoint;
  }

  isMeasurement(node: SENodule): boolean {
    return node instanceof SEMeasurement;
  }
  isCalculation(node: SENodule): boolean {
    return node instanceof SECalculation;
  }

  isPlottable(node: SENodule): boolean {
    return (
      node instanceof SEPoint ||
      node instanceof SELine ||
      node instanceof SESegment ||
      node instanceof SECircle
    );
  }
  name(node: SENodule): string {
    return node?.name ?? "None";
  }

  showClass(node: SENodule): string {
    return this.label || node?.showing ? "visibleNode" : "invisibleNode";
  }

  get existingChildren(): SENodule[] {
    return this.children.filter((n: SENodule) => {
      if (n instanceof SEIntersectionPoint) return n.isUserCreated;
      else return n.exists;
    });
  }

  definitionText(node: SENodule): string {
    if (node instanceof SEPoint)
      return node?.name + node.locationVector.toFixed(2);
    else if (
      node instanceof SELine ||
      node instanceof SESegment ||
      node instanceof SECircle
    )
      return node?.name + "(" + node.parents.map(p => p.name).join(",") + ")";
    else if (node instanceof SEExpression) {
      // const targetSegment = node?.parents[0] as SESegment;
      // const len = `${(node.value / Math.PI).toFixed(2)} \u{1D7B9}`;
      return node.name;
    } else return "n/a";
  }
}
</script>

<style scoped lang="scss">
#header {
  display: flex;
  flex-direction: row;
  align-items: center;

  span {
    margin-left: 0.25em;
    flex-grow: 1;
  }
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
