<template>
  <p class="text-h5">Student Dashboard here</p>
  <ul>
    <li>
  Active studio: {{ activeStudioName }}</li>
  <li>My name: {{  participantName }}</li>
</ul>
<v-btn @click="leaveCurrentStudio">Leave</v-btn>
</template>
<script setup lang="ts">
import { useStudentStudioStore } from '@/stores/studio';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
const store = useStudentStudioStore()
const router = useRouter()
const { activeStudioName, participantName } = storeToRefs(store)

async function leaveCurrentStudio() {
  console.debug(`${participantName.value} is about to leave ${activeStudioName.value}`)
  await store.leaveStudio()
  router.back()
}
</script>