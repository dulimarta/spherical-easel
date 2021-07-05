<template>
  <div>
    <ImageCropper class="cropper"
      v-if="inputImageBase64.length > 0"
      :src="inputImageBase64"
      :stencil-props="{ aspectRation: 1/1, resizable: true}"
      :stencil-component="$options.components.CircleStencil"
      @change="onCropChanged">
    </ImageCropper>
    <v-btn @click="uploadProfilePicture">
      <v-icon left
        color="secondary">mdi-upload</v-icon>
      Crop & Upload
    </v-btn>
    <v-btn @click="cancelCrop">
      <v-icon left
        color="secondary">mdi-close</v-icon>
      Cancel
    </v-btn>

  </div>
</template>

<style scoped>
.cropper {
  width: 320px;
}
</style>
<script lang="ts">
import { Cropper as ImageCropper, CircleStencil } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";

import { Component, Vue } from "vue-property-decorator";
import { namespace } from "vuex-class";
import { Route } from "vue-router";
import { FirebaseStorage, UploadTaskSnapshot } from "@firebase/storage-types";
import { FirebaseFirestore } from "@firebase/firestore-types";
import { FirebaseAuth } from "@firebase/auth-types";
import EventBus from "@/eventHandlers/EventBus";
import { AppState } from "@/types";
import { SEStore } from "@/store";
const SE = namespace("se");
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
@Component({ components: { ImageCropper, CircleStencil } })
export default class PhotoCropper extends Vue {
  readonly $appDB!: FirebaseFirestore;
  readonly $appAuth!: FirebaseAuth;
  readonly $appStorage!: FirebaseStorage;

  @SE.State((s: AppState) => s.temporaryProfilePicture)
  readonly temporaryProfilePicture!: string;

  inputImageBinary: ImageBitmap | null = null;
  croppedImageBase64 = "";
  croppedImageBinary: Blob | null = null;
  goBackSteps = 1;

  get inputImageBase64(): string {
    return this.temporaryProfilePicture;
  }

  beforeRouteEnter(toRoute: Route, fromRoute: Route, next: any): void {
    // At this time the function does not have access to "this"
    next((vm: PhotoCropper) => {
      // If this component is pushed from PhotoCapture
      // we have to pop 2 items from the history stack
      // Otherwise we have to pop only 1 item
      vm.goBackSteps = fromRoute.path.includes("photocapture") ? 2 : 1;
      const tempProfile = vm.temporaryProfilePicture;

      // Convert base64 image to binary blob
      createImageBitmap(vm.dataURItoBlob(tempProfile)).then(
        (bmp: ImageBitmap) => {
          vm.inputImageBinary = bmp;
        }
      );
    });
  }

  onCropChanged(z: CropDetails): void {
    if (this.inputImageBinary) {
      this.croppedImageBase64 = z.canvas.toDataURL("image/png");
      this.croppedImageBinary = this.dataURItoBlob(this.croppedImageBase64);
    }
  }
  dataURItoBlob(uri: string): Blob {
    // The incoming string has the following header:
    // data:image/png;base64,xxxxxxxx

    const parts = uri.split(","); // separate the image bytes from the header
    let imageHexString: string;
    if (parts[0].indexOf("base64") >= 0) imageHexString = atob(parts[1]);
    else imageHexString = unescape(parts[1]);
    const colonPos = parts[0].indexOf(":");
    const semiColPos = parts[0].indexOf(";");
    const mimeType = parts[0].substring(colonPos + 1, semiColPos);
    const intArray = new Uint8Array(imageHexString.length);

    for (let k = 0; k < imageHexString.length; k++)
      intArray[k] = imageHexString.charCodeAt(k);
    return new Blob([intArray], { type: mimeType });
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
          return s.ref.getDownloadURL();
        })
        .then((url: string) => {
          this.$emit("photo-captured", {});
          this.$router.go(-this.goBackSteps);

          // Use {merge:true} to update or create new fields
          return this.$appDB
            .collection("users")
            .doc(uid)
            .set({ profilePictureURL: url }, { merge: true });
        })
        .then(() => {
          EventBus.fire("show-alert", {
            key: "Profile picture is saved to Firebase",
            type: "info"
          });
          SEStore.setTemporaryProfilePicture("");
        })
        .catch((err: any) => {
          EventBus.fire("show-alert", {
            key: "Unable to upload profile picture to Firebase" + err,
            type: "error"
          });
        });
    }
  }
  cancelCrop(): void {
    SEStore.setTemporaryProfilePicture("");
    this.$emit("no-capture", {});
    this.$router.go(-this.goBackSteps);
  }
}
</script>
