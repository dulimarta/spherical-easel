<template>
  <div id="msghub">
    <div v-if="minified">
      <v-snackbar v-if="currentMsg"
        v-model="showMe"
        top
        right
        :color="currentMsg.msgColor"
        :timeout="2000"
        class="mt-10">
        {{currentMsg.translatedKey}}

        <span v-if="currentMsg.translationSecondKey">:
          {{currentMsg.translationSecondKey}}</span>

      </v-snackbar>
    </div>
    <v-container id="scroll-target"
      v-else-if="messages.length > 0">
      <v-row align="baseline">
        <v-col cols="auto">
          Message filter
        </v-col>
        <v-col>
          <v-select dense
            v-model="selectedMessageType"
            :items="messageTypes">
            <template #item="{ item }">
              {{$t(`notifications.${item}`)}}
            </template>
          </v-select>
        </v-col>
      </v-row>
      <v-row justify="end">
        <v-col md="12">
          <v-btn small
            color="error">
            {{$t('notifications.deleteMsg', {
              msgType: $t(`notifications.${selectedMessageType}`).toString()
              })}}
          ({{filteredMessages.length}})
          </v-btn>
        </v-col>
      </v-row>
      <v-layout column>
        <v-card dismissible
          dense
          class="my-1"
          v-for="(notif,index) in filteredMessages"
          :key="index"
          :color="notif.msgColor">
          <v-container>
            <v-row>
              <v-col cols="10">
                {{notif.translatedKey}}
                <span v-if="notif.translationSecondKey">:
                  {{notif.translationSecondKey}}</span>
              </v-col>
              <v-col cols="1">
                <v-btn icon
                  @click="deleteMessageByIndex(index)">
                  <v-icon>mdi-close
                  </v-icon>
                </v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-card>
      </v-layout>
    </v-container>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import SETTINGS from "@/global-settings";
import Component from "vue-class-component";
import EventBus from "@/eventHandlers/EventBus";
import i18n from "@/i18n";
import { Prop } from "vue-property-decorator";

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

@Component
export default class MessageHub extends Vue {
  @Prop() readonly minified!: boolean;
  showMe = false;
  messageTypes = ["all", ...SETTINGS.messageTypes];
  currentMsg: MessageType | null = null;
  msgDisplayQueue: MessageType[] = []; // Queue of messages that are displayed when notifications panel is minified
  messages: MessageType[] = [];
  selectedMessageType = this.messageTypes[0];
  messageTimer: any | null = null;


  mounted(): void {
    EventBus.listen("show-alert", this.addMessage);
  }
  get filteredMessages() {
    console.debug("Selected message", this.selectedMessageType)
    return this.messages.filter(m => {
      return (
        this.selectedMessageType === this.messageTypes[0] ||
        this.selectedMessageType === m.type
      );
    });
  }

  addMessage(m: MessageType): void {
    if (m.key.match(/undefined/)) return;
    m.translatedKey = i18n.t(m.key, m.keyOptions).toString();
    m.translationSecondKey = i18n
      .t(m.secondaryMsg, m.secondaryMsgKeyOptions) // Translate the secondary message (this is the informational message)
      .toString();

    m.msgColor = m.type === "directive" ? null : m.type;
    m.timestamp = Date.now(); // Get the timestamp that the message occurred at so it can be deleted if needed.

    this.messages.unshift(m); // Add the new message to the beginning of the array
    if (this.messageTimer) {
      this.msgDisplayQueue.push(m); // We have an active message on display, push it to the queue
    } else {
      // Display the current message
      this.currentMsg = m;
      this.showMe = true;
      this.messageTimer = setInterval(this.swapMessages, 2000);
    }
  }

  async swapMessages(): Promise<void> {
    console.debug("Swap messages");
    this.showMe = false;
    await Vue.nextTick();
    if (this.msgDisplayQueue.length > 0) {
      const next = this.msgDisplayQueue.shift() as MessageType;
      this.currentMsg = next;

      this.showMe = true;
    } else {
      // console.debug("Message queue is empty");
      if (this.messageTimer) clearInterval(this.messageTimer);
      this.messageTimer = null;
    }
  }

  deleteMessageByIndex(pos: number) {
    this.messages.splice(pos, 1); // Remove individual message from notifications list
  }
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
