<template>
  <transition>
    <!-- If the notifications panel is open, then display the messages from the messages array, not the queue.-->
    <div v-if="!minified"
      key="full"
      style="height: 100%; overflow:auto"
      @mouseenter="() => {}"
      @mouseleave="() => {}">

      <v-divider></v-divider>
      <v-container id="scroll-target"
        style="max-height: 400px"
        class="scroll-y">
        <v-row>
          <v-select dense
            v-model="selectedMessageType"
            :items="messageTypes"
            >
            <template v-slot:selection="{ item }">
      {{ $t(`notifications.${item}`)}}
    </template>
    <template v-slot:item="{ item }">
      {{ $t(`notifications.${item}`) }}
    </template>

          </v-select>
        </v-row>
        <v-row cols="12"
          justify="end">
          <v-col md="12">
            <v-btn color="error" @click="() => {
              if (selectedMessageType == messageTypes[0]) // If the user has the default filter option selected which should be the first one (all messages)
              {
                messages = []; //Delete all messages
              } else {
                messages = messages.filter((m) => {
                return m.type != selectedMessageType  //Set messages to everything but the deleted type
                })}}"
              small>{{$t(`notifications.deleteMsg`, {msgType: $t(`notifications.${selectedMessageType}`).toString()})}}</v-btn>
          </v-col>
        </v-row>
        <v-layout
          column
          style="height: 50vh">
         <v-card dark class="my-1" v-for="(notif, index) in messages.filter((m) => { if (selectedMessageType == messageTypes[0]) { return m } else return m.type == selectedMessageType})"
            :key="index"
            :color="`${notif.msgColor}`">
            <v-row class="pa-2">
              <v-col >
              <span :class="[
              notif.type == 'directive'
                ? 'font-weight-bold'
                : 'font-weight-regular'
            ]"
              v-if="notif.translatedKey">
              {{ notif.translatedKey }}</span>
            <span v-if="notif.translationSecondKey">:
              {{ notif.translationSecondKey }}</span>
              </v-col>
               <v-col cols="2">
            <v-btn class="float-end"
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
      <v-btn v-on:click="$emit('toggle-notifications-panel')"
        key="partial"
        plain
        depressed
        class="pa-0 mx-0">
        <v-icon>$vuetify.icons.value.notifications
        </v-icon>
      </v-btn>
      <v-snackbar v-if="currentMsg"
        v-model="showMe"
        top
        right
        :color="`${currentMsg.msgColor}`"
        :timeout="timeoutValue"
        class="mt-10 mr-15">
        <v-row justify="center">
          <v-col cols="10">
            <span :class="[
              currentMsg.type == 'directive'
                ? 'font-weight-bold'
                : 'font-weight-regular'
            ]"
              v-if="currentMsg.translatedKey">
              {{ currentMsg.translatedKey }}</span>
            <span v-if="currentMsg.translationSecondKey">:
              {{ currentMsg.translationSecondKey }}</span>
          </v-col>
          <v-col cols="2">
            <v-btn class="float-end"
              @click="
              () => {
                showMe = false;
                const index = messages.findIndex((m) => m.timestamp == currentMsg.timestamp) //Delete the message at the corresponding timestamp.
                messages.splice(index, 1);
              }
            "
              icon>
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-snackbar>
    </div>
  </transition>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import EventBus from "@/eventHandlers/EventBus";
import SETTINGS from "@/global-settings";
import i18n from "../i18n";
import { Prop, Watch } from "vue-property-decorator";

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
@Component({})
export default class MessageBox extends Vue {
  @Prop() readonly minified!: boolean;
  private showMe = false;
  private currentMsg: MessageType | null = null;
  private msgDisplayQueue: MessageType[] = []; // Queue of messages that are displayed when notifications panel is minified
  private messages: MessageType[] = []; // Actual messages that will be displayed in the notifications panel
  private messageTimer: any | null = null;
  private timeoutValue: number | null = 2000;
  private activePanel: number | undefined = 0; // Default selection is the Label panel
  private messageTypes = ["all", ...SETTINGS.messageTypes];
  private selectedMessageType = this.messageTypes[0];

  // //eslint-disable-next-line // Declare messageTimer as any or disable the linter
  // private messageTimer: NodeJS.Timer | null = null;
  private toolUseMessageDelay = SETTINGS.toolUse.delay;

  mounted(): void {
    EventBus.listen("show-alert", this.addMessage);
  }

  @Watch("minified")
  closeAllPanels(): void {
    this.activePanel = undefined;
    // If the user has been styling objects and then, without selecting new objects, or deactivating selection the style state should be saved.
  }

  getMsgColor(m: MessageType) { // If the message type is directive, the color should be "null." Otherwise make the color the message type.
    switch (m.type) {
      case "directive":
        this.timeoutValue = this.toolUseMessageDelay;
        return null;
      default:
        return m.type;
    }
  }

  addMessage(m: MessageType): void {
    m.translatedKey = i18n.t(m.key, m.keyOptions).toString(); // Place translation in the messages
    m.translationSecondKey = i18n
      .t(m.secondaryMsg, m.secondaryMsgKeyOptions) // Translate the secondary message (this is the informational message)
      .toString();
    const msgColor = this.getMsgColor(m);
    m.msgColor = msgColor;
    m.timestamp = Date.now(); // Get the timestamp that the message occurred at so it can be deleted if needed.

    this.messages.unshift(m); // Add the new message to the beginning of the array
    if (this.messageTimer) {

      this.msgDisplayQueue.push(m); // We have an active message on display, push it to the queue
    } else { // Display the current message
      this.currentMsg = m;
      this.showMe = true;
      this.messageTimer = setInterval(this.swapMessages, 2000);
    }
  }

  async swapMessages(): Promise<void> {
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
}
</script>

<style scoped>
</style>
