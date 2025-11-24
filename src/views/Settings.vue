<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <v-tabs centered v-model="selectedTab">
    <v-tab>{{ t("userProfile") }}</v-tab>
    <v-tab>{{ t("tools") }}</v-tab>
    <v-tab>App Preferences</v-tab>
  </v-tabs>
  <v-window v-model="selectedTab">
    <v-window-item>
      <UserProfileUI @profile-changed="(arg) => profileChanged = arg"/>
    </v-window-item>
    <v-window-item>
      <FavoriteToolsPicker />
    </v-window-item>
    <v-window-item>
      <v-sheet elevation="2" class="pa-2">
        <h3>{{ t('settings.title') }}</h3>
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
            <!-- Selection Precision temporarily disabled -->
            <!--
            <v-col cols="4">
              <v-sheet rounded="lg" elevation="2">
                <v-radio-group inline label="Selection Precision">
                  <v-radio label="Less" value="less"></v-radio>
                  <v-radio label="More" value="more"></v-radio>
                </v-radio-group>
              </v-sheet>
            </v-col>
            -->
          </v-row>
        </v-container>
          <v-divider class="my-3" />
          <h4>Default Fill</h4>
          <v-row>
            <v-col cols="6">
              <v-select
                v-model="prefsStore.defaultFill"
                :items="fillStyleItems"
                item-title="text"
                item-value="value"
                label="Default Fill Style"
                @update:modelValue="() => (profileChanged = true)"
              />
            </v-col>
          </v-row>
          <v-divider class="my-3" />
          <h4>Rotation Momentum Decay</h4>
          <v-row>
            <v-col cols="6">
              <v-slider
                v-model="momentumDecay"
                :min="0"
                :max="60"
                :step="1"
                label="Decay Time (seconds)"
                thumb-label
                @update:modelValue="onMomentumDecayChange"
              />
            </v-col>
          </v-row>
        <!-- Label options temporarily disabled -->
        <!--
        <h3>Label options</h3>
        <v-radio-group label="Object Label" inline>
          <v-radio label="None" value="none"></v-radio>
          <v-radio label="All" value="all"></v-radio>
          <v-radio label="Default" value="default"></v-radio>
        </v-radio-group>
        -->
      </v-sheet>
    </v-window-item>

  </v-window>

  <v-divider />
  <div class="mt-3" :style="{display: 'flex', justifyContent: 'center'}">
      <v-btn class="mx-2" @click="doSave" :disabled="!profileChanged">{{ t("saveAndReturn") }}</v-btn>
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
import { useUserPreferencesStore } from "@/stores/userPreferences";
import { FillStyle } from "@/types";
const router = useRouter();
type LocaleName = {
  locale: string;
  name: string;
};
const { t } = useI18n();
const acctStore = useAccountStore();
const prefsStore = useUserPreferencesStore();
// const imageUpload: Ref<HTMLInputElement | null> = ref(null);
const decimalPrecision = ref(3);
const selectedTab = ref(0);
const profileChanged = ref(false);
const momentumDecay = ref(prefsStore.momentumDecay ?? 0);
const fillStyleItems = [
  { text: t("noFill"), value: FillStyle.NoFill },
  { text: t("plainFill"), value: FillStyle.PlainFill },
  { text: t("shadeFill"), value: FillStyle.ShadeFill }
];
// The displayed favorite tools (includes defaults)
function onMomentumDecayChange() {
  prefsStore.momentumDecay = momentumDecay.value;
  profileChanged.value = true;
}

async function doSave(): Promise<void> {
  await acctStore.saveUserProfile();
  // persist any preference changes
  try {
    await prefsStore.save();
  } catch (e) {
    // ignore save errors for now
    console.debug("Could not save preferences:", e);
  }
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
    "settings.title": "Application Settings",
    "noFill": "No Fill",
    "plainFill": "Solid",
    "shadeFill": "Shading",
    "userProfile": "User Profile",
    "tools": "Tools",
    "saveAndReturn": "Save & Return",
    "returnOnly": "Return"
  }
</i18n>
