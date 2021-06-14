<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12"
        sm="6">
        <v-sheet elevation="2"
          class="pa-2">
          <h3>User Profile</h3>
          <div id="profile"
            class="text-body-2">
            <label>Profile image</label>

            <PhotoCapture />
            <label>Display name</label>
            <span>Don Knuth</span>
            <label>Email</label>
            <span>knuthd@mail.com</span>
            <label>Location</label>
            <span>Somewhere, USA</span>
            <label>Role</label>
            <v-select
              :items="['Student', 'Instructor', 'Community Member']">
            </v-select>
          </div>
          <v-btn>Change Password</v-btn>
          <v-btn>Delete Account</v-btn>
        </v-sheet>
      </v-col>
      <v-col cols="12"
        sm="6">
        <v-sheet elevation="2"
          class="pa-2">
          <h3 v-t="'settings.title'"></h3>
          <div id="appSetting">
            <label>Language</label>
            <v-select v-model="selectedLanguage"
              outlined
              :items="languages"
              item-text="name"
              item-value="locale"
              label="Language"
              return-object>
            </v-select>
            <label>Decimal Precision</label>
            <v-radio-group row>
              <v-radio label="3"
                value="3"></v-radio>
              <v-radio label="5"
                value="5"></v-radio>
              <v-radio label="7"
                value="7"></v-radio>
            </v-radio-group>
            <labeL>Selection Precision</labeL>
            <v-radio-group row>
              <v-radio label="Less">Less</v-radio>
              <v-radio label="More">More</v-radio>
            </v-radio-group>
            <h3>Label options</h3><span></span>
            <label>Initial display</label>
            <v-radio-group row>
              <v-radio label="None"></v-radio>
              <v-radio label="All"></v-radio>
              <v-radio label="Default"></v-radio>
            </v-radio-group>
            <span></span>
            <v-checkbox label="Hide objects/labels" />
            <span></span>
            <v-checkbox label="Show objects/labels" />
            <h3>Hints</h3><span></span>
            <span></span>
            <v-checkbox label="Display Tooltips" />
            <span></span>
            <v-checkbox label="Display use messages" />
          </div>
        </v-sheet>
      </v-col>
    </v-row>
    <v-btn @click="switchLocale">Save</v-btn>
  </v-container>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import PhotoCapture from "@/components/PhotoCapture.vue";
import SETTINGS from "@/global-settings";

@Component({ components: { PhotoCapture } })
export default class Settings extends Vue {
  selectedLanguage: unknown = {};
  languages = SETTINGS.supportedLanguages;
  decimalPrecision = 3;
  switchLocale(): void {
    this.$i18n.locale = (this.selectedLanguage as any).locale;
  }
}
</script>

<style lang="scss" scoped>
div#container {
  padding: 1rem;
}

div#profile,
div#appSetting {
  display: grid;
  grid-template-columns: 1fr 3fr;
}
</style>