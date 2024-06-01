<template>
  <div>
    <span class="text-subtitle-2" :style="{ color: conflict ? 'red' : '' }">
      {{ title + " (" + thumbMap(sliderValue ?? 0) + ")" }}
    </span>
    <span v-if="numSelected > 1" class="text-subtitle-2" style="color: red">
      {{ t("labelStyleOptionsMultiple") }}
    </span>

    <!-- The number selector slider -->
    <v-slider v-bind:="attrs" :disabled="numSelected == 0 || conflict && numSelected > 1"
    v-model="sliderValue" thumb-label show-ticks>
      <template v-slot:prepend>
        <v-icon @click="decrementDataValue">mdi-minus</v-icon>
      </template>
      <template v-slot:append>
        <v-icon @click="incrementDataValue">mdi-plus</v-icon>
      </template>
      <template #thumb-label="{modelValue}">
        <span>{{ thumbMap(modelValue) }}</span>
      </template>
    </v-slider>
  </div>
</template>

<script setup lang="ts">
import { ref, useAttrs, Ref, defineModel } from "vue";
import { useI18n } from "vue-i18n";
const {t} = useI18n()
const sliderValue = defineModel({type: Number})
const attrs = useAttrs();
type ComponentProps = {
  title: string;
  thumbStringValues: Array<string>;
  numSelected: number;
  conflict: boolean;
};
let props = defineProps<ComponentProps>();

//converts the value of the slider to the text message displayed in the thumb marker
function thumbMap(val: number): string {
  if (
    // Array.isArray(props.thumbStringValues) &&
    props.thumbStringValues.length > 0
  ) {
    const min = Number(attrs?.min ?? 0);
    const step = Number(attrs?.step ?? 1);
    return props.thumbStringValues[Math.floor((val - min) / step)] ?? "NaN";
    // } else {
    // return String(val);
  }
  return "Yes";
}

function incrementDataValue(): void {
  const step = Number(attrs?.step);
  // console.debug("Increase slider by", step);
  sliderValue.value! += step;
}
function decrementDataValue(): void {
  sliderValue.value! -= Number(attrs?.step ?? 1);
}
</script>

<style lang="scss" scoped>
@import "@/scss/variables.scss";

.select-an-object-text {
  color: rgb(255, 82, 82);
}
</style>
<i18n lang="json" locale="en">
{
  "labelStyleOptionsMultiple": "(multiple)"
}
</i18n>