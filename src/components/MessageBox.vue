<template>
  <div>
    <v-snackbar v-model="showMe" bottom left color="warning">
      {{messageText}}
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component';
import EventBus from "@/eventHandlers/EventBus"
@Component({})
export default class MessageBox extends Vue {
  private showMe = false
  private messages: any[] = []
  private messageText: string | null = null
  private messageTimer: NodeJS.Timeout | null = null

  mounted(): void {
    EventBus.listen("show-alert", this.addMessage)
  }

  addMessage(m: any): void {
    if (this.messageTimer) { // We have an active message on display
      console.debug("Queue incoming messages", m);
      this.messages.push(m);
    }
    else {
      this.messageText = m.text;
      this.showMe = true;
      this.messageTimer = setInterval(this.swapMessages, 2000);
    }
  }

  async swapMessages(): Promise<void> {
    this.showMe = false;
    await Vue.nextTick()
    if (this.messages.length > 0) {
      const next = this.messages.shift();
      this.messageText = (next as any).text;
      this.showMe = true;
    } else {
      console.debug("Message queue is empty");
      if (this.messageTimer)
        clearInterval(this.messageTimer);
      this.messageTimer = null;
      this.messageText = null;
    }
  }
}
</script>

<style scoped>
</style>