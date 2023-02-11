<template>
  <v-container>
    <v-tabs centered
      v-model="selectedTab">
      <v-tab v-if="profileEnabled">User Profile</v-tab>
      <v-tab>App Preferences</v-tab>
    </v-tabs>
    <v-tabs-items v-model="selectedTab">

      <v-tab-item v-if="profileEnabled">
        <v-sheet elevation="2"
          class="pa-2">

          <div id="profileInfo"
            class="text-body-2"
            :style="{
              flexDirection : updatingPicture ? 'column':'row',
              alignItems: updatingPicture ? 'flex-center' : 'fllex-start'}">
            <div class="mx-3">
              <!-- Nested router view for handling profile picture update -->
              <router-view @photo-change="setUpdatingPicture(true)"
                @no-capture="setUpdatingPicture(false)"
                @photo-captured="setUpdatingPicture(false)"></router-view>
            </div>
            <div class="px-2">
              <v-text-field label="Email"
                readonly
                v-model="userEmail" />
              <v-text-field v-model="userDisplayName"
                label="Display Name" />
              <v-text-field v-model="userLocation"
                label="Location" />

              <v-select label="Role"
                v-model="userRole"
                :items="
                ['Student', 'Instructor'
                , 'Community Member'
                ]">
              </v-select>
              <v-row justify="center">
                <v-col cols="auto">
                  <v-btn @click="doSave">Save</v-btn>
                </v-col>
                <v-col cols="auto">
                  <v-btn class="mx-2"
                    :disabled="!userEmail"
                    @click="doChangePassword">Change Password</v-btn>
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
      <v-tab-item>
        <v-sheet elevation="2"
          class="pa-2">
          <h3 v-t="'settings.title'"></h3>
          <div id="appSetting">
            <label>Language</label>
            <v-select v-model="selectedLanguage"
              outlined
              :items="languages"
              item-text="name"
              item-value="locale"
              label="Language"
              return-object>
            </v-select>
            <label>Decimal Precision</label>
            <v-radio-group row>
              <v-radio label="3"
                value="3"></v-radio>
              <v-radio label="5"
                value="5"></v-radio>
              <v-radio label="7"
                value="7"></v-radio>
            </v-radio-group>
            <labeL>Selection Precision</labeL>
            <v-radio-group row>
              <v-radio label="Less">Less</v-radio>
              <v-radio label="More">More</v-radio>
            </v-radio-group>
            <h3>Label options</h3><span></span>
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
            <h3>Hints</h3><span></span>
            <span></span>
            <v-checkbox label="Display Tooltips" />
            <span></span>
            <v-checkbox label="Display use messages" />
          </div>
        </v-sheet>

      </v-tab-item>
    </v-tabs-items>

    <v-row>
      <v-col cols="12"
        sm="6">
      </v-col>
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
<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import PhotoCapture from "@/views/PhotoCapture.vue";
import SETTINGS from "@/global-settings";
import { FirebaseAuth, User } from "@firebase/auth-types";
import { FirebaseFirestore, DocumentSnapshot } from "@firebase/firestore-types";
import {FavoriteTool, UserProfile } from "@/types";
import { Unsubscribe } from "@firebase/util";

import EventBus from "@/eventHandlers/EventBus";
import { toolGroups } from "@/components/toolgroups";

@Component({ components: { PhotoCapture } })
export default class Settings extends Vue {
  $refs!: {
    imageUpload: HTMLInputElement;
  };
  readonly $appAuth!: FirebaseAuth;
  readonly $appDB!: FirebaseFirestore;
  updatingPicture = false;
  selectedLanguage: unknown = {};
  languages = SETTINGS.supportedLanguages;
  decimalPrecision = 3;
  userEmail = "";
  userDisplayName = "";
  userLocation = "";
  userFavoriteTools: FavoriteTool[][] = [];
  userRole = "Community Member";
  selectedTab = null;
  authSubscription!: Unsubscribe;
  profileEnabled = false;

  get userUid(): string | undefined {
    return this.$appAuth.currentUser?.uid;
  }

  mounted(): void {
    this.$appDB
      .collection("users")
      .doc(this.userUid)
      .get()
      .then((ds: DocumentSnapshot) => {
        if (ds.exists) {
          const uProfile = ds.data() as UserProfile;
          // console.log("From Firestore", uProfile);
          this.userDisplayName = uProfile.displayName ?? "N/A";
          this.userLocation = uProfile.location ?? "N/A";
          this.userFavoriteTools = this.decodeFavoriteTools(uProfile.favoriteTools ?? "\n\n\n");
          if (uProfile.role) this.userRole = uProfile.role;
        }
      });
    this.authSubscription = this.$appAuth.onAuthStateChanged(
      (u: User | null) => {
        this.profileEnabled = u !== null;
        if (u !== null) {
          this.userEmail = u.email ?? "unknown";
        } else {
          this.userDisplayName = "";
          this.userLocation = "";
          this.userRole = "Community Member";
        }
        // console.log("Auth changed", u, this.profileEnabled);
      }
    );
  }
  decodeFavoriteTools(favoritesListStr: string): FavoriteTool[][] {
    let finalToolsList: FavoriteTool[][] = [];

    // Convert list's string representation to 2D array of strings
    let favoriteToolNames: string[][];
    favoriteToolNames = favoritesListStr.split("\n").map(row => row.split(", "));

    // Create a FavoriteTool for all the tools and save in a list
    // TODO: We might be able to get rid of this bit here and merge it with the following loop
    let allTools: FavoriteTool[];
    allTools = toolGroups.map(group => group.children.map(child => ({
      actionModeValue: child.actionModeValue,
      displayedName: child.displayedName,
      icon: child.icon
    }))).reduce((acc, val) => acc.concat(val), []);

    // save each matching FavoriteTool to the userFavoriteTools, where each index is a corner
    for (const corner of favoriteToolNames) {
      // Yes this is way less efficient, but we need to keep the order of the tools. Use this till better solution
      let temp_corner: FavoriteTool[] = [];
      for (const tool of corner) {
        let temp_tool = allTools.filter(tl => tool === tl.actionModeValue);
        if (temp_tool.length > 0) {
          temp_corner.push(temp_tool[0]);
        }
      }
      finalToolsList.push(temp_corner);
    }
    return finalToolsList;
  }
  encodeFavoriteTools(): string {
    // Create 2D list of names
    let favoritesList = this.userFavoriteTools.map(corner => corner.map(tool => tool.actionModeValue));
    // Map list to string and return
    return favoritesList.map(corner => corner.join(", ")).join("\n");
}
  switchLocale(): void {
    this.$i18n.locale = (this.selectedLanguage as any).locale;
  }
  setUpdatingPicture(flag: boolean): void {
    this.updatingPicture = flag;
  }
  doSave(): void {
    const newProf: UserProfile = {
      displayName: this.userDisplayName,
      location: this.userLocation,
      role: this.userRole,
      favoriteTools: this.encodeFavoriteTools()
    };
    this.$appDB
      .collection("users")
      .doc(this.userUid)
      .set(newProf, { merge: true })
      .then(() => {
        EventBus.fire("show-alert", {
          key: "Your profile has been update",
          type: "info"
        });
      });
  }

  doChangePassword(): void {
    if (this.userEmail)
      this.$appAuth.sendPasswordResetEmail(this.userEmail).then(() => {
        EventBus.fire("show-alert", {
          key: "A password reset link has been delivered by email",
          type: "info"
        });
      });
  }
}
</script>
