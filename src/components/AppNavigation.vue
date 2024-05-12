<template>
  <!-- These the navigation arrows TODO: I would like these to be in the same row as the
    tabs-->
  <!-- This the not minimized left drawer containing two tabs -->
  <!-- <CurrentToolSelection/> -->

  <v-app>
    <v-navigation-drawer
      fixed
      :expand-on-hover="expandOnHover"
      :rail="rail"
      :rail-width="64"
      @mouseover="onNavigationHover"
      @mouseleave="onNavigationHover"
      style="background-color: #002108; color: white">
      <v-list>
        <v-list-item
          prepend-avatar="@/assets/SphericalEaselLogo.gif"
          title="Spherical Easel"></v-list-item>
      </v-list>
      <v-divider color="#BDF3CB"></v-divider>

      <v-list density="compact" nav active-class="active">
        <v-list-item
          @click="setHover(0)"
          prepend-icon=$toolsTab
          title="Tools"
          value="tools"></v-list-item>
        <v-list-item
          @click="setHover(1)"
          prepend-icon=$objectsTab
          title="Objects"
          value="object"></v-list-item>
        <v-list-item
          @click="setHover(2)"
          prepend-icon=$constructionsTab
          title="Construction"
          value="construction"></v-list-item>
        <v-list-item
          @click="setHover(3)"
          prepend-icon=$earthTab
          title="Earth"
          value="earth"></v-list-item>
      </v-list>

      <template v-slot:append>
        <div
          :style="{
            display: 'flex',
            flexDirection: 'column',
            marginLeft: mouseOnDrawer ? '18px' : '0px',
            marginBottom: '8px',
            alignItems: mouseOnDrawer ? 'flex-start' : 'center'
          }">
          <template v-if="!inProductionMode">
            <!-- A rudimentary tool to clean up unused SVG/script files in Firebase Storage -->
            <router-link to="/firebase-cleanup">
              <v-icon id="firebase-gc" size="x-large" color="orange">
                mdi-cloud-circle
              </v-icon>
              <v-tooltip
                activator="#firebase-gc"
                text="Firebase Cleaner"></v-tooltip>
            </router-link>
          </template>
          <AuthenticatedUserToolbox :expanded-view="mouseOnDrawer" />
          <LanguageSelector />
        </div>
      </template>
    </v-navigation-drawer>
    <v-navigation-drawer
      width="320"
      :style="{
        backgroundColor: '#B9D9C1',
        border: show ? '' : '0px'
      }"
      style="padding-left: 8px; padding-top: 8px">
      <!-- <span>{{headerItem[activeItem[0]]  }}</span> -->
      <ToolGroups v-if="activeItem === 0" />
      <ObjectTree v-if="activeItem === 1" />
      <ConstructionLoader v-if="activeItem === 2" />
      <EarthToolVue v-if="activeItem === 3" />
      <!-- <v-list>
          <v-list-item :title="headerItem[activeItem[0]]" :value="headerItem[activeItem[0]]"></v-list-item>
        </v-list> -->
    </v-navigation-drawer>
    <v-main :style="{ height: height + 'px' }"></v-main>
  </v-app>
</template>

<script lang="ts" setup>
import { onBeforeMount, onBeforeUnmount, onMounted, ref, computed } from "vue";
import ToolGroups from "@/components/ToolGroups.vue";
import EventBus from "@/eventHandlers/EventBus";
import ObjectTree from "./ObjectTree.vue";
import ConstructionLoader from "./ConstructionLoader.vue";
import EarthToolVue from "@/components/EarthTool.vue";
import LanguageSelector from "./LanguageSelector.vue";
import AuthenticatedUserToolbox from "./AuthenticatedUserToolbox.vue";
import { useSEStore } from "@/stores/se";
import { useAccountStore } from "@/stores/account";
import { storeToRefs } from "pinia";
import { useLayout } from "vuetify";
import { useDisplay } from "vuetify";
// import { computed } from "vue";
// import { set } from "@vueuse/core";
const seStore = useSEStore();
const acctStore = useAccountStore();
const { actionMode } = storeToRefs(seStore);
const { userEmail } = storeToRefs(acctStore);
// const props = defineProps<{ minified: boolean }>();
const { height, width, name } = useDisplay();
// eslint-disable-next-line no-unused-vars
// const temp = ref("0px");
const rail = ref(true);
const show = ref(false);
const mouseOnDrawer = ref(false);
const activeItem = ref(0);
// eslint-disable-next-line no-unused-vars
// const headerItem = ["Tools", "Objects", "Construction", "Earth"];
const expandOnHover = ref(true);
// const screenStyle = computed(() => {
//   return {
//     height: height.value + "px"
//   };
// });
// ('layers')')
const inProductionMode = computed((): boolean => {
  return import.meta.env.MODE === "production";
});

function setHover(newActive: number): void {
  rail.value = true;
  expandOnHover.value = false;
  activeItem.value = newActive;
  // if (newActive === activeItem.value) {
  // activeItem.value.pop();
  // setTimeout(() => {
  //   show.value = !show.value;
  // }, 100);
  // } else if (activeItem.value.length === 0) {
  // activeItem.value.push(newActive);
  // setTimeout(() => {
  //   show.value = !show.value;
  // }, 100);
  // } else {
  // activeItem.value.pop();
  // activeItem.value.push(newActive);
  // }
  setTimeout(() => {
    expandOnHover.value = true;
  }, 1000);
}
// const minified = ref(false);
// const emit = defineEmits(["minifyToggled"]);
/* Copy global setting to local variable */
const activeLeftDrawerTab = ref(0);
onBeforeMount((): void => {
  EventBus.listen("left-panel-set-active-tab", setActiveTab);
});

onMounted((): void => {
  const { mainRect } = useLayout();
  console.log("Layout details", mainRect);
  console.log("Display details", height.value, width.value, name.value);
  // activeItem.value = [];
  // this.scene = this.layers[LAYER.midground];
});

function switchTab(): void {
  // console.log("this.activeLeftDrawerTab", this.activeLeftDrawerTab);
  if (activeLeftDrawerTab.value === 1) {
    // 1 is the index of the object tree tab
    // change to the move mode, but only if we are not using the measured circle tool
    if (
      actionMode.value !== "measuredCircle" &&
      actionMode.value !== "translation" &&
      actionMode.value !== "rotation"
    ) {
      seStore.setActionMode("move");
    }
  }
}
function setActiveTab(e: { tabNumber: number }): void {
  activeLeftDrawerTab.value = e.tabNumber;
}

// function toggleMinify() {
//   minified.value = !minified.value;
//   emit("minifyToggled", minified.value);
// }
onBeforeUnmount((): void => {
  EventBus.unlisten("left-panel-set-active-tab");
});
function onNavigationHover(e: MouseEvent) {
  mouseOnDrawer.value = e.type === "mouseover";
}
</script>

<style lang="scss" scoped>
.mini-icons {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  justify-content: space-evenly;
  /* Center it vertically */
}

#objtree,
#toolGroups,
#loader {
  /* It is important to set the height otherwise the "overflow' option in <ObjectTree> won't work correctly */
  height: calc(100vh - 200px);
  max-width: 360px;
  overflow: auto;
}

.slide-out-enter-active,
.slide-out-leave-active {
  transition-property: all;
  transition-duration: 150ms;
  transition-timing-function: ease;
}

.slide-out-enter,
.slide-out-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}

.active {
  background-color: #bdf3cb;
  color: black;
}
</style>
