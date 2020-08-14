<template>
  <v-card>
    <v-card-title class="headline">
      Measurement Slider
    </v-card-title>
    <v-card-text>
      <v-container>
        <v-row>
          <v-col cols="4">
            <v-text-field label="Min"
              v-model.number="sliderMin"></v-text-field>
          </v-col>
          <v-col cols="4">
            <v-text-field label="Max"
              v-model.number="sliderMax"></v-text-field>
          </v-col>
          <v-col cols="4">
            <v-text-field label="Step"
              v-model.number="sliderStep"></v-text-field>
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>
    <v-divider>
    </v-divider>
    <v-card-actions>
      <v-spacer />
      <v-btn color="primary"
        text
        @click="addSlider">Create</v-btn>
    </v-card-actions>
  </v-card>
</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { SESlider } from "@/models/SESlider";
import { AddExpressionCommand } from "@/commands/AddExpressionCommand";
@Component
export default class SliderFoorm extends Vue {
  private sliderMin = 0;
  private sliderMax = 1;
  private sliderStep = 0.1;
  addSlider(): void {
    const sliderMeasure = new SESlider({
      min: this.sliderMin,
      max: this.sliderMax,
      step: this.sliderStep
    });
    new AddExpressionCommand(sliderMeasure).execute();
  }
}
</script>