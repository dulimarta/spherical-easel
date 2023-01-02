<template>
  <v-container>
    <v-row class="flex-column" align="center">
      <v-col>
        <v-select
          v-model="selectedDeviceId"
          label="Select Camera"
          :items="availableDevices"
          item-text="label"
          item-value="deviceId"></v-select>
      </v-col>
      <v-col cols="auto">
        Video
        <video
          ref="video"
          :style="{
            border: '1px solid red'
          }"
          :width="width"
          :height="height"></video>
        Canvas
        <canvas
          id="canvas"
          ref="canvas"
          :width="width"
          :height="height"
          :style="{
            border: '1px solid red'
          }"></canvas>
      </v-col>
      <v-row justify="end">
        <v-col cols="auto">
          <v-btn @click="useCameraShot">
            <v-icon left color="primary">mdi-check</v-icon>
            Use Image
          </v-btn>
        </v-col>
        <v-col cols="auto">
          <v-btn @click="done">
            <v-icon left color="secondary">mdi-close</v-icon>
            Cancel
          </v-btn>
        </v-col>
      </v-row>
    </v-row>
  </v-container>
</template>

<style scoped>
#canvas {
  display: none;
}
</style>

<script lang="ts" setup>
// Reference: https://webrtc.github.io/samples/
// import VueComponent from "vue";
import EventBus from "@/eventHandlers/EventBus";
import { useAccountStore } from "@/stores/account";
import { storeToRefs } from "pinia";
import { onBeforeUnmount, onMounted, ref, Ref } from "vue";
import { Route } from "vue-router";
import { useRouter } from "vue-router/types/composables";
type MyData = {
  hasCamera: boolean;
  streaming: boolean;
  stream?: MediaStream;
  imageData: string;
  videoTrack?: MediaStreamTrack;
};
const emit = defineEmits(["no-capture"]);
const router = useRouter();
const acctCStore = useAccountStore();
const { temporaryProfilePicture } = storeToRefs(acctCStore);
const selectedDeviceId = ref("");
const availableDevices: Ref<Array<MediaDeviceInfo>> = ref([]);
const width = ref(320);
const height = ref(320); // computed at runtime based on actual width
const video: Ref<HTMLVideoElement | null> = ref(null);
const canvas: Ref<HTMLCanvasElement | null> = ref(null);
let hasCamera = false;
let streaming = false;
let imageData = "";
let stream: MediaStream | null = null;
let videoTrack: MediaStreamTrack | null = null;

onMounted((): void => {
  // Stop any active tracks
  console.debug("On mounted...", video.value);
  stream?.getTracks().forEach((t: MediaStreamTrack) => {
    console.debug("Media track", t);
    t.stop();
  });
  navigator.mediaDevices
    .getUserMedia({ video: true, audio: false })
    .then((ms: MediaStream) => {
      console.debug("Media stream", stream);
      stream = ms;
      video.value!.srcObject = stream;
      videoTrack = stream.getVideoTracks()[0];
      video.value!.play();
      console.debug("Devs", navigator.mediaDevices);
      return navigator.mediaDevices.enumerateDevices();
    })
    .then((devices: Array<MediaDeviceInfo>) => {
      availableDevices.value = devices.filter(
        (info: MediaDeviceInfo) => info.kind === "videoinput"
      );
      console.debug("Media devices", availableDevices.value);
      hasCamera = availableDevices.value.length > 0;
      video.value!.addEventListener("canplay", (_ev: Event) => {
        if (!streaming) {
          // Recalculate the height based on video resolution
          height.value =
            video.value!.videoHeight / (video.value!.videoWidth / width.value);
          if (isNaN(height.value)) {
            height.value = (width.value * 3) / 4;
          }
          streaming = true;
        }
      });
    })
    .catch((err: any) => {
      EventBus.fire("show-alert", {
        key: "Media device error" + err.message,
        type: "error"
      });
      // console.log("MediaDevice error", err.message, err.name);
    });
});

onBeforeUnmount((): void => {
  videoTrack?.stop();
  if (video.value) video.value.srcObject = null;
});

// TODO: Fix these when upgrading vue-router
function beforeRouteLeave(toRoute: Route, fromRoute: Route, next: any): void {
  console.debug("Before route leave", toRoute);
  videoTrack?.stop();
  if (video.value) video.value.srcObject = null;
  next();
}

function stopCamera(): void {
  videoTrack?.stop();
  video.value!.srcObject = null;
  streaming = false;
}

function useCameraShot(): void {
  const context = canvas.value?.getContext("2d");
  context?.drawImage(video.value!, 0, 0, width.value, height.value);
  const imageHex = canvas.value?.toDataURL("image/png");
  if (imageHex) {
    imageData = imageHex;
    stopCamera();
    temporaryProfilePicture.value = imageHex;
  }
  // this.videoTrack?.stop();
  router.push({
    name: "PhotoCropper"
  });
}

function done(): void {
  stopCamera();
  emit("no-capture", {});
  router.back();
}
</script>
