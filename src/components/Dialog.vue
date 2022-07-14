<template>
  <v-dialog v-model="visible"
    transition="dialog-transition"
    v-bind="$attrs">
    <v-card elevation="2">
      <v-card-title id="_test_title">{{title}}</v-card-title>
      <v-divider />
      <v-card-text>
        <slot />
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn id="_test_posButton"
          :disabled="disableButton"
          v-if="yesAction"
          color="primary"
          @click="yesAction()">{{yesLabel}}</v-btn>
        <v-btn id="_test_posButton"
          v-else
          color="primary"
          @click="hide()">{{yesLabel}}</v-btn>
        <v-btn id="_test_negButton"
          v-if="noAction && noText"
          color="secondary"
          @click="noAction()">{{noText}}</v-btn>
        <v-btn id="_test_negButton"
          v-else-if="noText"
          color="secondary"
          @click="hide()">{{noText}}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import EventBus from "@/eventHandlers/EventBus";
import { Component, Prop, Vue } from "vue-property-decorator";
export interface DialogAction {
  hide: () => void;
  show: () => void;
}

type DialogFunc = () => void;

@Component
export default class Dialog extends Vue implements DialogAction {
  @Prop() title!: string;
  @Prop() yesText!: string | undefined;
  @Prop() yesAction!: DialogFunc;
  @Prop() noText!: string | undefined;
  @Prop() noAction!: DialogFunc;
  @Prop() isDisabled!: boolean;

  visible = false;

  get yesLabel(): string {
    return this.yesText ?? "Yes";
  }
  get noLabel(): string {
    return this.noText ?? "No";
  }
  get disableButton(): boolean {
    return this.isDisabled;
  }

  show(): void {
    this.visible = true;
    // console.debug(`Dialog ${this.title} is active`);
    EventBus.fire("dialog-box-is-active", { active: true });
  }
  hide(): void {
    this.visible = false;
    EventBus.fire("dialog-box-is-active", { active: false });
  }
}
</script>

<style scoped>
</style>