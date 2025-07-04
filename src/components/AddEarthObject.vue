<template>
  <div id="earthobject">
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
    <v-switch
      hide-details
      v-model="showEquator"
      density="compact"
      variant="outlined"
      :label="t('equator')"
      @click="displayEquator"></v-switch>
    <v-switch
      hide-details
      v-model="showPrimeMeridian"
      density="compact"
      variant="outlined"
      :label="t('primeMeridian')"
      @click="displayPrimeMeridian"></v-switch>
    <v-divider :thickness="8" color="black" class="mb-2"></v-divider>
    <v-text-field
      :label="t('latitude')"
      clearable
      density="compact"
      :rules="[latitudeNumberCheck]"
      v-model="latitudeNumber"></v-text-field>
    <v-text-field
      :label="t('longitude')"
      density="compact"
      clearable
      :rules="[longitudeNumberCheck]"
      v-model="longitudeNumber"></v-text-field>
    <v-btn
      :disabled="addPointButtonDisabled"
      variant="outlined"
      density="compact"
      @click="addEarthPoint()">
      {{ t("addPoint") }}
    </v-btn>
    <v-btn
      :disabled="addLatitudeButtonDisabled"
      variant="outlined"
      density="compact"
      @click="addLatitudeCircle()">
      {{ t("addLatitude") }}
    </v-btn>
    <v-btn
      :disabled="addLongitudeButtonDisabled"
      variant="outlined"
      density="compact"
      @click="addLongitudeSegment()">
      {{ t("addLongitude") }}
    </v-btn>
  </div>
</template>
<i18n lang="json" locale="en">
{
  "northPole": "North Pole",
  "southPole": "South Pole",
  "latitude": "Degrees Latitude",
  "longitude": "Degrees Longitude",
  "numbersOnly": "Enter only numbers",
  "latitudeRange": "Latitude must be between -90 and 90 degrees",
  "longitudeRange": "Longitude must be between -180 and 180 degrees",
  "addPoint": "Add Point",
  "equator": "Equator",
  "addLatitude": "Add Latitude",
  "addLongitude": "Add Longitude",
  "TropicOfCancer": "Tropic of Cancer",
  "TropicOfCapricorn": "Tropic of Capricorn",
  "arcticCircle": "Arctic Circle",
  "antarcticCircle": "Antarctic Circle",
  "primeMeridian": "Prime Meridian",
  "N": "N",
  "S": "S",
  "E": "E",
  "W": "W"
}
</i18n>

<style scoped>
#earthobject {
  display: flex;
  flex-direction: column;
  padding: 0.75em;
  /* background: yellow; */
  min-width: 12em;
}
</style>
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
import {
  LabelDisplayMode,
  Poles,
  SEIntersectionReturnType
} from "@/types/index";
import { useEarthCoordinate } from "@/composables/earth";
import { SELongitude } from "@/models/SELongitude";
import { AddLongitudeCommand } from "@/commands/AddLongitudeCommand";
import { SELatitude } from "@/models/SELatitude";
import { AddLatitudeCommand } from "@/commands/AddLatitudeCommand";
import { AddIntersectionPointOtherParentsInfo } from "@/commands/AddIntersectionPointOtherParentsInfo";
import { AddIntersectionPointCommand } from "@/commands/AddIntersectionPointCommand";
import SegmentHandler from "@/eventHandlers/SegmentHandler";
import { SEPoint } from "@/models/SEPoint";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { SetPointUserCreatedValueCommand } from "@/commands/SetPointUserCreatedValueCommand";
import { StyleNoduleCommand } from "@/commands/StyleNoduleCommand";
import { StyleCategory } from "@/types/Styles";
import Highlighter from "@/eventHandlers/Highlighter";
import { SEAntipodalPoint } from "@/models/SEAntipodalPoint";
import { Handler } from "mitt";

const store = useSEStore();
const { inverseTotalRotationMatrix, sePoints, seCircles, seSegments } =
  storeToRefs(store);
