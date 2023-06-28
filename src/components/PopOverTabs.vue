<template>
  <!-- Add 40-pixel offset so the menu box does not overlap the navigation drawer -->
  <v-menu
    v-model="menu"
    location="start"
    :close-on-content-click="false"
    :offset="40">
    <template #activator="{ props: menu }">
      <v-tooltip :location="tooltipLocation">
        <template #activator="{ props: tooltip }">
          <v-icon v-bind="mergeProps(menu, tooltip)" :icon="iconName"></v-icon>
        </template>
        <span>{{tooltip}}</span>
      </v-tooltip>
    </template>
    <v-sheet class="bg-white">
      <v-tabs v-model="currentTab">
        <slot name="tabs"></slot>
        <!-- we assume this value will not be used-->
        <v-tab :value="LAST_TAB_MARKER">
          <v-icon @click="menu = false">mdi-chevron-double-right</v-icon>
        </v-tab>
      </v-tabs>
      <v-window v-model="currentTab">
        <slot name="pages"></slot>
      </v-window>
      <slot></slot>
    </v-sheet>
  </v-menu>
</template>
<script lang="ts" setup>
import { mergeProps } from "vue";
import { ref, watch } from "vue";
type Props = {
  iconName: string;
  tooltip: string;
  tooltipLocation: 'left' | 'right' | 'top' | 'bottom'
};
const props = defineProps<Props>();
const LAST_TAB_MARKER = 99999;
const currentTab = ref(0);
const menu = ref(false);
watch(
  () => currentTab.value,
  (tab: number) => {
    menu.value = tab !== LAST_TAB_MARKER;
  }
);
</script>
