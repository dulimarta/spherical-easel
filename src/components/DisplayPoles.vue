<template>
  <div>
    <v-col>
      <v-switch
        hide-details
        v-model="showNorthPole"
        density="compact"
        variant="outlined"
        :label="t('northPole')"
        @click="displayPole(Pole.NORTH)"></v-switch>
      <v-switch
        hide-details
        v-model="showSouthPole"
        density="compact"
        variant="outlined"
        :label="t('southPole')"
        @click="displayPole(Pole.SOUTH)"></v-switch>
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
import { onMounted, ref, watch, Ref } from "vue";
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

const store = useSEStore();
const { inverseTotalRotationMatrix, sePoints } = storeToRefs(store);
const { t } = useI18n();

let showNorthPole = ref(false);
const showSouthPole = ref(false);

let seNorthPole: SEEarthPoint | undefined = undefined;
let seSouthPole: SEEarthPoint | undefined = undefined;

//watch(() => sePoints.value.filter(pt => pt instanceof SEEarthPoint).length);

function findPoleInObjectTree(pole: Pole): SEEarthPoint | undefined {
  const seEarthPoints = sePoints.value
    .filter(pt => pt instanceof SEEarthPoint)
    .map(pt => pt as SEEarthPoint);
  return seEarthPoints.find(
    pt => pt.latitude === (Pole.NORTH === pole ? 90 : -90) && pt.longitude === 0
  );
}

//Return the command to add the north pole to the object tree so that it can be grouped with the other hide/show commands.
function setSEPoleVariable(pole: Pole): undefined | Command {
  //Find the north or south pole in the store of sePoints, if it exists
  let sePole = findPoleInObjectTree(pole);
  let cmd: Command | undefined = undefined;
  if (sePole === undefined) {
    // Initialize/create the north pole and add it to the object tree
    sePole =
      pole === Pole.NORTH ? new SEEarthPoint(0, 90) : new SEEarthPoint(0, -90);
    const poleVector =
      pole === Pole.NORTH ? new Vector3(0, 0, 1) : new Vector3(0, 0, -1);
    const rotationMatrix = new Matrix4();
    rotationMatrix.copy(inverseTotalRotationMatrix.value).invert();
    poleVector.applyMatrix4(rotationMatrix);
    sePole.locationVector = poleVector;
    const poleSELabel = new SELabel("point", sePole);
    // stylize the north pole
    poleSELabel.ref.caption =
      pole === Pole.NORTH ? t("northPole") : t("southPole");
    poleSELabel.update();
    cmd = new AddEarthPointCommand(sePole, poleSELabel);
  }
  if (pole === Pole.NORTH) {
    seNorthPole = sePole;
  } else {
    seSouthPole = sePole;
  }
  return cmd;
}

// If the user clicks undo or redo or the hide/show in the object tree or style panel,
// we need to update the value of showNorth/SouthPole

onMounted(() => {
  // set the show(North|South)Pole.value if the (South|North)Pole has already been created and put into the object tree
  seSouthPole = findPoleInObjectTree(Pole.SOUTH);
  seNorthPole = findPoleInObjectTree(Pole.NORTH);
  if (seNorthPole !== undefined) {
    showNorthPole.value = seNorthPole.showing;
  }
  if (seSouthPole !== undefined) {
    showSouthPole.value = seSouthPole.showing;
  }
});

enum Pole {
  NORTH,
  SOUTH
}
function displayPole(pole: Pole) {
  let displayCommandGroup = new CommandGroup();
  if (pole === Pole.NORTH) {
    //console.log("northpole name ", seNorthPole ? seNorthPole.name : "");
    if (seNorthPole === undefined) {
      const cmd = setSEPoleVariable(Pole.NORTH); // onces this executes seNorthPole is defined and we can control the visibility
      if (cmd !== undefined) {
        displayCommandGroup.addCommand(cmd);
      }
    }
    if (seNorthPole !== undefined) {
      displayCommandGroup.addCommand(
        new SetNoduleDisplayCommand(seNorthPole, !showNorthPole.value)
      ); // also hides the label if SETTINGS.hideObjectHidesLabel is true
      if (
        seNorthPole.label &&
        (showNorthPole.value
          ? !SETTINGS.hideObjectHidesLabel
          : !SETTINGS.showObjectShowsLabel)
      ) {
        displayCommandGroup.addCommand(
          new SetNoduleDisplayCommand(seNorthPole.label, !showNorthPole.value)
          // also hide/shows the label if needed
        );
      }
    }
  } else {
    // South Pole
    //console.log("northpole name ", seSouthPole ? seSouthPole.name : "");
    if (seSouthPole === undefined) {
      const cmd = setSEPoleVariable(Pole.SOUTH); // onces this executes seSouthPole is defined and we can control the visibility
      if (cmd !== undefined) {
        displayCommandGroup.addCommand(cmd);
      }
    }
    if (seSouthPole !== undefined) {
      displayCommandGroup.addCommand(
        new SetNoduleDisplayCommand(seSouthPole, !showSouthPole.value)
      ); // also hides the label if SETTINGS.hideObjectHidesLabel is true
      if (
        seSouthPole.label &&
        (showSouthPole.value
          ? !SETTINGS.hideObjectHidesLabel
          : !SETTINGS.showObjectShowsLabel)
      ) {
        displayCommandGroup.addCommand(
          new SetNoduleDisplayCommand(seSouthPole.label, !showSouthPole.value)
          // also hide/shows the label if needed
        );
      }
    }
  }
  displayCommandGroup.execute();
}

function displayEquator() {}
</script>
