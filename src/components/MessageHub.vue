<template>
  <div id="msghub">
    <v-container class="pa-0">
      <!--Teleport to="#app-messages"-->
      <v-row justify="center" align="center" class="ma-0">
        <!-- <v-col cols="auto">Message filter {{ selectedMessageType }}</v-col> -->
        <v-col cols="auto">
          <v-icon id="filter-menu-popup">mdi-filter</v-icon>
          <v-chip
            v-if="selectedMessageType !== 'all'"
            size="small">
            {{ t(`notifications.${selectedMessageType}`) }}
          </v-chip>
          <v-menu
            v-model="filterMenuVisible"
            activator="#filter-menu-popup"
            :close-on-content-click="false"
            location="top"
            offset="32">
            <v-card class="pa-1">
              <v-card-text>
                Select message type to show
                <v-select
                  density="compact"
                  v-model="selectedMessageType"
                  label="Message filter"
                  :items="messageTypes"
                  item-title="title"
                  item-value="value"></v-select>
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
        <v-col cols="auto">
          <v-btn icon size="small" variant="text" @click="notifyMe = !notifyMe">
            <v-icon v-if="notifyMe">mdi-bell</v-icon>
            <v-icon v-else>mdi-bell-off</v-icon>
          </v-btn>
        </v-col>
        <v-col id="msg-display-area" class="pa-0">
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
            <v-alert v-else text="No messages"></v-alert>
          </v-slide-x-transition>
          </template>
          <v-alert transition="fade-transition"
            v-else
            color="grey"
            text="(Messages disabled)"
            class="text-white"></v-alert>
        </v-col>
        <v-col cols="auto">
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
        <v-col cols="auto">
          <v-btn flat icon size="small" :disabled="messages.length === 0" @click="tryDeleteMessages">
            <v-badge :content="messages.length">
              <v-icon>mdi-trash-can</v-icon>
            </v-badge>
          </v-btn>
        </v-col>
      </v-row>
      <!--/Teleport-->
    </v-container>
  </div>
  <v-snackbar v-model="showPurgeMessages" :timeout="DELETE_DELAY">
    Messages will be deleted
    <template #actions>
      <v-btn @click="cancelDeleteMessages" color="warning">Undo</v-btn>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import EventBus from "@/eventHandlers/EventBus";
import Vue, { ref, Ref, computed, onMounted } from "vue";
import SETTINGS from "@/global-settings";
import { useI18n } from "vue-i18n";

type MessageType = {
  key: string;
  keyOptions?: any;
  secondaryMsg: string;
  secondaryMsgKeyOptions: string;
  type: string;
  timestamp: number;
};
type AlertType = "success" | "info" | "error" | "warning";
// const props = defineProps<{ minified: boolean }>();

const DELETE_DELAY = 3000
const { t } = useI18n();
const filterMenuVisible = ref(false);
const notifyMe = ref(true);
const msgPopupVisible = ref(false);
const showPurgeMessages = ref(false)
const messageTypes = ["all", ...SETTINGS.messageTypes].map((s: string) => ({
  value: s,
  title: t(`notifications.${s}`)
}));
const messages: Ref<MessageType[]> = ref([]);
const selectedMessageType = ref("all");
let deleteTimer: any
onMounted((): void => {
  EventBus.listen("show-alert", addMessage);
});

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
    selectedMessageType.value === "all"
      ? messages.value
      : messages.value.filter(
          (m: MessageType) => m.type === selectedMessageType.value
        )
);

function addMessage(m: MessageType): void {
  // alert(`Type: ${m.type}: ${m.key}`);
  // if (m.key.match(/undefined/)) return;
  // m.translatedKey = t(m.key, m.keyOptions).toString();
  // m.translationSecondKey = t(m.secondaryMsg, m.secondaryMsgKeyOptions); // Translate the secondary message (this is the informational message)

  // m.msgColor = m.type === "directive" ? null : m.type;
  m.timestamp = Date.now(); // Get the timestamp that the message occurred at so it can be deleted if needed.

  messages.value.unshift(m); // Add the new message to the beginning of the array
  // if (messageTimer) {
  // msgDisplayQueue.push(m); // We have an active message on display, push it to the queue
  // } else {
  // Display the current message
  // currentMsg.value = m;
  // showMe.value = true;
  // messageTimer = setInterval(swapMessages, 2000);
  // }
}
/*
async function swapMessages(): Promise<void> {
  console.debug("Swap messages");
  showMe.value = false;
  await Vue.nextTick();
  if (msgDisplayQueue.length > 0) {
    const next = msgDisplayQueue.shift() as MessageType;
    currentMsg.value = next;

    showMe.value = true;
  } else {
    // console.debug("Message queue is empty");
    if (messageTimer) clearInterval(messageTimer);
    messageTimer = null;
  }
}
**/
function deleteMessageByIndex(pos: number) {
  messages.value.splice(pos, 1);

  if (msgPopupVisible.value && messages.value.length === 0)
    msgPopupVisible.value = false;
}

function tryDeleteMessages() {
  showPurgeMessages.value = true
  deleteTimer = setTimeout(() => {
    messages.value.splice(0)
    deleteTimer = null
  }, DELETE_DELAY)
}
function cancelDeleteMessages() {
  if (deleteTimer) {
    clearTimeout(deleteTimer)
    deleteTimer = null
  }
  showPurgeMessages.value = false
}
</script>
<style scoped>
#msg-display-area {
  /* background-color: blue; */
  /* padding: 4px; */
  height: 60px;
  overflow-y: auto;
}
#msghub {
  position: fixed;
  bottom: 4px;
  width: 64%;
  margin: auto;
  padding: 0;
  border: 1px solid gray;
}
</style>
