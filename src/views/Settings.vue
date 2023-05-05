<template>
  <v-container>
    <v-tabs centered :model-value="selectedTab">
      <v-tab v-if="profileEnabled">User Profile</v-tab>
      <v-tab>App Preferences</v-tab>
    </v-tabs>
    <v-tabs-items :model-value="selectedTab">
      <v-tab-item v-if="profileEnabled">
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
              <v-text-field label="Email" readonly :model-value="userEmail" />
              <v-text-field :model-value="userDisplayName" label="Display Name" />
              <v-text-field :model-value="userLocation" label="Location" />

              <v-select
                label="Role"
                :model-value="userRole"
                :items="['Student', 'Instructor', 'Community Member']">
              </v-select>
              <v-row justify="center">
                <v-col cols="auto">
                  <v-btn @click="doSave">Save</v-btn>
                </v-col>
                <v-col cols="auto">
                  <v-btn
                    class="mx-2"
                    :disabled="!userEmail"
                    @click="doChangePassword"
                    >Change Password</v-btn
                  >
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
      </v-tab-item>
      <v-tab-item
        >Second
        <v-sheet elevation="2" class="pa-2">
          <h3 v-t="'settings.title'"></h3>
          <div id="appSetting">
            <label>Language</label>
            <v-select v-model="selectedLanguage"
              outlined
              :items="languages"
              item-text="name"
              item-value="locale"
              label="Language">
            </v-select>
            <label>Decimal Precision</label>
            <v-radio-group :model-value="decimalPrecision" row>
              <v-radio label="3" value="3"></v-radio>
              <v-radio label="5" value="5"></v-radio>
              <v-radio label="7" value="7"></v-radio>
            </v-radio-group>
            <labeL>Selection Precision</labeL>
            <v-radio-group row>
              <v-radio label="Less">Less</v-radio>
              <v-radio label="More">More</v-radio>
            </v-radio-group>
            <h3>Label options</h3>
            <span></span>
            <label>Initial display</label>
            <v-radio-group row>
              <v-radio label="None"></v-radio>
              <v-radio label="All"></v-radio>
              <v-radio label="Default"></v-radio>
            </v-radio-group>
            <span></span>
            <v-checkbox label="Hide objects/labels" />
            <span></span>
            <v-checkbox label="Show objects/labels" />
            <h3>Hints</h3>
            <span></span>
            <span></span>
            <v-checkbox label="Display Tooltips" />
            <span></span>
            <v-checkbox label="Display use messages" />
          </div>
        </v-sheet>
      </v-tab-item>
    </v-tabs-items>

    <v-row>
      <v-col cols="12" sm="6"> </v-col>
    </v-row>
  </v-container>
</template>

<style lang="scss" scoped>
// @import "vuetify/src/styles/styles.sass";

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
import { getAuth, User, sendPasswordResetEmail, Unsubscribe } from "firebase/auth";
import { DocumentSnapshot, getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { UserProfile } from "@/types";

import EventBus from "@/eventHandlers/EventBus";
import { computed, onMounted, Ref, ref } from "vue";

type LocaleName = {
  locale: string, name:string
}
const appAuth = getAuth()
const appDB = getFirestore()
const imageUpload: Ref<HTMLInputElement | null> = ref(null);
const updatingPicture = ref(false);
const selectedLanguage: Ref<LocaleName> = ref({locale: "", name: ""});
const languages = SETTINGS.supportedLanguages;
const decimalPrecision = ref(3);
const userEmail = ref("");
const userDisplayName = ref("");
const userLocation = ref("");
const userRole = ref("Community Member");
const selectedTab = ref(0);
let authSubscription!: Unsubscribe;
const profileEnabled = ref(false);

const userUid = computed((): string | undefined => {
  return appAuth.currentUser?.uid;
});

onMounted((): void => {
  if (userUid.value) {
    getDoc(doc(appDB, "users", userUid.value))
      .then((ds: DocumentSnapshot) => {
        if (ds.exists()) {
          const uProfile = ds.data() as UserProfile;
          // console.log("From Firestore", uProfile);
          userDisplayName.value = uProfile.displayName ?? "N/A";
          userLocation.value = uProfile.location ?? "N/A";
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
    role: userRole.value
  };
  const profileDoc = doc(appDB, "users",userUid.value!)
    setDoc(profileDoc, newProf, { merge: true })
    .then(() => {
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
