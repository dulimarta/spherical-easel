<template>
  <div class="white mx-1">
    <div
      class="node"
      @click="selectMe"
      @mouseenter="glowMe(true)"
      @mouseleave="glowMe(false)">
      <v-icon>$slider</v-icon>
      <span>{{ model.name }}: {{ model.value }}</span>
    </div>
    <v-slider
      data-testid="slider"
      v-model="model.value"
      :min="model.min"
      :max="model.max"
      :step="model.step"
      thumb-label></v-slider>
    <div
      :style="{
        display: 'grid',
        gridTemplateColumns: 'auto',
        alignItems: 'center'
      }">
      <v-select
        v-model="playbackMode"
        :items="playbackSelections"
        label="Playback"
        density="compact">
        <template #prepend-inner>
          <v-icon>mdi-repeat</v-icon>
        </template>
        <template #append>
          <v-btn @click="play">
            <v-icon>mdi-play-circle-outline</v-icon>
          </v-btn>
        </template>
      </v-select>
      <v-select v-model="playbackSpeed" label="Speed" :items="speedSelections">
        <template #prepend-inner>
          <v-icon>mdi-speedometer</v-icon>
        </template>
        <template #append>
          <v-btn @click="stop">
            <v-icon>mdi-stop-circle-outline</v-icon>
          </v-btn>
        </template>
      </v-select>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { SEExpression } from "@/models/SEExpression";
import { SESlider } from "@/models/SESlider";
import { SliderPlaybackMode } from "@/types";
import EventBus from "@/eventHandlers/EventBus";
import { useSEStore } from "@/stores/se";
import { storeToRefs } from "pinia";
import { onMounted } from "vue";
import { SENodule } from "@/models/SENodule";

const store = useSEStore();
// const { sePoints } = storeToRefs(store);
const model = defineModel<SESlider>({ required: true });
const emit = defineEmits(["object-select"]);
const playbackMode = ref(SliderPlaybackMode.ONCE);
const playbackSpeed = ref(750);
let playbackForward = true;
let timer: number | null = null;

onMounted(() => {
  console.debug("SeSliderItem::onMounted()");
});

const playbackSelections = [
  { title: "Once", value: SliderPlaybackMode.ONCE },
  { title: "Loop", value: SliderPlaybackMode.LOOP },
  { title: "Reverse Loop", value: SliderPlaybackMode.REFLECT }
];

const speedSelections = [
  { title: "Slow", value: 1250 },
  { title: "Normal", value: 750 },
  { title: "Fast", value: 250 }
];

function selectMe(): void {
  if (model.value instanceof SEExpression) {
    // console.debug("Clicked", model.value.name);
    emit("object-select", { id: model.value.id });
    EventBus.fire("set-expression-for-tool", {
      expression: model.value
    });
  }
}
function glowMe(flag: boolean): void {
  // console.log("here", model.value instanceof SEExpression);
  EventBus.fire("measured-circle-set-temporary-radius", {
    display: flag,
    radius: model.value
  });
}

function animate_once(): void {
  if (model.value.value >= model.value.max) {
    clearInterval(timer!);
    timer = null;
  } else {
    model.value.value += model.value.step;
    model.value.markKidsOutOfDate();
    model.value.update();
  }
}

function animate_loop(): void {
  if (model.value.value >= model.value.max) {
    model.value.value = model.value.min;
  } else {
    model.value.value += model.value.step;
    model.value.markKidsOutOfDate();
    model.value.update();
  }
}

function animate_loop_reverse(): void {
  if (model.value.value >= model.value.max) {
    playbackForward = false;
  } else if (model.value.value <= model.value.min) {
    playbackForward = true;
  }
  if (playbackForward) model.value.value += model.value.step;
  else model.value.value -= model.value.step;
  model.value.markKidsOutOfDate();
  model.value.update();
}

function play(): void {
  // console.debug("Playback mode", this.playbackMode, this.timer);
  if (timer === null) {
    switch (playbackMode.value) {
      case SliderPlaybackMode.ONCE:
        timer = window.setInterval(() => animate_once(), playbackSpeed.value);
        model.value.value = model.value.min;
        break;
      case SliderPlaybackMode.LOOP:
        timer = window.setInterval(() => animate_loop, playbackSpeed.value);
        break;
      case SliderPlaybackMode.REFLECT:
        timer = window.setInterval(
          () => animate_loop_reverse(),
          playbackSpeed.value
        );
    }
  }
}

function stop(): void {
  // console.debug("Stop slider anim");
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

// get isMeasurement(): boolean {
//   return model.node instanceof SEMeasurement;
// }
// get isCalculation(): boolean {
//   return model.node instanceof SECalculation;
// }

// get showClass(): string {
//   return model.node.showing ? "visibleNode" : "invisibleNode";
// }

// get definitionText(): string {
//   return model.node.name;
// }
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
