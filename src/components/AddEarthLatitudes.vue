<template>
  <div>
    <v-col>
      <v-switch
        hide-details
        v-model="showEquator"
        density="compact"
        variant="outlined"
        :label="t('equator')"
        @click="displayEquator"></v-switch>

      <v-divider :thickness="8" color="black"></v-divider>
      <v-form ref="form">
        <v-text-field
          :label="t('latitude')"
          clearable
          density="compact"
          :rules="[numberCheck]"
          v-model="circleLatitude"></v-text-field>
        <v-btn
          :disabled="addButtonDisabled"
          variant="outlined"
          density="compact"
          @click="addLatitudeCircle()">
          {{ t("addLatitude") }}
        </v-btn>
      </v-form>
    </v-col>
  </div>
</template>
<i18n lang="json" locale="en">
{
  "equator": "Equator",
  "latitude": "Degrees Latitude",
  "numbersOnly": "Enter only numbers",
  "latitudeRange": "Latitude must be between -90 and 90 degrees",
  "addLatitude": "Add Latitude",
  "TropicOfCancer": "Tropic of Cancer",
  "TropicOfCapricorn": "Tropic of Capricorn",
  "arcticCircle": "Arctic Circle",
  "antarcticCircle": "Antarctic Circle"
}
</i18n>

<style></style>
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, computed, watch } from "vue";
import { SELabel } from "@/models/SELabel";
import { useSEStore } from "@/stores/se";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";
import { CommandGroup } from "@/commands/CommandGroup";
import SETTINGS from "@/global-settings";
import { Command } from "@/commands/Command";
import EventBus from "@/eventHandlers/EventBus";
import { SELatitude } from "@/models/SELatitude";
import { AddLatitudeCommand } from "@/commands/AddLatitudeCommand";
import { SENodule } from "@/models/SENodule";
import { formatDate } from "@vueuse/core";

const store = useSEStore();
const { inverseTotalRotationMatrix, seCircles } = storeToRefs(store);
const { t } = useI18n();

let showEquator = ref(false);
let circleLatitude = ref("");

let seEquator: SELatitude | undefined = undefined;

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
  return circleLatitude.value === "";
});

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
  EventBus.fire("update-label-and-showing-display", {}); //NP
}
function addLatitudeCircle(lat?: number): void {
  let latitude: number | undefined = undefined;
  if (lat !== undefined) {
    latitude = Number(lat);
  } else {
    if (circleLatitude.value == null) {
      return;
    } else {
      latitude = Number(circleLatitude.value);
    }
  }

  if (findLatitudeInObjectTree(latitude) !== undefined) {
    EventBus.fire("show-alert", {
      key: "handlers.latitudeCreationAttemptDuplicate",
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
    latitudeSELabel.ref.caption = circleLatitude.value + "\u{00B0}";
  }
  latitudeSELabel.showing = true;
  latitudeSELabel.update();
  new AddLatitudeCommand(seLatitude, latitudeSELabel).execute();
  EventBus.fire("show-alert", {
    key: "handlers.newLatitudeAdded",
    keyOptions: {
      name: seLatitude.name,
      lat: seLatitude.latitude + "\u{00B0}"
    },
    type: "success"
  });
}
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
    //console.log("execute ", seEquatorPole);
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

function findLatitudeInObjectTree(lat: number): SELatitude | undefined {
  const seLatitudes = seCircles.value
    .filter(circle => circle instanceof SELatitude)
    .map(pt => pt as SELatitude);
  return seLatitudes.find(
    circle => Math.abs(circle.latitude - lat) < SETTINGS.tolerance
  );
}

onMounted(() => {
  // set the show(North|South)Pole.value if the (South|North)Pole has already been created and put into the object tree
  seEquator = findLatitudeInObjectTree(0);
  if (seEquator !== undefined) {
    showEquator.value = seEquator.showing;
  }
  EventBus.listen("update-equator-switch", equatorSwitch); //NP
});

//NP
function equatorSwitch(e: { val: boolean }) {
  showEquator.value = e.val;
}

onBeforeUnmount((): void => {
  EventBus.unlisten("update-equator-switch"); //NP
});

//Return the command to add the equator to the object tree so that it can be grouped with the other hide/show commands.
function setSEEquatorVariable(): undefined | Command {
  //Find the equator in the store of sePoints, if it exists
  seEquator = findLatitudeInObjectTree(0);
  // If the equator already exists then this next code block will not execute (because findEquatorInObjectTree will return the equator) so you cannot
  // create two equators
  let cmd: Command | undefined = undefined;
  if (seEquator === undefined) {
    // Initialize/create the equator and add it to the object tree
    seEquator = new SELatitude(0);
    const latitudeSELabel = new SELabel("circle", seEquator);
    // stylize the latitude
    latitudeSELabel.ref.caption = t("equator");

    latitudeSELabel.showing = true;
    latitudeSELabel.update();
    cmd = new AddLatitudeCommand(seEquator, latitudeSELabel);

    //Now set the pole into the local variable so it can be accessed in this component

    return cmd;
  }
}
</script>
