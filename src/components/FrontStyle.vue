<template>
  <div>
    <transition name="fade" appear>
      <span v-show="commonStyleProperties.length === 0"
        class="text-body-2">Please select object(s) to
        style</span>
    </transition>
    <transition name="fade">
      <v-card class="section" v-show="hasStrokeColor" elevation="8">
        <span class="text-subtitle-2">Stroke Color</span>
        <v-color-picker></v-color-picker>
      </v-card>
    </transition>

    <transition name="fade">
      <v-card class="section" v-show="hasStrokeWidth" elevation="8"
        transition="scale-transition">
        <span>Stroke Width ({{minStrokeWidth}}/{{maxStrokeWidth}})</span>
        <v-slider v-model.number="lineWidth" :min="minStrokeWidth"
          :max="maxStrokeWidth" type="range"></v-slider>
      </v-card>
    </transition>
    <transition name="fade">
      <v-card class="section" v-show="hasFillColor" elevation="8"
        transition="scale-transition">
        <span class="text-subtitle-2">Fill Color</span>
        <v-color-picker></v-color-picker>
      </v-card>
    </transition>
  </div>
</template>
<style lang="scss" scoped>
.section {
  border: 1px solid black;
  border-radius: 4px;
  padding: 0.25em;
  margin: 0.5em;
}

.fade-enter-active,
.fade-leave-active {
  transition-property: opacity, height, width;
  transition-duration: 500ms;
  transition-timing-function: ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
  height: 100%;
  width: 100%;
}
</style>
<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component';
import { Watch } from 'vue-property-decorator';
import { SENodule } from '../models/SENodule';
import { State } from 'vuex-class';
import { Styles } from '../types/Styles';
import SETTINGS from "@/global-settings"

const values = Object
  .entries(Styles)
  .filter(e => { const [_, b] = e; return typeof b === "number" });

const keys = values.map(e => { const [a, _] = e; return a })

@Component({})
export default class FrontStyle extends Vue {

  @State
  readonly selections!: SENodule[];

  readonly minStrokeWidth = SETTINGS.line.drawn.strokeWidth.min;
  readonly maxStrokeWidth = SETTINGS.line.drawn.strokeWidth.max;

  private lineWidth = SETTINGS.line.drawn.strokeWidth.front;
  commonStyleProperties: number[] = [];

  // private commonProperties: Set<Styles>;

  constructor() {
    super();
    // this.commonProperties = new Set();
  }

  hasStyles(s: Styles): boolean {
    const sNum = Number(s);
    // const styleOrdinal = keys.findIndex(x => x === s);
    // if (!styleOrdinal || styleOrdinal < 0) return false;

    return this.commonStyleProperties.length > 0 &&
      this.commonStyleProperties.findIndex(x => x === sNum) >= 0;
  }

  get hasStrokeColor(): boolean {
    return this.hasStyles(Styles.StrokeColor);
  }

  get hasStrokeWidth(): boolean {
    return this.hasStyles(Styles.StrokeWidth);
  }

  get hasFillColor(): boolean {
    return this.hasStyles(Styles.FillWhiteTint) || this.hasStyles(Styles.FillGrayTint);
  }
  @Watch("selections", { deep: true })
  onSelectionChanged(newSelection: SENodule[]): void {
    // newSelection.forEach(s => {
    // console.debug("Set ", s.customStyles());
    // })
    this.commonStyleProperties.splice(0);
    if (newSelection.length === 0) {
      console.debug("No Common props: ");
      return;
    }
    for (let k = 0; k < values.length; k++) {

      if (newSelection.every(s => s.customStyles().has(k)))
        this.commonStyleProperties.push(k);
    }
    const propNames = this.commonStyleProperties.map(n => keys[n]).join(", ");
    console.debug("Common props: ", propNames);
  }
}
</script>
