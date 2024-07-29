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
    <v-tooltip
      activator="#teacher-studio"
      :text="myStudio ? `Studio: ${myStudio.name}` : 'Create a Studio'"></v-tooltip>
  </template>
  <v-btn v-if="myStudio === null"
    id="student-studio"
    @click="prepareToJoinStudio"
    size="x-small"
    icon
    color="green">
    <v-icon>mdi-account-school</v-icon>
</v-btn>
  <v-tooltip
    activator="#student-studio"
    :text="
      activeStudioId === null ? 'Join a studio' : `Go to studio ${activeStudioTitle}`
    " />
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
  <Dialog
    ref="studioListDialog"
    title="Select a studio to join"
    yes-text="Cancel"
    max-width="60%">
    <v-text-field
      v-model="participantName"
      variant="outlined"
      label="Your Name"
      hint="Your name as a studio participant" />
    <v-data-table
      :items="availableStudios"
      :headers="tableHeaders"
      item-value="id">
      <template #no-data>No active sessions available</template>
      <template #item.participants="{ value }">
        {{ value.length > 0 ? `${value.length} members` : "None" }}
      </template>
      <template #item.actions="{ item }">
        <v-icon
          @click="joinStudio(item)"
          :disabled="participantName.length < 3">
          mdi-location-enter
        </v-icon>
      </template>
    </v-data-table>
  </Dialog>
</template>
<script lang="ts" setup>
import { ref, Ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useAccountStore } from "@/stores/account";
import Dialog, { DialogAction } from "@/components/Dialog.vue";
import {
  useTeacherStudioStore,
  useStudentStudioStore,
  StudioDetails
} from "@/stores/studio";
const acctStore = useAccountStore();
const teacherStudioStore = useTeacherStudioStore();
const studentStudioStore = useStudentStudioStore();
const router = useRouter();
const { userRole, userDisplayedName } = storeToRefs(acctStore);
const { myStudio } = storeToRefs(teacherStudioStore);
const { activeStudioId, activeStudioTitle } = storeToRefs(studentStudioStore);
const studioName = ref("");
const participantName = ref("");
const availableStudios: Ref<Array<StudioDetails>> = ref([]);
const initiateSessionDialog: Ref<DialogAction | null> = ref(null);
const studioListDialog: Ref<DialogAction | null> = ref(null);
const tableHeaders = [
  { title: "ID", key: "id" },
  { title: "Topic", key: "name" },
  { title: "Instructor", key: "instructor" },
  { title: "Participants", key: "participants" },
  { title: "Join", key: "actions" }
];
onMounted(() => {
  console.debug("Studio Session mounted. User role is", userRole.value);
});
onUnmounted(() => {
  console.debug("Studio Session unmounted");
});
function prepareToLaunchStudio() {
  if (myStudio.value?.id) {
    router.push({
      name: "Teacher Dashboard"
    });
  } else {
    initiateSessionDialog.value!.show();
  }
}

async function doLaunchStudio() {
  initiateSessionDialog.value?.hide();
  const studioID = await teacherStudioStore.createStudio(
    studioName.value,
    userDisplayedName?.value ?? "No Instructor Name"
  );
  // router.push({
  //   name: "Teacher Dashboard"
  //   // params: { studioId: studioID }
  // });
}

async function prepareToJoinStudio() {
  if (activeStudioId.value === null) {
    availableStudios.value = await studentStudioStore.getAvailableStudios();
    studioListDialog.value?.show();
  } else {
    console.debug("Visit my active studio");
    router.push({ path: "/student-dashboard" });
  }
}

function joinStudio(s: StudioDetails) {
  console.debug("Joining a studio", s.id);
  studioListDialog.value?.hide();
  studentStudioStore.joinAsStudent(s.id, s.name, participantName.value);
  // router.push({ path: "/student-dashboard" });
}
// function leaveStudio() {
//   console.debug(`Participant left the studio ${studioID.value} session`);
// }
</script>
