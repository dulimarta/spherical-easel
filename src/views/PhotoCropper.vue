<template>
  <div>
    <ImageCropper
      class="cropper"
      v-if="inputImageBase64.length > 0"
      :src="inputImageBase64"
      :stencil-props="{ aspectRation: 1 / 1, resizable: true }"
      :stencil-component="$options.components?.CircleStencil"
      @change="onCropChanged"></ImageCropper>
    <v-btn @click="uploadProfilePicture">
      <v-icon left color="secondary">mdi-upload</v-icon>
      Crop & Upload
    </v-btn>
    <v-btn @click="cancelCrop">
      <v-icon left color="secondary">mdi-close</v-icon>
      Cancel
    </v-btn>
  </div>
</template>

<style scoped>
.cropper {
  width: 320px;
}
</style>
<script lang="ts" setup>
import { Cropper as ImageCropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";

import EventBus from "@/eventHandlers-spherical/EventBus";
import { computed, ref, defineComponent } from "vue";
import { useAccountStore } from "@/stores/account";
import { storeToRefs } from "pinia";
import {
  RouteLocationNormalized,
  useRouter,
  onBeforeRouteUpdate
} from "vue-router";
import { getAuth } from "firebase/auth";
import { doc, getFirestore, setDoc } from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  getDownloadURL,
  uploadBytes
} from "firebase/storage";
type CropDetails = {
  canvas: HTMLCanvasElement;
  imageTransforms: unknown;
  visibleArea: unknown;
  coordinates: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
};

const appDB = getFirestore();
const appAuth = getAuth();
const appStorage = getStorage();
const router = useRouter();
const emit = defineEmits(["no-capture", "photo-captured"]);
const acctStore = useAccountStore();

const { temporaryProfilePicture } = storeToRefs(acctStore);

const croppedImageBase64 = ref("");

const inputImageBase64 = computed((): string => {
  return temporaryProfilePicture.value;
});

let inputImageBinary: ImageBitmap | null = null;
let goBackSteps = 1;
let croppedImageBinary: Blob | null = null;

onBeforeRouteUpdate(
  async (
    toRoute: RouteLocationNormalized,
    fromRoute: RouteLocationNormalized
  ) => {
    // At this time the function does not have access to "this"

    // If this component is pushed from PhotoCapture
    // we have to pop 2 items from the history stack
    // Otherwise we have to pop only 1 item
    goBackSteps = fromRoute.path.includes("photocapture") ? 2 : 1;
    const tempProfile = temporaryProfilePicture.value;

    // Convert base64 image to binary blob
    createImageBitmap(dataURItoBlob(tempProfile)).then((bmp: ImageBitmap) => {
      inputImageBinary = bmp;
    });
  }
);

function onCropChanged(z: CropDetails): void {
  if (inputImageBinary) {
    croppedImageBase64.value = z.canvas.toDataURL("image/png");
    croppedImageBinary = dataURItoBlob(croppedImageBase64.value);
  }
}
function dataURItoBlob(uri: string): Blob {
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

function uploadProfilePicture(): void {
  // Upload cropped image to Firebase Firestore
  if (croppedImageBinary) {
    const uid = appAuth.currentUser?.uid ?? "nouser";
    const pngRef = storageRef(appStorage, `profilePictures/${uid}`);
    uploadBytes(pngRef, croppedImageBinary, {
      contentType: "image/png"
    })
      .then(s => getDownloadURL(s.ref))
      .then((url: string) => {
        emit("photo-captured", {});
        router.go(-goBackSteps);

        // Use {merge:true} to update or create new fields
        const userDoc = doc(appDB, "users", uid);
        return setDoc(userDoc, { profilePictureURL: url }, { merge: true });
      })
      .then(() => {
        EventBus.fire("show-alert", {
          key: "Profile picture is saved to Firebase",
          type: "info"
        });
        temporaryProfilePicture.value = "";
      })
      .catch((err: unknown) => {
        EventBus.fire("show-alert", {
          key: "Unable to upload profile picture to Firebase" + err,
          type: "error"
        });
      });
  }
}
function cancelCrop(): void {
  temporaryProfilePicture.value = "";
  emit("no-capture", {});
  router.go(-goBackSteps);
}
</script>
