<template>
  <div>
    <v-snackbar
      v-model="showMe"
      top
      right
      :color="msgColor"
      :timeout="timeoutValue"
      :value="true"
      class="mt-10"
    >
      <v-row justify="center">
        <v-col cols="10">
          <span
            :class="[
              messageType == 'directive'
                ? 'font-weight-bold'
                : 'font-weight-regular'
            ]"
            v-if="messageText"
          >
            {{ messageText }}</span
          >
          <span v-if="secondaryMessageText">: {{ secondaryMessageText }}</span>
        </v-col>
        <v-col cols="2">
          <v-btn
            class="float-end"
            @click="
              () => {
                showMe = false;
                dismissed = true;
              }
            "
            icon
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-snackbar>
  </div>
</template>
//
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import EventBus from "@/eventHandlers/EventBus";
import SETTINGS from "@/global-settings";
import i18n from "../i18n";
//  :multi-line="messageType == 'directive'"
// import { TranslateResult } from "vue-i18n";

interface MessageType {
  key: string;
  keyOptions?: any;
  secondaryMsg: string | null;
  secondaryMsgKeyOptions: string | null;
  type: "success" | "info" | "error" | "warning" | "directive";
  dismissed: false;
}
@Component({})
export default class MessageBox extends Vue {
  private showMe = false;
  private messages: MessageType[] = [];
  private messageText: string | null = null;
  private secondaryMessageText: string | null = null;
  private messageType: string | null = null;
  private messageTimer: any | null = null;
  private dismissed: boolean | null = false;
  private msgColor: string | null = null;
  private timeoutValue: number | null;

  // //eslint-disable-next-line // Declare messageTimer as any or disable the linter
  // private messageTimer: NodeJS.Timer | null = null;
  private displayToolUseMessages = SETTINGS.toolUse.display; // Is this needed?
  private toolUseMessageDelay = SETTINGS.toolUse.delay;

  mounted(): void {
    EventBus.listen("show-alert", this.addMessage);
  }

  getMsgColor(): void {
    console.log(this.messageType);
    switch (this.messageType) {
      case "directive":
        this.timeoutValue = this.toolUseMessageDelay;
        this.msgColor = "null";
        break;
      case "info":
        this.msgColor = this.messageType;
        break;
      case "warning":
        this.msgColor = this.messageType;
        break;
      case "error":
        this.msgColor = this.messageType;
        break;
      default:
        this.msgColor = this.messageType;
        break;
    }
  }
  addMessage(m: MessageType): void {
    if (this.messageTimer) {
      // We have an active message on display
      // console.debug("Queue incoming messages", m);
      this.messages.push(m);
    } else {
      const translation = i18n.t(m.key, m.keyOptions).toString();
      const secondTranslation = i18n
        .t(m.secondaryMsg, m.secondaryMsgKeyOptions)
        .toString();
      this.messageText = translation;
      this.secondaryMessageText = secondTranslation;
      this.messageType = m.type;
      this.dismissed = m.dismissed;
      this.showMe = true;
      this.messageTimer = setInterval(this.swapMessages, 2000);
      this.getMsgColor();
    }

    console.log(this.messages);
  }

  async swapMessages(): Promise<void> {
    this.showMe = false;
    await Vue.nextTick();
    if (this.messages.length > 0) {
      const first: MessageType = this.messages[0];
    
        const next = this.messages.shift() as MessageType;
        const translation = i18n.t(next.key, next.keyOptions).toString();
        this.messageText = translation;
        this.messageType = next.type;
        this.secondaryMessageText = next.secondaryMsg;
        this.dismissed = next.dismissed;
        this.dismissed = next.dismissed;
        this.getMsgColor();
        this.showMe = true;
    
    } else {
      // console.debug("Message queue is empty");
      if (this.messageTimer) clearInterval(this.messageTimer);
      this.messageTimer = null;
      this.messageText = null;
      this.secondaryMessageText = null;
      this.msgColor = null;
      this.messageType = null;
    }
  }
}
</script>

<style scoped></style>
