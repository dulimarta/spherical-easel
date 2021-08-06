<template>
  <v-overlay absolute
    :opacity="0.8"
    :z-index="zIndex">
    <v-card class="mx-auto"
      max-width="344"
      outlined
      z-index="100">
      <v-list-item three-line
        class="pb-0">
        <v-list-item-content class="pb-1">
          <v-list-item-title v-if="i18nTitleLine!== undefined"
            class="mb-1 text-h6">
            {{$t(i18nTitleLine)}}
          </v-list-item-title>
          <v-list-item-subtitle v-if="i18nSubtitleLine!==undefined"
            class="mb-1 text-subtitle-1 justify-center">
            {{$t(i18nSubtitleLine)}}
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
      <v-card-text class="pt-0 text-subtitle-2">
        <slot />
        {{$t(i18nListTitle)}}
        <ul>
          <li v-for="(z,pos) in i18nListItems"
            :key="pos">
            {{$t(z)}}
          </li>
        </ul>
      </v-card-text>

      <v-card-actions class="justify-center">
        <template>
          <v-tooltip bottom
            :open-delay="toolTipOpenDelay"
            :close-delay="toolTipCloseDelay"
            max-width="400px">
            <template v-slot:activator="{ on }">
              <v-btn v-on="on"
                color="info"
                @click="$listeners.click">
                {{$t(i18nButtonLabel)}}
              </v-btn>
            </template>
            <span v-t="i18nButtonToolTip">
            </span>
          </v-tooltip>
        </template>
      </v-card-actions>
    </v-card>
  </v-overlay>
</template>


<script lang="ts">
import Vue from "vue";
import SETTINGS from "@/global-settings";
import { Prop, Component } from "vue-property-decorator";

@Component({})
export default class OverlayWithFixButton extends Vue {
  readonly toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  readonly toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

  @Prop() readonly i18nButtonToolTip!: string;
  @Prop() readonly i18nButtonLabel!: string;
  @Prop() readonly i18nTitleLine?: string;
  @Prop() readonly i18nSubtitleLine?: string;
  @Prop() readonly i18nListTitle?: string;
  @Prop() readonly i18nListItems?: Array<string>;
  @Prop() readonly zIndex!: number;
  @Prop() readonly disabled?: boolean;
  @Prop() readonly color?: string;
  @Prop() readonly longLabel?: boolean;

  private fabOpen = false;

  get labelStyle(): any {
    return this.longLabel
      ? {
          maxWidth: "250px",
          wordWrap: "break-word",
          display: "inline-block",
          height: "1em",
          whiteSpace: "pre-line"
        }
      : {};
  }
  //   mounted(): void {
  //     for (const z in this.$listeners) {
  //       console.debug("Listener ", z);
  //     }
  //   }
}
</script>

<style>
</style>