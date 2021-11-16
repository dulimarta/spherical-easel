<template>
  <div>
    <span class="text-subtitle-2"
      :style="{'color' : conflict?'red':''}">{{ $t(titleKey) + " ("+thumbMap(styleData)+")" }}</span>
    <span v-if="numSelected > 1"
      class="text-subtitle-2"
      style="color:red">{{" "+ $t("style.labelStyleOptionsMultiple") }}</span>
    <br />

    <!-- The number selector slider -->
    <v-slider v-model.number="styleData"
      @change="changeEvent"
      v-bind="$attrs"
      type="range"
      class="mb-n4 pa-n4">
      <template v-slot:prepend>
        <v-icon @click="decrementDataValue">mdi-minus</v-icon>
      </template>
      <template v-slot:thumb-label="{ value }">
        {{ thumbMap(value) }}
      </template>
      <template v-slot:append>
        <v-icon @click="incrementDataValue">mdi-plus</v-icon>
      </template>
    </v-slider>

  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Prop, PropSync, Component } from "vue-property-decorator";

@Component
export default class SimpleNumberSelector extends Vue {
  @Prop() readonly titleKey!: string;
  @PropSync("data") styleData!: number;
  @Prop() readonly thumbStringValues?: string[];
  @Prop() readonly numSelected!: number;
  @Prop() conflict!: boolean;

  changeEvent(): void {
    this.$emit("resetColor");
  }
  //converts the value of the slider to the text message displayed in the thumb marker
  thumbMap(val: number): string {
    if (this.thumbStringValues === undefined) {
      return String(val);
    } else {
      const min = Number(this.$attrs?.min ?? 0);
      const step = Number(this.$attrs?.step ?? 1);
      return this.thumbStringValues[Math.floor((val - min) / step)];
    }
  }

  incrementDataValue(): void {
    console.debug("Increase slider", arguments);
    this.styleData += Number(this.$attrs?.step ?? 1);
  }
  decrementDataValue(): void {
    this.styleData -= Number(this.$attrs?.step ?? 1);
  }
}
</script>

<style lang="scss" scoped>
@import "@/scss/variables.scss";

.select-an-object-text {
  color: rgb(255, 82, 82);
}
</style>