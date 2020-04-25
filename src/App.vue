<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <div class="d-flex align-center">
        <v-img alt="Vuetify Logo" class="shrink mr-2" contain
          src="https://cdn.vuetifyjs.com/images/logos/vuetify-logo-dark.png"
          transition="scale-transition" width="40" />

        <!--v-img alt="Vuetify Name" class="shrink mt-1 hidden-sm-and-down"
          contain min-width="100"
          src="https://cdn.vuetifyjs.com/images/logos/vuetify-name-dark.png"
          width="100" /-->
        Spherical Geometry
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
    //
  }),
});
</script>
