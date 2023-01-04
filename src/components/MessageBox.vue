<template>
  <transition>
    <!-- If the notifications panel is open, then display the messages from the messages array, not the queue.-->
    <div
      v-if="!minified"
      key="full"
      style="height: 100%; overflow: auto"
      @mouseenter="() => {}"
      @mouseleave="() => {}">
      <v-divider></v-divider>
      <v-container
        id="scroll-target"
        style="max-height: 400px"
        class="scroll-y">
        <v-row>
          <v-select dense v-model="selectedMessageType" :items="messageTypes">
            <template v-slot:selection="{ item }">
              {{ $t(`notifications.${item}`) }}
            </template>
            <template v-slot:item="{ item }">
              {{ $t(`notifications.${item}`) }}
            </template>
          </v-select>
        </v-row>
        <v-row cols="12" justify="end">
          <v-col md="12">
            <v-btn color="error" @click="filterMessage" small>{{
              $t(`notifications.deleteMsg`, {
                msgType: $t(`notifications.${selectedMessageType}`).toString()
              })
            }}</v-btn>
          </v-col>
        </v-row>
        <v-layout column style="height: 50vh">
          <v-card
            dark
            class="my-1"
            v-for="(notif, index) in messages"
            :key="index"
            :color="`${notif.msgColor}`">
            <v-row class="pa-2">
              <v-col>
                <span
                  :class="[
                    notif.type == 'directive'
                      ? 'font-weight-bold'
                      : 'font-weight-regular'
                  ]"
                  v-if="notif.translatedKey">
                  {{ notif.translatedKey }}</span
                >
                <span v-if="notif.translationSecondKey"
                  >: {{ notif.translationSecondKey }}</span
                >
              </v-col>
              <v-col cols="2">
                <v-btn
                  class="float-end"
                  @click="
                    () => {
                      messages.splice(index, 1); // Remove individual message from notifications list
                    }
                  "
                  icon>
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </v-col>
            </v-row>
          </v-card>
        </v-layout>
      </v-container>
    </div>
    <!-- If the notifications panel is minimized, then display the messages queue.-->
    <div v-else>
      <v-btn
        v-on:click="$emit('toggle-notifications-panel')"
        key="partial"
        plain
        depressed
        class="pa-0 mx-0">
        <v-icon>$notifications </v-icon>
      </v-btn>
      <v-snackbar
        v-if="currentMsg"
        v-model="showMe"
        top
        right
        :color="`${currentMsg.msgColor}`"
        :timeout="timeoutValue"
        class="mt-10 mr-15">
        <v-row justify="center">
          <v-col cols="10">
            <span
              :class="[
                currentMsg.type == 'directive'
                  ? 'font-weight-bold'
                  : 'font-weight-regular'
              ]"
              v-if="currentMsg.translatedKey">
              {{ currentMsg.translatedKey }}</span
            >
            <span v-if="currentMsg.translationSecondKey"
              >: {{ currentMsg.translationSecondKey }}</span
            >
          </v-col>
          <v-col cols="2">
            <v-btn class="float-end" @click="deleteMessage">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-snackbar>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import Vue, { computed, onMounted, Ref, ref, watch } from "vue";
import EventBus from "@/eventHandlers/EventBus";
import SETTINGS from "@/global-settings";
import i18n from "../i18n";

export interface MessageType {
  key: string;
  keyOptions?: any;
  secondaryMsg: string;
  secondaryMsgKeyOptions: string;
  type: string;
  translatedKey: string | null;
  translationSecondKey: string | undefined;

  msgColor: string | null;
  index: number | null;
  timestamp: number | null;
}
const props = defineProps<{
  minified: boolean;
}>();
const showMe = ref(false);
const currentMsg: Ref<MessageType | null> = ref(null);
const msgDisplayQueue: MessageType[] = []; // Queue of messages that are displayed when notifications panel is minified
const messages: Ref<MessageType[]> = ref([]); // Actual messages that will be displayed in the notifications panel
let messageTimer: any | null = null;
const timeoutValue = ref(2000);
let activePanel: number | undefined = 0; // Default selection is the Label panel
const messageTypes = ref(["all", ...SETTINGS.messageTypes]);
const selectedMessageType = ref(messageTypes.value[0]);

// //eslint-disable-next-line // Declare messageTimer as any or disable the linter
// private messageTimer: NodeJS.Timer | null = null;
// private toolUseMessageDelay = SETTINGS.toolUse.delay;

onMounted((): void => {
  EventBus.listen("show-alert", addMessage);
});

watch(
  () => props.minified,
  (): void => {
    activePanel = undefined;
    // If the user has been styling objects and then, without selecting new objects, or deactivating selection the style state should be saved.
  }
);

const filteredMessage = computed(() =>
  messages.value.filter((m: MessageType) => {
    if (selectedMessageType.value == messageTypes.value[0]) {
      return m;
    } else return m.type == selectedMessageType.value;
  })
);
function getMsgColor(m: MessageType) {
  // If the message type is directive, the color should be "null." Otherwise make the color the message type.
  switch (m.type) {
    case "directive":
      timeoutValue.value = SETTINGS.toolUse.delay;
      return null;
    default:
      return m.type;
  }
}

function addMessage(m: MessageType): void {
  m.translatedKey = i18n.t(m.key, m.keyOptions).toString(); // Place translation in the messages
  m.translationSecondKey = i18n
    .t(m.secondaryMsg, m.secondaryMsgKeyOptions) // Translate the secondary message (this is the informational message)
    .toString();
  const msgColor = getMsgColor(m);
  m.msgColor = msgColor;
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

function deleteMessage() {
  showMe.value = false;
  const index = messages.value.findIndex(
    m => m.timestamp === currentMsg.value?.timestamp
  ); //Delete the message at the corresponding timestamp.
  if (index >= 0) messages.value.splice(index, 1);
}

function filterMessage() {
  if (selectedMessageType.value == messageTypes.value[0]) {
    // If the user has the default filter option selected which should be the first one (all messages)
    messages.value = []; //Delete all messages
  } else {
    messages.value = messages.value.filter((m: MessageType) => {
      return m.type != selectedMessageType.value; //Set messages to everything but the deleted type
    });
  }
}
</script>

<style scoped></style>
