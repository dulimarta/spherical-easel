<template>
  <div>
    <h2>Object Tree</h2>
    <h3>Vertices</h3>
    <v-treeview dense hoverable activatable active-class="warning"
      :items="iVertices" @input="onInput" @update:active="updateActive"
      @update:open="updateOpen"></v-treeview>
    <h3>Lines</h3>
    <v-treeview dense hoverable activatable active-class="warning"
      :items="iLines"></v-treeview>

  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { State } from "vuex-class";
import { SEVertex, SELine } from "@/types";
// import { VertexInfo } from "@/store";

@Component
export default class ObjectTree extends Vue {
  @State
  private vertices!: SEVertex[]

  @State
  private lines!: SELine[];

  // TODO: the getter function seems to be sluggish?
  get iVertices() {
    return this.vertices.map(z => ({ id: z.ref.id, name: z.ref.name }));
  }

  get iLines() {
    return this.lines.map(z => ({ id: z.ref.id, name: "Just a line" }))
  }
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
