<!-- 
  template is HTML for the layout for the UI of the vue application (i.e. the main
  window with everything in it), it allows for binding with the
  underlying Document Object Model. We can use this template for specifiying
  locations in the document with the "id" class.  
-->

<template>
  <!-- 
    This is the main application that must contain all the vuetify components.
    There can be only one of these environments.
  -->
  <v-app app>

    <v-app-bar app color="primary" dark dense clipped-left clipped-right>
      <v-app-bar-nav-icon @click="fileSystemsDrawerDisplay = true">
      </v-app-bar-nav-icon>
      <div class="d-flex align-center">
        <router-link to="/">
          <v-img alt="Spherical Easel Logo" class="shrink mr-2" contain
            src="./assets/SphericalEaselLogo.gif"
            transition="scale-transition" width="40" />
        </router-link>
        <v-toolbar-title>Spherical Easel 2.0</v-toolbar-title>
      </div>

      <v-spacer></v-spacer>
      <!-- This is where the file and export (to EPS, TIKZ, animated GIF?) operations will go 
      Also request a feature and report a bug-->
      <!-- This will open up the settings ?drawer ?window for setting the language, decimals 
      display and other global options-->
      <v-btn icon @click="globalSettingsDrawerDisplay=true">
        {{currentLanguage}}</v-btn>
      <v-btn icon @click="showSettingsView">
        <v-icon>mdi-cog</v-icon>
      </v-btn>
    </v-app-bar>

    <!--  
      This is the left drawer component that contains that the
      tools and a list of the objects that have been created in two tabs
      
      Use the "clipped" attribute to keep the navigation drawer 
      below the app toolbar
      Use the "bottom" attribute to have this menu appear at the bottom on mobile
      
      The line ":mini-variant="leftDrawerMinified" is shorthand for 
      'v-bind:mini-variant="leftDrawerMinified"'
      this is a bond between the attribute 'mini-varient' (a Vue property of a navigation drawer)
      and the expression 'leftDrawerMinified' (a user name bolean variable)
      this means that when the expression 'leftDrawerMinified' changes the attribute 'mini-variant' 
      will update.
    -->

    <!--  Use the "cliopped" attribute to keep the navigation drawer 
    below the app toolbar-->
    <v-navigation-drawer id="leftDrawer" app clipped color="accent"
      permanent :mini-variant="leftDrawerMinified">
      <v-container id="leftnav" fluid>
        <div>
          <v-btn icon @click="leftDrawerMinified = !leftDrawerMinified">
            <v-icon v-if="leftDrawerMinified">mdi-arrow-right</v-icon>
            <v-icon v-else>mdi-arrow-left</v-icon>
          </v-btn>
        </div>
        <div v-if="!leftDrawerMinified">
          <v-tabs v-model="activeLeftDrawerTab">
            <v-tab class="tabs-margin-padding">
              <v-icon left>mdi-calculator</v-icon>
            </v-tab>
            <v-tab class="tabs-margin-padding">
              <v-icon left>mdi-format-list-bulleted</v-icon>
            </v-tab>

            <v-tab-item>
              <div class="pa-1">
                <h3 class="body-1 font-weight-bold">Basic Tools</h3>
                <!-- Keep the id attribute, it is used for testing --->
                <v-btn-toggle v-model="editMode" @change="switchEditMode"
                  class="mr-2" id="basicTools"
                  v-bind:style="{ flexDirection: leftDrawerMinified ? 'column' : 'row' }">
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on }">
                      <v-btn value="none" v-on="on">
                        <v-icon>mdi-cursor-pointer</v-icon>
                      </v-btn>
                    </template>
                    <span>None</span>
                  </v-tooltip>

                  <v-tooltip bottom>
                    <template v-slot:activator="{ on }">
                      <v-btn value="move" v-on="on">
                        <v-icon>mdi-cursor-move</v-icon>
                      </v-btn>
                    </template>
                    <span>Move object</span>
                  </v-tooltip>
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on }">
                      <v-btn value="point" v-on="on">
                        <v-icon>mdi-vector-point</v-icon>
                      </v-btn>
                    </template>
                    <span>Insert point</span>
                  </v-tooltip>
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on }">
                      <v-btn value="line" v-on="on">
                        <v-icon>mdi-vector-line</v-icon>
                      </v-btn>
                    </template>
                    <span>Insert line</span>
                  </v-tooltip>
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on }">
                      <v-btn value="segment" v-on="on">
                        <v-icon>mdi-vector-radius</v-icon>
                      </v-btn>
                    </template>
                    <span>Insert segment</span>
                  </v-tooltip>
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on }">
                      <v-btn value="circle" v-on="on">
                        <v-icon>mdi-vector-circle-variant</v-icon>
                      </v-btn>
                    </template>
                    <span>Insert circle</span>
                  </v-tooltip>
                </v-btn-toggle>
                <h3 class="body-1 font-weight-bold">Edit Tools</h3>
                <v-btn-toggle
                  v-bind:style="{ flexDirection: leftDrawerMinified ? 'column' : 'row' }">
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on }">
                      <v-btn @click="undoEdit" v-on="on">
                        <v-icon>mdi-undo</v-icon>
                      </v-btn>
                    </template>
                    <span>Undo last action</span>
                  </v-tooltip>
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on }">
                      <v-btn @click="redoAction" v-on="on">
                        <v-icon>mdi-redo</v-icon>
                      </v-btn>
                    </template>
                    <span>Redo action</span>
                  </v-tooltip>
                </v-btn-toggle>
                <div class="ml-2" style="height:100%;">
                  <div v-show="!leftDrawerMinified">
                    <h3 class="body-1 font-weight-bold">Key Shortcut
                    </h3>
                    <ul>
                      <li>"R": reset sphere orientation</li>
                    </ul>
                  </div>
                </div>
              </div>
            </v-tab-item>
            <v-tab-item>
              <!-- 
      This component is the "right drawer". Eventually I want this to contain access to the
      tools that will format the objects and when minimized it will be hidden and 
      inaccessible.
    -->
              <ObjectTree :scene="sphere"></ObjectTree>
            </v-tab-item>
          </v-tabs>
        </div>
      </v-container>
      <div id="leftnavicons" v-if="leftDrawerMinified">
        <v-icon class="my-2">mdi-calculator</v-icon>
        <v-icon class="my-2">mdi-format-list-bulleted</v-icon>
      </div>
    </v-navigation-drawer>
    <!-- This is where the file and export (to EPS, TIKZ, animated GIF?) operations will go 
    Also request a feature and report a big-->
    <!-- TODO: Move this to Easel.vue? --->
    <!--v-navigation-drawer v-model="fileSystemsDrawerDisplay" temporary>
      <v-list nav dense>
        <v-list-item-group v-model="group"
          active-class="deep-purple--text text--accent-4">
          <v-list-item>
            <v-list-item-icon>
              <v-icon>mdi-upload</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Load</v-list-item-title>
          </v-list-item>

          <v-list-item>
            <v-list-item-icon>
              <v-icon>mdi-download</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Save</v-list-item-title>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer-->

    <!-- This will open up the settings ?drawer ?window for setting the language, decimals 
    display and other global options-->
    <!-- TODO: move this to the "Settings.vue" view -->
    <!-- <v-navigation-drawer v-model="globalSettingsDrawerDisplay" right
      absolute temporary width="30%">
      <v-container>
        <v-row>
          <v-col cols="12">
            <p>Select a Language</p>

            <v-select v-model="currentLanguage" class="my-2"
              :items="languages" item-value="currentLanguage"
              :value="currentLanguage"></v-select>
            <p>The current language is {{ currentLanguage }}.</p>
          </v-col>
        </v-row>
      </v-container>
    </v-navigation-drawer> -->

    <!-- 
      This is the main window of the app. All other components are display on top of this element
    -->
    <v-content>
      <router-view>
        <!-- this is the spot where the views controlled by Vue Router will be rendred -->
      </router-view>
    </v-content>
  </v-app>
