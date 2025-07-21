<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <v-tabs centered v-model="selectedTab">
    <v-tab>{{ t("userProfile") }}</v-tab>
    <v-tab>{{ t("tools") }}</v-tab>
    <v-tab>App Preferences</v-tab>
  </v-tabs>
  <v-window v-model="selectedTab">
    <v-window-item>
      <UserProfileUI />
    </v-window-item>
    <v-window-item>
      <FavoriteToolsPicker />
    </v-window-item>
    <v-window-item>
      <v-sheet elevation="2" class="pa-2">
        <h3 v-t="'settings.title'"></h3>
        <v-container fluid>
          <v-row>
            <v-col cols="4">
            </v-col>
            <v-col cols="4">
              <v-sheet rounded="lg" elevation="2">
                <v-radio-group
                  v-model="decimalPrecision"
                  inline
                  label="Decimal Precision">
                  <v-radio label="3" value="3"></v-radio>
                  <v-radio label="5" value="5"></v-radio>
                  <v-radio label="7" value="7"></v-radio>
                </v-radio-group>
              </v-sheet>
            </v-col>
            <v-col cols="4">
              <v-sheet rounded="lg" elevation="2">
                <v-radio-group inline label="Selection Precision">
                  <v-radio label="Less"></v-radio>
                  <v-radio label="More"></v-radio>
                </v-radio-group>
              </v-sheet>
            </v-col>
          </v-row>
        </v-container>
        <h3>Label options</h3>
        <v-radio-group label="Object Label" inline>
          <v-radio label="None"></v-radio>
          <v-radio label="All"></v-radio>
          <v-radio label="Default"></v-radio>
        </v-radio-group>
      </v-sheet>
    </v-window-item>

  </v-window>

  <v-divider />
  <div class="mt-3" :style="{display: 'flex', justifyContent: 'center'}">
      <v-btn class="mx-2" @click="doSave" >{{ t("saveAndReturn") }}</v-btn>
      <v-btn class="mx-2" @click="doReturn">{{ t("returnOnly") }}</v-btn>
  </div>
</template>

<script lang="ts" setup>
import UserProfileUI from "./UserProfile.vue";
import FavoriteToolsPicker from "@/components/FavoriteToolsPicker.vue";
import EventBus from "@/eventHandlers/EventBus";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useAccountStore } from "@/stores/account";
const router = useRouter();
type LocaleName = {
  locale: string;
  name: string;
};
const { t } = useI18n();
const acctStore = useAccountStore();
// const imageUpload: Ref<HTMLInputElement | null> = ref(null);
const decimalPrecision = ref(3);
const selectedTab = ref(0);
// The displayed favorite tools (includes defaults)

async function doSave(): Promise<void> {
  await acctStore.saveUserProfile();
  EventBus.fire("show-alert", {
    key: "Your profile has been update",
    type: "info"
  });
  router.back();
}

function doReturn() {
  router.back();
}
</script>
<i18n locale="en">
  {
    "userProfile": "User Profile",
    "tools": "Tools",
    "saveAndReturn": "Save & Return",
    "returnOnly": "Return"
  }
</i18n>
