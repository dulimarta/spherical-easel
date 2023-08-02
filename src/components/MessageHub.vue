<template>
  <div id="msghub">
    <v-btn icon size="small" variant="text" @click="notifyMe = !notifyMe">
      <v-icon v-if="notifyMe">mdi-bell</v-icon>
      <v-icon v-else>mdi-bell-off</v-icon>
    </v-btn>
    <span>
      <!-- Message filter -->
      <v-badge
        :content="selectedMessageType.length"
        v-if="selectedMessageType.length !== messageTypes.length">
        <v-icon id="filter-menu-popup">mdi-filter</v-icon>
      </v-badge>
      <v-icon v-else id="filter-menu-popup">mdi-filter</v-icon>
      <v-tooltip
        activator="#filter-menu-popup"
        v-if="selectedMessageType.length !== messageTypes.length">
        {{ selectedMessageType.map(s => s.toUpperCase()).join(", ") }}
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
    </span>
    <span id="msg-display-area" style="height: 62px">
      <!-- The actual messages -->
      <!-- <v-slide-x-transition> -->
      <v-alert
        v-if="notifyMe"
        :key="currentMsg.key"
        class="my-1 py-0"
        border="start"
        variant="text"
        :border-color="alertType(currentMsg)"
        :type="alertType(currentMsg)"
        max-height="60px"
        :closable="filteredMessages.length > 0"
        :icon="currentMsg.type"
        :text="pretty(currentMsg)"
        v-on:update:model-value="deleteMessageByIndex(0)"></v-alert>

      <!-- </v-slide-x-transition> -->
      <v-alert
        v-else
        color="grey"
        :text="t('msgDisabled')"
        class="text-white"></v-alert>
    </span>
    <span>
      <!-- Expand/collapse list of messages -->
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
              border="end"
              variant="outlined"
              :border-color="alertType(msg)"
              v-for="(msg, index) in filteredMessages"
              :key="`${msg.key}-${index}`"
              closable
              :icon="iconType(msg)"
              :type="alertType(msg)"
              :text="pretty(msg)"
              v-on:update:model-value="deleteMessageByIndex(index)"></v-alert>
          </v-card-text>
        </v-card>
      </v-menu>
      <v-btn
        id="msg-popup"
        flat
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
    </span>
    <!-- Delete messages -->
    <v-btn
      flat
      icon
      size="small"
      :disabled="messages.length === 0"
      @click="tryDeleteMessages">
      <v-badge :content="messages.length" v-if="messages.length > 0">
        <v-icon>mdi-trash-can</v-icon>
      </v-badge>
      <v-icon v-else>mdi-trash-can</v-icon>
    </v-btn>
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

function doSelectAllMessageType() {
  if (showAllType.value) {
    selectedMessageType.value.splice(0);
    selectedMessageType.value.push(...SETTINGS.messageTypes);
  }
}

const currentMsg = computed(
  (): MessageType =>
    filteredMessages.value.length > 0
      ? filteredMessages.value[0]
      : {
          type: "info",
          key: t("noMessages"),
          secondaryMsg: "",
          secondaryMsgKeyOptions: "",
          timestamp: 0
        }
);

function shortMessage(m: MessageType): string {
  return t(m.key, m.keyOptions);
}
function iconType(m: MessageType): string {
  return m.type === "directive" ? "mdi-lightbulb" : (m.type as AlertType);
}
function alertType(m: MessageType): AlertType {
  return m.type === "directive" ? "success" : (m.type as AlertType);
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
  m.timestamp = Date.now(); // Get the timestamp that the message occurred at so it can be deleted if needed.
  messages.value.unshift(m); // Add the new message to the beginning of the array
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
  width: 35em;
  overflow-y: auto;
}

#msghub {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 64px;
  margin: auto; /* place this center in its parent */
  padding: 0;
  border: 1px solid white;
  border-radius: 8px;
  background-color: white;
  align-content: center;
  display: flex;

  box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
}
</style>
<i18n locale="en">
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
  "warning": "Warning"
}
</i18n>
<i18n locale="id">
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
