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
            <AddressInput :isLine="true" v-model:point="firstPoint" :trigger="trigger"/>
          </Suspense>
          <Suspense>
            <AddressInput :isLine="true" v-model:point="secondPoint" :trigger="trigger"/>
          </Suspense>
          <v-btn @click="trigger=!trigger">Draw</v-btn>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>

</template>
<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { useSEStore } from "@/stores/se";
import AddressInput from "./AddressInput.vue";
import { SELabel, SELine, SEPoint } from "@/models/internal";
import { Ref, ref } from "vue";
import { watch } from "vue";
import * as THREE from "three";
import { AddLineCommand } from "@/commands/AddLineCommand";
const seStore = useSEStore();
const {
  isEarthMode
} = storeToRefs(seStore);
const firstPoint:Ref<undefined|SEPoint> = ref();
const secondPoint:Ref<undefined|SEPoint> = ref();
const trigger=ref(true);
watch([()=>firstPoint.value, ()=>secondPoint.value], ([first, second])=>{
  console.log("watch")
  if(firstPoint.value!= null && secondPoint.value!= null){
    console.log(firstPoint.value)
    console.log(secondPoint.value)
    const lineNormal = new THREE.Vector3();
    lineNormal.crossVectors(firstPoint.value.locationVector, secondPoint.value.locationVector);
    lineNormal.normalize();
    const newLine = new SELine(firstPoint.value, lineNormal,secondPoint.value);
    const lineLabel = new SELabel("line",newLine);
    const cmd = new AddLineCommand(newLine,firstPoint.value,secondPoint.value,lineLabel);
    cmd.execute();
    firstPoint.value = undefined;
    secondPoint.value = undefined;
  }
})

</script>