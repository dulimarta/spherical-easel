<template>
  <div class="vertical-nav-drawer">
    <LabelStyle :panel="StyleEditPanels.Label"></LabelStyle>
    <FrontBackStyle :panel="StyleEditPanels.Front"></FrontBackStyle>
    <FrontBackStyle :panel="StyleEditPanels.Back"></FrontBackStyle>

    <div id="visibility-control">
      <span>
        Label
        <v-icon>mdi-eye</v-icon>
      </span>
      <span>
        Object
        <v-icon>mdi-eye</v-icon>
      </span>
    </div>
  </div>
</template>
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
import PopOverTabs from "../PopOverTabs.vue";
import LabelStyle from "./LabelStyle.vue";
import FrontBackStyle from "./FrontBackStyle.vue";
</script>
