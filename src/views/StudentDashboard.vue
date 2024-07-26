<template>
  <p class="text-h5">Student Dashboard here</p>
  <ul>
    <li>
  Active studio: {{ activeStudioName }}</li>
  <li>My name: {{  participantName }}</li>
</ul>
Message: {{ incomingMessage }}
<v-btn size="small" @click="() => {router.back()}">Back to Main</v-btn>
<v-btn @click="leaveCurrentStudio">Leave</v-btn>
</template>
<script setup lang="ts">
import { useStudentStudioStore } from '@/stores/studio';
import { storeToRefs } from 'pinia';
import { watch } from 'vue';
import { useRouter } from 'vue-router';
const store = useStudentStudioStore()
const router = useRouter()
const { activeStudioName, participantName, incomingMessage } = storeToRefs(store)

watch(() => activeStudioName.value, (newName, oldName) => {
  if (newName === null && oldName !== null) {
    router.back()
  }
})
async function leaveCurrentStudio() {
  console.debug(`${participantName.value} is about to leave ${activeStudioName.value}`)
  const isSuccess = await store.leaveStudio()
  if (isSuccess)
    router.back()
  else {

  }
}
</script>