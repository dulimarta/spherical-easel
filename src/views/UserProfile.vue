<template>
  <div id="userprofile">
    <!-- <v-hover v-slot:default="{ isHovering }"> -->
    <div>
      <img
        v-if="userProfile?.profilePictureURL"
        width="128"
        :src="userProfile.profilePictureURL" />
      <v-icon v-else :color="true ? 'primary' : 'secondary'" size="128">
        mdi-account
      </v-icon>
      <v-btn :disabled="!userEmail">Change Password</v-btn>
      <v-btn color="red lighten-2">Delete Account</v-btn>
    </div>
    <div>
      Right
      <v-container>
        <v-row>
          <v-col cols="6">
            <v-text-field label="Email" readonly v-model="userEmail" />
          </v-col>
          <v-col cols="6">
            <v-text-field
              v-model="userProfile!.displayName"
              label="Display Name" />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="6">
            <v-text-field v-model="userLocation" label="Location" />
          </v-col>
          <v-col cols="6">
            <v-select
              label="Role"
              v-model="userProfile!.role"
              :items="['Student', 'Instructor', 'Community Member']"></v-select>
          </v-col>
        </v-row>
      </v-container>
    </div>
    <!--div id="profileImage">
        <v-overlay absolute :value="isHovering">
          <v-row>
            <v-col cols="auto">
              <v-icon @click="toPhotoCapture">mdi-camera</v-icon>
            </v-col>
            <v-col cols="auto">
              <v-icon @click="imageUpload?.click()">mdi-upload</v-icon>
              <input
                ref="imageUpload"
                type="file"
                accept="image/*"
                @change="onImageUploaded" />
            </v-col>
          </v-row>
        </v-overlay>
      </!--div-->
    <!-- </v-hover> -->
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
import { isShallow } from "vue";
type FileEvent = EventTarget & { files: FileList | undefined };

const appDB = getFirestore();
const appAuth = getAuth();
const emit = defineEmits(["photo-change"]);
const router = useRouter();
// const profileImage: Ref<string | null> = ref(null);
const acctStore = useAccountStore();
const { temporaryProfilePicture, userEmail, userProfile } =
  storeToRefs(acctStore);
const userLocation = ref("");

const imageUpload: Ref<HTMLInputElement | null> = ref(null);

onMounted((): void => {
  const uid = appAuth.currentUser?.uid;
  if (!uid) return;
  const userDoc = doc(appDB, "users", uid);
  getDoc(userDoc).then((ds: DocumentSnapshot) => {
    if (ds.exists()) {
      const userDetails = ds.data() as UserProfile;
      // profileImage.value = userDetails.profilePictureURL ?? null;
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
#userprofile {
  display: flex;
  flex-direction: row;
  justify-content: stretch;
}
#userprofile > :nth-child(1) {
  width: 20%;
  /* background-color: red; */
  display: flex;
  flex-direction: column;
  align-items: center;
}
#userprofile > :nth-child(2) {
  width: 80%;
}

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
