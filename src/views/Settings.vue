<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <v-tabs centered v-model="selectedTab">
    <v-tab>{{ t("userProfile") }}</v-tab>
    <!-- <v-tab>App Preferences</v-tab> -->
    <v-tab>{{ t("tools") }}</v-tab>
  </v-tabs>
  <v-window v-model="selectedTab">
    <v-window-item>
      <UserProfileUI />
    </v-window-item>
    <!--v-window-item>
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
    </!--v-window-item-->

    <v-window-item>
      <FavoriteToolsPicker />
    </v-window-item>
  </v-window>

  <v-divider />
  <v-row justify="center" class="my-1">
    <v-col cols="auto">
      <v-btn @click="doSave">{{ t("saveAndReturn") }}</v-btn>
    </v-col>
    <v-col cols="auto">
      <v-btn @click="doReturn">{{ t("returnOnly") }}</v-btn>
    </v-col>
  </v-row>
</template>

<style lang="scss" scoped>
div#container {
  padding: 1rem;
}

div#profileInfo {
  display: flex;

  // flex-direction: row;
  // align-items: flex-start;
  & > :nth-child(2) {
    // background-color: map-get($green, lighten-2);
    flex-grow: 1;
  }
}

div#appSetting {
  display: grid;
  grid-template-columns: 1fr 3fr; // align-items: baseline;
}
</style>

<script lang="ts" setup>
import UserProfileUI from "./UserProfile.vue";
import FavoriteToolsPicker from "@/components/FavoriteToolsPicker.vue";
import EventBus from "@/eventHandlers/EventBus";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAccountStore } from "@/stores/account";
import { useI18n } from "vue-i18n";
const router = useRouter();
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

// function doChangePassword(): void {
//   if (userEmail.value)
//     sendPasswordResetEmail(appAuth, userEmail.value).then(() => {
//       EventBus.fire("show-alert", {
//         key: "A password reset link has been delivered by email",
//         type: "info"
//       });
//     });
// }
</script>
<i18n locale="en">
  {
    "userProfile": "User Profile",
    "tools": "Tools",
    "saveAndReturn": "Save & Return",
    "returnOnly": "Return"
  }
</i18n>
