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

              <div style="">Favorite Tools</div>
              <v-container>
                <v-row>
                  <v-col cols="3">
                    <v-card class="mt-3">
                      <v-card class="mainListCard">
                        <v-card-title>
                          {{ $t("headingNames.allToolsName") }}
                        </v-card-title>
                        <v-card-text>
                          <v-list class="mainToolsList">
                            <v-list-item-group v-model="allListSelectedIndex">
                              <v-list-item
                                v-for="(item, i) in allToolsList"
                                :key="i">
                                <v-list-item-icon>
                                  <v-icon v-text="item.icon"></v-icon>
                                </v-list-item-icon>
                                <v-list-item-content>
                                  <v-list-item-title
                                    v-html="
                                      $t('buttons.' + item.displayedName)
                                    "></v-list-item-title>
                                </v-list-item-content>
                              </v-list-item>
                            </v-list-item-group>
                          </v-list>
                        </v-card-text>
                      </v-card>
                    </v-card>
                  </v-col>
                  <v-col cols="9">
                    <v-container>
                      <v-row>
                        <v-col cols="6">
                          <FavoriteToolsCard
                            v-if="dataReceived"
                            :itemList="displayedFavoriteTools[0]"
                            :itemListBackend="userFavoriteTools[0]"
                            :listTitle="$t('headingNames.topLeftCorner')"
                            :mainList="allToolsList"
                            :mainListIndex="allListSelectedIndex"
                            :maxFavoriteToolsLimit="maxFavoriteToolsLimit"
                            @update:DeselectTool="
                              allListSelectedIndex = $event
                            " />
                          <!--div v-else>
                            <p>loading</p>
                          </!--div-->
                        </v-col>
                        <v-col cols="6">
                          <!--FavoriteToolsCard
                            v-if="dataReceived"
                            :itemList="displayedFavoriteTools[1]"
                            :itemListBackend="userFavoriteTools[1]"
                            :listTitle="$t('headingNames.topRightCorner')"
                            :mainList="allToolsList"
                            :mainListIndex="allListSelectedIndex"
                            :maxFavoriteToolsLimit="maxFavoriteToolsLimit"
                            @update:DeselectTool="
                              allListSelectedIndex = $event
                            " />
                          <div-- v-else>
                            <p>loading</p>
                          </div-->
                        </v-col>
                        <v-col cols="6">
                          <!--FavoriteToolsCard
                            v-if="dataReceived"
                            :itemList="displayedFavoriteTools[3]"
                            :itemListBackend="userFavoriteTools[3]"
                            :listTitle="$t('headingNames.bottomLeftCorner')"
                            :mainList="allToolsList"
                            :mainListIndex="allListSelectedIndex"
                            :maxFavoriteToolsLimit="maxFavoriteToolsLimit"
                            @update:DeselectTool="
                              allListSelectedIndex = $event
                            " />
                          <div-- v-else>
                            <p>loading</p>
                          </div-->
                        </v-col>
                        <v-col cols="6">
                          <!--FavoriteToolsCard
                            v-if="dataReceived"
                            :itemList="displayedFavoriteTools[2]"
                            :itemListBackend="userFavoriteTools[2]"
                            :listTitle="$t('headingNames.bottomRightCorner')"
                            :mainList="allToolsList"
                            :mainListIndex="allListSelectedIndex"
                            :maxFavoriteToolsLimit="maxFavoriteToolsLimit"
                            @update:DeselectTool="
                              allListSelectedIndex = $event
                            " />
                          <div-- v-else>
                            <p>loading</p>
                          </div-->
                        </v-col>
                      </v-row>
                    </v-container>
                  </v-col>
                </v-row>
              </v-container>

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
.mainListCard {
  min-width: 200px;
}

.mainToolsList {
  max-height: 885px;
  overflow-y: auto;
}

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
import FavoriteToolsCard from "@/components/FavoriteToolsCard.vue";
import { FavoriteTool } from "@/types";
import EventBus from "@/eventHandlers/EventBus";
import { computed, onMounted, Ref, ref } from "vue";
import { useI18n } from "vue-i18n";
import { TOOL_DICTIONARY } from "@/components/tooldictionary";

type LocaleName = {
  locale: string;
  name: string;
};
const { t } = useI18n();
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
const dataReceived = ref(false);
const userFavoriteTools: Ref<FavoriteTool[][]> = ref([[], [], [], []]);
// The displayed favorite tools (includes defaults)
const displayedFavoriteTools: Ref<FavoriteTool[][]> = ref([[], [], [], []]);
const allToolsList: Ref<FavoriteTool[]> = ref([]);
const allListSelectedIndex: Ref<number | null> = ref(null);
const maxFavoriteToolsLimit = 6;

