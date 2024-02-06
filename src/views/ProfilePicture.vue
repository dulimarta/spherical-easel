<template>
  <div>
    <v-hover v-slot:default="{ isHovering }">
      <div id="profileImage">
        <img v-if="profileImage" width="128" :src="profileImage" />
        <v-icon v-else :color="isHovering ? 'primary' : 'secondary'" size="128"
          >mdi-account
        </v-icon>
        <v-overlay absolute :value="isHovering">
          <v-row>
            <v-col cols="auto">
              <v-icon @click="toPhotoCapture"> mdi-camera</v-icon>
            </v-col>
            <v-col cols="auto">
              <v-icon @click="imageUpload?.click()"> mdi-upload</v-icon>
              <input
                ref="imageUpload"
                type="file"
                accept="image/*"
                @change="onImageUploaded" />
            </v-col>
          </v-row>
        </v-overlay>
      </div>
    </v-hover>
  </div>
</template>

<script lang="ts" setup>
import {
  DocumentSnapshot,
  getFirestore,
  doc,
  getDoc
} from "firebase/firestore";
import { UserProfile } from "@/types";
import { useAccountStore } from "@/stores/account";
import { storeToRefs } from "pinia";
import { defineComponent, onMounted, ref, Ref } from "vue";
import { useRouter } from "vue-router";
import { getAuth } from "firebase/auth";
type FileEvent = EventTarget & { files: FileList | undefined };

const appDB = getFirestore();
const appAuth = getAuth();
const emit = defineEmits(["photo-change"]);
const router = useRouter();
const profileImage: Ref<string | null> = ref(null);
const acctStore = useAccountStore();
const { temporaryProfilePicture } = storeToRefs(acctStore);
const imageUpload: Ref<HTMLInputElement | null> = ref(null);

onMounted((): void => {
  const uid = appAuth.currentUser?.uid;
  if (!uid) return;
  const userDoc = doc(appDB, "users", uid);
  getDoc(userDoc).then((ds: DocumentSnapshot) => {
    if (ds.exists()) {
      const userDetails = ds.data() as UserProfile;
      profileImage.value = userDetails.profilePictureURL ?? null;
    }
  });
});

function toPhotoCapture(): void {
  router.push({ name: "PhotoCapture" });
  emit("photo-change", {});
}
function onImageUploaded(event: Event): void {
  const files = (event.target as FileEvent).files;
  if (files && files.length > 0) {
    emit("photo-change", {});
    const reader = new FileReader();
    reader.onload = (ev: ProgressEvent) => {
      const imageBase64 = (ev.target as any).result;
      temporaryProfilePicture.value = imageBase64;
      router.push({
        name: "PhotoCropper"
      });
    };
    reader.readAsDataURL(files[0]);
  }
}
</script>

<style scoped>
#profileImage {
  display: inline-block;
  position: relative;
  border-radius: 50%;
}
img {
  border-radius: 50%;
}
input[type="file"] {
  display: none;
}
</style>
