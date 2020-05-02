<template>
  <div>
    <h2>Object Tree</h2>
    <v-treeview
      dense
      hoverable
      activatable
      active-class="warning"
      :items="vertices"
      @input="onInput"
      @update:active="updateActive"
      @update:open="updateOpen"
    ></v-treeview>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { State } from "vuex-class";
import { VertexInfo } from "@/store";

@Component
export default class ObjectTree extends Vue {
  @State
  private vertices!: VertexInfo[];

  onInput() {
    console.debug("On input");
  }
  updateOpen() {
    console.debug("Update open");
  }
  updateActive(what: []) {
    console.debug("Active", what);
  }
}
</script>

<style lang="sass">
// background:
</style>
