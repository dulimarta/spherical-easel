<template>

  <v-form v-model="isValid">
    <div id="dataEntry">
      <v-text-field id="_test_input_min"
        v-bind:label="$t('objectTree.min')"
        class="field _test_input"
        outlined
        dense
        v-model.number="sliderMin"
        :error="sliderMin > sliderMax">
      </v-text-field>
      <v-text-field id="_test_input_step"
        v-bind:label="$t('objectTree.step')"
        class="field _test_input"
        outlined
        dense
        v-model.number="sliderStep"
        :error="sliderStep > sliderMax - sliderMin"></v-text-field>
      <v-text-field id="_test_input_max"
        v-bind:label="$t('objectTree.max')"
        class="field _test_input"
        outlined
        dense
        v-model.number="sliderMax"
        :error="sliderMax < sliderMin"></v-text-field>
    </div>
    <v-slider id="_test_slider"
      v-model="sliderValue"
      :min="sliderMin"
      :max="sliderMax"
      :step="sliderStep"
      thumb-label="always"
      background-color="accent lighten-2"
      ticks="always"
      tick-size="4"></v-slider>
    <v-divider>
    </v-divider>
    <div id="action">
      <v-btn id="_test_add_slider"
        color="primary"
        text
        :disabled="!isValid"
        @click="addSlider">{{$t("objectTree.create")}}</v-btn>
    </div>
  </v-form>

</template>
<style lang="scss" scoped>
#dataEntry {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-top: 0.5em;
  .field {
    max-width: 5em;
    min-width: 3em;
  }
}

#action {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
}
</style>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { SESlider } from "@/models/SESlider";
import { Watch } from "vue-property-decorator";
import { AddSliderMeasurementCommand } from "@/commands/AddSliderMeasurementCommand";
@Component
export default class SliderForm extends Vue {
  private sliderMin = 0;
  private sliderMax = 1;
  private sliderStep = 0.1;
  private sliderValue = 0;

  private isValid = false;

  addSlider(): void {
    const sliderMeasure = new SESlider({
      min: this.sliderMin,
      max: this.sliderMax,
      step: this.sliderStep,
      value: this.sliderValue
    });
    new AddSliderMeasurementCommand(sliderMeasure).execute();
  }

  private adjustSlidertep() {
    const numTicks = (this.sliderMax - this.sliderMin) / this.sliderStep;
    // console.debug(
    //   `Min:${this.sliderMin}, Max=${this.sliderMax}, Step=${this.sliderStep}`
    // );
    if (numTicks > 25) {
      this.sliderStep = (this.sliderMax - this.sliderMin) / 25;
    }
  }

  @Watch("sliderMin")
  onMinimumChanged(newVal: number): void {
    if (newVal > this.sliderMax || this.sliderStep === 0) return;
    this.adjustSlidertep();
  }

  @Watch("sliderMax")
  onMaximumChanged(newVal: number): void {
    if (newVal < this.sliderMin || this.sliderStep === 0) return;
    this.adjustSlidertep();
  }
}
</script>