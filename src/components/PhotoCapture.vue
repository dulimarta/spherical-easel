<template>
  <div>
    <v-stepper v-model="captureStep">
      <v-stepper-header>
        <v-stepper-step step="1"
          complete
          editable>Capture</v-stepper-step>
        <v-stepper-step step="2">Crop</v-stepper-step>
      </v-stepper-header>
      <v-stepper-items>
        <v-stepper-content step="1">
          <v-select v-model="selectedDeviceId"
            label="Select Camera"
            :items="availableDevices"
            item-text="label"
            item-value="deviceId"></v-select>
          <video ref="video"
            :width="width"
            :height="height"></video>
          <canvas id="canvas"
            ref="canvas"
            :width="width"
            :height="height"></canvas>
          <v-row justify="end">
            <!--v-col cols="auto">
              <v-btn icon
                @click="freezeCamera">
                <v-icon large
                  color="primary">mdi-pause-circle</v-icon>
              </v-btn>
            </v-col>
            <v-col cols="auto">
              <v-btn icon
                @click="unfreezeCamera">
                <v-icon large
                  color="primary">mdi-play-circle</v-icon>
              </v-btn>
            </v-col-->
            <v-col cols="auto">
              <v-btn icon
                @click="saveCameraShot">
                <v-icon large
                  color="primary">mdi-check-circle</v-icon>
              </v-btn>
            </v-col>
            <v-col cols="auto">
              <v-btn icon
                @click="done">
                <v-icon large
                  color="secondary">mdi-close-circle</v-icon>
              </v-btn>
            </v-col>
          </v-row>
        </v-stepper-content>
        <v-stepper-content step="2">
          <!-- <img :src="croppedImage"> -->
          <ImageCropper v-if="imageData.length > 0"
            :src="imageData"
            @change="onCropChanged">
          </ImageCropper>
          <v-row justify="end">
            <v-col cols="auto">
              <v-btn icon
                @click="uploadProfilePicture">
                <v-icon large
                  color="secondary">mdi-upload</v-icon>
              </v-btn>
            </v-col>
          </v-row>
        </v-stepper-content>
      </v-stepper-items>
    </v-stepper>
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
import { Cropper as ImageCropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";
import { FirebaseStorage, UploadTaskSnapshot } from "@firebase/storage-types";
import { FirebaseFirestore } from "@firebase/firestore-types";
import { FirebaseAuth } from "@firebase/auth-types";
type CropDetails = {
  canvas: HTMLCanvasElement;
  imageTransforms: any;
  visibleArea: any;
  coordinates: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
};
@Component({ components: { ImageCropper } })
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
  croppedImageBase64 = "";
  croppedImageBinary: Blob | null = null;
  streaming = false;
  previewing = false;
  width = 320;
  height = 0; // computed at runtime based on actual width
  captureStep = 1;
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

    console.log("Firebase storage", this.$appStorage);
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
    // this.videoTrack?.stop();
    this.imageData = this.$refs.canvas.toDataURL("image/png");
    // this.stopCamera();
    this.captureStep = 2;
  }
  // freezeCamera(): void {
  //   // this.videoTrack?.stop();
  //   this.$refs.video.pause();
  //   this.previewing = false;
  // }
  // unfreezeCamera(): void {
  //   this.$refs.video.play();
  //   this.previewing = true;
  // }
  done(): void {
    this.stopCamera();
    this.$emit("no-capture", {});
  }

  dataURItoBlob(uri: string): Blob {
    const parts = uri.split(",");
    let imageHexString: string;
    if (parts[0].indexOf("base64") >= 0) imageHexString = atob(parts[1]);
    else imageHexString = unescape(parts[1]);
    const mimeType = parts[0].split(":")[1].split(";")[0];
    const intArray = new Uint8Array(imageHexString.length);

    for (let k = 0; k < imageHexString.length; k++)
      intArray[k] = imageHexString.charCodeAt(k);
    return new Blob([intArray], { type: mimeType });
  }

  onCropChanged(z: CropDetails): void {
    console.log("On cropping update", z);
    const context = z.canvas.getContext("2d");
    context?.drawImage(
      this.$refs.video,
      z.coordinates.left,
      z.coordinates.top,
      z.coordinates.width,
      z.coordinates.height
    );
    this.croppedImageBase64 = z.canvas.toDataURL("image/png");
    this.croppedImageBinary = this.dataURItoBlob(this.croppedImageBase64);
  }

  uploadProfilePicture(): void {
    // Upload cropped image to Firebase Firestore
    if (this.croppedImageBinary) {
      const uid = this.$appAuth.currentUser?.uid ?? "nouser";
      this.$appStorage
        .ref(`profilePictures/${uid}`)
        .put(this.croppedImageBinary, {
          contentType: "image/png"
        })
        .then((s: UploadTaskSnapshot) => {
          console.log("Uploading", s.totalBytes, "bytes");
          return s.ref.getDownloadURL();
        })
        .then((url: string) => {
          console.log("Profile picture URL", url);
          this.$emit("captured", { image: this.croppedImageBase64, url });
          return this.$appDB
            .collection("users")
            .doc(uid)
            .set({ profilePictureURL: url });
        })
        .then(() => {
          console.log("Profile pic URL is saved to Firestore");
        })
        .catch((err: any) => {
          console.log("Unable to upload profile picture", err);
        });
    }
  }
}
</script>