const userUid = computed((): string | undefined => {
  return appAuth.currentUser?.uid;
});
const defaultToolNames = [
  ["undoAction", "redoAction"],
  ["resetAction"],
  ["zoomIn", "zoomOut", "zoomFit"],
  []
];

onMounted((): void => {
  if (userUid.value) {
    initializeToolLists();

    getDoc(doc(appDB, "users", userUid.value)).then((ds: DocumentSnapshot) => {
      if (ds.exists()) {
        const uProfile = ds.data() as UserProfile;
        // console.log("From Firestore", uProfile);
        userDisplayName.value = uProfile.displayName ?? "N/A";
        userLocation.value = uProfile.location ?? "N/A";
        userFavoriteTools.value = decodeFavoriteTools(
          uProfile.favoriteTools ?? "\n\n\n"
        );
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

function initializeToolLists(): void {
  // Create a dictionary with actionModeValues as the keys, and references to the tool definition.
  // Set up master list of all tools for favorites selection
  let compList = Array.from(TOOL_DICTIONARY.values()).map(child => ({
    // actionModeValue: child.action,
    // displayedName: child.displayedName,
    // icon: child.icon,
    // disabled: false,
    // langName: t("buttons." + child.displayedName)
  }));

  // Sort the temp List
  compList.sort((a, b) =>
    // a.langName < b.langName ? -1 : a.langName > b.langName ? 1 : 0
    0
  );
  // Redefine the allToolsList
  // allToolsList.value = compList.map(tool => ({
  //   actionModeValue: tool.actionModeValue,
  //   displayedName: tool.displayedName,
  //   // icon: tool.icon,
  //   // disableBtn: false,
  //   disabled: false
  // }));
  // Add default tools to displayedFavoriteTools
  for (let i = 0; i < defaultToolNames.length; i++) {
    for (let j = 0; j < defaultToolNames[i].length; j++) {
      let temp_tool = allToolsList.value.filter(
        tl => defaultToolNames[i][j] === tl.actionModeValue
      );
      if (temp_tool.length > 0) {
        // temp_tool[0].disabled = true;
        // temp_tool[0] is passed by reference, so we create a copy of it
        let tool = Object.assign({}, temp_tool[0]);
        displayedFavoriteTools.value[i].push(tool);
        // Set this tool to disabled because the user cannot disable defaults
        console.log(
          "Added '" +
            temp_tool[0].actionModeValue +
            "' to this.displayedFavoriteTools"
        );
      } else {
        console.log(
          "Warning: Could not find '" +
            defaultToolNames[i][j] +
            "' in this.allToolsList"
        );
      }
    }
  }
}

function encodeFavoriteTools(): string {
  // Create 2D list of names
  let favoritesList = userFavoriteTools.value.map(corner =>
    corner.map(tool => tool.actionModeValue)
  );
  // Map list to string and return
  return favoritesList.map(corner => corner.join(", ")).join("\n");
}

function decodeFavoriteTools(favoritesListStr: string): FavoriteTool[][] {
  // FavoriteTool[][] array we are returning
  let finalToolsList: FavoriteTool[][] = [];

  // Convert list's string representation to 2D array of strings
  let favoriteToolNames: string[][];
  favoriteToolNames = favoritesListStr.split("\n").map(row => row.split(", "));

  // save each matching FavoriteTool in allToolsList to finalToolsList, where each index is a corner
  for (const corner of favoriteToolNames) {
    let temp_corner: FavoriteTool[] = [];
    for (const tool of corner) {
      let temp_tool = allToolsList.value.filter(
        tl => tool === tl.actionModeValue
      );
      if (temp_tool.length > 0) {
        temp_corner.push(Object.assign({}, temp_tool[0]));
      }
    }
    finalToolsList.push(temp_corner);
  }

  // Add the user's favorite tools to the displayedFavoriteTools list
  for (let i = 0; i < finalToolsList.length; i++) {
    for (const tool of finalToolsList[i]) {
      displayedFavoriteTools.value[i].push(Object.assign({}, tool));
    }
  }

  // Iterate through allToolsList to set each favorited tool as not focusable
  for (let i = 0; i < displayedFavoriteTools.value.length; i++) {
    for (let j = 0; j < displayedFavoriteTools.value[i].length; j++) {
      let index = allToolsList.value.findIndex(
        tool =>
          tool.actionModeValue ===
          displayedFavoriteTools.value[i][j].actionModeValue
      );
      // allToolsList.value[index].disabled = true;
    }
  }
  return finalToolsList;
}

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
    favoriteTools: encodeFavoriteTools()
  };
  const profileDoc = doc(appDB, "users", userUid.value!);
  setDoc(profileDoc, newProf, { merge: true }).then(() => {
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
