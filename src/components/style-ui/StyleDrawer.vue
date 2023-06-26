<template>
  <div class="vertical-nav-drawer">
    <LabelStyle :panel="StyleEditPanels.Label"></LabelStyle>
    <FrontBackStyle :panel="StyleEditPanels.Front"></FrontBackStyle>
    <FrontBackStyle :panel="StyleEditPanels.Back"></FrontBackStyle>

    <div id="visibility-control">
      <span>
        {{ t("label") }}
        <v-icon>mdi-eye</v-icon>
      </span>
      <span>
        {{ t("object") }}
        <v-icon>mdi-eye</v-icon>
      </span>
    </div>
  </div>
</template>
<i18n lang="json">
{
  "en": {
    "label": "Label",
    "object": "Object"
  },
  "id": {
    "label": "Label",
    "object": "Objek"
  }
}
</i18n>
<style scoped>
.vertical-nav-drawer {
  height: 90vh;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
}

#visibility-control {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
<script setup lang="ts">
import { StyleEditPanels } from "@/types/Styles";
import LabelStyle from "./LabelStyle.vue";
import FrontBackStyle from "./FrontBackStyle.vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
</script>
