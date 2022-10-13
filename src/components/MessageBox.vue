<template>
  <div>
    <v-snackbar v-model="showMe"
      top
      right
      :color="msgColor"
      :timeout="timeoutValue"
      :value="true"
      :multi-line="messageType == 'directive'">
       <span v-if="messageText"><strong>{{messageText}}</strong></span>
       <span v-if="secondaryMessageText">: {{secondaryMessageText}}</span>
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import EventBus from "@/eventHandlers/EventBus";
import SETTINGS from "@/global-settings";
import i18n from "../i18n";

// import { TranslateResult } from "vue-i18n";

interface MessageType {
  key: string;
  keyOptions?: any;
  secondaryMsg: string | null;
  secondaryMsgKeyOptions: string | null;
  type: "success" | "info" | "error" | "warning" | "directive";
}
@Component({})
export default class MessageBox extends Vue {
  private showMe = false;
  private messages: MessageType[] = [];
  private messageText: string | null = null;
  private secondaryMessageText: string | null = null;
  private messageType: string | null = null;
  private messageTimer: any | null = null;
  private dismissable = true;
  private msgColor: string | null = null;
  private timeoutValue: number | null; // TODO: compute timeout value
  // //eslint-disable-next-line // Declare messageTimer as any or disable the linter
  // private messageTimer: NodeJS.Timer | null = null;
  private displayToolUseMessages = SETTINGS.toolUse.display; // Is this needed?

  mounted(): void {
    EventBus.listen("show-alert", this.addMessage);
    this.timeoutValue = 1000;
   

  }
  
  getMsgColor():void {
    console.log(this.messageType);
    switch(this.messageType) {
        case "directive":
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
          console.log(this.msgColor);
          break;
        default:
          this.msgColor = this.messageType;
          break;
    }

    console.log(this.msgColor);

  }
  addMessage(m: MessageType): void {
    if (this.messageTimer) {
      // We have an active message on display
      // console.debug("Queue incoming messages", m);
      this.messages.push(m);
    } else {
      const translation = i18n.t(m.key, m.keyOptions).toString();
      const secondTranslation = i18n.t(m.secondaryMsg, m.secondaryMsgKeyOptions).toString()
      this.messageText = translation;
      this.secondaryMessageText = secondTranslation;
      this.messageType = m.type;
      this.showMe = true;
      this.messageTimer = setInterval(this.swapMessages, 2000);
      this.getMsgColor();
    }

  }

  async swapMessages(): Promise<void> {
    this.showMe = false;
    await Vue.nextTick();
    if (this.messages.length > 0) {
      const next = this.messages.shift() as MessageType;
      const translation = i18n.t(next.key, next.keyOptions).toString();
      this.messageText = translation;
      this.messageType = next.type;
      this.showMe = true;
    } else {
      // console.debug("Message queue is empty");
      if (this.messageTimer) clearInterval(this.messageTimer);
      this.messageTimer = null;
      this.messageText = null;
      this.messageType = null;
    }
  }
}
</script>

<style scoped>
</style>