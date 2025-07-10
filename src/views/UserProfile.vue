<template>
  <div id="userprofile" class="mt-3">
    <div>
      <v-hover>
        <template #default="{ isHovering, props }">
          <v-card elevation="3" class="mx-2">
            <v-card-text class="bg-grey-lighten-3">
              <v-avatar :class="{'opacity-50': isHovering}"
                v-if="userProfile?.profilePictureURL"
                v-bind="props"
                size="128"
                id="useravatar"
                :image="userProfile?.profilePictureURL" />
              <v-icon
                v-else
                v-bind="props"
                id="useravatar"
                size="128"
                :color="isHovering ? 'grey' : 'black'">
                mdi-account
              </v-icon>
              <div
                :style="{
                  position: 'absolute',
                  opacity: isHovering ? 1 : 0,
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%,5%)',
                  zIndex: 5
                }">
                <v-icon v-bind="props" color="black" size="x-large" @click="showPhotoDialog">
                  mdi-camera
                </v-icon>
              </div>
            </v-card-text>
            <v-card-actions>
              <v-btn base-color="red"  variant="outlined" class="mt-3">Delete Account</v-btn>
            </v-card-actions>
          </v-card>
        </template>
      </v-hover>
    </div>
    <div>
      <v-container>
        <v-row>
          <v-col>
            <span class="text-h5">Email: {{ userEmail }}</span>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="6">
            <v-text-field label="Display Name" v-model="userProfile!.displayName" />
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="userProfile!.location" label="Location" />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="4">
            <v-select v-model="userProfile!.role"
              label="Role"
              :items="['Student', 'Instructor', 'Community Member']"></v-select>
          </v-col>
          <v-col cols="4">
            {{ userProfile }}
            <v-select v-model="userProfile!.preferredLanguage"
              variant="outlined"
              :items="languages"
              item-title="name"
              item-value="locale"
              label="Language"></v-select>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
  <Dialog ref="photoDialog" title="Your Profile Photo" width="40%"
  yes-text="Use Image" no-text="Cancel">
  <VTabs v-model="photoMode">
    <VTab>Live Camera</VTab>
    <VTab>Photo File</VTab>
  </VTabs>
  <VTabsWindow v-model="photoMode">
    <VTabsWindowItem><CameraCapture/></VTabsWindowItem>
    <VTabsWindowItem>Upload from .PNG, .JPG, etc.</VTabsWindowItem>
  </VTabsWindow>
    
  </Dialog>
</template>

<script lang="ts" setup>
import { useAccountStore } from "@/stores/account";
import { storeToRefs } from "pinia";
import { ref, Ref } from "vue";
import Dialog, { DialogAction } from "@/components/Dialog.vue";
import { useRouter } from "vue-router";
import SETTINGS from "@/global-settings";
import CameraCapture from "@/components/CameraCapture.vue";
type FileEvent = EventTarget & { files: FileList | undefined };
type LocaleName = {
  locale: string;
  name: string;
};

// const appDB = getFirestore();
// const appAuth = getAuth();
const emit = defineEmits(["photo-change"]);
const router = useRouter();
// const profileImage: Ref<string | null> = ref(null);
const acctStore = useAccountStore();
const { temporaryProfilePicture, userEmail, userProfile } =
  storeToRefs(acctStore);
const languages: Ref<Array<LocaleName>> = ref(SETTINGS.supportedLanguages);
const photoDialog: Ref<DialogAction|null> = ref(null)
const photoMode = ref(0)
// const imageUpload: Ref<HTMLInputElement | null> = ref(null);


function showPhotoDialog() {
  photoDialog.value?.show()
}
// function toPhotoCapture(): void {
//   router.push({ name: "PhotoCapture" });
//   emit("photo-change", {});
// }
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
  display: flex;
  flex-direction: column;
  align-items: center;
}
#userprofile > :nth-child(2) {
  flex-grow: 1;
}

#profileImage {
  display: inline-block;
  position: relative;
  border-radius: 50%;
}
.photo-overlay {
  position: absolute;
  bottom: -20px;
  right: 0px;
}
</style>
