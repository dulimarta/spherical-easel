<template>
  <div>
    <video ref="video"
      :width="width"
      :height="height"></video>
    <canvas id="canvas"
      ref="canvas"
      :width="width"
      :height="height"></canvas>
    <template v-if="hasCamera">
      <div>
        <v-btn v-show="previewing"
          @click="freezeCamera">Take</v-btn>
        <v-btn v-show="!previewing"
          @click="unfreezeCamera">Retake</v-btn>
        <v-btn v-show="!previewing"
          @click="saveCameraShot">Save</v-btn>
        <v-btn @click="done">Cancel</v-btn>
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
  // imageData = "";
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
      .getUserMedia({ video: true })
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

  saveCameraShot(): void {
    const context = this.$refs.canvas.getContext("2d");
    context?.drawImage(this.$refs.video, 0, 0, this.width, this.height);
    this.videoTrack?.stop();
    const image = this.$refs.canvas.toDataURL("image/png");
    this.stopCamera();
    this.$emit("captured", { image });
  }
  freezeCamera(): void {
    // this.videoTrack?.stop();
    this.$refs.video.pause();
    this.previewing = false;
  }
  unfreezeCamera(): void {
    this.$refs.video.play();
    this.previewing = true;
  }
  done(): void {
    this.stopCamera();
    this.$emit("no-capture", {});
  }
}
</script>
