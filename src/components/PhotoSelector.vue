<template>
  <v-stepper v-model="photoStep" :items="['Select Photo', 'Crop']">
    <template #item.1>
      Create photo from camera or upload from a file

      <v-tabs v-model="photoSelectionTab">
        <v-tab>Live Camera</v-tab>
        <v-tab>Photo File</v-tab>
      </v-tabs>
      <v-tabs-window v-model="photoSelectionTab">
        <v-tabs-window-item>
          <CameraCapture @photo-selected="setPhotoURL" />
        </v-tabs-window-item>
        <v-tabs-window-item>
          <h3>Select an image (.PNG, .JPG, .GIF, etc.)</h3>
          <v-file-input
            show-size
            accept="image/*"
            :multiple="false"
            v-model="photoFile"></v-file-input>
          <img :src="photoFileURL" width="100%" />
        </v-tabs-window-item>
      </v-tabs-window>
    </template>
    <template #item.2>
      <Cropper
        :src="photoFileURL"
        :stencil-props="{
          aspectRatio: 1
        }" />
    </template>
    <template #item.3>Use It</template>
    <!--template #actions="{ prev, next }">
      Current step {{ photoStep }}
      <div
        class="ma-2"
        :style="{ display: 'flex', justifyContent: 'space-between' }">
        <v-btn @click="prev" :disabled="photoStep === 1">Previous</v-btn>
        <v-btn
          @click="next"
          :disabled="photoStep === 1 && photoFileURL.length === 0">
          {{ photoStep === 1 ? "Capture & Crop" : "Use Photo" }}
        </v-btn>
      </div>
    </template-->
  </v-stepper>
</template>
<script setup lang="ts">
import { watch, ref } from "vue";
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";
import CameraCapture from "@/components/CameraCapture.vue";
const photoStep = ref(1);
const photoSelectionTab = ref(0);
const photoFile = ref<File>();
const photoFileURL = ref("");
watch(
  () => photoFile.value,
  (phFile: File | undefined) => {
    if (phFile) {
      const url = URL.createObjectURL(phFile);
      photoFileURL.value = url;
      console.debug(`File ${phFile.name} with URL ${url}`);
    } else {
      photoFileURL.value = "";
    }
  }
);

function setPhotoURL(s: string) {
  console.debug(`Handling photo-selected event`, s);
  photoFileURL.value = s;
  photoStep.value = 2;
}
</script>
