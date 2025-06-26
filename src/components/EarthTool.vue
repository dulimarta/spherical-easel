<template>
  <!-- <div style="display: flex;"> -->
  <v-switch
    style="padding-left: 8px"
    hide-details
    color="primary"
    density="compact"
    variant="outlined"
    v-model="isEarthMode"
    :label="t('earthMode')"></v-switch>
  <!-- </div> -->
  <v-expansion-panels style="gap: 10px; padding-right: 8px">
    <v-expansion-panels>
      <v-expansion-panel style="border-radius: 8px">
        <v-expansion-panel-title>
          <h3 class="body-1 font-weight-bold button-group-heading">{{t('point')}}</h3>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <Suspense>
            <AddressInput />
          </Suspense>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <v-expansion-panels>
      <v-expansion-panel style="border-radius: 8px">
        <v-expansion-panel-title>
          <h3 class="body-1 font-weight-bold button-group-heading">{{t('line')}}</h3>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-icon>mdi-crosshairs-gps</v-icon>
          <v-icon>mdi-map-marker</v-icon>
          <Suspense>
            <AddressInput
              :isLine="true"
              v-model:place-id="firstPlaceID"
              v-model:point="firstPoint"
              :draw-line="trigger" />
          </Suspense>
          <Suspense>
            <AddressInput
              :isLine="true"
              v-model:place-id="secondPlaceID"
              v-model:point="secondPoint"
              :draw-line="trigger" />
          </Suspense>

          <v-btn
            @click="trigger = !trigger"
            :disabled="
              firstPlaceID === null ||
              secondPlaceID === null ||
              firstPlaceID.length === 0 ||
              secondPlaceID.length === 0
            ">
            {{ t('draw') }}
          </v-btn>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-expansion-panels>
  <AddEarthObject v-if="isEarthMode" />
</template>
<style scoped lang="scss">
#address-box {
  display: grid;
  grid-template-rows: repeat(3, 1fr);
  grid-template-columns: repeat(2, 1fr);
}
</style>
<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { useSEStore } from "@/stores/se";
import AddressInput from "./AddressInput.vue";
import AddEarthObject from "./AddEarthObject.vue";
import { Ref, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import * as THREE from "three";
// import { AddLineCommand } from "@/commands/AddLineCommand";
import { AddSegmentCommand } from "@/commands/AddSegmentCommand";
import { SEExpression } from "@/models/SEExpression";
import { CommandGroup } from "@/commands/CommandGroup";
import { SetValueDisplayModeCommand } from "@/commands/SetValueDisplayModeCommand";
import { SetEarthModeCommand } from "@/commands/SetEarthModeCommand";
import Label from "@/plottables/Label";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { SESegment } from "@/models/SESegment";
import { SELabel } from "@/models/SELabel";
import { SEAngleMarker } from "@/models/SEAngleMarker";

const seStore = useSEStore();
const { isEarthMode, seNodules } = storeToRefs(seStore);
const {t} = useI18n()
const firstPoint: Ref<undefined | SEPoint> = ref();
const secondPoint: Ref<undefined | SEPoint> = ref();
const firstPlaceID = ref("");
const secondPlaceID = ref("");
const trigger = ref(true);
watch([() => firstPoint.value, () => secondPoint.value], () => {
  if (firstPoint.value != null && secondPoint.value != null) {
    const lineNormal = new THREE.Vector3();
    lineNormal.crossVectors(
      firstPoint.value.locationVector,
      secondPoint.value.locationVector
    );
    lineNormal.normalize();
    const newLine = new SELine(firstPoint.value, lineNormal, secondPoint.value);
    const newSeg = new SESegment(
      firstPoint.value,
      lineNormal,
      firstPoint.value.locationVector.angleTo(secondPoint.value.locationVector),
      secondPoint.value
    );
    const lineLabel = new SELabel("line", newLine);
    const cmdSeg = new AddSegmentCommand(
      newSeg,
      firstPoint.value,
      secondPoint.value,
      lineLabel
    );
    cmdSeg.execute();
    firstPoint.value = undefined;
    secondPoint.value = undefined;
  }
});

watch(
  () => isEarthMode.value,
  (earthModeActive: boolean) => {
    Label.isEarthMode = earthModeActive
    // localIsEarthMode.value = !localIsEarthMode.value;
    let setNoduleDisplayCommandGroup = new CommandGroup();
    setNoduleDisplayCommandGroup.addCommand(
      new SetEarthModeCommand(earthModeActive)
    );
    // Use the store to record the current state of the value display modes of the all SEExpression objects
    let seExpressions = seNodules.value
      .filter(
        nodule =>
          nodule instanceof SEExpression && !(nodule instanceof SEAngleMarker) // AngleMarkers units are never km or mi
      )
      .map(nodule => nodule as SEExpression);

    if (seExpressions.length !== 0) {
      // The click operation on the switch triggers before the isEarthMode variable
      // is changed, so at this point in the code when the isEarthMode is false we have entered EarthMode
      seExpressions.forEach(seExpression => {
        let VDMArray =
          seExpression.recordCurrentValueDisplayModeAndUpdate(earthModeActive);
        setNoduleDisplayCommandGroup.addCommand(
          new SetValueDisplayModeCommand(seExpression, VDMArray[0], VDMArray[1])
        );
      });
    }
    // The click operation on the switch triggers before the isEarthMode variable hence the !localIsEarthMode

    setNoduleDisplayCommandGroup.execute();
  }
);
</script>
<i18n locale="en" lang="json">
{
  "point": "Point",
  "earthMode": "Earth Mode",
  "line": "Line",
  "draw": "Draw Segment"
}
</i18n>
<i18n locale="id" lang="json">
  {
    "point": "Titik",
    "earthMode": "Peta Bumi",
    "line": "Garis",
    "draw": "Tampilkan Segmen"
  }
  </i18n>