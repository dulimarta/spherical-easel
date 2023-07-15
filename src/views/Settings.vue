<template>
  <v-container>
    <v-tabs centered v-model="selectedTab">
      <v-tab v-if="profileEnabled">User Profile</v-tab>
      <v-tab>App Preferences</v-tab>
    </v-tabs>
    <v-window v-model="selectedTab">
      <v-window-item v-if="profileEnabled">
        <v-sheet elevation="2" class="pa-2">
          <div
            id="profileInfo"
            class="text-body-2"
            :style="{
              flexDirection: updatingPicture ? 'column' : 'row',
              alignItems: updatingPicture ? 'flex-center' : 'fllex-start'
            }">
            <div class="mx-3">
              <!-- Nested router view for handling profile picture update -->
              <router-view
                @photo-change="setUpdatingPicture(true)"
                @no-capture="setUpdatingPicture(false)"
                @photo-captured="setUpdatingPicture(false)"></router-view>
            </div>
            <div class="px-2">
              <v-text-field label="Email" readonly v-model="userEmail" />
              <v-text-field v-model="userDisplayName" label="Display Name" />
              <v-text-field v-model="userLocation" label="Location" />

              <v-select
                label="Role"
                v-model="userRole"
                :items="[
                  'Student',
                  'Instructor',
                  'Community Member'
                ]"></v-select>

              <FavoriteToolsPicker />

              <v-row justify="center">
                <v-col cols="auto">
                  <v-btn @click="doSave">Save</v-btn>
                </v-col>
                <v-col cols="auto">
                  <v-btn
                    class="mx-2"
                    :disabled="!userEmail"
                    @click="doChangePassword">
                    Change Password
                  </v-btn>
                </v-col>
                <v-col cols="auto">
                  <v-btn color="red lighten-2">Delete Account</v-btn>
                </v-col>
              </v-row>
            </div>
            <!-- <v-overlay absolute
              :value="!profileEnabled">
              <span>This feature is  for authenticated
                users</span>
            </v-overlay> -->
          </div>
        </v-sheet>
      </v-window-item>
      <v-window-item>
        <v-sheet elevation="2" class="pa-2">
          <h3 v-t="'settings.title'"></h3>
          <v-container fluid>
            <v-row>
              <v-col cols="4">
                <v-select
                  v-model="selectedLanguage"
                  variant="outlined"
                  :items="languages"
                  item-title="name"
                  item-value="locale"
                  label="Language"></v-select>
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

    <v-row>
      <v-col cols="12" sm="6"></v-col>
    </v-row>
  </v-container>
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
import PhotoCapture from "@/views/PhotoCapture.vue";
import SETTINGS from "@/global-settings";
import {
  getAuth,
  User,
  sendPasswordResetEmail,
  Unsubscribe
} from "firebase/auth";
import {
  DocumentSnapshot,
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "firebase/firestore";
import { UserProfile } from "@/types";
import FavoriteToolsPicker from "@/components/FavoriteToolsPicker.vue"
import EventBus from "@/eventHandlers/EventBus";
import { computed, onMounted, Ref, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useAccountStore } from "@/stores/account";
import { storeToRefs } from "pinia";
type LocaleName = {
  locale: string;
  name: string;
};
const { t } = useI18n();
const acctStore = useAccountStore()
const { favoriteTools} = storeToRefs(acctStore)
const appAuth = getAuth();
const appDB = getFirestore();
const imageUpload: Ref<HTMLInputElement | null> = ref(null);
const updatingPicture = ref(false);
const selectedLanguage: Ref<LocaleName> = ref({ locale: "", name: "" });
const languages: Ref<Array<LocaleName>> = ref(SETTINGS.supportedLanguages);
const decimalPrecision = ref(3);
const userEmail = ref("");
const userDisplayName = ref("");
const userLocation = ref("");
const userRole = ref("Community Member");
const selectedTab = ref(0);
let authSubscription!: Unsubscribe;
const profileEnabled = ref(false);
// The displayed favorite tools (includes defaults)

const userUid = computed((): string | undefined => {
  return appAuth.currentUser?.uid;
});

onMounted((): void => {
  if (userUid.value) {
    getDoc(doc(appDB, "users", userUid.value)).then((ds: DocumentSnapshot) => {
      if (ds.exists()) {
        const uProfile = ds.data() as UserProfile;
        // console.log("From Firestore", uProfile);
        userDisplayName.value = uProfile.displayName ?? "N/A";
        userLocation.value = uProfile.location ?? "N/A";
        // userFavoriteTools.value = decodeFavoriteTools(
        //   uProfile.favoriteTools ?? "###"
        // );
        if (uProfile.role) userRole.value = uProfile.role;
      }
    });
  }
  authSubscription = appAuth.onAuthStateChanged((u: User | null) => {
    profileEnabled.value = u !== null;
    if (u !== null) {
      userEmail.value = u.email ?? "unknown";
    } else {
      userDisplayName.value = "";
      userLocation.value = "";
      userRole.value = "Community Member";
    }

    // console.log("Auth changed", u, this.profileEnabled);
  });
});


function switchLocale(): void {
  // $i18n.locale = (this.selectedLanguage as any).locale;
}
function setUpdatingPicture(flag: boolean): void {
  updatingPicture.value = flag;
}
function doSave(): void {
  const newProf: UserProfile = {
    displayName: userDisplayName.value,
    location: userLocation.value,
    role: userRole.value,
    favoriteTools: favoriteTools.value
      .map(arr => arr.map(s => s.trim()).join(','))
      .join("#")
  };
  const profileDoc = doc(appDB, "users", userUid.value!);
  setDoc(profileDoc, newProf, { merge: true }).then(() => {
    alert("New profile saved")
    EventBus.fire("show-alert", {
      key: "Your profile has been update",
      type: "info"
    });
  });
}

function doChangePassword(): void {
  if (userEmail.value)
    sendPasswordResetEmail(appAuth, userEmail.value).then(() => {
      EventBus.fire("show-alert", {
        key: "A password reset link has been delivered by email",
        type: "info"
      });
    });
}
</script>