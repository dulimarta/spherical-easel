<template>
  <v-expansion-panels
    eager
    :modelValue="model"
    :multiple="openMultiple"
    :style="{
      gap: '10px',
      paddingRight: '8px',
      paddingLeft: '8px',
      marginTop: searchResult.length > 0 ? '24px' : '0px'
    }">
    <!-- Private Constructions Panel -->
    <v-expansion-panel
      data-testid="privatePanel"
      value="private"
      v-if="
        filteredPrivateConstructions && filteredPrivateConstructions.length > 0
      ">
      <v-expansion-panel-title>
        {{ t("privateConstructions") }} ({{
          filteredPrivateConstructions.length
        }})
      </v-expansion-panel-title>
      <v-expansion-panel-text data-testid="privateList">
        <ConstructionList
          :items="filteredPrivateConstructions"
          :allow-sharing="true" />
      </v-expansion-panel-text>
    </v-expansion-panel>

    <!-- Starred Constructions Panel -->
    <v-expansion-panel
      value="starred"
      v-if="
        filteredStarredConstructions && filteredStarredConstructions.length > 0
      ">
      <v-expansion-panel-title>
        {{ t("starredConstructions") }} ({{
          filteredStarredConstructions.length
        }})
      </v-expansion-panel-title>
      <v-expansion-panel-text>
        <ConstructionList
          :items="filteredStarredConstructions"
          :allow-sharing="false" />
      </v-expansion-panel-text>
    </v-expansion-panel>

    <!-- Public Constructions Panel -->
    <v-expansion-panel
      value="public"
      v-if="
        filteredPublicConstructions && filteredPublicConstructions.length > 0
      ">
      <v-expansion-panel-title>
        {{ t("publicConstructions") }} ({{
          filteredPublicConstructions.length
        }})
      </v-expansion-panel-title>
      <v-expansion-panel-text>
        <ConstructionList
          :items="filteredPublicConstructions"
          :allow-sharing="false" />
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts" setup>
import { defineProps } from "vue";
import { SphericalConstruction } from "@/types/ConstructionTypes";
import { useI18n } from "vue-i18n";
import ConstructionList from "./ConstructionList.vue";

// Get the translation function
const { t } = useI18n();

// Define props for the component
const props = defineProps({
  model: {
    type: String,
    required: true
  },
  filteredPrivateConstructions: {
    type: Array as () => SphericalConstruction[] | undefined,
    required: true
  },
  filteredStarredConstructions: {
    type: Array as () => SphericalConstruction[] | undefined,
    required: true
  },
  filteredPublicConstructions: {
    type: Array as () => SphericalConstruction[] | undefined,
    required: true
  },
  openPanels: {
    type: Array,
    required: true
  },
  openMultiple: {
    type: Boolean,
    required: true
  },
  searchResult: {
    type: String,
    required: true
  }
});
</script>
<i18n locale="en" lang="json">
{
  "privateConstructions": "Private Constructions",
  "publicConstructions": "Public Constructions",
  "starredConstructions": "Starred Constructions"
}
</i18n>
