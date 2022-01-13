<template>
  <div class="white mx-1">
    <div class="node"
      @click="selectMe">
      <v-icon>$vuetify.icons.value.slider</v-icon>
      <span>{{ node.name }}: {{node.value}}</span>
    </div>
    <v-slider v-model.number="node.value"
      :min="node.min"
      :max="node.max"
      :step="node.step"
      ref="slider"
      thumb-label></v-slider>
    <v-container>
      <v-row align="center">
        <v-col cols="9">
          <v-select v-model="playbackMode"
            append-icon="mdi-menu"
            :items="playbackSelections"></v-select>
        </v-col>
        <v-col cols="3">
          <v-icon @click="play">mdi-play-circle-outline</v-icon>
        </v-col>

        <v-col cols="9">
          <v-select v-model="playbackSpeed"
            append-icon="mdi-speedometer"
            :items="speedSelections"></v-select>
        </v-col>
        <v-col cols="3">
          <v-btn small
            @click="stop">
            <v-icon>mdi-stop-circle-outline</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Prop, Component } from "vue-property-decorator";
import { SEExpression } from "@/models/SEExpression";
import { SESlider } from "@/models/SESlider";
import { SliderPlaybackMode } from "@/types";

@Component
export default class SESliderItem extends Vue {
  @Prop()
  readonly node!: SESlider;

  playbackMode = SliderPlaybackMode.ONCE;
  playbackSpeed = 750;
  playbackForward = true;
  timer: NodeJS.Timer | null = null;

  playbackSelections = [
    { text: "Once", value: SliderPlaybackMode.ONCE },
    { text: "Loop", value: SliderPlaybackMode.LOOP },
    { text: "Reverse Loop", value: SliderPlaybackMode.REFLECT }
  ];

  speedSelections = [
    { text: "Slow", value: 1250 },
    { text: "Normal", value: 750 },
    { text: "Fast", value: 250 }
  ];

  selectMe(): void {
    if (this.node instanceof SEExpression) {
      // console.debug("Clicked", this.node.name);
      this.$emit("object-select", { id: this.node.id });
    }
  }

  animate_once(): void {
    if (this.node.value >= this.node.max) {
      clearInterval(this.timer!);
      this.timer = null;
    } else {
      this.node.value += this.node.step;
      this.node.update();
    }
  }

  animate_loop(): void {
    if (this.node.value >= this.node.max) {
      this.node.value = this.node.min;
    } else {
      this.node.value += this.node.step;
      this.node.update();
    }
  }

  animate_loop_reverse(): void {
    if (this.node.value >= this.node.max) {
      this.playbackForward = false;
    } else if (this.node.value <= this.node.min) {
      this.playbackForward = true;
    }
    if (this.playbackForward) this.node.value += this.node.step;
    else this.node.value -= this.node.step;
    this.node.update();
  }

  play(): void {
    console.debug("Playback mode", this.playbackMode, this.timer);
    if (this.timer === null) {
      switch (this.playbackMode) {
        case SliderPlaybackMode.ONCE:
          this.timer = setInterval(
            () => this.animate_once(),
            this.playbackSpeed
          );
          this.node.value = this.node.min;
          break;
        case SliderPlaybackMode.LOOP:
          this.timer = setInterval(
            () => this.animate_loop(),
            this.playbackSpeed
          );
          break;
        case SliderPlaybackMode.REFLECT:
          this.timer = setInterval(
            () => this.animate_loop_reverse(),
            this.playbackSpeed
          );
      }
    }
  }

  stop(): void {
    console.debug("Stop slider anim");
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
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