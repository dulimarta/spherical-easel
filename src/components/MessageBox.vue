<template>
  <transition>
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
            item-text="Hi">
          </v-select>
          <template slot="item"
            slot-scope="data">
            <v-list-tile-content>
              <v-list-tile-title @click="getItemText(data.item.name)"
                v-html="data.item.name"></v-list-tile-title>
            </v-list-tile-content>
            
          </template>
        </v-row>
        <v-row cols="12"
          justify="end">
          <v-col md="12">
            <v-btn color="error" @click="() => {if (selectedMessageType == 'All') {messages = [];} else {
              messages = messages.filter((m) => {return m.type != selectedMessageType}) }}"
              small>Delete {{selectedMessageType}} messages</v-btn>
          </v-col>
        </v-row>

      </v-container>
    </div>
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
                dismissed = true;
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
//  :multi-line="messageType == 'directive'"
// import { TranslateResult } from "vue-i18n";

export interface MessageType {
  key: string;
  keyOptions?: any;
  secondaryMsg: string;
  secondaryMsgKeyOptions: string;
  type: "success" | "info" | "error" | "warning" | "directive";

  translatedKey: string | null;
  translationSecondKey: string | undefined;
  msgColor: string | null;
  dismissed: false;
  timestamp: number;
}
@Component({})
export default class MessageBox extends Vue {
  @Prop() readonly minified!: boolean;
  private showMe = false;
  private currentMsg: MessageType | null = null;
  private msgDisplayQueue: MessageType[] = [];
  private messages: MessageType[] = [];
  private messageTimer: any | null = null;
  private timeoutValue: number | null = 2000;
  private activePanel: number | undefined = 0; // Default selection is the Label panel
  private messageTypes = ["All", ...SETTINGS.messageTypes];
  private selectedMessageType: any = this.messageTypes[0];

  // //eslint-disable-next-line // Declare messageTimer as any or disable the linter
  // private messageTimer: NodeJS.Timer | null = null;
  private displayToolUseMessages = SETTINGS.toolUse.display; // Is this needed?
  private toolUseMessageDelay = SETTINGS.toolUse.delay;

  mounted(): void {
    EventBus.listen("show-alert", this.addMessage);
  }

  @Watch("minified")
  closeAllPanels(): void {
    this.activePanel = undefined;
    // If the user has been styling objects and then, without selecting new objects, or deactivating selection the style state should be saved.
  }

  getMsgColor(m: MessageType) {
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
      .t(m.secondaryMsg, m.secondaryMsgKeyOptions)
      .toString();
    const msgColor = this.getMsgColor(m);
    m.msgColor = msgColor;

    this.messages.unshift(m);
    if (this.messageTimer) {
      // We have an active message on display
      // console.debug("Queue incoming msgDisplayQueue", m);
      this.msgDisplayQueue.push(m);
    } else {
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
