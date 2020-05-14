<template>
  <div id="container">
    <h3 v-t="'settings.title'"></h3>
    <v-container>
      <v-row>
        <v-col cols="auto">
          <v-select v-model="selectedLanguage" outlined :items="languages"
            item-text="name" item-value="locale" label="Language"
            return-object>
          </v-select>
        </v-col>
      </v-row>
      <v-row>
        <v-btn @click="switchLocale">Save</v-btn>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import SETTINGS from "@/global-settings";

export default {
  data() {
    return {
      selectedLanguage: {},
      languages: SETTINGS.supportedLanguages
    };
  },
  methods: {
    switchLocale() {
      this.$i18n.locale = this.selectedLanguage.locale;
    }
  }
};
</script>

<style lang="scss" scoped>
div#container {
  padding: 1rem;
}
</style>