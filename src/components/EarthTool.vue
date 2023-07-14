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
    <AddressInput />
  </div>

              <!-- <template #append v-if="isEarthMode">
                <v-icon id="placeBubble">mdi-map-marker</v-icon>

              </template> -->

</template>
<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { useSEStore } from "@/stores/se";
import AddressInput from "@/components/AddressInput.vue";
const seStore = useSEStore();
const {
  isEarthMode
} = storeToRefs(seStore);
</script>