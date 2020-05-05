<template>
  <v-app app>
    <!--  Use the "cliopped" attribute to keep the navigation drawer 
    below the app toolbar-->
    <v-navigation-drawer app clipped permanent color="accent" width="320">
      <!-- pa-4: padding all 16px -->
      <v-container class="pa-4">
        <div class="body-1 font-weight-bold">Basic Tools</div>
        <!-- mr-2: margin right 8 px -->
        <v-btn-toggle v-model="editMode" @change="switchEditMode"
          class="mr-2">
          <v-btn value="none">
            <v-icon>mdi-cursor-pointer</v-icon>
          </v-btn>
          <v-tooltip bottom>
            <template v-slot:activator={on}>
              <v-btn value="move" v-on="on">
                <v-icon>mdi-cursor-move</v-icon>
              </v-btn>
            </template>
            <span>Move object</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator={on}>
              <v-btn value="point" v-on="on">
                <v-icon>mdi-vector-point</v-icon>
              </v-btn>
            </template>
            <span>Insert point</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator={on}>
              <v-btn value="line" v-on="on">
                <v-icon>mdi-vector-line</v-icon>
              </v-btn>
            </template>
            <span>Insert line</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator={on}>
              <v-btn value="segment" v-on="on">
                <v-icon>mdi-vector-radius</v-icon>
              </v-btn>
            </template>
            <span>Insert segment</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator={on}>
              <v-btn value="circle" v-on="on">
                <v-icon>mdi-vector-circle-variant</v-icon>
              </v-btn>
            </template>
            <span>Insert circle</span>
          </v-tooltip>
        </v-btn-toggle>
        <v-tooltip bottom>
          <template v-slot:activator={on}>
            <v-btn @click="undoEdit" v-on="on">
              <v-icon>mdi-undo</v-icon>
            </v-btn>
          </template>
          <span>Undo last action</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template v-slot:activator={on}>
            <v-btn @click="redoAction" v-on="on">
              <v-icon>mdi-redo</v-icon>
            </v-btn>
          </template>
          <span>Redo action</span>
        </v-tooltip>
        <div class="body-1 font-weight-bold">Key Shortcut</div>
        <ul>
          <li>"R": reset sphere orientation</li>
        </ul>
      </v-container>
    </v-navigation-drawer>
    <!-- the "clipped-left" attribute works together with 
    the "clipped" attr of the nav drawer -->
    <v-app-bar app color="primary" dark clipped-left>
      <div class="d-flex align-center">
        <v-img alt="Vuetify Logo" class="shrink mr-2" contain
          src="https://cdn.vuetifyjs.com/images/logos/vuetify-logo-dark.png"
          transition="scale-transition" width="40" />

        <!--v-img alt="Vuetify Name" class="shrink mt-1 hidden-sm-and-down"
          contain min-width="100"
          src="https://cdn.vuetifyjs.com/images/logos/vuetify-name-dark.png"
          width="100" /-->
        Spherical Easel 2.0
      </div>

      <v-spacer></v-spacer>
    </v-app-bar>

    <v-content>
      <Easel></Easel>
    </v-content>
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";
import Easel from "@/components/Easel.vue";
import { Command } from "@/commands/Comnand";
export default Vue.extend({
  name: "App",

  components: {
    Easel
  },

  data: () => ({
    editMode: "none"
    //
  }),
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
  },
  mounted() {
    // this.$store.commit('init');
    // Command.setStore(this.$store);
  }
});
</script>
