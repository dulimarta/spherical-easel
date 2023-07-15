<template>
  <v-dialog v-bind="$attrs" v-model="visible" transition="dialog-transition">
    <v-card elevation="2">
      <v-card-title id="_test_title">{{ title }}</v-card-title>
      <v-divider />
      <v-card-text>
        <slot />
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn
          id="_test_posButton"
          :disabled="isDisabled"
          color="primary"
          @click="doYes()">{{ yesLabel }}</v-btn
        >
        <v-btn
          id="_test_negButton"
          v-if="noText"
          color="secondary"
          @click="doNo()"
          >{{ noText }}</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { useDialogSequencer } from "@/composables/DialogSequencer";

export interface DialogAction {
  hide: () => void;
  show: () => void;
}

type DialogFunc = () => void;

const sequencer = useDialogSequencer()
const props = defineProps<{
  title: string;
  yesText?: string;
  yesAction?: DialogFunc;
  noText?: string;
  noAction?: DialogFunc;
  isDisabled?: boolean;
}>();

defineExpose({ show, hide }) // Make these two functions "public"

const visible = ref(false);

const yesLabel = computed((): string => {
  return props.yesText ?? "Yes";
});
const noLabel = computed((): string => {
  return props.noText ?? "No";
});

function show(): void {
  visible.value = true;
  // console.debug(`Dialog ${this.title} is active`);
  // EventBus.fire("dialog-box-is-active", { active: true });
}
function hide(): void {
  visible.value = false;
  // EventBus.fire("dialog-box-is-active", { active: false });
}

function hideLast(): void {
  console.debug("Calling hideLast()")
  if (!sequencer.hideLastDialog())
    hide()
}
function doYes() {
  hideLast()
  if (props.yesAction) props.yesAction()
}

function doNo() {
  hideLast()
  if (props.noAction) props.noAction()
}
</script>
