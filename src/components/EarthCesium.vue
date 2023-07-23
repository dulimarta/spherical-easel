<template>
  <VcConfigProvider
    :cesium-path="vcConfig.cesiumPath"
    :locale="enUS">
    <VcViewer
      ref="cesiumViewer"
      id="cesium-viewer"
      @ready="onComponentReady"
      :style="viewerStyle"
      :access-token="vcConfig.accessToken"
      :animation="false"
      :show-credit="true"
      :terrain="Terrain.fromWorldTerrain()"
      :base-layer-picker="true"
      >
      <VcLayerImagery :alpha="0.7" :brightness="1">
        <VcImageryProviderOsm></VcImageryProviderOsm>
      </VcLayerImagery>
      <VcNavigation/>
      <!--vc-entity
        :position="{ lng: 108, lat: -6.2 }"
        label="Jakarta"></!--vc-entity-->
    </VcViewer>
  </VcConfigProvider>
</template>
<script setup lang="ts">
import { onMounted } from "vue";
import { reactive, ref, Ref } from "vue";
import { useLayout, useDisplay } from "vuetify";
import {
  VcConfigProvider,
  VcViewer,
  VcEntity,
  VcNavigation,
  VcViewerRef,
VcLayerImagery,
VcImageryProviderOsm
} from "vue-cesium";
import { Cesium3DTileset, createOsmBuildingsAsync, Terrain } from "cesium";
import enUS from "vue-cesium/es/locale/lang/en-us";
import type { VcReadyObject } from "vue-cesium/es/utils/types";
import { computed } from "vue";
const { mainRect } = useLayout();
const display = useDisplay();
const cesiumViewer: Ref<VcViewerRef | null> = ref(null);
const vcConfig = reactive({
  cesiumPath: "https://unpkg.com/cesium@latest/Build/Cesium/Cesium.js",
  accessToken: import.meta.env.VITE_APP_CESIUM_ACCESS_TOKEN
});
const viewerStyle = computed(() => {
  return {
    width: display.width.value - mainRect.value.left - mainRect.value.right,
    height: display.height.value - mainRect.value.top - mainRect.value.bottom
    // height: mainRect.value.bottom - mainRect.value.top
  };
});

onMounted(() => {
  cesiumViewer.value?.creatingPromise.then((obj: VcReadyObject) => {
  //   console.debug("Promise created #1", obj.Cesium);
  //   console.debug("Promise created #2", obj.viewer);
    createOsmBuildingsAsync().then((tileSet: Cesium3DTileset) => {
      obj.viewer.scene.primitives.add(tileSet);
      // obj.viewer.scene.globe.show = true
    });
  });
});


function onComponentReady(obj: VcReadyObject) {
  console.debug("OnViewReady #1", obj.Cesium);
  console.debug("OnViewReady #2", obj.viewer);
}
</script>
<style scoped></style>
