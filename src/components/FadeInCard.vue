<template>
  <transition name="fade">
    <v-card v-show="showWhen"
      color="color"
      elevation="8"
      class="content">
      <slot></slot>
    </v-card>
  </transition>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";

@Component({})
export default class FadeInCard extends Vue {
  @Prop({ default: true })
  readonly showWhen!: boolean;
  readonly color!: string;
}
</script>

<style scoped>
.content {
  border: 1px solid black;
  border-radius: 4px;
  padding: 0.25em;
  margin-top: 0.5em;
}
.fade-enter-active,
.fade-leave-active {
  transition-property: opacity, height, width;
  transition-duration: 500ms;
  transition-timing-function: ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
  height: 100%;
  width: 100%;
}
</style>