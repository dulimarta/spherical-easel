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
            <AddressInput :isLine="true" v-model:place-id="firstPlaceID" v-model:point="firstPoint" :trigger="trigger"/>
          </Suspense>
          <Suspense>
            <AddressInput :isLine="true" v-model:place-id="secondPlaceID" v-model:point="secondPoint" :trigger="trigger"/>
          </Suspense>
          <v-btn @click="trigger=!trigger" :disabled="firstPlaceID===null||secondPlaceID===null||firstPlaceID.length===0||secondPlaceID.length===0">Draw</v-btn>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>

</template>
<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { useSEStore } from "@/stores/se";
import AddressInput from "./AddressInput.vue";
import { SELabel, SELine, SEPoint, SESegment } from "@/models/internal";
import { Ref, ref } from "vue";
import { watch } from "vue";
import * as THREE from "three";
import { AddLineCommand } from "@/commands/AddLineCommand";
import { AddSegmentCommand } from "@/commands/AddSegmentCommand";
const seStore = useSEStore();
const {
  isEarthMode
} = storeToRefs(seStore);
const firstPoint:Ref<undefined|SEPoint> = ref();
const secondPoint:Ref<undefined|SEPoint> = ref();
const firstPlaceID = ref("")
const secondPlaceID = ref("")
const trigger=ref(true);
watch([()=>firstPoint.value, ()=>secondPoint.value], ()=>{
  if(firstPoint.value!= null && secondPoint.value!= null){
    const lineNormal = new THREE.Vector3();
    lineNormal.crossVectors(firstPoint.value.locationVector, secondPoint.value.locationVector);
    lineNormal.normalize();
    const newLine = new SELine(firstPoint.value, lineNormal,secondPoint.value);
    const newSeg = new SESegment(firstPoint.value,lineNormal,firstPoint.value.locationVector.angleTo(secondPoint.value.locationVector),secondPoint.value);
    const lineLabel = new SELabel("line",newLine);
    const cmdSeg = new AddSegmentCommand(newSeg,firstPoint.value,secondPoint.value,lineLabel)
    cmdSeg.execute();
    firstPoint.value = undefined;
    secondPoint.value = undefined;
  }
})

</script>