<template>
  <div id="msghub">
    <v-container class="pa-0">
      <!--Teleport to="#app-messages"-->
      <v-row justify="center" align="center" class="ma-0">
        <!-- <v-col cols="auto">Message filter {{ selectedMessageType }}</v-col> -->
        <v-col cols="auto">
          <v-icon id="filter-menu-popup">mdi-filter</v-icon>
          <v-menu
            activator="#filter-menu-popup"
            :close-on-content-click="false"
            location="top"
            offset="32">
            <v-sheet class="bg-yellow pa-2">
              Select message type to show
              <v-select
                dense
                v-model="selectedMessageType"
                label="Message filter"
                :items="messageTypes"
                item-value="value"></v-select>
              <v-btn>OK</v-btn>
            </v-sheet>
          </v-menu>
        </v-col>
        <v-col cols="auto">
          <v-icon>mdi-bell</v-icon>
        </v-col>
        <v-col id="msg-display-area" class="pa-0">
          <v-alert
            v-if="currentMsg"
            class="my-1 py-0"
            border="start"
            variant="outlined"
            :border-color="alertType(currentMsg)"
            density="compact"
            closable
            :icon="currentMsg.type"
            :text="pretty(currentMsg)"
            v-on:update:model-value="deleteMessageByIndex(0)"></v-alert>
          <v-alert v-else text="No messages"></v-alert>
        </v-col>
        <v-col cols="auto">
          <v-menu
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
                  v-for="(msg, index) in messages"
                  :key="`${msg.key}-${index}`"
                  density="compact"
                  closable
                  :icon="msg.type"
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
            :disabled="messages.length == 0"
            size="small">
            <v-icon v-if="expanded">mdi-triangle-down</v-icon>
            <v-badge v-else-if="messages.length > 1" :content="messages.length">
              <v-icon>mdi-triangle</v-icon>
            </v-badge>
            <v-icon v-else>mdi-triangle</v-icon>
          </v-btn>
        </v-col>
      </v-row>
      <!--v-row justify="end">
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
      </!--v-row-->
      <!--/Teleport-->
      <!--v-layout-- column>
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
      </!--v-layout-->
    </v-container>
  </div>
</template>

<script setup lang="ts">
import EventBus from "@/eventHandlers/EventBus";
import Vue, { ref, Ref, computed, onMounted } from "vue";
import SETTINGS from "@/global-settings";
// import EventBus from "@/eventHandlers/EventBus";
import { useI18n } from "vue-i18n";
import { nextTick } from "vue";

type MessageType = {
  key: string;
  keyOptions?: any;
  secondaryMsg: string;
  secondaryMsgKeyOptions: string;
  type: string;
  // translatedKey?: string;
  // translationSecondKey?: string;

  // msgColor: string | null;
  // index: number;
  timestamp: number;
};
type AlertType = "success" | "info" | "error" | "warning";
// const props = defineProps<{ minified: boolean }>();

const { t } = useI18n();
const expanded = ref(false);
// const showMe = ref(false);
const messageTypes = [
  "all",
  ...SETTINGS.messageTypes.map(s => t(`notifications.${s}`))
];
// const currentMsg: Ref<MessageType | null> = ref(null);
// const msgDisplayQueue: MessageType[] = []; // Queue of messages that are displayed when notifications panel is minified
const messages: Ref<MessageType[]> = ref([]);
const selectedMessageType = ref(messageTypes[0]);
// let messageTimer: any | null = null;

onMounted((): void => {
  EventBus.listen("show-alert", addMessage);
  // EventBus.listen("show-alert", (arg:any  ) => {
  //   alert(arg)
  // })
});

const currentMsg = computed((): MessageType | null =>
  messages.value.length > 0 ? messages.value[0] : null
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
// const filteredMessages = computed((): Array<MessageType> => {
//   if (expanded.value) return messages.value;
//   else if (messages.value.length > 0) return messages.value.slice(0, 1);
//   else return [];
// });

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
  // await nextTick() // Remove individual message from notifications list
}

function deleteAllMessages() {
  messages.value.splice(0);
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
  width: 60%;
  margin: auto;
  padding: 0;
  border: 1px solid gray;
}
</style>
