<template>
  <v-icon id="lang" class="mx-0">mdi-translate</v-icon>
  <v-menu
    activator="#lang"
    v-model="showLocalePopup"
    location="bottom"
    offset="24"
    :close-on-content-click="false">
    <v-card>
      <v-card-title v-t="'selectLanguage'"></v-card-title>
      <v-card-text>
        <v-select :items="availabelLanguages" v-model="$i18n.locale"></v-select>
      </v-card-text>
      <v-card-actions>
        <v-btn variant="outlined" @click="showLocalePopup = false">OK</v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n({useScope: 'local'});
const showLocalePopup = ref(false);
const availabelLanguages = ref([
  { value: "en", title: "🇺🇸 English (US)" },
  { value: "id", title: "🇮🇩 Bahasa Indonesia" }
]);
</script>
<i18n lang="json">
{
  "en": {
    "selectLanguage": "Select Your Language"
  },
  "id": {
    "selectLanguage": "Pilih Bahasa"
  }
}
</i18n>
