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
  </div>
  <AddressInput/>
</template>
<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { useSEStore } from "@/stores/se";
import AddressInput from "./AddressInput.vue";
const seStore = useSEStore();
const {
  isEarthMode
} = storeToRefs(seStore);
</script>