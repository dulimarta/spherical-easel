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
              alignItems: updatingPicture ? 'flex-center' : 'flex-start'}">
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

              <div style="">Favorite Tools</div>
              <v-container>
                <!-- I apologize to anyone who has experience in web dev for what you are about to witness -->
                <v-row style="height:800px; flex-wrap:nowrap">
                  <!--
                  columns in vuetify are essentially flex boxes. We can use the flex-grow style tag to assign
                  proportions to each column. This allows us to create separators and manage the size of grids
                  across multiple device and monitor sizes.
                  -->
                  <v-col style="height:95%; flex-grow:1"></v-col>
                  <!-- Master list of tools -->
                  <v-col style="height:95%; flex-grow:24">
                    <!-- master list -->
                    <v-card style="height:100%; width:100%">
                      <v-card-title>
                        All Tools
                      </v-card-title>
                      <v-card-text style="height:100%">
                        <v-list style="max-height:90%; overflow-y: auto">
                          <v-list-item-group v-model="allListSelectedIndex">
                            <v-list-item v-for="(item, i) in allToolsList" :key="i" :disabled="item.disabled">
                              <v-list-item-icon>
                                <v-icon v-text="item.icon"></v-icon>
                              </v-list-item-icon>
                              <v-list-item-content>
                                <v-list-item-title v-html="$t('buttons.' + item.displayedName )"></v-list-item-title>
                              </v-list-item-content>
                            </v-list-item>
                          </v-list-item-group>
                        </v-list>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  <v-col style="height:95%; flex-grow:4"></v-col>
                  <!-- Top-Left and Bottom-Left Corners -->
                  <!-- TODO: https://v2.vuetifyjs.com/en/styles/border-radius/#usage -->
                  <!-- TODO: https://v2.vuetifyjs.com/en/styles/elevation/#usage -->
                  <v-col style="height:95%; flex-grow:24">
                    <v-row style="height:50%; align-items:flex-start; justify-content:center">
                      <!-- Top-Left Corner -->
                      <v-card style="height:95%; width:100%; flex-basis:auto">
                        <v-card-title style="justify-content:center; flex-wrap:nowrap; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                          <v-col style="flex-grow:2">
                            <v-btn style="font-size:2rem;" @click="addToolToFavorites(0, allListSelectedIndex)">+</v-btn>
                          </v-col>
                          <v-col style="flex-grow:8;">
                            <div style="text-align:center; align-self:center;">Top-Left Corner</div>
                          </v-col>
                          <v-col style="flex-grow:2">
                            <v-btn style="font-size:2rem;" @click="removeToolFromFavorites(0, topLeftSelectedIndex)">-</v-btn>
                          </v-col>
                        </v-card-title>
                        <v-card-text style="height:100%">
                          <v-list style="max-height:70%; overflow-y: auto">
                            <v-list-item-group v-model="topLeftSelectedIndex">
                              <v-list-item v-for="(item, j) in displayedFavoriteTools[0]" :key="j" :disabled="item.disabled">
                                <v-list-item-icon>
                                  <v-icon v-text="item.icon"></v-icon>
                                </v-list-item-icon>
                                <v-list-item-content>
                                  <v-list-item-title v-html="$t('buttons.' + item.displayedName )"></v-list-item-title>
                                </v-list-item-content>
                              </v-list-item>
                            </v-list-item-group>
                          </v-list>
                        </v-card-text>
                      </v-card>
                    </v-row>
                    <!-- Bottom-Left Corner -->
                    <v-row style="height:50%; align-items:flex-start; justify-content:center">
                      <v-card style="height:100%; width:100%; flex-basis:auto">
                        <v-card-title style="justify-content:center; flex-wrap:nowrap; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                          <v-col style="flex-grow:2">
                            <v-btn style="font-size:2rem;" @click="addToolToFavorites(3, allListSelectedIndex)">+</v-btn>
                          </v-col>
                          <v-col style="flex-grow:8;">
                            <div style="text-align:center; align-self:center;">Bottom-Left Corner</div>
                          </v-col>
                          <v-col style="flex-grow:2">
                            <v-btn style="font-size:2rem;" @click="removeToolFromFavorites(3, bottomLeftSelectedIndex)">-</v-btn>
                          </v-col>
                        </v-card-title>
                        <v-card-text style="height:100%">
                          <v-list style="max-height:70%; overflow-y: auto">
                            <v-list-item-group v-model="bottomLeftSelectedIndex">
                              <v-list-item v-for="(item, j) in displayedFavoriteTools[3]" :key="j" :disabled="item.disabled">
                                <v-list-item-icon>
                                  <v-icon v-text="item.icon"></v-icon>
                                </v-list-item-icon>
                                <v-list-item-content>
                                  <v-list-item-title v-html="$t('buttons.' + item.displayedName )"></v-list-item-title>
                                </v-list-item-content>
                              </v-list-item>
                            </v-list-item-group>
                          </v-list>
                        </v-card-text>
                      </v-card>
                    </v-row>
                  </v-col>
                  <v-col style="height:95%; flex-grow:2"></v-col>
                  <!-- Top-Right and Bottom-Right Corners -->
                  <v-col style="height:95%; flex-grow:24">
                    <!-- Top-Right Corner -->
                    <v-row style="height:50%; align-items:flex-start; justify-content:center">
                      <v-card style="height:95%; width:100%; flex-basis:auto">
                        <v-card-title style="justify-content:center; flex-wrap:nowrap; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                          <v-col style="flex-grow:2">
                            <v-btn style="font-size:2rem;" @click="addToolToFavorites(1, allListSelectedIndex)">+</v-btn>
                          </v-col>
                          <v-col style="flex-grow:8;">
                            <div style="text-align:center; align-self:center;">Top-Right Corner</div>
                          </v-col>
                          <v-col style="flex-grow:2">
                            <v-btn style="font-size:2rem;" @click="removeToolFromFavorites(1, topRightSelectedIndex)">-</v-btn>
                          </v-col>
                        </v-card-title>
                        <v-card-text style="height:100%">
                          <v-list style="max-height:70%; overflow-y: auto">
                            <v-list-item-group v-model="topRightSelectedIndex">
                              <v-list-item v-for="(item, j) in displayedFavoriteTools[1]" :key="j" :disabled="item.disabled">
                                <v-list-item-icon>
                                  <v-icon v-text="item.icon"></v-icon>
                                </v-list-item-icon>
                                <v-list-item-content>
                                  <v-list-item-title v-html="$t('buttons.' + item.displayedName )"></v-list-item-title>
                                </v-list-item-content>
                              </v-list-item>
                            </v-list-item-group>
                          </v-list>
                        </v-card-text>
                      </v-card>
                    </v-row>
                    <!-- Bottom-Right Corner -->
                    <v-row style="height:50%; align-items:flex-start; justify-content:center">
                      <v-card style="height:100%; width:100%; flex-basis:auto">
                        <v-card-title style="justify-content:center; flex-wrap:nowrap; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                          <v-col style="flex-grow:2">
                            <v-btn style="font-size:2rem;" @click="addToolToFavorites(2, allListSelectedIndex)">+</v-btn>
                          </v-col>
                          <v-col style="flex-grow:8;">
                            <div style="text-align:center; align-self:center;">Bottom-Right Corner</div>
                          </v-col>
                          <v-col style="flex-grow:2">
                            <v-btn style="font-size:2rem;" @click="removeToolFromFavorites(2, bottomLeftSelectedIndex)">-</v-btn>
                          </v-col>
                        </v-card-title>
                        <v-card-text style="height:100%">
                          <v-list style="max-height:70%; overflow-y: auto">
                            <v-list-item-group v-model="bottomRightSelectedIndex">
                              <v-list-item v-for="(item, j) in displayedFavoriteTools[2]" :key="j" :disabled="item.disabled">
                                <v-list-item-icon>
                                  <v-icon v-text="item.icon"></v-icon>
                                </v-list-item-icon>
                                <v-list-item-content>
                                  <v-list-item-title v-html="$t('buttons.' + item.displayedName )"></v-list-item-title>
                                </v-list-item-content>
                              </v-list-item>
                            </v-list-item-group>
                          </v-list>
                        </v-card-text>
                      </v-card>
                    </v-row>
                  </v-col>
                  <v-col style="height:95%; flex-grow:1"></v-col>
                </v-row>
              </v-container>

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
  maxFavoriteToolsLimit = 6;
  // The user's actual favorite tools
  userFavoriteTools: FavoriteTool[][] = [[], [], [], []];
  // The displayed favorite tools (includes defaults)
  displayedFavoriteTools: FavoriteTool[][] = [[], [], [], []];
  // TODO: Look at notes to realize how much extra work there is because someone didn't
  //       define the quick tools in toolgroups.ts as ToolButtons but instead as their own type
  defaultToolNames = [
    [],
    [],
    ["zoomIn", "zoomOut", "zoomFit"],
    []
  ]
  allToolsList: FavoriteTool[] = [];
  userRole = "Community Member";
  selectedTab = null;
  authSubscription!: Unsubscribe;
  profileEnabled = false;
  // If we don't initialize these values HERE (apparently we can't at the top of the class), vue throws hands
  topLeftSelectedIndex: number | null = null;
  bottomLeftSelectedIndex:  number | null = null;
  topRightSelectedIndex?:  number | null = null;
  bottomRightSelectedIndex?:  number | null = null;
  allListSelectedIndex?:  number | null = null;

  get userUid(): string | undefined {
    return this.$appAuth.currentUser?.uid;
  }

  mounted(): void {
    // var test = LocaleMessages.get("buttons")
    // import VueI18n, {LocaleMessages} from "vue-i18n"
    /** Notes for the devs:
     * Things to do:
     *
     * We should probably refactor ShortcutIcon.vue so that it inherits from ToolButton instead of being its own type,
     * then move the buttons that are ONLY DEFINED IN EASEL.VUE BECAUSE WHY WOULD WE DEFINE THEM IN TOOLGROUPS.TS THAT
     * WOULD MAKE TOO MUCH SENSE so that we can reference them in Settings.vue and Easel.vue when adding the default
     * tools to the favorites list.
     *
     * Check if we need to be copying objects into the lists. Was running into issues where setting disabled on a tool
     * in one list after adding it to another caused the value to change in both lists
     *
     * Need to figure out how to make the selected v-list-item-group not be selected anymore, so we don't need to set
     * each selectedIndex to undefined when adding/removing from lists
     *
     * Need to figure out how to prevent everything from looking horrible when zooming in. Right now this is the
     * lowest priority.
     *
     */

    // Sets up the master list of tools and displayedFavoriteTools
    this.initializeToolLists();

    this.$appDB
      .collection("users")
      .doc(this.userUid)
      .get()
      .then((ds: DocumentSnapshot) => {
        if (ds.exists) {
          const uProfile = ds.data() as UserProfile;
          console.log("From Firestore", uProfile);
          this.userDisplayName = uProfile.displayName ?? "N/A";
          this.userLocation = uProfile.location ?? "N/A";
          // Sets up the userFavoriteTools list
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
          this.userFavoriteTools = [[],[],[],[]];
        }
        // console.log("Auth changed", u, this.profileEnabled);
      }
    );
  }
  initializeToolLists(): void {
    // Reasoning for having a displayedFavoriteTools and userFavoriteTools lists:
    // We might need to have two lists. One that is used for displaying and one that is the actual favorites list
    // This is because if we add the defaults to the userFavoriteToolsList, then the encode method will add those
    // defaults to firebase.

    // TODO: We need to move all the tool definitions to tooldictionary.ts
    //       tooldictionary is a dictionary that holds all tool definitions. We index it by ActionMode
    //       toolgroups.ts will reference this dictionary for each tool in a given group
    //       ShortcutIcon.vue is a hole different beast that we will need to tackle next week after
    //       we talk to Dr. Dulimarta and Dr. Dickinson
    // Create a dictionary with actionModeValues as the keys, and references to the tool definition.

    // Set up master list of all tools for favorites selection
    let compList = toolGroups.map(group => group.children.map(child => ({
      actionModeValue: child.actionModeValue,
      displayedName: child.displayedName,
      icon: child.icon,
      disabled: false,
      langName: this.$t("buttons." + child.displayedName)
    }))).reduce((acc, val) => acc.concat(val), []);

    // Sort the temp List
    compList.sort((a, b) => a.langName < b.langName ? -1 : a.langName > b.langName ? 1 : 0);

    // Redefine the allToolsList
    this.allToolsList = compList.map(tool => ({
      actionModeValue: tool.actionModeValue,
      displayedName: tool.displayedName,
      icon: tool.icon,
      disabled: false
    }))

    console.log("this.defaultToolNames: " + this.defaultToolNames);

    // Add default tools to displayedFavoriteTools
    for (let i = 0; i < this.defaultToolNames.length; i++) {
      for (let j = 0; j < this.defaultToolNames[i].length; j++) {
        let temp_tool = this.allToolsList.filter(tl => this.defaultToolNames[i][j] === tl.actionModeValue);
        if (temp_tool.length > 0) {
          let tool = Object.assign({}, temp_tool[0]);
          tool.disabled = true;
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
      // Yes this is way less efficient, but we need to keep the order of the tools. Use this till better solution
      let temp_corner: FavoriteTool[] = [];
      for (const tool of corner) {
        // Filter will always return a list, even though there will only ever be one match
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
        // TODO: Created a copy of the object, not sure if this is needed. Trying to avoid pass by reference issues
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
  addToolToFavorites(corner: number, index: number | null): void {
    if (index === null) return;
    if (this.displayedFavoriteTools[corner].length >= this.maxFavoriteToolsLimit) return;
    // Add the tool at allTools[index] into the corresponding corner of the user's favorite tools
    // TODO: Created a copy of the object, not sure if this is needed. Trying to avoid pass by reference issues
    this.userFavoriteTools[corner].push(Object.assign({}, this.allToolsList[index]));
    // TODO: Created a copy of the object, not sure if this is needed. Trying to avoid pass by reference issues
    this.displayedFavoriteTools[corner].push(Object.assign({}, this.allToolsList[index]));
    // Set the tool in allToolsList to disable
    this.allToolsList[index].disabled = true;
    // Set the displayed tool to not be disabled
    this.displayedFavoriteTools[corner][this.displayedFavoriteTools[corner].length - 1].disabled = false;
    // TODO: Re-figure out how to make the selected v-list-item-group not be selected anymore so we don't need this
    //       I literally had this figured out and completely forgot it :|
    // Deselect the tool in allToolsList (Prevents duplicates)
    this.allListSelectedIndex = null;
  }
  removeToolFromFavorites(corner: number, index: number | null): void {
    if (index === null) return;
    // Get the tool name to make focusable again
    let toolName = this.displayedFavoriteTools[corner][index].actionModeValue;
    // Need to get the index for the item in userFavoriteTools
    let indexDelta = this.displayedFavoriteTools[corner].length - this.userFavoriteTools[corner].length;
    let userFavoriteToolsIndex = index - indexDelta;
    this.userFavoriteTools[corner].splice(userFavoriteToolsIndex, 1);
    this.displayedFavoriteTools[corner].splice(index, 1);
    // Set the corresponding tool to focusable again
    let allToolsListIndex = this.allToolsList.findIndex(tool => tool.actionModeValue === toolName);
    this.allToolsList[allToolsListIndex].disabled = false;
    // TODO: Re-figure out how to make the selected v-list-item-group not be selected anymore so we don't need this
    // Deselect the tool in the corresponding corner (Prevents duplicates)
    switch (corner) {
      case 0:
        this.topLeftSelectedIndex = null;
        break;
      case 1:
        this.topRightSelectedIndex = null;
        break;
      case 2:
        this.bottomRightSelectedIndex = null;
        break;
      case 3:
        this.bottomLeftSelectedIndex = null;
        break;
    }
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
