<template>
  <div id="msghub">
    <div v-if="minified">
      <v-snackbar
        v-if="currentMsg"
        v-model="showMe"
        top
        right
        :timeout="2000"
        class="mt-10">
        {{ currentMsg.translatedKey }}

        <span v-if="currentMsg.translationSecondKey">
          : {{ currentMsg.translationSecondKey }}
        </span>
      </v-snackbar>
    </div>
    <v-container id="scroll-target" v-else-if="messages.length > 0">
      <v-row align="baseline">
        <v-col cols="auto">Message filter</v-col>
        <v-col>
          <v-select dense v-model="selectedMessageType" :items="messageTypes">
            <template #item="{ item }">
              {{ $t(`notifications.${item}`) }}
            </template>
          </v-select>
        </v-col>
      </v-row>
      <v-row justify="end">
        <v-col md="12">
          <v-btn small @click="deleteAllMessages" color="error">
            {{
              $t("notifications.deleteMsg", {
                msgType: $t(`notifications.${selectedMessageType}`).toString()
              })
            }}
            ({{ filteredMessages.length }})
          </v-btn>
        </v-col>
      </v-row>
      <v-layout column>
        <v-card
          dismissible
          dense
          class="my-1"
          v-for="(notif, index) in filteredMessages"
          :key="index">
          <v-container>
            <v-row>
              <v-col cols="10">
                {{ notif.translatedKey }}
                <span v-if="notif.translationSecondKey">
                  : {{ notif.translationSecondKey }}
                </span>
              </v-col>
              <v-col cols="1">
                <v-btn icon @click="deleteMessageByIndex(index)">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-card>
      </v-layout>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import Vue, { ref, Ref, computed } from "vue";
import SETTINGS from "@/global-settings";
import EventBus from "@/eventHandlers/EventBus";
import { useI18n } from "vue-i18n";
import { onMounted } from "vue";

type MessageType = {
  key: string;
  keyOptions?: any;
  secondaryMsg: string;
  secondaryMsgKeyOptions: string;
  type: string;
  translatedKey?: string;
  translationSecondKey?: string;

  msgColor: string | null;
  index: number;
  timestamp: number;
};

const props = defineProps<{ minified: boolean }>();
const { t } = useI18n();
const showMe = ref(false);
const messageTypes = ["all", ...SETTINGS.messageTypes];
const currentMsg: Ref<MessageType | null> = ref(null);
const msgDisplayQueue: MessageType[] = []; // Queue of messages that are displayed when notifications panel is minified
const messages: Ref<MessageType[]> = ref([]);
const selectedMessageType = ref(messageTypes[0]);
let messageTimer: any | null = null;

onMounted((): void => {
  EventBus.listen("show-alert", addMessage);
});

const filteredMessages = computed(() => {
  console.debug("Selected message", selectedMessageType);
  return messages.value.filter(m => {
    return (
      selectedMessageType.value === messageTypes[0] ||
      selectedMessageType.value === m.type
    );
  });
});

function addMessage(m: MessageType): void {
  if (m.key.match(/undefined/)) return;
  m.translatedKey = t(m.key, m.keyOptions).toString();
  m.translationSecondKey = t(m.secondaryMsg, m.secondaryMsgKeyOptions); // Translate the secondary message (this is the informational message)

  m.msgColor = m.type === "directive" ? null : m.type;
  m.timestamp = Date.now(); // Get the timestamp that the message occurred at so it can be deleted if needed.

  messages.value.unshift(m); // Add the new message to the beginning of the array
  if (messageTimer) {
    msgDisplayQueue.push(m); // We have an active message on display, push it to the queue
  } else {
    // Display the current message
    currentMsg.value = m;
    showMe.value = true;
    messageTimer = setInterval(swapMessages, 2000);
  }
}

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

function deleteMessageByIndex(pos: number) {
  messages.value.splice(pos, 1); // Remove individual message from notifications list
}

function deleteAllMessages() {
  messages.value.splice(0);
}
</script>
<style>
#scroll-target {
  max-height: 400px;
}
#msghub {
  /* border: 1px solid red; */
  width: 100%;
}
</style>
