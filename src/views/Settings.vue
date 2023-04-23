<template>
  <v-container>
    <v-tabs centered v-model="selectedTab">
      <v-tab v-if="profileEnabled">User Profile</v-tab>
      <v-tab>App Preferences</v-tab>
    </v-tabs>
    <v-tabs-items v-model="selectedTab">

      <v-tab-item v-if="profileEnabled">
        <v-sheet elevation="2" class="pa-2">

          <div id="profileInfo" class="text-body-2" :style="{
            flexDirection: updatingPicture ? 'column' : 'row',
            alignItems: updatingPicture ? 'flex-center' : 'flex-start'
          }">
            <div class="mx-3">
              <!-- Nested router view for handling profile picture update -->
              <router-view @photo-change="setUpdatingPicture(true)" @no-capture="setUpdatingPicture(false)"
                @photo-captured="setUpdatingPicture(false)"></router-view>
            </div>
            <div class="px-2">
              <v-text-field label="Email" readonly v-model="userEmail" />
              <v-text-field v-model="userDisplayName" label="Display Name" />
              <v-text-field v-model="userLocation" label="Location" />

              <v-select label="Role" v-model="userRole" :items="
                ['Student', 'Instructor'
                  , 'Community Member'
                ]">
              </v-select>

              <div style="">Favorite Tools</div>
              <v-container>
                <v-row>
                  <v-col cols="3">
                    <v-card class="mt-3">
                      <v-card class = "mainListCard">
                        <v-card-title>
                          {{ $t("headingNames.allToolsName") }}
                        </v-card-title>
                        <v-card-text>
                          <v-list class="mainToolsList">
                            <v-list-item-group v-model="allListSelectedIndex">
                              <v-list-item v-for="(item, i) in allToolsList" :key="i" :disabled="item.disabled">
                                <v-list-item-icon>
                                  <v-icon v-text="item.icon"></v-icon>
                                </v-list-item-icon>
                                <v-list-item-content>
                                  <v-list-item-title v-html="$t('buttons.' + item.displayedName)"></v-list-item-title>
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
                            <FavoriteToolsCard v-if="dataReceived"
                            :itemList="displayedFavoriteTools[0]"
                            :itemListBackend="userFavoriteTools[0]"
                            :listTitle="$t('headingNames.topLeftCorner')"
                            :mainList="allToolsList"
                            :mainListIndex="allListSelectedIndex"
                            :maxFavoriteToolsLimit="maxFavoriteToolsLimit"
                            @update:DeselectTool="allListSelectedIndex = $event"/>
                            <div v-else>
                              <p>loading</p>
                            </div>
                          </v-col>
                        <v-col cols="6">
                            <FavoriteToolsCard v-if="dataReceived"
                            :itemList="displayedFavoriteTools[1]"
                            :itemListBackend="userFavoriteTools[1]"
                            :listTitle="$t('headingNames.topRightCorner')"
                            :mainList="allToolsList"
                            :mainListIndex="allListSelectedIndex"
                            :maxFavoriteToolsLimit="maxFavoriteToolsLimit"
                            @update:DeselectTool="allListSelectedIndex = $event"/>
                            <div v-else>
                              <p>loading</p>
                            </div>
                          </v-col>
                        <v-col cols="6">
                          <FavoriteToolsCard v-if="dataReceived"
                          :itemList="displayedFavoriteTools[3]"
                          :itemListBackend="userFavoriteTools[3]"
                          :listTitle="$t('headingNames.bottomLeftCorner')"
                          :mainList="allToolsList"
                          :mainListIndex="allListSelectedIndex"
                          :maxFavoriteToolsLimit="maxFavoriteToolsLimit"
                          @update:DeselectTool="allListSelectedIndex = $event"/>
                          <div v-else>
                              <p>loading</p>
                            </div>
                        </v-col>
                        <v-col cols="6">
                          <FavoriteToolsCard v-if="dataReceived"
                          :itemList="displayedFavoriteTools[2]"
                          :itemListBackend="userFavoriteTools[2]"
                          :listTitle="$t('headingNames.bottomRightCorner')"
                          :mainList="allToolsList"
                          :mainListIndex="allListSelectedIndex"
                          :maxFavoriteToolsLimit="maxFavoriteToolsLimit"
                          @update:DeselectTool="allListSelectedIndex = $event"/>
                          <div v-else>
                              <p>loading</p>
                            </div>
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
                  <v-btn class="mx-2" :disabled="!userEmail" @click="doChangePassword">Change Password</v-btn>
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
        <v-sheet elevation="2" class="pa-2">
          <h3 v-t="'settings.title'"></h3>
          <div id="appSetting">
            <label>Language</label>
            <v-select v-model="selectedLanguage" outlined :items="languages" item-text="name" item-value="locale"
              label="Language" return-object>
            </v-select>
            <label>Decimal Precision</label>
            <v-radio-group row>
              <v-radio label="3" value="3"></v-radio>
              <v-radio label="5" value="5"></v-radio>
              <v-radio label="7" value="7"></v-radio>
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
      <v-col cols="12" sm="6">
      </v-col>
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
  &> :nth-child(2) {
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
import { FavoriteTool, UserProfile } from "@/types";
import { Unsubscribe } from "@firebase/util";
import EventBus from "@/eventHandlers/EventBus";
import { toolGroups } from "@/components/toolgroups";
import {toolDictionary} from "@/components/tooldictionary";
import FavoriteToolsCard from "@/components/FavoriteToolsCard.vue";

@Component({ components: { PhotoCapture, FavoriteToolsCard } })
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
  maxFavoriteToolsLimit = 6;
  // The user's actual favorite tools
  userFavoriteTools: FavoriteTool[][] = [[], [], [], []];
  // The displayed favorite tools (includes defaults)
  displayedFavoriteTools: FavoriteTool[][] = [[], [], [], []];
  defaultToolNames = [
    ["undoAction", "redoAction"],
    ["resetAction"],
    ["zoomIn", "zoomOut", "zoomFit"],
    []
  ]
  allToolsList: FavoriteTool[] = [];
  userRole = "Community Member";
  selectedTab = null;
  authSubscription!: Unsubscribe;
  profileEnabled = false;
  topLeftSelectedIndex: number | null = null;
  bottomLeftSelectedIndex: number | null = null;
  topRightSelectedIndex?: number | null = null;
  bottomRightSelectedIndex?: number | null = null;
  allListSelectedIndex?: number | null = null;
  dataReceived: boolean = false;
  get userUid(): string | undefined {
    return this.$appAuth.currentUser?.uid;
  }
  mounted(){
    // var test = LocaleMessages.get("buttons")
    // import VueI18n, {LocaleMessages} from "vue-i18n"
    // Sets up the master list of tools and displayedFavoriteTools
    this.initializeToolLists();
    this.$appDB
      .collection("users")
      .doc(this.userUid)
      .get()
      .then(async(ds: DocumentSnapshot) => {
        if (ds.exists) {
          const uProfile = ds.data() as UserProfile;
          console.log("From Firestore", uProfile);
          this.userDisplayName = uProfile.displayName ?? "N/A";
          this.userLocation = uProfile.location ?? "N/A";
          this.userFavoriteTools = this.decodeFavoriteTools(uProfile.favoriteTools ?? "\n\n\n");
          if (uProfile.role) this.userRole = uProfile.role;
        }
        this.dataReceived = true;

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
          this.userFavoriteTools = [[], [], [], []];
        }
      }
    );
  }

  initializeToolLists(): void {
    // Create a dictionary with actionModeValues as the keys, and references to the tool definition.
    // Set up master list of all tools for favorites selection
    let compList = Array.from(toolDictionary.values()).map(child => ({
      actionModeValue: child.actionModeValue,
      displayedName: child.displayedName,
      icon: child.icon,
      disabled: false,
      langName: this.$t("buttons." + child.displayedName)
    }));

    // Sort the temp List
    compList.sort((a, b) => a.langName < b.langName ? -1 : a.langName > b.langName ? 1 : 0);
    // Redefine the allToolsList
    this.allToolsList = compList.map(tool => ({
      actionModeValue: tool.actionModeValue,
      displayedName: tool.displayedName,
      icon: tool.icon,
      disableBtn: false,
      disabled: false
    }))
    // Add default tools to displayedFavoriteTools
    for (let i = 0; i < this.defaultToolNames.length; i++) {
      for (let j = 0; j < this.defaultToolNames[i].length; j++) {
        let temp_tool = this.allToolsList.filter(tl => this.defaultToolNames[i][j] === tl.actionModeValue);
        if (temp_tool.length > 0) {
          temp_tool[0].disabled = true;
          // temp_tool[0] is passed by reference, so we create a copy of it
          let tool = Object.assign({}, temp_tool[0]);
          this.displayedFavoriteTools[i].push(tool);
          // Set this tool to disabled because the user cannot disable defaults
          console.log("Added '" + temp_tool[0].actionModeValue + "' to this.displayedFavoriteTools");
        } else {
          console.log("Warning: Could not find '" + this.defaultToolNames[i][j] + "' in this.allToolsList");
        }
      }
    }
  }

  decodeFavoriteTools(favoritesListStr: string): FavoriteTool[][] {
    // FavoriteTool[][] array we are returning
    let finalToolsList: FavoriteTool[][] = [];

    // Convert list's string representation to 2D array of strings
    let favoriteToolNames: string[][];
    favoriteToolNames = favoritesListStr.split("\n").map(row => row.split(", "));

    // save each matching FavoriteTool in allToolsList to finalToolsList, where each index is a corner
    for (const corner of favoriteToolNames) {
      let temp_corner: FavoriteTool[] = [];
      for (const tool of corner) {
        let temp_tool = this.allToolsList.filter(tl => tool === tl.actionModeValue);
        if (temp_tool.length > 0) {
          temp_corner.push(Object.assign({}, temp_tool[0]));
        }
      }
      finalToolsList.push(temp_corner);
    }

    // Add the user's favorite tools to the displayedFavoriteTools list
    for (let i = 0; i < finalToolsList.length; i++) {
      for (const tool of finalToolsList[i]) {
        this.displayedFavoriteTools[i].push(Object.assign({}, tool));
      }
    }

    // Iterate through allToolsList to set each favorited tool as not focusable
    for (let i = 0; i < this.displayedFavoriteTools.length; i++) {
      for (let j = 0; j < this.displayedFavoriteTools[i].length; j++) {
        let index = this.allToolsList.findIndex(tool => tool.actionModeValue === this.displayedFavoriteTools[i][j].actionModeValue);
        this.allToolsList[index].disabled = true;
      }
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
          key: "Your profile has been updated",
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