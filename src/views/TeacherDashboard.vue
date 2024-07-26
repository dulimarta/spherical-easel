<template>
  <p class="text-h5">Teacher Studio Dashboard</p>
  <ul>
    <li>Name: {{ userDisplayedName }}</li>
    <li>Studio ID: <code>{{ myStudio?.id }}</code></li>
    <li>Participants: {{ myStudio?.participants.join(", ") }}</li>
  </ul>
  <v-textarea rows="3" outlined color="secondary" class="ma-3"></v-textarea>
  <v-btn size="small" @click="broadcastMessage">Broadcast</v-btn>
</template>
<script setup lang="ts">
import { ref } from "vue"
import { useTeacherStudioStore } from "@/stores/studio"
import { storeToRefs } from "pinia";
import { useAccountStore } from "@/stores/account";
import { onMounted } from "vue";
const studioStore = useTeacherStudioStore()
const acctStore = useAccountStore()
// type ComponentProps = {
//   studioId: string
// }
// const props = defineProps<ComponentProps>()
const { myStudio } = storeToRefs(studioStore)
const { userDisplayedName, userEmail, userProfilePictureURL} = storeToRefs(acctStore)
const message = ref("")

onMounted(() => {
  // if (userEmail.value) {
  //   studioStore.createStudio(userEmail.value)
  // }
})

function broadcastMessage() {

}
</script>