<template>
  <div>
    <ImageCropper class="cropper"
      v-if="inputImageBase64.length > 0"
      :src="inputImageBase64"
      :stencil-size="{width: 160, height: 160}"
      :stencil-component="$options.components.CircleStencil"
      @change="onCropChanged">
    </ImageCropper>
    <v-btn @click="uploadProfilePicture">
      <v-icon left
        color="secondary">mdi-upload</v-icon>
      Crop & Upload
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

import { Component, Vue, Watch } from "vue-property-decorator";
import { Route } from "vue-router";
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
@Component({ components: { ImageCropper, CircleStencil } })
export default class PhotoCropper extends Vue {
  $appDB!: FirebaseFirestore;
  $appAuth!: FirebaseAuth;
  $appStorage!: FirebaseStorage;
  inputImageBase64 = "";
  inputImageBinary: ImageBitmap | null = null;
  croppedImageBase64 = "";
  croppedImageBinary: Blob | null = null;

  beforeRouteEnter(fromRoute: Route, toRoute: Route, next: any): void {
    console.log("Before Route Enter Cropper", fromRoute);
    next((vm: PhotoCropper) => {
      vm.inputImageBase64 = fromRoute.params.image;
    });
  }

  @Watch("inputImageBase64")
  onInputImageChange(newHex: string, _oldHex: string): void {
    createImageBitmap(this.dataURItoBlob(newHex)).then((bmp: ImageBitmap) => {
      this.inputImageBinary = bmp;
    });
  }
  beforeRouteUpdate(fromRoute: Route, toRoute: Route, next: any): void {
    console.log("Before Route Enter Cropper", fromRoute, this.$route);
    next();
  }
  beforeUpdate(): void {
    console.log("Cropper", this.$route);
  }

  onCropChanged(z: CropDetails): void {
    if (this.inputImageBinary) {
      console.log("On cropping update", z);
      const context = z.canvas.getContext("2d");
      context?.drawImage(
        this.inputImageBinary,
        z.coordinates.left,
        z.coordinates.top,
        z.coordinates.width,
        z.coordinates.height
      );
      this.croppedImageBase64 = z.canvas.toDataURL("image/png");
      this.croppedImageBinary = this.dataURItoBlob(this.croppedImageBase64);
    }
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
          // this.$emit("captured", { image: this.croppedImageBase64, url });
          this.$router.go(-2);
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
