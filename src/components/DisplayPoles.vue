<template>
  <div>
    <v-col>
      <v-switch
        hide-details
        v-model="showNorthPole"
        density="compact"
        variant="outlined"
        :label="t('northPole')"
        @click="displayPole(Poles.NORTH)"></v-switch>
      <v-switch
        hide-details
        v-model="showSouthPole"
        density="compact"
        variant="outlined"
        :label="t('southPole')"
        @click="displayPole(Poles.SOUTH)"></v-switch>
    </v-col>
  </div>
</template>
<i18n lang="json" locale="en">
{
  "northPole": "North Pole",
  "southPole": "South Pole"
}
</i18n>

<style></style>
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch, Ref, toRaw } from "vue";
import { Vector3, Matrix4 } from "three";
import { SELabel } from "@/models/SELabel";
import { AddEarthPointCommand } from "@/commands/AddEarthPointCommand";
import { useSEStore } from "@/stores/se";
import { storeToRefs } from "pinia";
import { SEEarthPoint } from "@/models/SEEarthPoint";
import { useI18n } from "vue-i18n";
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";
import { CommandGroup } from "@/commands/CommandGroup";
import SETTINGS from "@/global-settings";
import { Command } from "@/commands/Command";
import { SENodule } from "@/models/SENodule";
import EventBus from "@/eventHandlers/EventBus";
import { Poles } from "@/types/index";

const store = useSEStore();
const { inverseTotalRotationMatrix, sePoints } = storeToRefs(store);
const { t } = useI18n();

let showNorthPole = ref(false);
let showSouthPole = ref(false);

const seNorthPole = ref<SEEarthPoint | undefined>(undefined);
const seSouthPole = ref<SEEarthPoint | undefined>(undefined);

// watch(
//   () => sePoints.value,
//   points => {
//     const northPoleList = points
//       .filter(
//         pt =>
//           pt instanceof SEEarthPoint && pt.latitude === 90 && pt.longitude === 0
//       )
//       .map(pt => pt as SEEarthPoint);

//     if (northPoleList[0]) {
//       seNorthPole.value = northPoleList[0];
//       showNorthPole.value = northPoleList[0].showing;
//     } else {
//       // the north pole doesn't exist (or was deleted)
//       seNorthPole.value = undefined;
//       showNorthPole.value = false;
//     }
//     console.log("execute ", seNorthPole.value);
//   }
// );

// watch(
//   () => seNorthPole.value,
//   () => {
//     console.log("second watcher execute", seNorthPole.value);
//     if (seNorthPole.value) {
//       console.log("seNorthPole.value.showing", seNorthPole.value.showing);
//       showNorthPole.value = seNorthPole.value.showing;
//     }
//   },
//   { deep: true }
// );

function findPoleInObjectTree(pole: Poles): SEEarthPoint | undefined {
  const seEarthPoints = sePoints.value
    .filter(pt => pt instanceof SEEarthPoint)
    .map(pt => pt as SEEarthPoint);
  return seEarthPoints.find(
    pt =>
      pt.latitude === (Poles.NORTH === pole ? 90 : -90) && pt.longitude === 0
  );
}

onMounted(() => {
  // set the show(North|South)Pole.value if the (South|North)Pole has already been created and put into the object tree
  seSouthPole.value = findPoleInObjectTree(Poles.SOUTH);
  seNorthPole.value = findPoleInObjectTree(Poles.NORTH);
  if (seNorthPole.value !== undefined) {
    showNorthPole.value = seNorthPole.value.showing;
  }
  if (seSouthPole.value !== undefined) {
    showSouthPole.value = seSouthPole.value.showing;
  }
  EventBus.listen("update-pole-switch", poleSwitch); //NP
});

//NP
function poleSwitch(e: { pole: Poles; val: boolean }) {
  if (e.pole == Poles.NORTH) {
    showNorthPole.value = e.val;
  } else {
    showSouthPole.value = e.val;
  }
}

