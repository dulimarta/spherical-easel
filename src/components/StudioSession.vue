<template>
  <template v-if="userRole === 'instructor'">
    <v-btn
      id="teacher-studio"
      @click="prepareToLaunchStudio"
      size="x-small"
      icon
      color="orange">
      <v-icon>mdi-human-male-board</v-icon>
    </v-btn>
  </template>
  <template v-else>
    <v-btn id="student-studio" @click="prepareToJoinStudio" size="x-small" icon color="green">
      <v-icon>mdi-account-school</v-icon>
    </v-btn>
  </template>
  <v-tooltip
    activator="#teacher-studio"
    :text="studioID ? 'Studio Dashboard' : 'Create a Studio'"></v-tooltip>
  <v-tooltip activator="#student-studio" text="Join a studio" />
  <Dialog
    ref="initiateSessionDialog"
    title="New Studio"
    max-width="50%"
    yes-text="Create"
    no-text="Cancel"
    :yes-action="doLaunchStudio">
    <v-text-field
      v-model="studioName"
      name="What is this"
      label="Studio Name"
      id="id"></v-text-field>
  </Dialog>
</template>
<script lang="ts" setup>
import { ref, Ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useAccountStore } from "@/stores/account";
import Dialog, { DialogAction } from "@/components/Dialog.vue";
import { useStudioStore } from "@/stores/sd";
const acctStore = useAccountStore();
const studioStore = useStudioStore();
const router = useRouter();
const { userRole, userDisplayedName } = storeToRefs(acctStore);
const { socketID } = storeToRefs(studioStore);
const studioID: Ref<string | undefined> = ref(undefined);
const studioName = ref("");
const initiateSessionDialog: Ref<DialogAction | null> = ref(null);
onMounted(() => {
  console.debug("Studio Session mounted. User role is", userRole.value);
});
onUnmounted(() => {
  console.debug("Studio Session unmounted");
});
function prepareToLaunchStudio() {
  if (studioID.value) {
    router.push({
      name: "Teacher Dashboard"
    });
  } else {
    initiateSessionDialog.value!.show();
  }
}

async function doLaunchStudio() {
  initiateSessionDialog.value?.hide();
  studioID.value = await studioStore.createStudio(
    studioName.value,
    userDisplayedName?.value ?? "No Instructor Name"
  );
  router.push({
    name: "Teacher Dashboard",
    params: { studioId: studioID.value }
  });
}

function prepareToJoinStudio() {
  console.debug("StudioSession::preparetoJoin")
  studioStore.getAvailableStudios();
}

function joinStudio(id: string) {}
</script>
