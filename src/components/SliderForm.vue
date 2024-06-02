<template>
  <v-form v-model="isValid">
    <div id="dataEntry">
      <v-text-field
        id="_test_input_min"
        v-bind:label="$t('objectTree.min')"
        class="field _test_input"
        variant="outlined"
        density="compact"
        v-model.number="sliderMin"
        :error="sliderMin > sliderMax">
      </v-text-field>
      <v-text-field
        id="_test_input_step"
        v-bind:label="$t('objectTree.step')"
        class="field _test_input"
        variant="outlined"
        density="compact"
        v-model.number="sliderStep"
        :error="sliderStep > sliderMax - sliderMin"></v-text-field>
      <v-text-field
        id="_test_input_max"
        v-bind:label="$t('objectTree.max')"
        class="field _test_input"
        variant="outlined"
        density="compact"
        v-model.number="sliderMax"
        :error="sliderMax < sliderMin"></v-text-field>
    </div>
    <v-slider
      id="_test_slider"
      v-model="sliderValue"
      :min="sliderMin"
      :max="sliderMax"
      :step="sliderStep"
      thumb-label="always"
      background-color="accent lighten-2"
      show-ticks="always"
      tick-size="4"></v-slider>
    <v-divider> </v-divider>
    <div id="action">
      <v-btn
        id="_test_add_slider"
        color="primary"
        :disabled="!isValid"
        @click="addSlider"
        >{{ $t("objectTree.create") }}</v-btn
      >
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
<script lang="ts" setup>
import  {ref, watch} from "vue";
import { SESlider } from "@/models/SESlider";
import { AddSliderMeasurementCommand } from "@/commands/AddSliderMeasurementCommand";
  const sliderMin = ref(0);
  const sliderMax = ref(1);
  const sliderStep = ref(0.1);
  const sliderValue = ref(0);

  const isValid = ref(false);

  function addSlider(): void {
    const sliderMeasure = new SESlider({
      min: sliderMin.value,
      max: sliderMax.value,
      step: sliderStep.value,
      value: sliderValue.value
    });
    new AddSliderMeasurementCommand(sliderMeasure).execute();
  }

  function adjustSlidertep() {
    const numTicks = (sliderMax.value - sliderMin.value) / sliderStep.value;
    // console.debug(
    //   `Min:${sliderMin.value}, Max=${sliderMax.value}, Step=${sliderStep.value}`
    // );
    if (numTicks > 25) {
      sliderStep.value = (sliderMax.value - sliderMin.value) / 25;
    }
  }

  watch(() => sliderMin.value, (newVal: number): void =>{
    if (newVal > sliderMax.value || sliderStep.value === 0) return;
    adjustSlidertep();
  })

  watch(() => sliderMax.value, (newVal: number): void => {
    if (newVal < sliderMin.value || sliderStep.value === 0) return;
    adjustSlidertep();
  })
</script>