const { createAllIntersectionsWith } = store;
const { t } = useI18n({ useScope: "local" });
const { geoLocationToUnitSphere } = useEarthCoordinate();
const tempVec = new Vector3();

let showPrimeMeridian = ref(false);
let showEquator = ref(false);
let showNorthPole = ref(false);
let showSouthPole = ref(false);
let latitudeNumber = ref("");
let longitudeNumber = ref("");

// const seNorthPole = ref<SEEarthPoint | undefined>(undefined);
// const seSouthPole = ref<SEEarthPoint | undefined>(undefined);

let seNorthPole: SEAntipodalPoint | SEEarthPoint | SEPoint | undefined =
  undefined;
let seSouthPole: SEAntipodalPoint | SEEarthPoint | SEPoint | undefined =
  undefined;
let seEquator: SELatitude | undefined = undefined;
let sePrimeMeridian: SELongitude | undefined = undefined;

// These variables are set to true, the poles will not change captions
let northPoleLabelSetOnce = false;
let southPoleLabelSetOnce = false;

function latitudeNumberCheck(txt: string | undefined): boolean | string {
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

function longitudeNumberCheck(txt: string | undefined): boolean | string {
  if (typeof txt === "string" && Number.isNaN(Number(txt))) {
    return t("numbersOnly");
  } else {
    let num = Number(txt);
    if (!(-180 < num && num <= 180)) {
      return t("longitudeRange");
    } else {
      return true;
    }
  }
}

const addPointButtonDisabled = computed((): boolean => {
  return longitudeNumber.value === "" || latitudeNumber.value === "";
});
const addLatitudeButtonDisabled = computed((): boolean => {
  return latitudeNumber.value === "";
});
const addLongitudeButtonDisabled = computed((): boolean => {
  return longitudeNumber.value === "";
});

const intersectionPointsToUpdate: SEIntersectionPoint[] = [];

function addEarthPoint(): void {
  if (
    sePoints.value.filter(
      pt =>
        pt instanceof SEEarthPoint &&
        ((Math.abs(pt.latitude - Number(latitudeNumber.value)) <
          SETTINGS.tolerance &&
          Math.abs(pt.longitude - Number(longitudeNumber.value)) <
            SETTINGS.tolerance) ||
          (seNorthPole !== undefined &&
            Math.abs(90 - Number(latitudeNumber.value)) < SETTINGS.tolerance) ||
          (seSouthPole !== undefined &&
            Math.abs(90 + Number(latitudeNumber.value)) < SETTINGS.tolerance))
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
  const poleVector = new Vector3(coords[0], coords[1], coords[2]);
  const rotationMatrix = new Matrix4();
  rotationMatrix.copy(inverseTotalRotationMatrix.value).invert();
  poleVector.applyMatrix4(rotationMatrix);
  seEarthPoint.locationVector = poleVector;
  const poleSELabel = new SELabel("point", seEarthPoint);
  // stylize the north pole
  poleSELabel.ref.caption =
    "(" +
    Math.abs(Number(latitudeNumber.value)) +
    "\u{00B0} " +
    (Number(latitudeNumber.value) !== 0
      ? Number(latitudeNumber.value) > 0
        ? t("N") + ", "
        : t("S") + ", "
      : ", ") +
    Math.abs(Number(longitudeNumber.value)) +
    "\u{00B0} " +
    (Number(longitudeNumber.value) !== 0
      ? Number(longitudeNumber.value) > 0
        ? t("E") + ")"
        : t("W") + ")"
      : ")");
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
}

function addLatitudeCircle(lat?: number): void {
  let latitude: number | undefined = undefined;
  if (lat !== undefined) {
    latitude = Number(lat);
  } else {
    if (latitudeNumber.value == null) {
      return;
    } else {
      latitude = Number(latitudeNumber.value);
    }
  }

  if (findLatitudeInObjectTree(latitude) !== undefined) {
    EventBus.fire("show-alert", {
      key: "handlers.latitudeCreationAttemptDuplicate",
      type: "error"
    });
    return;
  } else if (
    Math.abs(latitude - 90) < SETTINGS.circle.minimumRadius ||
    Math.abs(latitude + 90) < SETTINGS.circle.minimumRadius
  ) {
    EventBus.fire("show-alert", {
      key: "handlers.latitudeWithZeroRadius",
      type: "error"
    });
    return;
  }
  const seLatitude = new SELatitude(latitude);
  const latitudeSELabel = new SELabel("circle", seLatitude);
  // stylize the latitude

  if (latitude === 0) {
    latitudeSELabel.ref.caption = t("equator");
  } else if (latitude == 23.5) {
    latitudeSELabel.ref.caption = t("TropicOfCancer");
  } else if (latitude == -23.5) {
    latitudeSELabel.ref.caption = t("TropicOfCapricorn");
  } else if (latitude == 66.5) {
    latitudeSELabel.ref.caption = t("arcticCircle");
  } else if (latitude == -66.5) {
    latitudeSELabel.ref.caption = t("antarcticCircle");
  } else {
    latitudeSELabel.ref.caption =
      Math.abs(latitude) + "\u{00B0} " + (latitude > 0 ? t("N") : t("S"));
  }
  //latitudeSELabel.showing = true;
  latitudeSELabel.update();
  const cmdGroup = new CommandGroup();
  cmdGroup.addCommand(new AddLatitudeCommand(seLatitude, latitudeSELabel));

  // new create the intersections with all existing objects
  cmdGroup.addCommand(getCircleIntersectionsCommands(seLatitude)).execute();
  // The newly added circle passes through all the
  // intersection points on the intersectionPointsToUpdate list
  // This circle might be a new parent to some of them
  // shallowUpdate will check this and change parents as needed
  intersectionPointsToUpdate.forEach(pt => pt.shallowUpdate());
  intersectionPointsToUpdate.splice(0);
  //turn off the display of all newly created but not user created points
  store.unglowAllSENodules();

  EventBus.fire("show-alert", {
    key: "handlers.newLatitudeAdded",
    keyOptions: {
      name: seLatitude.name,
      lat: seLatitude.latitude + "\u{00B0}"
    },
    type: "success"
  });
}

function addLongitudeSegment(long?: number): void {
  let longitude: number | undefined = undefined;
  if (long !== undefined) {
    longitude = Number(long);
  } else {
    if (longitudeNumber.value == null) {
      return;
    } else {
      longitude = Number(longitudeNumber.value);
    }
  }

  if (findLongitudeInObjectTree(longitude) !== undefined) {
    EventBus.fire("show-alert", {
      key: "handlers.longitudeCreationAttemptDuplicate",
      type: "error"
    });
    return;
  }
  const seLongitude = new SELongitude(longitude);
  const longitudeSELabel = new SELabel("segment", seLongitude);

  // stylize the longitude
  if (longitude === 0) {
    longitudeSELabel.ref.caption = t("primeMeridian");
  } else {
    longitudeSELabel.ref.caption =
      Math.abs(longitude) + "\u{00B0}" + (longitude > 0 ? t("E") : t("W"));
  }
  // Set the initial position of the label on the equator
  //Setup the label location on the longitude and the equator
  const labelLocationArray = geoLocationToUnitSphere(0, longitude);
  const labelLocationVector = new Vector3(
    labelLocationArray[0],
    labelLocationArray[1],
    labelLocationArray[2]
  );
  //console.log("longitude label location 0 ", labelLocationVector.toFixed(2));
  const rotationMatrix = new Matrix4();
  rotationMatrix.copy(SENodule.store.inverseTotalRotationMatrix).invert();
  labelLocationVector.applyMatrix4(rotationMatrix).normalize();
  longitudeSELabel.locationVector = labelLocationVector;
  // console.log(
  //   "longitude label location ",
  //   longitudeSELabel.locationVector.toFixed(2)
  // );

  longitudeSELabel.update();

  const cmdGroup = new CommandGroup();
  cmdGroup.addCommand(new AddLongitudeCommand(seLongitude, longitudeSELabel));

  // new create the intersections with all existing objects
  cmdGroup.addCommand(getSegmentIntersectionsCommands(seLongitude)).execute();
  // The newly added segment passes through all the
  // intersection points on the intersectionPointsToUpdate list
  // This segment might be a new parent to some of them
  // shallowUpdate will check this and change parents as needed
  intersectionPointsToUpdate.forEach(pt => pt.shallowUpdate());
  intersectionPointsToUpdate.splice(0);
  //turn off the display of all newly created but not user created points
  store.unglowAllSENodules();

  EventBus.fire("show-alert", {
    key: "handlers.newLongitudeAdded",
    keyOptions: {
      name: seLongitude.name,
      long: seLongitude.longitude + "\u{00B0}"
    },
    type: "success"
  });
}

watch(
  () => seSegments.value,
  segments => {
    const meridianList = segments
      .filter(seg => seg instanceof SELongitude && seg.longitude === 0)
      .map(seg => seg as SELongitude);

    if (meridianList[0]) {
      sePrimeMeridian = meridianList[0];
      showPrimeMeridian.value = meridianList[0].showing;
    } else {
      // the equator doesn't exist (or was deleted)
      sePrimeMeridian = undefined;
      showPrimeMeridian.value = false;
    }
  }
);
watch(
  () => seCircles.value,
  circle => {
    const equatorList = circle
      .filter(pt => pt instanceof SELatitude && pt.latitude === 0)
      .map(pt => pt as SELatitude);

    if (equatorList[0]) {
      seEquator = equatorList[0];
      showEquator.value = equatorList[0].showing;
    } else {
      // the equator doesn't exist (or was deleted)
      seEquator = undefined;
      showEquator.value = false;
    }
  }
);
watch(
  () => sePoints.value,
  points => {
    const earthPoints = points
      .filter(pt => pt instanceof SEEarthPoint)
      .map(pt => pt as SEEarthPoint);
    let northPole = earthPoints.find(pt => pt.latitude === 90);
    if (northPole != undefined) {
      seNorthPole = northPole;
      showNorthPole.value = northPole.showing;
    } else {
      // the north pole doesn't exist (or was deleted)
      seNorthPole = undefined;
      showNorthPole.value = false;
    }
    let southPole = earthPoints.find(pt => pt.latitude === -90);
    if (southPole != undefined) {
      seSouthPole = southPole;
      showSouthPole.value = southPole.showing;
    } else {
      // the South pole doesn't exist (or was deleted)
      seSouthPole = undefined;
      showSouthPole.value = false;
    }
  }
);

function findLatitudeInObjectTree(lat: number): SELatitude | undefined {
  const seLatitudes = seCircles.value
    .filter(circle => circle instanceof SELatitude)
    .map(circle => circle as SELatitude);
  return seLatitudes.find(
    circle => Math.abs(circle.latitude - lat) < SETTINGS.tolerance
  );
}
function findLongitudeInObjectTree(long: number): SELongitude | undefined {
  const seLongitudes = seSegments.value
    .filter(segment => segment instanceof SELongitude)
    .map(segment => segment as SELongitude);
  return seLongitudes.find(
    segment => Math.abs(segment.longitude - long) < SETTINGS.tolerance
  );
}

onMounted(() => {
  // set the show(North|South)Pole.value if the (South|North)Pole has already been created and put into the object tree
  seSouthPole = SENodule.unregisteredSEPointSouthPole; //findPoleInObjectTree(Poles.SOUTH);
  seNorthPole = SENodule.unregisteredSEPointNorthPole;
  if (seNorthPole !== undefined) {
    showNorthPole.value = seNorthPole.showing;
  }
  if (seSouthPole !== undefined) {
    showSouthPole.value = seSouthPole.showing;
  }
  EventBus.listen("update-pole-switch", poleSwitch as Handler<unknown>); //NP

  seEquator = findLatitudeInObjectTree(0);
  if (seEquator !== undefined) {
    showEquator.value = seEquator.showing;
  }
  EventBus.listen("update-equator-switch", equatorSwitch as Handler<unknown>); //NP

  sePrimeMeridian = findLongitudeInObjectTree(0);
  if (sePrimeMeridian !== undefined) {
    showPrimeMeridian.value = sePrimeMeridian.showing;
  }
  EventBus.listen(
    "update-prime-meridian-switch",
    primeMeridianSwitch as Handler<unknown>
  ); //NP
});

//NP
function poleSwitch(e: { pole: Poles; val: boolean }) {
  console.log("message received");
  if (e.pole == Poles.NORTH) {
    showNorthPole.value = e.val;
  } else {
    showSouthPole.value = e.val;
  }
}
function equatorSwitch(e: { val: boolean }) {
  showEquator.value = e.val;
}
function primeMeridianSwitch(e: { val: boolean }) {
  showPrimeMeridian.value = e.val;
}
onBeforeUnmount((): void => {
  EventBus.unlisten("update-pole-switch"); //NP
  EventBus.unlisten("update-equator-switch"); //NP
  EventBus.unlisten("update-prime-meridian-switch"); //NP
});

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
    console.log("display pole north", seNorthPole);
    if (seNorthPole !== undefined) {
      if (
        (seNorthPole instanceof SEIntersectionPoint ||
          seNorthPole instanceof SEAntipodalPoint) &&
        seNorthPole.isUserCreated === false
      ) {
        // seNorthPole is an intersection point
        displayCommandGroup.addCommand(
          new SetPointUserCreatedValueCommand(seNorthPole, true, true)
        );
      }
      displayCommandGroup.addCommand(
        new SetNoduleDisplayCommand(seNorthPole, !showNorthPole.value)
      );
      // also hides the label if SETTINGS.hideObjectHidesLabel is true
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
      if (
        (seSouthPole instanceof SEIntersectionPoint ||
          seSouthPole instanceof SEAntipodalPoint) &&
        seSouthPole.isUserCreated === false
      ) {
        // seSouthPole is an intersection point
        displayCommandGroup.addCommand(
          new SetPointUserCreatedValueCommand(seSouthPole, true, true)
        );
      }
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
  EventBus.fire("update-label-and-showing-and-measurement-display", {}); //NP
}
function displayEquator(): void {
  let displayCommandGroup = new CommandGroup();
  if (seEquator === undefined) {
    const cmd = setSEEquatorVariable(); // onces this executes seEquator is defined and we can control the visibility
    if (cmd !== undefined) {
      displayCommandGroup.addCommand(cmd);
    }
  }
  if (seEquator !== undefined) {
    displayCommandGroup.addCommand(
      new SetNoduleDisplayCommand(seEquator, !showEquator.value)
    ); // also hides the label if SETTINGS.hideObjectHidesLabel is true
    if (
      seEquator.label &&
      (showEquator.value
        ? !SETTINGS.hideObjectHidesLabel
        : !SETTINGS.showObjectShowsLabel)
    ) {
      displayCommandGroup.addCommand(
        new SetNoduleDisplayCommand(seEquator.label, !showEquator.value)
        // also hide/shows the label if needed
      );
    }
  }
  displayCommandGroup.execute();
  //turn off the display of all newly created but not user created points
  store.unglowAllSENodules();
  EventBus.fire("update-label-and-showing-and-measurement-display", {}); //NP
}
function displayPrimeMeridian(): void {
  let displayCommandGroup = new CommandGroup();
  if (sePrimeMeridian === undefined) {
    const cmd = setSEPrimeMeridianVariable(); // onces this executes sePrimeMeridian is defined and we can control the visibility
    if (cmd !== undefined) {
      displayCommandGroup.addCommand(cmd);
    }
  }
  if (sePrimeMeridian !== undefined) {
    displayCommandGroup.addCommand(
      new SetNoduleDisplayCommand(sePrimeMeridian, !showPrimeMeridian.value)
    ); // also hides the label if SETTINGS.hideObjectHidesLabel is true
    if (
      sePrimeMeridian.label &&
      (showPrimeMeridian.value
        ? !SETTINGS.hideObjectHidesLabel
        : !SETTINGS.showObjectShowsLabel)
    ) {
      displayCommandGroup.addCommand(
        new SetNoduleDisplayCommand(
          sePrimeMeridian.label,
          !showPrimeMeridian.value
        )
        // also hide/shows the label if needed
      );
    }
  }
  displayCommandGroup.execute();
  //turn off the display of all newly created but not user created points
  store.unglowAllSENodules();
  EventBus.fire("update-label-and-showing-and-measurement-display", {}); //NP
}
//Return the command to add the north pole to the object tree so that it can be grouped with the other hide/show commands.
function setSEPoleVariable(pole: Poles): undefined | CommandGroup {
  //Find the north or south pole in the store of sePoints, if it exists
  let sePole =
    pole == Poles.NORTH
      ? SENodule.unregisteredSEPointNorthPole
      : SENodule.unregisteredSEPointSouthPole;
  // If the north or south pole already exists then this next code block will not execute (because findPoleInObjectTree will return the pole) so you cannot
  // create two points at either pole
  let cmdGroup: CommandGroup | undefined = undefined;
  if (sePole === undefined) {
    // Initialize/create the north pole and add it to the object tree
    sePole = new SEEarthPoint(pole === Poles.NORTH ? 90 : -90, 0);
    const poleVector = new Vector3(0, pole === Poles.NORTH ? 1 : -1, 0);
    const rotationMatrix = new Matrix4();
    rotationMatrix.copy(inverseTotalRotationMatrix.value).invert();
    poleVector.applyMatrix4(rotationMatrix);
    sePole.locationVector = poleVector;

    const poleSELabel = new SELabel("point", sePole);
    // stylize the pole

    if (pole === Poles.NORTH) {
      poleSELabel.ref.caption = t("northPole");
      northPoleLabelSetOnce = true;
    } else {
      poleSELabel.ref.caption = t("southPole");
      southPoleLabelSetOnce = true;
    }

    poleSELabel.update();
    cmdGroup = new CommandGroup();
    cmdGroup.addCommand(
      new AddEarthPointCommand(sePole as SEEarthPoint, poleSELabel)
    );
    // create the antipode also
    Highlighter.addCreateAntipodeCommand(sePole, cmdGroup);
  }
  //Now set the pole into the local variable so it can be accessed in this component
  if (pole === Poles.NORTH) {
    seNorthPole = sePole;
  } else {
    seSouthPole = sePole;
  }
  return cmdGroup;
}
//Return the command to add the equator to the object tree so that it can be grouped with the other hide/show commands.
function setSEEquatorVariable(): undefined | Command {
  //Find the equator in the store of sePoints, if it exists
  seEquator = findLatitudeInObjectTree(0);
  // If the equator already exists then this next code block will not execute (because findEquatorInObjectTree will return the equator) so you cannot
  // create two equators
  let cmd: CommandGroup | undefined = undefined;
  if (seEquator === undefined) {
    // Initialize/create the equator and add it to the object tree
    seEquator = new SELatitude(0);
    const latitudeSELabel = new SELabel("circle", seEquator);
    // stylize the latitude
    latitudeSELabel.ref.caption = t("equator");

    latitudeSELabel.showing = true;
    latitudeSELabel.update();
    cmd = new CommandGroup();
    cmd.addCommand(new AddLatitudeCommand(seEquator, latitudeSELabel));

    // new create the intersections with all existing objects
    cmd.addCommand(getCircleIntersectionsCommands(seEquator));
  }
  return cmd;
}
//Return the command to add the prime meridian to the object tree so that it can be grouped with the other hide/show commands.
function setSEPrimeMeridianVariable(): undefined | Command {
  //Find the equator in the store of sePoints, if it exists
  sePrimeMeridian = findLongitudeInObjectTree(0);
  // If the equator already exists then this next code block will not execute (because findEquatorInObjectTree will return the equator) so you cannot
  // create two equators
  let cmd: CommandGroup | undefined = undefined;
  if (sePrimeMeridian === undefined) {
    // Initialize/create the equator and add it to the object tree
    sePrimeMeridian = new SELongitude(0);
    const longitudeSELabel = new SELabel("segment", sePrimeMeridian);
    // stylize the latitude
    longitudeSELabel.ref.caption = t("primeMeridian");
    // Set the initial position of the label on the equator
    //Setup the label location on the longitude and the equator
    const labelLocationArray = geoLocationToUnitSphere(0, 0);
    const labelLocationVector = new Vector3(
      labelLocationArray[0],
      labelLocationArray[1],
      labelLocationArray[2]
    );
    const rotationMatrix = new Matrix4();
    rotationMatrix.copy(SENodule.store.inverseTotalRotationMatrix).invert();
    labelLocationVector.applyMatrix4(rotationMatrix).normalize();
    longitudeSELabel.locationVector = labelLocationVector;

    longitudeSELabel.showing = true;
    longitudeSELabel.update();
    cmd = new CommandGroup();
    cmd.addCommand(new AddLongitudeCommand(sePrimeMeridian, longitudeSELabel));

    // new create the intersections with all existing objects
    cmd.addCommand(getSegmentIntersectionsCommands(sePrimeMeridian));
  }
  return cmd;
}

//primeMeridian switch not working
// The intersection of a longitude and equation is available even though equator is hidden

// create all the intersections with the segment/longitude being added
function getSegmentIntersectionsCommands(
  newSESegment: SELongitude
): CommandGroup {
  const segmentGroup = new CommandGroup();
  createAllIntersectionsWith(newSESegment, []) // empty array of new points created
    .forEach((item: SEIntersectionReturnType) => {
      if (item.existingIntersectionPoint) {
        intersectionPointsToUpdate.push(item.SEIntersectionPoint);
        segmentGroup.addCondition(() =>
          item.SEIntersectionPoint.canAddIntersectionOtherParentInfo(item)
        );
        segmentGroup.addCommand(new AddIntersectionPointOtherParentsInfo(item));
        segmentGroup.addEndCondition();
      } else {
        // Create the plottable label
        const newSELabel = item.SEIntersectionPoint.attachLabelWithOffset(
          new Vector3(
            2 * SETTINGS.segment.initialLabelOffset,
            SETTINGS.segment.initialLabelOffset,
            0
          )
        );

        segmentGroup.addCommand(
          new AddIntersectionPointCommand(
            item.SEIntersectionPoint,
            item.parent1,
            item.parent2,
            newSELabel
          )
        );
        item.SEIntersectionPoint.showing = false; // do not display the automatically created intersection points
        newSELabel.showing = false;
        if (item.createAntipodalPoint) {
          SegmentHandler.addCreateAntipodeCommand(
            item.SEIntersectionPoint,
            segmentGroup
          );
        }
      }
    });
  return segmentGroup;
}

// create all the intersections with the circle/latitude being added
function getCircleIntersectionsCommands(newSECircle: SELatitude): CommandGroup {
  const circleGroup = new CommandGroup();
  createAllIntersectionsWith(newSECircle).forEach(
    (item: SEIntersectionReturnType) => {
      if (item.existingIntersectionPoint) {
        intersectionPointsToUpdate.push(item.SEIntersectionPoint);
        circleGroup.addCondition(() =>
          item.SEIntersectionPoint.canAddIntersectionOtherParentInfo(item)
        );
        circleGroup.addCommand(new AddIntersectionPointOtherParentsInfo(item));
        circleGroup.addEndCondition();
      } else {
        // Create the plottable label
        const newSELabel = item.SEIntersectionPoint.attachLabelWithOffset(
          new Vector3(
            2 * SETTINGS.segment.initialLabelOffset,
            SETTINGS.segment.initialLabelOffset,
            0
          )
        );

        circleGroup.addCommand(
          new AddIntersectionPointCommand(
            item.SEIntersectionPoint,
            item.parent1,
            item.parent2,
            newSELabel
          )
        );
        item.SEIntersectionPoint.showing = false; // do not display the automatically created intersection points
        newSELabel.showing = false;
        if (item.createAntipodalPoint) {
          SegmentHandler.addCreateAntipodeCommand(
            item.SEIntersectionPoint,
            circleGroup
          );
        }
      }
    }
  );
  return circleGroup;
}
</script>
