<template>
  <div style="display: flex; padding: 5px">
    <v-autocomplete
      ref="addrInput"
      v-model="addrPlaceId"
      v-model:search="addressSearch"
      :items="predictedAddresses"
      :disabled="!isEarthMode"
      item-title="description"
      item-value="placeId"
      :hide-details="addressError.length === 0"
      :error-messages="addressError"
      class="bg-white"
      density="compact"
      :label="t('enterAddress')"
      style="width: 30em">
      <template #append v-if="!isLine">
        <v-btn
          @click="getPlaceDetails"
          :disabled="addrPlaceId === null || addrPlaceId.length === 0">
          <v-icon>mdi-map-marker</v-icon>
        </v-btn>
      </template>
    </v-autocomplete>
  </div>
</template>

<i18n lang="json" locale="en">
{
  "enterAddress": "Enter address",
  "addressPredictionError": "Unable to get address prediction: ",
  "noFormattedAddress": "Address details not available",
  "addressDetailsUnknown": "Unable to get address details"
}
</i18n>
<i18n lang="json" locale="id">
{
  "enterAddress": "Ketikkan alamat",
  "addressPredictionError": "Gagal menentukan prediksi alamat: ",
  "noFormattedAddress": "Alamat lengkap tidak ditemukan",
  "addressDetailsUnknown": "Alamat rinci tidak ditemukan"
}
</i18n>
<style>
#autocomplete {
  width: 100%;
  height: 40px;
  padding: 0 10px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 5px;
  margin-bottom: 10px;
  background-color: black;
}
</style>
<script setup lang="ts">
import { onMounted, ref, watch, Ref } from "vue";
import * as THREE from "three";
import { SELabel } from "@/models/SELabel";
import { CommandGroup } from "@/commands-spherical/CommandGroup";
import { AddEarthPointCommand } from "@/commands-spherical/AddEarthPointCommand";
import { useSEStore } from "@/stores/se";
import { storeToRefs } from "pinia";
import { SEEarthPoint } from "@/models/SEEarthPoint";
import { Loader } from "@googlemaps/js-api-loader";
import { useI18n } from "vue-i18n";
import { useEarthCoordinate } from "@/composables/earth";
// import { SEParametric } from "@/models/SEParametric";
// import { SEPoint } from "@/models/SEPoint";
import EventBus from "@/eventHandlers/EventBus";
type ComponentProps = {
  isLine?: boolean;
  drawLine?: boolean;
};
type AddressPair = {
  description: string;
  placeId: string;
};
const store = useSEStore();
const { inverseTotalRotationMatrix, sePoints, isEarthMode } =
  storeToRefs(store);
const { t } = useI18n({ useScope: "local" });
const { geoLocationToUnitSphere } = useEarthCoordinate();
const props = withDefaults(defineProps<ComponentProps>(), {
  isLine: false,
  drawLine: false
});
const emit = defineEmits<{
  "update:placeId": [id: string];
  "update:point": [vtx: SEEarthPoint];
}>();
const addrPlaceId = ref("");
const addressError = ref("");
const addrInput: Ref<HTMLInputElement | null> = ref(null);
const predictedAddresses: Ref<Array<AddressPair>> = ref([]);
const addressSearch: Ref<string | undefined> = ref(undefined);
const apiKey = import.meta.env.VITE_APP_GOOGLE_MAP_API_KEY;
console.log("Address input using API", apiKey);
const loader = new Loader({
  apiKey,
  version: "weekly"
});
const { AutocompleteService, PlacesService, PlacesServiceStatus } =
  await loader.importLibrary("places");
const addressPredictor = new AutocompleteService();
// eslint-disable-next-line no-undef
let placesInspector;

onMounted(async () => {
  placesInspector = new PlacesService(addrInput.value!);
});

watch(
  () => addressSearch.value,
  (addr: string | undefined) => {
    if (addr) searchAddress(addr);
  }
);
watch(
  () => props.drawLine,
  () => {
    if (props.isLine) {
      getPlaceDetails();
    }
  }
);
watch(
  () => addrPlaceId.value,
  () => {
    emit("update:placeId", addrPlaceId.value);
  }
);
function searchAddress(v: string) {
  addressError.value = "";
  addressPredictor
    .getPlacePredictions({ input: v })
    .then(response => {
      console.debug("Searching for", v, "with response", response);
      predictedAddresses.value = response.predictions.map(p => ({
        description: p.description,
        placeId: p.place_id
      }));
    })
    .catch(err => {
      addressError.value = t("addressPredictionError") + err;
    });
}

function getPlaceDetails() {
  console.debug("Get details of", addrPlaceId.value);
  addressError.value = "";
  placesInspector.getDetails(
    {
      placeId: addrPlaceId.value,
      fields: ["name", "geometry", "formatted_address"]
    },
    (place, status) => {
      // eslint-disable-next-line no-undef
      if (status === PlacesServiceStatus.OK) {
        // console.debug("Place details", place, status);
        // Make sure that this location doesn't exist already
        const earthPoints = sePoints.value
          .filter(pt => pt instanceof SEEarthPoint)
          .map(pt => pt as SEEarthPoint);
        if (
          earthPoints.some(
            pt =>
              place?.geometry?.location &&
              pt.latitude === place.geometry?.location.lat() &&
              pt.longitude === place.geometry?.location.lng()
          )
        ) {
          EventBus.fire("show-alert", {
            key: `handlers.pointCreationAttemptDuplicate`,
            keyOptions: {},
            type: "error"
          });
          return;
        }
        if (place?.geometry?.location) {
          // const latRad = (place.geometry?.location.lat() * Math.PI) / 180;
          // const lngRad = (place.geometry?.location.lng() * Math.PI) / 180;
          const arr = geoLocationToUnitSphere(
            place.geometry.location.lat(),
            place.geometry.location.lng()
          );
          const xcor = arr[0];
          const ycor = arr[1];
          const zcor = arr[2];

          // caption
          const vtx = new SEEarthPoint(
            place.geometry.location.lng(),
            place.geometry.location.lat()
          );
          const pointVector = new THREE.Vector3(xcor, ycor, zcor);
          pointVector.normalize();
          const rotationMatrix = new THREE.Matrix4();
          rotationMatrix.copy(inverseTotalRotationMatrix.value).invert();
          pointVector.applyMatrix4(rotationMatrix);
          vtx.locationVector = pointVector;
          let placeCaption = place.formatted_address;

          //caption change here
          const newSELabel = new SELabel("point", vtx);
          newSELabel.ref.caption = placeCaption ?? t("noFormattedAddress");
          const pointCommandGroup = new CommandGroup();
          pointCommandGroup.addCommand(
            new AddEarthPointCommand(vtx, newSELabel)
          );
          pointCommandGroup.execute();
          // pointLabel.initialLabelDisplayMode = LabelDisplayMode.NameAndCaption;
          newSELabel.update();
          emit("update:point", vtx);
        }
      } else {
        addressError.value = t("addressDetailsUnknown");
      }
    }
  );
  addrPlaceId.value = "";
  addressSearch.value = "";
  predictedAddresses.value = [];
}
</script>