onBeforeUnmount((): void => {
  EventBus.unlisten("update-pole-switch"); //NP
});
//Return the command to add the north pole to the object tree so that it can be grouped with the other hide/show commands.
function setSEPoleVariable(pole: Poles): undefined | Command {
  //Find the north or south pole in the store of sePoints, if it exists
  let sePole = findPoleInObjectTree(pole);
  let cmd: Command | undefined = undefined;
  if (sePole === undefined) {
    // Initialize/create the north pole and add it to the object tree
    sePole =
      pole === Poles.NORTH ? new SEEarthPoint(0, 90) : new SEEarthPoint(0, -90);
    const poleVector =
      pole === Poles.NORTH ? new Vector3(0, 0, 1) : new Vector3(0, 0, -1);
    const rotationMatrix = new Matrix4();
    rotationMatrix.copy(inverseTotalRotationMatrix.value).invert();
    poleVector.applyMatrix4(rotationMatrix);
    sePole.locationVector = poleVector;
    const poleSELabel = new SELabel("point", sePole);
    // stylize the north pole
    poleSELabel.ref.caption =
      pole === Poles.NORTH ? t("northPole") : t("southPole");
    poleSELabel.update();
    cmd = new AddEarthPointCommand(sePole, poleSELabel);
  }
  //Now set the pole into the local variable so it can be accessed in this component
  if (pole === Poles.NORTH) {
    seNorthPole.value = sePole;
  } else {
    seSouthPole.value = sePole;
  }
  return cmd;
}

// If the user clicks undo or redo or the hide/show in the object tree or style panel,
// we need to update the value of showNorth/SouthPole

function displayPole(pole: Poles) {
  let displayCommandGroup = new CommandGroup();
  if (pole === Poles.NORTH) {
    //console.log("north pole name ", seNorthPole ? seNorthPole.name : "");
    if (seNorthPole.value === undefined) {
      const cmd = setSEPoleVariable(Poles.NORTH); // onces this executes seNorthPole is defined and we can control the visibility
      if (cmd !== undefined) {
        displayCommandGroup.addCommand(cmd);
      }
    }
    if (seNorthPole.value !== undefined) {
      displayCommandGroup.addCommand(
        new SetNoduleDisplayCommand(seNorthPole.value, !showNorthPole.value)
      ); // also hides the label if SETTINGS.hideObjectHidesLabel is true
      if (
        seNorthPole.value.label &&
        (showNorthPole.value
          ? !SETTINGS.hideObjectHidesLabel
          : !SETTINGS.showObjectShowsLabel)
      ) {
        displayCommandGroup.addCommand(
          new SetNoduleDisplayCommand(
            seNorthPole.value.label,
            !showNorthPole.value
          )
          // also hide/shows the label if needed
        );
      }
    }
  } else {
    // South Pole
    //console.log("south pole name ", seSouthPole ? seSouthPole.name : "");
    if (seSouthPole.value === undefined) {
      const cmd = setSEPoleVariable(Poles.SOUTH); // onces this executes seSouthPole.value is defined and we can control the visibility
      if (cmd !== undefined) {
        displayCommandGroup.addCommand(cmd);
      }
    }
    if (seSouthPole.value !== undefined) {
      displayCommandGroup.addCommand(
        new SetNoduleDisplayCommand(seSouthPole.value, !showSouthPole.value)
      ); // also hides the label if SETTINGS.hideObjectHidesLabel is true
      if (
        seSouthPole.value.label &&
        (showSouthPole.value
          ? !SETTINGS.hideObjectHidesLabel
          : !SETTINGS.showObjectShowsLabel)
      ) {
        displayCommandGroup.addCommand(
          new SetNoduleDisplayCommand(
            seSouthPole.value.label,
            !showSouthPole.value
          )
          // also hide/shows the label if needed
        );
      }
    }
  }
  displayCommandGroup.execute();
  EventBus.fire("update-label-and-showing-display", {}); //NP
}
</script>
