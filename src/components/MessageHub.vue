<template>
  <div id="msghub">
    <!-- Enable/Disable notification -->
    <v-btn
      icon
      size="small"
      @click="notifyMe = !notifyMe"
      color="green-lighten-2">
      <v-icon v-if="notifyMe">mdi-bell</v-icon>
      <v-icon v-else>mdi-bell-off</v-icon>
    </v-btn>
    <!-- Message filter -->
    <!--v-badge
            :content="selectedMessageType.length"
            v-if="selectedMessageType.length !== messageTypes.length">
            <v-icon id="filter-menu-popup">mdi-filter</v-icon>
          </!--v-badge-->
    <div>
      <v-btn id="filter-menu-popup" icon size="small" color="green-lighten-2">
        <v-icon>mdi-filter</v-icon>
      </v-btn>
      <v-tooltip activator="#filter-menu-popup">
        {{ selectedMessageType.map(s => titleCase(s)).join(", ") }}
      </v-tooltip>
      <v-menu
        v-model="filterMenuVisible"
        activator="#filter-menu-popup"
        :close-on-content-click="false"
        location="top"
        offset="32">
        <v-card class="pa-1">
          <v-card-title v-t="'selectMsgType'"></v-card-title>
          <v-card-text>
            <v-checkbox
              :label="t('selectAll')"
              v-model="showAllType"
              @update:model-value="doSelectAllMessageType" />
            <div style="display: flex">
              <v-checkbox
                v-model="selectedMessageType"
                class="mx-2"
                v-for="mt in messageTypes"
                :value="mt.value"
                :label="mt.title"
                density="compact"
                direction="horizontal"></v-checkbox>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              variant="outlined"
              density="comfortable"
              @click="filterMenuVisible = false">
              OK
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-menu>
    </div>
    <div :style="{ flexGrow: 1 }">
      <template v-if="notifyMe">
        <v-alert
          height="3em"
          v-if="currentMsg"
          :key="currentMsg.key"
          class="my-1 py-0 text-caption"
          border="start"
          variant="outlined"
          :border-color="alertType(currentMsg)"
          :color="alertType(currentMsg)"
          density="compact"
          closable
          :text="pretty(currentMsg)"
          v-on:update:model-value="deleteMessageByIndex(0)"></v-alert>
        <v-alert v-else :text="t('noMessages')"></v-alert>
      </template>
      <v-alert
        transition="fade-transition"
        v-else
        color="grey"
        :text="t('msgDisabled')"
        class="text-white"></v-alert>
    </div>
    <v-btn
      id="msg-popup"
      color="green-lighten-2"
      icon
      :disabled="filteredMessages.length == 0"
      size="small">
      <v-icon v-if="msgPopupVisible">mdi-triangle-down</v-icon>
      <v-badge
        v-else-if="filteredMessages.length > 1"
        :content="filteredMessages.length">
        <v-icon>mdi-triangle</v-icon>
      </v-badge>
      <v-icon v-else>mdi-triangle</v-icon>
    </v-btn>
    <v-menu
      v-model="msgPopupVisible"
      activator="#msg-popup"
      :close-on-content-click="false"
      location="top"
      contained>
      <v-card class="bg-white" :max-width="600">
        <v-card-text>
          <v-alert
            class="my-1 py-0"
            border="start"
            variant="outlined"
            :border-color="alertType(msg)"
            v-for="(msg, index) in filteredMessages"
            :key="`${msg.key}-${index}`"
            density="compact"
            :icon="iconType(msg)"
            :type="alertType(msg)"
            :text="pretty(msg)"
            v-on:update:model-value="deleteMessageByIndex(index)"></v-alert>
        </v-card-text>
      </v-card>
    </v-menu>
    <v-btn
      icon
      color="green-lighten-2"
      size="small"
      :disabled="messages.length === 0"
      @click="tryDeleteMessages">
      <v-badge :content="messages.length" v-if="messages.length > 0">
        <v-icon>mdi-trash-can</v-icon>
      </v-badge>
      <v-icon v-else>mdi-trash-can</v-icon>
    </v-btn>
    <!--v-tooltip activator="#filter-menu-popup">
            {{ selectedMessageType.map(s => s.toUpperCase()).join(", ") }}
          </!--v-tooltip-->
  </div>
  <v-snackbar v-model="showPurgeMessages" :timeout="DELETE_DELAY">
    {{ t("deleteWarning") }}
    <template #actions>
      <v-btn @click="cancelDeleteMessages" color="warning">
        {{ t("undo") }}
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import EventBus from "@/eventHandlers/EventBus";
import { ref, Ref, computed, onMounted } from "vue";
import SETTINGS from "@/global-settings";
import { useI18n } from "vue-i18n";
import { watch } from "vue";

type MessageType = {
  key: string;
  keyOptions?: any;
  secondaryMsg: string;
  secondaryMsgKeyOptions: string;
  type: string;
  timestamp: number;
};
type AlertType = "success" | "info" | "error" | "warning";

const DELETE_DELAY = 3000;
const { t } = useI18n({ useScope: "local" });
const filterMenuVisible = ref(false);
const notifyMe = ref(true);
const msgPopupVisible = ref(false);
const showPurgeMessages = ref(false);
const showAllType = ref(true);

