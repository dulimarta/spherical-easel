<template>
  <v-app app>
    <v-navigation-drawer app clipped permanent>
      <v-container>
        <span>Basic Tools</span>
        <v-btn-toggle v-model="editMode" @change="switchEditMode">
          <v-btn value="none">
            <v-icon>mdi-cursor-pointer</v-icon>
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
        <span>Key Shortcut</span>
        <ul>
          <li>"R": reset sphere orientation</li>
        </ul>
      </v-container>
    </v-navigation-drawer>
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
import Vue from 'vue';
import Easel from "./components/Easel.vue"
export default Vue.extend({
  name: 'App',

  components: {
    Easel
  },

  data: () => ({
    editMode: "none"
    //
  }),
  methods: {
    switchEditMode() {
      this.$store.commit('setEditMode', this.editMode);
    }
  }
});
</script>
