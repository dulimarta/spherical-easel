<template>
  <!-- These the navigation arrows TODO: I would like these to be in the same row as the
    tabs-->
  <!-- This the not minimized left drawer containing two tabs -->
  <!-- <CurrentToolSelection/> -->

  <!-- <transition name="slide-out" mode="out-in">
    <div v-if="!minified" key="full">
      <v-container>
        <v-row align="center">
          <v-btn icon size="x-small">
            <v-icon @click="toggleMinify">mdi-arrow-left</v-icon>
          </v-btn>
          <CurrentToolSelection />
        </v-row>
      </v-container>
      <v-tabs v-model="activeLeftDrawerTab" centered grow @change="switchTab">
        <v-tooltip location="bottom">
          <template v-slot:activator="{ props }">
            <v-tab class="mt-3" v-bind="props">
              <v-icon>$toolsTab</v-icon>
            </v-tab>
          </template>
          <span>{{ $t("main.ToolsTabToolTip") }}</span>
        </v-tooltip>

        <v-tooltip location="bottom">
          <template v-slot:activator="{ props }">
            <v-tab class="mt-3" v-bind="props">
              <v-icon>$objectsTab</v-icon>
            </v-tab>
          </template>
          <span>{{ $t("main.ObjectsTabToolTip") }}</span>
        </v-tooltip>
        <v-tooltip location="bottom">
          <template v-slot:activator="{ props }">
            <v-tab class="mt-3" v-bind="props">
              <v-icon>$constructionsTab</v-icon>
            </v-tab>
          </template>
          <span>{{ $t("main.ConstructionsTabToolTip") }}</span>
        </v-tooltip>
      </v-tabs>
      <v-window v-model="activeLeftDrawerTab">
        <v-window-item>
          <ToolGroups />
        </v-window-item>
        <v-window-item>
          <ObjectTree id="objtree"></ObjectTree>
        </v-window-item>
        <v-window-item>
          <ConstructionLoader id="loader"></ConstructionLoader>
        </v-window-item>
      </v-window>
    </div>

    <div v-else class="mini-icons" key="partial">
      <v-btn icon size="x-small">
        <v-icon @click="toggleMinify">mdi-arrow-right</v-icon>
      </v-btn>
      <div class="mini-icons px-3">
        <v-icon>$toolsTab</v-icon>
        <v-icon>$objectsTab</v-icon>
        <v-icon>$constructionsTab</v-icon>
      </div>
    </div>
  </transition> -->

  <v-card>
    <v-layout>
      <v-navigation-drawer :expand-on-hover="expandOnHover" :rail="rail" style="background-color: #002108; color: white;">
        <v-list>
          <v-list-item
            prepend-avatar="@/assets/SphericalEaselLogo.gif"
            title="Spherical Easle"></v-list-item>
        </v-list>
        <v-divider color="#BDF3CB" ></v-divider>

        <v-list density="compact" nav :selected="activeItem" active-class="active">
          <v-list-item
            @click="setHover(0)"
            prepend-icon="mdi-tools"
            title="Tools"
            value="tools"></v-list-item>
          <v-list-item
            @click="setHover(1)"
            prepend-icon="mdi-axis"
            title="Objects"
            value="object"></v-list-item>
          <v-list-item
            @click="setHover(2)"
            prepend-icon="mdi-diameter"
            title="Construction"
            value="construction"></v-list-item>
          <v-list-item
            @click="setHover(3)"
            prepend-icon="mdi-earth"
            title="Earth"
            value="earth"></v-list-item>
        </v-list>

        <template v-slot:append>
          <v-divider color="#BDF3CB" ></v-divider>

          <v-list density="compact" nav>
            <v-list-item
              prepend-icon="mdi-translate-variant"
              title="English"
              ></v-list-item>
            <v-list-item
              prepend-icon="mdi-account-circle"
              title="Hans Dulimatar"></v-list-item>
          </v-list>
        </template>
      </v-navigation-drawer>
      <v-navigation-drawer v-show="show" :style="{backgroundColor: show? '#B9D9C1':'white',border:show?'':'0px'}">
        <!-- <span>{{headerItem[activeItem[0]]  }}</span> -->

        <ToolGroups v-if="activeItem[0]===0"/>
        <ObjectTree v-if="activeItem[0]===1"/>
        <ConstructionLoader v-if="activeItem[0]===2"/>
        <EarthToolVue v-if="activeItem[0]===3"/>
        <!-- <v-list>
          <v-list-item :title="headerItem[activeItem[0]]" :value="headerItem[activeItem[0]]"></v-list-item>
        </v-list> -->
      </v-navigation-drawer>

      <v-main :style="{ height: height + 'px' }"></v-main>
    </v-layout>
  </v-card>
</template>

<script lang="ts" setup>
import { onBeforeMount, onBeforeUnmount, onMounted, ref } from "vue";
import ToolGroups from "@/components/ToolGroups.vue";
import EventBus from "@/eventHandlers/EventBus";
import ObjectTree from "./ObjectTree.vue";
import ConstructionLoader from "./ConstructionLoader.vue";
// import CurrentToolSelection from "@/components/CurrentToolSelection.vue";
import EarthToolVue from "@/components/EarthTool.vue";
import { useSEStore } from "@/stores/se";
import { storeToRefs } from "pinia";
import { useLayout } from "vuetify";
import { useDisplay } from "vuetify";
// import { computed } from "vue";
// import { set } from "@vueuse/core";
const seStore = useSEStore();
const { actionMode } = storeToRefs(seStore);
// const props = defineProps<{ minified: boolean }>();
const { height, width, name } = useDisplay();
// eslint-disable-next-line no-unused-vars
const temp = ref("0px");
const rail = ref(true);
const show = ref(false);
const activeItem = ref([]);
// eslint-disable-next-line no-unused-vars
const headerItem = ["Tools", "Objects", "Construction", "Earth"];
const expandOnHover = ref(true);
// const screenStyle = computed(() => {
//   return {
//     height: height.value + "px"
//   };
// });
// ('layers')')
function setHover(newActive:number):void{
  rail.value = true;
  expandOnHover.value = false;
  if(newActive === activeItem.value[0]){
    activeItem.value.pop();
    setTimeout(() => {
    show.value = !show.value;
    }, 100);
  }else if(activeItem.value.length === 0){
    (activeItem.value as Array<number>).push(newActive);
    setTimeout(() => {
    show.value = !show.value;
    }, 100);
  }
  else{
    activeItem.value.pop();
    (activeItem.value as Array<number>).push(newActive);
  }
  setTimeout(() => {
    expandOnHover.value = true;
  }, 1000);
}
const minified = ref(false);
const emit = defineEmits(["minifyToggled"]);
/* Copy global setting to local variable */
const activeLeftDrawerTab = ref(0);
onBeforeMount((): void => {
  EventBus.listen("left-panel-set-active-tab", setActiveTab);
});

onMounted((): void => {
  const { mainRect } = useLayout();
  console.log("Layout details", mainRect);
  console.log("Display details", height.value, width.value, name.value);
  activeItem.value = [];
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

function toggleMinify() {
  minified.value = !minified.value;
  emit("minifyToggled", minified.value);
}
onBeforeUnmount((): void => {
  EventBus.unlisten("left-panel-set-active-tab");
});
</script>

<style lang="scss" scoped>
.mini-icons {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  justify-content: space-evenly; /* Center it vertically */
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
.active{
  background-color: #BDF3CB;
  color: black;
}


</style>
