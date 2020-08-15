<template>
  <div>
    <v-snackbar v-model="showMe"
      bottom
      left
      :color="messageType">
      {{messageText}}
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import EventBus from "@/eventHandlers/EventBus";
import i18n from "../i18n";
import { TranslateResult } from "vue-i18n";

@Component({})
export default class MessageBox extends Vue {
  private showMe = false;
  private messages: any[] = [];
  private messageText: string | null = null;
  private messageType: string | null = null;
  private messageTimer: NodeJS.Timeout | null = null;

  mounted(): void {
    EventBus.listen("show-alert", this.addMessage);
  }

  addMessage(m: any): void {
    console.log(m.keyOptions, i18n.t(m.key, m.keyOptions));
    const translation = i18n.t(m.key, m.keyOptions).toString();
    if (this.messageTimer) {
      // We have an active message on display
      console.debug("Queue incoming messages", m);
      this.messages.push(m);
    } else {
      this.messageText = translation;
      this.messageType = m.type;
      this.showMe = true;
      this.messageTimer = setInterval(this.swapMessages, 2000);
    }
  }

  async swapMessages(): Promise<void> {
    this.showMe = false;
    await Vue.nextTick();
    if (this.messages.length > 0) {
      const next = this.messages.shift();
      const translation = i18n
        .t((next as any).key, (next as any).keyOptions)
        .toString();
      this.messageText = translation;
      this.messageType = (next as any).type;
      this.showMe = true;
    } else {
      console.debug("Message queue is empty");
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