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
    <v-app-bar app color="primary" dark clipped-left clipped-right>
      <!-- This is where the file and export (to EPS, TIKZ, GIF?) operations will go -->
      <v-app-bar-nav-icon></v-app-bar-nav-icon>
      <div class="d-flex align-center">
        <v-img
          alt="Spherical Easel Logo"
          class="shrink mr-2"
          contain
          src="./assets/SphericalEaselLogo.gif"
          transition="scale-transition"
          width="40"
        />Spherical Easel 2.0
      </div>

      <v-spacer></v-spacer>
      <!-- This will open up the settings ?drawer ?window for setting the language, decimals 
      display and other global options-->
      <v-btn icon>
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
      this means that when the expression 'leftDrawerMinified' changes the attribute 'mini-varient' 
      will update.
    -->
    <v-navigation-drawer
      app
      clipped
      permanent
      bottom
      color="accent"
      :mini-variant="leftDrawerMinified"
    >
      <v-container fluid v-if="!leftDrawerMinified" class="ma-0 pa-0">
        <v-tabs v-model="activeLeftDrawerTab">
          <v-container fluid class="ma-0 pa-0">
            <v-row class="ma-0 pa-0">
              <v-col class="ma-0 pa-0">
                <v-row align="start" justify="start">
                  <v-btn
                    class="mt-2 pa-0 ml-3"
                    icon
                    @click="leftDrawerMinified = !leftDrawerMinified"
                  >
                    <v-icon>mdi-arrow-left</v-icon>
                  </v-btn>
                  <v-tab class="tabs-margin-padding" :href="`#toolListTab`">
                    <v-icon left>mdi-calculator</v-icon>
                  </v-tab>
                  <v-tab class="tabs-margin-padding" :href="`#objectListTab`">
                    <v-icon left>mdi-format-list-bulleted</v-icon>
                  </v-tab>
                </v-row>
              </v-col>
            </v-row>
          </v-container>
          <v-tabs-items v-model="activeLeftDrawerTab">
            <v-tab-item :value="`toolListTab`">
              <v-container fluid>
                <div class="ml-2" style="height:100%;">
                  <h3 class="body-1 font-weight-bold">Basic Tools</h3>
                  <v-btn-toggle
                    v-model="editMode"
                    @change="switchEditMode"
                    class="mr-2"
                    v-bind:style="{ flexDirection: leftDrawerMinified ? 'column' : 'row' }"
                  >
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
                    v-bind:style="{ flexDirection: leftDrawerMinified ? 'column' : 'row' }"
                  >
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
                  <div v-show="!leftDrawerMinified">
                    <h3 class="body-1 font-weight-bold">Key Shortcut</h3>
                    <ul>
                      <li>"R": reset sphere orientation</li>
                    </ul>
                  </div>
                </div>
              </v-container>
            </v-tab-item>

            <v-tab-item :value="`objectListTab`">
              <v-card flat>
                <ObjectTree :scene="sphere" />
              </v-card>
            </v-tab-item>
          </v-tabs-items>
        </v-tabs>
      </v-container>

      <v-container fluid v-else style="height: 100%;">
        <v-row align="start" no-gutters style="height: 1%;">
          <v-col>
            <v-btn icon @click="leftDrawerMinified = !leftDrawerMinified">
              <v-icon>mdi-arrow-right</v-icon>
            </v-btn>
          </v-col>
        </v-row>
        <v-row align="center" no-gutters style="height: 100%;">
          <v-col>
            <v-btn
              icon
              @click="leftDrawerMinified = !leftDrawerMinified; activeLeftDrawerTab = 'toolListTab'"
            >
              <v-icon>mdi-calculator</v-icon>
            </v-btn>
            <v-btn
              icon
              @click="leftDrawerMinified = !leftDrawerMinified; activeLeftDrawerTab = 'objectListTab'"
            >
              <v-icon>mdi-format-list-bulleted</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-navigation-drawer>

    <!-- 
      This component is the "right drawer". Eventually I want this to contain access to the
      tools that will format the objects and when minimized it will be hidden and 
      inaccessible.
    -->
    <!-- <v-navigation-drawer app permanent right clipped>
      <ObjectTree :scene="sphere" />
    </v-navigation-drawer>-->

    <!-- 
      This is the main window of the app. All other components are display on top of this element
    -->
    <v-content>
      <Easel></Easel>
    </v-content>
  </v-app>
</template>

<!-- 
  script is code for binding the output of the user actions to desired changes
  in the display (not sure) 
-->
<script lang="ts">
import Vue from "vue";
import Easel from "@/components/Easel.vue";
import ObjectTree from "@/components/ObjectTree.vue";
import { Command } from "@/commands/Comnand";
import { mapState } from "vuex";

/*
  This is command is simlar to the 'var App = new Vue (args)' command, but it is 
  better for some reason that I don't understand yet.  
*/
export default Vue.extend({
  name: "App",

  components: {
    Easel,
    ObjectTree
  },

  data: () => ({
    editMode: "none",
    leftDrawerMinified: false,
    activeLeftDrawerTab: "toolListTab"
  }),
  computed: {
    ...mapState(["sphere"])
  },
  methods: {
    switchEditMode() {
      this.$store.commit("setEditMode", this.editMode);
    },
    undoEdit() {
      Command.undo();
    },
    redoAction() {
      Command.redo();
    }
    // cantUndo() { return Command.canUndo() === false },
    // cantRedo: () => !Command.canRedo(),
  },
  mounted() {
    // this.$store.commit('init');
    // Command.setStore(this.$store);
  }
});
</script>

<style lang="scss" scoped>
/* I removed the use of the style for the left drawer of this because it messed with the spacing of the 
tabs in the notMinified contains and the placement of the buttons in the minified container */
#leftDrawer {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  :last-child {
    align-self: flex-end;
  }
}

//Where is this style used?
.v-btn-toggle {
  flex-wrap: wrap;
}

.tabs-margin-padding {
  padding: 0px 0px 0px 0px;
  margin: 12px 0px 0px 0px;
}
</style>