</template>

<!-- 
  script is code for binding the output of the user actions to desired changes
  in the display (not sure) 
-->
<script lang="ts">
import Vue from "vue";
import ObjectTree from "@/components/ObjectTree.vue";
import { Command } from "@/commands/Comnand";
import { WebGLRenderer, Mesh } from 'three';
import Component from 'vue-class-component';
import { Inject } from 'vue-property-decorator';
import { State } from 'vuex-class';


@Component({
  components: {
    ObjectTree
  }
})
export default class App extends Vue {
  private editMode = "none";
  private leftDrawerMinified = false;
  private activeLeftDrawerTab = null;
  private fileSystemsDrawerDisplay = false;
  private globalSettingsDrawerDisplay = false;
  private languages = ["English", "Klingon"];
  private group = "";
  private currentLanguage = "Klingon";

  // Use dependency injection to let us mock the renderer
  // with a fake implementation during testing
  @Inject()
  private renderer!: WebGLRenderer;

  private canvas: HTMLCanvasElement;

  @State
  private sphere!: Mesh;
  constructor() {
    super();
    this.canvas = this.renderer.domElement;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0xffffff);
  }
  mounted() {
    // this.$store.commit('init');
    // Command.setStore(this.$store);
  }

  switchEditMode() {
    this.$store.commit("setEditMode", this.editMode);
  }
  showSettingsView() {
    /* force left drawer to minity */
    this.leftDrawerMinified = true;
    this.$router.push({ path: "/settings" })
  }

  undoEdit() {
    Command.undo();
  }
  redoAction() {
    Command.redo();
  }
  // cantUndo() { return Command.canUndo() === false },
  // cantRedo: () => !Command.canRedo(),
}

</script>
<style lang="scss" scoped>
/* I removed the use of the style for the left drawer of this because it messed with the spacing of the 
tabs in the notMinified contains and the placement of the buttons in the minified container */

// Where is this style used?
// Override the default behavior of Vuetify <v-btn-toggle> elementv-btn-toggle>
#leftnav {
  display: flex;
  flex-direction: column;

  div:first-child {
    align-self: flex-end;
  }
}
#leftnavicons {
  height: 80vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.v-btn-toggle {
  flex-wrap: wrap;
}

.tabs-margin-padding {
  padding: 0px 0px 0px 0px;
  margin: 12px 0px 0px 0px;
}
</style>