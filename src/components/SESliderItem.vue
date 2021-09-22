<template>
  <div class="white mx-1">
    <div class="node"
      @click="selectMe">
      <v-icon>mdi-arrow-left-right</v-icon>
      <span>{{ node.name }}: {{node.value}}</span>
    </div>
    <v-slider v-model.number="node.value"
      :min="node.min"
      :max="node.max"
      :step="node.step"
      thumb-label></v-slider>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Prop, Component } from "vue-property-decorator";
import { SEExpression } from "@/models/SEExpression";
import { SESlider } from "@/models/SESlider";

@Component
export default class SENoduleItem extends Vue {
  @Prop()
  readonly node!: SESlider;

  selectMe(): void {
    if (this.node instanceof SEExpression) {
      // console.debug("Clicked", this.node.name);
      this.$emit("object-select", { id: this.node.id });
    }
  }

  // get isMeasurement(): boolean {
  //   return this.node instanceof SEMeasurement;
  // }
  // get isCalculation(): boolean {
  //   return this.node instanceof SECalculation;
  // }

  // get showClass(): string {
  //   return this.node.showing ? "visibleNode" : "invisibleNode";
  // }

  // get definitionText(): string {
  //   return this.node.name;
  // }
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
    /* Change background on mouse hver only for nodes
       i.e. do not change bbackground on labels */
    background-color: var(--v-accent-lighten1);
  }
}
</style>