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
      <v-app-bar-nav-icon @click="fileSystemsDrawerDisplay = true"></v-app-bar-nav-icon>
      <div class="d-flex align-center">
        <router-link to="/">
          <v-img
            alt="Spherical Easel Logo"
            class="shrink mr-2"
            contain
            src="./assets/SphericalEaselLogo.gif"
            transition="scale-transition"
            width="40"
          />
        </router-link>
        <v-toolbar-title>{{ $t('message.main.SphericalEaselMainTitle') }}</v-toolbar-title>
      </div>

      <v-spacer></v-spacer>
      <!-- This is where the file and export (to EPS, TIKZ, animated GIF?) operations will go 
      Also request a feature and report a bug-->
      <!-- This will open up the settings ?drawer ?window for setting the language, decimals 
      display and other global options-->
      <!-- <v-btn icon @click="globalSettingsDrawerDisplay=true">{{language}}</v-btn> -->
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
    <v-navigation-drawer
      id="leftDrawer"
      app
      clipped
      color="accent"
      permanent
      :mini-variant="leftDrawerMinified"
      width="300px"
    >
      <v-container id="leftnav" fluid>
        <div>
          <v-btn icon @click="leftDrawerMinified = !leftDrawerMinified;">
            <v-icon v-if="leftDrawerMinified">mdi-arrow-right</v-icon>
            <v-icon v-else>mdi-arrow-left</v-icon>
          </v-btn>
        </div>
        <div v-if="!leftDrawerMinified">
          <v-tabs v-model="activeLeftDrawerTab" grow centered>
            <v-tooltip bottom :open-delay="toolTipOpenDelay" :close-delay="toolTipCloseDelay">
              <template v-slot:activator="{ on }">
                <v-tab class="tabs-margin-padding" href="#toolListTab" v-on="on">
                  <v-icon left>mdi-calculator</v-icon>
                </v-tab>
              </template>
              <span>{{ $t('message.main.ToolsTabToolTip') }}</span>
            </v-tooltip>

            <v-tooltip bottom :open-delay="toolTipOpenDelay" :close-delay="toolTipCloseDelay">
              <template v-slot:activator="{ on }">
                <v-tab class="tabs-margin-padding" href="#objectListTab" v-on="on">
                  <v-icon left>mdi-format-list-bulleted</v-icon>
                </v-tab>
              </template>
              <span>{{ $t('message.main.ObjectsTabToolTip') }}</span>
            </v-tooltip>

            <v-tab-item value="toolListTab">
              <ToolButtons></ToolButtons>
            </v-tab-item>
            <v-tab-item value="objectListTab">
              <ObjectTree :scene="sphere"></ObjectTree>
            </v-tab-item>
          </v-tabs>
        </div>
      </v-container>
      <div id="leftnavicons" v-if="leftDrawerMinified" @click="unMinifyLeftDrawer">
        <v-btn
          icon
          @click="leftDrawerMinified = !leftDrawerMinified; activeLeftDrawerTab='toolListTab'"
        >
          <v-icon class="ml-3 my-2">mdi-calculator</v-icon>
        </v-btn>
        <v-btn
          icon
          @click="leftDrawerMinified = !leftDrawerMinified; activeLeftDrawerTab='objectListTab'"
        >
          <v-icon class="ml-3 my-2">mdi-format-list-bulleted</v-icon>
        </v-btn>
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

    <!-- 
      This is the main window of the app. All other components are display on top of this element
      The router controls this background and it can be Easel or settings or...
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
import ToolButtons from "@/components/ToolButtons.vue";
//import { Command } from "@/commands/Comnand";
// import { mapState } from "vuex";
import { WebGLRenderer, Mesh } from "three";
import Component from "vue-class-component";
import { Inject } from "vue-property-decorator";
import { State } from "vuex-class";
import SETTINGS from "@/global-settings";

@Component({
  components: { Easel, ObjectTree, ToolButtons }
})
export default class App extends Vue {
  private leftDrawerMinified = false;
  private activeLeftDrawerTab = "toolListTab";
  private fileSystemsDrawerDisplay = false;
  private globalSettingsDrawerDisplay = false;

  private group = "";
  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;
  private snackbar = false;

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

  showSettingsView() {
    /* force left drawer to minify
    I would like it to be either not displayed or to be disabled so all buttons don't work*/
    this.leftDrawerMinified = true;
    this.$router.push({ path: "/settings" });
  }

  /*  
   This allows the user to maximumize the left drawer by clicking in the navigation drawer
  'leftDrawerMinified = !leftDrawerMinified' doesn't work because when you click on the icons
   in the minified left drawer they first unMinify the drawer and
   then 'leftDrawerMinified = !leftDrawerMinified' would reminify it and nothing happens 
   */
  unMinifyLeftDrawer() {
    if (this.leftDrawerMinified) {
      this.leftDrawerMinified = false;
    }
  }
  log(item: any) {
    console.log(item);
  }
  /*   undoEdit() {
    Command.undo();
  }
  redoAction() {
    Command.redo();
  } */
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
toolTipDelays {
  opendelay: 500;
  closedelay: 2000;
}

.tabs-margin-padding {
  padding: 0px 0px 0px 0px;
  margin: 12px 0px 0px 0px;
}
</style>