<template>
  <v-stepper
    v-model="photoStep"
    :items="['Select Photo', 'Crop']"
    ref="stepper">
    <!-- <v-stepper-window>
      <v-stepper-window-item>Select</v-stepper-window-item>
      <v-stepper-window-item>Crop</v-stepper-window-item>
    </v-stepper-window> -->
    <template #item.1>
      <span>{{ t("photoSourceInstruction") }}</span>

      <v-tabs v-model="photoSelectionTab">
        <v-tab>{{ t("fromCamera") }}</v-tab>
        <v-tab>{{ t("fromFile") }}</v-tab>
      </v-tabs>
      <v-tabs-window v-model="photoSelectionTab">
        <v-tabs-window-item>
          <CameraCapture @photo-changed="setPhotoURL" ref="cameraCapture" />
        </v-tabs-window-item>
        <v-tabs-window-item>
          <span class="text-body">{{ t("selectImage") }}</span>
          <v-file-input
            show-size
            accept="image/*"
            :multiple="false"
            v-model="photoFile"></v-file-input>
          <img :src="temporaryProfilePictureURL" width="100%" />
        </v-tabs-window-item>
      </v-tabs-window>
      <!-- <v-btn
        variant="outlined"
        :disabled="!photoFileURL"
        @cllick="photoStep = 2">
        Use & Crop
      </v-btn> -->
    </template>
    <template #item.2>
      <span>{{ t("croppedSize", { size: croppedSize }) }}</span>
      <Cropper
        ref="cropper"
        :src="temporaryProfilePictureURL"
        :stencil-component="CircleStencil"
        @change="doCrop"
        :stencil-props="{
          aspectRatio: 1
        }" />
    </template>
    <template #actions="{ prev }">
      <div
        class="ma-2"
        :style="{ display: 'flex', justifyContent: 'space-between' }">
        <v-btn @click="prev" :disabled="photoStep === 1">Previous</v-btn>
        <v-btn
          @click="nextAction"
          :disabled="
            photoStep === 1 && temporaryProfilePictureURL.length === 0
          ">
          {{ photoStep === 1 ? "To Cropper" : "Use" }}
        </v-btn>
      </div>
    </template>
  </v-stepper>
</template>
<i18n locale="en">
  {
    "photoSourceInstruction": "Create photo from camera or upload from a file",
    "fromCamera": "Live Camera",
    "fromFile": "Upload Photo",
    "selectImage": "Select an image (.PNG, .JPG, .GIF, etc.)",
    "croppedSize": "Cropped at {size}x{size}"
  }
</i18n>
<script setup lang="ts">
import { watch, ref, Ref, useTemplateRef } from "vue";
import { Cropper, CircleStencil } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";
import CameraCapture from "@/components/CameraCapture.vue";
import { useI18n } from "vue-i18n";
import { useAccountStore } from "@/stores/account";
import { storeToRefs } from "pinia";
const acctStore = useAccountStore();
const { temporaryProfilePictureURL } = storeToRefs(acctStore);
const { t } = useI18n();
const photoStep = ref(1);
const photoSelectionTab = ref(0);
const photoFile = ref<File>();
// const photoFileURL = ref("");
const cropDataURL: Ref<string | null> = ref(null);
const cameraCapture = useTemplateRef("cameraCapture");
const photoCropper = useTemplateRef<typeof Cropper>("cropper");
const croppedSize = ref(240);
const emit = defineEmits<{ (e: "changed", url: string): void }>();
watch(
  () => photoFile.value,
  (phFile: File | undefined) => {
    if (phFile) {
      const url = URL.createObjectURL(phFile);
      temporaryProfilePictureURL.value = url;
      console.debug(`File ${phFile.name} with URL ${url}`);
    } else {
      temporaryProfilePictureURL.value = "";
    }
  }
);

watch(
  () => photoSelectionTab.value,
  (tab: number) => {
    console.debug(`Selection changed to ${tab}`);

    if (tab !== 0) cameraCapture.value?.stopCamera();
    else cameraCapture.value?.startCamera();
  }
);

function setPhotoURL(s: string | null) {
  console.debug(`Handling photo-selected event`, s);
  temporaryProfilePictureURL.value = s ?? "";
  // photoStep.value = 2;
}

function doCrop() {
  const { coordinates, canvas } = photoCropper.value.getResult();
  croppedSize.value = coordinates.width;
  // console.debug(coordinates, canvas);
  cropDataURL.value = canvas.toDataURL();
}

function nextAction() {
  if (photoStep.value === 1 && temporaryProfilePictureURL.value.length > 0)
    photoStep.value = 2;
  else if (photoStep.value === 2 && cropDataURL.value?.length) {
    emit("changed", cropDataURL.value!);
  }
}
// function prepareCrop(hasPhoto: boolean) {
//   console.debug("Image was captured", hasPhoto);
// }
</script>
