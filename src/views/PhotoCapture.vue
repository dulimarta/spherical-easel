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

<script lang="ts">
// Reference: https://webrtc.github.io/samples/
// import VueComponent from "vue";
import EventBus from "@/eventHandlers/EventBus";
import { useAccountStore } from "@/stores/account";
import { storeToRefs } from "pinia";
import { ref, defineComponent, Ref } from "vue";
import { Route } from "vue-router";
type MyData = {
  hasCamera: boolean;
  streaming: boolean;
  stream?: MediaStream;
  imageData: string;
  videoTrack?: MediaStreamTrack;
};
export default defineComponent({
  setup() {
    const acctCStore = useAccountStore();
    const { temporaryProfilePicture } = storeToRefs(acctCStore);
    const selectedDeviceId = ref("");
    const availableDevices: Ref<Array<MediaDeviceInfo>> = ref([]);
    const width = ref(320);
    const height = ref(320); // computed at runtime based on actual width
    const video: Ref<HTMLVideoElement | null> = ref(null);
    const canvas: Ref<HTMLCanvasElement | null> = ref(null);
    return {
      selectedDeviceId,
      availableDevices,
      width,
      height,
      temporaryProfilePicture,
      video,
      canvas
    };
  },
  data(): MyData {
    return {
      hasCamera: false,
      streaming: false,
      imageData: ""
    };
  },

  // $refs!: {
  //   video: HTMLVideoElement;
  //   canvas: HTMLCanvasElement;
  // };
  // temporaryProfilePicture!: string;

  mounted(): void {
    // Stop any active tracks
    console.debug("On mounted...", this.video);
    this.stream?.getTracks().forEach((t: MediaStreamTrack) => {
      console.debug("Media track", t);
      t.stop();
    });
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream: MediaStream) => {
        console.debug("Media stream", stream);
        this.stream = stream;
        this.video!.srcObject = stream;
        this.videoTrack = stream.getVideoTracks()[0];
        this.video!.play();
        console.debug("Devs", navigator.mediaDevices);
        return navigator.mediaDevices.enumerateDevices();
      })
      .then((devices: Array<MediaDeviceInfo>) => {
        this.availableDevices = devices.filter(
          (info: MediaDeviceInfo) => info.kind === "videoinput"
        );
        console.debug("Media devices", this.availableDevices);
        this.hasCamera = this.availableDevices.length > 0;
        this.video!.addEventListener("canplay", (_ev: Event) => {
          if (!this.streaming) {
            // Recalculate the height based on video resolution
            this.height =
              this.video!.videoHeight / (this.video!.videoWidth / this.width);
            if (isNaN(this.height)) {
              this.height = (this.width * 3) / 4;
            }
            this.streaming = true;
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
  },
  beforeDestroy(): void {
    this.videoTrack?.stop();
    if (this.video) this.video.srcObject = null;
  },
  // TODO: Fix these when upgrading vue-router
  beforeRouteLeave(toRoute: Route, fromRoute: Route, next: any): void {
    console.debug("Before route leave", toRoute);
    this.videoTrack?.stop();
    if (this.video) this.video.srcObject = null;
    next();
  },
  methods: {
    stopCamera(): void {
      this.videoTrack?.stop();
      this.video!.srcObject = null;
      this.streaming = false;
    },

    useCameraShot(): void {
      const context = this.canvas?.getContext("2d");
      context?.drawImage(this.video!, 0, 0, this.width, this.height);
      const imageHex = this.canvas?.toDataURL("image/png");
      if (imageHex) {
        this.imageData = imageHex;
        this.stopCamera();
        this.temporaryProfilePicture = imageHex;
      }
      // this.videoTrack?.stop();
      this.$router.push({
        name: "PhotoCropper"
      });
    },

    done(): void {
      this.stopCamera();
      this.$emit("no-capture", {});
      this.$router.back();
    }
  }
});
</script>
