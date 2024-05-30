<template>
  <!-- Add 40-pixel offset so the menu box does not overlap the navigation drawer -->
  <!--v-menu
  persistent
    location="start"
    :close-on-content-click="false"
    :offset="40">
    <template-- #activator="{ props: menuProps }">
      <v-tooltip :location="tooltipLocation">
        <template #activator="{ props: tooltip }">
          <v-icon v-bind="mergeProps(menuProps, tooltip)" :icon="iconName"></v-icon>
        </template>
        <span>{{elementProps.tooltip}}</span>
      </v-tooltip>
    </template-->
    <v-sheet class="bg-white" v-if="showPopup && menu" position="fixed" elevation="4"
    :style="{right: '80px'}">

      <v-tabs v-model="currentTab">
        <slot name="tabs"></slot>
        <!-- we assume this value will not be used-->
        <v-spacer/>
        <v-tab :value="LAST_TAB_MARKER">
          {{ name }}
          <v-icon @click="menu = false">mdi-chevron-double-right</v-icon>
        </v-tab>
      </v-tabs>
      <slot name="top"></slot>
      <v-window v-model="currentTab" class="pa-1">
        <slot name="pages"></slot>
      </v-window>
      <slot name="bottom"></slot>
    </v-sheet>
  <!--/--v-menu-->
</template>
<script lang="ts" setup>
import { mergeProps } from "vue";
import { ref, watch } from "vue";
import DisagreementOverride from "./DisagreementOverride.vue";
type Props = {
  showPopup: boolean,
  name?: string,
  // iconName: string;
  // tooltip: string;
  // tooltipLocation: 'left' | 'right' | 'top' | 'bottom',
};
const elementProps = withDefaults(defineProps<Props>(), {
  name: ""
});
const emit = defineEmits(['popUpShown','popUpHidden'])
const LAST_TAB_MARKER = 99999;
const currentTab = ref(0);
const menu = ref(false)
watch(() => elementProps.showPopup, (show) => {
  menu.value = show
  if (show) emit('popUpShown')
  else emit('popUpHidden')
})
watch(() => menu.value, (m) => {
  if (!m) emit('popUpHidden')
})

</script>
