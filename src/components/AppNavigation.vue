<template>
  <!-- These the navigation arrows TODO: I would like these to be in the same row as the
    tabs-->
  <!-- This the not minimized left drawer containing two tabs -->
  <!-- <CurrentToolSelection/> -->

  <v-app>
    <v-navigation-drawer
      fixed
      :mobile="false"
      :expand-on-hover="expandOnHover"
      disable-resize-watcher
      :rail="rail"
      :rail-width="64"
      @mouseover="onNavigationHover"
      @mouseleave="onNavigationHover"
      style="background-color: #002108; color: white">
      <v-list>
        <v-list-item
          prepend-avatar="@/assets/LogoAnimatedSmallerV3.svg"
          title="Spherical Easel">
          <!-- <template v-slot:prepend>
              <v-icon>
                <svg
                  transform="matrix(8,0,0,8,-20,-25)"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="-250 -250 500 500"
                  overflow="invisible">
                  <g v-html="svgSnippetAmended"></g>
                </svg>
              </v-icon>
          </template> -->
        </v-list-item>
      </v-list>
      <v-divider color="#BDF3CB"></v-divider>

      <v-list
        v-if="bigDrawerVisible"
        density="compact"
        v-model:selected="activeItem"
        open-strategy="single"
        nav
        active-class="active">
        <v-list-item
          @click="setHover"
          prepend-icon="$toolsTab"
          title="Tools"
          value="tools"></v-list-item>
        <v-list-item
          @click="setHover"
          prepend-icon="$objectsTab"
          title="Objects"
          value="objects"></v-list-item>
        <v-list-item
          @click="setHover"
          prepend-icon="$constructionsTab"
          title="Construction"
          value="constructions"></v-list-item>
        <v-list-item
          v-if="appFeature === 'beta'"
          @click="setHover"
          prepend-icon="$earthTab"
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
          <AuthenticatedUserToolbox :expanded-view="mouseOnDrawer" />
          <LanguageSelector />
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
        </div>
      </template>
    </v-navigation-drawer>
    <v-navigation-drawer
      width="320"
      @update:model-value="navigationMonitor"
      :style="{
        backgroundColor: '#B9D9C1',
        border: show ? '' : '0px'
      }"
      style="padding-left: 8px; padding-top: 8px">
      <!-- <span>{{headerItem[activeItem[0]]  }}</span> -->
      <ToolGroups v-if="activeItem[0] === 'tools'" />
      <ObjectTree v-if="activeItem[0] === 'objects'" />
      <ConstructionLoader v-if="activeItem[0] === 'constructions'" />
      <EarthToolVue v-if="activeItem[0] === 'earth'" />
    </v-navigation-drawer>
    <v-main :style="{ height: height + 'px' }"></v-main>
  </v-app>
</template>

<script lang="ts" setup>
import { onBeforeMount, onBeforeUnmount, ref, computed, inject } from "vue";
import ToolGroups from "@/components/ToolGroups.vue";
import EventBus from "@/eventHandlers/EventBus";
import ObjectTree from "./ObjectTree.vue";
import ConstructionLoader from "./ConstructionLoader.vue";
import EarthToolVue from "@/components/EarthTool.vue";
import LanguageSelector from "./LanguageSelector.vue";
import AuthenticatedUserToolbox from "./AuthenticatedUserToolbox.vue";
import { useDisplay } from "vuetify";
import { Handler } from "mitt";
// import { computed } from "vue";
// import { set } from "@vueuse/core";
const appFeature = inject("features");

const announce = defineEmits<{
  drawerWidthChanged: [width: number];
}>();
const { height } = useDisplay();
// eslint-disable-next-line no-unused-vars
// const temp = ref("0px");
const rail = ref(true);
const show = ref(false);
const bigDrawerVisible = ref(true);
const mouseOnDrawer = ref(false);
const activeItem = ref(["tools"]);
// eslint-disable-next-line no-unused-vars
// const headerItem = ["Tools", "Objects", "Construction", "Earth"];
const expandOnHover = ref(true);
const inProductionMode = computed((): boolean => {
  return import.meta.env.MODE === "production";
});

function navigationMonitor(shown: boolean) {
  bigDrawerVisible.value = shown;
  announce("drawerWidthChanged", shown ? 320 : 0);
}

function setHover() {
  rail.value = true; // shrink the leftmost navigation drawer
  // Disable expand-on-hover for 1 second
  expandOnHover.value = false;
  setTimeout(() => {
    expandOnHover.value = true;
  }, 1000);
}
// const minified = ref(false);
// const emit = defineEmits(["minifyToggled"]);
/* Copy global setting to local variable */
onBeforeMount((): void => {
  EventBus.listen(
    "left-panel-set-active-tab",
    setActiveTab as Handler<unknown>
  );
  // I tried to make the logo bigger but there is a problem with the svg blurring if you uncomment the axios file getter and the template above
  // axios
  //   .get("../../icons/LogoAnimatedSmallerV3.svg", { responseType: "text" })
  //   .then(r => {
  //     let completeSVGString: string = r.data;
  //     //strip off the first and last lines of the svg code
  //     completeSVGString = completeSVGString.replace(/.*\n/, "");
  //     completeSVGString = completeSVGString.replace(/\n.*$/, "");
  //     svgSnippetAmended.value = completeSVGString;
  //     console.log(svgSnippetAmended.value);
  //   });
});

function setActiveTab(e: { tabName: string }): void {
  // console.log("Active Tab", e.tabName);
  activeItem.value = [e.tabName];
  // activeLeftDrawerTab.value = e.tabNumber;
}

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
