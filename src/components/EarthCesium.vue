<template>
  <!-- a <div> wrapper with absolution positioning is needed to make the earth
    layer appear in background -->
  <div style="position: absolute">
  <vc-config-provider :cesium-path="vcConfig.cesiumPath" :locale="enUS" :access-token="vcConfig.accessToken">
    <!--
      Detailed docs: https://cesium.com/learn/cesiumjs/ref-doc/Viewer.html
      base-layer-picker shows a layer selector at the upper right corner of the canvas
      scene-mode-picker shows a projection view selector

      Cesium globe is modelled as an ellipsoid (not a sphere) with
      - equatorial radius of 6378137 (meters)
      - polar radius of 6356752.314245179 (meters)

      When view is zoomed in/out, the globe stays in its ellipsoid radii
      but the camera view matrix changes.

    -->
    <vc-viewer
      ref="cesiumViewer"
      id="cesium-viewer"
      @ready="onComponentReady"
      @changed="onCameraChanged"
      :style="viewerStyle"
      :scene-mode-picker="false"
      :animation="false"
      :show-credit="true"
      :terrain="Terrain.fromWorldTerrain()"
      :base-layer-picker="true"
      :use-default-render-loop="true"
      >
      <vc-layer-imagery :alpha="0.7" :brightness="1">
        <vc-imagery-provider-osm></vc-imagery-provider-osm>
      </vc-layer-imagery>
      <!--vc-entity
        :position="{ lng: 108, lat: -6.2 }"
        label="Jakarta"></!--vc-entity-->
    </vc-viewer>
  </vc-config-provider>
</div>
</template>
<script setup lang="ts">
import { onMounted } from "vue";
import { reactive, ref, Ref } from "vue";
import { useLayout, useDisplay } from "vuetify";
import * as THREE from "three"
import {
  VcConfigProvider,
  VcViewer,
  VcEntity,
  VcNavigation,
  VcViewerRef,
  VcLayerImagery,
  VcImageryProviderOsm
} from "vue-cesium";
import {
  Cesium3DTileset,
  createOsmBuildingsAsync,
  Terrain,
  Camera,
  OrthographicFrustum,
  Viewer,
  Matrix4,
  PerspectiveFrustum
} from "cesium";
import enUS from "vue-cesium/es/locale/lang/en-us";
import type { VcReadyObject } from "vue-cesium/es/utils/types";
import { computed, watch } from "vue";
import { useSEStore } from "@/stores/se";
import { storeToRefs } from "pinia";
import { nextTick } from "vue";
type ComponentProps = {
  availableHeight: number,
  availableWidth:number
}
const store = useSEStore()
const {inverseTotalRotationMatrix} = storeToRefs(store)
const { mainRect } = useLayout();
const display = useDisplay();
const threeRotationMatrix = new THREE.Matrix4()
const cesiumRotationMatrix = new Matrix4()
let camera: Camera;
let viewer: Viewer;
const cesiumViewer: Ref<VcViewerRef | null> = ref(null);
const vcConfig = reactive({
  cesiumPath: "https://unpkg.com/cesium@latest/Build/Cesium/Cesium.js",
  accessToken: import.meta.env.VITE_APP_CESIUM_ACCESS_TOKEN
});
const props = defineProps<ComponentProps>()

const viewerStyle = computed(() => {
  return {
    width: props.availableWidth + 'px',
    height: props.availableHeight + 'px'
    // width: display.width.value - mainRect.value.left - mainRect.value.right,
    // height: display.height.value - mainRect.value.top - mainRect.value.bottom
    // height: mainRect.value.bottom - mainRect.value.top
  };
});

onMounted(() => {
  cesiumViewer.value?.creatingPromise.then((obj: VcReadyObject) => {
      // console.debug("Promise created #1", obj.Cesium);
      // console.debug("Promise created #2: globe", obj.Cesium.Globe);
    console.debug("Promise created #2", obj.viewer.scene.globe);
    viewer = obj.viewer

    // viewer.scene.debugShowCommands = true
    // viewer.scene.debugShowFrustums = true
    viewer.scene.requestRenderMode = true
    camera = obj.viewer.camera;
    // camera.switchToOrthographicFrustum()
    createOsmBuildingsAsync().then((tileSet: Cesium3DTileset) => {
      obj.viewer.scene.primitives.add(tileSet);

      // obj.viewer.scene.globe.show = true
    });
  });
});

watch(
  [() => display.width.value, () => display.height.value],
  ([width, height]) => {
    console.debug((camera.frustum as PerspectiveFrustum).aspectRatio);
  }
);

watch(() => inverseTotalRotationMatrix.value.elements,async (elems: Array<number>) => {
  console.debug("Rotation matrix changes")
  threeRotationMatrix.fromArray(elems)
  threeRotationMatrix.invert()
  // The following Matrix4 is from Cesium
  Matrix4.fromRowMajorArray(threeRotationMatrix.elements, cesiumRotationMatrix)
  console.debug("Camera before", camera.viewMatrix)
  camera.setView({endTransform: cesiumRotationMatrix})
  console.debug("Camera after", camera.viewMatrix)
  await nextTick()
  viewer.scene.requestRender()
}, { deep: true })

function onComponentReady(obj: VcReadyObject) {
  console.debug("OnViewReady #1", obj.Cesium);
  // console.debug("OnViewReady #2", obj.viewer);
}

function onCameraChanged(pct: number) {
  console.debug(
    `Camera changed position `,
    camera.position,
    " posWC",
    camera.positionWC,
    "direction",
    camera.direction,
    " view Mat",
    camera.viewMatrix
  );
  console.debug("Globe radii ", viewer.scene.globe.ellipsoid.radii)
}
</script>
<style scoped>
#cesium-viewer {
  position: absolute;
}
</style>
