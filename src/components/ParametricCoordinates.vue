<template>
  <div>
    <!-- <span v-for="c in points" :key="c.id">{{c.name}}</span> -->
    <div id="header" class="accent">
      <span class="text-subtitle-1">{{ label }}</span>
      <v-btn size="small" @click="expanded = !expanded">
        <v-icon v-if="!expanded">mdi-chevron-right</v-icon>
        <v-icon v-else>mdi-chevron-down</v-icon>
      </v-btn>
    </div>

    <transition name="slide-right">
      <div v-show="expanded" id="__test_coordinates">
        <template v-for="(coordinate, idk) in coordinateData" :key="idk">
          <!-- content goes here -->
          <ParametricCoordinate class="__test_coord_input"
            :placeholder="coordinate.placeholder"
            v-model="formula[idk]"
            :use-t-value="useTValue"
            :label="coordinate.label"
            :tooltip="coordinate.tooltip"></ParametricCoordinate>
        </template>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
</script>
<script lang="ts" setup>
import { ref, Ref, onBeforeUpdate } from "vue";
import ParametricCoordinate from "@/components/ParametricCoordinate.vue";

const props = defineProps<{
  coordinateData: any[];
  label: string;
  useTValue: number
}>();

// const formula: Ref<Array<string>> = ref([])
//   Array.from({ length: props.coordinateData.length }, () => "SE")
// );

let formula = defineModel<Array<string>>({
  required: true
})
const expanded = ref(false);

onBeforeUpdate(() => {
  formula.value = Array.from({ length: props.coordinateData.length }, () => "")

})
// get hasExistingChildren(): boolean {
//   return this.existingChildren.length > 0;
// }

// name(node: SENodule): string {
//   return node?.name ?? "None";
// }

// get existingChildren(): SENodule[] {
//   return this.children.filter((n: SENodule) => {
//     if (n instanceof SEIntersectionPoint) return n.isUserCreated;
//     else return n.exists;
//   });
// }

//When a user clicks on an expression this sends the token name to the expression builder (ExpressionForm.vue)
function onExpressionSelect(x: any): void {
  // const pos = this.children.findIndex(n => n.id === x.id);
  // // console.debug("****Selection", x, "at", pos);
  // if (pos >= 0) {
  //   EventBus.fire(
  //     "measurement-selected",
  //     this.children[pos].name
  //   );
  // }
}
</script>

<style scoped lang="scss">
#header {
  display: flex;
  flex-direction: row;
  align-items: center;

  span {
    margin-left: 0.25em;
    flex-grow: 1;
  }
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: all;
  transition-duration: 250ms;
}

.slide-right-enter,
.slide-right-leave-to {
  // Start position is far left
  transform: translateX(-100%);
}
</style>