const messageTypes = computed(() =>
  SETTINGS.messageTypes.map((s: string) => ({
    value: s,
    title: t(s)
  }))
);
const selectedMessageType: Ref<Array<string>> = ref(
  messageTypes.value.map(m => m.value)
);
const messages: Ref<MessageType[]> = ref([]);
let deleteTimer: any;

onMounted((): void => {
  EventBus.listen("show-alert", addMessage);
});

watch(
  () => selectedMessageType.value,
  filtered => {
    if (filtered.length !== SETTINGS.messageTypes.length) {
      showAllType.value = false;
    }
  }
);

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.substring(1);
}
function doSelectAllMessageType() {
  if (showAllType.value) {
    selectedMessageType.value.splice(0);
    selectedMessageType.value.push(...SETTINGS.messageTypes);
  }
}
const currentMsg = computed((): MessageType | null =>
  filteredMessages.value.length > 0 ? filteredMessages.value[0] : null
);

function shortMessage(m: MessageType): string {
  return t(m.key, m.keyOptions);
}
function iconType(m: MessageType): string {
  return m.type === "directive" ? "mdi-lightbulb" : (m.type as AlertType);
}
function alertType(m: MessageType): AlertType {
  return m.type === "directive" ? "info" : (m.type as AlertType);
}
function pretty(m: MessageType): string {
  let str = t(m.key, m.keyOptions);
  if (m.secondaryMsg)
    str = str.concat(": " + t(m.secondaryMsg, m.secondaryMsgKeyOptions));
  return str;
}
const filteredMessages = computed(
  (): Array<MessageType> =>
    selectedMessageType.value.length === SETTINGS.messageTypes.length
      ? messages.value
      : messages.value.filter((m: MessageType) =>
          selectedMessageType.value.includes(m.type)
        )
);

function addMessage(m: MessageType): void {
  if (m.type !== "directive") {
    m.timestamp = Date.now(); // Get the timestamp that the message occurred at so it can be deleted if needed.
    messages.value.unshift(m); // Add the new message to the beginning of the array
  }
}

function deleteMessageByIndex(pos: number) {
  messages.value.splice(pos, 1);

  if (msgPopupVisible.value && messages.value.length === 0)
    msgPopupVisible.value = false;
}

function tryDeleteMessages() {
  showPurgeMessages.value = true;
  deleteTimer = setTimeout(() => {
    messages.value.splice(0);
    deleteTimer = null;
  }, DELETE_DELAY);
}
function cancelDeleteMessages() {
  if (deleteTimer) {
    clearTimeout(deleteTimer);
    deleteTimer = null;
  }
  showPurgeMessages.value = false;
}
</script>
<style scoped>
#msg-display-area {
  /* padding: 4px; */
  overflow-y: auto;
}

#msghub {
  display: flex;
  flex-direction: row;
  height: 3.5em;
  gap: 4px;
  padding: 0;
  border-radius: 8px;
  align-items: center;
}
</style>
<i18n locale="en" lang="json">
{
  "all": "All",
  "deleteMsg": "Delete {msgType} messages",
  "deleteWarning": "Messages will be deleted",
  "directive": "Directive",
  "error": "Error",
  "info": "Informational",
  "noMessages": "No messages",
  "msgDisabled": "(Messages disabled)",
  "selectAll": "Select All Type",
  "selectMsgType": "Select Message Type",
  "success": "Success",
  "undo": "Undo",
  "warning": "Warning",
  "moveHandlerNothingSelected": "No object selected. Rotating Sphere.",
  "selectionUpdateNothingSelected": "No objects selected.",
  "selectionUpdate": "Selection Update: {number} objects selected. Hold the Alt/Option key to add or subtract from the current selection.",
  "circleCenterSelected": "Center of circle selected. Now select a point on the circle.",
  "ellipseInitiallyToSmall": "To create an ellipse initially you must select a point on the ellipse that is further away from each focus. Select a different location further from the foci.",
  "ellipseFocus1Selected": "One focus of the ellipse selected. Now select a second non-antipodal focus.",
  "ellipseAntipodalSelected": "The foci of an ellipse are not allowed to be antipodal or identical. Select another location.",
  "ellipseFocus2Selected": "All foci of the ellipse selected. Now select a point on the ellipse.",
  "ellipseCreationAttemptDuplicate": "There is already an ellipse with these foci and angle sum.",
  "newPolygonAdded": "A new polygon was created.",
  "previouslyMeasuredPolygon": "This polygon was measured previously.  See measurement {token}.",
  "duplicateSegmentAngleMeasurement": "The angle between segments {seg0Name} and {seg1Name} has already been measured. This angle is measurement {measurementName}.","duplicateSegmentLineAngleMeasurement": "The angle between segment {segName} and line {lineName} has already been measured. This angle is measurement {measurementName}.",
  "selectMorePoints": "Select {needed} more point(s).",
  "newAngleAdded": "New angle measure added."
}
</i18n>
<i18n locale="id" lang="json">
{
  "all": "Semua Pesan",
  "deleteMsg": "Hapus Pesan Jenis {msgType}",
  "deleteWarning": "Pesan-pesan akan dihapus",
  "directive": "Petunjuk",
  "error": "Kesalahan",
  "info": "Informasional",
  "noMessages": "Tidak ada pesan",
  "selectAll": "Pilih semua jenis pesan",
  "selectMsgType": "Pilih Jenis Pesan",
  "success": "Sukses",
  "undo": "Urung",
  "warning": "Peringatan"
}
</i18n>
