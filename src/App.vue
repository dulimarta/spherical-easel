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

      <!-- 
        This will open up the settings view for setting the language, decimals 
        display and other global options.
      -->
      <v-btn icon @click="showSettingsView">
        <v-icon>mdi-cog</v-icon>
      </v-btn>
    </v-app-bar>

    <!--  
      This is the left drawer component that contains that the
      tools and a list of the objects that have been created in two tabs
      
      The line ":mini-variant="leftDrawerMinified" is shorthand for 
      'v-bind:mini-variant="leftDrawerMinified"'
      this is a bond between the attribute 'mini-varient' (a Vue property of a navigation drawer)
      and the expression 'leftDrawerMinified' (a user name bolean variable)
      this means that when the expression 'leftDrawerMinified' changes the attribute 'mini-variant' 
      will update.

      Use the "clipped" attribute to keep the navigation drawer 
      below the app toolbar, width should be specified as number only (without unit)
    -->
    <v-navigation-drawer
      id="leftDrawer"
      app
      clipped
      color="accent"
      permanent
      :mini-variant="leftDrawerMinified"
      width="300"
    >
      <!-- The container is fluid so that the drawer can dynamically adjust to different screen
      sizes.-->
      <v-container id="leftnav" fluid>
        <!-- 
          This displays the arrows for minimizing and maximaximizing the left draw. Notice the
         two way binding to the variable leftDrawerMinifed
        -->
        <div>
          <v-btn icon @click="leftDrawerMinified = !leftDrawerMinified;">
            <v-icon v-if="leftDrawerMinified">mdi-arrow-right</v-icon>
            <v-icon v-else>mdi-arrow-left</v-icon>
          </v-btn>
        </div>

        <!-- This division is displayed only when the left drawer is *not* minimized -->
        <div v-if="!leftDrawerMinified">
          <!-- These are the two tabes for the left drawer. Notice the two-way binding to the 
          variable activeLeftDrawerTab. This binding allows us to click on the corresponding
          icon in in the minified version and have the appropriate tab be displayed-->
          <v-tabs v-model="activeLeftDrawerTab" grow centered background-color="accent">
            <!-- The tool tab: displayes all the tools that the user has permission to use. Note
            the use of the tooltip slot and the delays of the tooltip are set with the global
            variable SETTINGS.toopTipOpen/CloseDelay.-->
            <v-tooltip bottom :open-delay="toolTipOpenDelay" :close-delay="toolTipCloseDelay">
              <template v-slot:activator="{ on }">
                <v-tab class="mt-3 pa-0" href="#toolListTab" v-on="on">
                  <v-icon left>mdi-calculator</v-icon>
                </v-tab>
              </template>
              <span>{{ $t('message.main.ToolsTabToolTip') }}</span>
            </v-tooltip>

            <!-- The object tab: displayes a list of objects that have been created by the user. 
            Clicking on one gives more information about it and if the editPlotAttritube drawer is
            open, then the user can edit the attritubes of the selected object.-->
            <v-tooltip bottom :open-delay="toolTipOpenDelay" :close-delay="toolTipCloseDelay">
              <template v-slot:activator="{ on }">
                <v-tab class="mt-3 pa-0" href="#objectListTab" v-on="on">
                  <v-icon left>mdi-format-list-bulleted</v-icon>
                </v-tab>
              </template>
              <span>{{ $t('message.main.ObjectsTabToolTip') }}</span>
            </v-tooltip>

            <!-- This creates the contents of the tool tab using the Tool Buttons component -->
            <v-tab-item value="toolListTab">
              <ToolButtons></ToolButtons>
            </v-tab-item>

            <!-- This creates the contents of the object tab using the Object Tree component -->
            <v-tab-item value="objectListTab">
              <ObjectTree :scene="sphere"></ObjectTree>
            </v-tab-item>
          </v-tabs>
        </div>
      </v-container>

      <!-- This division is displayed only when the left drawer is minimized. Note the binding to
      the unMinifyLeftDrawer. This allows the user to click anywhere in this division to 
      unminify the drawer.  unMinifyLeftDrawer is written in such a way that clicking on an
      icon button in the drawer does the icon button and this click event doesn't do anything-->
      <div id="leftnavicons" v-if="leftDrawerMinified" @click="unMinifyLeftDrawer">
        <!-- An icon button that we click to unMinify the leftDrawer and vuew the tool tab -->
        <v-btn
          icon
          @click="leftDrawerMinified = !leftDrawerMinified; activeLeftDrawerTab='toolListTab'"
        >
          <v-icon class="ml-3 my-2">mdi-calculator</v-icon>
        </v-btn>

        <!-- An icon button that we click to unMinify the leftDrawer and vuew the object tab -->
        <v-btn
          icon
          @click="leftDrawerMinified = !leftDrawerMinified; activeLeftDrawerTab='objectListTab'"
        >
          <v-icon class="ml-3 my-2">mdi-format-list-bulleted</v-icon>
        </v-btn>
      </div>
    </v-navigation-drawer>

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
import ObjectTree from "@/components/ObjectTree.vue";
import ToolButtons from "@/components/ToolButtons.vue";

/* TODO: What does this do? */
import { WebGLRenderer, Mesh } from "three";
import { State } from "vuex-class";

/* We must import the special features of a component when using Class-Style Vue Components in TS
(i.e. the special commands with @). So for example in the non-class style there is a form like

Vue.component('blog-post', {
  props: ['title'],
  template: '<h3>{{ title }}</h3>'
})

'props' is a special kind of variable (among many) in a component. We can use 'props' to bind a 
variable in the parent with this variable in the child component). To declare this in a class-sytle
in TypeScript use the form

<template>
<h3>{{ title }}</h3>
</template>
import { Prop } from "vue-property-decorator";
export default class blog-post extends Vue {
 @Prop({ default: null })
title !: string
}

See: https://vuejs.org/v2/guide/components.html and https://vuejs.org/v2/guide/typescript.html*/
import { Inject } from "vue-property-decorator";

/* Import Global Settings */
import SETTINGS from "@/global-settings";

/* The @Component decorator indicates the class is a Vue component */
@Component({
  components: { ObjectTree, ToolButtons }
})
export default class App extends Vue {
  /* Controls the state of the leftDrawer.Bound to several vue elements */
  private leftDrawerMinified = false;
  /* Controls which tab is active. Bound to several vue elements */
  private activeLeftDrawerTab = "toolListTab";

  /* Use the global settings to set the variables bound to the toolTipOpen/CloseDelay */
  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

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

  showSettingsView() {
    /* force left drawer to minify
    TODO: I would like it to be either not displayed or to be disabled so all buttons don't work*/
    this.leftDrawerMinified = true;
    this.$router.push({ path: "/settings" });
  }

  /*  
   This allows the user to maximumize the left drawer by clicking in the navigation drawer. Note:
  'leftDrawerMinified = !leftDrawerMinified' doesn't work because when you click on the icons
   in the minified left drawer they first unMinify the drawer and
   then 'leftDrawerMinified = !leftDrawerMinified' would reminify it and nothing happens 
   */
  unMinifyLeftDrawer() {
    if (this.leftDrawerMinified) {
      this.leftDrawerMinified = false;
    }
  }
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