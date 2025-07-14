<template>
  <div id="userprofile" class="mt-3">
    <div>
      <v-hover>
        <template #default="{ isHovering, props }">
          <v-card elevation="3" class="mx-2">
            <v-card-text class="bg-grey-lighten-3">
              <v-avatar
                :class="{ 'opacity-50': isHovering }"
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
                <v-icon
                  v-bind="props"
                  color="black"
                  size="x-large"
                  @click="showPhotoDialog">
                  mdi-camera
                </v-icon>
              </div>
            </v-card-text>
            <v-card-actions>
              <v-btn base-color="red" variant="outlined" class="mt-3">
                {{ t("DeleteAcct") }}
              </v-btn>
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
          <v-col cols="4">
            <v-text-field
              :label="t('displayedName')"
              v-model="userProfile!.displayName" />
          </v-col>
          <v-col cols="4">
            <v-text-field
              v-model="userProfile!.location"
              :label="t('location')" />
          </v-col>
          <v-col cols="4">
            <v-select
              v-model="userProfile!.role"
              :label="t('role')"
              :items="['Student', 'Instructor', 'Community Member']"></v-select>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="4">
            <v-select
              v-model="userProfile.preferredLanguage"
              variant="outlined"
              :items="languages"
              item-title="name"
              item-value="locale"
              :label="t('language')"></v-select>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
  <Dialog
    ref="photoDialog"
    :title="t('createProfilePic')"
    width="40%"
    yes-text="Cancel">
    <PhotoMaker @changed="closePhotoDialog" />
  </Dialog>
</template>

<script lang="ts" setup>
import { ref, Ref } from "vue";
import { useAccountStore } from "@/stores/account";
import { storeToRefs } from "pinia";
import Dialog, { DialogAction } from "@/components/Dialog.vue";
import PhotoMaker from "@/components/ProfilePhotoMaker.vue";
import SETTINGS from "@/global-settings";
import { useI18n } from "vue-i18n";
// type FileEvent = EventTarget & { files: FileList | undefined };
type LocaleName = {
  locale: string;
  name: string;
};

const { t } = useI18n();
const acctStore = useAccountStore();
const { userEmail, userProfile, temporaryProfilePictureURL } =
  storeToRefs(acctStore);
const languages: Ref<Array<LocaleName>> = ref(SETTINGS.supportedLanguages);
const photoDialog: Ref<DialogAction | null> = ref(null);

function showPhotoDialog() {
  photoDialog.value?.show();
}

function closePhotoDialog(s: string) {
  console.debug("What is data image", s);
  userProfile.value = { ...userProfile.value!, profilePictureURL: s };
  photoDialog.value?.hide();
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
<i18n locale="en">
  {
    "DeleteAcct": "Delete Account",
    "createProfilePic": "Create Profile Picture",
    "displayedName": "Displayed Name",
    "location": "Location",
    "role": "Role",
    "language": "Language"
  }
</i18n>
