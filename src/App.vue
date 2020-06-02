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
      <v-app-bar-nav-icon></v-app-bar-nav-icon>

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

      <!-- This will open up the global settings view setting the language, decimals 
      display and other global options-->
      <router-link to="/settings">
        <v-icon>mdi-cog</v-icon>
      </router-link>
    </v-app-bar>

    <!-- 
      This is the main window of the app. All other components are display on top of this element
      The router controls this background and it can be Easel or settings or...
    -->
    <v-content>
      <router-view>
        <!-- this is the spot where the views controlled by Vue Router will be rendred -->
      </router-view>
    </v-content>
    <v-footer app color="accent" padless>
      <v-col class="text-center">Footer text here</v-col>
    </v-footer>
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

/* This allows for the State of the app to be initialized with in vuex store */
/* TODO: What does this do? */
import { WebGLRenderer, Mesh } from "three";
import { State } from "vuex-class";

/* This view has no (sub)components (but the Easel view does) so this is empty*/
@Component
export default class App extends Vue {
  /* The canvasElement containing each of the views */
  // private canvas: HTMLCanvasElement;

  /* I think that this initializes the State variable. To start the command based paradigm of
  mostifing the State??? */
  // @State
  // private sphere!: Mesh;
  constructor() {
    super();
    // this.canvas = this.renderer.domElement;
  }
  mounted() {
    // this.$store.commit('init');
    // Command.setStore(this.$store);
  }
}
</script>
