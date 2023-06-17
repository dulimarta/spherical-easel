<template>
  <v-overlay absolute :opacity="0.8" :z-index="zIndex">
    <v-card class="mx-auto" max-width="344" variant="outlined" z-index="100">
      <v-list-item lines="three" class="pb-0">
        <v-list-item-content class="pb-1">
          <v-list-item-title
            v-if="i18nTitleLine !== undefined"
            class="mb-1 text-h6">
            {{ $t(i18nTitleLine) }}
          </v-list-item-title>
          <v-list-item-subtitle
            v-if="i18nSubtitleLine !== undefined"
            class="mb-1 text-subtitle-1 justify-center">
            {{ $t(i18nSubtitleLine) }}
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
      <v-card-text class="pt-0 text-subtitle-2">
        <slot />
        {{ $t("i18nListTitle") }}
        <ul>
          <li v-for="(z, pos) in i18nListItems" :key="pos">
            {{ $t(z) }}
          </li>
        </ul>
      </v-card-text>

      <v-card-actions class="justify-center">
        <template>
          <v-tooltip
            location="bottom"
            max-width="400px">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" color="info" @click="$attrs.click">
                {{ $t(i18nButtonLabel) }}
              </v-btn>
            </template>
            <span v-t="i18nButtonToolTip"></span>
          </v-tooltip>
        </template>
      </v-card-actions>
    </v-card>
  </v-overlay>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import SETTINGS from "@/global-settings";
// import { Prop, Component } from "vue-property-decorator";

// @Component({})
// export default class OverlayWithFixButton extends Vue {

type ComponentProps = {
  i18nButtonToolTip: string;
  i18nButtonLabel: string;
  i18nTitleLine?: string;
  i18nSubtitleLine?: string;
  i18nListTitle?: string;
  i18nListItems?: Array<string>;
  zIndex: number;
  disabled?: boolean;
  color?: string;
  longLabel?: boolean;
};
const props = defineProps<ComponentProps>();
const fabOpen = ref(false);

const labelStyle = computed((): any => {
  return props.longLabel
    ? {
        maxWidth: "250px",
        wordWrap: "break-word",
        display: "inline-block",
        height: "1em",
        whiteSpace: "pre-line"
      }
    : {};
});
//   mounted(): void {
//     for (const z in this.$listeners) {
//       console.debug("Listener ", z);
//     }
//   }
// }
</script>

<style></style>
