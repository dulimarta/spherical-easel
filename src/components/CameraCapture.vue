<template>
  <div :style="{ border: '1px solid black' }" class="ma-2 bg-grey">
    <div
      v-if="photoURL"
      :style="{
        border: '2px solid purpe',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'stretch'
      }">
      <img :src="photoURL" />
      <div
        :style="{
          position: 'absolute',
          bottom: '8px',
          width: '100%',
          // border: '1px solid green',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          gap: '8px'
        }">
        <v-icon @click="retakePhoto" size="large">mdi-camera-retake</v-icon>
      </div>
    </div>
    <VueCamera
      v-else
      ref="camera"
      :resolution="cameraResolution"
      :autoplay="cameraIsLive">
      <div
        :style="{
          /* position, bottom, and width control this <div> w.r.t. camera viewport */
          position: 'absolute',
          bottom: '8px',
          width: '100%',
          // Display and justifyContent control the arrangement of the icons
          display: 'flex',
          justifyContent: 'center'
        }">
        <template v-if="cameraIsLive">
          <v-icon size="large" @click="pauseCamera">mdi-pause-box</v-icon>
          <v-icon size="large" @click="captureCamera">mdi-camera</v-icon>
        </template>
        <v-icon v-else @click="startCamera">mdi-play-box</v-icon>
      </div>
    </VueCamera>
  </div>
</template>
<script setup lang="ts">
import VueCamera from "simple-vue-camera";
import { Ref, ref, useTemplateRef, onBeforeUpdate } from "vue";

defineExpose({ stopCamera, startCamera });
const trigger = defineEmits<{
  // (e: "photo-captured", yesNo: boolean): void;
  (e: "photo-changed", url: string | null): void;
}>();
const cameraResolution = { width: 400, height: 300 };
const cameraObj = useTemplateRef<typeof VueCamera>("camera");
const cameraIsLive = ref(true);
const photoURL: Ref<string | null> = ref(null);

function startCamera() {
  cameraObj.value?.start();
  cameraIsLive.value = true;
  photoURL.value = null;
}

function stopCamera() {
  cameraObj.value?.stop();
  cameraIsLive.value = false;
}
function pauseCamera() {
  cameraObj.value?.pause();
  cameraIsLive.value = false;
}
async function captureCamera() {
  const photoBlob = await cameraObj.value?.snapshot(
    cameraResolution /* resolution */,
    "image/png" /* type */,
    0.9 /* quality */
  );
  photoURL.value = URL.createObjectURL(photoBlob);
  trigger("photo-changed", photoURL.value);
}

function retakePhoto() {
  photoURL.value = null;
  cameraIsLive.value = true;
  trigger("photo-changed", photoURL.value);
}
</script>
