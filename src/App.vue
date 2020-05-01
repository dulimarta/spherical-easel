<template>
  <v-app app>
    <!--  Use the "cliopped" attribute to keep the navigation drawer 
    below the app toolbar-->
    <v-navigation-drawer app clipped permanent color="accent" width="320">
      <!-- pa-4: padding all 16px -->
      <v-container class="pa-4">
        <div class="body-1 font-weight-bold">Basic Tools</div>
        <!-- mr-2: margin right 8 px -->
        <v-btn-toggle v-model="editMode" @change="switchEditMode" class="mr-2">
          <v-btn value="none">
            <v-icon>mdi-cursor-pointer</v-icon>
          </v-btn>
          <v-btn value="move">
            <v-icon>mdi-cursor-move</v-icon>
          </v-btn>
          <v-btn value="point">
            <v-icon>mdi-vector-point</v-icon>
          </v-btn>
          <v-btn value="line">
            <v-icon>mdi-vector-line</v-icon>
          </v-btn>
          <v-btn value="segment">
            <v-icon>mdi-vector-radius</v-icon>
          </v-btn>
          <v-btn value="circle">
            <v-icon>mdi-vector-circle-variant</v-icon>
          </v-btn>
        </v-btn-toggle>
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
        <v-img
          alt="Vuetify Logo"
          class="shrink mr-2"
          contain
          src="https://cdn.vuetifyjs.com/images/logos/vuetify-logo-dark.png"
          transition="scale-transition"
          width="40"
        />

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
import Easel from "./components/Easel.vue";
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
    }
  }
});
</script>
