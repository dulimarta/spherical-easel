<template>
  <div id="msghub">
    <v-container class="pa-0">
      <!--Teleport to="#app-messages"-->
      <v-row justify="center" align="center" class="ma-0">
        <!-- <v-col cols="auto">Message filter {{ selectedMessageType }}</v-col> -->
        <v-col cols="auto" class="pa-0">
          <v-btn icon size="small" variant="text" @click="notifyMe = !notifyMe">
            <v-icon v-if="notifyMe">mdi-bell</v-icon>
            <v-icon v-else>mdi-bell-off</v-icon>
          </v-btn>
        </v-col>
        <v-col cols="auto">
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
                <!--v-select
                  density="compact"
                  v-model="selectedMessageType"
                  label="Message filter"
                  :items="messageTypes"
                  item-title="title"
                  item-value="value"></!--v-select-->
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
        </v-col>
        <v-col id="msg-display-area" class="pa-0 ma-0">
          <template v-if="notifyMe">
            <v-slide-x-transition>
              <v-alert
                v-if="currentMsg"
                :key="currentMsg.key"
                class="my-1 py-0"
                border="end"
                variant="outlined"
                :border-color="alertType(currentMsg)"
                :type="alertType(currentMsg)"
                density="compact"
                closable
                :icon="currentMsg.type"
                :text="pretty(currentMsg)"
                v-on:update:model-value="deleteMessageByIndex(0)"></v-alert>
              <v-alert v-else :text="t('noMessages')"></v-alert>
            </v-slide-x-transition>
          </template>
          <v-alert
            transition="fade-transition"
            v-else
            color="grey"
            text="(Messages disabled)"
            class="text-white"></v-alert>
        </v-col>
        <v-col cols="auto" class="pa-0">
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
                  density="compact"
                  closable
                  :type="alertType(msg)"
                  :text="pretty(msg)"
                  v-on:update:model-value="
                    deleteMessageByIndex(index)
                  "></v-alert>
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
        </v-col>
        <v-col cols="auto" class="pa-0 mx-1">
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
        </v-col>
      </v-row>
      <!--/Teleport-->
    </v-container>
  </div>
  <v-snackbar v-model="showPurgeMessages" :timeout="DELETE_DELAY">
    {{ t("deleteWarning") }}
    <template #actions>
      <v-btn @click="cancelDeleteMessages" color="warning">{{t('undo')}}</v-btn>
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
const { t } = useI18n();
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
const currentMsg = computed((): MessageType | null =>
  filteredMessages.value.length > 0 ? filteredMessages.value[0] : null
);

function shortMessage(m: MessageType): string {
  return t(m.key, m.keyOptions);
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
  /* background-color: blue; */
  /* padding: 4px; */
  width: 40em;
  height: 60px;
  overflow-y: auto;
}
#msghub {
  width: 80%;
  margin: auto; /* place this center in its parent */
  padding: 0;
  border: 1px solid gray;
}
</style>
<i18n lang="yaml">
en:
  all: "All"
  deleteMsg: "Delete {msgType} messages"
  deleteWarning: "Messages will be deleted"
  directive: "Directive"
  error: "Error"
  info: "Informational"
  noMessages: "No messages"
  selectAll: "Select All Type"
  selectMsgType: "Select Message Type"
  success: "Success"
  undo: "Undo"
  warning: "Warning"
id:
  all: "Semua Pesan"
  deleteMsg: "Hapus Pesan Jenis {msgType}"
  deleteWarning: "Pesan-pesan akan dihapus"
  directive: "Petunjuk"
  error: "Kesalahan"
  info: "Informasional"
  noMessages: "Tidak ada pesan"
  selectAll: "Pilih semua jenis pesan"
  selectMsgType: "Pilih Jenis Pesan"
  success: "Sukses"
  undo: "Urung"
  warning: "Peringatan"
</i18n>