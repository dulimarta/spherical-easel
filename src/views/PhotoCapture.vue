<template>
  <v-container>
    <v-row class="flex-column"
      align="center">
      <v-col>
        <v-select v-model="selectedDeviceId"
          label="Select Camera"
          :items="availableDevices"
          item-text="label"
          item-value="deviceId"></v-select>
      </v-col>
      <v-col cols="auto">
        <video ref="video"
          :width="width"
          :height="height"></video>
        <canvas id="canvas"
          ref="canvas"
          :width="width"
          :height="height"></canvas>
      </v-col>
      <v-row justify="end">
        <v-col cols="auto">
          <v-btn @click="useCameraShot">
            <v-icon left
              color="primary">mdi-check</v-icon>
            Use Image
          </v-btn>
        </v-col>
        <v-col cols="auto">
          <v-btn @click="done">
            <v-icon left
              color="secondary">mdi-close</v-icon>
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
import { Component, Vue } from "vue-property-decorator";
import { FirebaseStorage, UploadTaskSnapshot } from "@firebase/storage-types";
import { FirebaseFirestore } from "@firebase/firestore-types";
import { FirebaseAuth } from "@firebase/auth-types";
import { Route } from "vue-router";

@Component
export default class PhotoCapture extends Vue {
  $refs!: {
    video: HTMLVideoElement;
    canvas: HTMLCanvasElement;
  };
  $appDB!: FirebaseFirestore;
  $appAuth!: FirebaseAuth;
  $appStorage!: FirebaseStorage;
  hasCamera = false;
  stream: MediaStream | null = null;
  videoTrack: MediaStreamTrack | null = null;
  availableDevices: Array<MediaDeviceInfo> = [];
  selectedDeviceId = "";
  imageData = "";
  streaming = false;
  previewing = false;
  width = 320;
  height = 0; // computed at runtime based on actual width
  mounted(): void {
    // Stop any active tracks
    this.stream?.getTracks().forEach((t: MediaStreamTrack) => {
      t.stop();
    });
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream: MediaStream) => {
        this.stream = stream;
        this.$refs.video.srcObject = stream;
        this.$refs.video.play();
        this.videoTrack = stream.getVideoTracks()[0];
        return navigator.mediaDevices.enumerateDevices();
      })
      .then((devices: Array<MediaDeviceInfo>) => {
        this.availableDevices = devices.filter(
          (info: MediaDeviceInfo) => info.kind === "videoinput"
        );
        this.hasCamera = this.availableDevices.length > 0;
        this.$refs.video.addEventListener("canplay", (_ev: Event) => {
          if (!this.streaming) {
            // Recalculate the height based on video resolution
            this.height =
              this.$refs.video.videoHeight /
              (this.$refs.video.videoWidth / this.width);
            if (isNaN(this.height)) {
              this.height = (this.width * 3) / 4;
            }
            this.streaming = true;
            this.previewing = true;
          }
        });
      })
      .catch((err: any) => {
        console.log("MediaDevice error", err.message, err.name);
      });
  }

  beforeRouteLeave(toRoute: Route, fromRoute: Route, next: any): void {
    console.log("Before Route Leave nav guard");
    this.videoTrack?.stop();
    this.$refs.video.srcObject = null;
    next();
  }

  beforeDestroy(): void {
    this.videoTrack?.stop();
    this.$refs.video.srcObject = null;
  }

  stopCamera(): void {
    this.videoTrack?.stop();
    this.$refs.video.srcObject = null;
    this.streaming = false;
    this.previewing = false;
  }

  useCameraShot(): void {
    const context = this.$refs.canvas.getContext("2d");
    context?.drawImage(this.$refs.video, 0, 0, this.width, this.height);
    // this.videoTrack?.stop();
    this.imageData = this.$refs.canvas.toDataURL("image/png");
    // this.stopCamera();
    console.log("Proceed to cropper");
    this.$router.push({
      name: "PhotoCropper",
      params: { image: this.imageData }
    });
  }

  done(): void {
    this.stopCamera();
    // this.$emit("no-capture", {});
    this.$router.back();
  }
}
</script>
