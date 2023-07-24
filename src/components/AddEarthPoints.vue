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
      <v-divider :thickness="8" color="black"></v-divider>
      <v-form ref="form">
        <v-text-field
          :label="t('latitude')"
          clearable
          density="compact"
          :rules="[numberCheck]"
          v-model="latitudeNumber"></v-text-field>
        <v-text-field
          :label="t('longitude')"
          density="compact"
          clearable
          v-model="longitudeNumber"></v-text-field>
        <v-btn
          :disabled="addButtonDisabled"
          variant="outlined"
          density="compact"
          @click="addEarthPoint()">
          {{ t("addPoint") }}
        </v-btn>
      </v-form>
    </v-col>
  </div>
</template>
<i18n lang="json" locale="en">
{
  "northPole": "North Pole",
  "southPole": "South Pole",
  "latitude": "Degrees Latitude",
  "longitude": "Degrees longitude",
  "numbersOnly": "Enter only numbers",
  "latitudeRange": "Latitude must be between -90 and 90 degrees",
  "longitudeRange": "Longitude must be between -180 and 180 degrees",
  "addPoint": "Add Point"
}
</i18n>

<style></style>
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, computed, watch } from "vue";
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
import { useEarthCoordinate } from "@/composables/earth";

const store = useSEStore();
const { inverseTotalRotationMatrix, sePoints } = storeToRefs(store);
const { t } = useI18n();
const { geoLocationToUnitSphere } = useEarthCoordinate();

let showNorthPole = ref(false);
let showSouthPole = ref(false);
let latitudeNumber = ref("");
let longitudeNumber = ref("");

// const seNorthPole = ref<SEEarthPoint | undefined>(undefined);
// const seSouthPole = ref<SEEarthPoint | undefined>(undefined);

let seNorthPole: SEEarthPoint | undefined = undefined;
let seSouthPole: SEEarthPoint | undefined = undefined;

function numberCheck(txt: string | undefined): boolean | string {
  if (typeof txt === "string" && Number.isNaN(Number(txt))) {
    return t("numbersOnly");
  } else {
    let num = Number(txt);
    if (!(-90 <= num && num <= 90)) {
      return t("latitudeRange");
    } else {
      return true;
    }
  }
}
const addButtonDisabled = computed((): boolean => {
  return longitudeNumber.value === "" || latitudeNumber.value === "";
});

function addEarthPoint(): void {
  // console.log(
  //   "check this point doesn't exist",
  //   Number(pointLatitude.value),
  //   Number(pointLongitude.value)
  // );
  if (
    sePoints.value.filter(
      pt =>
        pt instanceof SEEarthPoint &&
        Math.abs(pt.latitude - Number(latitudeNumber.value)) <
          SETTINGS.tolerance &&
        Math.abs(pt.longitude - Number(longitudeNumber.value)) <
          SETTINGS.tolerance
    ).length > 0
  ) {
    EventBus.fire("show-alert", {
      key: "handlers.pointCreationAttemptDuplicate",
      type: "error"
    });
    return;
  }
  const seEarthPoint = new SEEarthPoint(
    Number(latitudeNumber.value),
    Number(longitudeNumber.value)
  );
  const coords = geoLocationToUnitSphere(
    Number(latitudeNumber.value),
    Number(longitudeNumber.value)
  );
  const poleVector = new Vector3(coords[0], coords[2], coords[1]); //Switch when merging with vue3-upgrade
  const rotationMatrix = new Matrix4();
  rotationMatrix.copy(inverseTotalRotationMatrix.value).invert();
  poleVector.applyMatrix4(rotationMatrix);
  seEarthPoint.locationVector = poleVector;
  const poleSELabel = new SELabel("point", seEarthPoint);
  // stylize the north pole
  poleSELabel.ref.caption =
    "(" +
    latitudeNumber.value +
    "\u{00B0}," +
    longitudeNumber.value +
    "\u{00B0})";
  poleSELabel.update();
  new AddEarthPointCommand(seEarthPoint, poleSELabel).execute();
  EventBus.fire("show-alert", {
    key: "handlers.newEarthPointAdded",
    keyOptions: {
      name: seEarthPoint.name,
      lat: seEarthPoint.latitude + "\u{00B0}",
      long: seEarthPoint.longitude + "\u{00B0}"
    },
    type: "success"
  });

  longitudeNumber.value = "";
  latitudeNumber.value = "";
}
watch(
  () => sePoints.value,
  points => {
    const earthPoints = points
      .filter(pt => pt instanceof SEEarthPoint)
      .map(pt => pt as SEEarthPoint);
    let northPole = earthPoints.find(
      pt => pt.latitude === 90 && pt.longitude === 0
    );
    if (northPole != undefined) {
      seNorthPole = northPole;
      showNorthPole.value = northPole.showing;
    } else {
      // the north pole doesn't exist (or was deleted)
      seNorthPole = undefined;
      showNorthPole.value = false;
    }
    let southPole = earthPoints.find(
      pt => pt.latitude === -90 && pt.longitude === 0
    );
    if (southPole != undefined) {
      seSouthPole = southPole;
      showSouthPole.value = southPole.showing;
    } else {
      // the South pole doesn't exist (or was deleted)
      seSouthPole = undefined;
      showSouthPole.value = false;
    }
    // console.log("execute ", seNorthPole);
  }
);

// watch(
//   () => seNorthPole,
//   () => {
//     console.log("second watcher execute", seNorthPole);
//     if (seNorthPole) {
//       console.log("seNorthPole.showing", seNorthPole.showing);
//       showNorthPole.value = seNorthPole.showing;
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
  seSouthPole = findPoleInObjectTree(Poles.SOUTH);
  seNorthPole = findPoleInObjectTree(Poles.NORTH);
  if (seNorthPole !== undefined) {
    showNorthPole.value = seNorthPole.showing;
  }
  if (seSouthPole !== undefined) {
    showSouthPole.value = seSouthPole.showing;
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
  // If the north or south pole already exists then this next code block will not execute (because findPoleInObjectTree will return the pole) so you cannot
  // create two points at either pole
  let cmd: Command | undefined = undefined;
  if (sePole === undefined) {
    // Initialize/create the north pole and add it to the object tree
    sePole =
      pole === Poles.NORTH ? new SEEarthPoint(90, 0) : new SEEarthPoint(-90, 0);
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
    seNorthPole = sePole;
  } else {
    seSouthPole = sePole;
  }
  return cmd;
}

// If the user clicks undo or redo or the hide/show in the object tree or style panel,
// we need to update the value of showNorth/SouthPole

function displayPole(pole: Poles) {
  let displayCommandGroup = new CommandGroup();
  if (pole === Poles.NORTH) {
    //console.log("north pole name ", seNorthPole ? seNorthPole.name : "");
    if (seNorthPole === undefined) {
      const cmd = setSEPoleVariable(Poles.NORTH); // onces this executes seNorthPole is defined and we can control the visibility
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
    //console.log("south pole name ", seSouthPole ? seSouthPole.name : "");
    if (seSouthPole === undefined) {
      const cmd = setSEPoleVariable(Poles.SOUTH); // onces this executes seSouthPole is defined and we can control the visibility
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
  EventBus.fire("update-label-and-showing-display", {}); //NP
}
</script>
