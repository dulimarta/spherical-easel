<template>
  <span class="text-subtitle-2" :style="{ color: conflict ? 'red' : '' }">
    {{ $t(titleKey) + " (" + thumbMap(props.modelValue) + ")" }}
  </span>
  <span v-if="numSelected > 1" class="text-subtitle-2" style="color: red">
    {{ " " + $t("style.labelStyleOptionsMultiple") }}
  </span>
  <br />

  <!-- The number selector slider -->
  <v-slider
    @update:model-value="valueChanged"
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
</template>

<script setup lang="ts">
import { useAttrs } from "vue";

const attrs = useAttrs();
type ComponentProps = {
  titleKey: string;
  modelValue: number;
  thumbStringValues: Array<string>;
  numSelected: number;
  conflict: boolean;
};

const props = defineProps<ComponentProps>();
const emit = defineEmits(["update:modelValue"]);
// @Component
// export default class SimpleNumberSelector extends Vue {
// @Prop() readonly titleKey!: string;
// @PropSync("data") styleData!: number;
// @Prop() readonly thumbStringValues?: string[];
// @Prop() readonly numSelected!: number;
// @Prop() conflict!: boolean;
let styleData = Number(attrs.value);

function valueChanged(val: number): void {
  // this.$emit("resetColor");
  emit("update:modelValue", val);
}
//converts the value of the slider to the text message displayed in the thumb marker
function thumbMap(val: number): string {
  if (Array.isArray(props.thumbStringValues) && props.thumbStringValues.length > 0) {
    const min = Number(attrs?.min ?? 0);
    const step = Number(attrs?.step ?? 1);
    return props.thumbStringValues[Math.floor((val - min) / step)];
  } else {
    if (val) {
      return String(val);
    }
    else {
      return String(props.modelValue);
    }
  }
}

function incrementDataValue(): void {
  console.debug("Increase slider", arguments);
  styleData += Number(attrs?.step ?? 1);
  emit("update:modelValue", styleData);
}
function decrementDataValue(): void {
  styleData -= Number(attrs?.step ?? 1);
  emit("update:modelValue", styleData);
}
</script>

<style lang="scss" scoped>
@import "@/scss/variables.scss";

.select-an-object-text {
  color: rgb(255, 82, 82);
}
</style>
