<template>
  <div>
    <v-hover v-slot:default="{hover}">
      <div id="profileImage">
        <img v-if="profileImage"
          :src="profileImage">
        <v-icon v-else
          :color="hover ? 'primary' : 'secondary' "
          size="128">mdi-account
        </v-icon>
        <v-overlay absolute
          :value="hover">
          <v-row>
            <v-col cols="auto">
              <v-icon @click="toPhotoCapture">
                mdi-camera</v-icon>
            </v-col>
            <v-col cols="auto">
              <v-icon @click="$refs.imageUpload.click()">
                mdi-upload</v-icon>
              <input ref="imageUpload"
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

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { FirebaseAuth } from "@firebase/auth-types";
import { FirebaseFirestore, DocumentSnapshot } from "@firebase/firestore-types";
type UserProfile = {
  profilePictureURL: string;
};
type FileEvent = EventTarget & { files: FileList | undefined };

@Component
export default class extends Vue {
  $appAuth!: FirebaseAuth;
  $appDB!: FirebaseFirestore;

  profileImage: string | null = null;

  mounted(): void {
    const uid = this.$appAuth.currentUser?.uid;
    console.log("I'm here", uid);
    if (!uid) return;
    this.$appDB
      .collection("users")
      .doc(uid)
      .get()
      .then((ds: DocumentSnapshot) => {
        if (ds.exists) {
          const userDetails = ds.data() as UserProfile;
          this.profileImage = userDetails.profilePictureURL;
        }
      });
  }

  toPhotoCapture(): void {
    console.log("Push router to photocapture");
    this.$router.push({ name: "PhotoCapture" });
  }

  onImageUploaded(event: Event): void {
    const files = (event.target as FileEvent).files;
    if (files && files.length > 0) {
      const reader = new FileReader();
      reader.onload = (ev: ProgressEvent) => {
        const imageBase64 = (ev.target as any).result;
        // const url = URL.createObjectURL(out);
        // this.profileImage = out;
        this.$router.push({
          name: "PhotoCropper",
          params: { image: imageBase64 }
        });
      };
      reader.readAsDataURL(files[0]);
    }
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