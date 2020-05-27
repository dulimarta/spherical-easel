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
    <!-- This is the main app bar in the window. Notice the internationalization in the toolbar
    title where $t('key') means that the key should be looked up in the current language file named
    ##.lang.json.-->
    <v-app-bar app color="primary" dark dense clipped-left>
      <!-- This is where the file and export (to EPS, TIKZ, animated GIF?) operations will go 
      Also request a feature and report a bug-->
      <v-app-bar-nav-icon
        @click="fileSystemsDrawerDisplay = true"
      ></v-app-bar-nav-icon>

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
        <v-toolbar-title>
          {{ $t("main.SphericalEaselMainTitle") }}
        </v-toolbar-title>
        <v-tooltip left>
          <template v-slot:activator="{ on }">
            <a href="/docs">
              <v-icon class="ml-2" v-on="on">mdi-help-circle</v-icon>
            </a>
          </template>
          <span>Open Doc</span>
        </v-tooltip>
      </div>

      <v-spacer></v-spacer>
      <!-- This is where the file and export (to EPS, TIKZ, animated GIF?) operations will go 
      Also request a feature and report a bug-->
      <!-- This will open up the settings ?drawer ?window for setting the language, decimals 
      display and other global options-->
      <!-- <v-btn icon @click="globalSettingsDrawerDisplay=true">{{language}}</v-btn> -->
      <router-link to="/settings">
        <v-icon>mdi-cog</v-icon>
      </router-link>
    </v-app-bar>

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
  This section is for Typescript code (note lang="ts") for binding the output of the user 
  actions to desired changes in the display and the rest of the app. 
-->
<script lang="ts">
import Vue from "vue";
/* Import the custom components */
import Component from "vue-class-component";
import { Inject } from "vue-property-decorator";
/* TODO: What does this do? */
import { WebGLRenderer, Mesh } from "three";
import { State } from "vuex-class";

@Component
export default class App extends Vue {
  private fileSystemsDrawerDisplay = false;
  private globalSettingsDrawerDisplay = false;

  // Use dependency injection to let us mock the renderer
  // with a fake implementation during testing
  @Inject()
  private renderer!: WebGLRenderer;

  private canvas: HTMLCanvasElement;

  /* TODO: I'm not sure what this does. */
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

  // log(item: any) {
  //   console.log(item);
  // }
}
</script>
