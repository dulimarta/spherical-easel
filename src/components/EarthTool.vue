<template>
  <div style="padding-left: 15px;">
    <v-switch
              hide-details
              color="primary"
              :class="['earthToggler']"
              density="compact"
              variant="outlined"
              v-model="isEarthMode"
              label="Earth Mode">
    </v-switch>
    <v-expansion-panels>
      <v-expansion-panel>
        <v-expansion-panel-title>
          Point
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <Suspense>
            <AddressInput/>
          </Suspense>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel>
        <v-expansion-panel-title>
          Line
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <Suspense>
            <AddressInput :isLine="true" :point="firstPoint"/>
          </Suspense>
          <Suspense>
            <AddressInput :isLine="true" :point="secondPoint"/>
          </Suspense>
          <v-btn @click="createLine">Draw</v-btn>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>

</template>
<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { useSEStore } from "@/stores/se";
import AddressInput from "./AddressInput.vue";
import { SEPoint } from "@/models/internal";
import { Ref, ref } from "vue";
const seStore = useSEStore();
const {
  isEarthMode
} = storeToRefs(seStore);
const firstPoint:Ref<undefined|SEPoint> = ref();
const secondPoint:Ref<undefined|SEPoint> = ref();

function createLine(){
  console.log(firstPoint.value)
  console.log(secondPoint.value)
}
</script>