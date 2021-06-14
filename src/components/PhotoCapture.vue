<template>
  <div>
    <video v-show="streaming"
      ref="video"
      :width="width"
      :height="height"></video>
    <canvas id="canvas"
      ref="canvas"
      :width="width"
      :height="height"></canvas>
    <img v-show="!streaming"
      :src="imageData">
    <template v-if="hasCamera">
      <div>
        <v-btn @click="startCamera">Start Camera</v-btn>
        <v-btn :disabled="!streaming"
          @click="stopCamera">Stop Camera</v-btn>
        <v-btn :disabled="!streaming"
          @click="doCapture">Capture</v-btn>
      </div>
      <v-select v-model="selectedDeviceId"
        :items="availableDevices"
        item-text="label"
        item-value="deviceId"></v-select>
    </template>
  </div>
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

@Component
export default class PhotoCapture extends Vue {
  $refs!: {
    video: HTMLVideoElement;
    canvas: HTMLCanvasElement;
  };

  hasCamera = false;
  stream: MediaStream | null = null;
  videoTrack: MediaStreamTrack | null = null;
  availableDevices: Array<MediaDeviceInfo> = [];
  selectedDeviceId = "";
  imageData = "";
  streaming = false;
  width = 320;
  height = 0; // computed at runtime based on actual width
  mounted(): void {
    // Stop any active tracks
    this.stream?.getTracks().forEach((t: MediaStreamTrack) => {
      t.stop();
    });
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream: MediaStream) => {
        console.log("Got stream");
        this.stream = stream;
        return navigator.mediaDevices.enumerateDevices();
      })
      .then((devices: Array<MediaDeviceInfo>) => {
        this.availableDevices = devices.filter(
          (info: MediaDeviceInfo) => info.kind === "videoinput"
        );
        this.hasCamera = this.availableDevices.length > 0;
      })
      .catch((err: any) => {
        console.log("MediaDevice error", err.message, err.name);
      });

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
      }
    });
  }

  beforeDestroy(): void {
    this.videoTrack?.stop();
    this.$refs.video.srcObject = null;
  }

  startCamera(): void {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream: MediaStream) => {
        this.$refs.video.srcObject = stream;
        this.$refs.video.play();
        this.videoTrack = stream.getVideoTracks()[0];
      })
      .catch((err: any) => {
        console.log("Unable to enumerate devices");
      });
  }

  stopCamera(): void {
    this.videoTrack?.stop();
    this.$refs.video.srcObject = null;
    this.streaming = false;
  }

  doCapture(): void {
    const context = this.$refs.canvas.getContext("2d");
    context?.drawImage(this.$refs.video, 0, 0, this.width, this.height);
    this.imageData = this.$refs.canvas.toDataURL("image/png");
    this.stopCamera();
  }
}
</script>
