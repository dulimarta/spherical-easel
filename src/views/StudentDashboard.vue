<template>
  <p class="text-h5">Student Dashboard here</p>
  <ul>
    <li>Active studio: {{ activeStudioTitle }} ({{ activeStudioId }})</li>
    <li>My name: {{ participantName }}</li>
  </ul>
  <div class="my-3">Message: {{ incomingMessage }}</div>
  <v-btn
    size="small"
    @click="
      () => {
        router.back();
      }
    ">
    Back to Main
  </v-btn>
  <v-btn size="small" @click="leaveCurrentStudio">Leave</v-btn>
</template>
<script setup lang="ts">
import { useStudentStudioStore } from "@/stores/studio";
import { storeToRefs } from "pinia";
import { watch } from "vue";
import { useRouter } from "vue-router";
const store = useStudentStudioStore();
const router = useRouter();
const { activeStudioId, activeStudioTitle, participantName, incomingMessage } =
  storeToRefs(store);

watch(
  () => activeStudioId.value,
  (newName, oldName) => {
    if (newName === null && oldName !== null) {
      router.back();
    }
  }
);
async function leaveCurrentStudio() {
  console.debug(
    `${participantName.value} is about to leave ${activeStudioTitle.value}`
  );
  const isSuccess = await store.leaveStudio();
  if (isSuccess) router.back();
  else {
  }
}
</script>
