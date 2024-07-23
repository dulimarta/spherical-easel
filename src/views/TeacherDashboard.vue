<template>
  <p class="text-h5">Teacher Studio Dashboard</p>
  <ul>
    <li>Name: {{ userDisplayedName }}</li>
    <li>Studion ID: {{ props.studioId }}</li>
  </ul>
  <v-textarea rows="3" outlined color="secondary" class="ma-3"></v-textarea>
  <v-btn size="small" @click="broadcastMessage">Broadcast</v-btn>
</template>
<script setup lang="ts">
import { ref } from "vue"
import { useStudioStore } from "@/stores/sd"
import { storeToRefs } from "pinia";
import { useAccountStore } from "@/stores/account";
import { onMounted } from "vue";
const studioStore = useStudioStore()
const acctStore = useAccountStore()
type ComponentProps = {
  studioId: string
}
const props = defineProps<ComponentProps>()
const { socketID } = storeToRefs(studioStore)
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