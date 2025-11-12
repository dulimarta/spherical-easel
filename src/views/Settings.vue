<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <v-tabs centered v-model="selectedTab">
    <v-tab>{{ t("userProfile") }}</v-tab>
    <v-tab>{{ t("tools") }}</v-tab>
    <v-tab>App Preferences</v-tab>
  </v-tabs>

  <v-window v-model="selectedTab">
    <v-window-item>
      <UserProfileUI @profile-changed="(arg) => (profileChanged = arg)" />
    </v-window-item>

    <v-window-item>
      <FavoriteToolsPicker />
    </v-window-item>

    <v-window-item>
      <v-sheet elevation="2" class="pa-4">
        <h3>{{ t("settings.title") }}</h3>

        <!-- Decimal precision -->
        <v-container fluid>
          <v-row>
            <v-col cols="4"></v-col>
            <v-col cols="4">
              <v-sheet rounded="lg" elevation="2">
                <v-radio-group
                  v-model="decimalPrecision"
                  inline
                  label="Decimal Precision"
                >
                  <v-radio label="3" value="3"></v-radio>
                  <v-radio label="5" value="5"></v-radio>
                  <v-radio label="7" value="7"></v-radio>
                </v-radio-group>
              </v-sheet>
            </v-col>
          </v-row>
        </v-container>

        <v-divider class="my-3" />

        <!-- Default fill style -->
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

        <!-- Boundary circle preferences -->
        <h4>Boundary Circle</h4>
        <v-row>
          <v-col cols="4">
            <v-sheet class="pa-2 d-flex flex-column align-start">
              <!-- Color selector -->
              <div class="d-flex align-center mb-3">
                <v-menu
                  v-model="colorPickerMenu"
                  close-on-content-click="false"
                  transition="scale-transition"
                  offset-y
                >
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      :style="{
                        backgroundColor: prefsStore.boundaryColor,
                        minWidth: '40px',
                        height: '40px',
                        border: '1px solid #ccc'
                      }"
                      @click.stop
                    ></v-btn>
                  </template>
                  <v-color-picker
                    v-model="prefsStore.boundaryColor"
                    hide-inputs
                    mode="hexa"
                    @update:modelValue="() => (profileChanged = true)"
                  />
                </v-menu>
                <span class="ml-3">Color</span>
              </div>

              <!-- Line thickness selector -->
              <div class="d-flex align-center">
                <v-select
                  v-model.number="prefsStore.boundaryWidth"
                  :items="lineWidthOptions"
                  density="compact"
                  hide-details
                  style="max-width: 120px;"
                  @update:modelValue="() => (profileChanged = true)"
                />
                <span class="ml-3">Line Thickness</span>
              </div>
            </v-sheet>
          </v-col>
        </v-row>
      </v-sheet>
    </v-window-item>
  </v-window>

  <v-divider />
  <div class="mt-3" :style="{ display: 'flex', justifyContent: 'center' }">
    <v-btn
      class="mx-2"
      @click="doSave"
      :disabled="!profileChanged"
      color="primary"
    >
      {{ t("saveAndReturn") }}
    </v-btn>
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
const { t } = useI18n();
const acctStore = useAccountStore();
const prefsStore = useUserPreferencesStore();
const decimalPrecision = ref(3);
const selectedTab = ref(0);
const profileChanged = ref(false);

// Color picker toggle
const colorPickerMenu = ref(false);

// Line width options
const lineWidthOptions = Array.from({ length: 10 }, (_, i) => i + 1);

// Fill style options
const fillStyleItems = [
  { text: t("noFill"), value: FillStyle.NoFill },
  { text: t("plainFill"), value: FillStyle.PlainFill },
  { text: t("shadeFill"), value: FillStyle.ShadeFill }
];

// Save user preferences
async function doSave(): Promise<void> {
  await acctStore.saveUserProfile();
  try {
    await prefsStore.save();
  } catch (e) {
    console.debug("Could not save preferences:", e);
  }
  EventBus.fire("show-alert", {
    key: "Your profile has been updated",
    type: "info"
  });
  router.back();
}

// Return without saving
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
