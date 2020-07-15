<template>
  <div>
    <div class="section" v-show="hasStrokeColor">
      <span class="text-subtitle-2">Stroke Color</span>
      <v-color-picker></v-color-picker>
    </div>
    <div class="section" v-show="hasStrokeWidth">
      <span>Stroke Width</span>
      <v-slider type="range"></v-slider>
    </div>
    <div class="section" v-show="hasFillColor">
      <span class="text-subtitle-2">Fill Color</span>
      <v-color-picker></v-color-picker>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component';
import { Watch } from 'vue-property-decorator';
import { SENodule } from '../models/SENodule';
import { State } from 'vuex-class';
import { Styles } from '../types/Styles';

const values = Object
  .entries(Styles)
  .filter(e => { const [a, b] = e; return typeof b === "number" });

const keys = values.map(e => { const [a, _] = e; return a })
@Component({})
export default class FrontStyle extends Vue {

  @State
  readonly selections!: SENodule[];

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
    return this.commonStyleProperties.findIndex(x => x === sNum) >= 0;
  }

  get hasStrokeColor() {
    return this.hasStyles(Styles.StrokeColor);
  }
  get hasStrokeWidth() {
    return this.hasStyles(Styles.StrokeWidth);
  }

  get hasFillColor() {
    return this.hasStyles(Styles.FillWhiteTint) || this.hasStyles(Styles.FillGrayTint);
  }
  @Watch("selections", { deep: true })
  onSelectionChanged(newSelection: SENodule[]): void {
    // newSelection.forEach(s => {
    // console.debug("Set ", s.customStyles());
    // })
    if (newSelection.length === 0) return;
    console.debug(keys)
    this.commonStyleProperties.clear();
    for (let k = 0; k < values.length; k++) {

      if (newSelection.every(s => s.customStyles().has(k)))
        this.commonStyleProperties.push(k);
    }
    const propNames = this.commonStyleProperties.map(n => keys[n]).join(", ");
    console.debug("Common props: ", propNames);
  }
}
</script>

<style lang="scss" scoped>
.section {
  border: 1px solid black;
  border-radius: 4px;
  padding: 0.25em;
}
</style>